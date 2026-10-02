/**
 * Two parametric families of the supremum-test topic of the summary practice:
 *   (A) f_n(x) = n^a x^b e^{-n^c x^d}      (B) f_n(x) = n^a x^b / (1 + n^c x^d)
 * on [0,inf), [alpha,inf), [0,alpha] and [alpha,M]. Specification: docs/question-families/supremum-practice.md.
 *
 * Pure TypeScript, no React. Exponents are exact reduced fractions (`Rat`); floats appear only in
 * the numeric self-check and never in displayed LaTeX (`e` lives only inside LaTeX strings).
 * Each generator verifies its own draw (formulas against a brute-force supremum) and redraws on failure.
 */
import { L, S, choicePart, slot, slotsPart, template } from "../math/guidedSteps";
import type { TokenLabel } from "../math/supremumTypes";
import type { SeededRandom } from "../../constant-coefficients-euler/practice/random";
import type { PracticeDifficulty, PracticeExercise, PracticeFamily, PracticePlotSpec, PracticeStep } from "./practiceTypes";

const H = String.raw;

// ---------------------------------------------------------------------------------------------
// Exact rationals and LaTeX helpers
// ---------------------------------------------------------------------------------------------

export type Rat = { n: number; d: number };
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
export const R = (n: number, d = 1): Rat => {
  const sign = d < 0 ? -1 : 1;
  const g = gcd(n, d) || 1;
  return { n: (sign * n) / g, d: (sign * d) / g };
};
const add = (x: Rat, y: Rat) => R(x.n * y.d + y.n * x.d, x.d * y.d);
const sub = (x: Rat, y: Rat) => R(x.n * y.d - y.n * x.d, x.d * y.d);
const mul = (x: Rat, y: Rat) => R(x.n * y.n, x.d * y.d);
const div = (x: Rat, y: Rat) => R(x.n * y.d, x.d * y.n);
const neg = (x: Rat) => R(-x.n, x.d);
const inv = (x: Rat) => R(x.d, x.n);
const eq = (x: Rat, y: Rat) => x.n === y.n && x.d === y.d;
const num = (x: Rat) => x.n / x.d;
const isInt = (x: Rat) => x.d === 1;
const ONE = R(1);
const ZERO = R(0);
const ratKey = (x: Rat) => (isInt(x) ? String(x.n) : `${x.n}/${x.d}`);

/** A rational as LaTeX: "2" or "\tfrac{1}{2}" (inline size) / "\frac{1}{2}" (exponents). */
const ratLatex = (x: Rat, big = false) => (isInt(x) ? String(x.n) : `${x.n < 0 ? "-" : ""}\\${big ? "frac" : "tfrac"}{${Math.abs(x.n)}}{${x.d}}`);
/** Exponent body, to be put inside braces. */
const expLatex = (x: Rat) => ratLatex(x, true);
/** sym^e, omitted when e = 0 and bare when e = 1. */
const mono = (sym: string, e: Rat) => (e.n === 0 ? "" : eq(e, ONE) ? sym : `${sym}^{${expLatex(e)}}`);
/** A product of LaTeX factors, constants first by convention of the callers: a plain integer touches the
 * next factor ("2n", "4n^{3}"), other factors are separated by a thin space ("\\sqrt{3}\\,n"). */
const join = (...parts: string[]) => parts.filter((p) => p !== "")
  .reduce((out, part, i, all) => (i === 0 ? part : `${out}${/^\d+$/.test(all[i - 1]) ? "" : "\\,"}${part}`), "");

/** A positive constant with exact LaTeX and a float value used for numeric checks only. */
type Const = { latex: string; value: number; one: boolean };
const C_ONE: Const = { latex: "", value: 1, one: true };
const ratConst = (x: Rat): Const => (eq(x, ONE) ? C_ONE : { latex: ratLatex(x), value: num(x), one: false });
const mulConst = (a: Const, b: Const): Const => (a.one ? b : b.one ? a : { latex: `${a.latex}\\,${b.latex}`, value: a.value * b.value, one: false });
/** base^e for a positive rational base and rational exponent, kept exact. */
function constPow(base: Rat, e: Rat): Const {
  if (eq(base, ONE) || e.n === 0) return C_ONE;
  if (isInt(e) && Math.abs(e.n) <= 4) {
    let acc = ONE;
    for (let i = 0; i < Math.abs(e.n); i += 1) acc = mul(acc, base);
    return ratConst(e.n < 0 ? inv(acc) : acc);
  }
  const value = Math.pow(num(base), num(e));
  if (eq(e, R(1, 2))) return { latex: `\\sqrt{${ratLatex(base)}}`, value, one: false };
  const b = isInt(base) ? String(base.n) : `\\left(${ratLatex(base)}\\right)`;
  return { latex: `${b}^{${expLatex(e)}}`, value, one: false };
}
/** (r/e)^r written exactly (r = p/q), the constant of M_n in family A. */
function eConst(r: Rat): Const {
  const value = Math.pow(num(r) / Math.E, num(r));
  if (eq(r, R(1, 2))) return { latex: "\\sqrt{\\frac{1}{2e}}", value, one: false };
  if (isInt(r) && r.n >= 1 && r.n <= 4) return { latex: `\\frac{${r.n ** r.n}}{e${r.n === 1 ? "" : `^{${r.n}}`}}`, value, one: false };
  return { latex: `\\left(\\frac{${r.n}}{${r.d === 1 ? "" : r.d}e}\\right)^{${expLatex(r)}}`, value, one: false };
}
/** c * n^k as LaTeX ("1" when both are trivial). */
const withN = (c: Const, k: Rat) => join(c.latex, mono("n", k)) || "1";

// ---------------------------------------------------------------------------------------------
// Parameters, domains, analysis
// ---------------------------------------------------------------------------------------------

export type FamilyKind = "A" | "B";
export type Params = { kind: FamilyKind; a: Rat; b: Rat; c: Rat; d: Rat };
export type DomainKind = "half" | "short" | "tail" | "mixed";
export type Domain = { kind: DomainKind; lo: Rat; hi: Rat | null };
export type Verdict = "zero" | "constant" | "infinite";

const tLatex = (p: Params) => `${mono("n", p.c)}${mono("x", p.d)}`;

/** The sequence as display LaTeX, without the domain. */
export function fnLatex(p: Params): string {
  const lead = `${mono("n", p.a)}${mono("x", p.b)}`;
  return p.kind === "A" ? `${lead}e^{-${tLatex(p)}}` : `\\frac{${lead || "1"}}{1+${tLatex(p)}}`;
}
export function domainLatex(dom: Domain): string {
  const lo = dom.kind === "half" || dom.kind === "short" ? "0" : ratLatex(dom.lo);
  return dom.hi ? `[${lo},${ratLatex(dom.hi)}]` : `[${lo},\\infty)`;
}
const fnNum = (p: Params, n: number, x: number) => {
  const lead = Math.pow(n, num(p.a)) * Math.pow(x, num(p.b));
  const t = Math.pow(n, num(p.c)) * Math.pow(x, num(p.d));
  return p.kind === "A" ? lead * Math.exp(-t) : lead / (1 + t);
};

