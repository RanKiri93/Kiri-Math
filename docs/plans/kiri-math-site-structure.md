# Kiri Math — multi-course site structure

**Verdict:** feasible on the current stack with no new dependency. The change adds two
navigation levels above the existing modules (dashboard → course → chapter → module). Module
internals are untouched until phase 4.

Decisions locked 23 בספטמבר 2026 in discussion with the course owner. Phase 1 (skeleton) and
phase 2 (notes reader) were implemented the same day; phase 2 still needs a look in real
browsers. Phases 3–4 have not started.

---

## Locked decisions

Do not reopen these in code.

1. **Working name «Kiri Math».** The wordmark is Latin, so it is an LTR island (`dir="ltr"` +
   `unicode-bidi: isolate`) inside the RTL page.
2. **Dashboard «הקורסים שלי» at `/`.** It reads a static course registry. No login now; the
   registry is shaped so a per-user filter can be added later without changing its consumers.
3. **Course, chapter and module are routes.** Tabs *inside* a module stay component state. The
   AGENTS.md rule "Tabs are component state, not routes" keeps its meaning at module level and
   must be reworded to say so.
4. **Chapter numbering follows the lecture notes** (`main.toc`), not the order of the old home
   page. Function series is chapter 1.
5. **Notes viewer = the browser's native PDF viewer in an iframe**, opened at `#page=N`,
   wrapped in one component. It must look native to the site — our own frame, header and table
   of contents — not a bare embedded window. PDF.js is a possible later upgrade behind the same
   component, not part of this plan.
6. **«חומר הקורס» shows:** the notes (always), the extended syllabus, and a formula sheet when
   the course has one. No homework, no exams.
7. **Palette unchanged, site-wide.** Course and chapter artwork is drawn in the existing tokens.
   No new color tokens. `Logo.png` (in the notes folder) is the *style reference*, not an asset:
   its blue and orange are off-palette and it is raster.
8. **The course-entry transition runs on the dashboard at click time**, not on course-page
   mount. Direct links and refreshes never replay it, and no browser storage is needed. Its only
   text is the course title, «משוואות דיפרנציאליות רגילות» — no «ברוכים הבאים».
9. **Art lives at the edges** — dashboard cards, course header, chapter headers, empty states.
   Lab and practice work areas stay plain paper. Course identity is illustrative, not chromatic
   (extends the existing "module identity is structural" rule).
10. **Course slug is `/ode`.**

---

## Target structure

### Routes

```
/                                  Dashboard «הקורסים שלי»
/ode                               Course page, panel «חומר הקורס»
/ode/1 … /ode/6                    Chapter panels
/ode/1/function-sequences-series   Modules (existing module shells, unchanged inside)
/ode/4/linear-homogeneous
/ode/4/constant-coefficients-euler
/ode/5/phase-plane
```

Old URLs redirect (students may already hold links):

| Old | New |
| --- | --- |
| `/phase-plane` | `/ode/5/phase-plane` |
| `/constant-coefficients-euler` | `/ode/4/constant-coefficients-euler` |
| `/linear-homogeneous` | `/ode/4/linear-homogeneous` |
| `/function-sequences-series` | `/ode/1/function-sequences-series` |

**Static folders, not dynamic segments.** `npm run dev` runs vinext but `npm run build` runs
`next build`. Phase 1 uses only plain folders, `page.tsx` files and `redirect()` from
`next/navigation` — no route groups, parallel routes or `[param]` segments — so both toolchains
behave identically. Six trivial chapter pages are cheaper than debugging a router difference.
Dynamic `[course]/[chapter]` routing can come when there is a second course.

**No course-level `layout.tsx` for the chapter rail.** Modules live under `/ode/...` and need the
full 1540px width for their three-column grids. The rail is rendered by a `CourseShell`
component that the course page and the chapter pages include explicitly; module pages do not.

### Content model

Three kinds of content, and only three:

| Kind | Source | Appears in |
| --- | --- | --- |
| **Notes section** | Generated from `main.toc` (number, title, page). Never handwritten — page numbers move on every edit of the notes. | «חומר הקורס» table of contents; chapter panels |
| **Module** | Existing interactive units. Fixed anatomy: מבוא (short, with a «לקריאה ברשימות §x.y» link) · one or more exploration activities · one or more practice modes. Attached to specific sections. | Chapter panels |
| **Resource** | Static PDFs: syllabus, formula sheet. | «חומר הקורס» |

Module ↔ section mapping (data, in `app/ode/course.ts`):

