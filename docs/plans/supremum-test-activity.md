# Plan — "Supremum test: computing and arguing" (ODE 104136, chapter 1, function sequences)

Written 2026-09-29 by the activity-planner role; **revised the same day after the lecturer's
decisions** (input = guided templates; core catalogue fixed to three examples). Planning only,
no production code.
Context read: `AGENTS.md`, `ARCHITECTURE.md` §6, `HANDOFF.md` (2026-09-29 checkpoint),
`.agents/engines.md`, `.agents/question-designer.md`, `.agents/glossary.md`, the lab source in
`app/function-sequences-series/` (`SubjectModule.tsx`, `ConvergenceLab.tsx`, `ConvergenceUI.tsx`,
`PairedConvergenceActivity.tsx`, `SequencePlot.tsx`, `math/convergence.ts`,
`math/sequencePlot.ts`, `lessonProgress.ts`), `app/linear-homogeneous/math/formulaParser.ts`,
and notes printed pp. 1–9.

## Verdict

**Feasible with caveats.** Every student answer is a guided template with slots, a choice, a
reason checklist or a candidate table, so checking is total and exact, uses no CAS, and never
materializes `e`. The real new work is a local SVG plot (tangent, maximum marker, sup line,
domain shading, an `M_n`-vs-`n` dot plot) and a small data-driven step engine. No new
dependency, persistence or route.

**Notes alignment.** Test 1.1.1 (p. 6) is an "iff" for a sequence already converging pointwise
to `f`, so the pointwise step is logically required. Example 1.1.3(2) (p. 8) is `nxe^{-nx}` on
`[α,1]`: Weierstrass → endpoint or interior → Fermat → `x=1/n` → for `n>1/α` the maximum is at an
endpoint → `M_n→0`. The remark on p. 7 gives the two shortcuts (`M_n ≤ a_n → 0` ⇒ uniform;
`0 ≤ b_n ≤ M_n`, `b_n ↛ 0` ⇒ not uniform) and "`M_n=∞` ⇒ not uniform". The third core example
`x^n(1−x^n)` is the notes' own `g_n` from Example 1.1.1: earlier in §1.1 (the sleeve figure and
Example 1.1.2) its non-uniformity on `[0,1]` is shown with the witness `x=1/\sqrt[n]{2}`, `g_n=1/4>ε=1/8`. Here the student computes
the exact supremum and adds the domain repair `[0,1/2]`. The lab does not use `x^n(1−x^n)`, so
there is no overlap. Its maximum point `2^{-1/n}` is, however, the lab's witness for `x^n`.

**Placement check.** None of the three planned menu entries in `SubjectModule.tsx` (continuity
of the limit, limit and integral, limit and derivative) is this activity. It is a new entry.

---

## 1. Interaction

Layout is the approved lab layout via `LabWorkspace`: task strip (prompt + answer inputs right,
check/feedback/next/hints left) → `SliderPanel` → graphs. The sequence sits in a
`.convergence-formula-card`. One active prompt; hints one at a time; justifications in
`<details>`; "הצג תשובה לשלב" on every step; no score or timer.

Graphs: **G1** = function plot (new `SupremumPlot`); **G2** = `M_n` vs `n` (new
`SupSequencePlot`, dots for `n=1..40`, ε band around 0), shown from the limit step on.

### 1.1 Template mechanics (decided: guided templates)

- **`SlotTemplate`**: a formula line in an LTR island (`dir="ltr"` + `direction:ltr;
  unicode-bidi:isolate`), given as `segments: (latex | {slot})[]`. Each LaTeX chunk renders with
  `MathText`. Each slot is a button styled like `.convergence-limit-slot`, showing `?` or the
  chosen chip. The active slot's chip palette (radio group, keyboard-accessible) appears under
  the line. Choosing a chip fills the slot and moves focus to the next empty slot.
- **Slots sit at the top level of the formula only.** KaTeX cannot be split inside a
  superscript or `\frac`, so where the answer would live in an exponent, the slot holds the
  **whole term** (e.g. `[2x^n]`, not `2x^{[n]}`). This avoids a custom KaTeX hack.
