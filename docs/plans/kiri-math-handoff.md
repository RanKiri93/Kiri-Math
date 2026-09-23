# Kiri Math — handoff for the remaining phases

Written 23 בספטמבר 2026, at the end of phases 1 and 2. This document is for the model that
continues the work. It assumes you have not seen the conversation that produced phases 1–2.
The design decisions live in `kiri-math-site-structure.md` (the plan). This document tells you
what state the code is in, what bites in this environment, and exactly how to execute each
remaining task.

---

## 0. Read this first

### Read order

1. `AGENTS.md` (always-applied rules; you may already have it in context).
2. This document, fully, before touching anything.
3. `docs/plans/kiri-math-site-structure.md` — "Locked decisions" and phases 3–4.
4. `ARCHITECTURE.md` §2 (routing and the site shell) and §8 (design system). It is in Hebrew.
5. The `.agents/<role>.md` file for the role a task names, **when you start that task**, not
   before. Treat its contents as mandatory.

### Who you are working for

The owner is the course lecturer. He writes in Hebrew; answer him in Hebrew. He reads the site
as a teacher, not as a developer: lead every report with what changed for students, then what
you could not verify. Student-facing text is Hebrew, code and comments and commit messages are
English, mathematics is LaTeX.

### Stop and ask the owner (use the AskQuestion tool) before any of these

- A new color, a new color token, or a raw hex value in `globals.css`.
- Any new dependency (PDF.js, an animation library, anything).
- Changing a locked decision (routes, transition text, art inside labs/practice, palette).
- Phase 4a (splitting the function-sequences module): module names and URLs are his call.
- Touching files that belong to the uncommitted Euler work (listed in §1).
- Creating a git commit or pushing. He asks explicitly when he wants one.
- Deleting `C:\Users\ranki\package-lock.json` (see §1, "Known warnings").

### Order of work

| ID | Task | Phase | Needs the owner first? |
| --- | --- | --- | --- |
| T0 | Act on the owner's browser check of the notes reader | 2 | His feedback |
| T1 | «לקריאה ברשימות» links inside the four module intros | 2b | No |
| T2 | Art engine: pure SVG path generators + tests | 3a | No |
| T3 | Faded KaTeX equations component | 3b | No |
| T4 | Place art: dashboard card, course page, chapter headers | 3c | No |
| T5 | Course-entry transition on the dashboard | 3d | No |
| T6 | Phase 3 documentation and design rules | 3e | No |
| T7 | Optional: reader width between 1181 and 1360px | polish | Yes |
| T8 | Shared math UI and `SeededRandom` (plan 4b) | 4 | Yes (Euler work must be committed first) |
| T9 | Split the function-sequences module (plan 4a) | 4 | Yes |
| T10 | Move module folders under `app/ode/` (plan 4c) | 4 | Do not start unless asked |

Do one task per turn unless the owner asks for more. Report after each.

---

## 1. Where things stand

### Git

```
fa68232 Restructure the site as Kiri Math, a multi-course platform
e15b000 Add linear-homogeneous and function-sequences-series module code
e2b1822 תיקוני אחידות בעיצוב של המודולים      ← state before this work
```

Both commits build and test on their own (checked by exporting the index, see §2).

**Uncommitted work in the tree that is not yours.** 26 paths belong to earlier, separate work
on the Euler module and the agent setup. Never stage them, never "clean them up", never
reformat them:

- `app/constant-coefficients-euler/**` — 11 modified files (components, `constants.ts`,
  `math/roots.ts`, practice generation, `stats.ts`, `types.ts`) and 6 untracked `*.test.ts`.
- `docs/README.md`, `docs/plans/euler-*.md`, `docs/plans/practice-stats.md`, `docs/reviews/*.md`.
- `.cursor/agents/`, `opencode.json`, `scripts/verify-reconstruction-case-filter.ts`.

`npm test` in the working tree therefore runs more tests than the committed tree (251 in 13
files vs. 142 in 7, as of this writing). Both numbers are fine; do not "fix" the difference.

### What exists and works

- **Routes:** `/` dashboard «הקורסים שלי»; `/ode` course page with «חומר הקורס»;
  `/ode/1` … `/ode/6` chapter pages; four module routes under `/ode/N/<module>`; the four old
  module URLs redirect (307).
- **Site shell** in `app/_site/` (course-agnostic; every component takes a `CourseDefinition`).
- **Course data** in `app/ode/`: `course.ts` (modules ↔ sections, resources), `notesToc.ts`
  (generated — never edit by hand; regenerate with `npx tsx scripts/sync-course-notes.ts`).
- **Notes reader (phase 2):** on screens ≥821px, notes links open inside the site — a TOC
  column beside a framed native PDF viewer on `/ode`, and a native `<dialog>` on chapter pages.
  Below that, links open the PDF in a new tab. Every notes link is a real `href` first; the
  reader only intercepts plain left clicks on anchors carrying `data-notes-section` or
  `data-notes-chapter`.
