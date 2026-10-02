/**
 * Eleven parametric families of the topic "pointwise" (התכנסות נקודתית ובמידה שווה) of the summary
 * practice. Each family fixes a sequence f_n and draws a *domain* (and a short list of numeric
 * parameters); the domain decides the verdict and the argument that proves it:
 *
 *   ln-power      ln(1 + c x^n)                      continuity theorem / sup not attained / monotone
 *   ratio-power   x^n / (1 + x^{2n})                 monotone on each side of 1 / moving point 2^{1/n}
 *   cos-power     cos(m x^n)                         sup of the difference not attained / monotone
 *   sin-root      sin(x^{1/n})                       sup not attained / monotone (Lipschitz bound)
 *   diff-quotient (n/k)(phi(x + k/n) - phi(x))       mean value theorem, bound k/n (derivative definition)
 *   one-minus-cos 1 - cos(x/n)                       1 - cos t <= t^2/2 / moving point x = n pi
 *   poly-quotient n((x + 1/n)^p - x^p)               exact expansion / moving point x = n (derivative definition)
 *   arctan        arctan(n x)                        moving point 1/n / monotone, pi/2 - arctan(t) = arctan(1/t)
 *   exp-decay     e^{-n x}                           continuity theorem / sup approached / monotone
 *   sqrt-smooth   sqrt(x^2 + k^2/n^2), n x / sqrt(1 + n^2 x^2)   conjugate identity / continuity theorem / monotone
 *   peak-power    x^n (1 - x), n x^n (1 - x)         critical point, sup -> 0 or 1/e / monotone on [0, a]
 *
 * Specification: docs/question-families/uniform-practice.md. Pure TypeScript, no React. All displayed
 * numbers are exact (rationals, pi, e inside LaTeX only); floats appear in the numeric self-check only.
 * Every instance carries a `Model` (numeric f_n, f, domain, claimed supremum or bound); `checkModel`
 * compares the claims with a brute-force supremum and the pointwise limit, and generators redraw on failure.
 */
import { L, S, checklistPart, choicePart, slot, slotsPart, tablePart, template } from "../math/guidedSteps";
import type { CandidateRow, ChecklistItem, SlotSpec, TokenId, TokenLabel } from "../math/supremumTypes";
import type { SeededRandom } from "../../constant-coefficients-euler/practice/random";
import type { PracticeDifficulty, PracticeExercise, PracticeFamily, PracticePlotSpec, PracticeStep } from "./practiceTypes";

const H = String.raw;

// ---------------------------------------------------------------------------------------------
// Rationals, intervals and Hebrew nouns
// ---------------------------------------------------------------------------------------------

/** A small positive rational used as a domain endpoint or a parameter. */
export type Q = { n: number; d: number };
const Qn = (n: number, d = 1): Q => ({ n, d });
const qv = (x: Q) => x.n / x.d;
/** Inline LaTeX of a rational: "2" or "\tfrac{2}{3}". */
const qL = (x: Q) => (x.d === 1 ? String(x.n) : `\\tfrac{${x.n}}{${x.d}}`);
/** base^e for a rational base, e given as LaTeX: "2^{n}" or "\left(\tfrac23\right)^{n}". */
const qPow = (b: Q, e: string) => (b.d === 1 ? `${b.n}^{${e}}` : `\\left(${qL(b)}\\right)^{${e}}`);
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
/** The reduced fraction p/(q * den), den a LaTeX power of n: fracN(4, 2, "n^{2}") = \frac{2}{n^{2}}, fracN(9, 2, "n^{2}") = \frac{9}{2n^{2}}. */
const fracN = (p: number, q: number, den: string) => { const g = gcd(p, q); return `\\frac{${p / g}}{${q / g === 1 ? "" : q / g}${den}}`; };
/** 1/(a n) for a rational a, reduced: \frac{2}{n}, \frac{1}{n}, \frac{1}{2n}. */
const invNa = (a: Q) => fracN(a.d, a.n, "n");
const qKey = (x: Q) => (x.d === 1 ? String(x.n) : `${x.n}/${x.d}`);
/** An integer constant glued to the next factor: co(2, "x^n") = "2x^n", co(1, "x^n") = "x^n". */
const co = (c: number, rest: string) => (c === 1 ? rest : `${c}${rest}`);

type Dom = PracticePlotSpec["domain"];
const mkDom = (left: number, right: number, leftClosed: boolean, rightClosed: boolean): Dom => ({ left, right, leftClosed, rightClosed });
const finite = (d: Dom) => Number.isFinite(d.left) && Number.isFinite(d.right);
/** The Hebrew noun of a domain: bounded intervals are «קטע», rays «קרן», the whole line «ישר». */
export function nounOf(d: Dom): "קטע" | "קרן" | "ישר" {
  if (finite(d)) return "קטע";
  return Number.isFinite(d.left) || Number.isFinite(d.right) ? "קרן" : "ישר";
}
/** An interval from the LaTeX of its endpoints, brackets following the closedness. */
const interval = (d: Dom, leftTex: string, rightTex: string) =>
  `\\left${d.leftClosed ? "[" : "("}${leftTex},${rightTex}\\right${d.rightClosed ? "]" : ")"}`;
const REAL_LINE = "\\mathbb{R}";

// ---------------------------------------------------------------------------------------------
// The numeric model of an instance and its self-check
// ---------------------------------------------------------------------------------------------

export type Model = {
  value: (n: number, x: number) => number;
  /** The pointwise limit f. */
  limit: (x: number) => number;
  domain: Dom;
  /** The true verdict: f_n -> f uniformly on the domain. */
  uniform: boolean;
  /** The exact supremum M_n of |f_n - f| over the domain (possibly approached, not attained), for n >= nBound. */
  sup?: (n: number) => number;
  nBound?: number;
  supTol?: number;
  /** The upper bound used by the proof (uniform case), valid for every n >= 1. */
  bound?: (n: number) => number;
  /** Not uniform: M_n stays at least `gap` (it tends to, or exceeds, this constant). */
  gap?: number;
  /** A moving point x_n with |f_n(x_n) - f(x_n)| = diff(n), for every n >= 1. */
  witness?: { x: (n: number) => number; diff: (n: number) => number };
  /** Points of the domain at which the pointwise limit is checked. */
  samples: number[];
  /** Finite scan window for unbounded domains. */
  scanFrom?: (n: number) => number;
  scanTo?: (n: number) => number;
  /** Interior points around which the scan refines geometrically (jumps, peaks). */
  special?: number[];
  /** Extra scan points for n (e.g. x = e^{-nt} where the supremum is approached at 0+). */
  extra?: (n: number) => number[];
  /** The sequence has no pointwise limit: |f_n| tends to infinity at `point` (and `limit` is meaningless). */
  noLimit?: { point: number };
  /** The indices at which the supremum is scanned (default 25, 100, 400). */
  ns?: [number, number, number];
};

const N_CHECK: [number, number, number] = [25, 100, 400];
const POINTWISE_N = 10_000;

function inDomain(d: Dom, x: number): boolean {
  return (x > d.left || (x === d.left && d.leftClosed)) && (x < d.right || (x === d.right && d.rightClosed));
}

function scanXs(m: Model, n: number, grid: number): number[] {
  const { left, right } = m.domain;
  const lo = Math.max(left, m.scanFrom?.(n) ?? -Infinity);
  const hi = Math.min(right, m.scanTo?.(n) ?? Infinity);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) throw new Error("the scan window of an unbounded domain must be finite");
  const width = hi - lo;
  const xs: number[] = [];
  for (let i = 0; i <= grid; i += 1) xs.push(lo + (width * i) / grid);
  for (let k = 0; k <= 24; k += 1) {
    const r = 0.5 * width * 10 ** (-k / 2);
    xs.push(lo + r, hi - r);
  }
  for (const s of m.special ?? []) for (let k = 0; k <= 24; k += 1) {
    const r = 0.5 * 10 ** (-k / 2);
    xs.push(s - r, s + r);
  }
  xs.push(...(m.extra?.(n) ?? []));
  return xs.filter((x) => Number.isFinite(x) && inDomain(m.domain, x) && x >= lo && x <= hi);
}

/** Brute-force sup of |f_n - f| over the (scanned part of the) domain. */
export function bruteSup(m: Model, n: number, grid = 6000): number {
  let best = 0;
  for (const x of scanXs(m, n, grid)) {
    const d = Math.abs(m.value(n, x) - m.limit(x));
    if (Number.isFinite(d) && d > best) best = d;
  }
  return best;
}

/** Problems found when the model's claims are compared with brute force; empty when consistent. */
export function checkModel(m: Model, grid = 6000): string[] {
  const problems: string[] = [];
  if (m.noLimit) {
    const x0 = m.noLimit.point;
    if (!inDomain(m.domain, x0)) problems.push("the divergence point is outside the domain");
    const [a, b, e] = [10, 100, 1000].map((n) => Math.abs(m.value(n, x0)));
    if (!(a > 1 && b > 5 * a && e > 5 * b)) problems.push(`|f_n(${x0})| does not grow: ${a}, ${b}, ${e}`);
    if (m.uniform) problems.push("a sequence without a pointwise limit is not uniformly convergent");
    return problems;
  }
  const ns = m.ns ?? N_CHECK;
  const sups = ns.map((n) => bruteSup(m, n, grid));
  for (const x of m.samples) {
    if (!inDomain(m.domain, x)) { problems.push(`sample ${x} is outside the domain`); continue; }
    const gapAtN = Math.abs(m.value(POINTWISE_N, x) - m.limit(x));
    if (!(gapAtN <= 2e-3)) problems.push(`f_n(${x}) does not approach the stated limit (gap ${gapAtN})`);
  }
  if (m.sup) ns.forEach((n, i) => {
    if (n < (m.nBound ?? 1)) return;
    const claimed = m.sup!(n);
    const tol = (m.supTol ?? 1e-4) * Math.max(claimed, 1e-9) + 1e-12;
    if (!(Math.abs(sups[i] - claimed) <= tol)) problems.push(`sup at n=${n}: brute ${sups[i]} vs claimed ${claimed}`);
  });
  if (m.bound) ns.forEach((n, i) => {
    if (!(sups[i] <= m.bound!(n) * (1 + 1e-9) + 1e-12)) problems.push(`bound violated at n=${n}: sup ${sups[i]} > ${m.bound!(n)}`);
  });
  if (m.uniform) {
    if (!(sups[2] <= 0.3 * sups[0] + 1e-12 && sups[2] < 0.05)) problems.push(`marked uniform but the supremum does not decay: ${sups.join(", ")}`);
  } else {
    const gap = m.gap ?? 0;
    if (!(gap > 0 && sups[1] >= 0.9 * gap && sups[2] >= 0.9 * gap)) problems.push(`marked not uniform but the supremum drops below the gap ${gap}: ${sups.join(", ")}`);
  }
  if (m.witness) for (const n of [1, 2, 5, 50]) {
    const x = m.witness.x(n);
    if (!inDomain(m.domain, x)) { problems.push(`witness x_${n}=${x} is outside the domain`); continue; }
    const diff = Math.abs(m.value(n, x) - m.limit(x));
    if (!(Math.abs(diff - m.witness.diff(n)) <= 1e-9 * Math.max(1, diff))) problems.push(`witness difference at n=${n}: ${diff} vs ${m.witness.diff(n)}`);
  }
  return problems;
}

/** A plotting window from the model: samples f_n (n = 1, 2, 5, 40) and f over the visible part of the domain. */
function autoView(m: Model, xMin: number, xMax: number, ns: number[] = [1, 2, 5, 40]): PracticePlotSpec["view"] {
  const lo = Math.max(xMin, m.domain.left);
  const hi = Math.min(xMax, m.domain.right);
  let min = 0;
  let max = 0;
  for (const n of ns) for (let i = 0; i <= 200; i += 1) {
    const x = lo + ((hi - lo) * i) / 200;
    for (const y of m.noLimit ? [m.value(n, x)] : [m.value(n, x), m.limit(x)]) if (Number.isFinite(y)) { min = Math.min(min, y); max = Math.max(max, y); }
  }
  const span = max - min || 1;
  return { xMin, xMax, yMin: min - 0.08 * span, yMax: max + 0.1 * span };
}

function plotOf(m: Model, view: PracticePlotSpec["view"], marker?: (n: number) => number | null, markerLabel?: string): PracticePlotSpec {
  return {
    value: m.value,
    limit: m.noLimit ? null : m.limit,
    domain: m.domain,
    view,
    maxN: 40,
    ...(marker ? { marker, markerLabel } : {}),
  };
}

// ---------------------------------------------------------------------------------------------
// Chips with distractors
// ---------------------------------------------------------------------------------------------

/** A chip: its LaTeX, its numeric fingerprint at the slot's probes, and (for a wrong one) why it is wrong. */
export type Chip = { latex: string; sig: number[]; diag?: string };
export type SlotRecord = { token: TokenId; latex: string; sig: number[]; correct: boolean };

class Book {
  tokens: Record<TokenId, TokenLabel> = {};
  /** slot key -> its chips with fingerprints, for the tests. */
  slots: Record<string, SlotRecord[]> = {};
  /** Probes of bound slots: the bound must dominate the target at every probe. */
  bounds: Record<string, number[]> = {};
}

const PROBE_N = [3, 10, 30];
/** A sequence value at three indices. */
const seq = (f: (n: number) => number) => PROBE_N.map(f);
/** A constant at three indices. */
const K = (c: number) => PROBE_N.map(() => c);
/** (n, x) probes of expressions in both variables (positive and negative x). */
const NX: [number, number][] = [[3, 0.7], [10, 1.9], [30, -1.3], [7, 0.4], [20, 2.6]];
const nx = (f: (n: number, x: number) => number) => NX.map(([n, x]) => f(n, x));
/** (n, x) probes with 0 < x < 1. */
const NX_UNIT: [number, number][] = [[3, 0.7], [10, 0.9], [30, 0.95], [7, 0.4], [20, 0.8]];
const nxUnit = (f: (n: number, x: number) => number) => NX_UNIT.map(([n, x]) => f(n, x));

const same = (a: number[], b: number[]) => a.length === b.length
  && a.every((v, i) => v === b[i] || (Number.isFinite(v) && Number.isFinite(b[i]) && Math.abs(v - b[i]) <= 1e-9 * Math.max(1, Math.abs(v), Math.abs(b[i]))));

