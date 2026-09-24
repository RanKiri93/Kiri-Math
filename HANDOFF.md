# Handoff — Kiri Math convergence lab

Updated: **2026-09-24**. This is the continuation brief for a new agent/session.
Read `AGENTS.md`, then `ARCHITECTURE.md` §6 and `.agents/engines.md` before changing code.

## Current mission

Build engaging, lecture-note-aligned interactive course material for **Kiri Math**, a
Hebrew/RTL Technion course site. The immediate mission is the **first ODE activity on
function sequences**, distinguishing pointwise convergence from uniform convergence.

**The first implementation is complete and verified; the next step is user review and
targeted refinement, not restarting the design discussion or automatically building a
second module.** The user plans to resume with another agent in the next session.

Open `/ode/1/function-sequences-series`, then choose **סדרות פונקציות**. The page opens
on the introduction by default; internal tabs and tasks are component state, not URLs.
For the quickest review, choose **התחלה באתגר** inside the sequences tab.

## Decisions made with the user

- **Intuition first.** Later modules may demand more sophisticated reasoning and tasks.
  This one does not grade formal proofs or arbitrary student formulas.
- A recommended **guided sequence**, with a skippable warm-up and direct challenge entry.
- **Free exploration after each activity**, using the same graphs and controls.
- A harder route means less prescribed investigation, not uglier arithmetic or extra theory.
- Engagement comes from **predicting, searching, choosing a tracking rule, and changing a
  domain**. Avoid passive animations, compulsory repetitive clicks, scores, or timers.
- **Hints and explanations must be concise and minimal.** One active prompt; hints one at
  a time on request; longer mathematical justification behind optional disclosures.
