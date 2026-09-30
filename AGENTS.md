# Kiri Math — Interactive Course Site

Hebrew-language (RTL) interactive learning environment, working name **Kiri Math**
(`siteName` in `app/_site/courseModel.ts`). The site hosts two Technion courses:
"Ordinary Differential Equations M" (104136) at `/ode` and "טורי פוריה והתמרות אינטגרליות"
(104214) at `/fourier`. Fourier currently has course materials and chapter pages, without interactive modules. A course
is organized by the chapters of its lecture notes, and each chapter hosts independent
modules, each combining theory, an interactive exploration activity, and self-practice
with feedback.

The plan for the multi-course structure is `docs/plans/kiri-math-site-structure.md`.

For the current ODE convergence-lab mission, agreed scope, and next-session review steps,
read `HANDOFF.md` (checkpoint dated 2026-09-24).

`ARCHITECTURE.md` is the authoritative description of the codebase. Read it before
any non-trivial change. Keep it accurate (see the `scribe` agent).

## Commands

| Task | Command |
| --- | --- |
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Tests | `npm test` (vitest, `app/**/*.test.ts`) |
| Types | `npm run typecheck` |
| Lint | `npm run lint` |

Standalone verification scripts live in `scripts/verify-*.ts`. They are **not** wired
into `package.json` and are run manually with `npx tsx scripts/<name>.ts`.

After the lecture notes are recompiled, run `npx tsx scripts/sync-course-notes.ts`. It
regenerates `app/ode/notesToc.ts` from `main.toc` (never edit that file by hand), reads
the printed-page offset from the PDF, and copies the notes, syllabus and formula sheet
into `private/courses/ode/` (not publicly served).
For Fourier, run `npx tsx scripts/sync-course-notes.ts --course fourier "<notes-folder>"`.
It reads `main.toc`, `main.pdf`, `ElaborateSyllabus.pdf`, and `formula_sheet.pdf`, generates
`app/fourier/notesToc.ts`, and copies the PDFs into `private/courses/fourier/` without touching ODE.

Before declaring any code change complete, run `npm test` and `npm run typecheck`.

## Repository map

```
app/
  page.tsx                        dashboard «הקורסים שלי», one card per course
  layout.tsx                      lang="he" dir="rtl", fonts, KaTeX CSS, site title
  globals.css                     THE ENTIRE DESIGN SYSTEM (~4,808 lines)
  courses.ts                      registry of courses shown on the dashboard
  _auth/                          authentication, sessions, course entitlements, private PDF access
  _site/                          course-agnostic site shell: model, rail, panels, breadcrumbs
  ode/                            the 104136 course: course.ts, notesToc.ts, chapter
                                  and module routes (/ode, /ode/1..6, /ode/N/<module>)
  fourier/                        the 104214 course: course.ts, notesToc.ts, art,
                                  materials and chapter routes (/fourier, /fourier/1..4)
  phase-plane-module.tsx          monolithic module (~5,400 lines)
  constant-coefficients-euler/    layered module (reference implementation)
  linear-homogeneous/             layered module, symbolic algebra
  function-sequences-series/      layered module, mostly placeholders
private/courses/<slug>/           private source PDFs copied by the sync script; served only via authorized route
scripts/                          notes sync + manual verification scripts
worker/                           Cloudflare Workers handler
```

Auth operations: `npm run auth:setup -- --target node|local|remote` selects the storage target; `npm run auth -- <create|grant|revoke|reset-password|disable|enable|list>`. Remote mode requires explicit real configuration and provisions/deploys no resources. Run `npx tsx scripts/verify-auth-http.ts` for the real HTTP smoke test. See `docs/authentication.md` for operational details.

Courses, chapters and modules are **routes**. The old module URLs (`/phase-plane` and
so on) are server redirects to their new place under `/ode/N/`. Dynamic auth and
protected-file routes are supported. Every course page checks access server-side; PDFs
under `private/courses/` are served only by the authorized `/courses/[course]/[file]`
handler. Vite denies direct filesystem serving of `private/`, `.data/` and `.wrangler/`,
including in dev.

## Module conventions

New modules follow the **layered** pattern, not the monolithic one:

```
app/<module>/
  <Name>Module.tsx   "use client" shell: topbar with breadcrumbs, tab state only
  types.ts           tabs, modes, status unions
  components/        React components, one concern each
  math/              pure math/formatting logic, no React
  practice/          question generation + answer evaluation, no React
  *.test.ts          vitest, colocated in math/ or practice/
```

To publish a module, register it in the course's `course.ts` (chapter, notes sections,
status, `href`) and add the route file `app/<course>/<chapter>/<module>/page.tsx`, which
renders the module shell and exports its metadata. `app/ode/course.test.ts` fails if the
route file is missing or the sections don't belong to the chapter.

