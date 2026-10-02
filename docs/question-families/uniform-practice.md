# Pointwise and uniform convergence: summary-practice families

Topic `pointwise` («התכנסות נקודתית ובמידה שווה») of the summary practice ("תרגול מסכם"). Code:
`app/function-sequences-series/practice/uniformFamilies.ts` (eleven families, registered in `PRACTICE_FAMILIES`);
tests: `uniformFamilies.test.ts` (the whole grid of every family). Aim (course owner): more examples with logarithms,
trigonometric functions and powers, and a limited number connected to the definition of the derivative, so the
topic does not look repetitive before the next ones.

Every exercise asks "does $f_n\to f$ uniformly on $I$?" for a fixed sequence $f_n$; **the domain is the main parameter**
and decides both the verdict and the argument that proves it. Four arguments recur, on purpose spread over the families:

| Argument | Used when |
| --- | --- |
| continuity theorem (continuous $f_n$, discontinuous $f$) | the jump of the limit lies in the domain |
| supremum of the difference: monotone $f_n$, or a critical point | the supremum is computed exactly (attained, or approached and not attained) |
| a moving point $x_n$ with $\lvert f_n(x_n)-f(x_n)\rvert\not\to0$ | the supremum is awkward or infinite |
| an inequality bound (Lagrange: $1-\cos t=t\sin\xi\le t^2$, $\lvert\sin u-\sin v\rvert\le\lvert u-v\rvert$) | the bound is easier than the supremum |

## Common structure

* **Steps.** 3 to 5 per exercise (4 in most). The first step is the pointwise limit; the last is the verdict, a single choice
  whose correct option id is `uniform` or `not-uniform`, with a `minimalProof`. Middle steps vary the part kind: slot
  templates, a candidate table (peak-power), checklists ("what justifies the bound"), single choices.
* **Notation.** $M_n=\sup\lvert f_n-f\rvert$ and $f$ are named in the statement of every exercise. Hebrew is in plural
  imperative; theorem names: «משפט הרציפות», «משפט לגרנז'» (Lagrange mean value theorem), «מבחן הסופרמום».
* **Domain nouns.** Bounded interval of any closedness: «קטע» ("בקטע $\left[0,1\right]$"); a ray, closed or open:
  «קרן»; $\mathbb R$: «ישר». A test checks the noun of the statement and that «קרן» never appears in a bounded exercise
  and «קטע» never in a ray exercise.
* **Answers are tokens.** Every slot has exactly one accepted chip (the closed form chosen below), three or four chips in all.
  Equivalent forms of the same value never appear as a distractor (the correct chip and each wrong chip carry a numeric
  fingerprint, and the test requires all fingerprints of a slot to differ). The checker is the shared one (`checkStep`).
* **Distractors** are wrong for that very instance and plausible: the value at the wrong point ("the value at $x=1$,
  which is outside the domain"), the value for $n=1$, an upper bound instead of the exact supremum, the function instead of
  the difference, a forgotten factor, a sign. Inequality slots ("$\le$ [bound]") are held to a stricter rule: a wrong chip must
  be *false* at some probe point, because a weaker but true bound is not wrong (the test re-checks this from the stored
  fingerprints). Every wrong chip, choice option and checklist item carries a diagnosis.
* **Checklists** list the required reasons, at least two wrong reasons, and (often) one true-but-unneeded reason
  («נימוק מיותר»), e.g. "$\ln(1+t)\le t$" when the supremum is computed exactly.
* **Readability gate.** One chip is one expression of at most 100 characters of LaTeX (a template line at most 130);
  at most four chips per slot; constants before variables, an integer glued to the next factor ("2n", "4n^{2}",
  never "n\,2"); no coefficient 0 or 1 in front of a variable; no float literals. All tested.
* **Reduced fractions (course owner, 2026-10-02).** Every displayed fraction is reduced where the reduction is immediate: the generator builds
  $\frac{p}{q\,n^k}$ through `fracN(p, q, "n^{k}")`, which divides by $\gcd(p,q)$ (so $\frac{4}{2n^2}$ is written $\frac{2}{n^2}$,
  $\frac{9}{2n^2}$ stays), $\frac{1}{an}$ through `invNa`, and a bound such as $x^2/(2n^2)$ is replaced by the Lagrange bound $x^2/n^2$.
  Distractors are compared numerically *after* simplification (the numeric fingerprint of a chip does not depend on how it is written), so a
  distractor that becomes equal to the answer is dropped. The test `displayed fractions are reduced` scans every math fragment of every
  instance (statement, steps, hints, notes, proofs, options, checklist items, chips, template lines) and fails on any
  `\frac{p}{q}`, `\tfrac`, `\dfrac` with integers and $\gcd(p,q)>1$, on any `\frac{p}{q n^k}` with $\gcd(p,q)>1$, and on any `\frac{...}{1}`.
* **Lagrange first (course owner, 2026-10-02).** Wherever a fact in these families can be proved by the mean value theorem it is, in the copy
  «לפי משפט לגרנז'» (long form «משפט הערך הממוצע של לגרנז'»), in a step or in the reasons checklist, with the bound coming out of it:
  monotonicity as "$f'\ge0$" (ln, ratio, cos, arctan, exp, $nx/\sqrt{1+n^2x^2}$, peak, sin), $\ln(1+t)\le t$, $1-\cos t=t\sin\xi\le t^2$,
  $\lvert\sin u-\sin v\rvert\le\lvert u-v\rvert$, $\arctan u\le u$, $e^t\ge1+t$, and the whole quotient family. The two families in which the bound is
  the main route, with bound-checked slots, are `unif-sin-root` ($[a,1]$) and `unif-one-minus-cos` ($[0,a]$).
