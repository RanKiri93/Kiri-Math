# Continuity of the limit: summary-practice families

Topic `continuity` («רציפות הגבול») of the summary practice ("תרגול מסכם"). Code:
`app/function-sequences-series/practice/continuityFamilies.ts` (five families, registered in `PRACTICE_FAMILIES` next to the
demo family `jumping-limit`, which stays); tests: `continuityFamilies.test.ts` (the whole grid of every family) and, for the
plot contract, `components/practicePlot.test.ts`.

Every exercise asks "does $f_n\to f$ uniformly on $I$?" for a fixed sequence of **piecewise defined** $f_n$. The topic is the
interplay of three facts, spread over the families on purpose:

| Fact | Where it decides |
| --- | --- |
| continuity theorem: a uniform limit of continuous functions is continuous («משפט הרציפות») | continuous $f_n$, discontinuous $f$ in the domain |
| a uniform limit of bounded functions is bounded | bounded $f_n$, unbounded $f$; the theorem above may be silent (the limit is continuous on the domain) |
| the supremum test (explicit $M_n$, an explicit gap, or $f_n=f$ from some $n$ on) | the limit is continuous, or the $f_n$ are not continuous, so the theorem says nothing |

The **domain is a main parameter** again: the same sequence is not uniform on a domain that contains the bad point and uniform on
a domain away from it (`far` instances), or decays or not by the height law.

## The families

Instances: 136 in all, 69 uniform and 67 not; 44 easy, 63 medium, 29 advanced. Every family has both verdicts and every level
it declares has at least two instances (so «avoid repeat» always has an alternative). Counts are verdict/level.

| familyId | $f_n$ | instances | uniform / not | easy / medium / advanced |
| --- | --- | --- | --- | --- |
| `cont-unbounded` (U) | ramp: $m^{p+1}x$ on $[0,\frac1m]$, $x^{-p}$ after; cap: $\min\{n,h(x)\}$ | 29 | 11 / 18 | 5 / 20 / 4 |
| `cont-ramp` (R) | $0$, then $hn(x-a)$, then $h$ (Heaviside type); two-sided $\max(-h,\min(h,hnx))$ | 39 | 12 / 27 | 12 / 18 / 9 |
| `cont-moving-peak` (T) | tent or bump of height $h$, $\frac hn$ or $\frac h{\sqrt n}$ with a moving peak | 30 | 22 / 8 | 15 / 9 / 6 |
| `cont-floor` (F) | $\frac{c\lfloor nx\rfloor}{n}$, $\frac{c\lfloor nx\rfloor}{n^2}$ | 14 | 12 / 2 | 8 / 4 / 2 |
| `cont-indicator` (I) | $H_n$ on $x\le\frac1n$, or $H_n$ at the single point $x=\frac1n$ | 24 | 12 / 12 | 4 / 12 / 8 |

Verdict/level splits: U not/easy 3, uniform/easy 2, not/medium 11, uniform/medium 9, not/advanced 4; R not/easy 12, not/medium 6,
uniform/medium 12, not/advanced 9; T not/easy 5, uniform/easy 10, not/medium 3, uniform/medium 6, uniform/advanced 6;
F uniform/easy 8, uniform/medium 4, not/advanced 2; I not/easy 4, not/medium 6, not/advanced 2, uniform/medium 6, uniform/advanced 6.

### U. Unbounded limits (`cont-unbounded`, request 1)

| Kind | $f_n$ | Parameters | Domains |
| --- | --- | --- | --- |
| ramp | $f_n=m^{p+1}x$ on $[0,\frac1m]$, $f_n=\frac1{x^p}$ on $[\frac1m,b]$; $m=n$ or $n+1$ | $p\in\{1,2\}$, $m\in\{n,n+1\}$ | $[0,1]$, $[0,2]$, $[0,\infty)$ (not uniform); $[\frac12,2]$, $[\frac14,1]$ (uniform) |
| cap | $f_n=\min\{n,h(x)\}$, junction $\frac1n$, $\frac1{n^2}$, $e^{-n}$ | $h\in\{\frac1x,\frac1{\sqrt x},\ln\frac1x\}$ | $(0,1]$; $(0,2]$ (for $\ln$: $(0,\frac12]$) (not uniform); $[\frac14,1]$ (uniform) |