- **Verified:** the physical page the reader opens matches the PDF's own hyperref destination
  for all 35 sections; layouts at 1580 / 1000 / 390px; dialog open, close, backdrop click, focus
  return; `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- **Not verified by anyone yet:** how the native viewer actually looks in Chrome, Edge and
  Firefox (the owner is checking — T0), and native Esc on the dialog.

### Known warnings (not bugs)

- `npm run lint` reports one warning in `scripts/verify-math-size-tokens.mjs`
  (`extractColorLiterals` unused). Pre-existing, not ours.
- `next build` warns that it inferred the workspace root from `C:\Users\ranki\package-lock.json`.
  Harmless. Deleting that file is the owner's decision.

### Open items that belong to the owner

- Section 3.5's title in the notes reads «נספח (להשערה בלבד)», almost certainly meant to be
  «להעשרה בלבד». Fixed in the LaTeX source, then `npx tsx scripts/sync-course-notes.ts`.
- A vector version of the hand-drawn figure (with question marks) in `Logo.png`. Phase 3 must
  not wait for it (see T4).
- `ARCHITECTURE.md` §9 has no row for `scripts/verify-reconstruction-case-filter.ts`. That
  script is part of the uncommitted Euler work; leave the row for whoever commits it.

---

## 2. Environment: what bites here

### Shell

- **Windows PowerShell 5.1.** No `&&` or `||`; chain with `;`, or check `$LASTEXITCODE`.
- **Quoting:** do not put `\"` inside a double-quoted `rg` pattern, and do not put a bare `&`
  inside a string; both break the parser. When a pattern needs quotes, use the Grep tool or a
  pattern without them. Example of a line that fails: `rg -n "\"(dev|build)\"" package.json`.
- **The workspace path contains Hebrew.** Terminal output mangles it; that is cosmetic.

### Searching

- The structured Grep tool **silently returns nothing** on `app/globals.css` and
  `app/phase-plane-module.tsx`, and on Hebrew patterns in any file. Never trust an empty
  result there. Use `rg` in the shell. For Hebrew, use Unicode escapes:
  `rg -n "\x{05E4}\x{05E8}\x{05E7}" app` matches `פרק`.
- `phase-plane-module.tsx` is ~5,400 lines. Find the block you need with `rg -n` and read only
  that range.

### Dev server and builds

- `npm run dev` runs **vinext** (a reimplementation of the App Router). It has been running at
  `http://localhost:3001`; if it isn't, start it in the background and read the port from its
  output. Ports 3000 and 5173 may be held by other processes.
- `npm run build` runs `next build --webpack`. Anything touching routing, navigation or
  `next/navigation` APIs must be checked under **both** toolchains: dev, and build +
  `npx next start -p 3002`. Stop the `next start` server when done.
- Only plain folders, `page.tsx` and `redirect()` have been proven on vinext. `useRouter`
  from `next/navigation` exists in vinext's shim (`node_modules/vinext/dist/shims/navigation.d.ts`
  declares `push` and `prefetch`), but nobody has exercised it at runtime yet — T5 must.

### Cursor's embedded browser

- It **does not render PDFs** (the viewer area stays blank or dark). Headless Edge and Firefox
  did not paint them either. Do not spend time trying; the owner checks PDFs by eye.
- `browser_press_key` sends untrusted events, so native behaviors (Esc closing a `<dialog>`)
  cannot be tested through it.
