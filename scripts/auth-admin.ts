import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { emitKeypressEvents } from "node:readline";
import { stdin, stdout } from "node:process";
import { AuthService, normalizeUsername } from "../app/_auth/service";
import { AuthStore } from "../app/_auth/store";
import { COURSE_SLUGS, isCourseSlug, type SqlDatabase, type SqlValue } from "../app/_auth/model";

type Target = "node" | "local" | "remote";
type Options = { target: Target; config?: string; passwordStdin: boolean; courses?: string };
type D1Config = { binding?: unknown; database_name?: unknown; database_id?: unknown };
type WranglerConfig = { d1_databases?: D1Config[] };
type WranglerRow = Record<string, unknown>;
type WranglerResponse = { results?: WranglerRow[] };
const help = `Usage: npm run auth -- <command> [arguments] [options]

Targets: --target node|local|remote (default local); --config <wrangler-json>
Password input: hidden TTY prompt with confirmation, or --password-stdin.

Commands:
  create <username> [--courses ode,fourier]
  grant <username> <course>      revoke <username> <course>
  reset-password <username>      disable <username>   enable <username>
  list
`;

function parse(args: string[]): { command: string; positional: string[]; options: Options } {
  const positional: string[] = [];
  let command = "";
  const options: Options = { target: "local", passwordStdin: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--help" || arg === "-h") return { command: "help", positional, options };
    if (arg === "--password-stdin") options.passwordStdin = true;
    else if (arg === "--target" || arg === "--config" || arg === "--courses") {
      const value = args[++i];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${arg}`);
      if (arg === "--target") {
        if (value !== "node" && value !== "local" && value !== "remote") throw new Error("Target must be node, local, or remote");
        options.target = value;
      } else if (arg === "--config") options.config = value;
      else options.courses = value;
    } else if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
    else if (!command) command = arg;
    else positional.push(arg);
  }
  return { command, positional, options };
}

function validateCommand(command: string, positional: string[], options: Options): void {
  if (command === "help") return;
  const counts: Record<string, number> = { create: 1, grant: 2, revoke: 2, "reset-password": 1, disable: 1, enable: 1, list: 0 };
  const expected = counts[command];
  if (expected === undefined) throw new Error(`Unknown command: ${command}\n${help}`);
  if (positional.length !== expected) throw new Error(`${command} expects exactly ${expected} argument${expected === 1 ? "" : "s"}`);
  if (options.courses !== undefined && command !== "create") throw new Error("--courses is only valid with create");
  if (options.passwordStdin && command !== "create" && command !== "reset-password") throw new Error("--password-stdin is only valid with create or reset-password");
  if (options.courses !== undefined && !options.courses) throw new Error("--courses must list ode and/or fourier");
}

function sqlLiteral(value: SqlValue): string {
  if (value === null) return "NULL";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Invalid numeric SQL value");
    return String(value);
  }
  return `'${value.replaceAll("'", "''")}'`;
}

async function runWrangler(args: string[], capture = false): Promise<string> {
  const executable = resolve("node_modules", "wrangler", "bin", "wrangler.js");
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [executable, ...args], { stdio: capture ? ["ignore", "pipe", "ignore"] : "inherit", shell: false });
    let output = "";
    if (capture) child.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.on("error", () => reject(new Error("Unable to start the workspace Wrangler executable")));
    child.on("close", (code) => code === 0 ? resolvePromise(output) : reject(new Error(`Wrangler failed (exit ${code}); sensitive output suppressed`)));
  });
}