/** The characteristic value of T = n^c x^d at the critical point: b/d (A) or b/(d-b) (B). */
const criticalT = (p: Params) => (p.kind === "A" ? div(p.b, p.d) : div(p.b, sub(p.d, p.b)));

export type Analysis = {
  /** Exponent of n in M_n on the full half-line: a - bc/d. */
  k: Rat;
  /** x_n = xnConst * n^xnK. */
  xnConst: Const;
  xnK: Rat;
  /** M_n = mnConst * n^k when the maximum is at x_n. */
  mnConst: Const;
  /** Whether the maximum is at the interior point x_n (domain reaches 0) or at the left endpoint. */
  interior: boolean;
  verdict: Verdict;
};

export function analyze(p: Params, dom: Domain): Analysis {
  const ratio = div(p.b, p.d);
  const k = sub(p.a, mul(ratio, p.c));
  const t = criticalT(p);
  const xnConst = constPow(t, inv(p.d));
  const mnConst = p.kind === "A" ? eConst(ratio) : mulConst(ratConst(div(sub(p.d, p.b), p.d)), constPow(t, ratio));
  const interior = dom.kind === "half" || dom.kind === "short";
  const verdict: Verdict = !interior || k.n < 0 ? "zero" : k.n === 0 ? "constant" : "infinite";
  return { k, xnConst, xnK: neg(div(p.c, p.d)), mnConst, interior, verdict };
}
const xnNum = (an: Analysis, n: number) => an.xnConst.value * Math.pow(n, num(an.xnK));
const mnNum = (an: Analysis, n: number) => an.mnConst.value * Math.pow(n, num(an.k));

// ---------------------------------------------------------------------------------------------
// Numeric self-check
// ---------------------------------------------------------------------------------------------

/** Brute-force supremum of a unimodal-or-monotone f on [lo,hi] (hi null = a large cutoff), log-scaled grid + golden refinement. */
export function numericSup(f: (x: number) => number, lo: number, hi: number | null): { value: number; arg: number } {
  const t0 = Math.log(Math.max(lo, 1e-100));
  const t1 = Math.log(hi ?? 1e6);
  const N = 6000;
  let best = -Infinity;
  let bestI = 0;
  for (let i = 0; i <= N; i += 1) {
    const v = f(Math.exp(t0 + ((t1 - t0) * i) / N));
    if (v > best) { best = v; bestI = i; }
  }
  let a = t0 + ((t1 - t0) * Math.max(bestI - 1, 0)) / N;
  let b = t0 + ((t1 - t0) * Math.min(bestI + 1, N)) / N;
  const g = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 80; i += 1) {
    const c = b - g * (b - a);
    const d = a + g * (b - a);
    if (f(Math.exp(c)) > f(Math.exp(d))) b = d; else a = c;
  }
  const refined = f(Math.exp((a + b) / 2));
  if (refined > best) return { value: refined, arg: Math.exp((a + b) / 2) };
  return { value: best, arg: Math.exp(t0 + ((t1 - t0) * bestI) / N) };
}

/** Largest index the card's n slider offers. */
const PLOT_MAX_N = 40;

/**
 * The card's graph: f_n on the domain with the limit 0 and the critical point x_n marked. The
 * window shows the peak for small n (x_1 and the left part of the domain); taller values for
 * larger n are clipped and marked by the plot.
 */
export function plotSpecOf(p: Params, dom: Domain, an: Analysis): PracticePlotSpec {
  const lo = num(dom.lo);
  const hi = dom.hi ? num(dom.hi) : Infinity;
  const x1 = xnNum(an, 1);
  const xMax = dom.kind === "half" ? Math.max(3, Math.ceil(2.5 * x1))
    : dom.kind === "short" ? hi * 1.15
      : dom.kind === "tail" ? lo + 3
        : hi * 1.1;
  // Tallest value over the drawn window for n = 1 and n = 4 (cheap grid plus x_n when inside).
  let top = 0;
  for (const n of [1, 4]) {
    const right = Math.min(hi, xMax);
    const xs = Array.from({ length: 201 }, (_, i) => lo + ((right - lo) * i) / 200);
    const xn = xnNum(an, n);
    if (xn >= lo && xn <= right) xs.push(xn);
    for (const x of xs) {
      const v = fnNum(p, n, x);
      if (Number.isFinite(v)) top = Math.max(top, v);
    }
  }
  const yMax = top > 0 ? top * 1.25 : 1;
  return {
    value: (n, x) => fnNum(p, n, x),
    limit: () => 0,
    domain: { left: lo, right: hi, leftClosed: true, rightClosed: dom.hi !== null },
    view: { xMin: 0, xMax, yMin: -0.06 * yMax, yMax },
    maxN: PLOT_MAX_N,
    marker: (n) => xnNum(an, n),
    markerLabel: "הנקודה החשודה לקיצון",
  };
}

/** First n (200, 400, ...) from which the maximum lies where the argument says (x_n well inside / left of the endpoint). */
function startN(p: Params, dom: Domain, an: Analysis): number {
  const bound = dom.kind === "short" ? num(dom.hi!) : dom.kind === "half" ? Infinity : num(dom.lo);
  let n = 200;
  while (xnNum(an, n) >= 0.9 * bound && n < 1e9) n *= 2;
  return n;
}

const closeTo = (x: number, y: number, tol: number) => Math.abs(x - y) <= tol * Math.max(Math.abs(x), Math.abs(y)) + 1e-300;
const selfCheckMemo = new Map<string, string[]>();

/** Problems found when the claims of the argument are compared with a brute-force supremum; empty when sound. */
export function selfCheck(p: Params, dom: Domain): string[] {
  const key = signatureOf(p, dom);
  const cached = selfCheckMemo.get(key);
  if (cached) return cached;
  const problems: string[] = [];
  const an = analyze(p, dom);
  const lo = num(dom.lo);
  const hi = dom.hi ? num(dom.hi) : null;
  const n1 = startN(p, dom, an);
  const NBIG = 1e8;
  const sup = (n: number) => numericSup((x) => fnNum(p, n, x), lo, hi);
  const claimed = (n: number) => (an.interior ? mnNum(an, n) : fnNum(p, n, lo));
  for (const n of [n1, NBIG]) {
    const s = sup(n);
    if (!closeTo(s.value, claimed(n), 1e-8)) problems.push(`M_n(${n}) = ${claimed(n)} but sup = ${s.value}`);
    if (an.interior) {
      if (!closeTo(Math.log(s.arg), Math.log(xnNum(an, n)), 1e-6)) problems.push(`argmax(${n}) = ${s.arg} but x_n = ${xnNum(an, n)}`);
      const upper = dom.kind === "short" ? hi! : Infinity;
      if (!(xnNum(an, n) < upper)) problems.push(`x_n(${n}) outside the domain`);
    } else if (!closeTo(s.arg, lo, 1e-9) || !(xnNum(an, n) < lo)) problems.push(`maximum not at the left endpoint for n=${n}`);
  }
  // The derivative factor of the argument against a central difference at a sample point.
  const n0 = 3;
  const x0 = 0.7;
  const T = Math.pow(n0, num(p.c)) * Math.pow(x0, num(p.d));
  const lead = Math.pow(n0, num(p.a)) * Math.pow(x0, num(sub(p.b, ONE)));
  const closed = p.kind === "A"
    ? lead * Math.exp(-T) * (num(p.b) - num(p.d) * T)
    : (lead * (num(p.b) - num(sub(p.d, p.b)) * T)) / Math.pow(1 + T, 2);
  const h = 1e-6;
  const central = (fnNum(p, n0, x0 + h) - fnNum(p, n0, x0 - h)) / (2 * h);
  if (!closeTo(closed, central, 1e-6)) problems.push(`derivative formula ${closed} vs ${central}`);
  // The verdict against the numeric behaviour of the supremum.
  const s1 = sup(n1).value;
  const s2 = sup(NBIG).value;
  const slope = Math.log(s2 / s1) / Math.log(NBIG / n1);
  const observed: Verdict = s2 < 0.05 && s2 < s1 ? "zero" : Math.abs(slope) < 0.01 ? "constant" : slope > 0.1 ? "infinite" : "zero";
  if (observed !== an.verdict) problems.push(`verdict ${an.verdict} but numeric ${observed} (slope ${slope})`);
  selfCheckMemo.set(key, problems);
  return problems;
}