- `browser_click` fails on elements inside scrolled containers (the reader's TOC column). Use
  `browser_cdp` → `Runtime.evaluate` with `document.querySelector(...).click()`.
- Emulate widths with `Emulation.setDeviceMetricsOverride` (`{ width, height,
  deviceScaleFactor: 1, mobile }`), reload, measure with `Runtime.evaluate`, screenshot, and
  **always** finish with `Emulation.clearDeviceMetricsOverride`.
- Measure instead of eyeballing: widths via `getBoundingClientRect()`, horizontal overflow via
  `el.scrollWidth > el.clientWidth`, presence via `document.querySelectorAll('iframe').length`.

### Git hygiene

- Never `git add -A` or `git add .`. Stage explicit paths only.
- If the owner asks for a commit, verify the staged tree on its own before committing:

  ```powershell
  $repo = (Get-Location).Path; $tmp = Join-Path $env:TEMP "kiri-check"
  New-Item -ItemType Directory -Path $tmp | Out-Null
  git checkout-index -a -f --prefix="$($tmp -replace '\\','/')/"
  New-Item -ItemType Junction -Path "$tmp\node_modules" -Target "$repo\node_modules" | Out-Null
  Set-Location $tmp; npx tsc --noEmit; npx vitest run --config vitest.config.ts; npx next build --webpack
  Set-Location $repo
  cmd /c rmdir "$tmp\node_modules"      # remove the junction FIRST, on its own
  Remove-Item -Recurse -Force $tmp
  ```

  **Remove the junction with `cmd /c rmdir` before deleting the folder.** `Remove-Item -Recurse`
  on a junction in PowerShell 5.1 can follow it and delete the real `node_modules`.

---

## 3. Orientation for this work

### Files you will touch most

| File | What it is |
| --- | --- |
| `app/_site/courseModel.ts` | Types (`CourseDefinition`, `CourseSummary`, `NotesChapter`…) and pure helpers. No React. |
| `app/_site/notesNavigation.ts` | Pure notes navigation: `locateNotesTarget`, `notesViewerSrc` (viewer params live here), `notesTargetFromData`. |
| `app/_site/useNotesReader.ts` | `useNotesReaderAvailable()` (matchMedia `(min-width: 821px)`), `notesTargetFromClick`. |
| `app/_site/NotesDialog.tsx` | `NotesDialogHost`: wrap any subtree; its notes links open in a modal reader. |
| `app/_site/NotesFrame.tsx`, `NotesReader.tsx`, `NotesToc.tsx`, `NotesSectionList.tsx` | Reader UI. |
| `app/_site/CourseCard.tsx` | Dashboard card (a single `next/link` `Link`). |
| `app/_site/ChapterPanel.tsx` | Chapter page body; wrapped in `NotesDialogHost`. |
| `app/_site/CourseMaterialsPanel.tsx` | `/ode` body: resource cards + `NotesReader`. |
| `app/ode/course.ts`, `app/ode/OdeChapterPage.tsx`, `app/courses.ts` | ODE data, chapter page, dashboard registry. |
| `app/ode/OdeModuleBreadcrumbs.tsx` | The pattern for "a course-bound wrapper that modules import". |
| `app/globals.css` | The whole design system (~4,480 lines). |

### CSS map (line numbers drift; find blocks with `rg -n`)

- Shared glass surface: the selector list `.module-intro-card, .course-module-card,
  .course-card, .chapter-rail, .course-panel` sets border, `--panel` background, `--shadow`
  and **`backdrop-filter: blur(14px)`**. `.course-card:hover` adds a `transform`.
  Consequence: a `position: fixed` element placed *inside* any of these is trapped in that
  box. Overlays must be portaled to `document.body` or use the top layer (`<dialog>`).
- `/* Site shell: dashboard, course shell, chapter panels */` — dashboard, card, rail, panels.
- `/* Notes reader: … */` — reader, frame, dialog, and `html:has(.notes-dialog[open])`.
- `.chapter-panel-header`, `.chapter-panel-number`, `.chapter-panel-notes-link`.
- Responsive blocks: `@media (max-width: 1180px)` and `@media (max-width: 820px)` near the end
  of the file. Add responsive rules for new classes inside those blocks, next to their relatives.
- There is **no** `prefers-reduced-motion` rule yet. T5 adds the first.
- The page background (grid + gold wash) is on `body`.

### Tokens (the only colors you may use)

`--paper`, `--paper-deep`, `--ink`, `--muted`, `--line`, `--blue`, `--blue-soft`, `--green`,
`--green-soft`, `--rust`, `--danger`, `--gold`, `--panel`, `--raised`, `--shadow`. For a lighter
stroke use `opacity` or `stroke-opacity` on a token color, not a new `rgba()`. The legend
literals `#2c456b` / `#83aff0` / `#ff9d00` belong to the phase-plane canvas only; art must not
reuse them. The orange in `Logo.png` maps to `--rust` or `--gold`, its blue to `--blue`.

### Serialization trap

`CourseDefinition` objects are passed from server components to client components
(`NotesReader`, `NotesDialogHost`), so they are serialized into every page. **Never add
functions, React elements or large data to `CourseDefinition`.** Art belongs next to it, not
in it (see T2).

### Checks before you call anything done

`npm test`, `npm run typecheck`, `npm run lint` always; `npm run build` when routes, navigation
or client/server boundaries changed; `node scripts/verify-math-size-tokens.mjs` after CSS or
math-typography changes; a browser pass at the widths the task names. Then the docs updates the
task lists, then a short Hebrew report.

---

## T0 — Act on the owner's browser check of the reader

The owner is opening `/ode` in Chrome or Edge and in Firefox to check page landing and the look
of the native viewer, and trying Esc on a chapter-page dialog. Wait for his feedback; do not
guess. Likely requests and where the knob is:

| He reports | Where to change it |
| --- | --- |
| Wrong page | Should not happen (35/35 verified against hyperref). Check `notesPageOffset` in `app/ode/notesToc.ts` was regenerated with the current PDF (`npx tsx scripts/sync-course-notes.ts`). |
| Page doesn't fill the width, or too zoomed | `viewerParams` in `app/_site/notesNavigation.ts` (`view=FitH` for Chrome/Edge, `zoom=page-width` for Firefox). Update the test in `notesNavigation.test.ts` that asserts the params. |
| Wants the Chrome/Edge toolbar back (zoom buttons, page number) | Drop `toolbar=0` from `viewerParams`. |
| Firefox's toolbar looks foreign | Cannot be hidden by URL parameters. The only fix is a PDF.js-based viewer — a new dependency. Stop and ask. |
| Dialog too big or small | `.notes-dialog` width/height in `globals.css`. |
| Esc does nothing | Real browsers fire `cancel` on Esc for `showModal()` dialogs. If it truly fails, add an `onCancel` handler on the `<dialog>` in `NotesDialog.tsx` that calls `closeDialog()`. |

Done when his reported issues are fixed and re-checked at the widths he mentions. Update the
"Status" paragraph of phase 2 in the plan.

---

## T1 — «לקריאה ברשימות» links inside the module intros (phase 2b)

**Goal.** Each module's intro tab shows the notes sections the module covers, as links that
open the in-site reader dialog on desktop and a new tab on narrow screens — the same behavior
as chapter pages. This is the last unbuilt piece of phase 2.

**Roles.** Read `.agents/hebrew-copy.md` (copy) and `.agents/design.md` (CSS) when you start.

### Files

- New `app/_site/NotesSectionLinks.tsx` — course-agnostic, no hooks.
- New `app/ode/OdeNotesSections.tsx` — course-bound wrapper, modeled on `OdeModuleBreadcrumbs.tsx`.
- Edit, **one insertion each, nothing else**:
  - `app/constant-coefficients-euler/components/ConstantCoefficientsEulerIntro.tsx`
    — **careful:** this folder has uncommitted Euler work, but this file is *not* in the
    modified list. Confirm with `git status --short app/constant-coefficients-euler` before
    editing; if it shows as modified, stop and ask.
  - `app/linear-homogeneous/components/LinearHomogeneousIntro.tsx` (`export function
    LinearHomogeneousIntro` near line 329).
  - `app/function-sequences-series/components/FunctionSequencesSeriesIntro.tsx`.
  - `app/phase-plane-module.tsx`, only inside `function PhasePlaneIntro()` (find it with
    `rg -n "function PhasePlaneIntro" app/phase-plane-module.tsx`).
- `app/globals.css`: a small `.module-notes-*` block next to `.chapter-panel-notes-link`.

### Design

`NotesSectionLinks({ course, sections })`:

```tsx
import { notesPageHref, type CourseDefinition } from "./courseModel";
import { locateNotesTarget } from "./notesNavigation";

export function NotesSectionLinks({ course, sections }: { course: CourseDefinition; sections: readonly string[] }) {
  return (
    <ul className="module-notes-list">
      {sections.map((number) => {
        const location = locateNotesTarget(course.chapters, { kind: "section", section: number });
        if (!location?.section || location.printedPage === null) {
          throw new Error(`Section ${number} is not in the notes of "${course.slug}"`);
        }
        return (
          <li key={number}>
            <a
              href={notesPageHref(course, location.printedPage)}
              target="_blank"
              rel="noopener noreferrer"
              data-notes-section={number}
            >
              <bdi dir="ltr">{number}</bdi> {location.section.title} <small>עמ׳ {location.printedPage}</small>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
```

`OdeNotesSections({ moduleId })` finds the module with `findModule(odeCourse, moduleId)` and
renders a labelled block wrapped in its own host:

```tsx
<NotesDialogHost course={odeCourse}>
  <aside className="module-notes" aria-label="לקריאה ברשימות">
    <p className="module-notes-heading">לקריאה ברשימות</p>
    <NotesSectionLinks course={odeCourse} sections={courseModule.sections} />
  </aside>
</NotesDialogHost>
```

Because the host wraps only this block, the module shells and tab logic stay untouched. The
`<dialog>` opens in the top layer, so the `backdrop-filter` on `.module-intro-card` does not
trap it.

**Placement:** inside the intro's `module-intro-content` article, after the lead paragraph(s)
and before `.intro-expansion-list`. In the function-sequences roadmap, after the first
paragraph. Insert `<OdeNotesSections moduleId="…" />` with the module's `id` from `course.ts`
(`function-sequences-series`, `linear-homogeneous`, `constant-coefficients-euler`, `phase-plane`).

**CSS:** the section number is an LTR island (`direction: ltr; unicode-bidi: isolate` on the
`bdi` via its class or selector). Links in `--blue`, the page in `--muted`. Wrap on narrow
screens. `NotesDialogHost` adds a plain `div.notes-dialog-host`; if it disturbs the intro
layout, give it `display: contents` (click events still bubble through it).

**Copy:** «לקריאה ברשימות» is already listed in the plan's copy section; add a row to the
"Site and course navigation" table in `.agents/glossary.md`.

### Tests

In `app/ode/course.test.ts` (or a new `app/_site/notesSectionLinks.test.ts` if you keep a
pure helper), assert every module section resolves through `locateNotesTarget` to a section
with a page. Keep React out of tests (vitest runs in `node`).

### Verify

- At 1580px on each of the four module URLs, intro tab: the block renders; clicking a link
  opens the dialog; the iframe `src` has the right `#page=` (section page + 4); × and backdrop
  close it; focus returns to the link.
- At 390px: no iframe in the DOM after clicking (it opens a new tab — do not actually follow
  it; assert `target="_blank"` and that no dialog opened).
- The module's other tabs are unchanged.

**Done when:** all four intros show the links; the checks above pass; tests, typecheck, lint
and build pass; `ARCHITECTURE.md` §2 lists the two new files; the plan's phase 2 status says
module links are done; the glossary row exists.

---

## T2 — Art engine (phase 3a)

**Goal.** Deterministic, pure-TypeScript generators that produce SVG path data from real
mathematics, rendered as inline SVG whose strokes use design tokens. No images, no randomness,
no new dependency.

**Role.** Read `.agents/design.md`. The math must be correct; read `.agents/verifier.md` for
the testing stance.

### Files

Generic engine (course-agnostic):

- `app/_site/art/types.ts`
- `app/_site/art/geometry.ts` — frame mapping, polyline → path string, chevrons, clipping.
- `app/_site/art/integrate.ts` — RK4 for planar systems.
- `app/_site/art/art.test.ts`
- `app/_site/ArtSvg.tsx` — renders an `ArtPiece`; server-compatible, no hooks.

ODE motifs (course-specific):

- `app/ode/art.ts` — the cover composition and six chapter motifs, as data.
- `app/ode/art.test.ts`

Keep art out of `CourseDefinition` (see §3, "Serialization trap"). Pages pass art explicitly.

### Types

```ts
export type ArtTone = "ink" | "muted" | "blue" | "rust" | "gold" | "green";

export type ArtStroke = {
  d: string;              // SVG path data in viewBox units, numbers rounded to 1 decimal
  tone: ArtTone;
  weight?: "hair" | "regular" | "bold";
  dashed?: boolean;       // envelopes, equilibria, asymptotes
};

export type ArtPiece = {
  width: number;          // viewBox is `0 0 width height`
  height: number;
  strokes: readonly ArtStroke[];
  dots?: readonly { x: number; y: number; r: number; tone: ArtTone }[];
};
```

### Engine rules

- **Frame mapping:** math coordinates `[xMin, xMax] × [yMin, yMax]` → viewBox, with y flipped.
  One helper, used by every motif.
- **Rounding:** 1 decimal in path strings. Keep each piece under ~30 KB of path data.
- **Arrowheads** are small chevron paths computed by the generator (two segments at ±25° from
  the reversed direction). **Do not use `<marker>`**: markers need ids and do not inherit the
  stroke color reliably.
- **RK4:** `integrate(f, start, h, maxSteps, bounds)` returns points; stop on leaving the
  bounds or on a non-finite value. Integrate backward with `-h` for the other half of a curve.
- **No randomness.** A hand-drawn wobble would need the project RNG, which lives in the Euler
  module (`SeededRandom`); importing it into `_site` creates a dependency plan 4b is meant to
  remove. Round caps and joins give enough softness.

### Rendering (`ArtSvg`)

```tsx
<svg className={className} viewBox={`0 0 ${piece.width} ${piece.height}`} aria-hidden="true" focusable="false">
  {piece.strokes.map((stroke, index) => (
    <path
      key={index}
      d={stroke.d}
      pathLength={1}
      className={`art-stroke tone-${stroke.tone} weight-${stroke.weight ?? "regular"}${stroke.dashed ? " dashed" : ""}`}
      style={animated ? ({ "--i": index } as CSSProperties) : undefined}
    />
  ))}
  {/* dots as <circle className={`art-dot tone-${tone}`} … /> */}
</svg>
```

`pathLength={1}` lets T5 animate drawing with `stroke-dasharray: 1` without measuring paths.
CSS (tokens only; place in a new `/* Art */` block right after the site-shell block):

```css
.art-stroke { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
.art-stroke.weight-hair { stroke-width: 1.2; }
.art-stroke.weight-bold { stroke-width: 2.8; }
.art-stroke.dashed { stroke-dasharray: 0.02 0.018; } /* units of pathLength */
.art-stroke.tone-blue { stroke: var(--blue); }
.art-stroke.tone-rust { stroke: var(--rust); }
/* …one rule per tone; .art-dot uses fill instead of stroke */
```

**Do not** use `vector-effect: non-scaling-stroke` on art that T5 animates; browsers disagree
on how it interacts with `pathLength` dashing. Stroke widths are in viewBox units, so pick
viewBox sizes close to the rendered size (e.g. 480×300 for a card band).

### Motifs (`app/ode/art.ts`)

All parameters are starting points; tune by eye within tokens. Each motif is a function
returning an `ArtPiece`, plus exported constants computed once (`export const odeCoverArt =
buildCoverArt();`).

**Course cover** — a composition echoing `Logo.png`, arranged so the middle stays empty for
text (the logo puts the title in the middle):

1. *Saddle portrait* (upper corner). Eigenvalues `1`, `-1`; eigenvectors at about 60° and
   −20°. Eigenlines in `blue` with inward/outward chevrons. Trajectories
   `X(t) = a e^{t} v₁ + b e^{−t} v₂` for `a, b ∈ {±0.15, ±0.4, ±0.8}`, `t ∈ [−3, 3]`,
   clipped to a disk; `rust`, one chevron each at the midpoint.
2. *Direction field with a solution* (opposite lower corner). `y' = x² − 1` on a grid inside a
   disk; each arrow a short segment along `(1, y')` normalized, `blue`, hair weight, low
   opacity. Solution `y = x³/3 − x` in `rust`, bold — it is the cubic-looking curve from the
   logo.
3. *Spring and mass* (small, upper opposite corner). A coil (a flattened sinusoidal loop
   path) between a wall block (`gold`) and a mass circle (`blue`), floor line `muted`.
4. Faded equations come from T3, not from paths.
5. The hand-drawn figure is **not** generated. Leave a clear slot (a named empty group or a
   documented position) where the owner's SVG goes when it arrives.

**Chapter motifs** (one each, used in the chapter header):

| Chapter | Motif | Math |
| --- | --- | --- |
| 1 · סדרות וטורים של פונקציות | `f_n(x) = xⁿ` on `[0, 1]` | `n ∈ {1, 2, 3, 5, 8, 13, 21}`, `blue`; the pointwise limit as a `rust` segment on `[0, 1)` at height 0 plus a dot at `(1, 1)` |
| 2 · מבוא למד״ר ומשוואות מסדר ראשון | Solution family | Logistic `y = 1 / (1 + C e^{−x})` for several `C` of both signs clipped to the frame, `blue`; equilibria `y = 0`, `y = 1` dashed `muted` |
| 3 · התורה האיכותית של מד״ר | Orthogonal families | Parabolas `y = c x²` (`blue`) and ellipses `x² + 2y² = k` (`rust`). They are orthogonal: slopes `2y/x` and `−x/(2y)` multiply to −1 |
| 4 · משוואות מסדר גבוה | Damped oscillation | `x(t) = e^{−0.2t} cos(2.2t)`, `blue`; envelopes `±e^{−0.2t}` dashed `muted` |
| 5 · מערכות מד״ר | Spiral sink + eigen-cross | `X(t) = e^{−0.18t}(cos t, sin t)` rotated a little, `blue`, chevrons; a faint saddle cross in `muted` |
| 6 · תורת שטורם ליוביל | Eigenfunctions | `sin(nπx)` on `[0, 1]`, `n = 1…4`, tones `blue`, `rust`, `gold`, `muted`; baseline `muted` |

Export `odeChapterArt: Readonly<Record<number, ArtPiece>>` with keys 1–6.

### Tests

- Determinism: calling each builder twice gives deep-equal output.
- Every number in every `d` (parse with `/-?\d+(?:\.\d+)?/g`) is finite and inside the viewBox
  expanded by a small margin (say 4 units). Every dot too.
- Non-empty: each piece has strokes; each chapter 1–6 has a motif.
- Math spot checks: the chapter 3 families really are orthogonal at a few intersection points
  (compare slopes); RK4 on `y' = y` from `(0, 1)` reaches `e` at `x = 1` to 1e-6 with `h = 0.01`.
- Size budget: total `d` length per piece under the chosen limit.

**Done when:** the tests pass, and a scratch render of every piece (temporary page or
screenshot, not committed) looks right. No component uses the art yet — that is T4.

---

## T3 — Faded equations (phase 3b)

**Goal.** Decorative KaTeX equations at low opacity, never under body text, invisible to
assistive technology.

### Files

- `app/_site/FadedEquations.tsx` — server component, no hooks.
- Catalog in `app/ode/art.ts`: `odeCoverEquations` (and optionally per-chapter ones).
- Test in `app/ode/art.test.ts`: every TeX string renders with `katex.renderToString(tex,
  { throwOnError: true })` in node.

### Design

```tsx
import katex from "katex";

export type FadedEquation = { tex: string; x: string; y: string; rotate?: number; size?: "sm" | "md" | "lg" };

export function FadedEquations({ items }: { items: readonly FadedEquation[] }) {
  return (
    <span className="faded-equations" aria-hidden="true">
      {items.map((item) => (
        <span
          key={item.tex}
          className={`faded-equation size-${item.size ?? "md"}`}
          dir="ltr"
          style={{ "--x": item.x, "--y": item.y, "--rotate": `${item.rotate ?? 0}deg` } as CSSProperties}
          dangerouslySetInnerHTML={{ __html: katex.renderToString(item.tex, { throwOnError: true, output: "html" }) }}
        />
      ))}
    </span>
  );
}
```

Per-item positions are data, which is the one case where the design rules allow inline
`style` (as custom properties). `output: "html"` skips the hidden MathML copy; the whole block
is `aria-hidden` anyway. KaTeX CSS is already loaded globally in `app/layout.tsx`.

CSS: `.faded-equations` is `position: absolute; inset: 0; overflow: hidden;
pointer-events: none`. `.faded-equation` uses `left: var(--x); top: var(--y); transform:
rotate(var(--rotate))`, `color: var(--blue)` (or `--ink`), `opacity` around 0.12–0.18,
`white-space: nowrap`, and `direction: ltr; unicode-bidi: isolate`. Use `left`, not
`inset-inline-start`: in RTL the logical property flips and the positions stop matching the
catalog.

**Catalog** (from `Logo.png`):

```
\frac{d}{dx}\Big(p(x)\frac{dy}{dx}\Big)+q(x)\,y=-\lambda\, r(x)\,y
\frac{d}{dx}W[y_1,\dots,y_n]=-a_{n-1}(x)\,W[y_1,\dots,y_n]
W[y_1,\dots,y_n](x)=\det\begin{pmatrix}y_1&\cdots&y_n\\\vdots&\ddots&\vdots\\y_1^{(n-1)}&\cdots&y_n^{(n-1)}\end{pmatrix}
\ddot x=-kx
z=\frac{y}{x}
z=y^{1-n}
```

Run `node scripts/verify-math-size-tokens.mjs` after the CSS. If it objects to a raw font
size, express sizes relative to the existing `--math-size-*` tokens.

**Done when:** the render test passes; equations display correctly (LTR, not reordered) in a
scratch render; nothing is focusable or announced.

---

## T4 — Place the art (phase 3c)

**Goal.** Art at the edges only (locked decision 9): dashboard card, course page header,
chapter headers, and optionally the empty state of chapters without modules. **Nothing inside
module labs or practice areas, nothing in the chapter rail.**

**Role.** `.agents/design.md`.

### Where and how

1. **Dashboard card** (`CourseCard.tsx`). Add an art band at the top of the card: `<span
   className="course-card-art" aria-hidden="true">` containing `ArtSvg` (cover) and
   `FadedEquations` (a subset of the cover catalog). Give `CourseSummary` an `art` field
   (`{ cover: ArtPiece; equations: readonly FadedEquation[] }`) filled in `app/courses.ts`.
   This is safe: `CourseSummary` never crosses to a client component (until T5, which passes
   rendered JSX, not data). The band gets a fixed aspect ratio (around 16∶7), a
   `--paper-deep` or transparent background, and a bottom border in `--line`. Text stays below
   the band, never on it.
2. **Dashboard hero** (optional). Faded equations at the far edges of `.dashboard-hero`,
   clear of the heading and paragraph at every width. Skip if it crowds.
3. **Course page** (`CourseMaterialsPanel.tsx`). A compact cover motif at the inline-end
   edge of the panel header (the physical left side in RTL), beside «חומר הקורס», not behind
   the lead text. Hide it at ≤820px.
4. **Chapter headers** (`ChapterPanel.tsx`). Add an optional `art?: ArtPiece` prop;
   `OdeChapterPage` passes `odeChapterArt[chapter]`. Render it absolutely positioned inside
   `.chapter-panel-header` (`position: relative; isolation: isolate` on the header) at the
   inline-end side, with `pointer-events: none`, `z-index: -1`, reduced opacity, and a
   `mask-image` gradient fading toward the text. Verify the fade direction visually; RTL makes
   it easy to get backwards. The title and the «פתיחת הפרק ברשימות» link must never sit on
   top of strokes. At ≤820px shrink it behind the big numeral or hide it.
5. **Empty state** (optional). Chapters 2, 3 and 6 show «לפרק זה עדיין אין מודולים
   אינטראקטיביים…». A small, very faint version of the chapter motif beside that note is
   allowed; skip if it looks decorative for its own sake.
6. **The owner's figure.** When the SVG arrives: recolor every fill and stroke to token
   classes (no hex survives), inline it in the cover slot from T2, `aria-hidden`. Until then
   the cover works without it.

### Verify

At 1540, 1180, 820 and 390px, on `/`, `/ode`, `/ode/1`, `/ode/4`, `/ode/6`:

- No horizontal overflow (`document.documentElement.scrollWidth === innerWidth`).
- No text over strokes. Check it yourself: screenshot, and compare the text boxes with the
  art box via `getBoundingClientRect()`.
- `rg -n "#[0-9a-fA-F]{3,8}\b" app/globals.css` shows no new hex values compared with before
  (diff the count).
- Module pages look exactly as before.

**Done when:** all of the above hold, and tests, typecheck, lint, build and the
math-size-token script pass.

---

## T5 — Course-entry transition (phase 3d)

**Locked behavior** (plan decision 8 and phase 3 step 4): runs on the dashboard at click time,
never on course-page mount; the only text is the course title «משוואות דיפרנציאליות רגילות»
(use `course.title`, which is exactly that string); about 1.5s; click or Esc skips;
`prefers-reduced-motion` gets a short fade; modifier and middle clicks are not intercepted.

**Role.** `.agents/design.md`.

### Files

- New `app/_site/clicks.ts` — pure `isPlainLeftClick(event)` taking a minimal interface
  (`defaultPrevented`, `button`, `metaKey`, `ctrlKey`, `shiftKey`, `altKey`). Refactor
  `notesTargetFromClick` in `useNotesReader.ts` to use it. Test it in `app/_site/clicks.test.ts`.
- New `app/_site/CourseEntry.tsx` (`"use client"`).
- `CourseCard.tsx` renders its content through `CourseEntry`.
- CSS: a `/* Course-entry transition */` block next to the art block, plus the file's first
  `@media (prefers-reduced-motion: reduce)` block.

### Mechanics

`CourseEntry({ href, title, cover, className, children })`, where `cover` is a React element
(the server-rendered `ArtSvg` + `FadedEquations`), passed from the server component
`CourseCard`. Passing JSX as a prop from a server component to a client component is allowed;
passing the raw `ArtPiece` data would work too but duplicates it in the payload.

1. Render a **plain `<a href={href} className="course-card">`**, not `next/link`. Relying on
   `Link` to respect `preventDefault()` is unverified on vinext; a plain anchor plus
   `useRouter()` is predictable.
2. `onPointerEnter` and `onFocus`: `router.prefetch(href)` once.
3. `onClick`: if `!isPlainLeftClick(event)`, return (the browser opens a new tab as usual).
   Otherwise `preventDefault()`, read the card's `getBoundingClientRect()`, and start.
4. Render the overlay with **`createPortal(…, document.body)`**. The card has
   `backdrop-filter` and a hover `transform`, both of which trap `position: fixed`
   descendants (§3). Inside the portal, `background: inherit` picks up the body's paper and
   grid.
5. Timeline (constants at the top of the file, easy to tune):
   - 0–450ms: the overlay grows from the card rect to full screen. Animate `clip-path:
     inset(top right bottom left round 8px)` → `inset(0 round 0)` with the Web Animations API
     (`element.animate`), so no per-frame React state.
   - 300–1100ms: add `is-drawing`; cover strokes draw via CSS (`stroke-dasharray: 1;
     animation: art-draw 700ms ease forwards; animation-delay: calc(var(--i) * 35ms)` with
     `@keyframes art-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }`).
     Dashed strokes fade in instead of drawing, since they already use `stroke-dasharray`.
     `ArtSvg` gets an `animated` prop that sets `--i`.
   - 600ms: the title fades in, centered, large (use the `h1` scale), `--ink`.
   - ~1400ms: `router.push(href)`.
6. **Skip:** a click on the overlay or Esc (keydown listener on `window` while active) calls
   `router.push(href)` immediately. Guard every push with a ref so it happens once.
7. **Reduced motion:** check `window.matchMedia("(prefers-reduced-motion: reduce)")` at click
   time: no clip or draw, a 150ms opacity fade, then push. Mirror it in CSS so strokes never
   animate under that setting.
8. **Leaving:** do not remove the overlay on a timer. When the route changes, the dashboard
   unmounts and the overlay goes with it. If the push is slow, the overlay simply stays. Clear
   timers and listeners on unmount.
9. **Scroll lock:** toggle a class on `document.documentElement` (e.g. `course-transition-open`
   with `overflow: hidden` in CSS) instead of writing inline styles; remove it on unmount.
10. **Accessibility:** the overlay is `aria-hidden="true"`; it is a visual flourish over a
   navigation that the link already describes.

### Verify (both toolchains)

- Dev (vinext) and `npm run build` + `npx next start -p 3002`:
  - Click the card: the animation plays, and `/ode` loads with nothing left over.
  - Direct load or refresh of `/ode`: no animation.
  - Back from `/ode` to `/`: a clean dashboard, no stuck overlay, and the page scrolls.
  - Click during the animation skips to `/ode`.
- Modifier clicks: covered by the `isPlainLeftClick` unit test. Do not dispatch synthetic
  Ctrl-clicks in the browser — they may open real tabs.
- Esc: the embedded browser can't send trusted keys; list it for the owner to check.
- Reduced motion: `Emulation.setEmulatedMedia` with
  `{ features: [{ name: "prefers-reduced-motion", value: "reduce" }] }`, then click: a short
  fade only. Reset the emulation afterwards.
- Mid-animation screenshots: trigger the click from `Runtime.evaluate`, wait ~500ms and
  ~1000ms inside the same evaluate (or in quick successive calls), and screenshot.
- If `router.push` or `prefetch` misbehaves on vinext, fall back to
  `window.location.assign(href)` for the push and report it; do not add a dependency.

**Done when:** the checks above pass under both toolchains, and tests, typecheck, lint and
build pass.

---

## T6 — Phase 3 documentation (phase 3e)

Read `.agents/scribe.md` and follow its method (diff first, surgical edits, verify counts).

- `.agents/design.md`:
  - add an "Art" section: edges only; tokens only; inline SVG via `ArtSvg`; `aria-hidden`;
    no `<marker>`; `pathLength=1` for drawing; no `non-scaling-stroke` on animated art;
    never under body text; nothing in labs, practice or the rail; faded equations via
    `FadedEquations`;
  - fix its stale facts: the file size (it still says ~3,520 lines — count it) and
    `--paper-deep`, which is now used by the reader, not "Reserved";
  - add the reduced-motion rule.
- `ARCHITECTURE.md`:
  - §2 `_site` table: `art/`, `ArtSvg`, `FadedEquations`, `CourseEntry`, `clicks.ts`;
  - `app/ode/art.ts` in the course data table;
  - the tests rows;
  - §8: an art pattern bullet, the transition, the reduced-motion row, the CSS line count;
  - the "what is still missing" list.
- The plan: phase 3 status and any differences from its steps.
- `.agents/glossary.md`: only if you added student-facing text.
- `AGENTS.md`: the `globals.css` line count in the repository map.

---

## T7 — Optional: reader width between 1181 and 1360px

Between 1181px and roughly 1360px the chapter rail still sits beside the panel, so the
reader's viewer column is narrow (~560px). Possible fixes: start with the TOC collapsed in
that range, or narrow the rail's `minmax(230px, 290px)`. Only on the owner's request; show
him screenshots of the options first.

---

## Phase 4 — module reorganization

Each item is its own task and needs the owner's go-ahead. Read the plan's phase 4 first.

### T8 — Shared math UI and RNG (plan 4b)

**Precondition:** the owner has committed the Euler work (§1). This task edits Euler files, and
mixing it into his uncommitted changes would make both unreviewable.

- Create `app/_shared/` (no `page.tsx`, so never a route) with one `MathText`, one
  `DisplayMath`, one `mathTypography`, and `random.ts` (`SeededRandom`, `mixSeed`).
- Today there are four copies of the math UI: local definitions inside `phase-plane-module.tsx`,
  plus `components/MathText.tsx`, `components/DisplayMath.tsx` and `math/mathTypography.ts` in
  each of `constant-coefficients-euler`, `linear-homogeneous` and `function-sequences-series`.
  Diff them first; if they differ, stop and report rather than picking a winner silently.
- Move `SeededRandom` from `app/constant-coefficients-euler/practice/random.ts`, and update
  every import. Search by name, not by path — the Euler module imports it relatively as
  `./random` or `../random`: `rg -n "SeededRandom|mixSeed" app scripts`.
- Update the `AGENTS.md` rule that names the old RNG path, and `ARCHITECTURE.md` §10 — the
  "deliberate duplication" and "single cross-module import" observations stop being true;
  rewrite them, do not just delete them.
- Run `node scripts/verify-math-size-tokens.mjs`, every `scripts/verify-*.ts` that imports the
  moved files, and the full checks.
- In the phase-plane monolith, touch only the local math-UI definitions and their imports.

### T9 — Split the function-sequences module (plan 4a)

Ask the owner for module names, URLs and which sections each covers (the plan suggests 1.1
sequences, 1.2 series, 1.3 power and Taylor series). Then:

- New module folders following the layered pattern in `AGENTS.md`, each with a route
  `app/ode/1/<module>/page.tsx` and an entry in `app/ode/course.ts`. `course.test.ts` fails if
  a route is missing or a section is outside the chapter.
- Keep `/ode/1/function-sequences-series` working: either a redirect to the first new module
  or removal plus a redirect from the old flat URL. Ask which.
- The roadmap intro is superseded by the chapter 1 panel; move any content worth keeping.
- The four content tabs are placeholders today, so this is mostly structure.

### T10 — Move module folders under `app/ode/` (plan 4c)

Optional in the plan and costly (imports, vitest globs, scripts). Do not start unless asked.

---

## Report template (Hebrew, to the owner)

1. The outcome in one or two sentences: what students now see.
2. What you checked, with numbers (tests, widths, toolchains).
3. What you could not check and what he should look at, as concrete steps (URL, what to click,
   what to expect).
4. Anything you noticed but left alone, and why.
5. The next task from the table in §0, if any, via AskQuestion.