class WranglerDatabase implements SqlDatabase {
  constructor(private readonly target: "local" | "remote", private readonly config: string, private readonly database: string) {}
  private async execute<T>(sql: string, params: SqlValue[] = []): Promise<T[]> {
    let index = 0;
    const rendered = sql.replaceAll("?", () => {
      if (index >= params.length) throw new Error("SQL parameter mismatch");
      return sqlLiteral(params[index++]!);
    });
    if (index !== params.length) throw new Error("SQL parameter mismatch");
    const dataDir = resolve(".data");
    await mkdir(dataDir, { recursive: true });
    const dir = await mkdtemp(`${dataDir}/auth-sql-`);
    const file = resolve(dir, `${randomUUID()}.sql`);
    try {
      await writeFile(file, rendered, { mode: 0o600 });
      const result = await runWrangler(["d1", "execute", this.database, `--${this.target}`, "--config", this.config, "--file", file, "--json"], true);
      let parsed: unknown;
      try { parsed = JSON.parse(result) as unknown; } catch { throw new Error("Wrangler returned an unreadable response; SQL results were suppressed"); }
      const entries: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
      const rows: WranglerRow[] = [];
      for (const entry of entries) {
        if (!entry || typeof entry !== "object") continue;
        const response = entry as WranglerResponse;
        if (Array.isArray(response.results)) rows.push(...response.results);
      }
      return rows as T[];
    } finally { await rm(dir, { recursive: true, force: true }); }
  }
  async get<T>(sql: string, params: SqlValue[] = []): Promise<T | null> { return (await this.execute<T>(sql, params))[0] ?? null; }
  all<T>(sql: string, params: SqlValue[] = []): Promise<T[]> { return this.execute<T>(sql, params); }
  async run(sql: string, params: SqlValue[] = []): Promise<void> { await this.execute(sql, params); }
}

async function loadConfig(path: string, target: Target): Promise<{ database: string }> {
  let config: WranglerConfig;
  try { config = JSON.parse(await (await import("node:fs/promises")).readFile(path, "utf8")) as WranglerConfig; }
  catch { throw new Error("Cannot read explicit Wrangler JSON config"); }
  if (!config || !Array.isArray(config.d1_databases)) throw new Error("Wrangler config must declare a D1 database list");
  const entry = config.d1_databases?.find((item) => item.binding === "DB");
  if (typeof entry?.database_name !== "string" || !entry.database_name) throw new Error("Wrangler config must declare the DB D1 binding");
  if (target === "remote" && (typeof entry.database_id !== "string" || entry.database_id === "00000000-0000-4000-8000-000000000000")) {
    throw new Error("Remote config must contain a real, non-placeholder D1 database_id");
  }
  return { database: entry.database_name };
}

async function readStdinPassword(): Promise<string> {
  if (stdin.isTTY) throw new Error("--password-stdin requires piped stdin");
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of stdin) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > 1024) throw new Error("Password input exceeds the 1024-byte limit");
    chunks.push(buffer);
  }
  const input = Buffer.concat(chunks).toString("utf8");
  const password = input.replace(/\r?\n$/, "");
  if (password.includes("\n") || password.includes("\r")) throw new Error("Password input must contain exactly one line");
  return password;
}

function promptHidden(label: string): Promise<string> {
  if (!stdin.isTTY || !stdout.isTTY) throw new Error("Password requires a TTY or explicit --password-stdin");
  emitKeypressEvents(stdin);
  stdin.setRawMode(true);
  stdin.resume();
  stdout.write(`${label}: `);
  return new Promise((resolvePassword, reject) => {
    let value = "";
    const finish = (error?: Error) => {
      stdin.off("keypress", onKeypress);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
      if (error) reject(error);
      else resolvePassword(value);
    };
    const onKeypress = (character: string, key: { name?: string; ctrl?: boolean }) => {
      if (key.ctrl && key.name === "c") return finish(new Error("Password input cancelled"));
      if (key.name === "return" || key.name === "enter") return finish();
      if (key.name === "backspace") { value = Array.from(value).slice(0, -1).join(""); return; }
      if (character && !key.ctrl) value += character;
    };
    stdin.on("keypress", onKeypress);
  });
}

async function readPassword(passwordStdin: boolean): Promise<string> {
  if (passwordStdin) return readStdinPassword();
  const first = await promptHidden("New password");
  const confirmation = await promptHidden("Confirm password");
  if (first !== confirmation) throw new Error("Passwords do not match");
  return first;
}

