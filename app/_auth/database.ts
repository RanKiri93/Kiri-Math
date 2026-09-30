import type { SqlDatabase } from "./model";
import { getRuntime } from "./runtime";

let nodeDatabase: SqlDatabase | undefined;

export async function getNodeDatabase(): Promise<SqlDatabase> {
  if (nodeDatabase) return nodeDatabase;
  // Only Node runs this branch. Workers uses its D1 binding, never a filesystem DB.
  const moduleName = "node:sqlite";
  const { DatabaseSync } = await import(/* webpackIgnore: true */ /* @vite-ignore */ moduleName) as typeof import("node:sqlite");
  const { resolve } = await import("node:path");
  const path = process.env.AUTH_DATABASE_PATH || resolve(process.cwd(), ".data", "auth.sqlite");
  // No implicit schema/bootstrap or test users on server startup.
  const db = new DatabaseSync(path, { open: true });
  db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  db.prepare("SELECT id FROM users LIMIT 1").get();
  nodeDatabase = {
    async get<T>(sql: string, params = []) { return (db.prepare(sql).get(...params) as T | undefined) ?? null; },
    async all<T>(sql: string, params = []) { return db.prepare(sql).all(...params) as T[]; },
    async run(sql: string, params = []) { db.prepare(sql).run(...params); },
  };
  return nodeDatabase;
}

export async function getDatabase(): Promise<SqlDatabase> {
  const runtime = await getRuntime();
  if (runtime.kind === "node") return getNodeDatabase();
  const db = runtime.env.DB;
  if (!db) throw new Error("Authentication requires the Cloudflare DB binding and applied migrations.");
  return {
    get: (sql, params = []) => db.prepare(sql).bind(...params).first(),
    all: async <T>(sql: string, params = []) => (await db.prepare(sql).bind(...params).all<T>()).results,
    run: async (sql, params = []) => { await db.prepare(sql).bind(...params).run(); },
  };
}
