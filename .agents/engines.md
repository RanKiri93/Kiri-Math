# Computation & Verification Engines

Shared reference. What this codebase can actually compute, how students can actually
enter answers, and the failure modes that are already known. Read before proposing any
activity that involves symbolic math or answer checking.

---

## 1. Engines that exist

### A. Structured algebra — `app/constant-coefficients-euler/math/`

Closed-form manipulation of **polynomials and roots** with plain numbers. No CAS involved.

| Module | Provides |
| --- | --- |
| `polynomial.ts`, `roots.ts` | expansion from roots, parsing, validation |
| `basis.ts`, `basisDerivatives.ts` | basis tokens ↔ LaTeX, derivatives at 0 |
| `eulerConversion.ts` | power ↔ falling-factorial coefficients |
| `stability.ts` | stability classification from roots, with reasoning |
| `initialConditions.ts` | Wronskian matrix at a point, and its solution |
| `reconstruction.ts` | forced roots, feasibility, one-/two-parameter families |

**Properties:** fast, total, never hangs, no approximation surprises. **This is the
preferred engine whenever the answer space can be described structurally.** Reach for
symbolic algebra only when free-form functions are genuinely required.

### B. Free-formula parser — `app/linear-homogeneous/math/formulaParser.ts`

Hand-written tokenizer + recursive-descent parser. Single variable `x`.

- **Operators:** `+ − * / ^`, unary minus. Standard precedence, `^` right-associative.
- **Functions:** `exp ln log sin cos tan cot sqrt`. Parentheses mandatory.
- **Constants:** `e`, `pi`. Identifiers are case-insensitive.
- **Multiplication must be explicit.** `3*x` parses, `3x` throws. Any UI exposing this
  parser must tell the student so, in Hebrew.
- **Output:** `{ ast, nerdamer, latex }` — one parse serves evaluation, verification, and
  rendering simultaneously.

Two normalizations happen at parse time and are deliberate:

- `e^f` becomes `exp(f)`, never `Math.E ^ f`. Keeps Euler's number exact.
- `sin(2kx)` is rewritten to `2·sin(kx)·cos(kx)` so double-angle answers unify.

Emitted nerdamer strings also rewrite `tan`/`cot` into sin/cos quotients, `ln` into `log`,
and `sqrt(u)` into `u^(1/2)` so radicals can cancel algebraically.

### C. Symbolic differentiation — `app/linear-homogeneous/math/differentiate.ts`

Operates on the **AST directly, not through nerdamer**. Deliberate: it is total, fast, and
never triggers nerdamer's simplification pathologies. Use it for every derivative.

### D. nerdamer 1.1.13 (+ `Algebra.js`, `Calculus.js`)

The only general CAS available. Used **exclusively** by the linear-homogeneous module.
Powerful but fragile — see §3. Always go through `nerdamerConfig.ts`:

- `ensureSymbolicNerdamerMode()` — keeps `e`/`π` symbolic.
- `safeEvaluate(expr, subs)` — numeric evaluation that restores symbolic mode in a
  `finally`. **Never call raw `.evaluate()`.**
- `looksLikeRationalizedConstant(s)` — detects a leaked float constant (8+ digit run).

### E. Symbolic determinant — `app/linear-homogeneous/math/symbolicDeterminant.ts`

Cofactor expansion up to 4×4. Backs `equationFromBasis.ts`, which reconstructs the unique
normalized equation from a basis for n = 2, 3, 4 (order 2 has a fast path:
`p = −W′/W`, `q = (y₁′y₂″ − y₁″y₂′)/W`). Note the UI only exposes order 2 — **orders 3
and 4 are already implemented and unused.**

### F. Hybrid answer verification — `app/linear-homogeneous/math/fundamentalCompletionVerifier.ts`

The most sophisticated checker in the codebase, and the model to copy. Given a question
and a student formula it returns exactly one of:

`parseError` · `domainError` · `notSolution` · `solutionButDependent` · `correct` · `inconclusive`

Strategy: parse → check the expression is finite at the question's `safeEvaluationPoints`
→ build the ODE residual → try to prove it zero symbolically, falling back to cleared
numeric sampling → then test the Wronskian against `y₁` to separate a genuinely new
solution from a multiple of the known one. Tolerance `1e-7`.

**The `inconclusive` state is mandatory, not optional.** Symbolic zero-testing is
undecidable in practice here. Any new checker must have an honest "I cannot tell" branch
that shows work rather than guessing.

### G. Display-only simplification

`symbolicSimplify.ts` (`readableSimplify`, `readableQuotient`, `compactViaLinearShift`)
and `displayQuotient.ts` rewrite expressions to look good. **They are cosmetic and must
never be used to decide correctness.** Keep the verification path and the display path
separate; this separation already exists and must be preserved.

### H. Seeded randomness — `app/constant-coefficients-euler/practice/random.ts`

`SeededRandom` (LCG) with `next()`, `integer(min,max)`, `pick(items)`, plus `mixSeed` for
decorrelating streams. Shared across modules. Every generated question is reproducible
from `(seed, attempt)`.

### I. Canvas & numerics — `app/phase-plane-module.tsx`