| Module | Chapter | Sections | Status |
| --- | --- | --- | --- |
| `function-sequences-series` | 1 | 1.1, 1.2, 1.3 | בבנייה |
| `linear-homogeneous` | 4 | 4.2, 4.3 | בבנייה |
| `constant-coefficients-euler` | 4 | 4.4, 4.5, 4.6 | פעיל |
| `phase-plane` | 5 | 5.2, 5.3 | פעיל |

Chapters 2, 3 and 6 have no module yet. A chapter panel must read well with notes sections
only.

### Code layout

```
app/
  page.tsx                     dashboard (rewritten)
  layout.tsx                   metadata → «Kiri Math», title template "%s · Kiri Math"
  courses.ts                   course registry: CourseSummary per course (art id: phase 3)
  _site/                       shared shell components; no page.tsx, so never a route
    courseModel.ts             types + pure helpers (page offset, crumbs, lookups), no React
    CourseCard.tsx, CourseShell.tsx, ChapterRail.tsx, Breadcrumbs.tsx, BrandWordmark.tsx,
    CourseMaterialsPanel.tsx, ChapterPanel.tsx, NotesSectionList.tsx
    notesNavigation.ts (+test) phase 2: pure target → page / previous / next, viewer URL
    useNotesReader.ts          phase 2: desktop matchMedia gate, link-click interception
    NotesFrame.tsx, NotesToc.tsx, NotesReader.tsx, NotesDialog.tsx     phase 2
    CourseTransition.tsx       phase 3
    art/                       phase 3: pure TS path generators (no React) + tests
  ode/
    course.ts                  chapters, module→section mapping, resources
    notesToc.ts                GENERATED by scripts/sync-course-notes.ts — do not edit
    course.test.ts             registry/mapping invariants
    OdeChapterPage.tsx         shared chapter page + page metadata helpers
    OdeModuleBreadcrumbs.tsx   breadcrumbs rendered inside the module topbars
    page.tsx                   «חומר הקורס»
    1/page.tsx … 6/page.tsx    thin: <OdeChapterPage chapter={n} />
    1/function-sequences-series/page.tsx     thin: renders the module component
    4/linear-homogeneous/page.tsx
    4/constant-coefficients-euler/page.tsx
    5/phase-plane/page.tsx
  phase-plane/page.tsx         redirect()
  constant-coefficients-euler/ module code stays; page.tsx → redirect()
  linear-homogeneous/          module code stays; page.tsx → redirect()
  function-sequences-series/   module code stays; page.tsx → redirect()
public/courses/ode/
  notes.pdf, syllabus.pdf, formula-sheet.pdf   copied by the sync script
scripts/sync-course-notes.ts   manual, like verify-*.ts
```

`app/constant-coefficients-euler/page.tsx` and `app/linear-homogeneous/page.tsx` currently *are*
the module shells. Their bodies move to `ConstantCoefficientsEulerModule.tsx` /
`LinearHomogeneousModule.tsx` in the same folder (the pattern `function-sequences-series`
already uses), and the old `page.tsx` becomes a server-component redirect.

---

## Plan

### Phase 1 — skeleton

No art, no embedded viewer, no animation. Plain but complete navigation.

1. **Sync script.** `scripts/sync-course-notes.ts` reads `../../main.toc` (UTF-8), writes
   `app/ode/notesToc.ts` (chapters → sections → printed page), and copies `main.pdf`,
   `ExtendedSyllabus_winter2026.pdf` and `FormulaSheet.pdf` into `public/courses/ode/`. The PDF and
   the TOC are always synced together.
2. **Registries.** `app/courses.ts` (one entry, `ode`) and `app/ode/course.ts` (chapters from
   `notesToc`, the module mapping above, resources). Pure TS, no React.
3. **Dashboard.** `app/page.tsx` → brand, «הקורסים שלי», one `CourseCard` linking to `/ode`.
4. **Course page and chapter pages** inside `CourseShell`: header with brand and breadcrumbs,
   `ChapterRail` (side rail ≥1180px; horizontal numbered strip below). «חומר הקורס» lists every
   chapter and section; in this phase a section opens `notes.pdf#page=N` in a new tab. Resource
   cards for syllabus and formula sheet. Chapter panel: numeral, title, its sections, and module
   cards (reuse `.course-module-card`).
5. **Module routes and redirects** as in the tables above.
6. **Breadcrumbs in module topbars.** In each of the four module shells, replace the
   `course-kicker` line and the «עמוד הבית» link with `<Breadcrumbs moduleId=…/>`
   (Kiri Math › משוואות דיפרנציאליות רגילות › פרק n › module title). Nothing else in the modules
   changes. `phase-plane-module.tsx` is ~5,400 lines — locate its topbar with `rg` in the shell
   (see AGENTS.md on search), edit only that block.
