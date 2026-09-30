import { mkdir, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { spawn } from "node:child_process";
import { DatabaseSync } from "node:sqlite";

type Target = "node" | "local" | "remote";
type D1Config = { binding?: unknown; database_name?: unknown; database_id?: unknown };
type R2Config = { binding?: unknown; bucket_name?: unknown };
type WranglerConfig = { d1_databases?: D1Config[]; r2_buckets?: R2Config[] };
// Applied in order. Wrangler tracks D1 migrations itself; the Node target infers them from tables.
const migrations = [
  { file: "0000_auth.sql", tables: ["users", "sessions", "course_entitlements", "login_rate_limits"] },
  { file: "0001_activity_progress.sql", tables: ["activity_completions"] },
];
const requiredTables = migrations.flatMap((migration) => migration.tables);
const slugs = ["ode", "fourier"];
const files = ["notes.pdf", "syllabus.pdf", "formula-sheet.pdf"];

function parse(args: string[]) {
  let target: Target = "local";
  let config: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--help" || arg === "-h") return { help: true, target, config };
    if (arg !== "--target" && arg !== "--config") throw new Error(`Unknown option: ${arg}`);
    const value = args[++i];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${arg}`);
    if (arg === "--config") config = value;
    else {
      if (value !== "node" && value !== "local" && value !== "remote") throw new Error("Target must be node, local, or remote");
      target = value;
    }
  }
  return { help: false, target, config };
}

async function runWrangler(args: string[]): Promise<void> {
  const executable = resolve("node_modules", "wrangler", "bin", "wrangler.js");
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(process.execPath, [executable, ...args], { stdio: "inherit", shell: false });
    child.on("error", () => reject(new Error("Unable to start the workspace Wrangler executable")));
    child.on("close", (code) => code === 0 ? resolvePromise() : reject(new Error(`Wrangler failed (exit ${code})`)));
  });
}

function verifySchema(db: DatabaseSync): void {
  const tables = new Set((db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map((row) => row.name));
  const missing = requiredTables.filter((name) => !tables.has(name));
  if (missing.length) throw new Error(`Authentication schema is incomplete (missing ${missing.join(", ")})`);
  db.prepare("SELECT id, username, normalized_username, password_hash, disabled, created_at FROM users LIMIT 0").all();
  db.prepare("SELECT token_hash, user_id, expires_at, created_at FROM sessions LIMIT 0").all();
  db.prepare("SELECT user_id, course_slug, created_at FROM course_entitlements LIMIT 0").all();
  db.prepare("SELECT bucket_key, attempts, window_started_at, window_ms FROM login_rate_limits LIMIT 0").all();
  db.prepare("SELECT user_id, course_slug, module_id, activity_id, first_completed_at, last_completed_at, completion_count FROM activity_completions LIMIT 0").all();
}

async function readConfig(path: string): Promise<WranglerConfig> {
  let config: WranglerConfig;
  try { config = JSON.parse(await readFile(path, "utf8")) as WranglerConfig; }
  catch { throw new Error("Cannot read Wrangler JSON config"); }
  if (!config || !Array.isArray(config.d1_databases)) throw new Error("Wrangler config must declare a D1 database list");
  if (config.r2_buckets !== undefined && !Array.isArray(config.r2_buckets)) throw new Error("Wrangler config has an invalid R2 bucket list");
  return config;
}

async function main() {
  const { help, target, config } = parse(process.argv.slice(2));
  if (help) {
    console.log("Usage: npm run auth:setup -- [--target node|local|remote] [--config wrangler.json]\nDefault target: local. Remote requires an explicit real deployment config.");
    return;
  }
  if (target === "node") {
    const dbPath = resolve(process.env.AUTH_DATABASE_PATH || ".data/auth.sqlite");
    await mkdir(dirname(dbPath), { recursive: true });
    const db = new DatabaseSync(dbPath);
    try {
      db.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
      const tables = new Set((db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map((row) => row.name));
      // Pending migrations: every table of a migration absent. A partly present migration,
      // or unknown tables in a database without the base schema, is never modified.
      const pending = migrations.filter((migration) => {
        const present = migration.tables.filter((name) => tables.has(name)).length;
        if (present > 0 && present < migration.tables.length) throw new Error("Authentication schema is partial; refusing to modify it");
        return present === 0;
      });
      if (pending[0] === migrations[0] && tables.size > 0) throw new Error("Authentication schema is partial; refusing to modify it");
      if (pending.some((migration, index) => migration !== migrations[migrations.length - pending.length + index])) {
        throw new Error("Authentication schema is out of order; refusing to modify it");
      }
      if (pending.length === 0) verifySchema(db);
      else {
        db.exec("BEGIN IMMEDIATE");
        try {
          for (const migration of pending) db.exec(await readFile(resolve("drizzle", migration.file), "utf8"));
          verifySchema(db);
          db.exec("COMMIT");
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
      }
    } finally { db.close(); }
    console.log(`Node authentication database ready: ${dbPath}`);
    return;
  }
  if (target === "remote" && !config) throw new Error("Remote setup requires --config with an explicit real deployment config");
  const configPath = resolve(config || "wrangler.auth.json");
  const parsed = await readConfig(configPath);
  const d1 = parsed.d1_databases?.find((item) => item.binding === "DB");
  if (typeof d1?.database_name !== "string" || !d1.database_name) throw new Error("Wrangler config must declare the DB D1 binding");
  if (target === "remote" && (typeof d1.database_id !== "string" || d1.database_id === "00000000-0000-4000-8000-000000000000")) {
    throw new Error("Remote config must contain a real, non-placeholder D1 database_id");
  }
  let bucket: string | undefined;
  const sources: string[] = [];
  if (target === "local") {
    const r2 = parsed.r2_buckets?.find((item) => item.binding === "COURSE_FILES");
    if (typeof r2?.bucket_name !== "string" || !r2.bucket_name) throw new Error("Wrangler config must declare the COURSE_FILES R2 binding");
    bucket = r2.bucket_name;
    for (const slug of slugs) for (const file of files) {
      const source = resolve("private", "courses", slug, file);
      await readFile(source);
      sources.push(source);
    }
  }
  await runWrangler(["d1", "migrations", "apply", d1.database_name, `--${target}`, "--config", configPath]);
  if (target === "local" && bucket) {
    let index = 0;
    for (const slug of slugs) for (const file of files) {
      const source = sources[index++]!;
      await runWrangler(["r2", "object", "put", `${bucket}/courses/${slug}/${file}`, "--local", "--config", configPath, "--file", source]);
    }
  } else {
    console.log("Remote D1 migrations applied. Upload private course files separately using the documented production R2 commands.");
  }
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Authentication setup failed"); process.exitCode = 1; });