* **Self-validation.** Every instance has a `Model`: numeric $f_n$, $f$, the domain, the claimed supremum (exact, possibly
  approached) or the proof's bound, the verdict, the gap for non-uniform ones and an optional moving point. `checkModel`
  compares the claims with a brute-force supremum (a 6000-point grid plus geometric points near the ends, near interior
  points of interest such as $x=1$, and at the exact peak where there is one, at $n=25,100,400$; $n=10,20,40$ for $\sin(c\,x^{1/(kn)})$ where the supremum is approached at $x\approx e^{-knt}$;
  a model with `noLimit` is instead checked for $\lvert f_n(x_0)\rvert\to\infty$ at its divergence point),
  checks the pointwise limit at sample points of the domain at $n=10^4$, the moving point exactly, and that "uniform" means the
  supremum decays while "not uniform" means it stays above 0.9 of the gap. A generator draws an instance, builds it, runs the
  check (a 1500-point grid at draw time) and redraws up to 12 times; the fallback is the first instance of the requested level.
  The test suite proves the check can fail (wrong supremum, wrong verdict, wrong limit, wrong witness, wrong bound are all detected).
* **Plots.** Every exercise carries a `PracticePlotSpec` (maxN 40). The window is computed from the model: it spans the visible
  part of the domain and from the lowest to the highest value of $f$ and of $f_n$ for $n=1,2,5,40$, padded; a test samples
  2001 points for each of those $n$ and asserts nothing is clipped. Window and marker per family are below.
* **Draw policy.** Inside a family, a *kind* (almost always the domain kind) is drawn uniformly and then a variant of it, so
  the rarer non-uniform kinds are not drowned by the many uniform parameter values. Over 3000 draws of the topic:
  51% "not uniform", and difficulty 38% easy / 40% medium / 21% advanced.

## Families

Counts: *n* instances = number of distinct (parameter, domain) combinations; "U"/"N" = uniform / not uniform.
Instances are small enumerated grids; the order of the chips and options is shuffled per draw from the seed.

| familyId | $f_n$ | instances | U / N | levels |
| --- | --- | --- | --- | --- |
| `unif-ln-power` | $\ln(1+c\,x^n)$ | 15 | 9 / 6 | easy, medium |
| `unif-ratio-power` | $\dfrac{x^n}{1+x^{2n}}$ | 11 | 6 / 5 | easy, medium, advanced |
| `unif-cos-power` | $\cos(m\,x^n)$ | 12 | 9 / 3 | easy, medium |
| `unif-sin-root` | $\sin\!\big(c\,x^{1/(kn)}\big)$, $c\in\{\frac12,1\}$, $k\in\{1,2\}$ | 24 | 16 / 8 | easy, medium, advanced |
| `unif-diff-quotient` | quotients of $\sin,\cos$ (uniform), of $\sin(x^2)$ (not uniform) and $n(\sin(nx+c)-\sin(nx))$ (no pointwise limit) | 15 | 4 / 11 | easy, medium, advanced |
| `unif-one-minus-cos` | $1-\cos\frac xn$ | 7 | 3 / 4 | easy, medium |
| `unif-poly-quotient` | $n\big((x+\frac1n)^p-x^p\big)$, $p\in\{2,3\}$ | 10 | 8 / 2 | easy, medium, advanced |
| `unif-arctan` | $\arctan(nx)$ | 6 | 3 / 3 | easy, medium |
| `unif-exp-decay` | $e^{-nx}$ | 7 | 3 / 4 | easy, medium |
| `unif-sqrt-smoothing` | $\sqrt{x^2+\frac{k^2}{n^2}}$ and $\dfrac{nx}{\sqrt{1+n^2x^2}}$ | 10 | 9 / 1 | easy, medium, advanced |
| `unif-peak-power` | $x^n(1-x)$ and $n\,x^n(1-x)$ | 8 | 7 / 1 | easy, medium, advanced |

