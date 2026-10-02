# Summary practice ("תרגול מסכם")

Status: infrastructure built (2026-10-01); the bank covers pointwise/uniform (including the supremum test) and continuity; integral and derivative are still to be designed with the course owner.

## Agreed with the course owner

- A sixth card in the function-sequences menu, after the five guided activities.
- **Not recorded**: no completion mark, not in the `course.ts` activity registry, nothing stored.
- The student draws exercises at random, from all topics or from one topic.
- Exercises come from **parametric families**, so the functions themselves are drawn, not only the
  choice of a fixed exercise.
- **Each exercise is one card**, start to finish; its steps open one below the other as the
  student solves them.
- A new exercise can be drawn at any time.

## Infrastructure (built)

| File | Role |
| --- | --- |
| `practice/practiceTypes.ts` | Topics and their Hebrew labels, `PracticeExercise`, `PracticeFamily` (id, topic, difficulty, `generate(rng)`) |
| `practice/practiceFamilies.ts` | The bank. Two demo families (`x^n` on `[0,b]`, supremum; `x^n/(c+x^n)` on `[0,2]`, continuity), plus `SUPREMUM_FAMILIES` and `UNIFORM_FAMILIES` (pointwise) |
| `practice/practiceBank.ts` | `drawExercise(filter, seed, avoidSignature)`: seeded (`SeededRandom`, `mixSeed`), self-validating (every reveal passes its check, every chip exists, one correct option per choice), up to 20 attempts, never returns an invalid exercise; avoids repeating the exercise on screen |
| `components/PracticeActivity.tsx` | Topic filter (topics without families are disabled), «תרגיל חדש», one exercise card; a solved step stays visible and the next opens below it |

Steps reuse the shared guided-step engine (`math/guidedSteps.ts`): slot templates, candidate
tables, reason checklists, single choices, hints, reveal, minimal proofs and «נימוק מיותר».

## Decided since

- One topic «התכנסות נקודתית ובמידה שווה» (id `pointwise`) holds both the uniform-convergence families and the
  supremum-test families (course owner, 2026-10-02: almost every uniform-convergence exercise computes $M_n$).
- Supremum families $n^ax^be^{-n^cx^d}$ and $\frac{n^ax^b}{1+n^cx^d}$ (`practice/supremumFamilies.ts`,
  spec in `docs/question-families/supremum-practice.md`).
- Student-selectable difficulty (`PracticeLevel`): families declare the levels they produce and `generate(rng, level)`;
  the toolbar offers all levels / easy / medium / advanced.
- Every card shows a graph (`PracticePlotSpec`, `components/PracticePlot.tsx`) with $n$ and $\varepsilon$ sliders.

- Pointwise topic: eleven families (`practice/uniformFamilies.ts`, 95 instances, 64 uniform / 31 not; 49 easy / 32 medium / 14 advanced),
  domain as the main parameter, self-checked by `checkModel`; spec and open owner questions in
  `docs/question-families/uniform-practice.md`.

- Continuity topic «רציפות הגבול» (id `continuity`): five families (`practice/continuityFamilies.ts`, 136 instances, 69 uniform / 67 not;
  44 easy / 63 medium / 29 advanced) next to the demo `jumping-limit`, which stays: `cont-unbounded`, `cont-ramp`, `cont-moving-peak`,
  `cont-floor`, `cont-indicator`. Spec in `docs/question-families/continuity-practice.md`.
- The plot contract gained piecewise support: `PracticePlotSpec.breaks?(n)` and `limitBreaks?` split the curve at jumps and draw
  open/closed dots (`splitSamples`, `breakDots`, `BREAK_DOT_MAX = 24` in `components/PracticePlot.tsx`).
- The practice topics were merged on 2026-10-02: «מבחן הסופרמום» is no longer a separate topic; the supremum families are drawn under
  «התכנסות נקודתית ובמידה שווה» (`pointwise`). Remaining topics to design: integral and derivative.

## To decide together

1. **Families per topic.** Which structural ideas per topic (pointwise and uniform, supremum test,
   continuity, integral, derivative), and which "general" families mix several theorems.
2. **Parameters.** Exact finite sets per family, excluded combinations, readability bounds.
3. **Difficulty.** Tiers and the mix when drawing (e.g. 40/40/20), and whether the student can
   choose a level.
4. **Graphs.** Whether a practice card shows a plot of f_n (the guided activities' plots can be
   reused per family).
5. **Draw policy.** Uniform over families, or weighted; avoiding repeats within a session.