7. **Conventions.** Reword the tabs rule in `AGENTS.md`; update its repository map. `scribe`
   updates `ARCHITECTURE.md` (§1 site map, §2 routing, new section for the shell).

**Done when:**
- `/`, `/ode` and `/ode/1` … `/ode/6` render; each of the four modules works unchanged at its new
  URL; the four old URLs redirect — checked under both `npm run dev` and `npm run build` +
  `npm start`.
- `app/ode/course.test.ts` passes: chapter ids are 1–6 and unique; every module's sections exist
  in `notesToc`; every module's sections belong to its chapter; every module `href` has a
  `page.tsx` on disk.
- `npm test`, `npm run typecheck`, `npm run lint` pass.

**Status: done, 23 בספטמבר 2026.** All done-when conditions were checked, including the
redirects under `next build` + `next start`. Differences from the steps above:

- The sync script also reads the printed-page offset from the PDF's `/PageLabels` table
  (4 front-matter pages), so phase 2 step 2 is already done. It normalizes titles to Hebrew
  punctuation (״ ׳ – ־) and fails if any LaTeX survives.
- Modules render `OdeModuleBreadcrumbs` (a course-bound wrapper around `Breadcrumbs`), since a
  module needs its course to resolve its crumbs. The module tab `nav` lost its home link, so
  its `aria-label` is now «לשוניות המודול» rather than «ניווט באתר».
- Below 1180px the rail becomes a wrapping strip rather than a scrolling one: «חומר הקורס» and
  the current panel keep their labels, and the other chapters shrink to number chips (label kept
  for screen readers and as a tooltip). A scrolling strip pushed the current chapter off-screen.
- Section rows show the module tags covering each section, linked to the module.

### Phase 2 — «חומר הקורס» reader

1. **`NotesReader`** — iframe on the native viewer inside a site-styled frame: header strip with
   the current chapter/section, previous/next section, «פתיחה בלשונית חדשה», «הורדה».
   Candidate open parameters: `#page=N&view=FitH&navpanes=0`, `toolbar=0` if our own header
   covers download. Decide by looking at it in Chrome, Edge and Firefox; Firefox ignores some of
   these.
2. **Section → page.** Done in phase 1: `notesPageHref` adds the offset that the sync script
   reads from the PDF. Still to do: confirm it by eye in each browser on the first, a middle and
   the last section.
3. **Where the reader appears.** Inline on the course page (TOC column + reader). From a chapter
   panel section or a module's «לקריאה ברשימות» link it opens as an overlay drawer (reuse
   `.modal-backdrop`) — no navigation, no URL state.
4. **Mobile (≤820px).** No iframe: Android Chrome does not render inline PDFs and iOS is
   partial. Sections open the PDF in a new tab. Mount the iframe only when a `matchMedia`
   check passes — a CSS-hidden iframe still downloads the 2.9MB file.

**Done when:** any section opens at the correct page on desktop Chrome, Edge and Firefox; at
≤820px no iframe is in the DOM and sections open in a new tab; the frame passes a `design`
look-over at 1540 / 1180 / 820 px.

**Status: built 23 בספטמבר 2026; the by-eye check in real browsers is outstanding.** Differences
from the steps above:

- Chapter panels open the reader in a centered native `<dialog>` (`showModal()`), not a drawer
  on `.modal-backdrop`. The top layer escapes the containing block that the panel's
  `backdrop-filter` creates, and Esc and focus return come for free.
- `toolbar=0` is on: the frame's own bar covers «פתיחה בלשונית חדשה» and «הורדה», and it hides
  the dark Chrome/Edge toolbar. Firefox's PDF.js ignores it and keeps its toolbar.
- The reader opens on the cover. A chapter whose first section starts on the chapter page opens
  as that section; otherwise the chapter's intro page is a stop of its own between sections.
- In the narrow reader column, section rows drop the page number (the frame bar shows it) and
  put module tags on their own line.
- Module «לקריאה ברשימות» links are not done: they touch module internals.
- Checked: section pages match the PDF's own hyperref destinations (`section.N.M`, 35 of 35);
  layout and behavior at 1580, 1000 and 390 px in Cursor's browser, including dialog open, close,
  backdrop click and focus return. Not seen: the native viewers themselves. Cursor's browser does
  not render PDFs, headless Edge and Firefox do not paint them, and Esc could not be sent as a
  trusted key.