Total 125 instances (77 uniform, 48 not uniform). Per level over the whole grid: easy 63, medium 42, advanced 20 (see each family). Every level of every family has at least two distinct instances (tested), so the bank's "avoid repeating the exercise on screen" always finds another one.
All limits $f$ are pointwise limits on the domain; "sup" always means $M_n=\sup_{x\in I}\lvert f_n(x)-f(x)\rvert$.

### 1. `unif-ln-power`: $f_n(x)=\ln(1+c\,x^n)$, $c\in\{1,2,3\}$

Limit: $0$ on $[0,1)$, $\ln(1+c)$ at $x=1$ ($\ln2,\ln3,\ln4$). Domains (kind × parameter) and verdicts:

| Domain | Verdict | Argument | Level |
| --- | --- | --- | --- |
| $[0,1]$ | N | continuity theorem ($f_n$ continuous, $f$ jumps at 1) | easy |
| $[0,1)$ | N | $M_n=\ln(1+c)$ **approached, not attained**; $f=0$ is continuous, so the theorem is silent | medium |
| $[0,a]$, $a\in\{\frac12,\frac23,\frac34\}$ | U | increasing, $M_n=\ln(1+c\,a^n)\to0$ | easy |

Grid: 3 values of $c$ × (1 + 1 + 3 domains) = 15.
Steps: *closed*: limit (two pieces) → "is $f$ continuous at 1?" (choice) → what justifies it (checklist: $f_n$ continuous, $f$ jumps, theorem; unneeded: $f_n\ge0$) → verdict.
*open*: limit → $\lim_{x\to1^-}\lvert f_n-f\rvert$ (slot) → $M_n$ and whether attained (choice) → verdict.
*sub*: limit → why the maximum is at $x=a$ (checklist; unneeded $\ln(1+t)\le t$) → $M_n=\ln(1+ca^n)\to0$ (two slots) → verdict.
Plot: $x\in[0,1.1]$ or $[0,1.15a]$, $y$ from the model; marker only on $[0,a]$: the right end.
Excluded: $c=0$ or $c<0$ (degenerate); $a=1$ (becomes the closed case); domains beyond 1 (no pointwise limit).

### 2. `unif-ratio-power`: $f_n(x)=\dfrac{x^n}{1+x^{2n}}=\dfrac1{x^n+x^{-n}}$

Limit: $0$ for $x\ne1$, $\frac12$ at $x=1$. $f_n'=\dfrac{nx^{n-1}(1-x^{2n})}{(1+x^{2n})^2}$, symmetric under $x\mapsto1/x$.
Careful: $f_n(1)=\frac12=f(1)$, so $\lvert f_n-f\rvert$ vanishes at 1 and $M_n=\frac12$ is *approached*, not attained.

| Domain | Verdict | Argument | Level |
| --- | --- | --- | --- |
| $[0,a]$, $a\in\{\frac12,\frac23,\frac34\}$ | U | increasing, $M_n=f_n(a)\to0$ | easy |
| $[a,\infty)$, $a\in\{\frac32,2,3\}$ | U | decreasing, $M_n=f_n(a)<a^{-n}\to0$ (unbounded domain, still uniform) | medium |
| $[0,\infty)$ | N | moving point $x_n=2^{1/n}$: $x_n^n=2$, $f_n(x_n)=\frac25$, $f(x_n)=0$ | advanced |
| $[a,b]$, $a\in\{\frac12,\frac13\}$, $b\in\{2,3\}$ | N | same moving point (in the domain because $b\ge2$) | advanced |