function shuffle<T>(rng: SeededRandom, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = rng.integer(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * A one-slot chip set: the correct chip plus up to three distinct wrong ones. A wrong chip that equals
 * the correct one numerically is dropped. With `bound` (the numeric target at the probes) the slot is
 * an upper bound: the correct chip must dominate the target everywhere, and a wrong chip must fail at some
 * probe (a weaker but true bound would not be wrong). Throws when fewer than two wrong chips remain.
 */
function chipSlot(book: Book, rng: SeededRandom, slotId: string, correct: Chip, wrongs: Chip[], bound?: number[]): SlotSpec {
  if (bound && !correct.sig.every((v, i) => v >= bound[i] - 1e-12)) throw new Error(`the bound chip ${correct.latex} of ${slotId} does not hold`);
  const kept: Chip[] = [];
  for (const w of shuffle(rng, wrongs)) {
    if (same(w.sig, correct.sig)) continue;
    if (bound && w.sig.every((v, i) => v >= bound[i] - 1e-12)) continue;
    if (kept.some((o) => same(o.sig, w.sig) || o.latex === w.latex)) continue;
    kept.push(w);
    if (kept.length === 3) break;
  }
  if (kept.length < 2) throw new Error(`too few distinct distractors for ${slotId}`);
  const okId = `${slotId}-ok`;
  const wrongIds = kept.map((_, i) => `${slotId}-w${i}`);
  book.tokens[okId] = { latex: correct.latex };
  kept.forEach((w, i) => { book.tokens[wrongIds[i]] = { latex: w.latex }; });
  book.slots[slotId] = [
    { token: okId, latex: correct.latex, sig: correct.sig, correct: true },
    ...kept.map((w, i) => ({ token: wrongIds[i], latex: w.latex, sig: w.sig, correct: false })),
  ];
  if (bound) book.bounds[slotId] = bound;
  const diagnoses = Object.fromEntries(kept.map((w, i) => [wrongIds[i], w.diag ?? ""]));
  return slot(slotId, shuffle(rng, [okId, ...wrongIds]), okId, diagnoses);
}

const ok = (latex: string, sig: number[]): Chip => ({ latex, sig });
const bad = (latex: string, sig: number[], diag: string): Chip => ({ latex, sig, diag });

type Opt = { id: string; label: string; correct: boolean; diagnosis?: string };
const good = (id: string, label: string): Opt => ({ id, label, correct: true });
const wrong = (id: string, label: string, diagnosis: string): Opt => ({ id, label, correct: false, diagnosis });

type Item = ChecklistItem;
const must = (id: string, label: string): Item => ({ id, label, required: true });
/** True but not needed: shown as "label, unneeded", so the label has no final period and the note reads "זה נכון, ...". */
const extra = (id: string, label: string, unneeded: string): Item => ({
  id, label: label.replace(/\.$/, ""), required: false, optional: true, unneeded: unneeded.startsWith("נכון") ? `זה ${unneeded}` : unneeded,
});
const nope = (id: string, label: string, diagnosis: string): Item => ({ id, label, required: false, diagnosis });

const PRACTICE = "practice";
type StepArgs = Omit<PracticeStep, "exampleId" | "graph">;
const step = (args: StepArgs): PracticeStep => ({ ...args, exampleId: PRACTICE, graph: null });

/** The pieces most steps share. */
const STEP_LIMIT_TITLE = "הגבול הנקודתי";
const STEP_VERDICT_TITLE = "המסקנה";

function verdictStep(rng: SeededRandom, id: string, prompt: string, options: Opt[], hints: string[], solvedNote: string, minimalProof: string): PracticeStep {
  return step({
    id,
    title: STEP_VERDICT_TITLE,
    prompt,
    parts: [choicePart(`${id}-verdict`, "בחרו את המסקנה.", shuffle(rng, options))],
    hints,
    solvedNote,
    minimalProof,
  });
}

// ---------------------------------------------------------------------------------------------
// Family machinery
// ---------------------------------------------------------------------------------------------

export type Built = { exercise: PracticeExercise; model: Model; book: Book };

/** A family as data: its whole grid of variants and how to build one. */
export type FamilySpec<V> = {
  id: string;
  grid: () => V[];
  /** Variants of one kind share a draw weight (the domain kind is the main parameter). */
  kindOf: (v: V) => string;
  difficulty: (v: V) => PracticeDifficulty;
  signature: (v: V) => string;
  build: (v: V, rng: SeededRandom) => Built;
};

function makeFamily<V>(spec: FamilySpec<V>): PracticeFamily & { spec: FamilySpec<V> } {
  const all = spec.grid();
  const difficulties = (["easy", "medium", "advanced"] as const).filter((d) => all.some((v) => spec.difficulty(v) === d));
  const pick = (rng: SeededRandom, difficulty?: PracticeDifficulty): V => {
    const pool = all.filter((v) => !difficulty || spec.difficulty(v) === difficulty);
    const kinds = [...new Set(pool.map(spec.kindOf))];
    const kind = rng.pick(kinds);
    return rng.pick(pool.filter((v) => spec.kindOf(v) === kind));
  };
  return {
    id: spec.id,
    topic: "pointwise",
    difficulties,
    spec,
    generate(rng, difficulty) {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const v = pick(rng, difficulty);
        try {
          const built = spec.build(v, rng);
          if (checkModel(built.model, 1500).length === 0) return built.exercise;
        } catch {
          // too few distinct distractors: draw again
        }
      }
      const fallback = all.find((v) => !difficulty || spec.difficulty(v) === difficulty) ?? all[0];
      return spec.build(fallback, rng).exercise;
    },
  };
}

function finishExercise(spec: { id: string; signature: string; difficulty: PracticeDifficulty; title: string; statement: string; formula: string; steps: PracticeStep[]; book: Book; plot: PracticePlotSpec }): PracticeExercise {
  return {
    familyId: spec.id,
    signature: spec.signature,
    topic: "pointwise",
    difficulty: spec.difficulty,
    title: spec.title,
    statement: spec.statement,
    formulaLatex: spec.formula,
    steps: spec.steps,
    tokens: spec.book.tokens,
    plot: spec.plot,
  };
}

/** "בקטע $[0,1]$", "בקרן $[0,\infty)$", "בישר $\mathbb{R}$". */
const inDom = (d: Dom, tex: string) => H`ב${nounOf(d)} $${tex}$`;
/** Shared tail of every statement: names the limit f and the supremum M_n used by the steps. */
const SYMBOLS_NOTE = H`נסמן ב־$f$ את הגבול הנקודתי, וב־$M_n=\sup\lvert f_n-f\rvert$ את הסופרמום של הפער בתחום.`;
const statementOf = (fn: string, d: Dom, tex: string) => H`בדקו האם הסדרה $f_n(x)=${fn}$ מתכנסת במידה שווה ${inDom(d, tex)}. ${SYMBOLS_NOTE}`;
const formulaOf = (fn: string, tex: string) => H`f_n(x)=${fn},\quad x\in${tex}`;

// =============================================================================================
// 1. ln(1 + c x^n): the continuity theorem, a supremum that is approached, a monotone function
// =============================================================================================

type LnKind = "closed1" | "open1" | "sub";
export type LnVariant = { c: 1 | 2 | 3; kind: LnKind; a?: Q };
const LN_ENDS: Q[] = [Qn(1, 2), Qn(2, 3), Qn(3, 4)];
const LN_ID = "unif-ln-power";

function lnGrid(): LnVariant[] {
  const out: LnVariant[] = [];
  for (const c of [1, 2, 3] as const) {
    out.push({ c, kind: "closed1" }, { c, kind: "open1" });
    for (const a of LN_ENDS) out.push({ c, kind: "sub", a });
  }
  return out;
}
const lnSignature = (v: LnVariant) => `c=${v.c};${v.kind}${v.a ? `;a=${qKey(v.a)}` : ""}`;
const lnDifficulty = (v: LnVariant): PracticeDifficulty => (v.kind === "open1" ? "medium" : "easy");

function buildLn(v: LnVariant, rng: SeededRandom): Built {
  const { c, kind } = v;
  const a = v.a ?? Qn(1);
  const book = new Book();
  const top = Math.log(1 + c);
  const topL = `\\ln ${1 + c}`;
  const fn = `\\ln\\left(1+${co(c, "x^n")}\\right)`;
  const d = kind === "closed1" ? mkDom(0, 1, true, true) : kind === "open1" ? mkDom(0, 1, true, false) : mkDom(0, qv(a), true, true);
  const domTex = interval(d, "0", kind === "sub" ? qL(a) : "1");
  const sub = kind === "sub";
  const aL = qL(a);
  const model: Model = {
    value: (n, x) => Math.log(1 + c * x ** n),
    limit: (x) => (x < 1 ? 0 : top),
    domain: d,
    uniform: sub,
    sup: sub ? (n) => Math.log(1 + c * qv(a) ** n) : () => top,
    ...(sub ? {} : { gap: top }),
    samples: kind === "closed1" ? [0, 0.5, 0.9, 1] : kind === "open1" ? [0, 0.5, 0.9] : [0, qv(a) / 2, qv(a)],
  };
  const limitBelow = (id: string) => chipSlot(book, rng, id, ok("0", K(0)), [
    bad(topL, K(top), H`זה הערך ב־$x=1$. כש־$x<1$ מתקיים $x^n\to0$.`),
    bad("1", K(1), H`$x^n\to0$, ולכן $\ln(1+0)=\ln1=0$ ולא $1$.`),
    bad("\\infty", K(Infinity), H`$x^n\to0$, ולכן הביטוי בתוך ה־$\ln$ שואף ל־$1$.`),
  ]);
  const rangeBelow = kind === "closed1" ? H`0\le x<1` : kind === "open1" ? H`0\le x<1` : H`0\le x\le ${aL}`;
  const s1Parts = kind === "closed1"
    ? [
      slotsPart(template("ln-1-below", [L(H`${rangeBelow}:\quad f(x)=`), S("ln1a")], [limitBelow("ln1a")])),
      slotsPart(template("ln-1-at", [L(H`x=1:\quad f(1)=`), S("ln1b")], [chipSlot(book, rng, "ln1b", ok(topL, K(top)), [
        bad("0", K(0), H`ב־$x=1$ מתקיים $x^n=1$ לכל $n$, ולכן $f_n(1)=${topL}$.`),
        bad(`${1 + c}`, K(1 + c), H`שכחתם את ה־$\ln$ שבסדרה.`),
        bad("1", K(1), H`$f_n(1)=\ln(1+${c})=${topL}$.`),
        bad(`${c}`, K(c), H`ב־$x=1$ הביטוי הוא $\ln(1+${c})$.`),
      ])])),
    ]
    : [slotsPart(template("ln-1-below", [L(H`${rangeBelow}:\quad f(x)=`), S("ln1a")], [limitBelow("ln1a")]))];
  const s1 = step({
    id: "ln-1", title: STEP_LIMIT_TITLE,
    prompt: H`חשבו את הגבול הנקודתי $f(x)=\lim_{n\to\infty}f_n(x)$ ${kind === "closed1" ? "בשני חלקי הקטע" : "בכל נקודה של הקטע"}.`,
    parts: s1Parts,
    hints: [H`אם $0\le x<1$ אז $x^n\to0$. ב־$x=1$ הסדרה $f_n(1)$ קבועה.`],
    solvedNote: kind === "closed1" ? H`$f(x)=0$ ב־$[0,1)$ ו־$f(1)=${topL}$.` : H`$f(x)=0$ בכל נקודה של הקטע.`,
  });

  let steps: PracticeStep[];
  const verdictPrompt = H`האם $f_n\to f$ במידה שווה ${inDom(d, domTex)}?`;
  if (kind === "closed1") {
    const s2 = step({
      id: "ln-2", title: "רציפות הגבול",
      prompt: H`כל $f_n(x)=${fn}$ רציפה ב־$[0,1]$. האם הגבול $f$ רציף ב־$x=1$?`,
      parts: [choicePart("ln-2-cont", "בחרו.", shuffle(rng, [
        good("no", H`לא: $\lim_{x\to1^-}f(x)=0$ אבל $f(1)=${topL}\ne0$.`),
        wrong("yes-fn", H`כן, כי כל $f_n$ רציפה.`, "גבול נקודתי של פונקציות רציפות אינו חייב להיות רציף."),
        wrong("yes-zero", H`כן, כי $f(x)=0$ בכל $x$ בקטע.`, H`ב־$x=1$ הגבול הוא $${topL}$ ולא $0$.`),
      ]))],
      hints: [H`השוו את $f(1)$ עם הערך ש־$f$ מקבלת קרוב ל־$1$ משמאל.`],
      solvedNote: H`$f$ קופצת ב־$x=1$ מ־$0$ אל $${topL}$.`,
    });
    const s3 = step({
      id: "ln-3", title: "מה מצדיק את המסקנה",
      prompt: "סמנו את כל הנימוקים הנדרשים כדי להסיק שההתכנסות אינה במידה שווה.",
      parts: [checklistPart("ln-3-why", shuffle(rng, [
        must("fn-cont", H`כל $f_n$ רציפה ב־$[0,1]$ (הרכבה של פונקציות רציפות).`),
        must("f-jump", H`הגבול $f$ אינו רציף ב־$x=1$.`),
        must("thm", H`משפט הרציפות: גבול במידה שווה של פונקציות רציפות הוא פונקציה רציפה.`),
        extra("nonneg", H`$f_n(x)\ge0$ לכל $x$ בקטע.`, "נכון, אך אינו משפיע על הטיעון."),
        nope("const", H`$f_n(1)=${topL}$ לכל $n$, ולכן $f_n(1)$ אינה מתכנסת.`, H`סדרה קבועה מתכנסת: $f_n(1)\to${topL}=f(1)$.`),
        nope("pw", H`הגבול הנקודתי קיים בכל נקודה, ולכן ההתכנסות במידה שווה.`, "קיום הגבול בכל נקודה הוא התכנסות נקודתית בלבד."),
      ]))],
      hints: [H`משפט הרציפות דורש: $f_n$ רציפות, והגבול במידה שווה.`],
      solvedNote: H`$f_n$ רציפות והגבול $f$ אינו רציף: ההתכנסות אינה במידה שווה.`,
    });
    const s4 = verdictStep(rng, "ln-4", verdictPrompt, [
      good("not-uniform", H`לא: $f_n$ רציפות והגבול $f$ אינו רציף ב־$x=1$.`),
      wrong("uniform-pw", H`כן, כי $f_n(x)\to f(x)$ בכל נקודה.`, "התכנסות נקודתית אינה מספיקה."),
      wrong("uniform-gap", H`כן, כי בנקודה שבה $f$ קופצת, $x=1$, הפער $\lvert f_n(1)-f(1)\rvert$ הוא $0$.`,
        H`הפער קטן ב־$x=1$ עצמה, אך לא קרוב אליה: משפט הרציפות מראה שאין התכנסות במידה שווה.`),
    ], [H`אם הגבול אינו רציף והסדרה רציפה, אין התכנסות במידה שווה.`],
    H`$f_n\not\to f$ במידה שווה.`,
    H`כל $f_n$ רציפה ב־$[0,1]$; $f=0$ ב־$[0,1)$ ו־$f(1)=${topL}$, ולכן $f$ אינה רציפה ב־$x=1$. גבול במידה שווה של פונקציות רציפות הוא רציף, ולכן ההתכנסות אינה במידה שווה.`);
    steps = [s1, s2, s3, s4];
  } else if (kind === "open1") {
    const s2 = step({
      id: "ln-2", title: "הפער ליד הקצה הימני",
      prompt: H`ב־$[0,1)$ הגבול הוא $0$, ולכן $\lvert f_n(x)-f(x)\rvert=\ln\left(1+${co(c, "x^n")}\right)$, והוא עולה ב־$x$. חשבו את הגבול שלו כש־$x$ שואף לקצה הימני (כש־$n$ קבוע).`,
      parts: [slotsPart(template("ln-2-end", [L(H`\lim_{x\to1^-}\lvert f_n(x)-f(x)\rvert=`), S("ln2a")], [chipSlot(book, rng, "ln2a", ok(topL, K(top)), [
        bad("0", K(0), H`הגבול ב־$n\to\infty$ הוא $0$; כאן $n$ קבוע ו־$x\to1^-$, ולכן $x^n\to1$.`),
        bad("1", K(1), H`$x^n\to1$, ולכן הביטוי הוא $\ln(1+${c})=${topL}$.`),
        bad(`${1 + c}`, K(1 + c), H`שכחתם את ה־$\ln$.`),
      ])]))],
      hints: [H`כש־$x\to1^-$ מתקיים $x^n\to1$ (לכל $n$ קבוע).`],
      solvedNote: H`הפער מתקרב ל־$${topL}$ כש־$x\to1^-$.`,
    });
    const s3 = step({
      id: "ln-3", title: H`הסופרמום $M_n$`,
      prompt: H`מהו $M_n=\sup_{x\in[0,1)}\lvert f_n(x)-f(x)\rvert$, והאם הוא מתקבל בקטע?`,
      parts: [choicePart("ln-3-sup", "בחרו.", shuffle(rng, [
        good("approached", H`$M_n=${topL}$ לכל $n$, אך הוא אינו מתקבל: לכל $x<1$ הפער קטן ממנו.`),
        wrong("zero", H`$M_n=0$, כי $f_n(x)\to f(x)$ בכל נקודה.`, H`ההתכנסות הנקודתית אינה קובעת את $M_n$: $M_n$ הוא סופרמום לפי $x$ עבור $n$ קבוע.`),
        wrong("at-one", H`$M_n=${topL}$, והוא מתקבל בקצה $x=1$.`, H`הנקודה $x=1$ אינה שייכת לקטע $[0,1)$.`),
      ]))],
      hints: [H`$\ln(1+${co(c, "x^n")})$ עולה ב־$x$, אך הקצה $x=1$ אינו בקטע.`],
      solvedNote: H`$M_n=${topL}$, סופרמום שאינו מתקבל.`,
    });
    const s4 = verdictStep(rng, "ln-4", verdictPrompt, [
      good("not-uniform", H`לא במידה שווה: $M_n=${topL}\not\to0$.`),
      wrong("uniform-cont", H`כן, כי הגבול $f=0$ רציף בקטע.`, H`רציפות הגבול היא תנאי הכרחי בלבד: כאן $M_n$ אינו שואף ל־$0$.`),
      wrong("uniform-na", H`כן, כי הסופרמום אינו מתקבל באף נקודה של הקטע.`, H`אי־התקבלות הסופרמום אינה הופכת אותו ל־$0$: $M_n=${topL}\ne0$.`),
    ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    H`$M_n\not\to0$: ההתכנסות אינה במידה שווה, אף שהגבול רציף.`,
    H`$f=0$ ב־$[0,1)$ ו־$\lvert f_n-f\rvert=\ln(1+${co(c, "x^n")})$ עולה ב־$x$, ולכן $M_n=\lim_{x\to1^-}\ln(1+${co(c, "x^n")})=${topL}$ לכל $n$. $M_n\not\to0$, ולפי מבחן הסופרמום ההתכנסות אינה במידה שווה (אף שהגבול רציף).`);
    steps = [s1, s2, s3, s4];
  } else {
    const s2 = step({
      id: "ln-2", title: "היכן המקסימום",
      prompt: H`ב־$[0,${aL}]$ מתקיים $\lvert f_n(x)-f(x)\rvert=f_n(x)$. סמנו את הנימוקים הנדרשים לכך ש־$M_n=f_n(${aL})$.`,
      parts: [checklistPart("ln-2-why", shuffle(rng, [
        must("mono", H`לפי משפט לגרנז', $f_n'(x)=\frac{${co(c, "n")}x^{n-1}}{1+${co(c, "x^n")}}>0$ ל־$x>0$, ולכן $f_n$ עולה ב־$[0,${aL}]$.`),
        must("endpoint", H`הקצה הימני $x=${aL}$ שייך לקטע (הקטע סגור).`),
        must("diff", H`$f=0$ בקטע, ולכן $\lvert f_n-f\rvert=f_n$.`),
        extra("ln-bound", H`לפי משפט לגרנז', $\ln(1+t)=\frac{t}{1+\xi}\le t$ לכל $t\ge0$.`, H`נכון, ומאפשר הערכה $M_n\le${co(c, qPow(a, "n"))}$; כאן הסופרמום מחושב במדויק.`),
        nope("crit", H`$f_n'(x)=0$ בנקודה פנימית של הקטע.`,
          H`$f_n'(x)=\frac{${co(c, "n")}x^{n-1}}{1+${co(c, "x^n")}}>0$ לכל $x>0$: אין נקודה חשודה לקיצון פנימית.`),
        nope("disc", H`הגבול $f$ אינו רציף בקטע.`, H`הגבול $f=0$ רציף בקטע.`),
      ]))],
      hints: [H`פונקציה עולה מקבלת את המקסימום בקצה הימני.`],
      solvedNote: H`$f_n$ עולה ב־$[0,${aL}]$, ולכן $M_n=f_n(${aL})$.`,
    });
    const mnSlot = chipSlot(book, rng, "ln3a", ok(`\\ln\\left(1+${co(c, qPow(a, "n"))}\\right)`, seq((n) => Math.log(1 + c * qv(a) ** n))), [
      bad(topL, K(top), H`זה הערך ב־$x=1$, שאינה בקטע $[0,${aL}]$.`),
      bad(co(c, qPow(a, "n")), seq((n) => c * qv(a) ** n), H`זה חסם עליון (לפי משפט לגרנז', $\ln(1+t)\le t$ ב־$t=${co(c, qPow(a, "n"))}$), לא הערך המדויק.`),
      bad("0", K(0), H`$0$ הוא הגבול של $M_n$, לא ערכו עבור $n$ נתון.`),
    ]);
    const limSlot = chipSlot(book, rng, "ln3b", ok("0", K(0)), [
      bad(topL, K(top), H`$${qPow(a, "n")}\to0$, ולכן הביטוי שואף ל־$\ln1=0$ ולא ל־$${topL}$.`),
      bad("\\infty", K(Infinity), H`$${qPow(a, "n")}\to0$ כי $${aL}<1$.`),
      bad("1", K(1), H`$\ln(1+0)=0$ ולא $1$.`),
    ]);
    const s3 = step({
      id: "ln-3", title: H`חישוב $M_n$ וגבולו`,
      prompt: H`כתבו את $M_n=f_n(${aL})$ וחשבו את גבולו.`,
      parts: [slotsPart(template("ln-3-mn", [L(H`M_n=`), S("ln3a"), L(H`\xrightarrow[n\to\infty]{}`), S("ln3b")], [mnSlot, limSlot]))],
      hints: [H`הציבו $x=${aL}$ ב־$f_n(x)$. כש־$n\to\infty$, $${qPow(a, "n")}\to0$.`],
      solvedNote: H`$M_n=\ln\left(1+${co(c, qPow(a, "n"))}\right)\to0$.`,
    });
    const s4 = verdictStep(rng, "ln-4", verdictPrompt, [
      good("uniform", H`כן: $M_n=\ln\left(1+${co(c, qPow(a, "n"))}\right)\to0$.`),
      wrong("not-uniform-1", H`לא, כי ב־$[0,1]$ ההתכנסות אינה במידה שווה.`, H`סוג ההתכנסות תלוי בתחום: הקטע $[0,${aL}]$ אינו מגיע ל־$1$.`),
      wrong("not-uniform-pos", H`לא, כי $M_n>0$ לכל $n$.`, H`חיוביות $M_n$ אינה מספיקה: מה שחשוב הוא אם $M_n\to0$.`),
    ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    H`$M_n\to0$: ההתכנסות במידה שווה.`,
    H`$f=0$ ב־$[0,${aL}]$ ו־$\lvert f_n-f\rvert=\ln(1+${co(c, "x^n")})$ עולה ב־$x$, ולכן $M_n=\ln\left(1+${co(c, qPow(a, "n"))}\right)\to\ln1=0$. לפי מבחן הסופרמום ההתכנסות במידה שווה.`);
    steps = [s1, s2, s3, s4];
  }

  const view = autoView(model, 0, sub ? qv(a) * 1.15 : 1.1);
  const plot = plotOf(model, view, sub ? () => qv(a) : undefined, sub ? "הקצה הימני, שם המקסימום" : undefined);
  return {
    book, model,
    exercise: finishExercise({
      id: LN_ID, signature: lnSignature(v), difficulty: lnDifficulty(v),
      title: kind === "closed1" ? "לוגריתם של חזקה: גבול לא רציף" : kind === "open1" ? "לוגריתם של חזקה: סופרמום שאינו מתקבל" : "לוגריתם של חזקה: קטע שאינו מגיע ל־1",
      statement: statementOf(fn, d, domTex), formula: formulaOf(fn, domTex), steps, book, plot,
    }),
  };
}

export const LN_POWER = makeFamily<LnVariant>({
  id: LN_ID,
  grid: lnGrid,
  kindOf: (v) => v.kind,
  difficulty: lnDifficulty,
  signature: lnSignature,
  build: buildLn,
});

// =============================================================================================
// 2. x^n / (1 + x^{2n}): monotone on each side of 1, and a moving point 2^{1/n} where it peaks
// =============================================================================================

type RatioKind = "sub" | "tail" | "full" | "mid";
export type RatioVariant = { kind: RatioKind; a?: Q; b?: Q };
const RATIO_ID = "unif-ratio-power";

function ratioGrid(): RatioVariant[] {
  const out: RatioVariant[] = [];
  for (const a of [Qn(1, 2), Qn(2, 3), Qn(3, 4)]) out.push({ kind: "sub", a });
  for (const a of [Qn(3, 2), Qn(2), Qn(3)]) out.push({ kind: "tail", a });
  out.push({ kind: "full" });
  for (const a of [Qn(1, 2), Qn(1, 3)]) for (const b of [Qn(2), Qn(3)]) out.push({ kind: "mid", a, b });
  return out;
}
const ratioSignature = (v: RatioVariant) => `${v.kind}${v.a ? `;a=${qKey(v.a)}` : ""}${v.b ? `;b=${qKey(v.b)}` : ""}`;
const ratioDifficulty = (v: RatioVariant): PracticeDifficulty => (v.kind === "sub" ? "easy" : v.kind === "tail" ? "medium" : "advanced");

const ratioValue = (n: number, x: number) => 1 / (x ** n + x ** -n);

function buildRatio(v: RatioVariant, rng: SeededRandom): Built {
  const { kind } = v;
  const a = v.a ?? Qn(1);
  const b = v.b ?? Qn(1);
  const book = new Book();
  const fn = H`\frac{x^n}{1+x^{2n}}`;
  const d = kind === "sub" ? mkDom(0, qv(a), true, true) : kind === "tail" ? mkDom(qv(a), Infinity, true, false)
    : kind === "full" ? mkDom(0, Infinity, true, false) : mkDom(qv(a), qv(b), true, true);
  const domTex = kind === "sub" ? interval(d, "0", qL(a)) : kind === "tail" ? interval(d, qL(a), "\\infty")
    : kind === "full" ? interval(d, "0", "\\infty") : interval(d, qL(a), qL(b));
  const aL = qL(a);
  const monotone = kind === "sub" || kind === "tail";
  const model: Model = {
    value: ratioValue,
    limit: (x) => (x === 1 ? 0.5 : 0),
    domain: d,
    uniform: monotone,
    sup: monotone ? (n) => ratioValue(n, qv(a)) : () => 0.5,
    ...(monotone ? {} : { gap: 0.5, witness: { x: (n: number) => 2 ** (1 / n), diff: () => 0.4 }, special: [1] }),
    samples: kind === "sub" ? [0, qv(a) / 2, qv(a)] : kind === "tail" ? [qv(a), 2 * qv(a), 6]
      : kind === "full" ? [0, 0.5, 1, 2, 5] : [qv(a), 0.9, 1, 1.1, qv(b)],
    ...(kind === "tail" || kind === "full" ? { scanTo: () => 20 } : {}),
  };
  const atA = (n: number) => ratioValue(n, qv(a));
  const fnAtA = H`\frac{${qPow(a, "n")}}{1+${qPow(a, "2n")}}`;

  // ---- step 1: the limit
  const belowWrongs = (): Chip[] => [
    bad("1", K(1), H`המונה $x^n$ שואף ל־$0$, ולא ל־$1$.`),
    bad("\\tfrac12", K(0.5), H`$\frac12$ הוא הערך ב־$x=1$ בלבד.`),
    bad("\\infty", K(Infinity), H`המונה שואף ל־$0$ והמכנה ל־$1$.`),
  ];
  const aboveWrongs = (): Chip[] => [
    bad("1", K(1), H`$f_n(x)=\frac{1}{x^{-n}+x^{n}}$ ו־$x^n\to\infty$, ולכן הגבול הוא $0$.`),
    bad("\\tfrac12", K(0.5), H`$\frac12$ הוא הערך ב־$x=1$ בלבד.`),
    bad("\\infty", K(Infinity), H`המונה והמכנה שואפים ל־$\infty$; חלקו מונה ומכנה ב־$x^n$.`),
  ];
  const below = (id: string, range: string) => slotsPart(template(`ratio-1-${id}`, [L(H`${range}:\quad f(x)=`), S(`r1${id}`)], [
    chipSlot(book, rng, `r1${id}`, ok("0", K(0)), belowWrongs())]));
  const above = (id: string, range: string) => slotsPart(template(`ratio-1-${id}`, [L(H`${range}:\quad f(x)=`), S(`r1${id}`)], [
    chipSlot(book, rng, `r1${id}`, ok("0", K(0)), aboveWrongs())]));
  const atOne = slotsPart(template("ratio-1-at", [L(H`x=1:\quad f(1)=`), S("r1at")], [chipSlot(book, rng, "r1at", ok("\\tfrac12", K(0.5)), [
    bad("0", K(0), H`הציבו $x=1$: $\frac{1}{1+1}=\frac12$.`),
    bad("1", K(1), H`במכנה $1+1^{2n}=2$.`),
    bad("\\tfrac13", K(1 / 3), H`במכנה $1+1^{2n}=2$ ולא $3$.`),
  ])]));
  const s1Parts = kind === "sub" ? [below("a", H`0\le x\le ${aL}`)]
    : kind === "tail" ? [above("a", H`x\ge ${aL}`)]
      : [below("a", "x<1"), atOne, above("c", "x>1")];
  const s1 = step({
    id: "ratio-1", title: STEP_LIMIT_TITLE,
    prompt: H`חשבו את הגבול הנקודתי $f(x)=\lim_{n\to\infty}f_n(x)$ ${monotone ? "בכל נקודה של התחום" : "בכל אחד משלושת המקרים"}.`,
    parts: s1Parts,
    hints: [H`ב־$x>1$ חלקו מונה ומכנה ב־$x^n$: $f_n(x)=\frac{1}{x^{-n}+x^{n}}$.`],
    solvedNote: monotone ? H`$f(x)=0$ בכל נקודה של התחום.` : H`$f(x)=0$ לכל $x\ne1$, ו־$f(1)=\frac12$.`,
  });

  const verdictPrompt = H`האם $f_n\to f$ במידה שווה ${inDom(d, domTex)}?`;
  let steps: PracticeStep[];
  if (monotone) {
    const isSub = kind === "sub";
    const s2 = step({
      id: "ratio-2", title: "היכן המקסימום",
      prompt: H`סמנו את הנימוקים הנדרשים לכך ש־$M_n=f_n(${aL})$ (הערך בקצה ה${isSub ? "ימני" : "שמאלי"} של התחום).`,
      parts: [checklistPart("ratio-2-why", shuffle(rng, [
        must("deriv", isSub
          ? H`לפי משפט לגרנז', $f_n'(x)=\frac{nx^{n-1}\left(1-x^{2n}\right)}{\left(1+x^{2n}\right)^2}>0$ ל־$0<x<1$, ולכן $f_n$ עולה ב־$[0,1)$.`
          : H`לפי משפט לגרנז', $f_n'(x)=\frac{nx^{n-1}\left(1-x^{2n}\right)}{\left(1+x^{2n}\right)^2}<0$ ל־$x>1$, ולכן $f_n$ יורדת ב־$(1,\infty)$.`),
        must("inside", isSub
          ? H`התחום $[0,${aL}]$ מוכל ב־$[0,1)$ (כי $${aL}<1$) והקצה הימני $x=${aL}$ שייך לו.`
          : H`התחום $[${aL},\infty)$ מוכל ב־$(1,\infty)$ (כי $${aL}>1$) והקצה השמאלי $x=${aL}$ שייך לו.`),
        must("diff", H`$f=0$ בתחום, ולכן $\lvert f_n-f\rvert=f_n$.`),
        extra("sym", H`$f_n\left(\tfrac1x\right)=f_n(x)$ לכל $x>0$.`, "נכון (סימטריה סביב $x=1$), אך אינו נחוץ כאן."),
        isSub
          ? nope("incr-all", H`$f_n$ עולה בכל $[0,\infty)$.`, H`$f_n'(x)<0$ ל־$x>1$: $f_n$ עולה רק עד $x=1$.`)
          : nope("incr-all", H`$f_n$ עולה ב־$(1,\infty)$.`, H`סימן $f_n'$ הוא סימן $1-x^{2n}$, שלילי ל־$x>1$.`),
        isSub
          ? nope("crit", H`$f_n'(x)=0$ בנקודה $x=${aL}$.`, H`$f_n'(${aL})>0$, כי $${aL}<1$.`)
          : nope("crit", H`$f_n'(x)=0$ בנקודה $x=1$, והיא שייכת לתחום.`, H`$1<${aL}$: הנקודה $x=1$ אינה בתחום.`),
      ]))],
      hints: [H`סימן $f_n'$ הוא סימן $1-x^{2n}$.`],
      solvedNote: isSub ? H`$f_n$ עולה בתחום, ולכן $M_n=f_n(${aL})$.` : H`$f_n$ יורדת בתחום, ולכן $M_n=f_n(${aL})$.`,
    });
    const mnSlot = chipSlot(book, rng, "ratio3a", ok(fnAtA, seq(atA)), [
      bad("\\tfrac12", K(0.5), H`זה הערך ב־$x=1$, שאינה בתחום.`),
      bad(isSub ? qPow(a, "n") : qPow(a, "-n"), seq((n) => (isSub ? qv(a) ** n : qv(a) ** -n)),
        isSub ? H`שכחתם את המכנה $1+x^{2n}$.` : H`זה חסם עליון ($\frac{x^n}{1+x^{2n}}<x^{-n}$), לא הערך המדויק.`),
      bad(H`\frac{${qPow(a, "n")}}{1+${qPow(a, "n")}}`, seq((n) => qv(a) ** n / (1 + qv(a) ** n)), H`במכנה $1+x^{2n}$, לא $1+x^{n}$.`),
      bad(H`\frac{${qL(a)}}{1+${qPow(a, "2")}}`, seq(() => qv(a) / (1 + qv(a) ** 2)), H`זה $f_1(${aL})$, הערך עבור $n=1$ בלבד.`),
    ]);
    const limSlot = chipSlot(book, rng, "ratio3b", ok("0", K(0)), [
      bad("\\tfrac12", K(0.5), H`$\frac12$ הוא הערך ב־$x=1$; כאן $M_n\to0$.`),
      bad("\\infty", K(Infinity), isSub ? H`$${qPow(a, "n")}\to0$ כי $${aL}<1$.` : H`הביטוי קטן מ־$${qPow(a, "-n")}\to0$.`),
      bad("1", K(1), H`$M_n<${isSub ? qPow(a, "n") : qPow(a, "-n")}\to0$.`),
    ]);
    const s3 = step({
      id: "ratio-3", title: H`חישוב $M_n$ וגבולו`,
      prompt: H`כתבו את $M_n=f_n(${aL})$ וחשבו את גבולו.`,
      parts: [slotsPart(template("ratio-3-mn", [L(H`M_n=`), S("ratio3a"), L(H`\xrightarrow[n\to\infty]{}`), S("ratio3b")], [mnSlot, limSlot]))],
      hints: [H`הציבו $x=${aL}$. ${isSub ? H`$${qPow(a, "n")}\to0$` : H`$${qPow(a, "n")}\to\infty$ ולכן המכנה גדל מהר מהמונה`}.`],
      solvedNote: H`$M_n=${fnAtA}\to0$.`,
    });
    const s4 = verdictStep(rng, "ratio-4", verdictPrompt, [
      good("uniform", H`כן: $M_n=${fnAtA}\to0$.`),
      isSub
        ? wrong("not-whole", H`לא, כי ב־$[0,\infty)$ ההתכנסות אינה במידה שווה.`, H`סוג ההתכנסות תלוי בתחום: הקטע $[0,${aL}]$ רחוק מ־$x=1$, שבו נמצאת הפסגה.`)
        : wrong("unbounded", H`לא, כי הקרן אינה חסומה.`, H`תחום שאינו חסום אינו מונע התכנסות במידה שווה: כאן $M_n=${fnAtA}\to0$.`),
      isSub
        ? wrong("not-mono", H`לא, כי $f_n$ אינה מונוטונית ב־$[0,\infty)$.`, H`נדרשת מונוטוניות בתחום הנבדק בלבד, ו־$f_n$ עולה ב־$[0,${aL}]$.`)
        : wrong("jump", H`לא, כי $f$ אינה רציפה ב־$x=1$.`, H`הנקודה $x=1$ אינה שייכת לקרן $[${aL},\infty)$; ב־$f=0$ בכל נקודה של הקרן.`),
    ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    H`$M_n\to0$: ההתכנסות במידה שווה.`,
    isSub
      ? H`$f=0$ בתחום. $f_n'$ חיובית ב־$[0,1)$ ולכן $M_n=f_n(${aL})=${fnAtA}\to0$ (כי $${aL}<1$). לפי מבחן הסופרמום ההתכנסות במידה שווה.`
      : H`$f=0$ בתחום. $f_n'$ שלילית ב־$(1,\infty)$ ולכן $M_n=f_n(${aL})=${fnAtA}<${qPow(a, "-n")}\to0$ (כי $${aL}>1$). לפי מבחן הסופרמום ההתכנסות במידה שווה.`);
    steps = [s1, s2, s3, s4];
  } else {
    const s2 = step({
      id: "ratio-2", title: "נקודה נעה",
      prompt: H`נבחר $x_n=2^{1/n}$. היא שייכת לתחום, ו־$x_n>1$. חשבו.`,
      parts: [
        slotsPart(template("ratio-2-pow", [L(H`x_n^{\,n}=`), S("r2a")], [chipSlot(book, rng, "r2a", ok("2", K(2)), [
          bad("\\tfrac12", K(0.5), H`זה מתקבל עבור $x_n=2^{-1/n}$.`),
          bad("n", seq((n) => n), H`$\left(2^{1/n}\right)^n=2^{1}$, ללא תלות ב־$n$.`),
          bad("2^{n}", seq((n) => 2 ** n), H`מכפילים מעריכים: $\left(2^{1/n}\right)^n=2^{\frac1n\cdot n}=2$.`),
        ])])),
        slotsPart(template("ratio-2-val", [L(H`f_n(x_n)=\frac{x_n^n}{1+x_n^{2n}}=`), S("r2b")], [chipSlot(book, rng, "r2b", ok("\\tfrac25", K(0.4)), [
          bad("\\tfrac23", K(2 / 3), H`$x_n^{2n}=\left(x_n^n\right)^2=4$, ולא $2$.`),
          bad("\\tfrac12", K(0.5), H`זה הערך ב־$x=1$; כאן $x_n^n=2$.`),
          bad("\\tfrac45", K(0.8), H`המונה הוא $x_n^n=2$, לא $4$.`),
        ])])),
        slotsPart(template("ratio-2-lim", [L(H`f(x_n)=`), S("r2c")], [chipSlot(book, rng, "r2c", ok("0", K(0)), [
          bad("\\tfrac12", K(0.5), H`$f(1)=\frac12$ רק ב־$x=1$, ו־$x_n>1$.`),
          bad("\\tfrac25", K(0.4), H`זה $f_n(x_n)$, לא $f(x_n)$.`),
          bad("2", K(2), H`$f=0$ בכל נקודה $x>1$.`),
        ])])),
      ],
      hints: [H`$x_n^n=\left(2^{1/n}\right)^n$. הציבו במונה ובמכנה.`],
      solvedNote: H`$f_n(x_n)=\frac25$ ו־$f(x_n)=0$ לכל $n$.`,
    });
    const s3 = step({
      id: "ratio-3", title: "מה מצדיק את המסקנה",
      prompt: "סמנו את כל הנימוקים הנדרשים כדי להסיק שההתכנסות אינה במידה שווה.",
      parts: [checklistPart("ratio-3-why", shuffle(rng, [
        must("inside", H`$x_n=2^{1/n}$ שייכת לתחום לכל $n$.`),
        must("gap", H`$\lvert f_n(x_n)-f(x_n)\rvert=\frac25$ לכל $n$.`),
        must("sup", H`לכן $M_n\ge\frac25$ לכל $n$, ו־$M_n\not\to0$.`),
        extra("jump", H`$f$ אינה רציפה ב־$x=1$ ($f(1)=\frac12$ ו־$f=0$ סביבה).`, "נכון: אפשר גם להשתמש במשפט הרציפות, אך הנקודה הנעה מספיקה."),
        nope("limit-pt", H`$x_n\to1$ ו־$f(1)=\frac12$, ולכן $f_n(x_n)\to f(1)$.`, H`$f_n(x_n)=\frac25$ לכל $n$ ואינה שואפת ל־$\frac12$: ההצבה של גבול הנקודה דורשת רציפות שאינה נתונה.`),
        nope("pointwise", H`$f_n(x_n)\to0$, כי $f_n\to0$ בכל נקודה.`, "התכנסות נקודתית אינה אומרת דבר על נקודה שזזה עם $n$."),
      ]))],
      hints: [H`כדי להפריך התכנסות במידה שווה מספיק למצוא $x_n$ בתחום שבה הפער אינו שואף ל־$0$.`],
      solvedNote: H`$M_n\ge\frac25$: ההתכנסות אינה במידה שווה.`,
    });
    const s4 = verdictStep(rng, "ratio-4", verdictPrompt, [
      good("not-uniform", H`לא במידה שווה: $\lvert f_n(x_n)-f(x_n)\rvert=\frac25$ לכל $n$, עבור $x_n=2^{1/n}$.`),
      wrong("uniform-pw", H`כן, כי $f_n(x)\to f(x)$ בכל נקודה.`, "התכנסות נקודתית אינה מספיקה."),
      wrong("uniform-one", H`כן, כי $f_n\to f$ בכל נקודה פרט לנקודה אחת, $x=1$.`, H`נקודות קרובות ל־$1$ (כמו $x_n$) נותנות פער $\frac25$, ולכן $M_n\not\to0$.`),
      wrong("not-wrong-reason", H`לא במידה שווה, כי $f_n(1)\ne f(1)$.`, H`$f_n(1)=\frac12=f(1)$ לכל $n$; הפער נמצא ליד $x=1$.`),
    ], [H`אם יש $x_n$ בתחום שבה $\lvert f_n(x_n)-f(x_n)\rvert\not\to0$, ההתכנסות אינה במידה שווה.`],
    H`$M_n\ge\frac25$: ההתכנסות אינה במידה שווה.`,
    H`נבחר $x_n=2^{1/n}$ בתחום. אז $x_n^n=2$, $f_n(x_n)=\frac{2}{1+4}=\frac25$ ו־$f(x_n)=0$ (כי $x_n>1$). לכן $M_n\ge\frac25$ לכל $n$, ולפי מבחן הסופרמום ההתכנסות אינה במידה שווה.`);
    steps = [s1, s2, s3, s4];
  }

  const xMax = kind === "sub" ? 1.2 : kind === "tail" ? qv(a) + 3 : kind === "full" ? 3 : qv(b) * 1.1;
  const view = autoView(model, 0, xMax);
  const plot = monotone
    ? plotOf(model, view, () => qv(a), kind === "sub" ? "הקצה הימני, שם המקסימום" : "הקצה השמאלי, שם המקסימום")
    : plotOf(model, view, (n) => 2 ** (1 / n), "הנקודה הנעה x_n");
  return {
    book, model,
    exercise: finishExercise({
      id: RATIO_ID, signature: ratioSignature(v), difficulty: ratioDifficulty(v),
      title: monotone ? "מנה של חזקות: תחום שאינו כולל את 1" : "מנה של חזקות: פסגה ליד 1",
      statement: statementOf(fn, d, domTex), formula: formulaOf(fn, domTex), steps, book, plot,
    }),
  };
}

export const RATIO_POWER = makeFamily<RatioVariant>({
  id: RATIO_ID,
  grid: ratioGrid,
  kindOf: (v) => v.kind,
  difficulty: ratioDifficulty,
  signature: ratioSignature,
  build: buildRatio,
});

// =============================================================================================
// 3. cos(m x^n): the supremum of the difference is approached, or the interval stays away from 1
// =============================================================================================

type CosKind = "closed1" | "sub";
export type CosVariant = { m: 1 | 2 | 3; kind: CosKind; a?: Q };
const COS_ID = "unif-cos-power";

function cosGrid(): CosVariant[] {
  const out: CosVariant[] = [];
  for (const m of [1, 2, 3] as const) {
    out.push({ m, kind: "closed1" });
    for (const a of [Qn(1, 2), Qn(2, 3), Qn(3, 4)]) out.push({ m, kind: "sub", a });
  }
  return out;
}
const cosSignature = (v: CosVariant) => `m=${v.m};${v.kind}${v.a ? `;a=${qKey(v.a)}` : ""}`;
const cosDifficulty = (v: CosVariant): PracticeDifficulty => (v.kind === "sub" ? "easy" : "medium");

function buildCos(v: CosVariant, rng: SeededRandom): Built {
  const { m, kind } = v;
  const a = v.a ?? Qn(1);
  const sub = kind === "sub";
  const book = new Book();
  const fn = `\\cos\\left(${co(m, "x^n")}\\right)`;
  const gap = 1 - Math.cos(m);
  const cm = `\\cos ${m}`;
  const d = sub ? mkDom(0, qv(a), true, true) : mkDom(0, 1, true, true);
  const domTex = interval(d, "0", sub ? qL(a) : "1");
  const aL = qL(a);
  const mxn = co(m, "x^n");
  const model: Model = {
    value: (n, x) => Math.cos(m * x ** n),
    limit: (x) => (x < 1 ? 1 : Math.cos(m)),
    domain: d,
    uniform: sub,
    sup: sub ? (n) => 1 - Math.cos(m * qv(a) ** n) : () => gap,
    ...(sub ? {} : { gap }),
    samples: sub ? [0, qv(a) / 2, qv(a)] : [0, 0.5, 0.9, 1],
  };
  const aN = co(m, qPow(a, "n"));

  // ---- step 1
  const limitOne = (id: string) => chipSlot(book, rng, id, ok("1", K(1)), [
    bad("0", K(0), H`$x^n\to0$, ולכן $\cos\left(${mxn}\right)\to\cos0=1$.`),
    bad(cm, K(Math.cos(m)), H`זה הערך ב־$x=1$; כש־$x<1$ מתקיים $x^n\to0$.`),
    bad(`${m}`, K(m), H`שכחתם את ה־$\cos$.`),
  ]);
  const s1Parts = sub
    ? [slotsPart(template("cos-1-below", [L(H`0\le x\le ${aL}:\quad f(x)=`), S("cos1a")], [limitOne("cos1a")]))]
    : [
      slotsPart(template("cos-1-below", [L(H`0\le x<1:\quad f(x)=`), S("cos1a")], [limitOne("cos1a")])),
      slotsPart(template("cos-1-at", [L(H`x=1:\quad f(1)=`), S("cos1b")], [chipSlot(book, rng, "cos1b", ok(cm, K(Math.cos(m))), [
        bad("1", K(1), H`ב־$x=1$ מקבלים $\cos\left(${m}\cdot1^n\right)=${cm}$ לכל $n$.`),
        bad("0", K(0), H`$x=1$ נותנת $x^n=1$ ולא $0$.`),
        bad(`-${cm}`, K(-Math.cos(m)), H`הציבו $x=1$ ב־$\cos\left(${mxn}\right)$ בלי שינוי סימן.`),
        bad(`${m}`, K(m), H`שכחתם את ה־$\cos$.`),
      ])])),
    ];
  const s1 = step({
    id: "cos-1", title: STEP_LIMIT_TITLE,
    prompt: H`חשבו את הגבול הנקודתי $f(x)=\lim_{n\to\infty}f_n(x)$ ${sub ? "בכל נקודה של הקטע" : "בשני חלקי הקטע"}.`,
    parts: s1Parts,
    hints: [H`$\cos$ רציפה, ו־$x^n\to0$ כש־$0\le x<1$. ב־$x=1$ הסדרה קבועה.`],
    solvedNote: sub ? H`$f(x)=1$ בכל נקודה של הקטע.` : H`$f(x)=1$ ב־$[0,1)$ ו־$f(1)=${cm}$.`,
  });

  const verdictPrompt = H`האם $f_n\to f$ במידה שווה ${inDom(d, domTex)}?`;
  let steps: PracticeStep[];
  if (!sub) {
    const s2 = step({
      id: "cos-2", title: "הפער בכל נקודה",
      prompt: H`חשבו את $\lvert f_n(x)-f(x)\rvert$ בכל אחד משני החלקים. שימו לב ש־$\cos\le1$.`,
      parts: [
        slotsPart(template("cos-2-below", [L(H`x<1:\quad \lvert f_n(x)-f(x)\rvert=`), S("cos2a")], [chipSlot(book, rng, "cos2a",
          ok(`1-\\cos\\left(${mxn}\\right)`, nxUnit((n, x) => 1 - Math.cos(m * x ** n))), [
            bad(`\\cos\\left(${mxn}\\right)`, nxUnit((n, x) => Math.cos(m * x ** n)), H`זה $f_n(x)$ עצמה, לא הפער מ־$f(x)=1$.`),
            bad(`1-${cm}`, nxUnit(() => gap), H`זה הערך ב־$x=1$; כש־$x<1$ הגבול הוא $1$.`),
            bad(`\\cos\\left(${mxn}\\right)-${cm}`, nxUnit((n, x) => Math.cos(m * x ** n) - Math.cos(m)), H`כש־$x<1$ הגבול הוא $f(x)=1$, לא $${cm}$.`),
          ])])),
        slotsPart(template("cos-2-at", [L(H`x=1:\quad \lvert f_n(1)-f(1)\rvert=`), S("cos2b")], [chipSlot(book, rng, "cos2b", ok("0", K(0)), [
          bad(`1-${cm}`, K(gap), H`$f_n(1)=${cm}=f(1)$ לכל $n$, ולכן הפער ב־$x=1$ הוא $0$.`),
          bad(cm, K(Math.cos(m)), H`זה הערך של $f_n(1)$, לא הפער.`),
          bad("1", K(1), H`$f_n(1)=${cm}=f(1)$, ולכן הפער הוא $0$.`),
        ])])),
      ],
      hints: [H`ב־$x<1$ מתקיים $f(x)=1$; ב־$x=1$ מתקיים $f(1)=${cm}$.`],
      solvedNote: H`הפער הוא $1-\cos\left(${mxn}\right)$ ב־$[0,1)$ ו־$0$ ב־$x=1$.`,
    });
    const s3 = step({
      id: "cos-3", title: H`הסופרמום $M_n$`,
      prompt: H`ב־$[0,1)$ מתקיים $0<${mxn}<${m}<\pi$, ו־$1-\cos t$ עולה ב־$[0,\pi]$, ולכן הפער עולה ב־$x$. חשבו את $M_n$, והחליטו אם הוא מתקבל בקטע.`,
      parts: [
        slotsPart(template("cos-3-mn", [L(H`M_n=`), S("cos3a")], [chipSlot(book, rng, "cos3a", ok(`1-${cm}`, K(gap)), [
          bad("0", K(0), H`$0$ הוא הפער ב־$x=0$ וב־$x=1$ בלבד; $M_n$ הוא הסופרמום של כל הפערים.`),
          bad(cm, K(Math.cos(m)), H`זה הערך של $f(1)$, לא הפער.`),
          bad("2", K(2), H`$2$ הוא הערך המרבי של $1-\cos t$ (ב־$t=\pi$), אך כאן $t=${mxn}<${m}<\pi$.`),
        ])])),
        choicePart("cos-3-att", "האם הסופרמום מתקבל בקטע?", shuffle(rng, [
          good("not-attained", H`לא: ב־$x<1$ הפער קטן מ־$M_n$ ומתקרב אליו, וב־$x=1$ הפער הוא $0$.`),
          wrong("at-one", H`כן, ב־$x=1$.`, H`ב־$x=1$ הפער הוא $0$.`),
          wrong("at-zero", H`כן, ב־$x=0$.`, H`$f_n(0)=\cos0=1=f(0)$: הפער ב־$x=0$ הוא $0$.`),
        ])),
      ],
      hints: [H`$M_n=\lim_{x\to1^-}\left(1-\cos\left(${mxn}\right)\right)$, כי הפער עולה ב־$x$.`],
      solvedNote: H`$M_n=1-${cm}$ לכל $n$, ואינו מתקבל.`,
    });
    const s4 = verdictStep(rng, "cos-4", verdictPrompt, [
      good("not-uniform", H`לא במידה שווה: $M_n=1-${cm}\not\to0$.`),
      wrong("uniform-zero", H`כן, כי הפער ב־$x=1$ הוא $0$ ובכל $x<1$ הוא שואף ל־$0$.`, H`לכל $n$ יש $x<1$ קרוב ל־$1$ שבו הפער קרוב ל־$1-${cm}$: הגבול כש־$n\to\infty$ אינו מתחלף עם הסופרמום.`),
      wrong("uniform-cont", H`כן, כי כל $f_n$ רציפה.`, "רציפות הסדרה אינה מספיקה: מבחן הסופרמום דורש $M_n\\to0$."),
    ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    H`$M_n\not\to0$: ההתכנסות אינה במידה שווה (גם משפט הרציפות נותן זאת: $f_n$ רציפות ו־$f$ קופצת ב־$x=1$).`,
    H`$f=1$ ב־$[0,1)$ ו־$f(1)=${cm}$. הפער $1-\cos\left(${mxn}\right)$ עולה ב־$x$ ב־$[0,1)$ (כי $${mxn}<${m}<\pi$) ומתקרב ל־$1-${cm}$ כש־$x\to1^-$, ולכן $M_n=1-${cm}$ לכל $n$. $M_n\not\to0$, ולפי מבחן הסופרמום ההתכנסות אינה במידה שווה.`);
    steps = [s1, s2, s3, s4];
  } else {
    const s2 = step({
      id: "cos-2", title: "היכן המקסימום",
      prompt: H`סמנו את הנימוקים הנדרשים לכך שהפער $\lvert f_n-f\rvert$ מקבל את המקסימום בקצה הימני $x=${aL}$.`,
      parts: [checklistPart("cos-2-why", shuffle(rng, [
        must("range", H`$x^n$ עולה ב־$x$, ולכן $${mxn}\in[0,${m}]\subset[0,\pi)$ בקטע (כי $${m}<\pi$).`),
        must("inc", H`לפי משפט לגרנז', $1-\cos t$ עולה ב־$[0,\pi]$ (נגזרתה $\sin t\ge0$).`),
        must("diff", H`$\lvert f_n-f\rvert=1-\cos\left(${mxn}\right)$, כי $f=1\ge\cos$; לכן הפער עולה ב־$x$ והמקסימום בקצה הימני.`),
        extra("bound", H`לפי משפט לגרנז', $1-\cos t=t\sin\xi\le t^2$ לכל $t\ge0$, ולכן $M_n\le${co(m * m, qPow(a, "2n"))}$.`, "נכון, והוא נותן הוכחה חלופית; כאן הסופרמום מחושב במדויק."),
        nope("inc-all", H`$1-\cos t$ עולה לכל $t\ge0$.`, H`הפונקציה עולה רק ב־$[0,\pi]$ ואז יורדת; כאן $t=${mxn}\le${m}<\pi$, ולכן המונוטוניות מספיקה.`),
        nope("crit", H`$\frac{d}{dx}\left(1-\cos\left(${mxn}\right)\right)=0$ בנקודה פנימית.`,
          H`הנגזרת היא $${co(m, "n")}x^{n-1}\sin\left(${mxn}\right)>0$ ב־$(0,${aL})$, כי $${mxn}\in(0,\pi)$.`),
      ]))],
      hints: [H`הפער הוא הרכבה של $t=${mxn}$ (עולה ב־$x$) עם $1-\cos t$ (עולה ב־$[0,\pi]$).`],
      solvedNote: H`הפער עולה ב־$x$, ולכן $M_n$ הוא הערך ב־$x=${aL}$.`,
    });
    const mnSlot = chipSlot(book, rng, "cos3a", ok(`1-\\cos\\left(${aN}\\right)`, seq((n) => 1 - Math.cos(m * qv(a) ** n))), [
      bad(`1-${cm}`, K(gap), H`זה הערך ב־$x=1$, שאינה בקטע $[0,${aL}]$.`),
      bad(`\\cos\\left(${aN}\\right)`, seq((n) => Math.cos(m * qv(a) ** n)), H`זה $f_n(${aL})$, לא הפער מ־$f=1$.`),
      bad(co(m * m, qPow(a, "2n")), seq((n) => m * m * qv(a) ** (2 * n)), H`זה חסם עליון (לפי משפט לגרנז', $1-\cos t\le t^2$), לא הערך המדויק.`),
    ]);
    const limSlot = chipSlot(book, rng, "cos3b", ok("0", K(0)), [
      bad(`1-${cm}`, K(gap), H`$${qPow(a, "n")}\to0$, ולכן $1-\cos\left(${aN}\right)\to1-\cos0=0$.`),
      bad("\\infty", K(Infinity), H`$${qPow(a, "n")}\to0$ כי $${aL}<1$.`),
      bad("1", K(1), H`$\cos0=1$, ולכן $1-\cos0=0$.`),
    ]);
    const s3 = step({
      id: "cos-3", title: H`חישוב $M_n$ וגבולו`,
      prompt: H`כתבו את $M_n$ וחשבו את גבולו.`,
      parts: [slotsPart(template("cos-3-mn", [L(H`M_n=`), S("cos3a"), L(H`\xrightarrow[n\to\infty]{}`), S("cos3b")], [mnSlot, limSlot]))],
      hints: [H`הציבו $x=${aL}$ בפער $1-\cos\left(${mxn}\right)$.`],
      solvedNote: H`$M_n=1-\cos\left(${aN}\right)\to0$.`,
    });
    const s4 = verdictStep(rng, "cos-4", verdictPrompt, [
      good("uniform", H`כן: $M_n=1-\cos\left(${aN}\right)\to0$.`),
      wrong("not-1", H`לא, כי ב־$[0,1]$ ההתכנסות אינה במידה שווה.`, H`סוג ההתכנסות תלוי בתחום: הקטע $[0,${aL}]$ אינו מגיע ל־$1$.`),
      wrong("not-pos", H`לא, כי $M_n>0$ לכל $n$.`, H`חיוביות $M_n$ אינה מספיקה: מה שחשוב הוא אם $M_n\to0$.`),
    ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    H`$M_n\to0$: ההתכנסות במידה שווה.`,
    H`$f=1$ בקטע. הפער $1-\cos\left(${mxn}\right)$ עולה ב־$x$ (כי $${mxn}\in[0,${m}]\subset[0,\pi)$), ולכן $M_n=1-\cos\left(${aN}\right)\to1-\cos0=0$. לפי מבחן הסופרמום ההתכנסות במידה שווה.`);
    steps = [s1, s2, s3, s4];
  }

  const view = autoView(model, 0, sub ? qv(a) * 1.15 : 1.1);
  const plot = plotOf(model, view, sub ? () => qv(a) : undefined, sub ? "הקצה הימני, שם המקסימום" : undefined);
  return {
    book, model,
    exercise: finishExercise({
      id: COS_ID, signature: cosSignature(v), difficulty: cosDifficulty(v),
      title: sub ? "קוסינוס של חזקה: קטע שאינו מגיע ל־1" : "קוסינוס של חזקה: פער שאינו מתקבל",
      statement: statementOf(fn, d, domTex), formula: formulaOf(fn, domTex), steps, book, plot,
    }),
  };
}

export const COS_POWER = makeFamily<CosVariant>({
  id: COS_ID,
  grid: cosGrid,
  kindOf: (v) => v.kind,
  difficulty: cosDifficulty,
  signature: cosSignature,
  build: buildCos,
});

// =============================================================================================
// 4. sin(c x^{1/(kn)}): the limit jumps at 0 (sup approached), or the interval stays away from 0 (Lagrange bound)
// =============================================================================================

type SinKind = "closed0" | "open0" | "left";
export type SinVariant = { kind: SinKind; c: Q; k: 1 | 2; a?: Q };
const SIN_ID = "unif-sin-root";

function sinGrid(): SinVariant[] {
  const out: SinVariant[] = [];
  for (const c of [Qn(1), Qn(1, 2)]) for (const k of [1, 2] as const) {
    out.push({ kind: "closed0", c, k }, { kind: "open0", c, k });
    for (const a of [Qn(1, 8), Qn(1, 4), Qn(1, 2), Qn(3, 4)]) out.push({ kind: "left", c, k, a });
  }
  return out;
}
const sinSignature = (v: SinVariant) => `${v.kind};c=${qKey(v.c)};k=${v.k}${v.a ? `;a=${qKey(v.a)}` : ""}`;
const sinDifficulty = (v: SinVariant): PracticeDifficulty => (v.kind === "left" ? "easy" : v.kind === "closed0" ? "medium" : "advanced");

function buildSin(v: SinVariant, rng: SeededRandom): Built {
  const { kind, c, k } = v;
  const a = v.a ?? Qn(1);
  const left = kind === "left";
  const book = new Book();
  const cv = qv(c);
  const cL = qL(c);
  const cx = c.d === 1 ? "" : cL;
  /** x^{1/(kn)}: the exponent as LaTeX (inside a power of a base) and as a plain exponent. */
  const expL = k === 1 ? "\\frac{1}{n}" : "\\frac{1}{2n}";
  const expS = k === 1 ? "1/n" : "1/(2n)";
  const fn = H`\sin\left(${cx}x^{${expS}}\right)`;
  const sc = c.d === 1 ? "\\sin 1" : "\\sin\\tfrac12";
  const cc = c.d === 1 ? "\\cos 1" : "\\cos\\tfrac12";
  const sv = Math.sin(cv);
  const root = (n: number, x: number) => x ** (1 / (k * n));
  const d = kind === "closed0" ? mkDom(0, 1, true, true) : kind === "open0" ? mkDom(0, 1, false, true) : mkDom(qv(a), 1, true, true);
  const domTex = interval(d, kind === "left" ? qL(a) : "0", "1");
  const aL = qL(a);
  const aRoot = qPow(a, expL);
  const uX = `x^{${expL}}`;
  const model: Model = {
    value: (n, x) => Math.sin(cv * root(n, x)),
    limit: (x) => (x === 0 ? 0 : sv),
    domain: d,
    uniform: left,
    sup: left ? (n) => sv - Math.sin(cv * root(n, qv(a))) : () => sv,
    ...(left
      ? { bound: (n: number) => cv * (1 - root(n, qv(a))) }
      : { gap: sv, supTol: 5e-3, ns: [10, 20, 40] as [number, number, number], extra: (n: number) => [2, 4, Math.min(8, 700 / (k * n))].map((t) => Math.exp(-k * n * t)) }),
    samples: kind === "closed0" ? [0, 0.25, 0.5, 1] : kind === "open0" ? [0.25, 0.5, 1] : [qv(a), (1 + qv(a)) / 2, 1],
  };

  // ---- step 1
  const limitPos = (id: string) => chipSlot(book, rng, id, ok(sc, K(sv)), [
    bad("0", K(0), H`לכל $x>0$ קבוע מתקיים $x^{${expS}}\to1$ (לא $0$), ולכן הגבול הוא $${sc}$.`),
    bad(cL, K(cv), H`שכחתם את ה־$\sin$: $f_n(x)=\sin\left(${cx}x^{${expS}}\right)\to${sc}$.`),
    bad(cc, K(Math.cos(cv)), H`הציבו $x^{${expS}}\to1$ בתוך $\sin$, לא $\cos$.`),
  ]);
  const posRange = left ? H`${aL}\le x\le1` : H`0<x\le1`;
  const s1Parts = kind === "closed0"
    ? [
      slotsPart(template("sin-1-zero", [L(H`x=0:\quad f(0)=`), S("sin1a")], [chipSlot(book, rng, "sin1a", ok("0", K(0)), [
        bad(sc, K(sv), H`$f_n(0)=\sin\left(${cx}\cdot0\right)=0$ לכל $n$.`),
        bad(cL, K(cv), H`$f_n(0)=\sin0=0$ לכל $n$.`),
        bad(cc, K(Math.cos(cv)), H`$f_n(0)=\sin0=0$ לכל $n$.`),
      ])])),
      slotsPart(template("sin-1-pos", [L(H`${posRange}:\quad f(x)=`), S("sin1b")], [limitPos("sin1b")])),
    ]
    : [slotsPart(template("sin-1-pos", [L(H`${posRange}:\quad f(x)=`), S("sin1b")], [limitPos("sin1b")]))];
  const s1 = step({
    id: "sin-1", title: STEP_LIMIT_TITLE,
    prompt: H`חשבו את הגבול הנקודתי $f(x)=\lim_{n\to\infty}f_n(x)$ ${kind === "closed0" ? "ב־$x=0$ ובשאר הקטע" : "בכל נקודה של הקטע"}.`,
    parts: s1Parts,
    hints: [H`לכל $x>0$ קבוע, $x^{${expS}}=e^{\frac{\ln x}{${k === 1 ? "n" : "2n"}}}\to e^0=1$.`],
    solvedNote: kind === "closed0" ? H`$f(0)=0$ ו־$f(x)=${sc}$ ל־$0<x\le1$.` : H`$f(x)=${sc}$ בכל נקודה של הקטע.`,
  });

  const verdictPrompt = H`האם $f_n\to f$ במידה שווה ${inDom(d, domTex)}?`;
  let steps: PracticeStep[];
  if (!left) {
    const s2 = step({
      id: "sin-2", title: "הפער ליד 0",
      prompt: H`לכל $n$ קבוע, כש־$x\to0^+$ מתקיים $x^{${expS}}\to0$, ו־$f(x)=${sc}$. חשבו את הגבול של הפער.`,
      parts: [slotsPart(template("sin-2-end", [L(H`\lim_{x\to0^+}\lvert f_n(x)-f(x)\rvert=`), S("sin2a")], [chipSlot(book, rng, "sin2a", ok(sc, K(sv)), [
        bad("0", K(0), H`כאן $f_n(x)\to\sin0=0$ בעוד $f(x)=${sc}$, ולכן הפער אינו שואף ל־$0$.`),
        bad(cL, K(cv), H`הפער הוא $\lvert\sin0-${sc}\rvert=${sc}$.`),
        bad(cc, K(Math.cos(cv)), H`הפער הוא $\lvert\sin0-${sc}\rvert=${sc}$.`),
      ])]))],
      hints: [H`$f_n(x)=\sin\left(${cx}x^{${expS}}\right)\to\sin0$ כש־$x\to0^+$ (ו־$n$ קבוע).`],
      solvedNote: H`הפער מתקרב ל־$${sc}$ כש־$x\to0^+$.`,
    });
    const s3 = step({
      id: "sin-3", title: H`הסופרמום $M_n$`,
      prompt: H`ב־$(0,1]$ מתקיים $0<${cx}x^{${expS}}\le${cL}\le1<\frac\pi2$, ו־$\sin$ עולה שם (לפי משפט לגרנז': $(\sin)'=\cos>0$). לכן הפער $${sc}-\sin\left(${cx}x^{${expS}}\right)$ יורד ב־$x$. מהו $M_n=\sup_{x\in${domTex}}\lvert f_n(x)-f(x)\rvert$, והאם הוא מתקבל?`,
      parts: [choicePart("sin-3-sup", "בחרו.", shuffle(rng, [
        good("approached", H`$M_n=${sc}$ לכל $n$, אך הוא אינו מתקבל: לכל $x>0$ הפער קטן מ־$${sc}$.`),
        wrong("zero", H`$M_n=0$, כי $f_n(x)\to f(x)$ בכל נקודה.`, H`ההתכנסות הנקודתית אינה קובעת את $M_n$: $M_n$ הוא סופרמום לפי $x$ עבור $n$ קבוע.`),
        wrong("at-zero", H`$M_n=${sc}$, והוא מתקבל ב־$x=0$.`, kind === "closed0" ? H`ב־$x=0$ הפער הוא $\lvert f_n(0)-f(0)\rvert=0$.` : H`הנקודה $x=0$ אינה שייכת ל־$(0,1]$.`),
      ]))],
      hints: [H`$${sc}-\sin\left(${cx}x^{${expS}}\right)\to${sc}$ כש־$x\to0^+$.`],
      solvedNote: H`$M_n=${sc}$ לכל $n$: סופרמום שאינו מתקבל.`,
    });
    const s4 = verdictStep(rng, "sin-4", verdictPrompt, [
      good("not-uniform", H`לא במידה שווה: $M_n=${sc}\not\to0$.`),
      wrong("uniform-pw", H`כן, כי $f_n(x)\to f(x)$ בכל נקודה.`, "התכנסות נקודתית אינה מספיקה."),
      kind === "closed0"
        ? wrong("uniform-pt", H`כן, כי בנקודה הבעייתית $x=0$ הפער הוא $0$.`, H`הפער קטן ב־$x=0$ עצמה, אך לא קרוב אליה: $M_n=${sc}$.`)
        : wrong("uniform-cont", H`כן, כי $f\equiv${sc}$ קבועה, ולכן רציפה.`, H`רציפות הגבול היא תנאי הכרחי בלבד: כאן $M_n=${sc}\not\to0$.`),
    ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    kind === "closed0" ? H`$M_n\not\to0$ (וכן $f_n$ רציפות ו־$f$ קופצת ב־$x=0$): ההתכנסות אינה במידה שווה.` : H`$M_n\not\to0$: ההתכנסות אינה במידה שווה, אף שהגבול רציף.`,
    H`$f=${sc}$ ב־$(0,1]$. $\sin$ עולה ב־$\left[0,\frac\pi2\right]$ (לפי משפט לגרנז', $\cos>0$ שם), ולכן הפער $${sc}-\sin\left(${cx}x^{${expS}}\right)$ יורד ב־$x$ ומתקרב ל־$${sc}$ כש־$x\to0^+$. לכן $M_n=${sc}$ לכל $n$ ו־$M_n\not\to0$: לפי מבחן הסופרמום ההתכנסות אינה במידה שווה.`);
    steps = [s1, s2, s3, s4];
  } else {
    // c (1 - u) with u = x^{1/(kn)}, in LaTeX
    const mulC = (inner: string) => (c.d === 1 ? inner : `${cL}${inner}`);
    const halfC = c.d === 1 ? "\\tfrac12" : "\\tfrac14";
    const boundX = mulC(`\\left(1-${uX}\\right)`);
    const boundA = mulC(`\\left(1-${aRoot}\\right)`);
    const probesA: [number, number][] = [[3, 0.7], [10, 0.9], [3, 0.05], [2, 0.01], [7, 0.4]];
    const ptsA = (f: (n: number, x: number) => number) => probesA.map(([n, x]) => f(n, x));
    const targetA = ptsA((n, x) => Math.abs(Math.sin(cv * root(n, x)) - sv));
    const probesB: [number, number][] = [[3, qv(a)], [10, qv(a)], [30, qv(a)], [10, (1 + qv(a)) / 2]];
    const ptsB = (f: (n: number) => number) => probesB.map(([n]) => f(n));
    const targetB = probesB.map(([n, x]) => cv * (1 - root(n, x)));
    const slotA = chipSlot(book, rng, "sin2a", ok(boundX, ptsA((n, x) => cv * (1 - root(n, x)))), [
      bad(`${halfC}\\left(1-${uX}\\right)`, ptsA((n, x) => (cv / 2) * (1 - root(n, x))), H`$\lvert\cos\xi\rvert$ יכול להיות גדול מ־$\frac12$, ולכן חצי מהחסם אינו מספיק.`),
      bad(mulC(`\\left(1-${uX}\\right)^{2}`), ptsA((n, x) => cv * (1 - root(n, x)) ** 2), H`$1-u$ קטן מ־$1$, ולכן $(1-u)^2<1-u$: החסם קטן מדי.`),
      bad(mulC(`${uX}\\left(1-${uX}\\right)`), ptsA((n, x) => cv * root(n, x) * (1 - root(n, x))), H`לפי משפט לגרנז' הגורם הוא $\lvert\cos\xi\rvert\le1$; הגורם $u=x^{${expS}}$ קטן ממנו כש־$x$ קטן.`),
    ], targetA);
    const slotB = chipSlot(book, rng, "sin2b", ok(boundA, ptsB((n) => cv * (1 - root(n, qv(a))))), [
      bad(`${halfC}\\left(1-${aRoot}\\right)`, ptsB((n) => (cv / 2) * (1 - root(n, qv(a)))), H`$x\ge${aL}$ נותן $1-x^{${expS}}\le1-${aRoot}$, ולא חצי ממנו.`),
      bad(mulC(`\\left(1-${aRoot}\\right)^{2}`), ptsB((n) => cv * (1 - root(n, qv(a))) ** 2), H`$x^{${expS}}\ge${aRoot}$ נותן $1-x^{${expS}}\le1-${aRoot}$, לא את ריבועו.`),
    ], targetB);
    const s2 = step({
      id: "sin-2", title: "חסם לפי משפט לגרנז'",
      prompt: H`לפי משפט לגרנז' $\lvert\sin u-\sin v\rvert=\lvert\cos\xi\rvert\,\lvert u-v\rvert\le\lvert u-v\rvert$. הציבו $u=${cx}x^{${expS}}$ ו־$v=${cL}$ (ולכן $\lvert u-v\rvert=${boundX}$), והשלימו: חסם על הפער, ואחר כך חסם שאינו תלוי ב־$x$ עבור $x\in[${aL},1]$.`,
      parts: [slotsPart(template("sin-2-bound", [L(H`\lvert f_n(x)-f(x)\rvert=\left\lvert\sin\left(${cx}x^{${expS}}\right)-${sc}\right\rvert\le`), S("sin2a"), L(H`\le`), S("sin2b")], [slotA, slotB]))],
      hints: [H`$x\ge${aL}$ ולכן $x^{${expS}}\ge${aRoot}$.`],
      solvedNote: H`$\lvert f_n-f\rvert\le${boundX}\le${boundA}$ ב־$[${aL},1]$.`,
    });
    const s3 = step({
      id: "sin-3", title: "מה מצדיק את המסקנה",
      prompt: "סמנו את כל הנימוקים הנדרשים כדי להסיק שההתכנסות במידה שווה.",
      parts: [checklistPart("sin-3-why", shuffle(rng, [
        must("lagrange", H`לפי משפט לגרנז', $\lvert\sin u-\sin v\rvert\le\lvert u-v\rvert$ (כי $\lvert\cos\rvert\le1$).`),
        must("mono", H`$x^{${expS}}$ עולה ב־$x$, ולכן ב־$[${aL},1]$ מתקיים $1-x^{${expS}}\le1-${aRoot}$.`),
        must("indep", H`החסם $${boundA}$ אינו תלוי ב־$x$.`),
        extra("exact", H`$M_n=${sc}-\sin\left(${cx}${aRoot}\right)$ (הפער יורד ב־$x$, כי $\sin$ עולה).`, "נכון ומדויק יותר, אך החסם מספיק."),
        nope("to0", H`$x^{${expS}}\to0$, ולכן $f_n\to0$.`, H`לכל $x>0$ מתקיים $x^{${expS}}\to1$, ולכן $f_n(x)\to${sc}$.`),
        nope("sin-dec", H`$\sin$ יורדת ב־$[0,1]$.`, H`$(\sin)'=\cos>0$ ב־$\left[0,\frac\pi2\right]$, והקטע $[0,1]$ מוכל בו.`),
      ]))],
      hints: [H`החסם הוא $\lvert u-v\rvert$ בצירוף העובדה ש־$x\ge${aL}$.`],
      solvedNote: H`$M_n\le${boundA}$.`,
    });
    const s4 = step({
      id: "sin-4", title: "הגבול של החסם",
      prompt: H`חשבו את גבול החסם כש־$n\to\infty$.`,
      parts: [slotsPart(template("sin-4-lim", [L(H`${boundA}\xrightarrow[n\to\infty]{}`), S("sin4a")], [chipSlot(book, rng, "sin4a", ok("0", K(0)), [
        bad(cL, K(cv), H`$${aRoot}\to1$, ולכן $1-${aRoot}\to0$ והחסם כולו שואף ל־$0$.`),
        bad(sc, K(sv), H`$${aRoot}\to1$, ולכן החסם שואף ל־$0$.`),
        bad("\\infty", K(Infinity), H`החסם חסום על ידי $${cL}$.`),
      ])]))],
      hints: [H`$${aRoot}=e^{\frac{\ln ${aL}}{${k === 1 ? "n" : "2n"}}}\to1$.`],
      solvedNote: H`$M_n\le${boundA}\to0$.`,
    });
    const s5 = verdictStep(rng, "sin-5", verdictPrompt, [
      good("uniform", H`כן: $M_n\le${boundA}\to0$.`),
      wrong("not-0", H`לא, כי ב־$[0,1]$ ההתכנסות אינה במידה שווה.`, H`סוג ההתכנסות תלוי בתחום: הקטע $[${aL},1]$ אינו כולל את $x=0$.`),
      wrong("not-pos", H`לא, כי $M_n>0$ לכל $n$.`, H`חיוביות $M_n$ אינה מספיקה: מה שחשוב הוא אם $M_n\to0$.`),
    ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    H`$M_n\to0$: ההתכנסות במידה שווה.`,
    H`$f=${sc}$ בקטע. לפי משפט לגרנז' $\lvert\sin u-\sin v\rvert\le\lvert u-v\rvert$, ולכן $\lvert f_n-f\rvert\le${boundX}\le${boundA}$ (כי $x^{${expS}}\ge${aRoot}$). $M_n\le${boundA}\to0$, ולפי מבחן הסופרמום ההתכנסות במידה שווה.`);
    steps = [s1, s2, s3, s4, s5];
  }

  const view = autoView(model, 0, 1.05);
  const plot = plotOf(model, view, left ? () => qv(a) : undefined, left ? "הקצה השמאלי, שם המקסימום" : undefined);
  return {
    book, model,
    exercise: finishExercise({
      id: SIN_ID, signature: sinSignature(v), difficulty: sinDifficulty(v),
      title: left ? "סינוס של שורש: קטע שאינו כולל את 0" : kind === "closed0" ? "סינוס של שורש: קפיצה ב־0" : "סינוס של שורש: גבול רציף ובכל זאת לא במידה שווה",
      statement: statementOf(fn, d, domTex), formula: formulaOf(fn, domTex), steps, book, plot,
    }),
  };
}

export const SIN_ROOT = makeFamily<SinVariant>({
  id: SIN_ID,
  grid: sinGrid,
  kindOf: (v) => v.kind,
  difficulty: sinDifficulty,
  signature: sinSignature,
  build: buildSin,
});

// =============================================================================================
// 5. (n/k)(phi(x + k/n) - phi(x)): the definition of the derivative, uniform on R by the mean value theorem
// =============================================================================================

export type TrigVariant = { kind: "trig"; phi: "sin" | "cos"; k: 1 | 2 };
export type SquareVariant = { kind: "square"; k: 1 | 2 };
export type NoLimitVariant = { kind: "nolimit"; c: 1 | 2 | 3; dom: "interval" | "ray" | "line" };
export type QuotientVariant = TrigVariant | SquareVariant | NoLimitVariant;
const QUOTIENT_ID = "unif-diff-quotient";

function quotientGrid(): QuotientVariant[] {
  const trig = (["sin", "cos"] as const).flatMap((phi) => ([1, 2] as const).map((k): QuotientVariant => ({ kind: "trig", phi, k })));
  const square = ([1, 2] as const).map((k): QuotientVariant => ({ kind: "square", k }));
  const noLimit = ([1, 2, 3] as const).flatMap((c) => (["interval", "ray", "line"] as const).map((dom): QuotientVariant => ({ kind: "nolimit", c, dom })));
  return [...trig, ...square, ...noLimit];
}
const quotientSignature = (v: QuotientVariant) => (v.kind === "trig" ? `${v.phi};k=${v.k}` : v.kind === "square" ? `square;k=${v.k}` : `nolimit;c=${v.c};${v.dom}`);
const quotientDifficulty = (v: QuotientVariant): PracticeDifficulty => (v.kind === "square" ? "advanced" : v.kind === "nolimit" ? (v.dom === "interval" ? "easy" : "medium") : v.k === 2 ? "advanced" : v.phi === "sin" ? "easy" : "medium");

/** (n, x, xi) probes for expressions in the mean value point xi. */
const NXXI: [number, number, number][] = [[3, 0.5, 1.2], [10, 1.1, 0.2], [30, 2.0, 2.9], [7, -0.7, -0.2], [10, 0.2, 3.0], [3, 1.1, 1.2], [10, -1.5, 1.5]];
const tri = (f: (n: number, x: number, xi: number) => number) => NXXI.map(([n, x, xi]) => f(n, x, xi));

function buildTrig(v: TrigVariant, rng: SeededRandom): Built {
  const { phi, k } = v;
  const isSin = phi === "sin";
  const book = new Book();
  const f0 = isSin ? Math.sin : Math.cos;
  const df = isSin ? Math.cos : (t: number) => -Math.sin(t);
  const name = isSin ? "\\sin" : "\\cos";
  const dName = isSin ? "\\cos" : "\\sin";
  const stepL = k === 1 ? "\\frac{1}{n}" : "\\frac{2}{n}";
  const fn = k === 1 ? H`n\left(${name}\left(x+${stepL}\right)-${name} x\right)` : H`\frac{n}{2}\left(${name}\left(x+${stepL}\right)-${name} x\right)`;
  const limL = isSin ? "\\cos x" : "-\\sin x";
  const d = mkDom(-Infinity, Infinity, false, false);
  const amplitude = (n: number) => {
    const h = k / n;
    const A = (n / k) * Math.sin(h) - 1;
    const B = (n / k) * (Math.cos(h) - 1);
    return Math.hypot(A, B);
  };
  const model: Model = {
    value: (n, x) => (n / k) * (f0(x + k / n) - f0(x)),
    limit: df,
    domain: d,
    uniform: true,
    sup: amplitude,
    bound: (n) => k / n,
    samples: [-3, 0, 1, 2.5],
    scanFrom: () => -7,
    scanTo: () => 7,
  };
  const kn = k === 1 ? "\\frac{1}{n}" : "\\frac{2}{n}";

  // ---- step 1: the limit
  const limitSlot = chipSlot(book, rng, "q1a", ok(limL, nx((n, x) => df(x))), [
    bad(isSin ? "-\\cos x" : "\\sin x", nx((n, x) => -df(x)), "בדקו את הסימן: זו הנגזרת של הפונקציה, לא המינוס שלה."),
    bad(isSin ? "\\sin x" : "\\cos x", nx((n, x) => f0(x)), H`זו הפונקציה $${name} x$ עצמה, לא נגזרתה.`),
    bad(isSin ? "2\\cos x" : "-2\\sin x", nx((n, x) => 2 * df(x)), H`המנה כבר מחולקת בגודל הצעד $\frac{${k}}{n}$, ולכן הגבול הוא הנגזרת עצמה.`),
    bad("0", nx(() => 0), H`$\frac{${name}(x+h)-${name} x}{h}$ שואפת לנגזרת, שאינה $0$ בכל נקודה.`),
  ]);
  const s1 = step({
    id: "q-1", title: STEP_LIMIT_TITLE,
    prompt: H`נסמן $h_n=${kn}$ ונשכתב את סדרת הפונקציות בצורה $f_n(x)=\frac{${name}(x+h_n)-${name}(x)}{h_n}$. היעזרו בכתיבה זו על מנת לחשב את הגבול הנקודתי $f(x)$.`,
    parts: [slotsPart(template("q-1-lim", [L(H`f(x)=\lim_{n\to\infty}f_n(x)=`), S("q1a")], [limitSlot]))],
    hints: [H`$h_n\to0$, ולפי הגדרת הנגזרת $\frac{${name}(x+h)-${name}(x)}{h}\to(${name})'(x)$.`],
    solvedNote: H`$f(x)=${limL}$ לכל $x\in\mathbb R$.`,
  });

  // ---- step 2: mean value theorem
  const mvtSlot = chipSlot(book, rng, "q2a", ok(isSin ? "\\cos\\xi" : "-\\sin\\xi", tri((n, x, xi) => df(xi))), [
    bad(isSin ? "\\sin\\xi" : "\\cos\\xi", tri((n, x, xi) => f0(xi)), H`לפי משפט לגרנז' מקבלים את $(${name})'(\xi)$, לא את $${name}\,\xi$.`),
    bad(isSin ? "-\\cos\\xi" : "\\sin\\xi", tri((n, x, xi) => -df(xi)), "בדקו את הסימן של הנגזרת."),
    bad(limL, tri((n, x) => df(x)), H`זו הנגזרת בנקודה $x$ עצמה; לפי משפט לגרנז' הנגזרת מחושבת בנקודה $\xi$ שבין $x$ ל־$x+\frac{${k}}{n}$.`),
    bad(H`\frac{${k}}{n}${isSin ? "\\cos\\xi" : "(-\\sin\\xi)"}`, tri((n, x, xi) => (k / n) * df(xi)), "המנה כבר חולקה בגודל הצעד, ולכן אין להכפיל בו שוב."),
  ]);
  const s2 = step({
    id: "q-2", title: "משפט לגרנז'",
    prompt: H`לפי משפט הערך הממוצע של לגרנז', לכל $x$ ו־$n$ קיימת $\xi$ בין $x$ ל־$x+\frac{${k}}{n}$ כך ש־$f_n(x)=(${name})'(\xi)$. כתבו את $f_n(x)$ באמצעות $\xi$.`,
    parts: [slotsPart(template("q-2-mvt", [L(H`f_n(x)=\frac{${name}(x+h_n)-${name}(x)}{h_n}=`), S("q2a")], [mvtSlot]))],
    hints: [H`משפט לגרנז': $\frac{g(b)-g(a)}{b-a}=g'(\xi)$ עבור $\xi\in(a,b)$.`],
    solvedNote: H`$f_n(x)=${isSin ? "\\cos\\xi" : "-\\sin\\xi"}$, כאשר $\xi$ תלויה ב־$x$ וב־$n$.`,
  });

  // ---- step 3: the bound
  const first = isSin ? H`\lvert\cos\xi-\cos x\rvert` : H`\lvert\sin\xi-\sin x\rvert`;
  const target = tri((n, x, xi) => Math.abs(df(xi) - df(x)));
  const boundA = chipSlot(book, rng, "q3a", ok("\\lvert\\xi-x\\rvert", tri((n, x, xi) => Math.abs(xi - x))), [
    bad("\\frac{\\lvert\\xi-x\\rvert}{2}", tri((n, x, xi) => Math.abs(xi - x) / 2), H`$${first}$ יכול להיות גדול מ־$\frac{\lvert\xi-x\rvert}{2}$ (השיפוע מגיע ל־$1$).`),
    bad("\\lvert\\xi-x\\rvert^{2}", tri((n, x, xi) => Math.abs(xi - x) ** 2), "כש־$\\xi$ קרובה ל־$x$, $\\lvert\\xi-x\\rvert^2$ קטן בהרבה מהפער."),
    bad("1", tri(() => 1), "הפער בין שני ערכים של $\\sin$ או $\\cos$ יכול להגיע עד $2$."),
  ], target);
  const boundBProbes: [number, number, number][] = [[3, 0.5, 0.5 + (0.9 * k) / 3], [10, 1.1, 1.1 + (0.95 * k) / 10], [30, 0.2, 0.2 + (0.99 * k) / 30], [7, 2, 2 + (0.97 * k) / 7]];
  const triB = (f: (n: number, x: number, xi: number) => number) => boundBProbes.map(([n, x, xi]) => f(n, x, xi));
  const boundB = chipSlot(book, rng, "q3b", ok(kn, triB((n) => k / n)), [
    bad(H`${fracN(k, 2, "n")}`, triB((n) => k / (2 * n)), H`$\xi$ יכולה להיות קרובה ל־$x+\frac{${k}}{n}$, ולכן $\lvert\xi-x\rvert$ יכול להיות גדול מ־$${fracN(k, 2, "n")}$.`),
    bad(H`\frac{${k}}{n^{2}}`, triB((n) => k / (n * n)), H`$\lvert\xi-x\rvert$ הוא מסדר $\frac1n$, לא $\frac1{n^2}$.`),
    bad(H`\frac{${k}}{n^{3}}`, triB((n) => k / n ** 3), H`$\lvert\xi-x\rvert$ הוא מסדר $\frac1n$, לא $\frac1{n^3}$.`),
    ...(k === 2 ? [bad("\\frac{1}{n}", triB((n) => 1 / n), H`$\xi\in\left(x,x+\frac2n\right)$, ולכן $\lvert\xi-x\rvert$ יכול להגיע ל־$\frac2n$ ולא רק ל־$\frac1n$.`)] : []),
  ], triB((n, x, xi) => Math.abs(xi - x)));
  const s3 = step({
    id: "q-3", title: "חסם על הפער",
    prompt: H`השלימו את שרשרת אי־השוויונות: ראשית חסם על הפער באמצעות $\lvert\xi-x\rvert$, ואחר כך חסם על $\lvert\xi-x\rvert$ עצמו.`,
    parts: [slotsPart(template("q-3-bound", [L(H`\lvert f_n(x)-f(x)\rvert=${first}\le`), S("q3a"), L(H`\le`), S("q3b")], [boundA, boundB]))],
    hints: [
      H`$\lvert(${dName})'\rvert\le1$, ולכן לפי משפט לגרנז' $\lvert${dName}\,u-${dName}\,v\rvert\le\lvert u-v\rvert$.`,
      H`$\xi$ נמצאת בין $x$ ל־$x+\frac{${k}}{n}$.`,
    ],
    solvedNote: H`$\lvert f_n(x)-f(x)\rvert\le\lvert\xi-x\rvert\le${kn}$.`,
  });

  // ---- step 4: what justifies the two bounds (uniformity itself is concluded in step 5)
  const s4 = step({
    id: "q-4", title: "הצדקת החסם",
    prompt: H`סמנו את כל הנימוקים הנדרשים לשרשרת $\lvert f_n(x)-f(x)\rvert\le\lvert\xi-x\rvert\le${kn}$.`,
    parts: [checklistPart("q-4-why", shuffle(rng, [
      must("lip", H`$${first}\le\lvert\xi-x\rvert$, כי $\lvert(${dName})'\rvert\le1$ (משפט לגרנז' פעם נוספת).`),
      must("between", H`$\xi$ נמצאת בין $x$ ל־$x+${kn}$, ולכן $\lvert\xi-x\rvert\le${kn}$.`),
      extra("two", H`$${first}\le2$.`, H`נכון, אך החסם $2$ אינו קטן כש־$n$ גדל, ולכן אינו חלק מהשרשרת.`),
      nope("mid", H`$\xi$ היא הנקודה האמצעית בין $x$ ל־$x+${kn}$, ולכן $\lvert\xi-x\rvert=${fracN(k, 2, "n")}$.`, H`משפט לגרנז' מבטיח רק ש־$\xi$ נמצאת בין $x$ ל־$x+${kn}$, לא את מיקומה המדויק.`),
      nope("xi", H`$\xi$ אינה תלויה ב־$x$ וב־$n$.`, H`$\xi$ תלויה ב־$x$ וב־$n$; לכן משתמשים רק בחסם $\lvert\xi-x\rvert\le${kn}$ שאינו תלוי בה.`),
    ]))],
    hints: [H`לכל קישור בשרשרת נדרש נימוק אחד.`],
    solvedNote: H`$\lvert f_n(x)-f(x)\rvert\le${kn}$ לכל $x\in\mathbb R$.`,
  });
  const s5 = verdictStep(rng, "q-5", H`האם $f_n\to f$ במידה שווה בישר $\mathbb{R}$?`, [
    good("uniform", H`כן: $M_n\le${kn}\to0$, ללא תלות ב־$x$.`),
    wrong("unbounded", H`לא, כי הישר אינו חסום.`, H`תחום שאינו חסום אינו מונע התכנסות במידה שווה: כאן החסם $${kn}$ אינו תלוי ב־$x$.`),
    wrong("xi-depends", H`לא, כי $\xi$ תלויה ב־$x$.`, H`התלות של $\xi$ ב־$x$ אינה מפריעה: החסם על $\lvert\xi-x\rvert$ אינו תלוי בה.`),
    wrong("pw-only", H`כן, כי $f_n(x)\to f(x)$ בכל $x$.`, "המסקנה נכונה אך הנימוק חלקי: התכנסות נקודתית אינה מספיקה; נדרש חסם שאינו תלוי ב־$x$."),
  ], [H`מבחן הסופרמום: $M_n=\sup_x\lvert f_n(x)-f(x)\rvert$, ו־$M_n\le${kn}$.`],
  H`$M_n\to0$: ההתכנסות במידה שווה בישר.`,
  H`לפי משפט לגרנז' $f_n(x)=${isSin ? "\\cos\\xi" : "-\\sin\\xi"}$ עבור $\xi$ בין $x$ ל־$x+\frac{${k}}{n}$. לכן $\lvert f_n(x)-f(x)\rvert=${first}\le\lvert\xi-x\rvert\le${kn}$ לכל $x\in\mathbb R$. $M_n\le${kn}\to0$, ולפי מבחן הסופרמום ההתכנסות במידה שווה.`);

  const view = autoView(model, -2 * Math.PI, 2 * Math.PI);
  const plot = plotOf(model, view);
  return {
    book, model,
    exercise: finishExercise({
      id: QUOTIENT_ID, signature: quotientSignature(v), difficulty: quotientDifficulty(v),
      title: "מנת הפרשים של סינוס או קוסינוס",
      statement: statementOf(fn, d, REAL_LINE),
      formula: formulaOf(fn, REAL_LINE), steps: [s1, s2, s3, s4, s5], book, plot,
    }),
  };
}

// ---------------------------------------------------------------------------------------------
// 5b. The siblings that fail: sin(x^2), whose derivative is not uniformly continuous, and n(sin(nx + c) - sin(nx)),
//     which has no pointwise limit at all.
// ---------------------------------------------------------------------------------------------

const SQRT_2PI = Math.sqrt(2 * Math.PI);

function buildSquare(v: SquareVariant, rng: SeededRandom): Built {
  const { k } = v;
  const book = new Book();
  const g = (n: number, x: number) => (n / k) * (Math.sin((x + k / n) ** 2) - Math.sin(x * x));
  const f = (x: number) => 2 * x * Math.cos(x * x);
  const stepL = k === 1 ? "\\frac{1}{n}" : "\\frac{2}{n}";
  const fn = k === 1 ? H`n\left(\sin\left(\left(x+${stepL}\right)^{2}\right)-\sin\left(x^{2}\right)\right)` : H`\frac{n}{2}\left(\sin\left(\left(x+${stepL}\right)^{2}\right)-\sin\left(x^{2}\right)\right)`;
  const d = mkDom(-Infinity, Infinity, false, false);
  const boundL = k === 1 ? "n" : "\\frac{n}{2}";
  const invK = k === 1 ? "1" : "\\frac{1}{2}";
  const twoNOverK = k === 1 ? "2n" : "n";
  const xn = (n: number) => n * SQRT_2PI;
  const model: Model = {
    value: g,
    limit: f,
    domain: d,
    uniform: false,
    gap: 1,
    witness: { x: xn, diff: (n) => Math.abs((n / k) * Math.sin(2 * k * SQRT_2PI + (k * k) / (n * n)) - 2 * n * SQRT_2PI) },
    samples: [-1, 0, 1],
    scanFrom: (n) => -3 * n,
    scanTo: (n) => 3 * n,
  };

  const limitSlot = chipSlot(book, rng, "qs1a", ok("2x\\cos\\left(x^{2}\\right)", nx((n, x) => f(x))), [
    bad("2x\\sin\\left(x^{2}\\right)", nx((n, x) => 2 * x * Math.sin(x * x)), H`$(\sin u)'=\cos u$, ולא $\sin u$.`),
    bad("\\cos\\left(x^{2}\\right)", nx((n, x) => Math.cos(x * x)), H`שכחתם את הנגזרת הפנימית $(x^2)'=2x$.`),
    bad("-2x\\sin\\left(x^{2}\\right)", nx((n, x) => -2 * x * Math.sin(x * x)), H`זו נגזרת של $\cos\left(x^2\right)$, לא של $\sin\left(x^2\right)$.`),
    bad("2\\cos x", nx((n, x) => 2 * Math.cos(x)), H`הנגזרת הפנימית היא $2x$ וההצבה $x^2$ נשארת בתוך ה־$\cos$.`),
  ]);
  const s1 = step({
    id: "qs-1", title: STEP_LIMIT_TITLE,
    prompt: H`נסמן $\varphi(x)=\sin\left(x^2\right)$ ו־$h_n=\frac{${k}}{n}$, ונשכתב את סדרת הפונקציות בצורה $f_n(x)=\frac{\varphi(x+h_n)-\varphi(x)}{h_n}$. היעזרו בכתיבה זו על מנת לחשב את הגבול הנקודתי $f(x)$.`,
    parts: [slotsPart(template("qs-1-lim", [L(H`f(x)=\lim_{n\to\infty}f_n(x)=`), S("qs1a")], [limitSlot]))],
    hints: [H`לפי הגדרת הנגזרת $f=\varphi'$; גזרו בכלל השרשרת.`],
    solvedNote: H`$f(x)=\varphi'(x)=2x\cos\left(x^2\right)$.`,
  });

  const s2 = step({
    id: "qs-2", title: "נקודה נעה",
    prompt: H`נבחר $x_n=n\sqrt{2\pi}$, שעבורה $x_n^2=2\pi n^2$ ולכן $\sin\left(x_n^2\right)=0$ ו־$\cos\left(x_n^2\right)=1$. חשבו את $f(x_n)$, וחסמו את $\lvert f_n(x_n)\rvert$ מלמעלה.`,
    parts: [
      slotsPart(template("qs-2-f", [L(H`f(x_n)=2x_n\cos\left(x_n^2\right)=`), S("qs2a")], [chipSlot(book, rng, "qs2a", ok("2\\sqrt{2\\pi}\\,n", seq((n) => 2 * SQRT_2PI * n)), [
        bad("\\sqrt{2\\pi}\\,n", seq((n) => SQRT_2PI * n), H`שכחתם את הגורם $2$ מהנגזרת הפנימית.`),
        bad("2\\sqrt{2\\pi}", K(2 * SQRT_2PI), H`$x_n=n\sqrt{2\pi}$ תלויה ב־$n$.`),
        bad("0", K(0), H`$\sin\left(x_n^2\right)=0$, אך $f$ כוללת את $\cos\left(x_n^2\right)=1$.`),
      ])])),
      slotsPart(template("qs-2-g", [L(H`\lvert f_n(x_n)\rvert=${boundL}\left\lvert\sin\left(${2 * k}\sqrt{2\pi}+\frac{${k * k}}{n^{2}}\right)\right\rvert\le`), S("qs2b")], [chipSlot(book, rng, "qs2b", ok(boundL, seq((n) => n / k)), [
        bad(`\\frac{n}{${2 * k}}`, seq((n) => n / (2 * k)), H`$\lvert\sin\rvert$ יכול להיות גדול מ־$\frac12$, ולכן זה אינו חסם.`),
        bad(`\\frac{n}{${3 * k}}`, seq((n) => n / (3 * k)), H`$\lvert\sin\rvert$ יכול להיות גדול מ־$\frac13$, ולכן זה אינו חסם.`),
        bad(invK, K(1 / k), H`החסם תלוי ב־$n$: הגורם $${boundL}$ נשאר.`),
      ], seq((n) => (n / k) * Math.abs(Math.sin(2 * k * SQRT_2PI + (k * k) / (n * n)))))])),
    ],
    hints: [H`$\lvert\sin\rvert\le1$.`],
    solvedNote: H`$f(x_n)=2\sqrt{2\pi}\,n$ ו־$\lvert f_n(x_n)\rvert\le ${boundL}$.`,
  });

  const s3 = step({
    id: "qs-3", title: "מה מצדיק את המסקנה",
    prompt: "סמנו את כל הנימוקים הנדרשים כדי להסיק שההתכנסות אינה במידה שווה.",
    parts: [checklistPart("qs-3-why", shuffle(rng, [
      must("gap", H`$\lvert f_n(x_n)-f(x_n)\rvert\ge2\sqrt{2\pi}\,n-${boundL}\ge n$ לכל $n$ (כי $2\sqrt{2\pi}>5$).`),
      must("sup", H`לכן $M_n\ge n\to\infty$, ו־$M_n\not\to0$.`),
      must("inside", H`$x_n=n\sqrt{2\pi}$ שייכת לישר לכל $n$.`),
      extra("lagrange", H`לפי משפט לגרנז', $f_n(x)=\varphi'(\xi)$ עבור $\xi\in\left(x,x+\frac{${k}}{n}\right)$; הנגזרת $\varphi'(x)=2x\cos\left(x^2\right)$ אינה רציפה במידה שווה בישר.`, "נכון, וזו הסיבה לכישלון, אך אין בכך צורך בטיעון עצמו."),
      nope("bdd", H`$\sin\left(x^2\right)$ חסומה, ולכן מנות ההפרשים שלה מתכנסות במידה שווה.`, H`$f_n$ כוללת את הגורם $n$: $\lvert f_n\rvert$ יכולה להגיע ל־$${twoNOverK}$, ו־$f$ אינה חסומה.`),
      nope("pw", H`$f_n(x)\to f(x)$ בכל $x$, ולכן ההתכנסות במידה שווה.`, "התכנסות נקודתית אינה מספיקה."),
    ]))],
    hints: [H`די בנקודה $x_n$ שבה הפער אינו שואף ל־$0$.`],
    solvedNote: H`$M_n\ge n$: ההתכנסות אינה במידה שווה.`,
  });
  const s4 = verdictStep(rng, "qs-4", H`האם $f_n\to f$ במידה שווה בישר $\mathbb{R}$?`, [
    good("not-uniform", H`לא במידה שווה: ב־$x_n=n\sqrt{2\pi}$ הפער הוא לפחות $n$.`),
    wrong("uniform-pw", H`כן, כי $f_n(x)\to f(x)$ בכל $x$.`, "התכנסות נקודתית אינה מספיקה."),
    wrong("uniform-smooth", H`כן, כי $\varphi=\sin\left(x^2\right)$ חלקה וחסומה, וכל מנת הפרשים של פונקציה חלקה מתכנסת במידה שווה.`, H`הטיעון עם משפט לגרנז' עובד רק כש־$\varphi'$ רציפה במידה שווה (כמו $\sin$ ו־$\cos$); כאן $\varphi'=2x\cos\left(x^2\right)$ אינה כזו.`),
  ], [H`אם יש $x_n$ שבה $\lvert f_n(x_n)-f(x_n)\rvert\not\to0$, ההתכנסות אינה במידה שווה.`],
  H`$M_n\to\infty$: ההתכנסות אינה במידה שווה.`,
  H`$f=\varphi'=2x\cos\left(x^2\right)$. עבור $x_n=n\sqrt{2\pi}$: $f(x_n)=2\sqrt{2\pi}\,n$ ו־$\lvert f_n(x_n)\rvert\le ${boundL}$. לכן $\lvert f_n(x_n)-f(x_n)\rvert\ge\left(2\sqrt{2\pi}-${invK}\right)n\ge n$, ו־$M_n\to\infty$: לפי מבחן הסופרמום ההתכנסות אינה במידה שווה.`);

  const view = autoView(model, -3, 3);
  return {
    book, model,
    exercise: finishExercise({
      id: QUOTIENT_ID, signature: quotientSignature(v), difficulty: "advanced",
      title: "מנת הפרשים של סינוס של ריבוע",
      statement: statementOf(fn, d, REAL_LINE), formula: formulaOf(fn, REAL_LINE), steps: [s1, s2, s3, s4], book,
      plot: plotOf(model, view, (n) => (xn(n) <= 3 ? xn(n) : null), "הנקודה הנעה x_n"),
    }),
  };
}

function buildNoLimit(v: NoLimitVariant, rng: SeededRandom): Built {
  const { c, dom } = v;
  const book = new Book();
  const d = dom === "interval" ? mkDom(0, 1, true, true) : dom === "ray" ? mkDom(0, Infinity, true, false) : mkDom(-Infinity, Infinity, false, false);
  const domTex = dom === "interval" ? interval(d, "0", "1") : dom === "ray" ? interval(d, "0", "\\infty") : REAL_LINE;
  const fn = H`n\left(\sin(nx+${c})-\sin(nx)\right)`;
  const sc = `\\sin ${c}`;
  const model: Model = {
    value: (n, x) => n * (Math.sin(n * x + c) - Math.sin(n * x)),
    limit: () => NaN,
    noLimit: { point: 0 },
    domain: d,
    uniform: false,
    samples: [0],
  };

  const s1 = step({
    id: "nl-2", title: STEP_LIMIT_TITLE,
    prompt: H`לאור החישוב, האם לסדרה $f_n$ יש גבול נקודתי בכל נקודה של ה${nounOf(d)} $${domTex}$?`,
    parts: [choicePart("nl-1-exists", "בחרו.", shuffle(rng, [
      good("none", H`לא: ב־$x=0$ מתקיים $f_n(0)=n\sin${c}\to\infty$, ולכן אין גבול נקודתי בכל התחום.`),
      wrong("zero", H`כן, הגבול הוא $0$, כי $\sin(nx+${c})-\sin(nx)$ קטן.`, H`ההפרש חסום, אך הוא מוכפל ב־$n$: ב־$x=0$ הוא $n\sin${c}$ ואינו שואף ל־$0$.`),
      wrong("cos", H`כן, הגבול הוא $\cos x$, כמו במנת הפרשים של $\sin$.`, H`כאן הפונקציה $\sin(nx)$ עצמה תלויה ב־$n$: הצעד $\frac{${c}}{n}$ קטן, אך השיפוע של $\sin(nx)$ הוא מסדר $n$.`),
      wrong("bounded", H`כן, כי $\lvert\sin\rvert\le1$ ולכן הסדרה חסומה.`, H`החסם הוא $2n$ ולא קבוע, ו־$f_n(0)=n\sin${c}$ אינה חסומה.`),
    ]))],
    hints: [H`גבול נקודתי בתחום פירושו גבול סופי בכל נקודה שלו, ובפרט ב־$x=0$.`],
    solvedNote: H`אין גבול נקודתי: ב־$x=0$ הסדרה $f_n(0)=n\sin${c}$ שואפת ל־$\infty$.`,
  });
  const s2 = step({
    id: "nl-1", title: "הסדרה בנקודה $x=0$",
    prompt: H`התחילו בנקודה הפשוטה ביותר: חשבו את $f_n(0)$ ואת הגבול שלה.`,
    parts: [
      slotsPart(template("nl-2-val", [L(H`f_n(0)=n\left(\sin${c}-\sin0\right)=`), S("nl2a")], [chipSlot(book, rng, "nl2a", ok(`n${sc}`, seq((n) => n * Math.sin(c))), [
        bad(sc, K(Math.sin(c)), H`יש להכפיל ב־$n$.`),
        bad(`n\\cos ${c}`, seq((n) => n * Math.cos(c)), H`$\sin(n\cdot0+${c})=\sin${c}$, לא $\cos${c}$.`),
        bad("0", K(0), H`$\sin${c}\ne\sin0$.`),
        bad(`n\\left(${sc}-1\\right)`, seq((n) => n * (Math.sin(c) - 1)), H`$\sin0=0$ ולא $1$.`),
      ])])),
      slotsPart(template("nl-2-lim", [L(H`\lim_{n\to\infty}f_n(0)=`), S("nl2b")], [chipSlot(book, rng, "nl2b", ok("\\infty", K(Infinity)), [
        bad("0", K(0), H`$\sin${c}>0$ קבוע, והוא מוכפל ב־$n$.`),
        bad(sc, K(Math.sin(c)), H`הגורם $n$ גורם לסדרה לגדול ללא גבול.`),
        bad("1", K(1), H`$f_n(0)=n\sin${c}$ גדלה ללא גבול.`),
      ])])),
    ],
    hints: [H`$\sin${c}>0$.`],
    solvedNote: H`$f_n(0)=n\sin${c}\to\infty$.`,
  });
  const s3 = verdictStep(rng, "nl-3", H`האם $f_n$ מתכנסת במידה שווה ${inDom(d, domTex)}?`, [
    good("not-uniform", H`לא: אפילו אין התכנסות נקודתית (ב־$x=0$), והתכנסות במידה שווה גוררת התכנסות נקודתית.`),
    wrong("uniform-bdd", dom === "interval" ? H`כן, כי הקטע חסום.` : H`כן, כי $\lvert f_n(x)\rvert\le2n$ לכל $x$.`, dom === "interval" ? "חסימות התחום אינה מבטיחה התכנסות; כאן אין אפילו גבול נקודתי." : "חסם התלוי ב־$n$ אינו מבטיח התכנסות."),
    wrong("pw-not-unif", H`לא במידה שווה, אך יש התכנסות נקודתית.`, H`ב־$x=0$ אין גבול נקודתי: $f_n(0)\to\infty$.`),
  ], [H`התכנסות במידה שווה גוררת התכנסות נקודתית.`],
  H`אין התכנסות נקודתית, ולכן גם לא במידה שווה.`,
  H`$f_n(0)=n\sin${c}\to\infty$, ולכן ל־$f_n$ אין גבול נקודתי ב־$x=0$. התכנסות במידה שווה (ל־$f$ כלשהי) גוררת התכנסות נקודתית, ולכן ההתכנסות אינה במידה שווה.`);

  const xMax = dom === "interval" ? 1 : dom === "ray" ? 2 : 1;
  const view = autoView(model, dom === "line" ? -1 : 0, xMax);
  return {
    book, model,
    exercise: finishExercise({
      id: QUOTIENT_ID, signature: quotientSignature(v), difficulty: quotientDifficulty(v),
      title: "מנת הפרשים בלי גבול נקודתי",
      statement: H`בדקו האם הסדרה $f_n(x)=${fn}$ מתכנסת נקודתית, והאם במידה שווה, ${inDom(d, domTex)}.`,
      // Compute f_n(0) first, then decide whether a pointwise limit exists: the other order would give the answer away.
      formula: formulaOf(fn, domTex), steps: [s2, s1, s3], book,
      plot: plotOf(model, view, () => 0, "הנקודה x=0, שבה הסדרה אינה חסומה"),
    }),
  };
}

export const DIFF_QUOTIENT = makeFamily<QuotientVariant>({
  id: QUOTIENT_ID,
  grid: quotientGrid,
  kindOf: (v) => (v.kind === "trig" ? `${v.phi}${v.k}` : v.kind),
  difficulty: quotientDifficulty,
  signature: quotientSignature,
  build: (v, rng) => (v.kind === "trig" ? buildTrig(v, rng) : v.kind === "square" ? buildSquare(v, rng) : buildNoLimit(v, rng)),
});

// =============================================================================================
// 6. 1 - cos(x/n): the bound 1 - cos t <= t^2/2 on a bounded interval, a bump at x = n pi on a ray
// =============================================================================================

type OneMinusKind = "sub" | "full" | "tail";
export type OneMinusVariant = { kind: OneMinusKind; a?: number };
const ONEMINUS_ID = "unif-one-minus-cos";

function oneMinusGrid(): OneMinusVariant[] {
  return [
    ...[2, 3, 4].map((a): OneMinusVariant => ({ kind: "sub", a })),
    { kind: "full" },
    ...[1, 2, 3].map((a): OneMinusVariant => ({ kind: "tail", a })),
  ];
}
const oneMinusSignature = (v: OneMinusVariant) => `${v.kind}${v.a !== undefined ? `;a=${v.a}` : ""}`;
const oneMinusDifficulty = (v: OneMinusVariant): PracticeDifficulty => (v.kind === "sub" ? "easy" : "medium");

function buildOneMinus(v: OneMinusVariant, rng: SeededRandom): Built {
  const { kind } = v;
  const a = v.a ?? 0;
  const sub = kind === "sub";
  const book = new Book();
  const fn = H`1-\cos\frac{x}{n}`;
  const d = sub ? mkDom(0, a, true, true) : kind === "full" ? mkDom(0, Infinity, true, false) : mkDom(a, Infinity, true, false);
  const domTex = sub ? interval(d, "0", `${a}`) : kind === "full" ? interval(d, "0", "\\infty") : interval(d, `${a}`, "\\infty");
  const model: Model = {
    value: (n, x) => 1 - Math.cos(x / n),
    limit: () => 0,
    domain: d,
    uniform: sub,
    sup: sub ? (n) => (a / n <= Math.PI ? 1 - Math.cos(a / n) : 2) : () => 2,
    ...(sub
      ? { bound: (n: number) => (a * a) / (2 * n * n) }
      : { gap: 2, witness: { x: (n: number) => n * Math.PI, diff: () => 2 }, scanTo: (n: number) => 4 * Math.PI * n }),
    samples: sub ? [0, a / 2, a] : kind === "full" ? [0, 1, 10, 100] : [a, a + 1, 10],
  };

  // ---- step 1
  const s1 = step({
    id: "om-1", title: STEP_LIMIT_TITLE,
    prompt: H`חשבו את הגבול הנקודתי $f(x)=\lim_{n\to\infty}f_n(x)$ לכל $x$ בתחום.`,
    parts: [slotsPart(template("om-1-lim", [L(H`f(x)=\lim_{n\to\infty}\left(1-\cos\frac{x}{n}\right)=`), S("om1a")], [chipSlot(book, rng, "om1a", ok("0", K(0)), [
      bad("1", K(1), H`$\frac xn\to0$ ו־$\cos0=1$, ולכן $1-\cos0=0$.`),
      bad("\\infty", K(Infinity), H`לכל $x$ קבוע, $\frac xn\to0$ ולכן הביטוי חסום ושואף ל־$0$.`),
      bad("\\tfrac12", K(0.5), H`$1-\cos t\approx\frac{t^2}{2}\to0$ כש־$t\to0$, ולא $\frac12$.`),
    ])]))],
    hints: [H`לכל $x$ קבוע, $\frac xn\to0$, ו־$\cos$ רציפה.`],
    solvedNote: H`$f(x)=0$ בכל נקודה.`,
  });

  const verdictPrompt = H`האם $f_n\to f$ במידה שווה ${inDom(d, domTex)}?`;
  let steps: PracticeStep[];
  if (sub) {
    const P1: [number, number][] = [[3, 2], [10, 2], [30, a], [10, 0.5], [1, a], [2, a]];
    const pts1 = (f: (n: number, x: number) => number) => P1.map(([n, x]) => f(n, x));
    const target1 = pts1((n, x) => 1 - Math.cos(x / n));
    const P2: [number, number][] = [[3, a], [10, a], [30, a], [10, a / 2]];
    const pts2 = (f: (n: number) => number) => P2.map(([n]) => f(n));
    const target2 = P2.map(([n, x]) => (x * x) / (n * n));
    const slotA = chipSlot(book, rng, "om2a", ok("\\frac{x^2}{n^2}", pts1((n, x) => (x * x) / (n * n))), [
      bad("\\frac{x^2}{4n^2}", pts1((n, x) => (x * x) / (4 * n * n)), H`$\sin\xi\le\xi<t$, אך $1-\cos t=t\sin\xi$ גדול מ־$\frac{t^2}{4}$ כש־$t$ קטן.`),
      bad("\\frac{x^2}{8n^2}", pts1((n, x) => (x * x) / (8 * n * n)), H`$1-\cos t$ גדול מ־$\frac{t^2}{8}$ כש־$t$ קטן, ולכן $\frac{t^2}{8}$ אינו חסם.`),
      bad("\\frac{x^4}{24n^4}", pts1((n, x) => x ** 4 / (24 * n ** 4)), H`$\frac{t^4}{24}$ הוא האיבר הבא בפיתוח של $\cos$, ואינו חסם עליון ל־$1-\cos t$.`),
    ], target1);
    const slotB = chipSlot(book, rng, "om2b", ok(H`\frac{${a * a}}{n^{2}}`, pts2((n) => (a * a) / (n * n))), [
      bad(H`\frac{${a}}{n^{2}}`, pts2((n) => a / (n * n)), H`ב־$x=${a}$ הערך $\frac{x^2}{n^2}$ הוא $\frac{${a * a}}{n^2}$, גדול מ־$\frac{${a}}{n^2}$: יש להציב $x^2$.`),
      bad(fracN(a * a, 4, "n^{2}"), pts2((n) => (a * a) / (4 * n * n)), H`$x\le${a}$ נותן $\frac{x^2}{n^2}\le\frac{${a * a}}{n^2}$, לא $${fracN(a * a, 4, "n^{2}")}$.`),
      bad(fracN(a * a, 2, "n^{2}"), pts2((n) => (a * a) / (2 * n * n)), H`$x\le${a}$ נותן $\frac{x^2}{n^2}\le\frac{${a * a}}{n^2}$, לא $${fracN(a * a, 2, "n^{2}")}$.`),
    ], target2);
    const s2 = step({
      id: "om-2", title: "חסם על הפער לפי משפט לגרנז'",
      prompt: H`לפי משפט לגרנז' על $\cos$ בקטע $[0,t]$ קיימת $0<\xi<t$ כך ש־$1-\cos t=t\sin\xi$, ולפי המשפט על $\sin$ מתקיים $\sin\xi\le\xi<t$. לכן $1-\cos t\le t^2$ לכל $t\ge0$. מכיוון ש־$f=0$, הפער הוא $f_n(x)$. השלימו חסם עליון עבורו, ואחר כך חסם שאינו תלוי ב־$x$ עבור $0\le x\le${a}$.`,
      parts: [slotsPart(template("om-2-bound", [L(H`0\le f_n(x)=1-\cos\frac xn\le`), S("om2a"), L(H`\le`), S("om2b")], [slotA, slotB]))],
      hints: [H`הציבו $t=\frac xn$ באי־השוויון $1-\cos t\le t^2$.`, H`$x\le${a}$ ולכן $x^2\le${a * a}$.`],
      solvedNote: H`$0\le f_n(x)\le\frac{x^2}{n^2}\le\frac{${a * a}}{n^2}$ לכל $x\in[0,${a}]$.`,
    });
    const s3 = step({
      id: "om-3", title: "מה מצדיק את המסקנה",
      prompt: "סמנו את כל הנימוקים הנדרשים כדי להסיק שההתכנסות במידה שווה.",
      parts: [checklistPart("om-3-why", shuffle(rng, [
        must("lagrange", H`לפי משפט לגרנז', $1-\cos t=t\sin\xi\le t^2$ לכל $t\ge0$.`),
        must("indep", H`החסם $\frac{${a * a}}{n^2}$ אינו תלוי ב־$x$.`),
        must("squeeze", H`$0\le\lvert f_n-f\rvert\le\frac{${a * a}}{n^2}\to0$ בכל הקטע, ולכן $M_n\to0$ (סנדוויץ').`),
        extra("exact", H`$M_n=1-\cos\frac{${a}}{n}$ כאשר $n\ge\frac{${a}}{\pi}$ (המקסימום בקצה הימני).`, "נכון ומדויק יותר, אך החסם מספיק."),
        nope("x-dep", H`החסם $\frac{x^2}{n^2}$ שואף ל־$0$ לכל $x$, ולכן ההתכנסות במידה שווה.`, H`זהו חסם התלוי ב־$x$: שאיפה ל־$0$ בכל נקודה היא התכנסות נקודתית בלבד. יש להחליף את $x$ בערכו המרבי, $x=${a}$.`),
        nope("small-t", H`$1-\cos t\le t^2$ נכון רק עבור $t$ קטן.`, "אי־השוויון נכון לכל $t\\ge0$."),
      ]))],
      hints: [H`משפט הסנדוויץ' על $M_n$.`],
      solvedNote: H`$M_n\le\frac{${a * a}}{n^2}\to0$.`,
    });
    const s4 = verdictStep(rng, "om-4", verdictPrompt, [
      good("uniform", H`כן: $M_n\le\frac{${a * a}}{n^2}\to0$.`),
      wrong("not-ray", H`לא, כי ב־$[0,\infty)$ ההתכנסות אינה במידה שווה.`, H`סוג ההתכנסות תלוי בתחום: בקטע $[0,${a}]$ מתקיים $\frac xn\le\frac{${a}}{n}\to0$.`),
      wrong("not-pos", H`לא, כי $f_n(x)>0$ בנקודות רבות.`, "חיוביות $f_n$ אינה מספיקה: מה שחשוב הוא אם $M_n\\to0$."),
    ], [H`אם $0\le\lvert f_n-f\rvert\le c_n$ בכל התחום ו־$c_n\to0$, ההתכנסות במידה שווה.`],
    H`$M_n\to0$: ההתכנסות במידה שווה.`,
    H`$f=0$. לפי משפט לגרנז' $1-\cos t=t\sin\xi\le t^2$, ולכן לכל $x\in[0,${a}]$: $0\le1-\cos\frac xn\le\frac{x^2}{n^2}\le\frac{${a * a}}{n^2}$. לכן $M_n\le\frac{${a * a}}{n^2}\to0$, ולפי מבחן הסופרמום ההתכנסות במידה שווה.`);
    steps = [s1, s2, s3, s4];
  } else {
    const s2 = step({
      id: "om-2", title: "נקודה נעה",
      prompt: H`נבחר $x_n=n\pi$. היא שייכת לתחום לכל $n$. חשבו.`,
      parts: [
        slotsPart(template("om-2-arg", [L(H`\frac{x_n}{n}=`), S("om2a")], [chipSlot(book, rng, "om2a", ok("\\pi", K(Math.PI)), [
          bad("1", K(1), H`$\frac{n\pi}{n}=\pi$.`),
          bad("n", seq((n) => n), H`$\frac{n\pi}{n}=\pi$, ללא תלות ב־$n$.`),
          bad("\\tfrac{\\pi}{2}", K(Math.PI / 2), H`$\frac{n\pi}{n}=\pi$ ולא $\frac\pi2$.`),
        ])])),
        slotsPart(template("om-2-val", [L(H`f_n(x_n)=1-\cos\pi=`), S("om2b")], [chipSlot(book, rng, "om2b", ok("2", K(2)), [
          bad("0", K(0), H`$\cos\pi=-1$ ולא $1$, ולכן $1-\cos\pi=2$.`),
          bad("1", K(1), H`$\cos\pi=-1$ ולא $0$.`),
          bad("-1", K(-1), H`$1-\cos\pi=1-(-1)=2$.`),
        ])])),
      ],
      hints: [H`$\cos\pi=-1$.`],
      solvedNote: H`$f_n(x_n)=2$ לכל $n$, ו־$f(x_n)=0$.`,
    });
    const s3 = step({
      id: "om-3", title: "מה מצדיק את המסקנה",
      prompt: "סמנו את כל הנימוקים הנדרשים כדי להסיק שההתכנסות אינה במידה שווה.",
      parts: [checklistPart("om-3-why", shuffle(rng, [
        must("inside", kind === "full" ? H`$x_n=n\pi\ge0$ שייכת לתחום לכל $n$.` : H`$x_n=n\pi\ge\pi>${a}$ שייכת לתחום לכל $n$.`),
        must("gap", H`$\lvert f_n(x_n)-f(x_n)\rvert=2$ לכל $n$ (כי $f=0$).`),
        must("sup", H`לכן $M_n\ge2$ לכל $n$, ו־$M_n\not\to0$.`),
        extra("exact", H`$M_n=2$ בדיוק, כי $1-\cos t\le2$ לכל $t$.`, "נכון, אך אין בכך צורך: די ב־$M_n\\ge2$."),
        nope("fixed", H`$\frac{x_n}{n}=\pi$ אינו משתנה, ולכן $f_n(x_n)\to0$.`, H`$f_n(x_n)=2$ לכל $n$: הוא קבוע ושונה מ־$0$.`),
        nope("outside", H`$x_n\to\infty$, ולכן $x_n$ מחוץ לתחום מ־$n$ מסוים.`, H`התחום $${domTex}$ אינו חסום, ולכן $x_n$ שייכת לו לכל $n$.`),
      ]))],
      hints: [H`די בנקודה אחת $x_n$ לכל $n$ שבה הפער אינו שואף ל־$0$.`],
      solvedNote: H`$M_n\ge2$: ההתכנסות אינה במידה שווה.`,
    });
    const s4 = verdictStep(rng, "om-4", verdictPrompt, [
      good("not-uniform", H`לא במידה שווה: ב־$x_n=n\pi$ הפער הוא $2$ לכל $n$.`),
      wrong("uniform-pw", H`כן, כי $f_n(x)\to0$ בכל נקודה.`, "התכנסות נקודתית אינה מספיקה."),
      wrong("uniform-bound", H`כן, כי $0\le f_n(x)\le\frac{x^2}{2n^2}\to0$ לכל $x$.`, H`החסם תלוי ב־$x$: לכל $n$ הוא גדול בנקודות $x$ גדולות (למשל ב־$x_n=n\pi$ הוא $\frac{\pi^2}{2}$).`),
    ], [H`אם יש $x_n$ בתחום שבה $\lvert f_n(x_n)-f(x_n)\rvert\not\to0$, ההתכנסות אינה במידה שווה.`],
    H`$M_n\ge2$: ההתכנסות אינה במידה שווה.`,
    H`$f=0$. נבחר $x_n=n\pi$ בתחום: $f_n(x_n)=1-\cos\pi=2$ לכל $n$. לכן $M_n\ge2$ (ואף $M_n=2$) ואינה שואפת ל־$0$; לפי מבחן הסופרמום ההתכנסות אינה במידה שווה.`);
    steps = [s1, s2, s3, s4];
  }

  const xMax = sub ? a * 1.15 : 10 * Math.PI;
  const view = autoView(model, 0, xMax);
  const plot = sub
    ? plotOf(model, view, () => a, "הקצה הימני של הקטע")
    : plotOf(model, view, (n) => (n * Math.PI <= xMax ? n * Math.PI : null), "הנקודה הנעה x_n");
  return {
    book, model,
    exercise: finishExercise({
      id: ONEMINUS_ID, signature: oneMinusSignature(v), difficulty: oneMinusDifficulty(v),
      title: sub ? "אחד פחות קוסינוס: קטע חסום" : "אחד פחות קוסינוס: פסגה נעה",
      statement: statementOf(fn, d, domTex), formula: formulaOf(fn, domTex), steps, book, plot,
    }),
  };
}

export const ONE_MINUS_COS = makeFamily<OneMinusVariant>({
  id: ONEMINUS_ID,
  grid: oneMinusGrid,
  kindOf: (v) => v.kind,
  difficulty: oneMinusDifficulty,
  signature: oneMinusSignature,
  build: buildOneMinus,
});

// =============================================================================================
// 7. n((x + 1/n)^p - x^p): the derivative of x^p; uniform on bounded sets, not for p = 3 on unbounded ones
// =============================================================================================

type PolyKind = "line" | "ray" | "sub";
export type PolyVariant = { p: 2 | 3; kind: PolyKind; r?: 1 | 2 | 3 };
const POLY_ID = "unif-poly-quotient";

function polyGrid(): PolyVariant[] {
  const out: PolyVariant[] = [];
  for (const p of [2, 3] as const) {
    out.push({ p, kind: "line" }, { p, kind: "ray" });
    for (const r of [1, 2, 3] as const) out.push({ p, kind: "sub", r });
  }
  return out;
}
const polySignature = (v: PolyVariant) => `p=${v.p};${v.kind}${v.r ? `;r=${v.r}` : ""}`;
const polyDifficulty = (v: PolyVariant): PracticeDifficulty => (v.p === 2 ? "easy" : v.kind === "sub" ? "medium" : "advanced");

function buildPoly(v: PolyVariant, rng: SeededRandom): Built {
  const { p, kind } = v;
  const r = v.r ?? 1;
  const book = new Book();
  const unbounded = kind !== "sub";
  const uniform = p === 2 || kind === "sub";
  const fn = H`n\left(\left(x+\frac{1}{n}\right)^{${p}}-x^{${p}}\right)`;
  const d = kind === "line" ? mkDom(-Infinity, Infinity, false, false) : kind === "ray" ? mkDom(0, Infinity, true, false) : mkDom(0, r, true, true);
  const domTex = kind === "line" ? REAL_LINE : kind === "ray" ? interval(d, "0", "\\infty") : interval(d, "0", `${r}`);
  const diff = (n: number, x: number) => (p === 2 ? 1 / n : (3 * x) / n + 1 / (n * n));
  const model: Model = {
    value: (n, x) => n * ((x + 1 / n) ** p - x ** p),
    limit: (x) => p * x ** (p - 1),
    domain: d,
    uniform,
    ...(p === 2
      ? { sup: (n: number) => 1 / n }
      : kind === "sub"
        ? { sup: (n: number) => diff(n, r) }
        : { gap: 3, witness: { x: (n: number) => n, diff: (n: number) => 3 + 1 / (n * n) } }),
    samples: kind === "line" ? [-2, 0, 1.5] : kind === "ray" ? [0, 1, 2.5] : [0, r / 2, r],
    ...(unbounded ? { scanTo: (n: number) => 2 * n, ...(kind === "line" ? { scanFrom: (n: number) => -2 * n } : {}) } : {}),
  };
  const absOn = kind === "line" && p === 3;
  const absT = (inner: string) => (absOn ? `\\left\\lvert${inner}\\right\\rvert` : inner);

  // ---- step 1: expand and take the limit
  const expansion = p === 2
    ? chipSlot(book, rng, "po1a", ok("2x+\\frac{1}{n}", nx((n, x) => 2 * x + 1 / n)), [
      bad("2x+\\frac{1}{n^{2}}", nx((n, x) => 2 * x + 1 / (n * n)), H`הכפלה ב־$n$ של $\frac{1}{n^2}$ נותנת $\frac1n$, לא $\frac1{n^2}$.`),
      bad("2x", nx((n, x) => 2 * x), H`שכחתם את האיבר $\frac1n$ שמתקבל מ־$n\cdot\frac{1}{n^2}$.`),
      bad("2x+n", nx((n, x) => 2 * x + n), H`$\left(\frac1n\right)^2=\frac1{n^2}$, ולא $n$.`),
    ])
    : chipSlot(book, rng, "po1a", ok("3x^{2}+\\frac{3x}{n}+\\frac{1}{n^{2}}", nx((n, x) => 3 * x * x + (3 * x) / n + 1 / (n * n))), [
      bad("3x^{2}+\\frac{3x}{n}", nx((n, x) => 3 * x * x + (3 * x) / n), H`שכחתם את האיבר האחרון: $n\cdot\frac{1}{n^3}=\frac{1}{n^2}$.`),
      bad("\\frac{3x^{2}}{n}+\\frac{3x}{n^{2}}+\\frac{1}{n^{3}}", nx((n, x) => (3 * x * x) / n + (3 * x) / (n * n) + 1 / n ** 3), "שכחתם להכפיל ב־$n$ את כל האיברים."),
      bad("3x^{2}+3nx+n^{2}", nx((n, x) => 3 * x * x + 3 * n * x + n * n), H`הצעד הוא $h=\frac{1}{n}$ ולא $n$.`),
    ]);
  const limitSlot = chipSlot(book, rng, "po1b", ok(p === 2 ? "2x" : "3x^{2}", nx((n, x) => p * x ** (p - 1))), p === 2
    ? [
      bad("x^{2}", nx((n, x) => x * x), H`זו הפונקציה $x^2$ עצמה, לא נגזרתה.`),
      bad("2", nx(() => 2), H`הגבול תלוי ב־$x$: הוא $(x^2)'=2x$.`),
      bad("x", nx((n, x) => x), H`$(x^2)'=2x$, לא $x$.`),
    ]
    : [
      bad("x^{3}", nx((n, x) => x ** 3), H`זו הפונקציה $x^3$ עצמה, לא נגזרתה.`),
      bad("3x", nx((n, x) => 3 * x), H`$(x^3)'=3x^2$, לא $3x$.`),
      bad("3", nx(() => 3), H`הגבול תלוי ב־$x$: הוא $(x^3)'=3x^2$.`),
    ]);
  const s1 = step({
    id: "po-1", title: "פיתוח והגבול הנקודתי",
    prompt: H`נסמן $h_n=\frac{1}{n}$ ונשכתב את סדרת הפונקציות בצורה $f_n(x)=\frac{(x+h_n)^{${p}}-x^{${p}}}{h_n}$. פתחו את הסוגריים, והיעזרו בכתיבה זו על מנת לחשב את הגבול הנקודתי $f(x)$.`,
    parts: [
      slotsPart(template("po-1-exp", [L(H`f_n(x)=`), S("po1a")], [expansion])),
      slotsPart(template("po-1-lim", [L(H`f(x)=\lim_{n\to\infty}f_n(x)=`), S("po1b")], [limitSlot])),
    ],
    hints: [H`נוסחת הבינום: $(x+h)^{${p}}=${p === 2 ? "x^2+2xh+h^2" : "x^3+3x^2h+3xh^2+h^3"}$.`],
    solvedNote: H`$f_n(x)=${p === 2 ? "2x+\\frac1n" : "3x^2+\\frac{3x}{n}+\\frac{1}{n^2}"}\to${p === 2 ? "2x" : "3x^2"}=(x^{${p}})'$.`,
  });

  // ---- step 2: the difference
  const diffInner = p === 2 ? "\\frac{1}{n}" : "\\frac{3x}{n}+\\frac{1}{n^{2}}";
  const diffSig = nx((n, x) => Math.abs(diff(n, x)));
  const diffSlot = chipSlot(book, rng, "po2a", ok(absT(diffInner), diffSig), p === 2
    ? [
      bad("\\frac{1}{n^{2}}", nx((n) => 1 / (n * n)), H`$f_n(x)-f(x)=\frac1n$: האיבר הנותר הוא $\frac1n$.`),
      bad("\\frac{2x}{n}", nx((n, x) => Math.abs((2 * x) / n)), H`הפער אינו תלוי ב־$x$: $f_n(x)-2x=\frac1n$.`),
      bad("0", nx(() => 0), H`$f_n\ne f$: ההפרש הוא $\frac1n$, ורק הגבול שלו הוא $0$.`),
      bad("n", nx((n) => n), H`ההפרש הוא $\frac1n$ ולא $n$.`),
    ]
    : [
      bad(absT("\\frac{3x}{n}"), nx((n, x) => Math.abs((3 * x) / n)), H`שכחתם את $\frac{1}{n^2}$.`),
      bad("\\frac{3}{n}+\\frac{1}{n^{2}}", nx((n) => 3 / n + 1 / (n * n)), H`האיבר $\frac{3x}{n}$ תלוי ב־$x$.`),
      bad(absT("\\frac{3x}{n}+\\frac{1}{n}"), nx((n, x) => Math.abs((3 * x) / n + 1 / n)), H`האיבר האחרון הוא $\frac{1}{n^2}$ ולא $\frac1n$.`),
      bad(absT("\\frac{3x^{2}}{n}+\\frac{1}{n^{2}}"), nx((n, x) => Math.abs((3 * x * x) / n + 1 / (n * n))), H`$f_n(x)-3x^2=\frac{3x}{n}+\frac{1}{n^2}$.`),
    ]);
  const s2 = step({
    id: "po-2", title: "הפער",
    prompt: H`חשבו את $\lvert f_n(x)-f(x)\rvert$${absOn ? "" : H` (בתחום $x\ge0$, ולכן אין צורך בערך מוחלט)`}.`,
    parts: [slotsPart(template("po-2-diff", [L(H`\lvert f_n(x)-f(x)\rvert=`), S("po2a")], [diffSlot]))],
    hints: [H`החסירו את $f(x)=${p === 2 ? "2x" : "3x^2"}$ מהפיתוח של $f_n(x)$.`],
    solvedNote: H`$f_n(x)-f(x)=${p === 2 ? "\\frac1n" : "\\frac{3x}{n}+\\frac{1}{n^2}"}$.`,
  });

  // ---- step 3: the supremum, or a moving point
  let s3: PracticeStep;
  if (uniform) {
    const sup = p === 2 ? "\\frac{1}{n}" : `\\frac{${3 * r}}{n}+\\frac{1}{n^{2}}`;
    const supNum = (n: number) => diff(n, p === 2 ? 0 : r);
    const mnWrongs: Chip[] = p === 2
      ? [
        bad("\\infty", seq(() => Infinity), unbounded ? H`הפער אינו תלוי ב־$x$, ולכן הוא חסום על ידי $\frac1n$ גם בתחום שאינו חסום.` : H`הפער קבוע ב־$x$ ושווה ל־$\frac1n$.`),
        bad("\\frac{1}{n^{2}}", seq((n) => 1 / (n * n)), H`הפער הוא $\frac1n$ ולא $\frac1{n^2}$.`),
        bad("0", K(0), H`$0$ הוא הגבול של $M_n$, לא ערכו עבור $n$ נתון.`),
        bad("n", seq((n) => n), H`הפער הוא $\frac1n$.`),
      ]
      : [
        bad(`\\frac{${3 * r}}{n}`, seq((n) => (3 * r) / n), H`שכחתם את האיבר $\frac{1}{n^2}$.`),
        bad(`\\frac{${r}}{n}+\\frac{1}{n^{2}}`, seq((n) => r / n + 1 / (n * n)), H`ב־$x=${r}$ האיבר $\frac{3x}{n}$ הוא $\frac{${3 * r}}{n}$.`),
        bad(`${3 * r}+\\frac{1}{n^{2}}`, seq((n) => 3 * r + 1 / (n * n)), H`האיבר $\frac{3x}{n}$ מחולק ב־$n$.`),
        bad(`\\frac{${3 * r * r}}{n}+\\frac{1}{n^{2}}`, seq((n) => (3 * r * r) / n + 1 / (n * n)), H`ב־$x=${r}$ האיבר $\frac{3x}{n}$ הוא $\frac{${3 * r}}{n}$ ולא $\frac{${3 * r * r}}{n}$.`),
        bad("\\frac{3}{n}+\\frac{1}{n^{2}}", seq((n) => 3 / n + 1 / (n * n)), H`הציבו את הקצה הימני $x=${r}$ של הקטע.`),
      ];
    s3 = step({
      id: "po-3", title: H`חישוב $M_n$ וגבולו`,
      prompt: p === 2
        ? H`הפער אינו תלוי ב־$x$${unbounded ? ", אף שהתחום אינו חסום" : ""}. כתבו את $M_n=\sup_{x}\lvert f_n(x)-f(x)\rvert$ וחשבו את גבולו.`
        : H`בקטע $[0,${r}]$ הביטוי $\frac{3x}{n}+\frac{1}{n^2}$ עולה ב־$x$, ולכן $M_n$ הוא ערכו בקצה הימני $x=${r}$. כתבו את $M_n$ וחשבו את גבולו.`,
      parts: [slotsPart(template("po-3-mn", [L(H`M_n=`), S("po3a"), L(H`\xrightarrow[n\to\infty]{}`), S("po3b")], [
        chipSlot(book, rng, "po3a", ok(sup, seq(supNum)), mnWrongs),
        chipSlot(book, rng, "po3b", ok("0", K(0)), [
          bad("\\infty", K(Infinity), H`$M_n=${sup}$ שואף ל־$0$ כי כל איבר בו שואף ל־$0$.`),
          bad("1", K(1), H`כל האיברים ב־$M_n$ מכילים את $\frac1n$ או את $\frac1{n^2}$, ולכן שואפים ל־$0$.`),
          bad("\\tfrac12", K(0.5), H`כל האיברים ב־$M_n$ שואפים ל־$0$.`),
        ]),
      ]))],
      hints: [p === 2 ? H`אין תלות ב־$x$: $M_n=\frac1n$.` : H`הציבו $x=${r}$ ב־$\frac{3x}{n}+\frac{1}{n^2}$.`],
      solvedNote: H`$M_n=${sup}\to0$.`,
    });
  } else {
    s3 = step({
      id: "po-3", title: "נקודה נעה",
      prompt: H`הפער $\frac{3x}{n}+\frac1{n^2}$ גדל עם $x$. נבחר $x_n=n$, השייכת לתחום לכל $n$. חשבו את הפער ב־$x_n$ ואת גבולו.`,
      parts: [
        slotsPart(template("po-3-val", [L(H`\lvert f_n(x_n)-f(x_n)\rvert=`), S("po3a")], [chipSlot(book, rng, "po3a", ok("3+\\frac{1}{n^{2}}", seq((n) => 3 + 1 / (n * n))), [
          bad("\\frac{3}{n}+\\frac{1}{n^{2}}", seq((n) => 3 / n + 1 / (n * n)), H`הצבתם $x=1$; כאן $x_n=n$, ולכן $\frac{3x_n}{n}=3$.`),
          bad("3n+\\frac{1}{n^{2}}", seq((n) => 3 * n + 1 / (n * n)), H`$\frac{3x_n}{n}=\frac{3n}{n}=3$ ולא $3n$.`),
          bad("3+\\frac{1}{n}", seq((n) => 3 + 1 / n), H`האיבר האחרון הוא $\frac{1}{n^2}$ ולא $\frac1n$.`),
        ])])),
        slotsPart(template("po-3-lim", [L(H`\lim_{n\to\infty}\lvert f_n(x_n)-f(x_n)\rvert=`), S("po3b")], [chipSlot(book, rng, "po3b", ok("3", K(3)), [
          bad("0", K(0), H`הפער ב־$x_n$ הוא $3+\frac1{n^2}$, והוא אינו שואף ל־$0$.`),
          bad("\\infty", K(Infinity), H`$\frac{3x_n}{n}=3$ קבוע, ו־$\frac{1}{n^2}\to0$.`),
          bad("1", K(1), H`$\frac{3x_n}{n}=3$, ולא $1$.`),
        ])])),
      ],
      hints: [H`$x_n=n$ נותנת $\frac{3x_n}{n}=3$.`],
      solvedNote: H`הפער ב־$x_n=n$ הוא $3+\frac1{n^2}\to3$, ולכן $M_n\ge3$.`,
    });
  }

  // ---- step 4: verdict
  const verdictPrompt = H`האם $f_n\to f$ במידה שווה ${inDom(d, domTex)}?`;
  let s4: PracticeStep;
  if (p === 2) {
    s4 = verdictStep(rng, "po-4", verdictPrompt, [
      good("uniform", H`כן: $M_n=\frac1n\to0$.`),
      unbounded
        ? wrong("unbounded", H`לא, כי התחום אינו חסום ו־$f(x)=2x$ אינה חסומה.`, H`תחום או גבול לא חסומים אינם מונעים התכנסות במידה שווה: כאן הפער $\frac1n$ אינו תלוי ב־$x$.`)
        : wrong("not-ray", H`לא, כי בישר $\mathbb{R}$ ההתכנסות אינה במידה שווה.`, H`גם בישר $\mathbb{R}$ ההתכנסות במידה שווה, כי $M_n=\frac1n$ בכל תחום.`),
      wrong("not-equal", H`לא, כי $f_n(x)\ne f(x)$ לכל $n$ ו־$x$.`, "אין צורך ש־$f_n=f$: מספיק ש־$M_n\\to0$."),
    ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    H`$M_n\to0$: ההתכנסות במידה שווה.`,
    H`$f_n(x)-f(x)=\frac1n$ לכל $x$, ולכן $M_n=\frac1n\to0$ ${unbounded ? "(גם בתחום שאינו חסום)" : ""}. לפי מבחן הסופרמום ההתכנסות במידה שווה.`);
  } else if (kind === "sub") {
    s4 = verdictStep(rng, "po-4", verdictPrompt, [
      good("uniform", H`כן: $M_n=\frac{${3 * r}}{n}+\frac{1}{n^2}\to0$.`),
      wrong("depends", H`לא, כי הפער $\frac{3x}{n}+\frac1{n^2}$ תלוי ב־$x$.`, H`תלות ב־$x$ אינה מפריעה כל עוד יש חסם שאינו תלוי ב־$x$ ושואף ל־$0$: כאן $x\le${r}$.`),
      wrong("ray", H`לא, כי ב־$[0,\infty)$ ההתכנסות אינה במידה שווה.`, H`סוג ההתכנסות תלוי בתחום: בקטע $[0,${r}]$ מתקיים $x\le${r}$.`),
    ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    H`$M_n\to0$: ההתכנסות במידה שווה.`,
    H`$f_n(x)-f(x)=\frac{3x}{n}+\frac{1}{n^2}$ עולה ב־$x\in[0,${r}]$, ולכן $M_n=\frac{${3 * r}}{n}+\frac{1}{n^2}\to0$. לפי מבחן הסופרמום ההתכנסות במידה שווה.`);
  } else {
    s4 = verdictStep(rng, "po-4", verdictPrompt, [
      good("not-uniform", H`לא במידה שווה: ב־$x_n=n$ הפער הוא $3+\frac1{n^2}\to3$.`),
      wrong("uniform-pw", H`כן, כי לכל $x$ קבוע $\frac{3x}{n}+\frac1{n^2}\to0$.`, "התכנסות נקודתית אינה מספיקה: נקודה שמתרחקת עם $n$ נותנת פער גדול."),
      wrong("uniform-cont", H`כן, כי $f$ רציפה וכל $f_n$ רציפה.`, "רציפות הגבול היא תנאי הכרחי בלבד; כאן $M_n\\not\\to0$."),
    ], [H`אם יש $x_n$ בתחום שבה הפער אינו שואף ל־$0$, ההתכנסות אינה במידה שווה.`],
    H`$M_n\ge3$: ההתכנסות אינה במידה שווה.`,
    H`$f_n(x)-f(x)=\frac{3x}{n}+\frac1{n^2}$. עבור $x_n=n$ בתחום הפער הוא $3+\frac1{n^2}$, ולכן $M_n\ge3$ ואינה שואפת ל־$0$. לפי מבחן הסופרמום ההתכנסות אינה במידה שווה (אף שהיא במידה שווה על כל תחום חסום).`);
  }

  const xMax = kind === "sub" ? r * 1.15 : 3;
  const view = autoView(model, kind === "line" ? -3 : 0, xMax);
  const plot = uniform
    ? plotOf(model, view, kind === "sub" ? () => r : undefined, kind === "sub" ? "הקצה הימני של הקטע" : undefined)
    : plotOf(model, view, (n) => (n <= xMax ? n : null), "הנקודה הנעה x_n=n");
  return {
    book, model,
    exercise: finishExercise({
      id: POLY_ID, signature: polySignature(v), difficulty: polyDifficulty(v),
      title: p === 2 ? "מנת הפרשים של x בריבוע" : "מנת הפרשים של x בשלישית",
      statement: statementOf(fn, d, domTex), formula: formulaOf(fn, domTex), steps: [s1, s2, s3, s4], book, plot,
    }),
  };
}

export const POLY_QUOTIENT = makeFamily<PolyVariant>({
  id: POLY_ID,
  grid: polyGrid,
  kindOf: (v) => `${v.p}${v.kind}`,
  difficulty: polyDifficulty,
  signature: polySignature,
  build: buildPoly,
});

// =============================================================================================
// 8. arctan(n x): a moving point x_n = 1/n near the jump at 0, or a monotone difference away from it
// =============================================================================================

type AtanKind = "ray0" | "sub0" | "tail";
export type AtanVariant = { kind: AtanKind; a?: Q };
const ATAN_ID = "unif-arctan";

function atanGrid(): AtanVariant[] {
  return [
    { kind: "ray0" },
    ...[Qn(1), Qn(2)].map((a): AtanVariant => ({ kind: "sub0", a })),
    ...[Qn(1, 2), Qn(1), Qn(2)].map((a): AtanVariant => ({ kind: "tail", a })),
  ];
}
const atanSignature = (v: AtanVariant) => `${v.kind}${v.a ? `;a=${qKey(v.a)}` : ""}`;
const atanDifficulty = (v: AtanVariant): PracticeDifficulty => (v.kind === "tail" ? "easy" : "medium");

/** "n", "2n" or "\frac{n}{2}": the product a n with the integer first. */
const timesN = (a: Q) => (a.d === 1 ? co(a.n, "n") : `\\frac{n}{${a.d}}`);

function buildAtan(v: AtanVariant, rng: SeededRandom): Built {
  const { kind } = v;
  const a = v.a ?? Qn(1);
  const tail = kind === "tail";
  const book = new Book();
  const halfPi = Math.PI / 2;
  const fn = "\\arctan(nx)";
  const d = kind === "ray0" ? mkDom(0, Infinity, true, false) : kind === "sub0" ? mkDom(0, qv(a), true, true) : mkDom(qv(a), Infinity, true, false);
  const domTex = kind === "ray0" ? interval(d, "0", "\\infty") : kind === "sub0" ? interval(d, "0", qL(a)) : interval(d, qL(a), "\\infty");
  const aL = qL(a);
  const na = timesN(a);
  const model: Model = {
    value: (n, x) => Math.atan(n * x),
    limit: (x) => (x === 0 ? 0 : halfPi),
    domain: d,
    uniform: tail,
    sup: tail ? (n) => halfPi - Math.atan(n * qv(a)) : () => halfPi,
    ...(tail ? {} : { gap: halfPi, witness: { x: (n: number) => 1 / n, diff: () => Math.PI / 4 } }),
    samples: kind === "ray0" ? [0, 0.5, 3] : kind === "sub0" ? [0, qv(a) / 2, qv(a)] : [qv(a), 2 * qv(a), 5],
    ...(kind === "sub0" ? {} : { scanTo: () => (tail ? qv(a) + 20 : 20) }),
  };

  // ---- step 1
  const limitPos = (id: string) => chipSlot(book, rng, id, ok("\\tfrac{\\pi}{2}", K(halfPi)), [
    bad("0", K(0), H`לכל $x>0$ קבוע, $nx\to\infty$ ו־$\arctan t\to\frac\pi2$ כש־$t\to\infty$.`),
    bad("\\pi", K(Math.PI), H`$\arctan t\to\frac\pi2$ כש־$t\to\infty$, ולא $\pi$.`),
    bad("\\tfrac{\\pi}{4}", K(Math.PI / 4), H`$\frac\pi4=\arctan1$; כאן $nx\to\infty$.`),
    bad("1", K(1), H`$\arctan t\to\frac\pi2$ כש־$t\to\infty$.`),
  ]);
  const s1Parts = tail
    ? [slotsPart(template("at-1-pos", [L(H`x\ge${aL}:\quad f(x)=`), S("at1b")], [limitPos("at1b")]))]
    : [
      slotsPart(template("at-1-zero", [L(H`x=0:\quad f(0)=`), S("at1a")], [chipSlot(book, rng, "at1a", ok("0", K(0)), [
        bad("\\tfrac{\\pi}{2}", K(halfPi), H`$f_n(0)=\arctan0=0$ לכל $n$.`),
        bad("\\tfrac{\\pi}{4}", K(Math.PI / 4), H`$f_n(0)=\arctan0=0$ לכל $n$.`),
        bad("1", K(1), H`$f_n(0)=\arctan0=0$ לכל $n$.`),
      ])])),
      slotsPart(template("at-1-pos", [L(H`x>0:\quad f(x)=`), S("at1b")], [limitPos("at1b")])),
    ];
  const s1 = step({
    id: "at-1", title: STEP_LIMIT_TITLE,
    prompt: H`חשבו את הגבול הנקודתי $f(x)=\lim_{n\to\infty}f_n(x)$ ${tail ? "בכל נקודה של הקרן" : "ב־$x=0$ ובשאר התחום"}.`,
    parts: s1Parts,
    hints: [H`$\arctan t\to\frac\pi2$ כש־$t\to\infty$.`],
    solvedNote: tail ? H`$f(x)=\frac\pi2$ בכל נקודה של הקרן.` : H`$f(0)=0$ ו־$f(x)=\frac\pi2$ ל־$x>0$.`,
  });

  const verdictPrompt = H`האם $f_n\to f$ במידה שווה ${inDom(d, domTex)}?`;
  let steps: PracticeStep[];
  if (!tail) {
    const s2 = step({
      id: "at-2", title: "נקודה נעה",
      prompt: H`נבחר $x_n=\frac{1}{n}$. היא שייכת לתחום ו־$x_n>0$. חשבו.`,
      parts: [
        slotsPart(template("at-2-arg", [L(H`nx_n=`), S("at2a")], [chipSlot(book, rng, "at2a", ok("1", K(1)), [
          bad("n", seq((n) => n), H`$nx_n=n\cdot\frac1n=1$.`),
          bad("\\frac{1}{n}", seq((n) => 1 / n), H`$nx_n=n\cdot\frac1n=1$.`),
          bad("0", K(0), H`$nx_n=n\cdot\frac1n=1$, ולא $0$.`),
        ])])),
        slotsPart(template("at-2-val", [L(H`f_n(x_n)=\arctan(1)=`), S("at2b")], [chipSlot(book, rng, "at2b", ok("\\tfrac{\\pi}{4}", K(Math.PI / 4)), [
          bad("\\tfrac{\\pi}{2}", K(halfPi), H`$\arctan1=\frac\pi4$; $\frac\pi2$ הוא הגבול ב־$+\infty$.`),
          bad("1", K(1), H`$\arctan1=\frac\pi4$ (זווית שהטנגנס שלה $1$).`),
          bad("\\tfrac{\\pi}{3}", K(Math.PI / 3), H`$\tan\frac\pi3=\sqrt3$, ואילו $\tan\frac\pi4=1$.`),
        ])])),
        slotsPart(template("at-2-lim", [L(H`f(x_n)=`), S("at2c")], [chipSlot(book, rng, "at2c", ok("\\tfrac{\\pi}{2}", K(halfPi)), [
          bad("0", K(0), H`$f(0)=0$ רק ב־$x=0$, ו־$x_n>0$.`),
          bad("\\tfrac{\\pi}{4}", K(Math.PI / 4), H`זה $f_n(x_n)$, לא $f(x_n)$.`),
          bad("1", K(1), H`$f(x)=\frac\pi2$ לכל $x>0$.`),
        ])])),
      ],
      hints: [H`$f_n(x_n)=\arctan\left(n\cdot\frac1n\right)$.`],
      solvedNote: H`$f_n(x_n)=\frac\pi4$ ו־$f(x_n)=\frac\pi2$, ולכן הפער הוא $\frac\pi4$ לכל $n$.`,
    });
    const s3 = step({
      id: "at-3", title: "מה מצדיק את המסקנה",
      prompt: "סמנו את כל הנימוקים הנדרשים כדי להסיק שההתכנסות אינה במידה שווה.",
      parts: [checklistPart("at-3-why", shuffle(rng, [
        must("inside", H`$x_n=\frac1n$ שייכת לתחום ו־$x_n>0$ לכל $n$.`),
        must("gap", H`$\lvert f_n(x_n)-f(x_n)\rvert=\frac\pi2-\frac\pi4=\frac\pi4$ לכל $n$.`),
        must("sup", H`לכן $M_n\ge\frac\pi4$ לכל $n$, ו־$M_n\not\to0$.`),
        extra("cont", H`$f_n$ רציפות והגבול $f$ אינו רציף ב־$x=0$.`, "נכון: משפט הרציפות נותן מסקנה זהה, אך כאן בחרנו בנקודה נעה."),
        nope("limit-pt", H`$x_n\to0$ ו־$f(0)=0$, ולכן $f_n(x_n)\to0$.`, H`$f_n(x_n)=\frac\pi4$ לכל $n$ ואינה שואפת ל־$0$: הצבת גבול הנקודה דורשת רציפות שאינה נתונה.`),
        nope("domain", H`$f_n(x_n)=\arctan1$ אינו תלוי ב־$n$, ולכן אין צורך לבדוק ש־$x_n$ בתחום.`, "נקודה שאינה בתחום אינה מעידה על הסופרמום בתחום."),
      ]))],
      hints: [H`די בנקודה $x_n$ בתחום שבה הפער אינו שואף ל־$0$.`],
      solvedNote: H`$M_n\ge\frac\pi4$: ההתכנסות אינה במידה שווה.`,
    });
    const s4 = verdictStep(rng, "at-4", verdictPrompt, [
      good("not-uniform", H`לא במידה שווה: ב־$x_n=\frac1n$ הפער הוא $\frac\pi4$ לכל $n$.`),
      wrong("uniform-pw", H`כן, כי $\arctan(nx)\to\frac\pi2$ בכל נקודה $x>0$.`, "התכנסות נקודתית אינה מספיקה."),
      wrong("uniform-bdd", H`כן, כי $\lvert f_n\rvert\le\frac\pi2$ לכל $n$.`, "חסימות של הסדרה אינה מבטיחה התכנסות במידה שווה."),
    ], [H`אם יש $x_n$ בתחום שבה $\lvert f_n(x_n)-f(x_n)\rvert\not\to0$, ההתכנסות אינה במידה שווה.`],
    H`$M_n\ge\frac\pi4$: ההתכנסות אינה במידה שווה.`,
    H`נבחר $x_n=\frac1n$ בתחום. אז $f_n(x_n)=\arctan1=\frac\pi4$ ו־$f(x_n)=\frac\pi2$ (כי $x_n>0$). לכן $M_n\ge\frac\pi4$ לכל $n$, ולפי מבחן הסופרמום ההתכנסות אינה במידה שווה.`);
    steps = [s1, s2, s3, s4];
  } else {
    const s2 = step({
      id: "at-2", title: "היכן המקסימום",
      prompt: H`סמנו את הנימוקים הנדרשים לכך שהפער $\lvert f_n-f\rvert$ מקבל את המקסימום בקצה השמאלי $x=${aL}$.`,
      parts: [checklistPart("at-2-why", shuffle(rng, [
        must("below", H`$\arctan(nx)<\frac\pi2$, ולכן $\lvert f_n-f\rvert=\frac\pi2-\arctan(nx)$.`),
        must("mono", H`לפי משפט לגרנז', $\left(\arctan(nx)\right)'=\frac{n}{1+n^2x^2}>0$, ולכן $\frac\pi2-\arctan(nx)$ יורד ב־$x$.`),
        must("endpoint", H`הקצה השמאלי $x=${aL}$ שייך לקרן.`),
        extra("inverse", H`$\frac\pi2-\arctan t=\arctan\frac1t$ ל־$t>0$, ולכן, לפי משפט לגרנז' ($\arctan u\le u$), $M_n=\arctan${invNa(a)}\le${invNa(a)}$.`, "נכון, ומאפשר חסם חלופי; כאן הסופרמום מחושב במדויק."),
        nope("inc", H`הפער $\frac\pi2-\arctan(nx)$ עולה ב־$x$, ולכן המקסימום באינסוף.`, H`$\arctan(nx)$ עולה ב־$x$, ולכן הפער ממנו יורד.`),
        nope("crit", H`$f_n'(x)=\frac{n}{1+n^2x^2}=0$ בנקודה כלשהי בקרן.`, H`$f_n'(x)>0$ לכל $x$: אין נקודה חשודה לקיצון.`),
      ]))],
      hints: [H`הפער הוא $\frac\pi2-\arctan(nx)$: מה קורה לו כש־$x$ גדל?`],
      solvedNote: H`הפער יורד ב־$x$, ולכן $M_n$ הוא הערך ב־$x=${aL}$.`,
    });
    const mnSlot = chipSlot(book, rng, "at3a", ok(`\\frac{\\pi}{2}-\\arctan\\left(${na}\\right)`, seq((n) => halfPi - Math.atan(n * qv(a)))), [
      bad(`\\arctan\\left(${na}\\right)`, seq((n) => Math.atan(n * qv(a))), H`זה $f_n(${aL})$, לא הפער מ־$\frac\pi2$.`),
      bad(`\\frac{\\pi}{2}-\\arctan ${aL}`, K(halfPi - Math.atan(qv(a))), H`זה הפער עבור $n=1$ בלבד.`),
      bad("\\frac{\\pi}{2}", K(halfPi), H`זה ערך הגבול $f$, לא הפער ממנו.`),
      bad(`${invNa(a)}`, seq((n) => 1 / (n * qv(a))), H`זה חסם עליון ($\frac\pi2-\arctan t=\arctan\frac1t\le\frac1t$), לא הערך המדויק.`),
    ]);
    const limSlot = chipSlot(book, rng, "at3b", ok("0", K(0)), [
      bad("\\tfrac{\\pi}{2}", K(halfPi), H`$${na}\to\infty$, ולכן $\arctan\left(${na}\right)\to\frac\pi2$ והפער שואף ל־$0$.`),
      bad("\\tfrac{\\pi}{4}", K(Math.PI / 4), H`$\arctan(t)\to\frac\pi2$ כש־$t\to\infty$, ולכן הפער שואף ל־$0$.`),
      bad("\\infty", K(Infinity), H`הפער חסום על ידי $\frac\pi2$.`),
    ]);
    const s3 = step({
      id: "at-3", title: H`חישוב $M_n$ וגבולו`,
      prompt: H`כתבו את $M_n$ וחשבו את גבולו.`,
      parts: [slotsPart(template("at-3-mn", [L(H`M_n=`), S("at3a"), L(H`\xrightarrow[n\to\infty]{}`), S("at3b")], [mnSlot, limSlot]))],
      hints: [H`הציבו $x=${aL}$ בפער. כש־$n\to\infty$, $${na}\to\infty$.`],
      solvedNote: H`$M_n=\frac\pi2-\arctan\left(${na}\right)\to0$.`,
    });
    const s4 = verdictStep(rng, "at-4", verdictPrompt, [
      good("uniform", H`כן: $M_n=\frac\pi2-\arctan\left(${na}\right)\to0$.`),
      wrong("not-unbounded", H`לא, כי הקרן אינה חסומה.`, H`תחום שאינו חסום אינו מונע התכנסות במידה שווה: כאן $M_n\to0$.`),
      wrong("not-jump", H`לא, כי הגבול $f$ אינו רציף ב־$x=0$.`, H`הנקודה $x=0$ אינה שייכת לקרן $[${aL},\infty)$, ושם $f\equiv\frac\pi2$ רציפה.`),
    ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    H`$M_n\to0$: ההתכנסות במידה שווה.`,
    H`$f=\frac\pi2$ בקרן. הפער $\frac\pi2-\arctan(nx)$ יורד ב־$x$, ולכן $M_n=\frac\pi2-\arctan\left(${na}\right)\to0$. לפי מבחן הסופרמום ההתכנסות במידה שווה.`);
    steps = [s1, s2, s3, s4];
  }

  const xMax = kind === "sub0" ? qv(a) * 1.15 : tail ? qv(a) + 3 : 3;
  const view = autoView(model, 0, xMax);
  const plot = tail ? plotOf(model, view, () => qv(a), "הקצה השמאלי, שם המקסימום") : plotOf(model, view, (n) => 1 / n, "הנקודה הנעה x_n=1/n");
  return {
    book, model,
    exercise: finishExercise({
      id: ATAN_ID, signature: atanSignature(v), difficulty: atanDifficulty(v),
      title: tail ? "ארקטנגנס: קרן שאינה כוללת את 0" : "ארקטנגנס: קפיצה ב־0",
      statement: statementOf(fn, d, domTex), formula: formulaOf(fn, domTex), steps, book, plot,
    }),
  };
}

export const ARCTAN_NX = makeFamily<AtanVariant>({
  id: ATAN_ID,
  grid: atanGrid,
  kindOf: (v) => v.kind,
  difficulty: atanDifficulty,
  signature: atanSignature,
  build: buildAtan,
});

// =============================================================================================
// 9. e^{-nx}: the continuity theorem, a supremum approached at 0+, a monotone difference away from 0
// =============================================================================================

type ExpKind = "ray0" | "sub0" | "open0" | "tail";
export type ExpVariant = { kind: ExpKind; a?: Q };
const EXP_ID = "unif-exp-decay";

function expGrid(): ExpVariant[] {
  return [
    { kind: "ray0" },
    ...[Qn(1), Qn(2)].map((a): ExpVariant => ({ kind: "sub0", a })),
    { kind: "open0" },
    ...[Qn(1, 2), Qn(1), Qn(2)].map((a): ExpVariant => ({ kind: "tail", a })),
  ];
}
const expSignature = (v: ExpVariant) => `${v.kind}${v.a ? `;a=${qKey(v.a)}` : ""}`;
const expDifficulty = (v: ExpVariant): PracticeDifficulty => (v.kind === "ray0" || v.kind === "sub0" ? "easy" : "medium");

function buildExp(v: ExpVariant, rng: SeededRandom): Built {
  const { kind } = v;
  const a = v.a ?? Qn(1);
  const tail = kind === "tail";
  const book = new Book();
  const fn = "e^{-nx}";
  const d = kind === "ray0" ? mkDom(0, Infinity, true, false) : kind === "sub0" ? mkDom(0, qv(a), true, true)
    : kind === "open0" ? mkDom(0, Infinity, false, false) : mkDom(qv(a), Infinity, true, false);
  const domTex = kind === "ray0" ? interval(d, "0", "\\infty") : kind === "sub0" ? interval(d, "0", qL(a))
    : kind === "open0" ? interval(d, "0", "\\infty") : interval(d, qL(a), "\\infty");
  const aL = qL(a);
  const na = timesN(a);
  const model: Model = {
    value: (n, x) => Math.exp(-n * x),
    limit: (x) => (x === 0 ? 1 : 0),
    domain: d,
    uniform: tail,
    sup: tail ? (n) => Math.exp(-n * qv(a)) : () => 1,
    ...(tail ? {} : { gap: 1 }),
    samples: kind === "ray0" ? [0, 0.5, 3] : kind === "sub0" ? [0, qv(a) / 2, qv(a)] : kind === "open0" ? [0.5, 1, 3] : [qv(a), 2 * qv(a), 5],
    ...(kind === "sub0" ? {} : { scanTo: () => (tail ? qv(a) + 20 : 20) }),
  };

  // ---- step 1
  const limitPos = (id: string) => chipSlot(book, rng, id, ok("0", K(0)), [
    bad("1", K(1), H`לכל $x>0$ קבוע, $nx\to\infty$ ו־$e^{-nx}\to0$.`),
    bad("\\tfrac{1}{e}", K(1 / Math.E), H`לכל $x>0$ קבוע, $nx\to\infty$ ולא $nx=1$; ולכן $e^{-nx}\to0$.`),
    bad("\\infty", K(Infinity), H`המעריך $-nx$ שלילי, ולכן $e^{-nx}\to0$ ולא $\infty$.`),
  ]);
  const rangePos = kind === "tail" ? H`x\ge${aL}` : "x>0";
  const s1Parts = kind === "ray0" || kind === "sub0"
    ? [
      slotsPart(template("ex-1-zero", [L(H`x=0:\quad f(0)=`), S("ex1a")], [chipSlot(book, rng, "ex1a", ok("1", K(1)), [
        bad("0", K(0), H`$f_n(0)=e^{0}=1$ לכל $n$.`),
        bad("\\tfrac{1}{e}", K(1 / Math.E), H`$f_n(0)=e^{-n\cdot0}=e^0=1$ לכל $n$.`),
        bad("e", K(Math.E), H`$f_n(0)=e^{-n\cdot0}=e^0=1$ לכל $n$.`),
      ])])),
      slotsPart(template("ex-1-pos", [L(H`${rangePos}:\quad f(x)=`), S("ex1b")], [limitPos("ex1b")])),
    ]
    : [slotsPart(template("ex-1-pos", [L(H`${rangePos}:\quad f(x)=`), S("ex1b")], [limitPos("ex1b")]))];
  const s1 = step({
    id: "ex-1", title: STEP_LIMIT_TITLE,
    prompt: H`חשבו את הגבול הנקודתי $f(x)=\lim_{n\to\infty}f_n(x)$ ${kind === "ray0" || kind === "sub0" ? "ב־$x=0$ ובשאר התחום" : "בכל נקודה של התחום"}.`,
    parts: s1Parts,
    hints: [H`ל־$x>0$ קבוע, $nx\to\infty$.`],
    solvedNote: kind === "ray0" || kind === "sub0" ? H`$f(0)=1$ ו־$f(x)=0$ ל־$x>0$.` : H`$f(x)=0$ בכל נקודה של התחום.`,
  });

  const verdictPrompt = H`האם $f_n\to f$ במידה שווה ${inDom(d, domTex)}?`;
  let steps: PracticeStep[];
  if (kind === "ray0" || kind === "sub0") {
    const s2 = step({
      id: "ex-2", title: "רציפות הגבול ב־0",
      prompt: H`כל $f_n(x)=e^{-nx}$ רציפה. חשבו את הגבול של $f$ מימין ל־$0$ ואת $f(0)$.`,
      parts: [
        slotsPart(template("ex-2-right", [L(H`\lim_{x\to0^+}f(x)=`), S("ex2a")], [chipSlot(book, rng, "ex2a", ok("0", K(0)), [
          bad("1", K(1), H`$f(x)=0$ לכל $x>0$, ולכן גם הגבול מימין ל־$0$ הוא $0$.`),
          bad("\\tfrac{1}{e}", K(1 / Math.E), H`$f(x)=0$ לכל $x>0$.`),
          bad("\\infty", K(Infinity), H`$f(x)=0$ לכל $x>0$.`),
        ])])),
        slotsPart(template("ex-2-at", [L(H`f(0)=`), S("ex2b")], [chipSlot(book, rng, "ex2b", ok("1", K(1)), [
          bad("0", K(0), H`$f(0)=\lim e^{-n\cdot0}=1$.`),
          bad("\\tfrac{1}{e}", K(1 / Math.E), H`$f_n(0)=e^0=1$ לכל $n$.`),
          bad("e", K(Math.E), H`$f_n(0)=e^0=1$ לכל $n$.`),
        ])])),
      ],
      hints: [H`השוו את $f(0)$ עם הערכים של $f$ ליד $0$.`],
      solvedNote: H`$f$ קופצת ב־$x=0$ מ־$1$ אל $0$: אינה רציפה שם.`,
    });
    const s3 = step({
      id: "ex-3", title: "משפט הרציפות",
      prompt: H`איזו טענה מאפשרת להסיק מכך ש־$f_n$ רציפות ו־$f$ אינה רציפה, שההתכנסות אינה במידה שווה?`,
      parts: [choicePart("ex-3-thm", "בחרו את הטענה הנכונה.", shuffle(rng, [
        good("uniform-thm", H`גבול במידה שווה של פונקציות רציפות הוא פונקציה רציפה.`),
        wrong("pointwise-thm", H`גבול נקודתי של פונקציות רציפות הוא פונקציה רציפה.`, "הטענה אינה נכונה: זו בדיוק הדוגמה שמפריכה אותה."),
        wrong("converse", H`אם $f$ אינה רציפה, אז גם $f_n$ אינן רציפות.`, H`כאן $f_n(x)=e^{-nx}$ רציפות, ו־$f$ אינה רציפה.`),
      ]))],
      hints: [H`הטענה היא על פונקציות רציפות שמתכנסות במידה שווה.`],
      solvedNote: H`גבול במידה שווה של פונקציות רציפות רציף; כאן הגבול אינו רציף, ולכן ההתכנסות אינה במידה שווה.`,
    });
    const s4 = verdictStep(rng, "ex-4", verdictPrompt, [
      good("not-uniform", H`לא במידה שווה: $f_n$ רציפות והגבול $f$ אינו רציף ב־$x=0$.`),
      wrong("uniform-pw", H`כן, כי $e^{-nx}\to0$ בכל $x>0$.`, "התכנסות נקודתית אינה מספיקה."),
      wrong("uniform-at0", H`כן, כי $f_n(0)=f(0)=1$ לכל $n$.`, H`בנקודה $x=0$ עצמה אין פער, אך ליד $0$ יש: משפט הרציפות מראה שאין התכנסות במידה שווה.`),
    ], [H`אם הגבול אינו רציף והסדרה רציפה, אין התכנסות במידה שווה.`],
    H`$f_n\not\to f$ במידה שווה.`,
    H`כל $f_n(x)=e^{-nx}$ רציפה. $f(x)=0$ ל־$x>0$ ו־$f(0)=1$, ולכן $f$ אינה רציפה ב־$x=0$. גבול במידה שווה של פונקציות רציפות הוא רציף, ולכן ההתכנסות אינה במידה שווה.`);
    steps = [s1, s2, s3, s4];
  } else if (kind === "open0") {
    const s2 = step({
      id: "ex-2", title: "הפער ליד 0",
      prompt: H`ב־$(0,\infty)$ הגבול הוא $0$, ולכן $\lvert f_n(x)-f(x)\rvert=e^{-nx}$. חשבו את הגבול שלו כש־$x\to0^+$ (כש־$n$ קבוע).`,
      parts: [slotsPart(template("ex-2-end", [L(H`\lim_{x\to0^+}\lvert f_n(x)-f(x)\rvert=`), S("ex2a")], [chipSlot(book, rng, "ex2a", ok("1", K(1)), [
        bad("0", K(0), H`כאן $n$ קבוע ו־$x\to0^+$: $e^{-nx}\to e^0=1$.`),
        bad("\\tfrac{1}{e}", K(1 / Math.E), H`$e^{-nx}\to e^0=1$ כש־$x\to0^+$.`),
        bad("\\infty", K(Infinity), H`$e^{-nx}\le1$ לכל $x>0$.`),
      ])]))],
      hints: [H`כש־$x\to0^+$ מתקיים $nx\to0$.`],
      solvedNote: H`הפער מתקרב ל־$1$ כש־$x\to0^+$.`,
    });
    const s3 = step({
      id: "ex-3", title: H`הסופרמום $M_n$`,
      prompt: H`הגבול $f=0$ רציף ב־$(0,\infty)$, ולכן משפט הרציפות אינו חל. מהו $M_n=\sup_{x>0}\lvert f_n(x)-f(x)\rvert$?`,
      parts: [choicePart("ex-3-sup", "בחרו.", shuffle(rng, [
        good("one", H`$M_n=1$ לכל $n$ (הוא אינו מתקבל: $e^{-nx}<1$ לכל $x>0$), ולכן $M_n\not\to0$.`),
        wrong("zero", H`$M_n=0$, כי $f_n\to f$ בכל נקודה.`, H`ההתכנסות הנקודתית אינה קובעת את $M_n$: $M_n$ הוא סופרמום לפי $x$ עבור $n$ קבוע.`),
        wrong("e-n", H`$M_n=e^{-n}$, הערך ב־$x=1$.`, "זהו ערך בנקודה אחת, לא הסופרמום: הפער גדל כש־$x$ קטן."),
      ]))],
      hints: [H`$e^{-nx}$ יורדת ב־$x$, והגבול שלה ב־$0^+$ הוא $1$.`],
      solvedNote: H`$M_n=1$: סופרמום שאינו מתקבל.`,
    });
    const s4 = verdictStep(rng, "ex-4", verdictPrompt, [
      good("not-uniform", H`לא במידה שווה: $M_n=1\not\to0$.`),
      wrong("uniform-cont", H`כן, כי הגבול $f=0$ רציף וכל $f_n$ רציפה.`, H`רציפות הגבול היא תנאי הכרחי בלבד: כאן $M_n=1$.`),
      wrong("uniform-pw", H`כן, כי $e^{-nx}\to0$ בכל $x>0$.`, "התכנסות נקודתית אינה מספיקה."),
    ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    H`$M_n=1\not\to0$: ההתכנסות אינה במידה שווה, אף שהגבול רציף.`,
    H`$f=0$ ב־$(0,\infty)$ ו־$\lvert f_n-f\rvert=e^{-nx}$ יורדת ב־$x$ ומתקרבת ל־$1$ כש־$x\to0^+$. לכן $M_n=1$ לכל $n$ ו־$M_n\not\to0$: לפי מבחן הסופרמום ההתכנסות אינה במידה שווה (אף שהגבול רציף).`);
    steps = [s1, s2, s3, s4];
  } else {
    const s2 = step({
      id: "ex-2", title: "היכן המקסימום",
      prompt: H`סמנו את הנימוקים הנדרשים לכך שהפער $\lvert f_n-f\rvert$ מקבל את המקסימום בקצה השמאלי $x=${aL}$.`,
      parts: [checklistPart("ex-2-why", shuffle(rng, [
        must("diff", H`$f=0$ בקרן, ולכן $\lvert f_n-f\rvert=e^{-nx}$.`),
        must("mono", H`לפי משפט לגרנז', $\left(e^{-nx}\right)'=-ne^{-nx}<0$, ולכן $e^{-nx}$ יורדת ב־$x$.`),
        must("endpoint", H`הקצה השמאלי $x=${aL}$ שייך לקרן.`),
        extra("bound", H`לפי משפט לגרנז', $e^{t}\ge1+t>t$, ולכן $e^{-t}\le\frac1t$ לכל $t>0$, ולכן $M_n\le${invNa(a)}$.`, "נכון, ומאפשר חסם חלופי; כאן הסופרמום מחושב במדויק."),
        nope("inc", H`$e^{-nx}$ עולה ב־$x$.`, H`המעריך $-nx$ יורד כש־$x$ גדל, ולכן $e^{-nx}$ יורדת.`),
        nope("crit", H`$f_n'(x)=-ne^{-nx}=0$ בנקודה כלשהי.`, H`$e^{-nx}>0$ לכל $x$, ולכן הנגזרת לא מתאפסת.`),
      ]))],
      hints: [H`$f_n(x)=e^{-nx}$ יורדת ב־$x$: איפה היא הגדולה ביותר בקרן?`],
      solvedNote: H`הפער יורד ב־$x$, ולכן $M_n$ הוא הערך ב־$x=${aL}$.`,
    });
    const mnSlot = chipSlot(book, rng, "ex3a", ok(`e^{-${na}}`, seq((n) => Math.exp(-n * qv(a)))), [
      bad(`e^{-${aL}}`, K(Math.exp(-qv(a))), H`זה הפער עבור $n=1$ בלבד.`),
      bad("1", K(1), H`$1$ הוא הגבול של הפער כש־$x\to0^+$; כאן הקרן מתחילה ב־$${aL}$.`),
      bad(`${invNa(a)}`, seq((n) => 1 / (n * qv(a))), H`זה חסם עליון ($e^{-t}\le\frac1t$), לא הערך המדויק.`),
      bad("e^{-n}", seq((n) => Math.exp(-n)), H`בקצה $x=${aL}$ המעריך הוא $-${na}$.`),
    ]);
    const limSlot = chipSlot(book, rng, "ex3b", ok("0", K(0)), [
      bad("1", K(1), H`$${na}\to\infty$ ולכן $e^{-${na}}\to0$.`),
      bad("\\tfrac{1}{e}", K(1 / Math.E), H`$${na}\to\infty$ ולכן $e^{-${na}}\to0$.`),
      bad("\\infty", K(Infinity), H`המעריך שלילי, ולכן הביטוי שואף ל־$0$.`),
    ]);
    const s3 = step({
      id: "ex-3", title: H`חישוב $M_n$ וגבולו`,
      prompt: H`כתבו את $M_n$ וחשבו את גבולו.`,
      parts: [slotsPart(template("ex-3-mn", [L(H`M_n=`), S("ex3a"), L(H`\xrightarrow[n\to\infty]{}`), S("ex3b")], [mnSlot, limSlot]))],
      hints: [H`הציבו $x=${aL}$ ב־$e^{-nx}$.`],
      solvedNote: H`$M_n=e^{-${na}}\to0$.`,
    });
    const s4 = verdictStep(rng, "ex-4", verdictPrompt, [
      good("uniform", H`כן: $M_n=e^{-${na}}\to0$.`),
      wrong("not-unbounded", H`לא, כי הקרן אינה חסומה.`, H`תחום שאינו חסום אינו מונע התכנסות במידה שווה: כאן $M_n\to0$.`),
      wrong("not-jump", H`לא, כי הגבול $f$ אינו רציף ב־$x=0$.`, H`הנקודה $x=0$ אינה שייכת לקרן $[${aL},\infty)$, ושם $f\equiv0$.`),
    ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    H`$M_n\to0$: ההתכנסות במידה שווה.`,
    H`$f=0$ בקרן. $\lvert f_n-f\rvert=e^{-nx}$ יורדת ב־$x$, ולכן $M_n=e^{-${na}}\to0$. לפי מבחן הסופרמום ההתכנסות במידה שווה.`);
    steps = [s1, s2, s3, s4];
  }

  const xMax = kind === "sub0" ? qv(a) * 1.15 : tail ? qv(a) + 3 : 3;
  const view = autoView(model, 0, xMax);
  const plot = tail ? plotOf(model, view, () => qv(a), "הקצה השמאלי, שם המקסימום") : plotOf(model, view);
  return {
    book, model,
    exercise: finishExercise({
      id: EXP_ID, signature: expSignature(v), difficulty: expDifficulty(v),
      title: tail ? "אקספוננט דועך: קרן שאינה כוללת את 0" : kind === "open0" ? "אקספוננט דועך: גבול רציף ובכל זאת לא במידה שווה" : "אקספוננט דועך: קפיצה ב־0",
      statement: statementOf(fn, d, domTex), formula: formulaOf(fn, domTex), steps, book, plot,
    }),
  };
}

export const EXP_DECAY = makeFamily<ExpVariant>({
  id: EXP_ID,
  grid: expGrid,
  kindOf: (v) => v.kind,
  difficulty: expDifficulty,
  signature: expSignature,
  build: buildExp,
});

// =============================================================================================
// 10. sqrt(x^2 + k^2/n^2) -> |x| (uniform, conjugate identity) and its derivative n x / sqrt(1 + n^2 x^2) -> sign x
// =============================================================================================

type SqrtKind = "S-line" | "S-tail" | "Q-sym" | "Q-tail";
export type SqrtVariant = { kind: SqrtKind; k?: 1 | 2 | 3; a?: 1 | 2 | 3 };
const SQRT_ID = "unif-sqrt-smoothing";

function sqrtGrid(): SqrtVariant[] {
  const out: SqrtVariant[] = [];
  for (const k of [1, 2, 3] as const) out.push({ kind: "S-line", k }, { kind: "S-tail", k });
  out.push({ kind: "Q-sym" });
  for (const a of [1, 2, 3] as const) out.push({ kind: "Q-tail", a });
  return out;
}
const sqrtSignature = (v: SqrtVariant) => `${v.kind}${v.k ? `;k=${v.k}` : ""}${v.a ? `;a=${v.a}` : ""}`;
const sqrtDifficulty = (v: SqrtVariant): PracticeDifficulty => (v.kind === "Q-sym" || (v.kind === "Q-tail" && v.a === 1) ? "easy" : v.kind === "S-tail" ? "advanced" : "medium");

/** (n, x) probes with x >= 1 (the ray [1, infinity)). */
const NX_BIG: [number, number][] = [[3, 1.2], [10, 1.9], [30, 2.6], [7, 1.5], [20, 3.3]];
const nxBig = (f: (n: number, x: number) => number) => NX_BIG.map(([n, x]) => f(n, x));

function buildSqrt(v: SqrtVariant, rng: SeededRandom): Built {
  const { kind } = v;
  const k = v.k ?? 1;
  const a = v.a ?? 1;
  const book = new Book();
  const isS = kind === "S-line" || kind === "S-tail";
  const line = kind === "S-line";

  // ---------------------------------------------------------------- the models
  const sRoot = H`\sqrt{x^{2}+\frac{${k * k}}{n^{2}}}`;
  const gA = H`\dfrac{${co(a, "n")}}{\sqrt{1+${co(a * a, "n^{2}")}}}`;
  const fn = isS ? H`\sqrt{x^{2}+\frac{${k * k}}{n^{2}}}` : H`\frac{nx}{\sqrt{1+n^{2}x^{2}}}`;
  const d = kind === "S-line" ? mkDom(-Infinity, Infinity, false, false) : kind === "S-tail" ? mkDom(1, Infinity, true, false)
    : kind === "Q-sym" ? mkDom(-1, 1, true, true) : mkDom(a, Infinity, true, false);
  const domTex = kind === "S-line" ? REAL_LINE : kind === "S-tail" ? interval(d, "1", "\\infty") : kind === "Q-sym" ? interval(d, "-1", "1") : interval(d, `${a}`, "\\infty");
  const qValue = (n: number, x: number) => (n * x) / Math.sqrt(1 + n * n * x * x);
  const model: Model = isS
    ? {
      value: (n, x) => Math.sqrt(x * x + (k * k) / (n * n)),
      limit: (x) => Math.abs(x),
      domain: d,
      uniform: true,
      sup: line ? (n) => k / n : (n) => Math.sqrt(1 + (k * k) / (n * n)) - 1,
      samples: line ? [-3, 0, 2] : [1, 2, 5],
      ...(line ? { scanFrom: () => -5, scanTo: () => 5 } : { scanTo: () => 50 }),
    }
    : {
      value: qValue,
      limit: (x) => (x > 0 ? 1 : x < 0 ? -1 : 0),
      domain: d,
      uniform: kind === "Q-tail",
      sup: kind === "Q-tail" ? (n) => 1 - qValue(n, a) : () => 1,
      ...(kind === "Q-tail" ? { scanTo: () => a + 20 } : { gap: 1, special: [0] }),
      samples: kind === "Q-sym" ? [-1, -0.5, 0, 0.5, 1] : [a, 2 * a, 5],
    };
  const verdictPrompt = H`האם $f_n\to f$ במידה שווה ${inDom(d, domTex)}?`;
  let steps: PracticeStep[];

  if (isS) {
    // ---- step 1: the limit
    const limitSlot = chipSlot(book, rng, "sq1a", ok(line ? "\\lvert x\\rvert" : "x", nx((n, x) => (line ? Math.abs(x) : x))), line
      ? [
        bad("x", nx((n, x) => x), H`$\sqrt{x^2}=\lvert x\rvert$, והוא שונה מ־$x$ כש־$x<0$.`),
        bad(`\\sqrt{x^{2}+${k * k}}`, nx((n, x) => Math.sqrt(x * x + k * k)), H`$\frac{${k * k}}{n^2}\to0$, ולכן הוא נעלם בגבול.`),
        bad("0", nx(() => 0), H`$\sqrt{x^2+\frac{${k * k}}{n^2}}\to\sqrt{x^2}=\lvert x\rvert$, שאינו $0$ בכל נקודה.`),
        bad("x^{2}", nx((n, x) => x * x), H`$\sqrt{x^2}=\lvert x\rvert$, לא $x^2$.`),
      ]
      : [
        bad("0", nx(() => 0), H`$\sqrt{x^2+\frac{${k * k}}{n^2}}\to\sqrt{x^2}=x$ ל־$x\ge1$.`),
        bad("1", nx(() => 1), H`הגבול תלוי ב־$x$: $\sqrt{x^2}=x$.`),
        bad("x^{2}", nx((n, x) => x * x), H`$\sqrt{x^2}=x$, לא $x^2$.`),
        bad("x+1", nx((n, x) => x + 1), H`$\frac{${k * k}}{n^2}\to0$, ולכן הוא נעלם בגבול.`),
      ]);
    const s1 = step({
      id: "sq-1", title: STEP_LIMIT_TITLE,
      prompt: H`חשבו את הגבול הנקודתי $f(x)=\lim_{n\to\infty}f_n(x)$.`,
      parts: [slotsPart(template("sq-1-lim", [L(H`f(x)=\lim_{n\to\infty}\sqrt{x^2+\frac{${k * k}}{n^2}}=`), S("sq1a")], [limitSlot]))],
      hints: [H`$\frac{${k * k}}{n^2}\to0$ ו־$\sqrt{x^2}=\lvert x\rvert$.`],
      solvedNote: line ? H`$f(x)=\lvert x\rvert$.` : H`$f(x)=\lvert x\rvert=x$ בקרן $[1,\infty)$.`,
    });

    // ---- step 2: the conjugate identity
    const absX = line ? "\\lvert x\\rvert" : "x";
    const rt = (n: number, x: number) => Math.sqrt(x * x + (k * k) / (n * n));
    const abs = (x: number) => (line ? Math.abs(x) : x);
    const sig = line ? nx : nxBig;
    const idSlot = chipSlot(book, rng, "sq2a", ok(H`\dfrac{1}{${sRoot}+${absX}}`, sig((n, x) => 1 / (rt(n, x) + abs(x)))), [
      bad(H`\dfrac{1}{${sRoot}-${absX}}`, sig((n, x) => 1 / (rt(n, x) - abs(x))), H`כופלים בצמוד: במכנה מופיע הסכום $\sqrt{\cdots}+${absX}$, לא ההפרש.`),
      bad(H`${sRoot}+${absX}`, sig((n, x) => rt(n, x) + abs(x)), "זה המכנה; הפער הוא המונה חלקי המכנה, ולכן יש להפוך."),
      bad(H`\dfrac{1}{${sRoot}}`, sig((n, x) => 1 / rt(n, x)), H`במכנה חסר $+${absX}$ שמתקבל מהכפל בצמוד.`),
    ]);
    const s2 = step({
      id: "sq-2", title: "הפער בעזרת הצמוד",
      prompt: H`כפלו ב־$\dfrac{${sRoot}+${absX}}{${sRoot}+${absX}}$ וחשבו את הפער $f_n(x)-f(x)$.`,
      parts: [slotsPart(template("sq-2-id", [L(H`f_n(x)-${absX}=\dfrac{${k * k}}{n^{2}}\cdot`), S("sq2a")], [idSlot]))],
      hints: [H`$(\sqrt{A}-B)(\sqrt{A}+B)=A-B^2$, כאן $A=x^2+\frac{${k * k}}{n^2}$ ו־$B=${absX}$.`],
      solvedNote: H`$f_n(x)-f(x)=\dfrac{${k * k}}{n^{2}\left(${sRoot}+${absX}\right)}>0$.`,
    });

    // ---- step 3: where the difference is largest
    const s3 = step({
      id: "sq-3", title: "היכן הפער גדול ביותר",
      prompt: line
        ? H`סמנו את הנימוקים הנדרשים לכך שהפער $\lvert f_n-f\rvert$ מקבל את המקסימום ב־$x=0$.`
        : H`סמנו את הנימוקים הנדרשים לכך שהפער $\lvert f_n-f\rvert$ מקבל את המקסימום בקצה השמאלי $x=1$.`,
      parts: [checklistPart("sq-3-why", shuffle(rng, line
        ? [
          must("pos", H`הפער חיובי, ושווה למנה מהשלב הקודם.`),
          must("den", H`המכנה $${sRoot}+\lvert x\rvert$ הוא הקטן ביותר ב־$x=0$ (שם הוא $\frac{${k}}{n}$), ולכן שם הפער הגדול ביותר.`),
          must("inside", H`$x=0$ שייכת לישר.`),
          extra("smooth", H`כל $f_n$ גזירה בכל נקודה, בניגוד ל־$f=\lvert x\rvert$.`, "נכון, אך אינו משפיע: התכנסות במידה שווה אינה מבטיחה גזירות הגבול."),
          nope("grows", H`הפער גדל כש־$\lvert x\rvert$ גדל.`, H`המכנה גדל עם $\lvert x\rvert$, ולכן הפער קטן.`),
          nope("zero", H`הפער מתאפס ב־$x=0$, כי שם $f_n(0)=f(0)$.`, H`$f_n(0)=\frac{${k}}{n}$ ו־$f(0)=0$: הפער ב־$x=0$ הוא $\frac{${k}}{n}$.`),
        ]
        : [
          must("pos", H`הפער חיובי, ושווה למנה מהשלב הקודם.`),
          must("den", H`המכנה $${sRoot}+x$ עולה ב־$x$, ולכן הפער יורד ב־$x$.`),
          must("inside", H`$x=1$ שייך לקרן והוא קצה שמאלי שלה.`),
          extra("bound", H`$M_n\le${fracN(k * k, 2, "n^{2}")}$, כי המכנה לפחות $2$ ב־$x\ge1$.`, "נכון, ומאפשר הוכחה חלופית; כאן הסופרמום מחושב במדויק."),
          nope("at0", H`המקסימום ב־$x=0$, כמו בישר.`, H`$x=0$ אינה שייכת לקרן $[1,\infty)$.`),
          nope("unb", H`הקרן אינה חסומה, ולכן אין מקסימום.`, H`הפער יורד ב־$x$ ולכן מתקבל בקצה $x=1$.`),
        ]))],
      hints: [H`הפער הוא $\dfrac{${k * k}}{n^2}$ חלקי המכנה: איפה המכנה הקטן ביותר?`],
      solvedNote: line ? H`$M_n$ הוא הפער ב־$x=0$.` : H`$M_n$ הוא הפער ב־$x=1$.`,
    });

    // ---- step 4: M_n and its limit
    const mnL = line ? H`\frac{${k}}{n}` : H`\sqrt{1+\frac{${k * k}}{n^{2}}}-1`;
    const mnSig = line ? seq((n) => k / n) : seq((n) => Math.sqrt(1 + (k * k) / (n * n)) - 1);
    const mnWrongs: Chip[] = line
      ? [
        bad(H`\frac{${k * k}}{n^{2}}`, seq((n) => (k * k) / (n * n)), H`זה המונה; יש לחלק במכנה, שהוא $\frac{${k}}{n}$ ב־$x=0$.`),
        bad(H`${fracN(k, 2, "n")}`, seq((n) => k / (2 * n)), H`ב־$x=0$ המכנה הוא $\sqrt{\frac{${k * k}}{n^2}}+0=\frac{${k}}{n}$, לא $\frac{${2 * k}}{n}$.`),
        bad(H`\frac{${k * k}}{n}`, seq((n) => (k * k) / n), H`$\frac{${k * k}}{n^2}\div\frac{${k}}{n}=\frac{${k}}{n}$.`),
        bad("0", K(0), H`$0$ הוא הגבול של $M_n$, לא ערכו עבור $n$ נתון.`),
      ]
      : [
        bad(H`\frac{${k}}{n}`, seq((n) => k / n), H`זה הפער ב־$x=0$, שאינו שייך לקרן $[1,\infty)$.`),
        bad(H`\frac{${k * k}}{n^{2}}`, seq((n) => (k * k) / (n * n)), "זה המונה; יש לחלק במכנה."),
        bad(H`\sqrt{1+${k * k}}-1`, K(Math.sqrt(1 + k * k) - 1), "זה הפער עבור $n=1$ בלבד."),
        bad(H`${fracN(k * k, 2, "n^{2}")}`, seq((n) => (k * k) / (2 * n * n)), "זה חסם עליון, לא הערך המדויק."),
      ];
    const s4 = step({
      id: "sq-4", title: H`חישוב $M_n$ וגבולו`,
      prompt: H`כתבו את $M_n=\sup\lvert f_n-f\rvert$ וחשבו את גבולו.`,
      parts: [slotsPart(template("sq-4-mn", [L(H`M_n=`), S("sq4a"), L(H`\xrightarrow[n\to\infty]{}`), S("sq4b")], [
        chipSlot(book, rng, "sq4a", ok(mnL, mnSig), mnWrongs),
        chipSlot(book, rng, "sq4b", ok("0", K(0)), [
          bad("1", K(1), H`כל איברי $M_n$ שואפים ל־$0$.`),
          bad("\\infty", K(Infinity), H`$M_n$ חסום על ידי ${line ? H`$\frac{${k}}{n}$` : H`$${fracN(k * k, 2, "n^{2}")}$`}, ושואף ל־$0$.`),
          bad(H`${k}`, K(k), H`$M_n\to0$: הפער קטן ככל ש־$n$ גדל.`),
        ]),
      ]))],
      hints: [line ? H`הציבו $x=0$ במנה.` : H`הציבו $x=1$: $f_n(1)-1=\sqrt{1+\frac{${k * k}}{n^2}}-1$.`],
      solvedNote: H`$M_n=${mnL}\to0$.`,
    });
    const s5 = verdictStep(rng, "sq-5", verdictPrompt, [
      good("uniform", H`כן: $M_n=${mnL}\to0$.`),
      line
        ? wrong("not-diff", H`לא, כי $f=\lvert x\rvert$ אינה גזירה ב־$x=0$ בעוד $f_n$ גזירות.`, "גבול במידה שווה של פונקציות גזירות אינו חייב להיות גזיר; אין בכך סתירה להתכנסות במידה שווה.")
        : wrong("not-ray", H`לא, כי בישר ההתכנסות אינה במידה שווה.`, H`גם בישר ההתכנסות במידה שווה, ובקרן $[1,\infty)$ בוודאי.`),
      wrong("not-unbounded", H`לא, כי התחום אינו חסום.`, H`תחום שאינו חסום אינו מונע התכנסות במידה שווה: כאן $M_n\to0$.`),
    ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    H`$M_n\to0$: ההתכנסות במידה שווה.`,
    line
      ? H`$f=\lvert x\rvert$ ו־$f_n(x)-f(x)=\dfrac{${k * k}}{n^2\left(${sRoot}+\lvert x\rvert\right)}\le\dfrac{${k * k}}{n^2\cdot\frac{${k}}{n}}=\frac{${k}}{n}$, עם שוויון ב־$x=0$. לכן $M_n=\frac{${k}}{n}\to0$, ולפי מבחן הסופרמום ההתכנסות במידה שווה (אף ש־$\lvert x\rvert$ אינה גזירה ב־$0$).`
      : H`$f=x$ בקרן ו־$f_n(x)-f(x)=\dfrac{${k * k}}{n^2\left(${sRoot}+x\right)}$ יורד ב־$x$, ולכן $M_n=\sqrt{1+\frac{${k * k}}{n^2}}-1\le${fracN(k * k, 2, "n^{2}")}\to0$. לפי מבחן הסופרמום ההתכנסות במידה שווה.`);
    steps = [s1, s2, s3, s4, s5];
  } else if (kind === "Q-sym") {
    const lim = (id: string, accepted: string, accNum: number, wrongs: [string, number, string][]) =>
      chipSlot(book, rng, id, ok(accepted, K(accNum)), wrongs.map(([l, val, diag]) => bad(l, K(val), diag)));
    const s1 = step({
      id: "sq-1", title: STEP_LIMIT_TITLE,
      prompt: H`חשבו את הגבול הנקודתי $f(x)=\lim_{n\to\infty}\frac{nx}{\sqrt{1+n^2x^2}}$ בשלושת המקרים.`,
      parts: [
        slotsPart(template("sq-1-neg", [L(H`x<0:\quad f(x)=`), S("sq1a")], [lim("sq1a", "-1", -1, [
          ["1", 1, H`ל־$x<0$ המונה $nx$ שלילי, ולכן הגבול שלילי.`], ["0", 0, H`$\frac{nx}{\sqrt{1+n^2x^2}}\to\frac{x}{\lvert x\rvert}$, לא $0$.`], ["-\\infty", -Infinity, H`המונה והמכנה גדלים באותו קצב, ולכן המנה חסומה.`]])])),
        slotsPart(template("sq-1-zero", [L(H`x=0:\quad f(0)=`), S("sq1b")], [lim("sq1b", "0", 0, [
          ["1", 1, H`$f_n(0)=0$ לכל $n$.`], ["-1", -1, H`$f_n(0)=0$ לכל $n$.`], ["\\tfrac12", 0.5, H`$f_n(0)=0$ לכל $n$.`]])])),
        slotsPart(template("sq-1-pos", [L(H`x>0:\quad f(x)=`), S("sq1c")], [lim("sq1c", "1", 1, [
          ["0", 0, H`$\frac{nx}{\sqrt{1+n^2x^2}}\to\frac{x}{\lvert x\rvert}=1$ ל־$x>0$.`], ["-1", -1, H`ל־$x>0$ המונה חיובי.`], ["\\infty", Infinity, H`המונה והמכנה גדלים באותו קצב, ולכן המנה חסומה.`]])])),
      ],
      hints: [H`ל־$x\ne0$: $\frac{nx}{\sqrt{1+n^2x^2}}=\frac{x}{\sqrt{\frac{1}{n^2}+x^2}}\to\frac{x}{\lvert x\rvert}$.`],
      solvedNote: H`$f(x)=\operatorname{sign}x$: $-1$ ל־$x<0$, $0$ ב־$x=0$ ו־$1$ ל־$x>0$.`,
    });
    const s2 = step({
      id: "sq-2", title: "מה מצדיק את המסקנה",
      prompt: "סמנו את כל הנימוקים הנדרשים כדי להסיק שההתכנסות אינה במידה שווה.",
      parts: [checklistPart("sq-2-why", shuffle(rng, [
        must("cont", H`כל $f_n(x)=\frac{nx}{\sqrt{1+n^2x^2}}$ רציפה (מנה של פונקציות רציפות, והמכנה חיובי).`),
        must("jump", H`הגבול $f$ אינו רציף ב־$x=0$: הוא $-1$ משמאל, $1$ מימין ו־$f(0)=0$.`),
        must("thm", H`משפט הרציפות: גבול במידה שווה של פונקציות רציפות הוא פונקציה רציפה.`),
        extra("deriv", H`$f_n=g_n'$ עבור $g_n(x)=\frac1n\sqrt{1+n^2x^2}$.`, "נכון (וזה הקשר בין גבול לנגזרת), אך אינו חלק מהטיעון."),
        nope("pw", H`הגבול הנקודתי קיים בכל נקודה, ולכן ההתכנסות במידה שווה.`, "קיום הגבול בכל נקודה הוא התכנסות נקודתית בלבד."),
        nope("at0", H`$f_n(0)=f(0)=0$, ולכן אין פער.`, "בנקודה $x=0$ עצמה אין פער, אך ליד $0$ יש: משפט הרציפות מראה שאין התכנסות במידה שווה."),
      ]))],
      hints: [H`משפט הרציפות דורש: $f_n$ רציפות, והגבול במידה שווה.`],
      solvedNote: H`$f_n$ רציפות והגבול $f$ אינו רציף: ההתכנסות אינה במידה שווה.`,
    });
    const s3 = verdictStep(rng, "sq-3", verdictPrompt, [
      good("not-uniform", H`לא: $f_n$ רציפות והגבול $f$ אינו רציף ב־$x=0$.`),
      wrong("uniform-pw", H`כן, כי $f_n(x)\to f(x)$ בכל נקודה.`, "התכנסות נקודתית אינה מספיקה."),
      wrong("uniform-smooth", H`כן, כי $f_n$ חלקות ו־$\lvert f_n\rvert<1$ לכל $n$.`, "חלקות וחסימות של הסדרה אינן מבטיחות התכנסות במידה שווה."),
    ], [H`אם הגבול אינו רציף והסדרה רציפה, אין התכנסות במידה שווה.`],
    H`$f_n\not\to f$ במידה שווה.`,
    H`כל $f_n$ רציפה ב־$[-1,1]$; $f(x)=\operatorname{sign}x$ אינה רציפה ב־$x=0$ ($f(0)=0$ ו־$f=\pm1$ סביבה). גבול במידה שווה של פונקציות רציפות הוא רציף, ולכן ההתכנסות אינה במידה שווה. (הסדרה היא נגזרת הסדרה $g_n=\frac1n\sqrt{1+n^2x^2}\to\lvert x\rvert$, שמתכנסת במידה שווה.)`);
    steps = [s1, s2, s3];
  } else {
    const na = co(a, "n");
    const s1 = step({
      id: "sq-1", title: STEP_LIMIT_TITLE,
      prompt: H`חשבו את הגבול הנקודתי $f(x)=\lim_{n\to\infty}\frac{nx}{\sqrt{1+n^2x^2}}$ בכל נקודה של הקרן.`,
      parts: [slotsPart(template("sq-1-lim", [L(H`x\ge${a}:\quad f(x)=`), S("sq1a")], [chipSlot(book, rng, "sq1a", ok("1", K(1)), [
        bad("0", K(0), H`$\frac{nx}{\sqrt{1+n^2x^2}}=\frac{x}{\sqrt{\frac{1}{n^2}+x^2}}\to\frac{x}{x}=1$.`),
        bad("-1", K(-1), H`ל־$x>0$ המונה חיובי.`),
        bad("\\infty", K(Infinity), H`המונה והמכנה גדלים באותו קצב, ולכן המנה חסומה.`),
      ])]))],
      hints: [H`חלקו מונה ומכנה ב־$n$: $\frac{x}{\sqrt{\frac1{n^2}+x^2}}$.`],
      solvedNote: H`$f(x)=1$ בכל נקודה של הקרן.`,
    });
    const s2 = step({
      id: "sq-2", title: "היכן הפער גדול ביותר",
      prompt: H`סמנו את הנימוקים הנדרשים לכך שהפער $\lvert f_n-f\rvert$ מקבל את המקסימום בקצה השמאלי $x=${a}$.`,
      parts: [checklistPart("sq-2-why", shuffle(rng, [
        must("inc", H`לפי משפט לגרנז', $f_n'(x)=\dfrac{n}{\left(1+n^2x^2\right)^{3/2}}>0$, ולכן $f_n$ עולה ב־$x$.`),
        must("below", H`$f_n(x)<1$, ולכן $\lvert f_n-f\rvert=1-f_n(x)$, והוא יורד ב־$x$.`),
        must("endpoint", H`הקצה השמאלי $x=${a}$ שייך לקרן.`),
        extra("deriv", H`$f_n=g_n'$ עבור $g_n(x)=\frac1n\sqrt{1+n^2x^2}$.`, "נכון, אך אינו חלק מהטיעון."),
        nope("dec", H`$f_n$ יורדת ב־$x$, ולכן הפער עולה.`, H`$f_n'(x)>0$: $f_n$ עולה, והפער $1-f_n$ יורד.`),
        nope("crit", H`$f_n'(x)=0$ בנקודה כלשהי בקרן.`, H`$f_n'(x)=\frac{n}{(1+n^2x^2)^{3/2}}>0$ לכל $x$.`),
      ]))],
      hints: [H`$f_n(x)=\frac{t}{\sqrt{1+t^2}}$ עבור $t=nx$, והיא עולה ב־$t$.`],
      solvedNote: H`הפער יורד ב־$x$, ולכן $M_n$ הוא הערך ב־$x=${a}$.`,
    });
    const mnSlot = chipSlot(book, rng, "sq3a", ok(H`1-${gA}`, seq((n) => 1 - qValue(n, a))), [
      bad(gA, seq((n) => qValue(n, a)), H`זה $f_n(${a})$, לא הפער מ־$f=1$.`),
      bad(H`1-\dfrac{${a}}{\sqrt{1+${a * a}}}`, K(1 - a / Math.sqrt(1 + a * a)), "זה הפער עבור $n=1$ בלבד."),
      bad(H`\dfrac{1}{\sqrt{1+${co(a * a, "n^{2}")}}}`, seq((n) => 1 / Math.sqrt(1 + a * a * n * n)), H`$1-\frac{t}{\sqrt{1+t^2}}$ אינו שווה ל־$\frac{1}{\sqrt{1+t^2}}$.`),
    ]);
    const limSlot = chipSlot(book, rng, "sq3b", ok("0", K(0)), [
      bad("1", K(1), H`$f_n(${a})\to1$, ולכן הפער $1-f_n(${a})$ שואף ל־$0$.`),
      bad("\\tfrac12", K(0.5), H`$f_n(${a})\to1$, ולכן הפער שואף ל־$0$.`),
      bad("\\infty", K(Infinity), H`הפער חסום על ידי $1$ ושואף ל־$0$.`),
    ]);
    const s3 = step({
      id: "sq-3", title: H`חישוב $M_n$ וגבולו`,
      prompt: H`כתבו את $M_n$ וחשבו את גבולו.`,
      parts: [slotsPart(template("sq-3-mn", [L(H`M_n=`), S("sq3a"), L(H`\xrightarrow[n\to\infty]{}`), S("sq3b")], [mnSlot, limSlot]))],
      hints: [H`הציבו $x=${a}$ ב־$1-f_n(x)$. כש־$n\to\infty$, $f_n(${a})\to1$.`],
      solvedNote: H`$M_n=1-${gA}\to0$.`,
    });
    const s4 = verdictStep(rng, "sq-4", verdictPrompt, [
      good("uniform", H`כן: $M_n=1-${gA}\to0$.`),
      wrong("not-jump", H`לא, כי הגבול $\operatorname{sign}x$ אינו רציף ב־$x=0$.`, H`הנקודה $x=0$ אינה שייכת לקרן $[${a},\infty)$, ושם $f\equiv1$.`),
      wrong("not-unbounded", H`לא, כי הקרן אינה חסומה.`, H`תחום שאינו חסום אינו מונע התכנסות במידה שווה: כאן $M_n\to0$.`),
    ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    H`$M_n\to0$: ההתכנסות במידה שווה.`,
    H`$f=1$ בקרן. $f_n$ עולה ב־$x$ ו־$f_n<1$, ולכן $\lvert f_n-f\rvert=1-f_n(x)$ יורד ב־$x$ ו־$M_n=1-f_n(${a})=1-\dfrac{${na}}{\sqrt{1+${co(a * a, "n^{2}")}}}\to0$. לפי מבחן הסופרמום ההתכנסות במידה שווה.`);
    steps = [s1, s2, s3, s4];
  }

  const view = kind === "S-line" ? autoView(model, -3, 3) : kind === "S-tail" ? autoView(model, 0, 4)
    : kind === "Q-sym" ? autoView(model, -1.2, 1.2) : autoView(model, 0, a + 3);
  const plot = kind === "S-line" ? plotOf(model, view, () => 0, "הנקודה x=0, שם הפער הגדול ביותר")
    : kind === "S-tail" ? plotOf(model, view, () => 1, "הקצה השמאלי, שם המקסימום")
      : kind === "Q-tail" ? plotOf(model, view, () => a, "הקצה השמאלי, שם המקסימום") : plotOf(model, view);
  return {
    book, model,
    exercise: finishExercise({
      id: SQRT_ID, signature: sqrtSignature(v), difficulty: sqrtDifficulty(v),
      title: isS ? "החלקת הערך המוחלט" : "נגזרת של ההחלקה: גבול שקופץ",
      statement: statementOf(fn, d, domTex), formula: formulaOf(fn, domTex), steps, book, plot,
    }),
  };
}

export const SQRT_SMOOTHING = makeFamily<SqrtVariant>({
  id: SQRT_ID,
  grid: sqrtGrid,
  kindOf: (v) => v.kind,
  difficulty: sqrtDifficulty,
  signature: sqrtSignature,
  build: buildSqrt,
});

// =============================================================================================
// 11. x^n (1 - x) and n x^n (1 - x): a peak at n/(n+1) whose height tends to 0 or to 1/e
// =============================================================================================

type PeakKind = "full" | "sub";
export type PeakVariant = { times: boolean; kind: PeakKind; a?: Q };
const PEAK_ID = "unif-peak-power";

function peakGrid(): PeakVariant[] {
  const out: PeakVariant[] = [];
  for (const times of [false, true]) {
    out.push({ times, kind: "full" });
    for (const a of [Qn(1, 2), Qn(2, 3), Qn(3, 4)]) out.push({ times, kind: "sub", a });
  }
  return out;
}
const peakSignature = (v: PeakVariant) => `${v.times ? "n-times" : "plain"};${v.kind}${v.a ? `;a=${qKey(v.a)}` : ""}`;
const peakDifficulty = (v: PeakVariant): PracticeDifficulty => (v.kind === "sub" ? (v.times ? "medium" : "easy") : "advanced");

function buildPeak(v: PeakVariant, rng: SeededRandom): Built {
  const { times, kind } = v;
  const a = v.a ?? Qn(1);
  const sub = kind === "sub";
  const book = new Book();
  const c = (n: number) => (times ? n : 1);
  const fn = times ? H`nx^{n}(1-x)` : H`x^{n}(1-x)`;
  const d = sub ? mkDom(0, qv(a), true, true) : mkDom(0, 1, true, true);
  const domTex = interval(d, "0", sub ? qL(a) : "1");
  const aL = qL(a);
  const om: Q = Qn(a.d - a.n, a.d);
  const n0 = a.n / (a.d - a.n);
  const peakValue = (n: number) => c(n) * (n / (n + 1)) ** n * (1 / (n + 1));
  const model: Model = {
    value: (n, x) => c(n) * x ** n * (1 - x),
    limit: () => 0,
    domain: d,
    uniform: !times || sub,
    sup: sub ? (n) => c(n) * qv(a) ** n * (1 - qv(a)) : peakValue,
    ...(sub ? { nBound: n0 + 1 } : {}),
    ...(!times || sub ? {} : { gap: 1 / Math.E }),
    samples: sub ? [0, qv(a) / 2, qv(a)] : [0, 0.5, 0.9, 1],
    // the peak x_n = n/(n+1) is narrow: scan it exactly
    ...(sub ? {} : { extra: (n: number) => [n / (n + 1)] }),
  };
  const cn = times ? "n" : "";

  // ---- step 1
  const limitSlot = chipSlot(book, rng, "pk1a", ok("0", nxUnit(() => 0)), [
    bad("1-x", nxUnit((n, x) => 1 - x), H`$x^n\to0$ ו־$(1-x)$ חסום, ולכן המכפלה שואפת ל־$0$.`),
    bad("x", nxUnit((n, x) => x), H`$x^n\to0$ לכל $0\le x<1$, ולכן הגבול הוא $0$.`),
    bad("\\tfrac{1}{e}", nxUnit(() => 1 / Math.E), H`זה גבול גובה הפסגה, לא הגבול הנקודתי: בכל נקודה קבועה $f_n(x)\to0$.`),
  ]);
  const s1 = step({
    id: "pk-1", title: STEP_LIMIT_TITLE,
    prompt: H`חשבו את הגבול הנקודתי $f(x)=\lim_{n\to\infty}f_n(x)$ ${sub ? "בכל נקודה של הקטע" : "לכל $0\\le x<1$ (וב־$x=1$ מתקיים $f_n(1)=0$)"}.`,
    parts: [slotsPart(template("pk-1-lim", [L(H`f(x)=`), S("pk1a")], [limitSlot]))],
    hints: [times ? H`$nx^n\to0$ ל־$0\le x<1$, כי $x^n$ דועך מהר יותר מ־$n$ שגדל.` : H`$x^n\to0$ ל־$0\le x<1$.`],
    solvedNote: H`$f\equiv0$ בכל התחום.`,
  });

  const verdictPrompt = H`האם $f_n\to f$ במידה שווה ${inDom(d, domTex)}?`;
  let steps: PracticeStep[];
  if (!sub) {
    const xnSlot = chipSlot(book, rng, "pk2a", ok("\\frac{n}{n+1}", seq((n) => n / (n + 1))), [
      bad("\\frac{1}{n+1}", seq((n) => 1 / (n + 1)), H`זה $1-x_n$ ולא $x_n$.`),
      bad("\\frac{n+1}{n}", seq((n) => (n + 1) / n), H`זה גדול מ־$1$, ולכן מחוץ לקטע.`),
      bad("\\frac{n-1}{n}", seq((n) => (n - 1) / n), H`המשוואה $n=(n+1)x$ נותנת $x=\frac{n}{n+1}$.`),
      bad("\\frac{1}{2}", seq(() => 0.5), H`$x_n$ תלויה ב־$n$.`),
    ]);
    const s2 = step({
      id: "pk-2", title: "נקודה חשודה לקיצון",
      prompt: H`$f_n'(x)=${cn}x^{n-1}\left(n-(n+1)x\right)$. מצאו את הנקודה החשודה לקיצון $x_n$ ב־$(0,1)$.`,
      parts: [slotsPart(template("pk-2-xn", [L(H`f_n'(x_n)=0\ \Longrightarrow\ x_n=`), S("pk2a")], [xnSlot]))],
      hints: [H`$n-(n+1)x=0$.`],
      solvedNote: H`$x_n=\frac{n}{n+1}$; $f_n$ עולה לפניה ויורדת אחריה.`,
    });
    const valueSlot = (() => {
      const correct = times
        ? ok("\\left(\\frac{n}{n+1}\\right)^{n+1}", seq((n) => (n / (n + 1)) ** (n + 1)))
        : ok("\\frac{n^{n}}{(n+1)^{n+1}}", seq((n) => n ** n / (n + 1) ** (n + 1)));
      const wrongs: Chip[] = times
        ? [
          bad("\\frac{n^{n}}{(n+1)^{n+1}}", seq((n) => n ** n / (n + 1) ** (n + 1)), "שכחתם את הגורם $n$ שבסדרה."),
          bad("\\left(\\frac{n}{n+1}\\right)^{n}", seq((n) => (n / (n + 1)) ** n), "שכחתם את הגורם $1-x_n=\\frac{1}{n+1}$ (ב־$n$ מוכפל: $\\frac{n}{n+1}$)."),
          bad("\\frac{n}{n+1}", seq((n) => n / (n + 1)), H`$f_n(x_n)=n\,x_n^n\,(1-x_n)$, לא $x_n$ עצמה.`),
        ]
        : [
          bad("\\left(\\frac{n}{n+1}\\right)^{n}", seq((n) => (n / (n + 1)) ** n), H`שכחתם את הגורם $1-x_n=\frac{1}{n+1}$.`),
          bad("\\frac{1}{n+1}", seq((n) => 1 / (n + 1)), H`שכחתם את הגורם $x_n^n=\left(\frac{n}{n+1}\right)^n$.`),
          bad("\\frac{n^{n+1}}{(n+1)^{n+1}}", seq((n) => n ** (n + 1) / (n + 1) ** (n + 1)), H`$x_n^n(1-x_n)=\frac{n^n}{(n+1)^n}\cdot\frac{1}{n+1}$, בלי גורם $n$ נוסף.`),
        ];
      return chipSlot(book, rng, "pk3c", correct, wrongs);
    })();
    const endSlot = (id: string, point: string) => chipSlot(book, rng, id, ok("0", K(0)), [
      bad("1", K(1), H`$f_n(${point})=${point}^n\cdot(1-${point})\cdot ${times ? "n" : "1"}=0$.`),
      bad("\\tfrac{1}{e}", K(1 / Math.E), H`בקצה $x=${point}$ אחד הגורמים מתאפס.`),
      bad("\\infty", K(Infinity), H`בקצה $x=${point}$ אחד הגורמים מתאפס.`),
    ]);
    const rows: CandidateRow[] = [
      { id: "end0", isMaximum: false, template: template("pk-3-end0", [L(H`f_n(0)=`), S("pk3a")], [endSlot("pk3a", "0")]) },
      { id: "end1", isMaximum: false, template: template("pk-3-end1", [L(H`f_n(1)=`), S("pk3b")], [endSlot("pk3b", "1")]) },
      { id: "peak", isMaximum: true, template: template("pk-3-peak", [L(H`f_n(x_n)=`), S("pk3c")], [valueSlot]) },
    ];
    const s3 = step({
      id: "pk-3", title: "מועמדים למקסימום",
      prompt: H`חשבו את $f_n$ בשני הקצוות ובנקודה $x_n=\frac{n}{n+1}$, וסמנו את המועמד שנותן את המקסימום (הפער הוא $f_n$, כי $f=0$).`,
      parts: [tablePart("pk-3-table", rows, { end0: "קצה", end1: "קצה", peak: "נקודה חשודה לקיצון" },
        "הקצוות נותנים $0$, ו־$f_n>0$ בפנים: המקסימום בנקודה החשודה לקיצון.")],
      hints: [H`$f_n\ge0$ ו־$f_n=0$ בשני הקצוות, ולכן המקסימום בפנים.`],
      solvedNote: H`$M_n=f_n(x_n)=${times ? "\\left(\\frac{n}{n+1}\\right)^{n+1}" : "\\frac{n^n}{(n+1)^{n+1}}"}$.`,
    });
    const limSlot = times
      ? chipSlot(book, rng, "pk4a", ok("\\tfrac{1}{e}", K(1 / Math.E)), [
        bad("0", K(0), H`$M_n=\left(\frac{n}{n+1}\right)^{n+1}=\left(1+\frac1n\right)^{-(n+1)}\to e^{-1}$, שאינו $0$.`),
        bad("1", K(1), H`$\left(1+\frac1n\right)^{n}\to e$, ולכן $M_n\to\frac1e$ ולא $1$.`),
        bad("e", K(Math.E), H`$M_n=\left(1+\frac1n\right)^{-(n+1)}\to e^{-1}$, לא $e$.`),
        bad("\\tfrac{1}{2}", K(0.5), H`$M_n\to e^{-1}$, שאינו $\frac12$.`),
      ])
      : chipSlot(book, rng, "pk4a", ok("0", K(0)), [
        bad("\\tfrac{1}{e}", K(1 / Math.E), H`$M_n=\frac{n^n}{(n+1)^{n+1}}<\frac{1}{n+1}\to0$.`),
        bad("1", K(1), H`$M_n<\frac{1}{n+1}\to0$.`),
        bad("\\tfrac{1}{2}", K(0.5), H`$M_n<\frac{1}{n+1}\to0$.`),
      ]);
    const s4 = step({
      id: "pk-4", title: H`הגבול של $M_n$`,
      prompt: H`חשבו את $\lim_{n\to\infty}M_n$.`,
      parts: [slotsPart(template("pk-4-lim", [L(H`\lim_{n\to\infty}M_n=`), S("pk4a")], [limSlot]))],
      hints: times
        ? [H`$\left(\frac{n}{n+1}\right)^{n+1}=\frac{1}{\left(1+\frac1n\right)^{n+1}}$, ו־$\left(1+\frac1n\right)^n\to e$.`]
        : [H`$M_n=\frac{1}{n+1}\left(\frac{n}{n+1}\right)^n\le\frac{1}{n+1}$.`],
      solvedNote: times ? H`$M_n\to\frac1e$.` : H`$M_n\to0$.`,
    });
    const s5 = verdictStep(rng, "pk-5", verdictPrompt, times
      ? [
        good("not-uniform", H`לא במידה שווה: $M_n\to\frac1e\ne0$.`),
        wrong("uniform-pw", H`כן, כי $f_n(x)\to0$ בכל נקודה, וגם $f_n(1)=0$.`, "התכנסות נקודתית אינה מספיקה."),
        wrong("uniform-edge", H`כן, כי הפסגה $x_n\to1$ ושם $f_n(1)=0$.`, H`הגובה של הפסגה אינו שואף ל־$0$: $M_n\to\frac1e$.`),
      ]
      : [
        good("uniform", H`כן: $M_n=\frac{n^n}{(n+1)^{n+1}}\to0$.`),
        wrong("moves", H`לא, כי הפסגה $x_n=\frac{n}{n+1}$ זזה עם $n$.`, "מבחן הסופרמום בודק את גובה הפסגה ולא את מיקומה: פסגה שנעה אך שגובהה שואף ל־$0$ אינה מפריעה."),
        wrong("sharp", H`לא, כי $f_n$ מתקרבת ל־$0$ רק נקודתית.`, H`ב־$[0,1]$ מתקיים $M_n\to0$, ולכן ההתכנסות במידה שווה.`),
      ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    times ? H`$M_n\not\to0$: ההתכנסות אינה במידה שווה.` : H`$M_n\to0$: ההתכנסות במידה שווה.`,
    times
      ? H`$f=0$. $f_n'=nx^{n-1}(n-(n+1)x)$ מתאפסת ב־$(0,1)$ רק ב־$x_n=\frac{n}{n+1}$, ו־$f_n(0)=f_n(1)=0$. לכן $M_n=f_n(x_n)=\left(\frac{n}{n+1}\right)^{n+1}\to\frac1e\ne0$, ולפי מבחן הסופרמום ההתכנסות אינה במידה שווה.`
      : H`$f=0$. $f_n'=x^{n-1}(n-(n+1)x)$ מתאפסת ב־$(0,1)$ רק ב־$x_n=\frac{n}{n+1}$, ו־$f_n(0)=f_n(1)=0$. לכן $M_n=f_n(x_n)=\frac{n^n}{(n+1)^{n+1}}<\frac1{n+1}\to0$, ולפי מבחן הסופרמום ההתכנסות במידה שווה.`);
    steps = [s1, s2, s3, s4, s5];
  } else {
    const s2 = step({
      id: "pk-2", title: "היכן המקסימום",
      prompt: H`$f_n'(x)=${cn}x^{n-1}\left(n-(n+1)x\right)$. סמנו את הנימוקים הנדרשים לכך ש־$M_n=f_n(${aL})$ (מ־$n$ מסוים).`,
      parts: [checklistPart("pk-2-why", shuffle(rng, [
        must("inc", H`לפי משפט לגרנז', $f_n'(x)>0$ ל־$0<x<\frac{n}{n+1}$, ולכן $f_n$ עולה ב־$\left[0,\frac{n}{n+1}\right]$.`),
        must("inside", H`ל־$n>${n0}$ מתקיים $${aL}<\frac{n}{n+1}$, ולכן $f_n$ עולה ב־$[0,${aL}]$ והמקסימום בקצה הימני.`),
        must("diff", H`$f=0$, ולכן $\lvert f_n-f\rvert=f_n\ge0$.`),
        extra("bound", H`$0\le f_n(x)\le ${cn}x^n\le ${cn}${qPow(a, "n")}$ בקטע.`, "נכון, ומביא למסקנה גם הוא; כאן הסופרמום מחושב במדויק."),
        nope("peak-in", H`הנקודה החשודה $x_n=\frac{n}{n+1}$ שייכת לקטע לכל $n$.`, H`$x_n\to1$, ולכן מ־$n$ מסוים $x_n>${aL}$: הנקודה החשודה מחוץ לקטע.`),
        nope("dec", H`$f_n$ יורדת ב־$[0,${aL}]$.`, H`$f_n'(x)>0$ בקטע, ולכן $f_n$ עולה.`),
      ]))],
      hints: [H`סימן $f_n'$ הוא סימן $n-(n+1)x$.`],
      solvedNote: H`$f_n$ עולה בקטע (מ־$n>${n0}$), ולכן $M_n=f_n(${aL})$.`,
    });
    const mnL = H`${qL(om)}${times ? "\\,n" : ""}${qPow(a, "n")}`;
    const mnWrongs: Chip[] = [
      bad(`${times ? "n" : ""}${qPow(a, "n")}`, seq((n) => c(n) * qv(a) ** n), H`שכחתם את הגורם $1-x=${qL(om)}$ ב־$x=${aL}$.`),
      bad(qL(om), K(qv(om)), H`שכחתם את הגורם $${times ? "n" : ""}x^n=${times ? "n" : ""}${qPow(a, "n")}$.`),
      bad(times ? "\\left(\\frac{n}{n+1}\\right)^{n+1}" : "\\frac{n^{n}}{(n+1)^{n+1}}", seq((n) => (times ? (n / (n + 1)) ** (n + 1) : n ** n / (n + 1) ** (n + 1))), H`זה הערך בנקודה $x_n$, שמחוץ לקטע מ־$n$ מסוים.`),
      bad(H`${qL(om)}${times ? "\\,n" : ""}${qPow(a, "2n")}`, seq((n) => qv(om) * c(n) * qv(a) ** (2 * n)), H`בהצבה $x=${aL}$ מקבלים $x^n=${qPow(a, "n")}$ ולא $x^{2n}$.`),
    ];
    const s3 = step({
      id: "pk-3", title: H`חישוב $M_n$ וגבולו`,
      prompt: H`כתבו את $M_n=f_n(${aL})$ וחשבו את גבולו.`,
      parts: [slotsPart(template("pk-3-mn", [L(H`M_n=`), S("pk3a"), L(H`\xrightarrow[n\to\infty]{}`), S("pk3b")], [
        chipSlot(book, rng, "pk3a", ok(mnL, seq((n) => c(n) * qv(a) ** n * qv(om))), mnWrongs),
        chipSlot(book, rng, "pk3b", ok("0", K(0)), times
          ? [
            bad("\\tfrac{1}{e}", K(1 / Math.E), H`זה גבול הסופרמום ב־$[0,1]$; בקטע $[0,${aL}]$ מתקיים $n${qPow(a, "n")}\to0$.`),
            bad("\\infty", K(Infinity), H`$${qPow(a, "n")}$ דועך אקספוננציאלית ומנצח את הגורם $n$.`),
            bad(H`${qL(om)}`, K(qv(om)), H`הביטוי כולו שואף ל־$0$, כי $n${qPow(a, "n")}\to0$.`),
          ]
          : [
            bad(H`${qL(om)}`, K(qv(om)), H`$${qPow(a, "n")}\to0$, ולכן הביטוי כולו שואף ל־$0$.`),
            bad("\\tfrac{1}{e}", K(1 / Math.E), H`זה גבול הסופרמום של $nx^n(1-x)$, לא של הסדרה הנוכחית.`),
            bad("1", K(1), H`$${qPow(a, "n")}\to0$ כי $${aL}<1$.`),
          ]),
      ]))],
      hints: [H`הציבו $x=${aL}$ בקצה הימני. $${qPow(a, "n")}\to0$ ${times ? "ומנצח את הגורם $n$" : ""}.`],
      solvedNote: H`$M_n=${mnL}\to0$.`,
    });
    const s4 = verdictStep(rng, "pk-4", verdictPrompt, [
      good("uniform", H`כן: $M_n=${mnL}\to0$.`),
      wrong("not-1", times ? H`לא, כי ב־$[0,1]$ ההתכנסות אינה במידה שווה ($M_n\to\frac1e$).` : H`לא, כי הפסגה $x_n=\frac{n}{n+1}$ זזה עם $n$.`,
        times ? H`סוג ההתכנסות תלוי בתחום: הקטע $[0,${aL}]$ אינו מגיע לפסגה $x_n\to1$.` : "מבחן הסופרמום בודק את גובה הפסגה; כאן הפסגה מחוץ לקטע מ־$n$ מסוים."),
      wrong("not-pos", H`לא, כי $M_n>0$ לכל $n$.`, H`חיוביות $M_n$ אינה מספיקה: מה שחשוב הוא אם $M_n\to0$.`),
    ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    H`$M_n\to0$: ההתכנסות במידה שווה.`,
    H`$f=0$. ל־$n>${n0}$ מתקיים $${aL}<\frac{n}{n+1}$, ו־$f_n$ עולה ב־$[0,${aL}]$, ולכן $M_n=f_n(${aL})=${mnL}\to0$. לפי מבחן הסופרמום ההתכנסות במידה שווה.`);
    steps = [s1, s2, s3, s4];
  }

  const view = autoView(model, 0, sub ? qv(a) * 1.15 : 1.05);
  const plot = sub ? plotOf(model, view, () => qv(a), "הקצה הימני של הקטע") : plotOf(model, view, (n) => n / (n + 1), "הנקודה החשודה לקיצון");
  return {
    book, model,
    exercise: finishExercise({
      id: PEAK_ID, signature: peakSignature(v), difficulty: peakDifficulty(v),
      title: times ? "פסגה שגובהה אינו דועך" : "פסגה שגובהה דועך",
      statement: statementOf(fn, d, domTex), formula: formulaOf(fn, domTex), steps, book, plot,
    }),
  };
}

export const PEAK_POWER = makeFamily<PeakVariant>({
  id: PEAK_ID,
  grid: peakGrid,
  kindOf: (v) => `${v.times ? "t" : "p"}${v.kind}`,
  difficulty: peakDifficulty,
  signature: peakSignature,
  build: buildPeak,
});

// =============================================================================================
// The registry
// =============================================================================================

/** Every family of the topic, in the order of the specification. */
export const UNIFORM_FAMILIES = [
  LN_POWER, RATIO_POWER, COS_POWER, SIN_ROOT, DIFF_QUOTIENT, ONE_MINUS_COS,
  POLY_QUOTIENT, ARCTAN_NX, EXP_DECAY, SQRT_SMOOTHING, PEAK_POWER,
] as const;