- All four requested phenomena are part of core coverage, not confined to optional tasks:
  1. Uniform convergence on a smaller closed interval but not a larger one.
  2. Failure of pointwise convergence at some points.
  3. Uniform convergence on the whole real line, hence on every subdomain.
  4. Uniform convergence on bounded sets but not unbounded sets (within the example's domain).
- The notes' original pair `x/n` versus `x^n(1-x^n)` was considered too easy to carry the
  activity. The shipped version uses varied examples; do not revert to that pair alone.

### Knowledge boundary

Primary source: `public/courses/ode/notes.pdf`, printed **pp. 1–9** (physical PDF **pp. 5–13**).
Relevant material: fixed-point limits, definitions 1.1.2–1.1.3, epsilon sleeves, moving
counterexample points, the supremum test 1.1.1 and upper/lower bounds.
The notes use **`n > N`**, not `n >= N`.

Do not require later continuity/integration/differentiation theorems to solve this activity.
New examples need not appear verbatim in the notes, but must use only these tools and the
elementary calculus background assumed there.

## What is implemented

| Activity | Examples and interaction |
| --- | --- |
| Optional warm-up | `x/n` on `[0,1]`: choose a fixed point, predict its limit, find an index putting the entire graph inside the band |
| Same sequence, different domains | `x^n` on `[0,1/2]`, `[0,1]`, `[0,2]`: predict, inspect, classify; free exploration adds a variable endpoint and open/closed endpoint control |
| Shrinking oscillations | `sin(nx)/n` on `R`: increasing oscillation versus decreasing amplitude; optional envelope and movable viewing window |
| Hidden-error pair | `a_n(x)=nx/(1+n^2 x^2)` and `b_n(x)=x^2/(n^2+x^2)` on `[0,infinity)`: fixed points, escape points, tracking rules, conceptual distinction, domain repair |

The paired activity has four guided stages:

1. Predict the limit at a fixed point. Direct challenge entry skips this stage and states
   the pointwise limit is zero.
2. With `epsilon=1/4`, locate a point outside the band in each graph for the chosen index.
3. Choose a moving-point rule for each graph. Then answer whether this contradicts
   pointwise convergence. The identities provide an all-index explanation, not a finite trial.
4. Restrict each domain to restore uniform convergence; then explore freely or continue.

Direct challenge entry, optional extra guidance, on-demand hints, answer reveals, and
feedback for wrong choices are implemented. Completion indicators are in memory only;
re-entering an activity resets its local investigation. There is no saved progress.

The other three content tabs (function series, power series, Taylor series) remain
placeholders. The overall course module correctly remains **under construction**.

## Files to know

Paths below are relative to `app/function-sequences-series/` unless stated otherwise.

| File | Responsibility |
| --- | --- |
| `components/FunctionSequencesSection.tsx` | Mounts the lab in the existing tab |
| `components/ConvergenceLab.tsx` | Entry choices, lesson navigation, in-memory completion |
| `components/ConvergenceUI.tsx` | Shared workspace, choice controls, numeric controls, hints, feedback, task focus |
| `components/SimpleConvergenceActivities.tsx` | Warm-up and oscillation activity |
| `components/PowerConvergenceActivity.tsx` | Power sequence and changing domains |
| `components/PairedConvergenceActivity.tsx` | Guided/challenge pair and exploration |
| `components/SequencePlot.tsx` | Local hand-written SVG graph, endpoints, bands, probe readouts and warnings |
| `math/convergence.ts` | Curated formulas, limits, analytic classifications and supremum errors |
| `math/convergenceActivity.ts` | Structured witness/escape/domain helpers |
| `math/sequencePlot.ts` | Sampling, critical points, coordinate mapping, resolution checks, polyline clipping |
| `math/*.test.ts` | Family mathematics, deterministic sweeps and plotting geometry |
| `components/convergenceRendering.test.ts` | Server-rendered plot safeguards |
| `app/globals.css` | All styling; search `convergence-` and `function-series-lab-grid` |

The mathematical catalogue also has a `shifted-oscillation` case (`x+sin(nx)/n`), but it
is **not exposed as an extra guided activity**. It is not an unfinished required task.

## Mathematical and visual safeguards — preserve these

- `x^n` on `[0,1]`: the limit is zero below 1, and **1 at 1**. The error at 1 is zero;
  its supremum is 1 and is **not attained**. Removing 1 does not make convergence uniform.
- On `[0,c]` with `c>1`, points above 1 have no finite limit. Do not draw a zero-limit
  curve or its epsilon sleeve there.
- `a_n(1/n)=1/2` and `b_n(n)=1/2` for every positive integer `n`. These moving witnesses
  disprove **uniform** convergence, not pointwise convergence.
- The first pair member is uniform on `[delta,infinity)` for fixed `delta>0`; merely
  deleting zero does not help. The second is uniform on `[0,M]` for fixed finite `M`,
  but has error supremum 1 on every unbounded subset of its nonnegative domain.
- `checkEscape` checks **one observation only**. Error equal to epsilon is outside the
  strict band. Persistent tracking rules are checked separately using known identities.
- Mathematical domain and finite viewing window are separate. Zooming never changes a
  convergence verdict; off-screen probes remain explicitly identified with numeric readouts.
- Plot samples never determine correctness. Narrow peaks include analytic critical points.
  Unresolvable oscillations switch to a labeled envelope rather than an aliased curve.
- Huge powers are **polyline-clipped**, not clamped to an artificial horizontal segment.
- Open and closed endpoints, fixed and moving probes, and hidden/revealed limit states
  must remain visually distinguishable.
- `MAX_DISPLAY_N=256` is a display limit, not a claim about an infinite sequence.
- This is a curated local SVG renderer and explicit family logic, **not** a general
  convergence engine. No new dependency, CAS, backend, or plotting library was introduced.

## Verification at this checkpoint

- `npm test`: **221 passing tests in 18 files**.
- `npm run typecheck`: passed.
- `npm run build`: passed (Next production build).
- `npm run lint`: no errors; one pre-existing unused `extractColorLiterals` warning in
  `scripts/verify-math-size-tokens.mjs`.
- Browser walkthrough in headless Chrome covered the full guided route, direct challenge,
  wrong answers, reveals, endpoint toggles, high-frequency envelope, domain repairs,
  equivalent warm-up answers at zero, and stale-feedback reset after free exploration.
- Horizontal-overflow checks passed at widths **320, 390, 820, 821, 1180, 1181, 1200,
  1280 and 1540**. This is functional testing, **not student usability validation**.

The browser automation and screenshots were temporary files in `/tmp/opencode/`, not a
committed browser-test framework. Do not assume they exist on another machine. The
repository's permanent automated tests are Vitest. No browser-testing dependency was added.

### Suggested manual review next session

1. Run `npm run dev`; use the actual URL it prints. In this environment it bound to
   `localhost`/IPv6 and used 3001 because an existing process occupied 3000. Do not kill
   another session's server or assume `127.0.0.1` reaches that listener.
2. Open the sequences tab and choose **התחלה באתגר**. Try to solve it without hints.
3. Check whether the controls, first escape search and domain-repair choices are clear
   without adding paragraphs of instructions.
4. On a phone-sized viewport, inspect **scroll distance between the prompt, controls and
   plots**, not just absence of overflow. This remains a useful usability review target.
5. Check `[0,1]` versus `[0,1)` visually, including the open/closed limit markers.
6. Ask for the user's feedback before choosing the scope of a next advanced module.

Potential future work (not already authorized as the next feature): formal epsilon–N
tasks, richer structured reasoning, reproducibly generated exercises, and applications
to continuity/integration/differentiation. Arbitrary formula/proof grading needs a separate
feasibility decision; do not silently add it.

## Broader project checkpoint

The current tree also includes Fourier-course work from an earlier session, reviewed for
this checkpoint: `/fourier` course materials, four chapter pages, course/chapter art,
generated TOC and public PDFs, plus the course-aware notes-sync script and tests.
Fourier has **no interactive modules yet**. Its presence is not a change in the immediate
mission above. `ARCHITECTURE.md` describes both courses.

The root lockfile also contains existing dev-dependency metadata changes, with no new
application dependency added for the convergence lab.

## Agents and continuation setup

- `AGENTS.md`: repository rules and specialist dispatch guidance.
- `.agents/*.md`: specialist role instructions, engine inventory and Hebrew glossary.
- `opencode.json`: project agent registrations, model choices and prompt-file references.
- `.opencode/agents/orchestrator.md`: primary orchestrator definition.
- `.opencode/.gitignore`: excludes generated OpenCode dependencies and package files.

Keep these definitions tracked. OpenAI/OpenCode credentials and authentication are
machine-local and **must not be committed**. The user updated their OpenAI connection
during this session; the active specialists were notified. A new environment still needs
its own valid authentication and access to the configured models.

No PR or deployment was requested. The user requested this handoff plus a normal commit
and push to the existing remote; future commits/pushes still require user authorization.