Grid: 3 + 3 + 1 + 4 = 11.
Steps: monotone cases: limit → why the maximum is at the end (checklist; wrong reasons "increasing on all $[0,\infty)$", "$f_n'=0$ at an endpoint")
→ $M_n$ and its limit → verdict. Moving point: limit (three pieces $x<1$, $x=1$, $x>1$) → $x_n^n$, $f_n(x_n)$, $f(x_n)$ (three slots)
→ what justifies it (checklist; unneeded: $f$ is discontinuous at 1; wrong: $f_n(x_n)\to f(1)$) → verdict (wrong option: "since $f_n(1)\ne f(1)$").
Plot: window $[0,1.2]$, $[0,a+3]$, $[0,3]$, $[0,1.1\,b]$; markers: the end of the monotone domain, or the moving point $2^{1/n}$.
Excluded: $a\le1$ for the ray and $a\ge1$ for the bounded start (the sign of $1-x^{2n}$ would change inside).

### 3. `unif-cos-power`: $f_n(x)=\cos(m\,x^n)$, $m\in\{1,2,3\}$

Limit: $1$ on $[0,1)$, $\cos m$ at $1$. Since $m<\pi$, $1-\cos(m x^n)$ is increasing in $x$ ($m x^n\in[0,m]\subset[0,\pi)$).

| Domain | Verdict | Argument | Level |
| --- | --- | --- | --- |
| $[0,1]$ | N | $\lvert f_n-f\rvert$ is $1-\cos(mx^n)$ for $x<1$ and **0 at $x=1$**: $M_n=1-\cos m$ approached, not attained | medium |
| $[0,a]$, $a\in\{\frac12,\frac23,\frac34\}$ | U | increasing, $M_n=1-\cos(ma^n)\to0$ (unneeded: Lagrange, $1-\cos t\le t^2$, so $M_n\le m^2a^{2n}$) | easy |

Grid: 3 × (1 + 3) = 12. Steps: closed: limit (two pieces) → the difference at $x<1$ and at $x=1$ (two slots) → $M_n$ (slot) plus "is it attained?" (choice) → verdict.
sub: limit → why the maximum is at $a$ (checklist; wrong: "$1-\cos t$ increases for all $t\ge0$") → $M_n$ and limit → verdict.
Plot: $[0,1.1]$ or $[0,1.15a]$; marker: right end for $[0,a]$.
Excluded: $m\ge4$ ($m\ge\pi$ breaks monotonicity); $m=0$.

### 4. `unif-sin-root`: $f_n(x)=\sin\big(c\,x^{1/(kn)}\big)$, $c\in\{\frac12,1\}$, $k\in\{1,2\}$

Limit: $\sin c$ for $x>0$, $0$ at $x=0$. On $(0,1]$: $0<c\,x^{1/(kn)}\le c\le1<\frac\pi2$ and $\sin$ is increasing there (Lagrange: $\cos>0$), so
$\lvert f_n-f\rvert=\sin c-\sin(c\,x^{1/(kn)})$ decreases in $x$.

| Domain | Verdict | Argument | Level |
| --- | --- | --- | --- |
| $[0,1]$ | N | $\lim_{x\to0^+}\lvert f_n-f\rvert=\sin c$, so $M_n=\sin c$, not attained (also the continuity theorem, as the closing remark) | medium |
| $(0,1]$ | N | same, and the limit is **continuous**, so the theorem cannot help | advanced |
| $[a,1]$, $a\in\{\frac18,\frac14,\frac12,\frac34\}$ | U | **Lagrange bound**: $\lvert\sin u-\sin v\rvert\le\lvert u-v\rvert$ gives $\lvert f_n-f\rvert\le c(1-x^{1/(kn)})\le c(1-a^{1/(kn)})\to0$ (unneeded: the exact $M_n=\sin c-\sin(c\,a^{1/(kn)})$) | easy |

Grid: 4 parameter pairs $(c,k)$ × (1 + 1 + 4 domains) = 24; levels easy 16 / medium 4 / advanced 4.
Steps: $[0,1]$ and $(0,1]$: limit → $\lim_{x\to0^+}$ of the gap (slot) → $M_n$ and attainment (choice) → verdict.
$[a,1]$ (5 steps): limit → the Lagrange chain $\lvert f_n-f\rvert\le c(1-x^{1/(kn)})\le c(1-a^{1/(kn)})$ (two bound slots; wrong chips are false at some probe:
half the bound, the square, an extra factor $u$) → checklist (Lagrange, monotone root, bound independent of $x$; unneeded: the exact $M_n$) → limit of the bound (slot) → verdict.
Plot: $[0,1.05]$; marker: the left end for $[a,1]$. Brute force reaches the supremum only at $x\approx e^{-knt}$ (invisible on a uniform grid), hence the extra points and $n=10,20,40$.