The case $p=1$, $m=n+1$, $[0,1]$ is the guided example (C2) of the continuity activity.

* **Tier.** ramp $p=1$, $m=n$: easy; ramp otherwise: medium; cap $\frac1x$: medium, cap $\frac1{\sqrt x}$ and $\ln\frac1x$: advanced
  (the junction is $\frac1{n^2}$ or $e^{-n}$); the cap on $[\frac14,1]$: medium.
* **Two different arguments, and the trap between them.** On $[0,b]$ the limit has $f(0)=0$ and $f\to\infty$ at $0^+$, so *both* the
  continuity theorem and the bounded-limit theorem work; the first is the required checklist, the second an optional
  «נימוק שני» step. On $(0,b]$ the limit $h$ is **continuous**, so the continuity theorem is silent: the checklist requires
  "$f_n$ bounded, $f$ unbounded, the bounded-limit theorem", lists «$f$ is not continuous» as a wrong reason, and
  «each $f_n$ is continuous» as a true-but-unneeded one. "$f$ is unbounded, hence not uniform" is listed as a wrong reason as well
  (it needs the $f_n$ bounded).
* **Direct check for the cap:** $x_n=\frac12\cdot$junction gives $f_n(x_n)=n$, $f(x_n)=2n$, difference $n$, so $M_n\ge n$. For the ramp the
  analogous witness is $x_n=\frac1{2m}$ (used only by the self-check).
* **Uniform instances** ($f_n=f$ from some $n$ on): "$\frac1m\le a\iff n\ge N$" (an iff, so the accepted chip is unique), then $M_n=0$.
  For the cap on $[\frac14,1]$ the step is "$\max_{x\ge1/4}h(x)\le n\iff n\ge h(\frac14)$", justified by **Lagrange**: $h'<0$ ($h(\frac14)=4,2,\ln4$).
* **Steps.** ramp not uniform (5): the joint (two slot lines) → limit (slots) → reasons (checklist) → boundedness (a bound slot and a
  choice) → verdict. ramp uniform (5): joint → limit → threshold $n$ (slots) → reasons → verdict. cap not uniform (5): the junction
  $h(x)=n\iff x=\ldots$ (slot) → limit (slot) → reasons → direct check $x_n$ (slots) → verdict. cap uniform (4): limit → threshold
  (slots) → reasons with Lagrange → verdict.
* **Plot.** The view is capped at height 6: $f_n$ leaves it for large $n$ and the existing clipped-peak marker shows the growth;
  the limit of the ramp variants carries `limitBreaks: [0]` (the isolated value $f(0)=0$ as a closed dot).

### R. Ramps (`cont-ramp`, request 2)

$f_n=0$ for $x\le a$, $hn(x-a)$ on $[a,a+\frac1n]$, $h$ for $x\ge a+\frac1n$; the limit is $0$ for $x\le a$ and $h$ for $x>a$
($f(a)=0$: a jump at $a$). Two-sided: $-h$, $hnx$, $h$, limit $h\operatorname{sgn}x$.

| Kind | Parameters $(a,I)$ | Verdict | Argument | Tier |
| --- | --- | --- | --- | --- |
| through | $(0,[-1,1])$, $(\frac12,[0,1])$, $(1,[0,2])$, $(0,[-1,\infty))$; $h\in\{1,2,3\}$ | not uniform | continuity theorem; explicit gap at $x_n=a+\frac1{2n}$ ($h/2$) | easy |
| two-sided | $[-1,1]$, $[-2,2]$; $h\in\{1,2,3\}$ | not uniform | continuity theorem; gap at $x_n=\frac1{2n}$ | medium |
| open | $(0,(0,1])$, $(\frac12,(\frac12,1])$, $(1,(1,2])$; $h\in\{1,2,3\}$ | not uniform | the limit $h$ is continuous: theorem silent; $M_n=h$, approached at $a^+$ | advanced |
| far | $(a,c,I)$: $(0,\frac12,[\frac12,2])$, $(0,\frac14,[\frac14,1])$, $(\frac12,\frac14,[\frac34,1])$, $(1,\frac12,[\frac32,2])$ | uniform | $\frac1n\le c\iff n\ge\frac1c$, then $f_n=f$, $M_n=0$ | medium |