### Phase 3 — visual layer (`design` agent)

1. **Art generators** in `app/_site/art/`: pure functions returning SVG path data from real
   mathematics (small standalone RK4, explicit curve families). Deterministic; tested for
   determinism and bounding box. Rendered as inline SVG so strokes can use `var(--blue)`,
   `var(--rust)`, `var(--gold)`, `var(--ink)`, `var(--muted)` at low opacity, and so the course-entry
   transition can animate `stroke-dashoffset`.
2. **Faded equations** rendered with KaTeX, low opacity, `aria-hidden`, never under body text.
3. **Motifs.** Course cover (from `Logo.png`: saddle portrait, direction field with a solution,
   spring, Wronskian, Sturm–Liouville). Chapter headers: 1 — \(f_n(x)=x^n\) converging;
   2 — a family of solution curves; 3 — direction field and orthogonal families; 4 — damped
   oscillation; 5 — saddle and spiral; 6 — \(\sin(n\pi x)\) and the Sturm–Liouville equation.
4. **Course-entry transition** in `CourseTransition`: on a plain left click the card expands to
   full screen, the cover strokes draw, the course title «משוואות דיפרנציאליות רגילות» appears,
   then `router.push` (route prefetched on hover). ~1.5s. Click or Esc skips.
   `prefers-reduced-motion` → short fade. Modifier clicks (Ctrl/Cmd/middle) are not intercepted,
   so «open in new tab» still works.
5. `.agents/design.md` gains the art rules (edges only, tokens only, inline SVG, `aria-hidden`).

**Done when:** no new hex or color token in `globals.css`; direct load of `/ode` shows no
animation; skip, reduced-motion and modifier-click behave as above; text over art meets WCAG AA;
checked at 1540 / 1180 / 820 / 390 px.

### Phase 4 — module reorganization (separate tasks, each its own order)

- **4a.** Split `function-sequences-series` into section modules (1.1 sequences, 1.2 series,
  1.3 power and Taylor series). Its roadmap intro is superseded by the chapter 1 panel. Cheap
  while all four content tabs are placeholders.
- **4b.** One shared copy of `MathText` / `DisplayMath` / `mathTypography` and of
  `SeededRandom` under `app/_shared/` (four copies → one). Run
  `scripts/verify-math-size-tokens.mjs`.
- **4c.** Optional: move module folders under `app/ode/`. Import paths, vitest globs and scripts
  all change — only worth it if the flat layout starts to hurt.

Splitting `phase-plane-module.tsx` is out of scope.

---

## Copy

New student-facing strings go through `hebrew-copy` and into `.agents/glossary.md`: הקורסים
שלי, חומר הקורס, רשימות הקורס, פרק, לקריאה ברשימות, סילבוס מורחב, דף נוסחאות, פתיחה
בלשונית חדשה, הורדה.

---

## Risks

- **Two toolchains.** vinext (dev) and `next build` (production build) can disagree on routing
  features. Phase 1 deliberately uses only the plainest ones; verify redirects under both.
- **Page offset.** Printed page ≠ physical page. A wrong offset sends every link a few pages
  off and looks like sloppy notes, not a bug. Measure, store, verify three sections.
- **Notes drift.** The PDF in `public/` and `notesToc.ts` must come from the same build of the
  notes. The script copies both in one run; never edit `notesToc.ts` by hand.
- **Class-name collision.** Today `.course-home`, `.course-hero` and `.course-kicker` mean "the
  ODE home page". New classes use `.dashboard-*`, `.course-shell-*`, `.chapter-*`, `.notes-*`,
  `.art-*`, `.course-transition-*`. Remove the dead ones after phase 1 (confirm with `rg` on
  `globals.css`, not the structured search tool).
- **`globals.css` growth.** Roughly 500–800 new lines. Put them in one clearly marked "site
  shell" area next to the shell/topbar rules. Splitting the file is a separate decision.
- **Public PDFs.** Everything in `public/` is world-readable. Acceptable now; see below.

---

## Future (not planned, needs its own decisions)

Registration and a per-user course list; serving PDFs through the Worker behind an auth check
(`vite.config.ts` already knows about optional D1 and R2 bindings); progress tracking. All of
these reverse the "no persistence" rule and must be raised with the owner first.

---

## Open items for the owner

- Hand-drawn elements of `Logo.png` that cannot be generated (the figure with question marks):
  the owner will try to supply a vector version later. Phase 3 must not block on it — the cover
  works without the figure, and the figure slots in when it arrives.