// ---------------------------------------------------------------------------------------------
// Parameter grids (see the specification document)
// ---------------------------------------------------------------------------------------------

const pairs = (list: [Rat, Rat][]) => list;
/** (b,d) with b/d in {1/2, 1, 2} (A). */
export const PAIRS_A = pairs([
  [R(1), R(1)], [R(2), R(2)], [R(1, 2), R(1, 2)],
  [R(1, 2), R(1)], [R(1), R(2)],
  [R(2), R(1)], [R(1), R(1, 2)],
]);
/** (b,d) with b/(d-b) in {1/2, 1, 2} (B). */
export const PAIRS_B = pairs([
  [R(1), R(2)], [R(1, 2), R(1)], [R(1, 4), R(1, 2)],
  [R(2), R(3)], [R(2, 3), R(1)],
  [R(1), R(3)], [R(1, 3), R(1)],
]);
export const C_A = [R(1, 2), R(1), R(3, 2), R(2), R(3)];
export const A_A = [R(0), R(1, 2), R(1), R(3, 2), R(2), R(3)];
export const C_B = [R(1), R(3, 2), R(2), R(3)];
export const A_B = [R(0), R(1, 2), R(1), R(3, 2), R(2), R(5, 2)];

const ALL_DOMAINS: Domain[] = [
  { kind: "half", lo: ZERO, hi: null },
  { kind: "short", lo: ZERO, hi: R(1) },
  { kind: "short", lo: ZERO, hi: R(2) },
  { kind: "tail", lo: R(1), hi: null },
  { kind: "tail", lo: R(2), hi: null },
  { kind: "mixed", lo: R(1, 2), hi: R(3) },
  { kind: "mixed", lo: R(1), hi: R(3) },
  { kind: "mixed", lo: R(2), hi: R(5) },
];
export { ALL_DOMAINS as SUPREMUM_DOMAINS };

/** Readability gate: |k| <= 3, and a fractional left endpoint only with integer b and d (so alpha^b stays short). */
function readable(p: Params, dom: Domain, k: Rat): boolean {
  if (Math.abs(num(k)) > 3) return false;
  if (!isInt(dom.lo) && !(isInt(p.b) && isInt(p.d))) return false;
  return true;
}

export function paramGrid(kind: FamilyKind): Params[] {
  const out: Params[] = [];
  for (const [b, d] of kind === "A" ? PAIRS_A : PAIRS_B) {
    for (const c of kind === "A" ? C_A : C_B) {
      for (const a of kind === "A" ? A_A : A_B) {
        // Family B needs a < c (pointwise limit 0). Family A needs a >= 0 (given by the sets).
        if (kind === "B" && !(num(a) < num(c))) continue;
        out.push({ kind, a, b, c, d });
      }
    }
  }
  return out.filter((p) => Math.abs(num(analyze(p, ALL_DOMAINS[0]).k)) <= 3);
}

/** Every (parameters, domain) pair the family can draw. */
export function exerciseGrid(kind: FamilyKind): { params: Params; domain: Domain }[] {
  const out: { params: Params; domain: Domain }[] = [];
  for (const params of paramGrid(kind)) {
    const k = analyze(params, ALL_DOMAINS[0]).k;
    for (const domain of ALL_DOMAINS) if (readable(params, domain, k)) out.push({ params, domain });
  }
  return out;
}

export function signatureOf(p: Params, dom: Domain): string {
  const hi = dom.hi ? ratKey(dom.hi) : "inf";
  return `${p.kind}:a=${ratKey(p.a)},b=${ratKey(p.b)},c=${ratKey(p.c)},d=${ratKey(p.d)};I=[${ratKey(dom.lo)},${hi}]`;
}

// ---------------------------------------------------------------------------------------------
// Chips with distractors
// ---------------------------------------------------------------------------------------------

type Cand = { latex: string; sig: number[]; diagnosis: string };
const differs = (x: Cand, y: Cand) => x.sig.some((v, i) => v !== y.sig[i] && !(Math.abs(v - y.sig[i]) <= 1e-9 * Math.max(1, Math.abs(v), Math.abs(y.sig[i]))));
const N_PROBES = [3, 17, 101];