### 5. `unif-diff-quotient`: quotients of $\sin,\cos$ (uniform), of $\sin(x^2)$ (not uniform), and a quotient with no pointwise limit

**(a) Trigonometric quotients**, $g_n(x)=\frac nk\big(\varphi(x+\frac kn)-\varphi(x)\big)$, $\varphi\in\{\sin,\cos\}$, $k\in\{1,2\}$ (4 instances, all uniform on $\mathbb R$).
Limit $\varphi'$. Mean value theorem: $g_n(x)=\varphi'(\xi)$, $\xi\in(x,x+\frac kn)$, and $\lvert\varphi'(\xi)-\varphi'(x)\rvert\le\lvert\xi-x\rvert\le\frac kn$ since $\lvert\varphi''\rvert\le1$.
Exact supremum (used by the check): $\sqrt{A^2+B^2}$, $A=\frac nk\sin\frac kn-1$, $B=\frac nk(\cos\frac kn-1)$; the bound $\frac kn$ holds for every $n$.
Level: $\sin,k{=}1$ easy; $\cos,k{=}1$ medium; $k{=}2$ advanced. Steps (5): the limit (derivative) → $g_n=\varphi'(\xi)$ → the chain $\lvert g_n-f\rvert\le\lvert\xi-x\rvert\le\frac kn$ (two bound slots)
→ what justifies the two bounds (checklist: Lagrange for the first link, "$\xi$ lies between $x$ and $x+\frac kn$" for the second; unneeded: the gap is at most $2$;
wrong: "$\xi$ is the midpoint", "$\xi$ does not depend on $x$") → verdict, which alone concludes uniformity from $M_n\le\frac kn\to0$ (course owner: the
checklist justifies the bounds only). Step 1 opens with «נסמן $h_n=\frac kn$ ונשכתב…», as do the $\sin(x^2)$ and polynomial quotients. Plot: $[-2\pi,2\pi]$.

**(b) Quotient of $\sin(x^2)$**, $k\in\{1,2\}$ (2 instances, not uniform, advanced). $\varphi=\sin(x^2)$, $f=\varphi'=2x\cos(x^2)$ on $\mathbb R$.
The Lagrange argument of (a) fails because $\varphi'$ is not uniformly continuous. Moving point $x_n=n\sqrt{2\pi}$: $x_n^2=2\pi n^2$, so $\sin(x_n^2)=0$, $\cos(x_n^2)=1$,
$f(x_n)=2\sqrt{2\pi}\,n$, while $\lvert f_n(x_n)\rvert=\frac nk\lvert\sin(2k\sqrt{2\pi}+\frac{k^2}{n^2})\rvert\le\frac nk$; hence $\lvert f_n(x_n)-f(x_n)\rvert\ge(2\sqrt{2\pi}-\frac1k)n\ge n\to\infty$.
The gap is an inequality, not an exact value (the exact value is irrational and unreadable); the check verifies the witness numerically.
Steps (4): limit (chain rule) → $f(x_n)$ and the bound on $\lvert f_n(x_n)\rvert$ (a slot and a bound slot) → checklist (unneeded: Lagrange gives $g_n=\varphi'(\xi)$, but $\varphi'$ is not uniformly continuous) → verdict
(wrong: "$\varphi$ is smooth and bounded, so the quotients converge uniformly"). Plot: $[-3,3]$; marker $x_n$ (visible for $n=1$ only).

**(c) No pointwise limit**: $f_n(x)=n\big(\sin(nx+c)-\sin(nx)\big)$, $c\in\{1,2,3\}$, on $[0,1]$, $[0,\infty)$ or $\mathbb R$ (9 instances, all not uniform; $[0,1]$ easy, the others medium).
At $x=0$: $f_n(0)=n\sin c\to\infty$ ($\sin c>0$), so there is **no pointwise limit**, and the convergence cannot be uniform (uniform implies pointwise).
The existence question is a **choice**, not a slot: the answer is "the limit does not exist", and slot chips hold expressions while a choice holds sentences. Its four options carry the expected
wrong ideas ("the limit is 0", "the limit is $\cos x$, as in a difference quotient", "bounded since $\lvert\sin\rvert\le1$"). Steps (3): $f_n(0)=n\sin c$ and its limit $\infty$ (two slots) → does the limit exist everywhere (choice; asked after the computation so its correct option does not give the computation away) → verdict
(wrong: "uniform since the interval is bounded", "not uniform, but pointwise yes"). The plot has no limit curve (`limit: null`); marker $x=0$.
The model carries `noLimit: {point: 0}` and the check verifies $\lvert f_n(0)\rvert\to\infty$ (at $n=10,100,1000$) instead of the supremum.

