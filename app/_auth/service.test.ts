import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import type { SqlDatabase, SqlValue } from "./model";
import { AuthService } from "./service";
import { AuthStore } from "./store";

class SqliteAdapter implements SqlDatabase {
  constructor(private readonly database: DatabaseSync) {}
  async get<T>(sql: string, params: SqlValue[] = []): Promise<T | null> {
    return (this.database.prepare(sql).get(...params) as T | undefined) ?? null;
  }
  async all<T>(sql: string, params: SqlValue[] = []): Promise<T[]> {
    return this.database.prepare(sql).all(...params) as T[];
  }
  async run(sql: string, params: SqlValue[] = []): Promise<void> {
    this.database.prepare(sql).run(...params);
  }
}

function setup() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../../drizzle/0000_auth.sql", import.meta.url), "utf8"));
  const store = new AuthStore(new SqliteAdapter(sqlite));
  let clock = 1_800_000_000_000;
  return { sqlite, store, service: new AuthService(store, () => clock), advance: (ms: number) => { clock += ms; } };
}

describe("AuthService with the SQLite migration", () => {
  it("normalizes usernames, returns current grants, and only stores token hashes", async () => {
    const { sqlite, service, store } = setup();
    const id = await service.createUser("Student_1", "12345678");
    await expect(service.createUser("student_1", "12345678")).rejects.toThrow();
    await store.grantCourse(id, "ode");
    const login = await service.login("STUDENT_1", "12345678", "client");
    expect(login.status).toBe("ok");
    if (login.status !== "ok") return;
    expect(login.user).toEqual({ id, username: "Student_1", courses: ["ode"] });
    const storedHash = (sqlite.prepare("SELECT token_hash FROM sessions").get() as { token_hash: string }).token_hash;
    expect(storedHash).not.toBe(login.token);
    expect(storedHash).toMatch(/^[a-f0-9]{64}$/);
    expect(await service.getUser(login.token)).toEqual(login.user);
    expect(await service.getUser(`${login.token.slice(0, -1)}${login.token.endsWith("A") ? "B" : "A"}`)).toBeNull();
    await store.revokeCourse(id, "ode");
    expect((await service.getUser(login.token))?.courses).toEqual([]);
    await service.logout(login.token);
    expect(await service.getUser(login.token)).toBeNull();
    sqlite.close();
  });

  it("enforces persistent username and client limits and resets windows", async () => {
    const { service, advance, sqlite } = setup();
    for (let attempt = 0; attempt < 8; attempt++) expect((await service.login("missing", "12345678", "ip")).status).toBe("invalid");
    expect((await service.login("missing", "12345678", "ip")).status).toBe("limited");
    advance(15 * 60 * 1000);
    expect((await service.login("missing", "12345678", "ip")).status).toBe("invalid");
    expect(sqlite.prepare("SELECT count(*) AS n FROM login_rate_limits").get()).toMatchObject({ n: 2 });
    sqlite.close();
  });

  it("rejects disabled users and reset-password revokes sessions", async () => {
    const { service, store, sqlite } = setup();
    const id = await service.createUser("learner", "12345678");
    const login = await service.login("learner", "12345678", "ip");
    expect(login.status).toBe("ok");
    if (login.status !== "ok") return;
    await service.resetPassword(id, "abcdefgh");
    expect(await service.getUser(login.token)).toBeNull();
    await store.setDisabled(id, true);
    expect((await service.login("learner", "abcdefgh", "other-ip")).status).toBe("invalid");
    sqlite.close();
  });

  it("expires sessions and atomically enforces independent rate-limit buckets", async () => {
    const { service, store, advance, sqlite } = setup();
    await service.createUser("expiring", "12345678");
    const result = await service.login("expiring", "12345678", "client");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    advance(7 * 24 * 60 * 60 * 1000);
    expect(await service.getUser(result.token)).toBeNull();

    const now = 1_800_000_000_000;
    for (let attempt = 0; attempt < 8; attempt++) expect(await store.reserveLoginAttempt("u:test", 8, now, 900_000)).toBe(true);
    expect(await store.reserveLoginAttempt("u:test", 8, now, 900_000)).toBe(false);
    expect(await store.reserveLoginAttempt("c:test", 40, now, 900_000)).toBe(true);
    expect(await store.reserveLoginAttempt("u:test", 8, now + 900_000, 900_000)).toBe(true);
    sqlite.close();
  });

  it("does not mint sessions when password reset or disable races verification", async () => {
    const { service, store, sqlite } = setup();
    const id = await service.createUser("racing", "12345678");
    const oldHash = (await store.findUserById(id))!.password_hash;
    await service.resetPassword(id, "abcdefgh");
    expect(await store.createSession(id, "old-token-hash", Date.now() + 1000, oldHash)).toBe(false);
    const newHash = (await store.findUserById(id))!.password_hash;
    await service.disableUser(id);
    expect(await store.createSession(id, "new-token-hash", Date.now() + 1000, newHash)).toBe(false);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM sessions").get()).toMatchObject({ n: 0 });
    sqlite.close();
  });
});