Rules that hold across every module:

- **Math logic never imports React.** `math/` and `practice/` are pure TypeScript so
  they stay testable under vitest's `node` environment.
- **Question generation is seeded and reproducible.** Use `SeededRandom` and `mixSeed`
  from `app/constant-coefficients-euler/practice/random.ts`. Do not add a second RNG.
- **No practice persistence.** Practice statistics live in `useState` and reset on refresh;
  this is deliberate. Narrow exception: authentication uses a session cookie and server
  database for accounts, throttles and course entitlements. Second narrow exception: the
  reader text-size preference (`app/_site/textSize.ts`) is one localStorage key, a display
  setting only. Third narrow exception: activity completion marks (`app/_progress/`,
  table `activity_completions`) record only that a signed-in student finished a registered
  activity, and when; never answers, attempts, or mid-activity state
  (`docs/plans/activity-progress.md`). Do not extend persistence to practice state. No
  Context or Redux, and no other localStorage.
- **New activities need a defined completion point.** Register each one under its module's
  `activities` in the course's `course.ts` and report completion when the student reaches
  the end, so it can be marked finished.
- **Tabs inside a module are component state**, not routes. Only courses, chapters and
  modules get URLs.
- **Generators must validate their own output** before returning it (see the
  `question-designer` agent). A generator that can emit an unanswerable question is a bug.

## Non-negotiables

**RTL/LTR isolation.** The page is RTL. Every mathematical expression, coefficient row,
matrix, and free-formula input must be an isolated LTR island: `dir="ltr"` in the HTML
*and* `direction: ltr; unicode-bidi: isolate` in CSS. Getting this wrong silently
reorders formulas and is the most common visual bug in this codebase.

**Design tokens only.** Colors, shadows, and math sizes come from the `:root` custom
properties in `globals.css`. Never introduce a raw hex color. Tailwind is installed but
deliberately unused for utilities — write custom classes matching the existing families.

**Hebrew UI copy.** All student-facing text is Hebrew. Code identifiers, comments, and
commit messages are English. Mathematical notation stays LaTeX.

**Exact symbolic constants.** In symbolic code, `e` and `π` must never be materialized as
floats. See `.agents/engines.md` — this has bitten the codebase before and the guards
around it are load-bearing.

## Working with the specialist agents

Full instructions for each role live in `.agents/`. **Load these lazily**: when a task
matches a role below, read that file with your Read tool before starting, and treat its
contents as mandatory instructions that override your defaults. Do not preemptively read
all of them.

| Read this file | When you are |
| --- | --- |
| `.agents/activity-planner.md` | Deciding whether an activity is feasible and how to build it |
| `.agents/question-designer.md` | Designing families of randomized questions |
| `.agents/design.md` | Touching `globals.css`, layout, or visual design |
| `.agents/design-review.md` | Auditing cross-module visual consistency and issuing work orders |
| `.agents/pedagogy-review.md` | Auditing practice design (flow, difficulty, sibling modes) and issuing work orders |
| `.agents/verifier.md` | Validating correctness, writing tests, hunting generator bugs |
| `.agents/scribe.md` | Updating `ARCHITECTURE.md` after a change |
| `.agents/hebrew-copy.md` | Writing or revising Hebrew student-facing text |

Two shared references, read on demand:

- `.agents/engines.md` — **inventory of available computation and verification engines**,
  and their known failure modes. Read this before proposing anything that involves
  symbolic math, answer checking, or student formula input.
- `.agents/glossary.md` — canonical Hebrew mathematical terminology used in the UI.

## Work orders

`design-review` and `pedagogy-review` write audit reports to `docs/reviews/` containing
numbered **work orders**, each addressed to a specific agent. If you are asked to execute one — for
example "do WO-4 from the latest review" — read the whole order first: it names the files,
the intended change, an explicit *done when* condition, and the risk. Execute only that
order. If you find a neighbouring problem, report it rather than expanding the scope, so
the audit stays the record of what is outstanding.

## Searching this repository

The workspace path contains Hebrew characters, and structured search tools have been
observed **silently returning "no matches"** on the two largest files — `app/globals.css`
and `app/phase-plane-module.tsx` — where ripgrep finds many. Never treat an empty result
on those files as evidence. Confirm with `rg -n "pattern" app/globals.css` through the
shell.

Patterns containing **Hebrew text** have also returned "no matches" from structured search
on small files that do contain them. Search Hebrew through the shell with Unicode escapes,
which also avoid PowerShell's quoting problems: `rg -n "\x{05E4}\x{05E8}\x{05E7}" app`
matches `פרק`.

## Scope discipline

This is course material, not a product. Prefer the smallest change that works. Do not add
dependencies, build steps, state management, backends, or persistence without being asked.
When a task seems to require one, say so and stop rather than introducing it silently.