* **Steps (5 each).** through: joint continuity (slots: the middle expression at the two joints) → limit (slots) → reasons (checklist:
  continuous $f_n$, the jump of $f$, the theorem; optional «$f_n$ is nondecreasing»; wrong: «$f_n(a)=f(a)$ so there is no problem», «pointwise
  limit exists», «the middle piece shrinks to a point») → the explicit gap (slots: $f_n(x_n)=\frac h2$ and the difference $\frac h2$) → verdict.
  open: joint → limit → «is the theorem helpful?» (choice: no) → $M_n$ (slots: $\lim_{x\to a^+}\lvert f_n-f\rvert=h$, $M_n=h\to h$) →
  verdict. far: joint → limit → threshold slots → reasons → verdict.
* **Plot.** `limitBreaks: [a]` for through and two-sided (open and closed dots at the jump of $f$); no breaks for $f_n$ (continuous).

### T. Moving peak (`cont-moving-peak`, request 3)

| Shape | $f_n$ | Peak |
| --- | --- | --- |
| tent | $H_n\max\{0,1-\lvert nx-1\rvert\}$ | at $\frac1n$, support $[0,\frac2n]$ |
| tentR | $H_n\max\{0,1-\lvert n(x-1)+1\rvert\}$ | at $1-\frac1n$, moving to the right end |
| bump | $H_n\frac{2nx}{1+n^2x^2}$ | at $\frac1n$ (value $H_n$, by $(1-nx)^2\ge0$) |

Height $H_n=h\cdot g_n$ with $g_n\in\{1,\frac1n,\frac1{\sqrt n}\}$, $h\in\{1,2,3\}$ ($h\in\{1,2\}$ for tentR). The limit is $0$ (continuous), so the
theorem is silent and the supremum is read at the peak: $M_n=H_n$; **not uniform for $g_n=1$, uniform for $\frac1n$ and $\frac1{\sqrt n}$**
(the sibling pairs the course owner asked for). Domain $[0,1]$.

