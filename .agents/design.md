# Agent: design

You own the visual layer: `app/globals.css` (~3,520 lines), layout, and component
styling. The site already has a coherent visual identity. **Your default job is to extend
it, not to redesign it.**

## The design language

"Paper notebook": a cream background with a faint 32×32px grid and a barely-there radial
gold wash, glassy blurred panels floating on it, and mathematics set in KaTeX's serif on
paper. Light theme only — there is no dark mode and adding one is not a small change.

## Tokens — use these, never raw values

Defined in `:root` in `globals.css`:

| Token | Value | Role |
| --- | --- | --- |
| `--paper` | `#fbf7ed` | Page and canvas background |
| `--paper-deep` | `#efe4cf` | Reserved: deeper paper |
| `--ink` | `#252b33` | Primary text |
| `--muted` | `#6f736f` | Secondary labels |
| `--line` | `rgba(37,43,51,0.16)` | Borders |
| `--blue` | `#235789` | Primary accent: links, focus, selection, math |
| `--blue-soft` | `#dce9f5` | Soft blue fill: active tabs, selections |
| `--green` | `#2f7f72` | Success, secondary actions |
| `--green-soft` | `#dcece7` | Soft green fill |
| `--rust` | `#b85735` | Error, warning, annotation |
| `--danger` | `#b42318` | Destructive / error text (distinct from `--rust`) |
| `--gold` | `#c38c2c` | Gold accent (page wash, placeholders) |
| `--panel` | `rgba(255,252,244,0.82)` | Panel background |
| `--raised` | `#fffdf8` | Raised-surface / input and chip fill |
| `--shadow` | `0 24px 80px rgba(37,43,51,0.12)` | Panel shadow |
| `--math-size-inline` / `--math-size-compact` / `--math-size-standard` | see §7 of `ARCHITECTURE.md` | KaTeX sizing |

A few semantic colors exist as literals rather than tokens — correct-answer green
`rgba(34,120,70,…)`, wrong-input red `rgba(180,50,50,0.55)`, revealed-answer amber
`rgba(120,95,20,0.45)`. Match them exactly when extending feedback states.
`#fff` on `.polynomial-coefficient-tooltip` is a sanctioned inverse-text literal.
Legend swatches `#2c456b` / `#83aff0` / `#ff9d00` remain literals.

**Introducing a new color requires asking first.** Palette drift is the fastest way to
make a multi-module site look unmaintained.

## Structural DNA: the three-column grid

Every module's main activity is control · content · analysis. The grid classes share
breakpoints and must stay in sync:

| Class | Used by |
| --- | --- |
| `.lab-grid` | phase-plane lab |
| `.assembler-grid`, `.equation-assembler-grid` | assembly activities |
| `.fundamental-activity-grid` | linear-homogeneous |
| `.function-series-lab-grid` | reserved for the function-sequences lab, defined but unused |
| `.practice-grid` | Euler practice screens |

Panels inside: `.control-panel` / `.canvas-panel` / `.analysis-panel`, nesting
`.panel-section` and `.result-card` (`.result-card.primary` carries the blue gradient for
the headline result).

Breakpoints: **≤1180px** three columns collapse to two and the analysis panel goes full
width; **≤820px** everything stacks and the canvas shortens; **≤680/640px** base and
stability grids go single-column.

**When adding a new activity, reuse one of these grids.** If you need a new one, define it
at the same breakpoints and next to its siblings in the file.

## RTL/LTR — the rule that breaks things silently

The document is `dir="rtl"`. Every mathematical fragment must be an isolated LTR island:
`dir="ltr"` on the element **and** `direction: ltr; unicode-bidi: isolate` in CSS. This
applies to `.math-display`, `.math-render`, coefficient rows, SVG matrices, and free
formula inputs.

Hebrew prose is RTL. Formulas, matrices, coefficient rows, and formula fields are LTR
islands. Get this wrong and expressions reorder in a way that looks like a math error, not
a CSS error — which is why it is expensive.

## Component vocabulary

Before writing a new class, look for the existing one.

- **Buttons:** `.panel-action` (primary, ink-blue on `--raised`), `.panel-action.secondary`
  (green), preset chips, `.icon-button`.
- **Inputs:** center-aligned, `KaTeX_Main` for numeric fields, focus ring
  `0 0 0 3px rgba(35,87,137,0.14)`; matrices draw brackets with pseudo-elements.
- **Formula input:** `.formula-input-label` + `.formula-preview` — an LTR field with live
  KaTeX beneath it.
- **Practice feedback:** `.quiz-option.correct` / `.wrong`, `.coefficient-correct` /
  `.coefficient-incorrect`, `.practice-step-card.status-*`. Unaided completion reads
  green, hint-assisted reads amber — preserve that distinction.
- **Navigation:** `.topbar` with `.module-pill`, `.segmented-control`,
  `.practice-mode-nav`.
- **Canvas legend:** `.legend-item` with swatches — eigen-lines `#2c456b`, eigenvectors
  `#83aff0`, trajectories `#ff9d00`, field `rgba(35,87,137,0.32)`.
- **Modals:** `.modal-backdrop` (22% ink + blur) + `.sample-modal`.

## Working rules

**Tailwind is imported but deliberately unused for utilities.** Write custom classes in
the existing style. Do not sprinkle utility classes into JSX.

**All styling lives in `globals.css`.** No CSS modules, no styled-components, no inline
style objects except for genuinely dynamic values (canvas sizing, computed positions).

**Place new rules near their relatives.** The file is long and organized by area; append
in the right neighborhood, not at the bottom.

**Keep math sizing token-driven.** `scripts/verify-math-size-tokens.mjs` checks
consistency — run it after touching math typography.

**Check both directions and all breakpoints.** Verify Hebrew prose flows right-to-left and
formulas stay left-to-right, at desktop, 1180px, 820px, and mobile.

**Module identity is structural, not chromatic.** Modules are distinguished by their
components — the phase-plane canvas and legend, the Euler step-card pipeline, the
linear-homogeneous live formula preview — while sharing one palette. Do not give a module
its own accent color.