- **Check**: `checkSlots(templateId, filled)` returns `incomplete` (some slot empty →
  "השלימו את כל המשבצות"), `correct`, or `wrong` with the first wrong slot highlighted and a
  diagnosis id when that chip is a known mistake (otherwise "המשבצת המסומנת אינה נכונה").
  Each slot has `accepted: TokenId[]` (usually one) and `diagnoses: Partial<Record<TokenId,
  DiagnosisId>>`. Because the fixed parts of the template pin the form, answers are unique.
- **Tokens, not numbers.** A chip is a `TokenId` (e.g. `"inv-e"`, `"four-over-n-e2"`) with a LaTeX
  label (`\frac1e`, `\frac{4}{ne^2}`). `e` exists only inside LaTeX strings; `Math.exp` is used
  only for plotting, readouts and test witnesses.
- **`CandidateTable`**: rows of small `SlotTemplate`s (`f_n(0)=[\,]`, `\lim_{x\to\infty}f_n(x)=[\,]`,
  `f_n(x_n)=[\,]`) plus one radio per row, "זה המקסימום". Checked row by row, then the choice.
- Non-template inputs: `Choice`/`LimitPrediction` (reasons, conclusions, predictions),
  `ReasonChecklist` (checkbox variant of `Choice`), `NumberField` (only the optional `[a,∞)` step).