function shuffle<T>(rng: SeededRandom, items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = rng.integer(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

class TokenBook {
  tokens: Record<string, TokenLabel> = {};
  add(id: string, latex: string) {
    this.tokens[id] = { latex };
    return id;
  }
}

/** A one-slot chip set: the correct candidate plus up to three distinct wrong ones. Throws when fewer than two wrong ones remain. */
function chipSlot(book: TokenBook, rng: SeededRandom, slotId: string, correct: Cand, wrongs: Cand[]) {
  const kept: Cand[] = [];
  for (const w of shuffle(rng, wrongs)) {
    if (differs(w, correct) && kept.every((o) => differs(o, w) && o.latex !== w.latex)) kept.push(w);
    if (kept.length === 3) break;
  }
  if (kept.length < 2) throw new Error(`too few distinct distractors for ${slotId}`);
  const okId = book.add(`${slotId}-ok`, correct.latex);
  const wrongIds = kept.map((w, i) => book.add(`${slotId}-w${i}`, w.latex));
  const diagnoses = Object.fromEntries(kept.map((w, i) => [wrongIds[i], w.diagnosis]));
  const chips = shuffle(rng, [okId, ...wrongIds]);
  return slot(slotId, chips, okId, diagnoses);
}

// ---------------------------------------------------------------------------------------------
// The exercise
// ---------------------------------------------------------------------------------------------

const LIM_TOKENS: [string, string][] = [["zero", "0"], ["inf", "\\infty"]];

/** Builds the exercise for given parameters; throws when the instance lacks distinct distractors. */
export function buildSupremumExercise(familyId: string, p: Params, dom: Domain, rng: SeededRandom): PracticeExercise {
  const an = analyze(p, dom);
  const book = new TokenBook();
  for (const [id, latex] of LIM_TOKENS) book.add(id, latex);
  book.add("one", "1");
  const A = p.kind === "A";
  const f = fnLatex(p);
  const I = domainLatex(dom);
  const T = tLatex(p);
  const alpha = dom.lo;
  const critical = criticalT(p);
  const lead = `${mono("n", p.a)}${mono("x", sub(p.b, ONE))}`;
  const domText = `$${I}$`;
  // An unbounded domain is a ray (קרן, feminine); a bounded one an interval (קטע, masculine).
  const bounded = dom.hi !== null;
  const noun = bounded ? "קטע" : "קרן";
  const endpointDom = !an.interior;

  // ---- step 1: pointwise limit
  const hasZero = dom.kind === "half" || dom.kind === "short";
  const limWhy = A
    ? H`האקספוננט $e^{-${T}}$ דועך מהר יותר מכל חזקה של $n$, ולכן המכפלה שואפת ל־$0$.`
    : H`החזקה של $n$ במכנה, $c=${ratLatex(p.c)}$, גדולה מזו שבמונה, $a=${ratLatex(p.a)}$, ולכן המנה שואפת ל־$0$.`;
  const step1Parts = [
    ...(hasZero ? [slotsPart(template("p1-zero", [L(H`x=0:\quad f_n(0)=`), S("v")], [
      slot("v", ["zero", "one", "inf"], "zero", { one: H`הציבו $x=0$: $x^{${expLatex(p.b)}}=0$.`, inf: H`הציבו $x=0$: $x^{${expLatex(p.b)}}=0$ לכל $n$.` }),
    ]))] : []),
    slotsPart(template("p1-lim", [L(hasZero ? H`x>0:\quad \lim_{n\to\infty}f_n(x)=` : H`x\in${I}:\quad \lim_{n\to\infty}f_n(x)=`), S("v")], [
      slot("v", ["zero", "one", "inf"], "zero", {
        inf: A ? H`$n^{${expLatex(p.a)}}$ גדל, אבל $e^{-${T}}$ דועך מהר יותר.` : H`בדקו את החזקות של $n$ במונה ובמכנה: $a<c$.`,
        one: H`זה היה נכון רק אילו החזקות של $n$ במונה ובמכנה היו שוות.`,
      }),
    ])),
  ];
  const step1: PracticeStep = {
    id: "sup-1", exampleId: "practice", title: "הגבול הנקודתי",
    prompt: H`חשבו את הגבול הנקודתי $f(x)=\lim f_n(x)$ ב${noun} ${domText}.`,
    parts: step1Parts,
    hints: [A ? H`מה מנצח כש־$n\to\infty$: החזקה $n^{${expLatex(p.a)}}$ או האקספוננט $e^{-${T}}$?` : H`השוו את החזקה המובילה של $n$ במונה ובמכנה.`],
    solvedNote: H`$f=0$ בכל נקודה של ${domText}. ${limWhy}`,
    graph: null,
  };

  // ---- step 2: derivative factor
  const tVar = T;
  const linLatex = (u: Rat, v: Rat) => {
    const vAbs = R(Math.abs(v.n), v.d);
    const term = join(eq(vAbs, ONE) ? "" : ratLatex(vAbs), tVar) || tVar;
    return `\\left(${ratLatex(u)}${v.n < 0 ? "-" : "+"}${term}\\right)`;
  };
  const factorCand = (u: Rat, v: Rat, diagnosis: string): Cand => ({
    latex: linLatex(u, v),
    sig: [0.37, 1.9].map((t) => num(u) + num(v) * t),
    diagnosis,
  });
  // The factor is u - w*T; v = -w.
  const dMinusB = sub(p.d, p.b);
  const correctFactor = A ? factorCand(p.b, neg(p.d), "") : factorCand(p.b, neg(dMinusB), "");
  // A distractor whose T-coefficient vanishes, e.g. (1/2 + 0·T), gives itself away: drop it.
  const wrongFactor = (u: Rat, v: Rat, diagnosis: string): Cand[] => (v.n === 0 ? [] : [factorCand(u, v, diagnosis)]);
  const wrongFactors: Cand[] = (A
    ? [
        wrongFactor(p.b, p.d, H`נגזרת $e^{-g}$ היא $-g'e^{-g}$: הסימן של האקספוננט נשאר מינוס.`),
        wrongFactor(p.b, neg(ONE), H`הנגזרת של $-${T}$ היא $-${join(eq(p.d, ONE) ? "" : ratLatex(p.d), mono("n", p.c), mono("x", sub(p.d, ONE)))}$: יש להכפיל גם בחזקה $d$ (כלל השרשרת).`),
        wrongFactor(p.d, neg(p.b), H`הגורם $b$ מגיע מנגזרת $x^{b}$ והגורם $d$ מנגזרת האקספוננט; הם התחלפו.`),
        wrongFactor(ONE, neg(p.d), H`נגזרת $x^{b}$ היא $bx^{b-1}$ ולא $x^{b-1}$: חסר המקדם $b$.`),
        wrongFactor(p.b, neg(p.c), H`המקדם של ${T} הוא $d$, החזקה של $x$ באקספוננט, ולא $c$.`),
        wrongFactor(p.b, neg(add(p.d, ONE)), H`גוזרים $x^{d}$ בכלל החזקה: מורידים את החזקה ב־$1$ ולא מעלים אותה.`),
      ]
    : [
        wrongFactor(p.b, dMinusB, H`בכלל המנה המונה הוא $u'v-uv'$, ושם $v'$ נכנס עם סימן מינוס.`),
        wrongFactor(p.b, neg(p.d), H`$u'v$ תורם גם $b\,${T}$ לצד $-d\,${T}$: מקבלים $b-(d-b)${T}$.`),
        wrongFactor(p.b, neg(add(p.d, p.b)), H`$u'v-uv'$: האיבר $u'v$ נותן $b(1+${T})$, וצריך להפחית ממנו את $d\,${T}$ ולא להוסיף.`),
        wrongFactor(dMinusB, neg(p.b), H`$b$ ו־$d-b$ התחלפו: $b$ מגיע מנגזרת המונה.`),
        wrongFactor(p.b, neg(sub(p.d, ONE)), H`הגורם הוא $d-b$ ולא $d-1$: $b$ מגיע מ־$x^{b}$ במונה.`),
        wrongFactor(p.b, neg(add(dMinusB, ONE)), H`המקדם של ${T} הוא $d-b$, בלי $1$ נוסף.`),
      ]).flat();
  const step2Template = A
    ? template("p2-der", [L(H`f_n'(x)=${lead}e^{-${T}}\cdot`), S("v2")], [chipSlot(book, rng, "v2", correctFactor, wrongFactors)])
    : template("p2-der", [L(H`f_n'(x)=\frac{${lead || "1"}}{\left(1+${T}\right)^{2}}\cdot`), S("v2")], [chipSlot(book, rng, "v2", correctFactor, wrongFactors)]);
  const step2: PracticeStep = {
    id: "sup-2", exampleId: "practice", title: "הנגזרת",
    prompt: A
      ? H`$f_n$ גזירה ב־$(0,\infty)$. גזרו בכלל המכפלה (ובכלל השרשרת עבור $e^{-${T}}$), הוציאו גורם משותף והשלימו את הגורם שבסוגריים.`
      : H`$f_n$ גזירה ב־$(0,\infty)$. גזרו בכלל המנה, הוציאו גורם משותף והשלימו את הגורם שבסוגריים.`,
    parts: [slotsPart(step2Template)],
    hints: A
      ? [H`$\left(e^{-g}\right)'=-g'e^{-g}$ עם $g=${T}$.`, H`הוציאו את הגורם המשותף $${lead}e^{-${T}}$.`]
      : [H`$f_n'=\dfrac{u'v-uv'}{v^{2}}$ עם $u=${join(mono("n", p.a), mono("x", p.b)) || "1"}$ ו־$v=1+${T}$.`, H`הוציאו את הגורם המשותף $${lead || "1"}$ מהמונה.`],
    solvedNote: H`$f_n'(x)=${A ? `${lead}e^{-${T}}` : `\\dfrac{${lead || "1"}}{\\left(1+${T}\\right)^{2}}`}\cdot${correctFactor.latex}$. הגורמים שלפני הסוגריים חיוביים ב־$(0,\infty)$, ולכן סימן $f_n'$ הוא סימן הסוגריים.`,
    graph: null,
  };

  // ---- step 3: critical point
  const xnCand = (c: Const, k: Rat, diagnosis: string): Cand => ({
    latex: withN(c, k),
    sig: N_PROBES.map((n) => c.value * Math.pow(n, num(k))),
    diagnosis,
  });
  const tConst = ratConst(critical);
  const rootD = inv(p.d);
  const correctXn = xnCand(an.xnConst, an.xnK, "");
  const wrongXn: Cand[] = [
    xnCand(an.xnConst, neg(an.xnK), H`כש־$n$ גדל, $n^{c}x^{d}=${ratLatex(critical)}$ נותן $x$ קטן יותר: החזקה של $n$ שלילית.`),
    xnCand(tConst, an.xnK, H`צריך להעלות את שני האגפים בחזקת $${expLatex(rootD)}$, כולל הקבוע $${ratLatex(critical)}$.`),
    xnCand(an.xnConst, neg(p.c), H`את $x^{${expLatex(p.d)}}$ מבודדים בהעלאה בחזקת $${expLatex(rootD)}$, וגם $n^{-c}$ עובר אותה העלאה.`),
    xnCand(an.xnConst, neg(div(p.d, p.c)), H`$x^{${expLatex(p.d)}}=\ldots n^{-${expLatex(p.c)}}$: החזקות $c$ ו־$d$ התחלפו.`),
    xnCand(constPow(inv(critical), rootD), an.xnK, H`$${T}=${ratLatex(critical)}$ נותן $x^{${expLatex(p.d)}}=${ratLatex(critical)}\,n^{-c}$, לא ההופכי.`),
    xnCand(C_ONE, an.xnK, H`שכחתם את הקבוע $${ratLatex(critical)}^{${expLatex(rootD)}}$.`),
    ...(A ? [] : [xnCand(constPow(div(p.b, p.d), rootD), an.xnK, H`הקבוע הוא $\frac{b}{d-b}$ ולא $\frac{b}{d}$.`)]),
    xnCand(an.xnConst, R(-1), H`החזקה של $n$ היא $-\frac{c}{d}$ ולא $-1$.`),
    xnCand(an.xnConst, mul(an.xnK, R(1, 2)), H`בדקו את החזקה של $n$: מעלים את $n^{-c}$ בחזקת $${expLatex(rootD)}$.`),
    ...(A ? [xnCand({ latex: "\\frac{1}{e}", value: 1 / Math.E, one: false }, an.xnK, H`הנקודה החשודה נקבעת ממשוואת חזקות $${T}=${ratLatex(critical)}$, בלי $e$.`)] : []),
  ];
  const step3: PracticeStep = {
    id: "sup-3", exampleId: "practice", title: "נקודה חשודה לקיצון",
    prompt: H`לפי משפט פרמה, אם המקסימום של $f_n$ מתקבל בנקודה פנימית אז $f_n'=0$ שם. הנגזרת מתאפסת ב־$(0,\infty)$ רק כשהגורם שבסוגריים מתאפס. מצאו את הנקודה החשודה לקיצון $x_n$.`,
    parts: [slotsPart(template("p3-xn", [L(H`f_n'(x)=0\iff ${T}=${ratLatex(critical)}\iff x_n=`), S("v3")], [
      chipSlot(book, rng, "v3", correctXn, wrongXn),
    ]))],
    hints: [H`בודדו $x^{${expLatex(p.d)}}$ ואז העלו את שני האגפים בחזקת $${expLatex(rootD)}$.`],
    solvedNote: H`$x_n=${correctXn.latex}$, ו־$x_n\to0$ כאשר $n\to\infty$.`,
    graph: null,
  };

  // ---- step 4: where is the maximum
  const sgn = H`הסוגריים חיוביים ל־$x<x_n$ ושליליים ל־$x>x_n$`;
  const hiText = dom.hi ? ratLatex(dom.hi) : "";
  const step4Options = (() => {
    if (dom.kind === "half") {
      return {
        prompt: H`$f_n(0)=0$, ו־$f_n>0$ ב־$(0,\infty)$. ${sgn}, ו־$f_n(x)\to0$ כאשר $x\to\infty$. איפה $\lvert f_n\rvert$ מקבלת את הסופרמום?`,
        options: [
          { id: "at-xn", correct: true, label: H`ב־$x_n$: $f_n$ עולה עד $x_n$ ויורדת אחריה, ולכן $M_n=f_n(x_n)$.` },
          { id: "at-0", correct: false, label: H`בקצה $x=0$, שהוא הקצה היחיד של התחום.`, diagnosis: H`$f_n(0)=0$ ו־$f_n>0$ בהמשך, ולכן $0$ הוא הערך הקטן ביותר ולא הגדול.` },
          { id: "at-inf", correct: false, label: H`אין מקסימום: התחום אינו חסום, והסופרמום מתקבל באינסוף.`, diagnosis: H`$f_n\to0$ באינסוף ו־$f_n>0$, ולכן הגבול באינסוף קטן מערכי $f_n$ ליד $x_n$. המקסימום מתקבל ב־$x_n$.` },
        ],
        proof: H`$f_n(0)=0$, $f_n>0$ ב־$(0,\infty)$ ו־$f_n\to0$ באינסוף; לכן יש מקסימום, והוא בנקודה היחידה שבה $f_n'=0$, כלומר ב־$x_n$.`,
      };
    }
    if (dom.kind === "short") {
      return {
        prompt: H`$x_n\to0$, ולכן מ־$n$ מסוים מתקיים $0<x_n<${ratLatex(dom.hi!)}$, כלומר $x_n$ בתוך הקטע. ${sgn}. איפה המקסימום של $f_n$ בקטע ${domText}?`,
        options: [
          { id: "at-xn", correct: true, label: H`ב־$x_n$: $f_n$ עולה ב־$[0,x_n]$ ויורדת ב־$[x_n,${ratLatex(dom.hi!)}]$.` },
          { id: "at-right", correct: false, label: H`בקצה הימני $x=${ratLatex(dom.hi!)}$, כי הקטע סגור.`, diagnosis: H`אחרי $x_n$ הפונקציה יורדת, ולכן $f_n(${ratLatex(dom.hi!)})<f_n(x_n)$.` },
          { id: "at-0", correct: false, label: H`בקצה $x=0$.`, diagnosis: H`$f_n(0)=0$, והפונקציה חיובית ובהמשך עולה.` },
        ],
        proof: H`מ־$n$ מסוים $x_n$ בתוך $(0,${ratLatex(dom.hi!)})$. $f_n$ עולה לפניה ויורדת אחריה, ולכן $M_n=f_n(x_n)$.`,
      };
    }
    const right = dom.kind === "mixed"
      ? { id: "at-right", correct: false, label: H`בקצה הימני $x=${hiText}$.`, diagnosis: H`מימין ל־$x_n$ הנגזרת שלילית, ולכן $f_n$ יורדת ושם הערך הקטן ביותר.` }
      : { id: "at-inf", correct: false, label: H`באינסוף: התחום אינו חסום.`, diagnosis: H`מימין ל־$x_n$ הנגזרת שלילית, ו־$f_n$ יורדת (עם גבול $0$ באינסוף).` };
    return {
      prompt: H`$x_n\to0$, ולכן מ־$n$ מסוים $x_n<${ratLatex(alpha)}$, כלומר $x_n$ מחוץ לתחום. ${sgn}. איפה המקסימום של $f_n$ בקטע ${domText}?`,
      options: [
        { id: "at-left", correct: true, label: H`בקצה השמאלי $x=${ratLatex(alpha)}$: כל התחום מימין ל־$x_n$, ושם $f_n'<0$ ו־$f_n$ יורדת.` },
        { id: "at-xn", correct: false, label: H`ב־$x_n$, כי שם $f_n'=0$.`, diagnosis: H`מ־$n$ מסוים $x_n<${ratLatex(alpha)}$, ולכן $x_n$ אינה בתחום ואין בו נקודה חשודה לקיצון.` },
        right,
      ],
      proof: H`מ־$n$ מסוים $x_n<${ratLatex(alpha)}$, ולכן $f_n'<0$ בכל התחום ו־$f_n$ יורדת בו. המקסימום בקצה השמאלי: $M_n=f_n(${ratLatex(alpha)})$.`,
    };
  })();
  const step4: PracticeStep = {
    id: "sup-4", exampleId: "practice", title: "איפה המקסימום?",
    prompt: step4Options.prompt,
    parts: [choicePart("p4-where", "בחרו את המסקנה.", shuffle(rng, step4Options.options))],
    hints: [H`בדקו אם $x_n$ נמצאת בתוך ה${noun} ${domText} כש־$n$ גדול, ומה סימן $f_n'$ ב${noun}.`],
    solvedNote: step4Options.proof,
    minimalProof: step4Options.proof,
    graph: null,
  };

  // ---- step 5: M_n and its limit
  const mnCand = (c: Const, k: Rat, diagnosis: string): Cand => ({
    latex: withN(c, k),
    sig: N_PROBES.map((n) => c.value * Math.pow(n, num(k))),
    diagnosis,
  });
  /** f_n at the point x0 (a rational), exact LaTeX, with variants for distractors. */
  const valueAt = (x0: Rat, variant: "ok" | "plus" | "noexp" | "nopow" | "drop1" | "numer", diagnosis: string): Cand => {
    const pb = constPow(x0, p.b);
    const pd = constPow(x0, p.d);
    const X = join(pd.one ? "" : pd.latex, mono("n", p.c));
    const x0n = num(x0);
    const sig = N_PROBES.map((n) => {
      const nn = Math.pow(n, num(p.a));
      const t = Math.pow(n, num(p.c)) * Math.pow(x0n, num(p.d));
      const pbv = Math.pow(x0n, num(p.b));
      if (A) {
        switch (variant) {
          case "ok": return nn * pbv * Math.exp(-t);
          case "plus": return nn * pbv * Math.exp(t);
          case "noexp": return nn * pbv;
          case "nopow": return nn * Math.exp(-t);
          default: return NaN;
        }
      }
      switch (variant) {
        case "ok": return (nn * pbv) / (1 + t);
        case "drop1": return (nn * pbv) / t;
        case "numer": return nn * pbv;
        case "nopow": return nn / (1 + t);
        default: return NaN;
      }
    });
    // The constant x0^b comes before n^a ("2n e^{-4n^{3}}", not "n\\,2\\,e^{...}").
    const numer = join(pb.one ? "" : pb.latex, mono("n", p.a));
    let latex: string;
    if (A) {
      latex = variant === "plus" ? `${numer}\\,e^{${X}}` : variant === "noexp" ? numer || "1" : variant === "nopow" ? `${mono("n", p.a)}e^{-${X}}` : `${numer}\\,e^{-${X}}`;
    } else {
      const numerB = variant === "nopow" ? mono("n", p.a) || "1" : numer || "1";
      latex = variant === "numer" ? numerB : `\\frac{${numerB}}{${variant === "drop1" ? X : `1+${X}`}}`;
    }
    return { latex: latex.replace(/^\\,/, ""), sig, diagnosis };
  };
  const ratioR = div(p.b, p.d);
  const correctMn: Cand = an.interior
    ? mnCand(an.mnConst, an.k, "")
    : valueAt(alpha, "ok", "");
  const interiorWrongs: Cand[] = A
    ? [
        mnCand(constPow(ratioR, ratioR), an.k, H`בהצבה ב־$x_n$ מתקבל גם הגורם $e^{-${ratLatex(ratioR)}}$ מהאקספוננט.`),
        mnCand({ latex: "\\frac{1}{e}", value: 1 / Math.E, one: false }, an.k, H`הקבוע כולל את $\left(${ratLatex(ratioR)}\right)^{${expLatex(ratioR)}}$ מ־$x_n^{${expLatex(p.b)}}$ ואת $e^{-${ratLatex(ratioR)}}$, ולא רק $\frac1e$.`),
        mnCand(an.mnConst, sub(p.a, p.c), H`$x_n^{${expLatex(p.b)}}$ תורם $n^{-bc/d}$, ולא $n^{-c}$.`),
        mnCand(an.mnConst, add(p.a, mul(ratioR, p.c)), H`$x_n$ קטנה כש־$n$ גדל, ולכן $x_n^{b}$ מקטינה את החזקה של $n$.`),
        mnCand(an.mnConst, neg(mul(ratioR, p.c)), H`שכחתם את הגורם $n^{${expLatex(p.a)}}$ שבסדרה.`),
      ]
    : [
        mnCand(constPow(critical, ratioR), an.k, H`בהצבה ב־$x_n$ המכנה הוא $1+${ratLatex(critical)}$, ויש להחזיר את הגורם $\frac{d-b}{d}$.`),
        mnCand(ratConst(div(sub(p.d, p.b), p.d)), an.k, H`$x_n^{${expLatex(p.b)}}$ תורם גם את הקבוע $\left(\frac{b}{d-b}\right)^{b/d}$.`),
        mnCand(an.mnConst, sub(p.a, p.c), H`$x_n^{${expLatex(p.b)}}$ תורם $n^{-bc/d}$, ולא $n^{-c}$.`),
        mnCand(an.mnConst, add(p.a, mul(ratioR, p.c)), H`$x_n$ קטנה כש־$n$ גדל, ולכן $x_n^{b}$ מקטינה את החזקה של $n$.`),
        mnCand(an.mnConst, neg(mul(ratioR, p.c)), H`שכחתם את הגורם $n^{${expLatex(p.a)}}$ שבסדרה.`),
      ];
  const rightEndWrong = (x0: Rat, note: string) => valueAt(x0, "ok", note);
  const endpointWrongs: Cand[] = [
    mnCand(an.mnConst, an.k, H`זה הערך ב־$x_n$, שאינה בתחום ${domText}.`),
    ...(A
      ? [valueAt(alpha, "plus", H`האקספוננט הוא $e^{-n^{${expLatex(p.c)}}x^{${expLatex(p.d)}}}$ עם מינוס.`),
         valueAt(alpha, "noexp", H`שכחתם את הגורם האקספוננציאלי.`),
         valueAt(alpha, "nopow", H`שכחתם את הגורם $x^{${expLatex(p.b)}}$ ב־$x=${ratLatex(alpha)}$.`)]
      : [valueAt(alpha, "drop1", H`במכנה יש $1+n^{${expLatex(p.c)}}x^{${expLatex(p.d)}}$, לא רק האיבר השני.`),
         valueAt(alpha, "numer", H`שכחתם את המכנה $1+n^{${expLatex(p.c)}}x^{${expLatex(p.d)}}$.`),
         valueAt(alpha, "nopow", H`שכחתם את הגורם $x^{${expLatex(p.b)}}$ ב־$x=${ratLatex(alpha)}$.`)]),
    ...(dom.kind === "mixed" ? [rightEndWrong(dom.hi!, H`זה הערך בקצה הימני $x=${hiText}$, ושם $f_n$ יורדת ולכן הערך קטן.`)] : []),
  ];
  const shortWrong = dom.kind === "short" ? [rightEndWrong(dom.hi!, H`זה הערך בקצה הימני $x=${ratLatex(dom.hi!)}$; המקסימום ב־$x_n$.`)] : [];
  const mnWrongs = an.interior ? [...interiorWrongs, ...shortWrong] : endpointWrongs;
  const mnSlot = chipSlot(book, rng, "v5", correctMn, mnWrongs);
  const limSlotDiag = (v: Verdict): Partial<Record<string, string>> => {
    const byVerdict: Record<Verdict, string> = {
      zero: an.interior ? H`החזקה של $n$ ב־$M_n$ שלילית, ולכן $M_n\to0$.` : (A ? H`בביטוי $f_n(${ratLatex(alpha)})$ האקספוננט הדועך מנצח כל חזקה של $n$, ולכן $M_n\to0$.` : H`בביטוי $f_n(${ratLatex(alpha)})$ המכנה גדל מהר יותר מהמונה, ולכן $M_n\to0$.`),
      constant: H`החזקה של $n$ ב־$M_n$ היא $0$: $M_n$ קבוע, ושונה מ־$0$.`,
      infinite: H`החזקה של $n$ ב־$M_n$ חיובית, ולכן $M_n\to\infty$.`,
    };
    return { zero: byVerdict[v], cst: byVerdict[v], inf: byVerdict[v] };
  };
  book.add("cst", an.mnConst.latex || "1");
  const limToken = an.verdict === "zero" ? "zero" : an.verdict === "constant" ? "cst" : "inf";
  const limDiag = limSlotDiag(an.verdict);
  delete limDiag[limToken];
  const mnTemplate = template("p5-mn", [L(H`M_n=`), S("v5"), L(H`\xrightarrow[n\to\infty]{}`), S("lim")], [
    mnSlot,
    slot("lim", ["zero", "cst", "inf"], limToken, limDiag as Record<string, string>),
  ]);
  const step5: PracticeStep = {
    id: "sup-5", exampleId: "practice", title: H`חישוב $M_n$ וגבולו`,
    prompt: an.interior
      ? H`ל־$n$ גדול מספיק, $M_n=\sup_{x\in${I}}\lvert f_n(x)\rvert=f_n(x_n)$. הציבו את $x_n$ (שימו לב ש־$${T}=${ratLatex(critical)}$ בנקודה זו), וחשבו את הגבול של $M_n$.`
      : H`ל־$n$ גדול מספיק, $M_n=\sup_{x\in${I}}\lvert f_n(x)\rvert=f_n(${ratLatex(alpha)})$. כתבו את הביטוי וחשבו את הגבול של $M_n$.`,
    parts: [slotsPart(mnTemplate)],
    hints: an.interior
      ? [H`$${T}=${ratLatex(critical)}$ ב־$x_n$, ולכן ${A ? H`$e^{-${T}}=e^{-${ratLatex(critical)}}$` : H`$1+${T}=${ratLatex(add(ONE, critical))}$`}. נשאר $n^{${expLatex(p.a)}}x_n^{${expLatex(p.b)}}$.`, H`החזקה של $n$ ב־$M_n$ היא $a-\frac{bc}{d}=${ratLatex(an.k)}$.`]
      : [H`הציבו $x=${ratLatex(alpha)}$ ב־$f_n(x)$ בלי לפשט.`, A ? H`אקספוננט דועך מנצח כל חזקה של $n$.` : H`השוו את החזקה של $n$ במונה ובמכנה: $a<c$.`],
    solvedNote: an.interior
      ? H`$M_n=${correctMn.latex}$, והחזקה של $n$ היא $${ratLatex(an.k)}$. ${an.verdict === "zero" ? "לכן $M_n\\to0$." : an.verdict === "constant" ? "לכן $M_n$ קבוע ושונה מ־$0$." : "לכן $M_n\\to\\infty$."}`
      : H`$M_n=f_n(${ratLatex(alpha)})=${correctMn.latex}\to0$.`,
    graph: null,
  };

  // ---- step 6: verdict
  const optU = { id: "uniform", label: H`ההתכנסות ב־${domText} במידה שווה, כי $M_n\to0$.` };
  const optC = { id: "const", label: H`ההתכנסות ב־${domText} אינה במידה שווה, כי $M_n$ מתכנסת לקבוע שונה מ־$0$.` };
  const optI = { id: "inf", label: H`ההתכנסות ב־${domText} אינה במידה שווה, כי $M_n\to\infty$.` };
  const trueId = an.verdict === "zero" ? "uniform" : an.verdict === "constant" ? "const" : "inf";
  const extra = an.verdict === "zero"
    ? { id: "moves", label: H`ההתכנסות ב־${domText} אינה במידה שווה, כי נקודת המקסימום $x_n$ זזה עם $n$.`, diagnosis: H`מבחן הסופרמום בודק את הגובה $M_n$ ולא את מיקום הפסגה. פסגה שנעה אך שואפת ל־$0$ בגובהה אינה מפריעה.` }
    : { id: "pointwise", label: H`ההתכנסות ב־${domText} במידה שווה, כי $f_n\to0$ בכל נקודה של ה${noun}.`, diagnosis: H`התכנסות נקודתית אינה מספיקה: במידה שווה אם ורק אם $M_n\to0$.` };
  const verdictDiag: Record<string, string> = {
    uniform: H`בדקו את הגבול שחישבתם בשלב הקודם: $M_n$ אינה שואפת ל־$0$.`,
    const: H`בדקו את החזקה של $n$ ב־$M_n$: היא אינה $0$.`,
    inf: H`בדקו את החזקה של $n$ ב־$M_n$: היא אינה חיובית.`,
  };
  const verdictOptions = [optU, optC, optI].map((o) => ({
    id: o.id, label: o.label, correct: o.id === trueId, ...(o.id === trueId ? {} : { diagnosis: verdictDiag[o.id] }),
  }));
  const proofVerdict = an.interior
    ? H`הגבול הנקודתי הוא $0$. $f_n'$ מתאפסת ב־$(0,\infty)$ רק ב־$x_n=${correctXn.latex}$, ושם $f_n$ עוברת מעלייה לירידה. לכן $M_n=${correctMn.latex}$${dom.kind === "short" ? H` (כי $x_n$ בקטע מ־$n$ מסוים)` : ""}. ${an.verdict === "zero" ? "$M_n\\to0$, ולכן לפי מבחן הסופרמום ההתכנסות במידה שווה." : an.verdict === "constant" ? "$M_n$ קבוע ושונה מ־$0$, ולכן לפי מבחן הסופרמום ההתכנסות אינה במידה שווה." : "$M_n\\to\\infty$, ולכן לפי מבחן הסופרמום ההתכנסות אינה במידה שווה."}`
    : H`הגבול הנקודתי הוא $0$. מ־$n$ מסוים $x_n<${ratLatex(alpha)}$, ולכן $f_n$ יורדת ב${noun} ו־$M_n=f_n(${ratLatex(alpha)})\to0$. לפי מבחן הסופרמום ההתכנסות במידה שווה.`;
  const trap = endpointDom && num(an.k) >= 0
    ? H` שימו לב: ב־$[0,\infty)$ ההתכנסות אינה במידה שווה (שם $M_n=${withN(an.mnConst, an.k)}$), אבל ה${noun} ${domText} ${bounded ? "רחוק" : "רחוקה"} מהפסגה $x_n\to0$.`
    : "";
  const step6: PracticeStep = {
    id: "sup-6", exampleId: "practice", title: "המסקנה",
    prompt: H`מה המסקנה לפי מבחן הסופרמום על ההתכנסות של $f_n$ ל־$0$ ב${noun} ${domText}?`,
    parts: [choicePart("p6-verdict", "בחרו את המסקנה.", shuffle(rng, [...verdictOptions, { id: extra.id, label: extra.label, correct: false, diagnosis: extra.diagnosis }]))],
    hints: [H`מבחן הסופרמום: $f_n\to f$ במידה שווה אם ורק אם $M_n\to0$.`],
    solvedNote: H`${an.verdict === "zero" ? "$M_n\\to0$, ולכן ההתכנסות במידה שווה." : "$M_n\\not\\to0$, ולכן ההתכנסות אינה במידה שווה."}${trap}`,
    minimalProof: proofVerdict,
    graph: null,
  };

  return {
    familyId,
    signature: signatureOf(p, dom),
    topic: "pointwise",
    difficulty: instanceDifficulty(p),
    title: A ? "מבחן הסופרמום: חזקה ואקספוננט" : "מבחן הסופרמום: מנה של חזקות",
    statement: H`בדקו האם הסדרה $f_n(x)=${f}$ מתכנסת במידה שווה ב${noun} ${domText}, בעזרת מבחן הסופרמום.`,
    formulaLatex: H`f_n(x)=${f},\quad x\in${I}`,
    steps: [step1, step2, step3, step4, step5, step6],
    tokens: book.tokens,
    plot: plotSpecOf(p, dom, an),
  };
}

// ---------------------------------------------------------------------------------------------
// Families
// ---------------------------------------------------------------------------------------------

/**
 * The level of an instance: integer exponents are easy in both families; fractional exponents are
 * medium for the exponential family and advanced for the quotient family.
 */
export function instanceDifficulty(p: Params): PracticeDifficulty {
  if ([p.a, p.b, p.c, p.d].every(isInt)) return "easy";
  return p.kind === "A" ? "medium" : "advanced";
}

function pickDraw(kind: FamilyKind, rng: SeededRandom, difficulty?: PracticeDifficulty): { params: Params; domain: Domain } {
  const grid = exerciseGrid(kind).filter((g) => !difficulty || instanceDifficulty(g.params) === difficulty);
  const roll = rng.next();
  // [alpha,M] domains always end "uniform" and add little beyond the tail ones: drawn less often (course owner).
  const domKind: DomainKind = roll < 0.35 ? "half" : roll < 0.65 ? "short" : roll < 0.9 ? "tail" : "mixed";
  const pool = grid.filter((g) => g.domain.kind === domKind);
  // Bias the exponent class: negative / zero / positive k, so both verdicts are common.
  const klass = rng.next();
  const want = (g: { params: Params; domain: Domain }) => {
    const k = num(analyze(g.params, g.domain).k);
    return klass < 0.4 ? k < 0 : klass < 0.7 ? k === 0 : k > 0;
  };
  const biased = pool.filter(want);
  return rng.pick(biased.length > 0 ? biased : pool);
}

const FALLBACK: Record<FamilyKind, { params: Params; domain: Domain }> = {
  A: { params: { kind: "A", a: R(1), b: R(1), c: R(1), d: R(1) }, domain: ALL_DOMAINS[0] },
  B: { params: { kind: "B", a: R(1), b: R(1), c: R(2), d: R(2) }, domain: ALL_DOMAINS[0] },
};

function makeFamily(kind: FamilyKind, id: string, difficulties: readonly PracticeDifficulty[]): PracticeFamily {
  return {
    id,
    topic: "pointwise",
    difficulties,
    generate(rng, difficulty) {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const { params, domain } = pickDraw(kind, rng, difficulty);
        if (selfCheck(params, domain).length > 0) continue;
        try {
          return buildSupremumExercise(id, params, domain, rng);
        } catch {
          // too few distinct distractors: draw again
        }
      }
      // Fallback: the first instance of the requested level on [0,inf), else the family's fixed one.
      const fb = (difficulty && exerciseGrid(kind).find((g) => instanceDifficulty(g.params) === difficulty && g.domain.kind === "half"
        && selfCheck(g.params, g.domain).length === 0)) || FALLBACK[kind];
      return buildSupremumExercise(id, fb.params, fb.domain, rng);
    },
  };
}

/** (A) n^a x^b e^{-n^c x^d}: medium (one product rule + chain rule, constants (b/(de))^{b/d}). */
export const POWER_EXPONENTIAL: PracticeFamily = makeFamily("A", "sup-power-exponential", ["easy", "medium"]);
/** (B) n^a x^b / (1 + n^c x^d): advanced (quotient rule, constant (d-b)/d (b/(d-b))^{b/d}). */
export const POWER_RATIONAL: PracticeFamily = makeFamily("B", "sup-power-rational", ["easy", "advanced"]);

export const SUPREMUM_FAMILIES: readonly PracticeFamily[] = [POWER_EXPONENTIAL, POWER_RATIONAL];