DPR-aware Canvas 2D, RK4 trajectory integration, direction fields, eigen-line drawing,
and 2×2 eigenvalue/eigenvector computation done by hand. All of it is local to the
monolithic phase-plane file and **not currently reusable** — extracting it is a real cost
that must be budgeted, not assumed.

### J. Rendering — KaTeX + react-katex

`MathText` (inline, variants `inline`/`compact`/`standard`) and `DisplayMath` (block).
Four near-identical copies exist across modules; there is no shared package yet.

---

## 2. How students can enter answers

The input vocabulary that already exists. Prefer these over inventing a new one.

| Mode | Where it exists | Good for |
| --- | --- | --- |
| Free formula text + live KaTeX preview | `linear-homogeneous` (`.formula-input-label`, `.formula-preview`) | Open-ended function answers |
| Numeric field embedded in a formula | `MathParameterInput` | Coefficients, exponents, single parameters |
| Structured root-group editor | `RootGroupEditor`, `PracticeRootGroupEditor` | Roots with multiplicity, complex pairs |
| Basis-element composer | `ConstantBasisComposer`, `BasisElementComposer` | Building `e^{rx}`, `x^k`, `x^r`, `ln x` from tokens |
| Coefficient row editors | `PolynomialCoefficientEditor` and siblings | Whole polynomials / equations |
| Multiple choice with distractors | phase-plane self-practice, `distractorMap` | Classification, qualitative behavior |
| Staged multi-step with locking | `StepCard`, `ConstantCoefficientFullPractice` | Long derivations, partial credit, graded hints |
| Canvas interaction | phase-plane sample editing | Geometric intuition |

**Structured input is almost always the better pedagogical choice.** It removes syntax
errors as a failure mode, makes verification total, and produces cleaner feedback. Free
text is justified when the space of correct answers is genuinely open — as in "find a
second solution", where any nonzero multiple plus any multiple of `y₁` is correct.

---

## 3. Known failure modes

Every item below is a bug that was already hit and worked around. Treat them as hard
constraints, not folklore.

**nerdamer leaks `PARSE2NUMBER`.** Its internal `block()` has no `try/finally`, so a
throwing `.evaluate()` (division by zero at a sample point) leaves numeric mode on.
Afterwards `e` becomes `Math.E` and gets rationalized into ratios like
`325368125/119696244`. Always use `safeEvaluate`.

**Do not enable `Settings.E_TO_EXP`.** Under that flag `expand()` mishandles differences
of equal `exp(...)` terms, and `W(y, c·y)` comes out nonzero — silently turning a
dependent answer into an accepted one.

**`expand()` corrupts radicals and can hang.** On radical-heavy expressions nerdamer both
rewrites identities into enormous nonzero polynomials and can hang outright, especially on
cleared `sqrt · exp` residuals. The code detects radicals (`containsRadicalNoise`) and
skips expansion; when exponentials are present it skips the cleared path entirely.

**nerdamer can falsely simplify a radical expression in `x` to `0`.** The workaround is a
linear shift: substitute `x → u − h` where `h` is the family's shift, then simplify in
`u`. `detectIntegerLinearShift` recovers `h` from the expression. This is why question
templates carry an explicit `residualClearFactorExpression`.

**Length guards are load-bearing.** Direct shift-simplify is skipped above 500 characters;
rendered LaTeX is dropped above 130. These prevent hangs and unreadable feedback. Do not
raise them without measuring.

**Numeric sampling needs curated points.** Every question carries `safeEvaluationPoints`
inside its domain. Do not sample at arbitrary values — singularities produce `NaN` and a
false `domainError`.

---

## 4. What does not exist

Be explicit about these when scoping. Each is a genuine project, not a small addition.

- **No plotting library.** Any graph — including the planned function-sequences lab —
  means hand-written Canvas 2D, as in the phase-plane module.
- **No general ODE solver.** RK4 exists only for 2×2 linear systems inside the
  phase-plane canvas.
- **No CAS beyond nerdamer.** No integration engine, no series expansion, no limits, no
  convergence testing. The function-sequences module will need something here and there
  is currently no answer.
- **No server-side computation.** Everything runs in the browser. The Cloudflare Worker
  only serves the app; the D1 schema is intentionally empty.
- **No persistence of any kind.** Statistics reset on refresh, by design.
- **No linear algebra library.** Eigenvalues are hand-computed for the 2×2 case only.
- **No arbitrary-precision arithmetic.** Everything is IEEE doubles or integer arithmetic
  on small values.
- **No shared math-UI package.** `MathText`/`DisplayMath`/`mathTypography` are duplicated
  per module.

---

## 5. Choosing a verification strategy

1. **Can the answer be represented structurally?** (roots, coefficients, basis tokens,
   a classification) → canonicalize and compare. Total, fast, no CAS. Prefer this.
2. **Is the answer a function from an open space?** → hybrid, following
   `fundamentalCompletionVerifier.ts`: symbolic zero-proof first, numeric sampling at
   curated points as a witness, plus an independence test where relevant.
3. **Is it qualitative?** (stability, phase-portrait type, convergence mode) → enumerate
   the categories and use multiple choice with deliberate distractors.

Whichever you choose, the checker must distinguish *why* an answer failed — a wrong
answer, an unparseable one, and one outside the domain deserve different feedback. And it
must be able to say it does not know.
