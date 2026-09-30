// Real HTTP checks against Next production or the Cloudflare-backed vinext dev server.
// Uses disposable accounts, never the owner's test password. No remote resources.
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { hashPassword } from "../app/_auth/crypto";

const target = process.argv[2] ?? "node";
if (target !== "node" && target !== "vinext" && target !== "worker") throw new Error("Usage: npx tsx scripts/verify-auth-http.ts node|vinext|worker");
const port = target === "node" ? 3197 : target === "worker" ? 3196 : 3198;
const origin = `http://localhost:${port}`;
const username = `verify_${randomBytes(5).toString("hex")}`;
const password = randomBytes(24).toString("base64url");
const userId = randomUUID();
const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;
const sqlPath = resolve(".data", `verify-${userId}.sql`);
await mkdir(resolve(".data"), { recursive: true });

async function sql(statement: string) {
  if (target === "node") {
    const db = new DatabaseSync(resolve(".data/auth.sqlite"));
    try { db.exec("PRAGMA foreign_keys=ON;" + statement); } finally { db.close(); }
  } else {
    await writeFile(sqlPath, statement, { mode: 0o600 });
    try {
      execFileSync(process.execPath, [resolve("node_modules/wrangler/bin/wrangler.js"), "d1", "execute", "DB", "--local", "--config", "wrangler.auth.json", "--file", sqlPath, "--json"], { stdio: "pipe" });
    } catch { throw new Error("Local verification database operation failed (sensitive output suppressed)"); }
    finally { await rm(sqlPath, { force: true }); }
  }
}

await sql(`INSERT INTO users VALUES (${quote(userId)},${quote(username)},${quote(username)},${quote(await hashPassword(password))},0,${Date.now()}); INSERT INTO course_entitlements VALUES (${quote(userId)},'ode',${Date.now()});`);
const child = spawn(process.execPath, target === "node"
  ? [resolve("node_modules/next/dist/bin/next"), "start", "--port", String(port)]
  : target === "worker"
    ? [resolve("node_modules/wrangler/bin/wrangler.js"), "dev", "--config", "dist/server/wrangler.json", "--local", "--persist-to", resolve(".wrangler/state"), "--port", String(port)]
    : [resolve("node_modules/vinext/dist/cli.js"), "dev", "--port", String(port)], {
  stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
});
let output = "";
child.stdout.on("data", (data) => { output += data; });
child.stderr.on("data", (data) => { output += data; });
let cookie = "";
async function request(path: string, init: RequestInit = {}) {
  return fetch(origin + path, { redirect: "manual", ...init, headers: { ...(cookie ? { cookie } : {}), ...init.headers }, signal: AbortSignal.timeout(60000) });
}
async function login(pass = password) {
  return request("/api/auth/login", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify({ username, password: pass, next: "/ode/1" }) });
}
async function isRedirect(response: Response, destination: string) {
  const text = await response.text();
  const location = response.headers.get("location") ?? "";
  // Next/vinext may encode redirects in an RSC/streamed response.
  assert(location.includes(destination) || text.includes(destination), `Expected redirect to ${destination}; got ${response.status}`);
  assert(response.status < 500);
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    try { const response = await request("/login"); if (response.ok) { ready = true; break; } } catch { /* startup */ }
    if (child.exitCode !== null) throw new Error(`Server exited ${child.exitCode}`);
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 1000));
  }
  assert(ready, "Server failed to start");
  await isRedirect(await request("/ode/5/phase-plane"), "/login");
  await isRedirect(await request("/fourier/1"), "/login");
  await isRedirect(await request("/courses/ode/notes.pdf"), "/login");
  await isRedirect(await request("/ode/5/phase-plane?_rsc=verify", { headers: { RSC: "1" } }), "/login");
  assert.equal((await request("/api/auth/login", { method: "POST", headers: { origin: "https://foreign.invalid", "content-type": "application/json" }, body: "{}" })).status, 403);
  assert.equal((await login("wrong-password")).status, 401);
  const signedIn = await login();
  assert.equal(signedIn.status, 200, `Login status ${signedIn.status}: ${await signedIn.clone().text()}`);
  assert.match(signedIn.headers.get("set-cookie") ?? "", /HttpOnly/);
  cookie = signedIn.headers.get("set-cookie")!.split(";")[0];
  const home = await request("/");
  assert((await home.text()).includes(username));
  assert.match(home.headers.get("cache-control") ?? "", /no-store/);
  assert.equal((await request("/ode/1")).status, 200);
  await isRedirect(await request("/fourier/1"), "/access-required");
  await isRedirect(await request("/fourier/1?_rsc=verify", { headers: { RSC: "1" } }), "/access-required");
  assert.equal((await request("/courses/fourier/notes.pdf")).status, 403);
  const pdf = await request("/courses/ode/notes.pdf", { headers: { range: "bytes=0-4" } });
  assert.equal(pdf.status, 206);
  assert.equal(await pdf.text(), "%PDF-");
  assert.match(pdf.headers.get("cache-control") ?? "", /no-store/);
  const head = await request("/courses/ode/notes.pdf", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert(Number(head.headers.get("content-length")) > 1000);
  assert.equal((await request("/courses/ode/notes.pdf", { headers: { range: "bytes=999999999-" } })).status, 416);
  await sql(`INSERT INTO course_entitlements VALUES (${quote(userId)},'fourier',${Date.now()});`);
  assert.equal((await request("/fourier/1")).status, 200);
  assert.equal((await request("/courses/fourier/notes.pdf", { method: "HEAD" })).status, 200);
  // Private source URLs and traversal cannot bypass the authorized route.
  for (const path of [
    "/private/courses/ode/notes.pdf", "/private/courses/ode/notes.pdf?raw",
    `/${"@fs"}/${resolve("private/courses/ode/notes.pdf").replaceAll("\\", "/")}`,
    "/.data/auth.sqlite?raw", "/_private/courses/ode/notes.pdf", "/courses/ode/unknown.pdf",
  ]) {
    const denied = await request(path);
    assert([403, 404].includes(denied.status), `${path} must be denied, received ${denied.status}`);
  }
  await sql(`DELETE FROM course_entitlements WHERE user_id=${quote(userId)};`);
  assert.equal((await request("/courses/ode/notes.pdf")).status, 403);
  await isRedirect(await request("/ode/1"), "/access-required");
  const signedOut = await request("/api/auth/logout", { method: "POST", headers: { origin } });
  assert.equal(signedOut.status, 303);
  // Reusing a stolen old cookie after logout must fail, not merely hide the UI.
  await isRedirect(await request("/ode/1"), "/login");
  console.log(`${target}: real HTTP login/logout, RSC redirects, grants/revocation, private PDF GET/HEAD/ranges, and no-store checks passed.`);
} catch (error) {
  console.error(output);
  throw error;
} finally {
  // Clean up while the server still owns its DB connection; abrupt Windows
  // process termination can otherwise race SQLite WAL recovery on OneDrive.
  try { await sql(`DELETE FROM users WHERE id=${quote(userId)};`); }
  finally {
    if (child.pid) {
      if (process.platform === "win32") {
        try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }); } catch { /* already closed */ }
      } else child.kill("SIGTERM");
    }
  }
}
