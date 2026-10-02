# Supremum test: summary-practice families

Topic `supremum` of the summary practice ("תרגול מסכם"). Code: `app/function-sequences-series/practice/supremumFamilies.ts`;
tests: `supremumFamilies.test.ts` (the whole grid). Two families, drawn from `PRACTICE_FAMILIES` next to the two demo families.

| familyId | sequence | tier |
| --- | --- | --- |
| `sup-power-exponential` (A) | $f_n(x)=n^{a}x^{b}e^{-n^{c}x^{d}}$ | easy (integer exponents) / medium (fractional) |
| `sup-power-rational` (B) | $f_n(x)=\dfrac{n^{a}x^{b}}{1+n^{c}x^{d}}$ | easy (integer exponents) / advanced (fractional) |

The level is per instance (`instanceDifficulty`), decided with the course owner: all four exponents integers → easy (in
both families); fractional exponents → medium in A, advanced in B. Reasons: A needs the product rule and the chain rule and its
critical-point equation is $n^{c}x^{d}=b/d$; B needs the quotient rule, a constant $\frac{d-b}{d}\left(\frac{b}{d-b}
ight)^{b/d}$ and
the extra condition $a<c$. The student picks a level (or all levels) in the practice toolbar; the demo family $x^n$ on $[0,b]$ is easy.
Unbounded domains are called «קרן» and bounded ones «קטע» in the copy.

> Topic: these families are drawn under the practice topic «התכנסות נקודתית ובמידה שווה» (`pointwise`), merged with the
> uniform-convergence families on 2026-10-02; there is no separate «מבחן הסופרמום» topic any more.

## Decisions taken (course owner, 2026-10-01)

1. The "where is the maximum" step keeps its guiding prompt.
2. Student-selectable levels: integer exponents easy; fractional medium (A) / advanced (B).
3. Every card shows a plot of $f_n$ with an $n$ slider and the critical point $x_n$ marked (`plotSpecOf`).
4. The demo family $x^n$ on $[0,b]$ stays, as an easy exercise.
5. Unbounded domains are «קרן».

## Still open

Nothing open at the moment.

## Earlier open question

1. (Decided) Domains $[\alpha,M]$ always end in "uniform" and add little beyond the tail domains, so they are drawn less
   often: domain kinds are drawn half 35%, short 30%, tail 25%, mixed 10% (`pickDraw`).