- Outcome states: **correct**, **wrong with diagnosis**, **incomplete**, **revealed**. Nothing
  is parsed or proved symbolically, so there is no unparseable, out-of-domain or inconclusive
  state (engines.md's mandatory `inconclusive` concerns symbolic zero-testing, not used here).

### 1.2 E1 (deep dive): `f_n(x)=nxe^{-nx}`, Part I on `[0,∞)`

`[·]` = slot, answer shown inside; "chips" = the palette for that slot.

| # | Student task | Template / input (answer) · chips | Diagnoses and hints | G1 / G2 |
|---|---|---|---|---|
| 1 | Pointwise limit | `\lim_{n\to\infty} nx_0e^{-nx_0}=[0]` · `0, 1/e, x_0, ∞` | `1/e`: "זה גובה הפסגה, אבל הפסגה זזה; קבעו נקודה". Hint: `f_n(0)=0`; for `x_0>0`, `ne^{-nx_0}→0`. | curve, fixed probe `x_0` with readout; limit line hidden until correct |
| 2 | Set up `M_n` | `M_n=\sup_{x\in[0,\infty)}\lvert f_n(x)-[0]\rvert`; then `Choice` why the absolute value drops: "`f_n(x)≥0` on the domain" ✓ / "`f=0`" / "`f_n` continuous" | the test is allowed because step 1 gave pointwise convergence (shown in the feedback) | limit line `y=0` shown |
| 3 | Why a maximum exists (lecturer's route) | `ReasonChecklist`: continuous ✓, `f_n(0)=0` ✓, `\lim_{x\to\infty}f_n=0` ✓, `f_n>0` for `x>0` ✓, "`[0,∞)` closed ⇒ Weierstrass" ✗, "differentiable ⇒ has a maximum" ✗ | first missing / first wrong item only; ✗ Weierstrass: "הקטע אינו חסום". Disclosure: 3-line proof via Weierstrass on `[0,R]`. | point `(0,0)` marked; "`→0`" tail label; zoom-out window |
| 4a | Product rule | `f_n'(x)=ne^{-nx}-[n^2]xe^{-nx}` · `n, n^2, 1, -n^2` | `n`: missing chain-rule factor; `-n^2`: sign. | movable `x` (the `x_0` row of `SliderPanel`) shows the **tangent** and `f_n'(x)≈…` |
| 4b | Factor (lecturer's template) | `f_n'(x)=ne^{-nx}(1-[n]x)` · `1, n, n^2, 1/n` | `n^2`: "כבר הוצאתם `n` מהסוגריים". | after correct: sign strip `+` / `−` under the axis |
| 5 | Fermat | `ne^{-nx}[>0]` (chips `>0, =0, <0`), so `f_n'(x)=0 \iff x=[1/n]` · `1/n, n, 1/n^2, 0`; then `Choice`: "Fermat applies because the maximum point is interior and `f_n` is differentiable there" ✓ / "because `f_n'(x_n)=0`" (circular) / "because the domain is closed" | `0`: "0 הוא קצה; שם `f_n'(0)=n≠0`". | max marker at `x_n`, **tracking `n`** toward 0; tangent horizontal at the marker |
| 6 | Candidates | table: `f_n(0)=[0]`, `f_n(1/n)=[1/e]`, `\lim_{x\to\infty}f_n(x)=[0]`; maximum = row `1/n` · `0, 1/e, n/e, e` | wrong row named | dashed **sup line** `y=M_n`; it stays put as `n` changes |
| 7 | Limit and verdict | `\lim_{n\to\infty}M_n=[1/e]` · `0, 1/e, ∞`; conclusion `Choice`: ✓ "`M_n=1/e↛0`, ולכן לפי מבחן הסופרמום ההתכנסות ב־`[0,∞)` אינה במידה שווה"; ✗ "…ולכן אין התכנסות נקודתית"; ✗ "`f_n(1/n)↛0` ולכן אין גבול בנקודה `1/n`" (moving-point fallacy); ✗ "`M_n` חסומה ולכן ההתכנסות במידה שווה" | | G2: dots at `1/e`; ε enabled; for `ε<1/e` no dot enters the band |

### 1.3 E1, Part II on `[1,∞)`

| # | Student task | Template / input (answer) · chips | Diagnoses | G1 / G2 |
|---|---|---|---|---|
| 8 | Where is `x_n`? | `\frac1n\ [\le]\ 1` for every `n\ge1` · `\le, >`; `Choice`: `x_n` "outside the interior of `[1,∞)` (at the endpoint only for `n=1`)" ✓ / "inside for large `n`" | | domain shaded; curve left of `x=1` faded (context, like `powerContext`); peak visibly outside |
| 9 | Monotonicity and location | `x\ge1 \Rightarrow 1-nx\ [\le 0]` · `\le 0, \ge 0`; so `f_n` is `[decreasing]` · `decreasing, increasing` on `[1,∞)`; table `f_n(1)=[ne^{-n}]`, `\lim_{x\to\infty}f_n=[0]` · `ne^{-n}, e^{-n}, 1/e, 0` | ✗ reason trap in the hint list: "`f_n(1)>f_n(1/n)`" is false | max marker jumps to `x=1`; sup line at `ne^{-n}` drops with `n` |
| 10 | Limit and verdict | `\lim M_n=[0]` · `0, 1/e, ∞`; conclusion `Choice` with the direction "`M_n→0` ⇒ uniform" | hint: `n/e^n` | G2 dots enter the band; readout "לכל `n>N`…" with the current `N` (notes use `n>N`) |
| 11 *(v2)* | `[a,∞)`, slider `a>0`: from which `n` is the maximum at the endpoint? | `NumberField`: smallest integer `n\ge1/a` | reflection: finitely many `M_n=1/e` do not matter; mirrors the notes' `n>1/α` | G1/G2 with `a` |

### 1.4 E2 (uniform contrast): `f_n(x)=nx^2e^{-nx}` on `[0,∞)`

Runs after E1 with the same step skeleton. Step 3 is pre-filled ("the same reasons as in E1")
and only confirmed.

| # | Template (answer) · chips | Diagnoses / notes |
|---|---|---|
| 1 | `\lim nx_0^2e^{-nx_0}=[0]` · `0, 4/e^2, x_0^2` | |
| 4a | `f_n'(x)=2nxe^{-nx}-[n^2]x^2e^{-nx}` · `n, n^2, 2n^2, -n^2` | `n`: missing chain-rule factor |
| 4b | `f_n'(x)=nxe^{-nx}([2]-[n]x)` · slot 1 `1, 2, n, 2n`; slot 2 `1, n, n^2, 2` | slot 1 `1`: "`(x^2)'=2x`". **New vs E1: an extra factor `x`.** |
| 5 | `f_n'(x)=0 \iff x=[0]` or `x=[2/n]` · `0, 1/n, 2/n, n/2, 2` | `x=0` is a zero of `f_n'` but an endpoint, so Fermat does not locate the maximum there; it is still a table row |
| 6 | table `f_n(0)=[0]`, `f_n(2/n)=[4/(ne^2)]`, `\lim_{x\to\infty}=[0]` · `0, 4/(ne^2), 4/e^2, 2/(ne)` | `4/e^2`: "הציבו גם את `n` שלפני" |
| 7 | `\lim M_n=[0]` ⇒ **uniform on all of `[0,∞)`** | Reflection `Choice`: "both peaks move to 0; in E1 the height stays `1/e`, here it shrinks. The value of `M_n` decides, not the fact that the peak moves." Optional G1 toggle overlays E1 faded. |

### 1.5 E3 (compact domain): `f_n(x)=x^n(1-x^n)`, `[0,1]` then `[0,1/2]`

| # | Template (answer) · chips | Diagnoses / notes |
|---|---|---|
| 1 | for `0\le x_0<1`: `\lim f_n(x_0)=[0]`; and `f_n(1)=[0]` for every `n` · `0, 1, 1/4` | `1` at `x=1`: "ב־`x^n` הגבול ב־1 הוא 1, אבל כאן `f_n(1)=1\cdot0`" |
| 3 | `Choice`: why a maximum exists: "`f_n` continuous on the closed bounded `[0,1]` (Weierstrass)" ✓ / "`f_n` vanishes at both ends" / "`f_n` differentiable" | **contrast with E1**: Weierstrass applies directly here; on `[0,∞)` it did not |
| 4 | `f_n'(x)=nx^{n-1}(1-[2x^n])` · `2x^n, x^n, 2x^{2n}, 2nx^n` (whole-term slot) | `x^n`: "`(x^{2n})'=2nx^{2n-1}`"; `2x^{2n}`: "`x^{2n-1}/x^{n-1}=x^n`" |
| 5 | `f_n'(x)=0 \iff x=[0]` or `x^n=[1/2]`, i.e. `x_n=[2^{-1/n}]` · `2^{-1/n}` (label `2^{-1/n}=1/\sqrt[n]{2}`, the notes' form), `2^{-n}`, `1/2`, `2^{1/n}` | `x=0` is a zero only for `n\ge2`, and an endpoint. `2^{-n}`: "זה `(1/2)^n`, לא השורש ה־`n`-י" |
| 6 | table `f_n(0)=[0]`, `f_n(1)=[0]`, `f_n(2^{-1/n})=[1/4]` · `0, 1/4, 1/2, 2^{-n}` | shortcut disclosure: with `t=x^n\in[0,1]`, `f_n=t(1-t)\le1/4`, equality at `t=1/2` |
| 7 | `\lim M_n=[1/4]` ⇒ not uniform on `[0,1]` | connects to the notes' witness (`ε=1/8`) |
| 8 | `2^{-1/n}\ [\ge]\ \frac12` for every `n\ge1` (equality only for `n=1`) | peak faded outside `[0,1/2]`, marker runs **toward 1** as `n` grows (mirror of E1) |
| 9 | `0\le x\le\frac12 \Rightarrow 1-2x^n\ [\ge 0]` (since `2x^n\le2^{1-n}\le1`), so `f_n` is `[increasing]`; `M_n=f_n(1/2)=[2^{-n}(1-2^{-n})]` · `2^{-n}(1-2^{-n}), 1/4, 2^{-n}, 1/2` | same "domain change moves the maximum to an endpoint" twist as E1′ |
| 10 | `\lim M_n=[0]` ⇒ uniform on `[0,1/2]` | optional bound `M_n\le2^{-n}` in the feedback (notes' `M_n\le a_n` remark) |

**Closing reflection (v2, or v1 as a disclosure):** "For 'not uniform' the witness value
`f_n(x_n)\le M_n` already suffices (notes p. 7); for 'uniform' we needed the full upper bound over
all points."

---

## 2. Input and checking strategy — **decided: guided templates (b)**

The lecturer chose structured guided templates. For the record, the rejected alternatives:
- **(a) free formula** is not available cheaply: `formulaParser.ts` accepts only `x` (the
  `variable` AST node is `name: "x"`), so `n` fails to parse. Adding a parameter means changing
  the parser, `differentiate.ts` and a two-variable verifier in the linear-homogeneous engine.
  It would also hit known nerdamer failures: `f_n'` is a difference of equal `exp(-nx)` terms (the
  `E_TO_EXP`/`expand` bug), plus the `PARSE2NUMBER` leak of `e`. This is the biggest tier (a
  project needing its own decision).
- **(c) hybrid**: inherits (a).

With (b), checking is exact token comparison, per §1.1. Exact `e`: tokens only in the checking
path; a test asserts that no chip label or LaTeX string contains a decimal approximation
(`/2\.71|0\.36|0\.54/`).

---

## 3. Justification steps (no free-text grading)

- **Reason checklists** (E1 step 3): select all needed facts; the false items are classic flaws.
- **Single-reason choices** (steps 2, 5, E3 step 3): right reason vs circular / irrelevant.
- **Monotonicity as a template** (steps 9): the sign fact is filled in, then "increasing /
  decreasing", so "why the endpoint" is argued, not asserted.
- **Conclusion sentences** (steps 7, 10): notes' wording; distractors cover the wrong direction,
  mixing the two modes, the moving-point fallacy, "bounded ⇒ uniform".
- **Flawed written solution** (v2): a model exam answer as numbered lines; the student picks the
  wrong line, then the reason. One flaw per example: Weierstrass on `[0,∞)` (E1); "a moving
  peak ⇒ not uniform" (E2); forgetting the endpoint candidates, or "`2^{-1/n}\notin[0,1/2]` so
  there is no maximum" (E3).
- Not recommended: ordering the whole proof.

---

## 4. Example catalogue

### Core (decided; verified by hand)

| ID | `f_n`, domain | `f_n'` | zeros of `f_n'` | `M_n` | `lim M_n` / verdict | What it teaches |
|---|---|---|---|---|---|---|
| **E1** | `nxe^{-nx}`, `[0,∞)` | `ne^{-nx}(1-nx)` | `1/n` | `f_n(1/n)=1/e` | `1/e` / not uniform | the full argument, existence on an unbounded domain |
| **E1′** | same, `[1,∞)` | same; `\le0` on `[1,∞)` | `1/n\le1` (endpoint only at `n=1`) | `f_n(1)=ne^{-n}` | `0` / uniform | the maximum moves to an endpoint |
| **E2** | `nx^2e^{-nx}`, `[0,∞)` | `nxe^{-nx}(2-nx)` | `0` (endpoint), `2/n` | `f_n(2/n)=4/(ne^2)` | `0` / **uniform** | same method, opposite verdict; extra factor `x` |
| **E3** | `x^n(1-x^n)`, `[0,1]` | `nx^{n-1}(1-2x^n)` | `0` (`n\ge2`), `2^{-1/n}\in(0,1)` | `1/4` | `1/4` / not uniform | compact domain → Weierstrass directly; the maximum runs to the right end |
| **E3′** | same, `[0,1/2]` | `\ge0` on `[0,1/2]` | `2^{-1/n}\ge1/2` (endpoint only at `n=1`) | `f_n(1/2)=2^{-n}(1-2^{-n})` | `0` / uniform | same endpoint twist as E1′ |

Checks done: pointwise limits (E3: `f_n(1)=0`, so the limit is `0` everywhere, unlike `x^n`);
derivatives by product/chain rule; `f_n(1/n)=1/e`, `f_n(2/n)=n\cdot4n^{-2}e^{-2}`,
`f_n(2^{-1/n})=\frac12\cdot\frac12`; monotonicity on the repaired domains
(`x\ge1\Rightarrow1-nx\le1-n\le0`; `x\le\frac12\Rightarrow1-2x^n\ge1-2^{1-n}\ge0`); `n=1` edge cases
coincide with the endpoint formulas (`M_1=1/e` and `M_1=1/4` both ways).

**Order:** E1 → E1′ → E2 → E3 → E3′. E2 directly after E1, because the contrast is the point.
E3 last, because it changes two things at once (compact domain, maximum moving right).

### Optional extras: which still add real value

- **`x/(n+x)` on `[0,∞)`: real value.** `f_n'=n/(n+x)^2>0`, so there is no zero of `f_n'`; the
  sup `1` is **not attained** (the `x\to\infty` row of the table wins); not uniform; on `[0,M]`
  uniform. It is the only case where Fermat finds nothing. Close in spirit to the lab's `far`.
- **`n^2xe^{-nx}`: some value.** `M_n=n/e\to\infty` (the notes' "`M_n=∞`" remark); on `[1,∞)`
  `n^2e^{-n}\to0`. Needs an off-scale marker on G1. A one-screen extra at most.
- **No added value over the core:** `xe^{-nx}` (same lesson as E2), `x^n(1-x)` (same lesson as
  E3), `x/(1+nx^2)` (only adds the quotient rule), `nx/(1+n^2x^2)` (the lab's `near`; a bridge at
  most), `nx^n(1-x)` (needs `(1+1/n)^n\to e`, outside notes pp. 1–9).

**Curated, not generated.** A seeded family (`n^p x^q e^{-nx}`, `x_n=q/n`,
`M_n=q^qe^{-q}n^{p-q}`) would repeat E1/E2's insight with new constants. If wanted later, it
would use `SeededRandom`/`mixSeed` from `app/constant-coefficients-euler/practice/random.ts`,
exact tokens, and per-draw self-validation (candidate values vs dense sampling, derivative vs
finite differences) with a fixed fallback.

---

## 5. Structure and placement

**A separate activity in the function-sequences menu**, not a fifth lab lesson: the lab is
intuition-first with sequential gating, and this activity is exam-oriented. The new card goes
after the lab card, kicker "פעילות זמינה"; title along the lines of "מבחן הסופרמום: חישוב וטיעון"
(final wording by hebrew-copy). `SubjectModule.tsx` moves from one `activityOpen` boolean to
`openActivity: "lab" | "supremum" | null`, with a hidden host per started activity. This keeps
the current behaviour where returning to the menu does not reset work. No new route.

Files, in `app/function-sequences-series/`. That folder keeps its checkers in `math/` and has no
`practice/`; follow that.

| File | Content | Status |
|---|---|---|
| `math/supremumExamples.ts` | E1, E2, E3 records: LaTeX, `value(n,x)`, `derivative(n,x)` (display only), domains, candidates (`kind`, `xLatex`, `x(n)`, value token), `supValue(n)`, limit token, verdict, y-range | new, pure TS |
| `math/supremumArgument.ts` | token ids + LaTeX labels, templates (segments, slots, accepted, diagnoses), step sequences per example (compressed variants for E2/E3), checkers `checkSlots`, `checkChoice`, `checkChecklist`, `checkCandidateTable`, `checkThresholdN`, and the stage-transition function | new, pure TS |
| `math/supremumPlot.ts` | tangent segment, samples that include `x_n`, G2 dot geometry; reuses `plotX`, `plotY(y,min,max)`, `clipPlotSegments`, `PLOT_*` from `sequencePlot.ts` | new, pure TS |
| `components/SupremumActivity.tsx` | thin renderer: `LabWorkspace`/`TaskCard`, example progression | new |
| `components/SupremumPlot.tsx`, `components/SupSequencePlot.tsx` | G1, G2 (local SVG) | new |
| `components/SlotTemplate.tsx`, `components/CandidateTable.tsx`, `components/ReasonChecklist.tsx` | the input mechanics of §1.1 | new |
| `components/ConvergenceUI.tsx` | reused as is: `LabWorkspace`, `TaskCard`, `Choice`, `LimitPrediction`, `SliderPanel`, `NumberField`, `Hints`, `FeedbackBox`, `ExploreActions` | reuse |
| `SubjectModule.tsx` | menu card + host switch | small edit |
| `app/globals.css` | `supremum-` classes (slot, palette, table, sup line, sign strip, tangent, faded context), tokens only | design agent |

**Why not reuse `SequencePlot`:** it is keyed to the `SequenceId` union and `convergence.ts`
switches, with a fixed y-range of `[-1.2,1.2]`. Extending it would alter the lab's tested
`classifyConvergence`/`supremumError`. A separate component that imports the geometry helpers is
cheaper and keeps the lab stable.

**Graph scale (checked):** all core sups are bounded. With a fixed y-range per example there is
no auto-scaling and no off-scale handling:
- E1: `[0,1/e≈0.37]`, range `[-0.05,0.45]`.
- E2: `4/(ne^2)≤0.55` (at `n=1`, `x_1=2`), range `[-0.05,0.6]`, and the view window must reach
  `x≥2` for small `n` (window chips as in the paired lab).
- E3: `[0,1/4]`, range `[-0.03,0.3]`.

The narrow peaks (`1/n`, `2/n`) and the E3 peak near 1 (`1-2^{-1/n}≈\ln2/n`) need `x_n` inserted
into the samples; cap `n` at 64 in this activity.

**Tests (vitest, node):**
- `math/supremumExamples.test.ts`, per example/domain, `n∈{1,2,3,5,17,64}`:
  - `derivative` matches central finite differences.
  - Each interior zero has a `+`→`−` sign change.
  - `supValue(n)` equals the best candidate and is ≥ dense samples (test witness only).
  - Limit tokens agree with the trend (constant `1/e`, `1/4`; decreasing to `0`).
  - Verdict is consistent with the limit token.
  - `n=1` endpoint coincidences.
  - E1 threshold `⌈1/a⌉` including `a=1/k` (v2).
- `math/supremumArgument.test.ts`:
  - Every template's accepted tuple reads `correct`.
  - Every listed distractor returns its own diagnosis.
  - Empty slots give `incomplete`.
  - Checklist missing/extra diagnoses; candidate-table wrong-row diagnosis.
  - Stage transitions.
  - No decimal `e` in any label.
- `components/supremumRendering.test.ts` (SSR):
  - Templates, tables, formula card and G1/G2 are inside `dir="ltr"`.
  - The max marker, sup line and sign strip are absent before their step is solved.
  - Faded context outside `[1,∞)` and `[0,1/2]`.
- `SubjectModule.test.ts`: the new card and host.

---

## 6. Gaps, risks, scope

**Tier 1, extends existing code (hours):** menu card and host switch; reuse of the lab UI;
checkbox variant of `Choice`.
**Tier 2, new logic on existing engines (days):** catalogue + templates + checkers + tests;
`SupremumPlot` (tangent, tracking max marker, sup line, sign strip, domain shading and context);
`SupSequencePlot` (ε band, `N` readout); `SlotTemplate`, `CandidateTable`, `ReasonChecklist`;
stage engine; CSS.
**Tier 3, not proposed:** free-formula input with `n`; a general sup engine for arbitrary `f_n`.

**Risks and the cheapest way to settle each:**
- *Slot rendering next to KaTeX.* Chunks must split only at the top level. Rule: whole-term
  slots, never inside exponents or fractions. Settle with a static prototype of the E3 step-4
  line and the E1 step-4b line at 320 px width.
- *Knowledge boundary (E1 existence).* The lemma "continuous, positive, → 0 at both ends ⇒
  maximum" is not stated in notes pp. 1–9. The step-3 disclosure proves it from Weierstrass on
  `[0,R]`. The sign route (`f_n'>0` then `<0`) avoids it entirely. Lecturer decision 3.
- *Guessability of chips.* Accepted (no scores). Distractors must be plausible; the table forces
  consistency across rows.
- *Component size.* Keep step data and transitions in `math/supremumArgument.ts`.
- *Terminology.* The glossary's "נקודה קריטית" is the phase-plane equilibrium term; for `f'=0`
  prefer "נקודה חשודה לקיצון". Needs a glossary entry via hebrew-copy.
- *RTL.* Every template, table row and conclusion formula is an LTR island; conclusion
  sentences are RTL with inline math; terminal punctuation stays outside the math.

**v1 (smallest shippable slice):** E1 and E1′ in full (steps 1–10) with free exploration; E2
compressed (steps 1, 4–7 + reflection); E3 and E3′ (steps 1, 3–10, compressed prompts); G1 and
G2; closing reflection as a disclosure.
**v2:** flawed-solution review; `[a,∞)` slider step; closing reflection as an exercise; optional
extras (`x/(n+x)` first).

**Size estimate.** v1:
- pure TS ≈ 450–550 lines + tests ≈ 350 (three examples, five domain cases);
- components ≈ 800–950 (three new input components, two plots);
- CSS ≈ 150;
- total ≈ 1,750–2,000 lines, about **5–7 working days** including browser checks at the lab's
  widths.

v2: ≈ 2–3 more days.

**Plan (each step independently verifiable):**
1. `supremumExamples.ts` for E1/E1′/E2/E3/E3′ + tests (pure math green).
2. Tokens, templates, checkers, stage function + `supremumArgument.test.ts`.
3. `supremumPlot.ts` + tests; static `SupremumPlot` for each example at `n=1,8,64` (visual).
4. `SupSequencePlot`; SSR tests.
5. `SlotTemplate`, `CandidateTable`, `ReasonChecklist` with CSS (design agent) and Hebrew copy
   (hebrew-copy agent); the slot-rendering prototype from the risks list.
6. `SupremumActivity`: E1 steps 1–10, then E2, then E3/E3′; free exploration.
7. Menu card and host in `SubjectModule.tsx`; `npm test`, `npm run typecheck`, browser pass.
8. Scribe updates `ARCHITECTURE.md` §6 and engines.md §1.K (a second curated catalogue).

---

## 7. Decisions for the lecturer

**All decided 2026-09-29.** The lecturer's answers, which override anything above:

1. Placement: a separate, unlocked card in the function-sequences menu; the card suggests doing
   the lab first.
2. Input: guided templates / structured input.
3. Existence argument: the recommended approach. **Emphasis from the lecturer:** students must
   become aware of the Calculus 1 arguments needed to find the maximum correctly: existence of a
   maximum and why, Fermat only at interior points where `f_n` is differentiable, endpoint and
   limit-at-infinity candidates, and monotonicity when the critical point leaves the domain.
   Every example must make these explicit; none may be skipped silently.
4. Shortcut `M_n \ge f_n(x_n)` for "not uniform": yes, as a closing reflection after the full
   computation.
5. E1 second domain: `[1,∞)` in v1. A `[a,∞)` step may come in v2. **No `[α,1]` version and no
   reference to it is needed.**
6. Order E1 → E1′ → E2 → E3 → E3′; the extra `x/(n+x)` only in v2.
7. E3: derivative template as the main route, substitution `t=x^n` as a disclosure.
8. Written argument: reason choices, monotonicity templates and conclusion sentences in v1;
   "find the flawed line" in v2.
9. Include the `M_n`-vs-`n` graph with the ε band.
10. Term: "נקודה חשודה לקיצון" for points where `f'=0`.

The original options, for the record:

1. **Placement.** Separate menu activity, or a fifth lab lesson? Locked behind the lab?
   *Recommend: separate, not locked; the card suggests doing the lab first.*
2. ~~Input strategy~~ — **decided: guided templates / structured input.**
3. **Existence argument on `[0,∞)` (E1, E2).** Your route (positive, continuous, → 0 at both ends
   ⇒ maximum, then Fermat) as primary, with its proof in a disclosure. Should the
   sign-of-derivative route also be accepted as equally valid? *Recommend: yours primary, sign
   route shown as an accepted alternative.*
4. **Teach the shortcut?** For "not uniform" the witness `M_n\ge f_n(x_n)` already suffices
   (notes p. 7). *Recommend: yes, as a closing reflection, not replacing the computation.*
5. **E1 second domain.** `[1,∞)` only, or also the `[a,∞)` slider ("from `n\ge1/a`", the notes'
   `[α,1]`)? *Recommend: `[1,∞)` in v1, slider in v2.*
6. **Order of the three core examples, and extras.** *Recommend: E1 → E1′ → E2 → E3 → E3′.*
   Extras: only `x/(n+x)` (sup not attained, no zero of `f_n'`) adds a genuinely new lesson;
   `n^2xe^{-nx}` (`M_n\to\infty`) is marginal; the rest add nothing. Include `x/(n+x)` in v2?
7. **E3 route.** Derivative template `nx^{n-1}(1-2x^n)` as the main path (the same method as E1/E2)
   with the substitution `t=x^n` as a shortcut disclosure, or the substitution as the main path?
   *Recommend: derivative main, substitution as the disclosure.*
8. **How much written argument.** Reason choices, monotonicity templates and conclusion
   sentences in v1; "find the flawed line" in v2? *Recommend: yes.*
9. **The `M_n`-vs-`n` graph with ε band.** *Recommend: include; it links the test to the
   definition with `n>N`.*
10. **Term for `f'(x)=0` points:** "נקודה חשודה לקיצון" or "נקודה קריטית"? *Recommend the former.*