* `far` instances (bump with $g_n=1$, $h\in\{1,2,3\}$; domains $[\frac12,1]$, $[\frac14,\infty)$): the peak escapes the domain from $n\ge q$ ($a=\frac1q$),
  $f_n$ decreases for $x>\frac1n$ (**Lagrange**: $f_n'(x)=\frac{2hn(1-n^2x^2)}{(1+n^2x^2)^2}<0$), so $M_n=f_n(a)=\frac{2hqn}{q^2+n^2}\to0$. Tier advanced.
* **Tier.** tent, tentR: easy; bump on $[0,1]$: medium; `far`: advanced.
* **Steps.** full (4): limit (slots; for tentR the point $x=1$) → candidate table (three rows: the corners or ends, the peak is the maximum) →
  $M_n$ and its limit (slots) → verdict. far (5): limit → $\frac1n\le a\iff n\ge q$ (slot) → reasons with Lagrange (checklist, optional
  «$f_n\ge0$») → $M_n=f_n(a)\to0$ (slots) → verdict.
* **Plot.** A marker at the moving peak ("הפסגה הנעה"), or at the left end for `far`.

### F. Integer part (`cont-floor`, request 4)

| Kind | $f_n$ | Limit | Domains | Verdict | Tier |
| --- | --- | --- | --- | --- | --- |
| lin | $\frac{c\lfloor nx\rfloor}{n}$, $c\in\{1,2\}$ | $cx$ | $[0,1)$, $[0,1]$, $[-1,1]$, $[0,\infty)$ | uniform: $0\le cx-f_n<\frac cn$ | easy |
| quad | $\frac{c\lfloor nx\rfloor}{n^2}$, $c\in\{1,2\}$ | $0$ | $[0,1]$, $[0,2]$; $[0,\infty)$ | uniform: $f_n\le\frac{cx}n\le\frac{cb}n$; not uniform on the ray: $f_n(n)=c$ | medium; advanced (ray) |

The $f_n$ are discontinuous for $n\ge2$ (a jump of $\frac cn$ resp. $\frac c{n^2}$ at every inner point $\frac kn$); the limit is continuous. The lin
family is the guided example C3 with variants: the converse of the continuity theorem fails (a uniform limit may be continuous without the $f_n$ being so).
**Steps (4):** are the $f_n$ continuous? (choice) → limit (slots) → the bound (bound-checked slots: $\frac cn$, and $\frac{cx}n$ then $M_n\le\frac{cb}n\to0$) or the moving
point ($x_n=n$, $f_n(n)=c$) → verdict, whose wrong options include «not uniform because the $f_n$ are not continuous» and «a contradiction of the theorem».
The plot splits $f_n$ at the jumps $\frac kn$ (dots up to 24 jumps).

### I. Indicators (`cont-indicator`, request 4)

$H_n=h$ or $\frac hn$. interval: $H_n$ for $x\le\frac1n$, else $0$; point: $H_n$ at $x=\frac1n$, else $0$. $h\in\{1,2\}$, domains $[0,1]$, $[0,2]$, $(0,1]$.

| $H_n$ | Limit | Verdict | Tier |
| --- | --- | --- | --- |
| $h$, interval | $f(0)=h$, else $0$ (on $[0,\cdot]$); $0$ on $(0,1]$ | not uniform ($M_n=h$) | easy ($[0,\cdot]$), medium ($(0,1]$) |
| $h$, point | $0$ | not uniform | medium ($[0,\cdot]$), advanced ($(0,1]$) |
| $\frac hn$ | $0$ | uniform ($M_n=\frac hn$) | medium (interval), advanced (point) |

The point of the family: **the continuity theorem does not apply because the $f_n$ are not continuous**, even where the limit does jump ($[0,1]$, interval,
$H_n=h$: the wrong option «not uniform, since $f$ is discontinuous at $0$ by the theorem» is offered, with the diagnosis that the argument is invalid even though the
conclusion is true). **Steps (4):** are the $f_n$ continuous? → limit → the moving point $x_n=\frac1{2n}$ (resp. $\frac1n$) with $\lvert f_n(x_n)-f(x_n)\rvert=h$, or
$M_n=\frac hn\to0$ → verdict. The plot splits at $x=\frac1n$ with open and closed dots (an isolated value for the point kind).

## Common structure

* **Steps.** 4 or 5 per exercise; the first is the pointwise limit or the joint, the last is the verdict, a single choice (correct id `uniform` or `not-uniform`) with a
  `minimalProof`. Part kinds: slot templates, a candidate table (T), reason checklists with a «נימוק מיותר» item (U, R, T, wrong reasons that sound right), single choices.
* **Notation.** $M_n=\sup\lvert f_n-f\rvert$ and $f$ are named in each statement; the statement says "הסדרה $f_n$, המוגדרת למטה", the definition (a `cases` environment,
  or a $\min$) is the display formula. Hebrew in the plural imperative; «משפט הרציפות», «משפט לגרנז'», «מבחן הסופרמום». «קטע» / «קרן» agree with the domain (a test
  checks the noun and that the other never appears). The middle, rising piece of a ramp is «החלק העולה» (see the open questions).
* **Answers are tokens.** One accepted chip per slot, three or four chips, numeric fingerprints all distinct (equivalent forms never appear as distractors); an iff slot
  ($\frac1n\le c\iff n\ge N$) has a unique answer because the threshold is stated as an equivalence; every wrong chip, option and item carries a diagnosis. Inequality slots
  (the bound $\frac cn$, $\frac{cx}n$, the bound on $f_n$ for the peaks) are held to the stricter rule that a wrong chip is false at some probe.
* **Readability.** Constants first ("$2n$", "$3nx$"), reduced fractions (`fr`, `fracN`, and the rational constructor reduces), no vanishing or unit coefficients, no floats,
  junctions rational ($\frac1n$, $\frac1{n+1}$, $\frac1{n^2}$) except the requested $e^{-n}$. All tested.
* **Self-validation.** Every instance has a `Model` (numeric $f_n$, $f$, domain, verdict, claimed supremum, gap and moving point) and `checkModel` (the shared one from
  `uniformFamilies.ts`) compares it with a brute-force supremum (6000-point grid, geometric points near the ends and near the jump points, plus the exact peak, jump
  or witness point), the pointwise limit at sample points, and the witness. For $\ln$ the indices are 20, 50, 100 (the witness $e^{-2n}$ underflows beyond $n=372$);
  for $\frac h{\sqrt n}$ they are $100,10^4,10^6$ (the peak is exact); for the far bump $100,400,1600$. A generator retries and then falls back, as in the other families.
  The test sweeps the whole grid of each family: `validateExercise`, KaTeX strict on every fragment, chip and template line, chip distinctness, wrong chips failing the
  checker, bound slots, verdict agreement with the model, notation, reduced fractions, noun agreement, plot sanity, at least two instances per level.
