# Authentication operations

Accounts and course access are managed manually by an operator. There is no public
registration or online checkout: create an account after handling enrollment/contact
through the course's existing process, then explicitly grant `ode` and/or `fourier`.
Never seed a fixed/test account automatically. Provision any local test account yourself
with the commands below; do not commit its credentials.

On this workstation, the requested `RanKiri` test account has already been provisioned
in both local targets with access to `ode` and `fourier`. Start `npm run dev`, open
`/login`, and use the supplied test password. This account is not a production seed;
change the test password before creating a live account, and protect local database
backups because they contain account data and password hashes.

## Runtime targets

The operator commands are `npm run auth:setup -- ...` and `npm run auth -- ...`.
They use the repository's existing `npx tsx scripts/...` convention; no additional
runtime dependency is required.

### Node runtime database

Node 24's built-in `node:sqlite` is used. Setup creates `.data/auth.sqlite`, applies
the pending `drizzle/*.sql` migrations (`0000_auth.sql`, then `0001_activity_progress.sql`)
in order in one transaction, and verifies all required tables and columns. It refuses a
database in which a migration is only partly present. Re-run setup after pulling a new
migration; Cloudflare targets apply the same files through `wrangler d1 migrations apply`. The application uses the same default path;
`AUTH_DATABASE_PATH` can override it for both commands and runtime. Node storage is
separate from Wrangler's local Cloudflare storage.

```sh
npm run auth:setup -- --target node
npm run auth -- --target node create alice --courses ode
```

### Local Cloudflare database and private files

Local mode defaults to `wrangler.auth.json`. It applies D1 migrations with Wrangler's
local mode and uploads the six course PDFs into the configured `COURSE_FILES` bucket at
`courses/<slug>/<file>`. The checked-in local config names the placeholder D1 database
`site-creator-d1` and R2 bucket `site-creator-r2`; these are local-only names. The local
Cloudflare emulator persists state under `.wrangler/state/v3`, as configured by Wrangler
and the Cloudflare Vite plugin; use Wrangler's `--local` operations to share that state.
Do not make the R2 bucket public.

```sh
npm run auth:setup
npm run auth -- create alice --courses ode,fourier
npm run auth -- list
```

The six private source files are expected at `private/courses/{ode,fourier}/{notes.pdf,syllabus.pdf,formula-sheet.pdf}`.
Setup verifies all six files and required bindings before applying migrations. If any
file is missing, setup stops before changing local Cloudflare state.

### Remote production

Remote operations never default to a production account/config. Every remote invocation
requires `--config <explicit-real-config.json>`; the config must contain D1 binding
`DB`. Setup only applies D1 migrations remotely. It does not deploy, create resources,
or upload R2 objects. Provision production D1 and a **private** R2 bucket separately,
then configure the actual binding names. After confirming the intended environment,
upload the files separately using its real bucket name, for example:

```sh
npx wrangler r2 object put REAL_PRIVATE_BUCKET/courses/ode/notes.pdf --remote --config wrangler.production.json --file private/courses/ode/notes.pdf
```

Repeat for the other five files. An operator must supply the real production config and
bucket; do not infer them from the local placeholder.

```sh
npm run auth:setup -- --target remote --config wrangler.production.json
npm run auth -- --target remote --config wrangler.production.json create alice --courses ode
npm run auth -- --target remote --config wrangler.production.json list
```

Do not run these remote examples without an intentionally provisioned deployment.

`wrangler.auth.json` is an **operations-only local configuration**, not a production
deployment configuration. `vite.config.ts` also supplies placeholder/local bindings;
the generated `dist/server/wrangler.json` must receive the real D1 database ID and
private R2 bucket name from the hosting platform or an explicit deployment configuration.
Do not deploy the placeholder database or assume that changing `.openai/hosting.json`
has provisioned Cloudflare resources. Preserve the generated Worker entry, assets,
compatibility flags, and module rules when configuring production bindings.