Grid: 4 + 2 + 9 = 15. Levels: easy 4 ($\sin,k{=}1$ and the three quotients without limit on $[0,1]$), medium 7, advanced 4.

### 6. `unif-one-minus-cos`: $f_n(x)=1-\cos\frac xn$

Limit $0$. $M_n=2$ on any ray containing $n\pi$ (attained at $x=n\pi$).

| Domain | Verdict | Argument | Level |
| --- | --- | --- | --- |
| $[0,a]$, $a\in\{2,3,4\}$ | U | $0\le f_n(x)\le\frac{x^2}{n^2}\le\frac{a^2}{n^2}$ by Lagrange, $1-\cos t=t\sin\xi\le t^2$ (bound slots; unneeded: exact $M_n=1-\cos\frac an$ for $n\ge a/\pi$) | easy |
| $[0,\infty)$ | N | moving point $x_n=n\pi$, $f_n(x_n)=2$ | medium |
| $[b,\infty)$, $b\in\{1,2,3\}$ | N | same ($n\pi\ge\pi>b$) | medium |

Grid: 3 + 1 + 3 = 7. Steps: sub: limit → bound chain (two bound slots; wrong chips $\frac{x^2}{4n^2}$, $\frac{x^4}{24n^4}$, ... are false at some $t$) →
what justifies it (checklist with the Lagrange inequality as a required reason; wrong: "the bound $\frac{x^2}{n^2}$ tends to 0 for each $x$") → verdict.
Rays: limit → $\frac{x_n}{n}=\pi$, $f_n(x_n)=2$ → what justifies it (checklist; wrong: "$\frac{x_n}{n}$ is constant so $f_n(x_n)\to0$") → verdict (wrong: "yes, since $f_n\le\frac{x^2}{n^2}\to0$").
Plot: bounded: $[0,1.15a]$, marker at $a$. Rays: window $[0,10\pi]$: the bump at $x_n=n\pi$ is visible for $n\le10$ only
(for larger $n$ it moves out of the window and the marker disappears, which is exactly the point: the bump escapes every compact window).
Excluded: $a=1$ (then $a^2=a$ and the distractor "$\frac{a}{n^2}$" would be correct); $a\ge5$ (nothing new); $b>\pi$ ($n=1$ would miss $x_n$).

### 7. `unif-poly-quotient`: $f_n(x)=n\big((x+\frac1n)^p-x^p\big)$, $p\in\{2,3\}$

Binomial expansion: $p=2$: $2x+\frac1n$; $p=3$: $3x^2+\frac{3x}n+\frac1{n^2}$. Limit $px^{p-1}=(x^p)'$.
Difference: $\frac1n$ ($p=2$, independent of $x$) or $\frac{3x}n+\frac1{n^2}$ ($p=3$, grows with $x$).

| $p$ | Domain | Verdict | Argument | Level |
| --- | --- | --- | --- | --- |
| 2 | $\mathbb R$, $[0,\infty)$, $[0,r]$ ($r\in\{1,2,3\}$) | U | $M_n=\frac1n$, also on unbounded domains | easy |
| 3 | $[0,r]$, $r\in\{1,2,3\}$ | U | increasing difference, $M_n=\frac{3r}n+\frac1{n^2}\to0$ | medium |
| 3 | $\mathbb R$, $[0,\infty)$ | N | moving point $x_n=n$, gap $3+\frac1{n^2}\to3$ | advanced |

Grid: 2 × 5 = 10. Steps (4): expansion and limit (two slots) → the difference (slot) → $M_n$ and limit, or the moving point (slots) → verdict.
Contrast on purpose: "unbounded domain" is a trap for $p=2$ (uniform) and the very reason for $p=3$ (not uniform).
Plot: $[-3,3]$ ($\mathbb R$), $[0,3]$, $[0,1.15r]$; marker: $x_n=n$ (visible for $n\le3$) or the right end.

### 8. `unif-arctan`: $f_n(x)=\arctan(nx)$

Limit: $0$ at $x=0$, $\frac\pi2$ for $x>0$.