* **Lagrange.** Used where a derivative sign gives a bound: $h'<0$ in `cont-unbounded` (cap on $[\frac14,1]$) and $f_n'<0$ in `cont-moving-peak` (far). The other bounds are
  not Lagrange bounds: $nx-1<\lfloor nx\rfloor\le nx$ is the definition of the integer part, and the supremum of the tent or of the cap is attained at a corner.

## The plot contract (shared; extended minimally)

`PracticePlotSpec` (`practice/practiceTypes.ts`) gets two optional fields; absent, the drawing and all existing tests are unchanged:

* `breaks?: (n: number) => number[]`: points where $f_n$ jumps or takes an isolated value.
* `limitBreaks?: number[]`: the same for the limit $f$.

`components/PracticePlot.tsx`: `splitSamples` cuts the sampled $x$ at the breaks (one path piece per side, nothing is connected across a jump); `breakDots` puts, at
each break, a closed dot where the value taken equals a one-sided limit and an open dot where it does not (and a closed dot for a value equal to neither). A break at
an end of the domain only trims that end and marks the isolated value there. The $\varepsilon$-band is split like the limit. More than `BREAK_DOT_MAX = 24` breaks
(a fine staircase) are split but get no dots. Tests: `practicePlot.test.ts` (splitting, dots, endpoints, the band, the staircase) and, per instance, `continuityFamilies.test.ts`
(every claimed break is a real discontinuity; every jump larger than 20% of the window height has a break; the unbounded exercises leave the window for $n=40$ and not for $n=1$).

## What was excluded

* $\min\{n,\frac1x\}$ on $[0,1]$ "with a suitable value at $0$": there is none: $f_n(0)=n$ gives no pointwise limit at $0$, and $f_n(0)=0$ makes $f_n$ discontinuous at $0$.
  The closed-at-$0$ version uses the ramp $n^2x$ (R) instead, as in the guided example; the caps live on $(0,b]$.
* The two-sided or shifted ramps on a domain not containing the jump on the left ($x\le a$): trivial ($M_n=0$ for every $n$).
* Smooth bumps whose supremum needs calculus ($nxe^{-nx}$, $x^n(1-x)$ and the like): they are the supremum families.
* Floor families beyond the two kinds above; indicator families with several steps of different heights.
* A third discontinuous-$f_n$ family: the owner asked for "about two small families".

## To decide with the course owner

1. **Hebrew term for the ramp.** The copy says «עלייה ליניארית» in titles and «החלק העולה» for the middle piece. Add it to the glossary, or choose another term.
2. **«משפט החסימות»** is used informally for "a uniform limit of bounded functions is bounded" (solved note of the ramp). The glossary has no name for it, nor does the guided
   continuity activity (it says "משפט אחר שניתן להוכיח").
3. **Far (uniform) siblings.** Every family offers a uniform sibling, by the height law (T, I, and F through $\frac{c\lfloor nx\rfloor}{n^2}$ on finite domains) or by a domain away
   from the bad point (U, R and the bump in T). The indicators have no such domain sibling on purpose: away from $0$ the $f_n$ are eventually the continuous function $0$, which
   defeats the point of the family. Keep both kinds, or drop the "far" ones as too easy (they teach "the domain decides").
4. **The indicator limit trap.** The wrong option «not uniform, since $f$ is discontinuous» for the interval indicator has a true conclusion and an invalid argument. Keep it as a wrong option
   (current), or make it «נימוק מיותר»-style feedback?
5. **Dots on a staircase.** Above 24 jumps the dots are dropped (floor at $n>24$); a smaller bound or a smoothed look is possible.
6. **Lagrange.** It appears in two places (the decreasing tail). If the owner wants it more often, the natural place is a derivative sign in the peaks (tent: slopes $\pm Hn$) or a Lagrange bound
   for $\lvert f_n-f\rvert\le\lvert f'\rvert\cdot\frac1n$ in a family with a smooth $f_n$; that would be a new family rather than a change here.