## Account commands

Targets: `--target node|local|remote` (default `local`); `--config <path>` selects the
Wrangler JSON config. Commands:

```text
create <username> [--courses ode,fourier]
grant <username> <ode|fourier>
revoke <username> <ode|fourier>
reset-password <username>
disable <username>
enable <username>
list
```

Usernames are 3–40 ASCII letters, digits, or underscores. Passwords must be 8–128
characters. Passwords are read twice through hidden TTY prompts for confirmation, or
from piped stdin with explicit `--password-stdin` (one line, at most 1024 bytes):

```sh
printf '%s\n' "$AUTH_NEW_PASSWORD" | npm run auth -- create alice --courses ode --password-stdin
printf '%s\n' "$AUTH_NEW_PASSWORD" | npm run auth -- reset-password alice --password-stdin
```

Never pass a password as a command-line argument, put it in shell history, or print it
to logs. Supply automation secrets through the runner's protected secret mechanism.
Passwords are hashed locally with the same scrypt implementation used by the app. For
Wrangler operations the resulting SQL is written under ignored `.data` in a short-lived,
owner-only temporary file, removed after execution; queries and Wrangler error output are not printed because
they may contain account data. Do not enable shell tracing around these commands.

## Activity progress

The same database stores activity completion marks (`activity_completions`): which
registered activity a student finished, the first and last completion time, and a count.
Nothing else about the student's work is stored. Rows are deleted with the user. The
signed-in browser writes them through `POST /api/progress/complete` (same-origin, session
and course grant required, only activities registered in `course.ts`). A missing table or
storage failure never blocks a page: marks are simply not shown or not saved. Design and
backlog: `docs/plans/activity-progress.md`.

## Deployment and operational requirements

The app fails closed if its required authentication schema or Cloudflare DB binding is
unavailable; there is no fallback database or implicit schema creation at startup.
Production requires provisioned D1 and private R2 resources and explicit configuration.
Login uses scrypt, so Cloudflare Workers must have an appropriate paid CPU duration
limit for the configured work factor. Serve authentication only over HTTPS, enforce
deployment-level request/rate protections, and review the seven-day session expiry.
Before release, manually verify login, logout, disabled accounts, password reset,
session expiry, and per-course access independently for both `ode` and `fourier` in
Node and the deployed Worker environment.

### Security behavior and verification

- Session tokens are random, kept in HttpOnly/SameSite cookies, and stored only as
  hashes. HTTPS (and production) cookies are Secure. Sessions expire after seven days.
- Passwords use salted scrypt. Password reset and disabling revoke existing sessions.
  Course grants are read on every authorized request, so revocation takes effect on
  the next request without requiring logout. Content already downloaded cannot be recalled.
- Login is limited to 8 attempts per normalized username and 40 per client per 15
  minutes, stored in the database. Cloudflare uses the edge-provided client IP;
  Node intentionally uses a conservative shared origin bucket rather than trusting
  spoofable forwarding headers. Review that Node limit before using Node at scale.
- Login and logout require same-origin POSTs. Private pages, RSC responses, and PDFs
  must not be given a CDN cache-everything rule. No public R2 access is allowed.
- The notes-sync script updates `private/courses/`. Re-run local setup to refresh
  the emulator's R2 copies after syncing; production R2 uploads are separate.

Run unit tests and type checking with `npm test` and `npm run typecheck`. Real HTTP
verification uses disposable accounts, never the owner's credentials:

```sh
npm run auth:setup -- --target node
npm run build
npx tsx scripts/verify-auth-http.ts node
npm run auth:setup
npx tsx scripts/verify-auth-http.ts vinext
npm run build:vinext
npx tsx scripts/verify-auth-http.ts worker
```

All three targets are local. `worker` exercises the built Worker using Wrangler's
local emulator; it does not deploy. These checks cover login/logout, RSC redirects,
per-course grants/revocation, protected PDF GET/HEAD/ranges, and private cache headers.