async function main() {
  const { command, positional, options } = parse(process.argv.slice(2));
  if (command === "help" || !command) { console.log(help); return; }
  validateCommand(command, positional, options);
  if (options.target === "remote" && !options.config) throw new Error("Remote commands require --config with an explicit real deployment config");
  let store: AuthStore;
  if (options.target === "node") {
    const { DatabaseSync } = await import("node:sqlite");
    const path = process.env.AUTH_DATABASE_PATH || resolve(process.cwd(), ".data", "auth.sqlite");
    const db = new DatabaseSync(path);
    db.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
    const adapter: SqlDatabase = {
      async get<T>(sql: string, params: SqlValue[] = []) { return (db.prepare(sql).get(...params) as T | undefined) ?? null; },
      async all<T>(sql: string, params: SqlValue[] = []) { return db.prepare(sql).all(...params) as T[]; },
      async run(sql: string, params: SqlValue[] = []) { db.prepare(sql).run(...params); },
    };
    store = new AuthStore(adapter);
  } else {
    const configPath = resolve(options.config || "wrangler.auth.json");
    const { database } = await loadConfig(configPath, options.target);
    store = new AuthStore(new WranglerDatabase(options.target, configPath, database));
  }
  const service = new AuthService(store);
  if (command === "list") {
    const rows = await storeRows(options);
    for (const row of rows) console.log(`${row.username}\t${row.disabled ? "disabled" : "enabled"}\t${(await store.getCourses(row.id)).join(",")}`);
    return;
  }
  const username = positional[0]!;
  const normalized = normalizeUsername(username);
  if (!normalized) throw new Error("Provide a valid username (3–40 ASCII letters, digits, or underscores)");
  const user = await store.findUserByUsername(normalized);
  if (command === "create") {
    if (user) throw new Error("Account already exists");
    const courses = (options.courses ?? "").split(",").filter(Boolean).map((course) => {
      if (!isCourseSlug(course)) throw new Error(`Unknown course ${course}; allowed: ${COURSE_SLUGS.join(", ")}`);
      return course;
    });
    const id = await service.createUser(username, await readPassword(options.passwordStdin));
    for (const course of courses) await service.grantCourse(id, course);
    console.log(`Created ${username}${courses.length ? `; courses: ${courses.join(",")}` : ""}`);
    return;
  }
  if (!user) throw new Error("Account not found");
  if (command === "reset-password") { await service.resetPassword(user.id, await readPassword(options.passwordStdin)); console.log(`Password reset for ${username}`); return; }
  if (command === "disable" || command === "enable") { await (command === "disable" ? service.disableUser(user.id) : service.enableUser(user.id)); console.log(`${username}: ${command}d`); return; }
  const course = positional[1]!;
  if (!isCourseSlug(course)) throw new Error(`Provide a course: ${COURSE_SLUGS.join(" or ")}`);
  await (command === "grant" ? service.grantCourse(user.id, course) : service.revokeCourse(user.id, course));
  console.log(`${command}ed ${course} for ${username}`);
}

async function storeRows(options: Options): Promise<{ id: string; username: string; disabled: number }[]> {
  if (options.target === "node") {
    const { DatabaseSync } = await import("node:sqlite");
    const path = process.env.AUTH_DATABASE_PATH || resolve(process.cwd(), ".data", "auth.sqlite");
    const db = new DatabaseSync(path, { readOnly: true });
    try { return db.prepare("SELECT id, username, disabled FROM users ORDER BY normalized_username").all() as { id: string; username: string; disabled: number }[]; }
    finally { db.close(); }
  }
  const configPath = resolve(options.config || "wrangler.auth.json");
  const { database } = await loadConfig(configPath, options.target);
  return new WranglerDatabase(options.target, configPath, database).all("SELECT id, username, disabled FROM users ORDER BY normalized_username");
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Authentication admin command failed"); process.exitCode = 1; });