| Domain | Verdict | Argument | Level |
| --- | --- | --- | --- |
| $[0,\infty)$, $[0,b]$ ($b\in\{1,2\}$) | N | moving point $x_n=\frac1n$: $f_n(x_n)=\frac\pi4$, $f(x_n)=\frac\pi2$ (unneeded: continuity theorem) | medium |
| $[a,\infty)$, $a\in\{\frac12,1,2\}$ | U | decreasing difference, $M_n=\frac\pi2-\arctan(na)\to0$ (unneeded: $=\arctan\frac1{na}\le\frac1{na}$) | easy |

Grid: 1 + 2 + 3 = 6. Steps (4): limit → moving point (three slots) → checklist → verdict; tail: limit → monotone justification (checklist) → $M_n$ and limit → verdict.
Plot: $[0,3]$ / $[0,1.15b]$ / $[0,a+3]$; marker $x_n=\frac1n$ or the left end.
$M_n=\frac\pi2-\arctan(na)$ is the accepted form; the equal $\arctan\frac1{na}$ is never offered as a distractor.

### 9. `unif-exp-decay`: $f_n(x)=e^{-nx}$

Limit: $1$ at $0$, $0$ for $x>0$.

| Domain | Verdict | Argument | Level |
| --- | --- | --- | --- |
| $[0,\infty)$, $[0,b]$ ($b\in\{1,2\}$) | N | continuity theorem (limit and right-limit at 0 as slots, then a choice among three statements of the theorem) | easy |
| $(0,\infty)$ | N | limit **continuous**; $M_n=\lim_{x\to0^+}e^{-nx}=1$ not attained | medium |
| $[a,\infty)$, $a\in\{\frac12,1,2\}$ | U | decreasing, $M_n=e^{-na}\to0$ (unneeded: $e^{-t}\le\frac1t$) | medium |

Grid: 1 + 2 + 1 + 3 = 7. Plot: $[0,3]$ / $[0,1.15b]$ / $[0,a+3]$; marker: the left end for the rays $[a,\infty)$.

### 10. `unif-sqrt-smoothing`

Two linked sequences (the second is the derivative of the first up to a constant: $\frac1n\sqrt{1+n^2x^2}=\sqrt{x^2+\frac1{n^2}}$):
(S) $f_n=\sqrt{x^2+\frac{k^2}{n^2}}\to\lvert x\rvert$, $k\in\{1,2,3\}$, and (Q) $g_n=\dfrac{nx}{\sqrt{1+n^2x^2}}\to\operatorname{sign}x$.

| Kind | Domain | Verdict | Argument | Level |
| --- | --- | --- | --- | --- |
| S | $\mathbb R$ ($k=1,2,3$) | U | conjugate identity $f_n-\lvert x\rvert=\dfrac{k^2}{n^2}\cdot\dfrac1{\sqrt{x^2+k^2/n^2}+\lvert x\rvert}$, largest at $0$, $M_n=\frac kn$ | medium |
| S | $[1,\infty)$ ($k=1,2,3$) | U | same identity, decreasing in $x$, $M_n=\sqrt{1+\frac{k^2}{n^2}}-1\le\frac{k^2}{2n^2}$ | advanced |
| Q | $[-1,1]$ | N | continuity theorem ($g_n$ continuous, $f$ jumps at 0) | easy |
| Q | $[a,\infty)$, $a\in\{1,2,3\}$ | U | Lagrange: $g_n'>0$, difference $1-g_n$ decreasing, $M_n=1-\dfrac{an}{\sqrt{1+a^2n^2}}\to0$ | easy ($a=1$), medium |

Grid: 6 + 1 + 3 = 10. Steps: S: limit → conjugate identity (slot; wrong: difference instead of sum in the denominator) → where the difference is largest
(checklist; unneeded: each $f_n$ is smooth although $\lvert x\rvert$ is not) → $M_n$ and limit → verdict (5 steps). Q-sym: limit (three pieces) → checklist → verdict (3 steps). Q-tail: limit → monotone (checklist) → $M_n$ → verdict.
Plot: $[-3,3]$, $[0,4]$, $[-1.2,1.2]$, $[0,a+3]$; markers at $0$, $1$ or $a$ (where the supremum is).

### 11. `unif-peak-power`: $f_n(x)=x^n(1-x)$ (plain) and $f_n(x)=n\,x^n(1-x)$ ("times $n$")

Limit $0$ on $[0,1]$. $f_n'=c_n x^{n-1}\big(n-(n+1)x\big)$, peak at $x_n=\frac n{n+1}$, height $\frac{n^n}{(n+1)^{n+1}}\le\frac1{n+1}$ (plain) or $\big(\frac n{n+1}\big)^{n+1}\to\frac1e$ (times $n$).

| Kind | Domain | Verdict | Argument | Level |
| --- | --- | --- | --- | --- |
| plain | $[0,1]$ | U | critical point and a candidate table, $M_n\to0$: **the peak moves but its height vanishes** | advanced |
| times $n$ | $[0,1]$ | N | same table, $M_n\to\frac1e$ | advanced |
| plain / times $n$ | $[0,a]$, $a\in\{\frac12,\frac23,\frac34\}$ | U | Lagrange: $f_n'>0$ on $[0,a]$ for $n>\frac a{1-a}$ (the peak $x_n\to1$ has left); $M_n=c_n a^n(1-a)\to0$ | easy (plain), medium (times $n$) |

Grid: 2 × (1 + 3) = 8. Steps: full: limit → $x_n$ (slot) → candidate table (ends and $x_n$, mark the maximum; part kind *table*) → limit of $M_n$ (slot) → verdict (5 steps).
sub: limit → checklist (monotone for $n>\frac a{1-a}$; wrong: "the peak is always in the interval") → $M_n$ and limit → verdict.
Plot: $[0,1.05]$ with marker $x_n$ (peak), or the right end $a$.
This family overlaps with the topic "מבחן הסופרמום" by design (the course owner asked for it); it is the only one with a table.

## Degenerate cases and parameter exclusions (summary)

* A parameter value that would make two chips equal or make a distractor true is excluded rather than patched
  (`a=1` in family 6; the chip builder also drops such a distractor, and throws when fewer than two remain, which makes the generator redraw).
* Excluded ideas: $x^n$ on $[0,b]$ with $b>1$ (no pointwise limit), $\tanh(nx)$ and $\frac{nx}{1+n^2x^2}$ (same arguments as `unif-arctan` and the supremum topic),
  $\frac{\sin nx}{n}$ (supremum topic), $\varphi=x^2$ for the derivative flavour on its own (it is the easy half of `unif-poly-quotient`).

## Examples (rendered as plain math)

* `unif-ratio-power`, advanced: "Does $f_n(x)=\frac{x^n}{1+x^{2n}}$ converge uniformly on the ray $[0,\infty)$?" →
  limit $0,\frac12,0$ → $x_n=2^{1/n}$: $x_n^n=2$, $f_n(x_n)=\frac25$, $f(x_n)=0$ → checklist → "not uniform: gap $\frac25$ for every $n$".
* `unif-one-minus-cos`, easy: "Does $1-\cos\frac xn$ converge uniformly on $[0,4]$?" →
  limit $0$ → (Lagrange) $0\le f_n\le\frac{x^2}{n^2}\le\frac{16}{n^2}$ → checklist → "uniform: $M_n\le\frac{16}{n^2}\to0$".
* `unif-diff-quotient`, advanced: $f_n=\frac n2\big(\cos(x+\frac2n)-\cos x\big)$ on $\mathbb R$ → limit $-\sin x$ → $-\sin\xi$ → $\le\lvert\xi-x\rvert\le\frac2n$ → uniform.
* `unif-peak-power`, advanced: $f_n=n x^n(1-x)$ on $[0,1]$ → $x_n=\frac n{n+1}$ → table: $0,0,\big(\frac n{n+1}\big)^{n+1}$ → $M_n\to\frac1e$ → not uniform.

## Decisions of the course owner (2026-10-02)

1. A non-uniform sibling of the difference quotients, and one without a pointwise limit: implemented (family 5, parts b and c).
2. `unif-exp-decay` and `unif-peak-power` stay as they are.
3. `unif-sin-root` now has the parameters $c$ and $k$ and four left endpoints; every level has several distinct instances.
4. Lagrange first, in the copy: see "Lagrange first" above. The glossary terms «משפט לגרנז'» and «משפט הרציפות» are used in the forms of `.agents/glossary.md`.
5. Fractions are reduced and tested: see "Reduced fractions" above.

## Still open

* The difficulty mix of a draw follows the instance counts (38% / 40% / 21% over 3000 draws), not 40/40/20 exactly.
* $\sin(x^2)$ has no exact, readable gap, so family 5(b) argues with an inequality ($\ge n$) rather than an equality.
