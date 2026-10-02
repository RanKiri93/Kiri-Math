/**
 * Five families of the topic "continuity" (רציפות הגבול) of the summary practice. They revolve around the
 * continuity theorem (a uniform limit of continuous functions is continuous) and its companions, with
 * f_n defined piecewise, so the limit may jump or be unbounded:
 *
 *   cont-unbounded   (n+s)^{p+1}x then x^{-p}; min{n, 1/x}, min{n, 1/sqrt(x)}, min{n, ln(1/x)}   unbounded limit of bounded f_n
 *   cont-ramp        0, then h n (x - a), then h; the two-sided ramp h max(-1, min(1, n x))        Heaviside-type limit
 *   cont-moving-peak tent / bump of height h, h/n or h/sqrt(n) with a moving peak                  continuous limit, sup at the peak
 *   cont-floor       c floor(n x)/n and c floor(n x)/n^2                                           discontinuous f_n
 *   cont-indicator   h on [0, 1/n] and h at the single point x = 1/n                               discontinuous f_n, the theorem is silent
 *
 * Specification: docs/question-families/continuity-practice.md. Pure TypeScript, no React. Displayed numbers are
 * exact (rationals; e only inside LaTeX); floats appear in the numeric self-check only. Every instance carries a
 * `Model` (numeric f_n, f, domain, verdict, claimed supremum / gap / moving point) that the generator checks with
 * the shared `checkModel` (brute-force supremum, pointwise limit, witness) before the exercise is returned.
 */
import { L, S, checklistPart, choicePart, slot, slotsPart, tablePart, template } from "../math/guidedSteps";
import type { CandidateRow, ChecklistItem, SlotSpec, TokenId, TokenLabel } from "../math/supremumTypes";
import type { SeededRandom } from "../../constant-coefficients-euler/practice/random";
import { checkModel, nounOf, type Model } from "./uniformFamilies";
import type { PracticeDifficulty, PracticeExercise, PracticeFamily, PracticePlotSpec, PracticeStep } from "./practiceTypes";

const H = String.raw;

// ---------------------------------------------------------------------------------------------
// Rationals, domains and Hebrew nouns
// ---------------------------------------------------------------------------------------------

/** A rational [numerator, denominator] (the numerator may be negative). */
type Q = [number, number];
const q = (n: number, d = 1): Q => { const g = gcd(n, d) || 1; return [n / g, d / g]; };
const qv = (x: Q) => x[0] / x[1];
const qKey = (x: Q) => (x[1] === 1 ? String(x[0]) : `${x[0]}/${x[1]}`);
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
/** Inline LaTeX of a rational: "2", "-1" or "\tfrac{2}{3}". */
const qL = (x: Q) => (x[1] === 1 ? String(x[0]) : `\\tfrac{${x[0]}}{${x[1]}}`);
/** The reduced fraction p/d as LaTeX: fr(2, 4) = \tfrac{1}{2}, fr(4, 2) = 2. */
const fr = (p: number, d: number) => { const g = gcd(p, d); return d / g === 1 ? String(p / g) : `\\tfrac{${p / g}}{${d / g}}`; };
/** The reduced fraction p/(d n^k) with a LaTeX power of n: fracN(2, 4, "n") = \frac{1}{2n}, fracN(4, 2, "n") = \frac{2}{n}. */
const fracN = (p: number, d: number, den: string) => { const g = gcd(p, d); return `\\frac{${p / g}}{${d / g === 1 ? "" : d / g}${den}}`; };
/** An integer constant glued to the next factor: co(2, "n") = "2n", co(1, "n") = "n". */
const co = (c: number, rest: string) => (c === 1 ? rest : `${c}${rest}`);

type Dom = PracticePlotSpec["domain"];
const mkDom = (left: number, right: number, leftClosed: boolean, rightClosed: boolean): Dom => ({ left, right, leftClosed, rightClosed });
const REAL_INF = "\\infty";
/** An interval from the LaTeX of its endpoints, brackets following the closedness. */
const interval = (d: Dom, leftTex: string, rightTex: string) =>
  `\\left${d.leftClosed ? "[" : "("}${leftTex},${rightTex}\\right${d.rightClosed ? "]" : ")"}`;
/** "בקטע $[0,1]$", "בקרן $[0,\infty)$". */
const inDom = (d: Dom, tex: string) => H`ב${nounOf(d)} $${tex}$`;

function inDomain(d: Dom, x: number): boolean {
  return (x > d.left || (x === d.left && d.leftClosed)) && (x < d.right || (x === d.right && d.rightClosed));
}

/** The domain from rational endpoints (right = null: a ray), with its LaTeX. */
function domainOf(left: Q, right: Q | null, leftClosed: boolean, rightClosed: boolean): { dom: Dom; tex: string } {
  const dom = mkDom(qv(left), right ? qv(right) : Infinity, leftClosed, right ? rightClosed : false);
  return { dom, tex: interval(dom, qL(left), right ? qL(right) : REAL_INF) };
}

/** Sample points of a domain that really lie in it (the pointwise limit is checked there). */
function samplesIn(dom: Dom, candidates: number[]): number[] {
  const pts = candidates.filter((x) => Number.isFinite(x) && inDomain(dom, x));
  return [...new Set(pts)];
}

// ---------------------------------------------------------------------------------------------
// Plot windows
// ---------------------------------------------------------------------------------------------

/** A plotting window from the model: f_n (n = 1, 2, 5, 40) and f over the visible part of the domain, values above `yTop` clipped. */
function windowOf(m: Model, xMin: number, xMax: number, yTop = Infinity, ns: number[] = [1, 2, 5, 40]): PracticePlotSpec["view"] {
  const lo = Math.max(xMin, m.domain.left);
  const hi = Math.min(xMax, m.domain.right);
  let min = 0;
  let max = 0;
  for (const n of ns) for (let i = 0; i <= 400; i += 1) {
    const x = lo + ((hi - lo) * i) / 400;
    for (const y of [m.value(n, x), m.limit(x)]) if (Number.isFinite(y) && y <= yTop) { min = Math.min(min, y); max = Math.max(max, y); }
  }
  const span = max - min || 1;
  return { xMin, xMax, yMin: min - 0.1 * span, yMax: max + 0.12 * span };
}

// ---------------------------------------------------------------------------------------------
// Chips with distractors (the same mechanism as the pointwise families)
// ---------------------------------------------------------------------------------------------

export type Chip = { latex: string; sig: number[]; diag?: string };
export type SlotRecord = { token: TokenId; latex: string; sig: number[]; correct: boolean };

export class Book {
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
/** Probes of an expression in x only. */
const PROBE_X = [0.3, 0.7, 1.4, 2.5];
const xs = (f: (x: number) => number) => PROBE_X.map(f);
/** (n, x) probes of expressions in both variables. */
const NX: [number, number][] = [[3, 0.7], [10, 1.9], [30, 1.3], [7, 0.4], [20, 2.6]];
const nx = (f: (n: number, x: number) => number) => NX.map(([n, x]) => f(n, x));

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
 * A one-slot chip set: the correct chip plus up to three distinct wrong ones. A wrong chip that equals the
 * correct one numerically is dropped. With `bound` (the numeric target at the probes) the slot is an upper
 * bound: the correct chip must dominate the target everywhere, and a wrong chip must fail at some probe (a
 * weaker but true bound would not be wrong). Throws when fewer than two wrong chips remain.
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

const STEP_LIMIT_TITLE = "הגבול הנקודתי";
const STEP_VERDICT_TITLE = "המסקנה";
const THEOREM_NAME = "משפט הרציפות";

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
  /** Variants of one kind share a draw weight. */
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
    topic: "continuity",
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
    topic: "continuity",
    difficulty: spec.difficulty,
    title: spec.title,
    statement: spec.statement,
    formulaLatex: spec.formula,
    steps: spec.steps,
    tokens: spec.book.tokens,
    plot: spec.plot,
  };
}

/** Shared tail of every statement: names the limit f and the supremum M_n used by the steps. */
const SYMBOLS_NOTE = H`נסמן ב־$f$ את הגבול הנקודתי, וב־$M_n=\sup\lvert f_n-f\rvert$ את הסופרמום של הפער בתחום.`;
const statementOf = (d: Dom, tex: string, what = "המוגדרת למטה") => H`בדקו האם הסדרה $f_n$, ${what}, מתכנסת במידה שווה ${inDom(d, tex)}. ${SYMBOLS_NOTE}`;
/** A piecewise definition: rows of [expression, condition] in a `cases` environment, followed by the domain. */
const casesOf = (rows: [string, string][], tex: string) =>
  H`f_n(x)=\begin{cases}${rows.map(([e, c]) => `${e} & ${c}`).join(" \\\\ ")}\end{cases}\qquad x\in${tex}`;

// =============================================================================================
// 1. Ramps: 0, then h n (x - a), then h. The limit jumps at a (Heaviside type).
// =============================================================================================

type RampKind = "through" | "open" | "far";
export type RampVariant = {
  shape: "one" | "two";
  kind: RampKind;
  h: 1 | 2 | 3;
  /** The point where the ramp starts (one-sided ramps; 0 for two-sided). */
  a: Q;
  /** For kind "far": the domain starts at a + c, away from the ramp. */
  c?: Q;
  left: Q;
  /** null: the domain is a ray. */
  right: Q | null;
  leftClosed: boolean;
};

const RAMP_ID = "cont-ramp";

function rampGrid(): RampVariant[] {
  const out: RampVariant[] = [];
  for (const h of [1, 2, 3] as const) {
    for (const [a, left, right] of [[q(0), q(-1), q(1)], [q(1, 2), q(0), q(1)], [q(1), q(0), q(2)], [q(0), q(-1), null]] as [Q, Q, Q | null][]) {
      out.push({ shape: "one", kind: "through", h, a, left, right, leftClosed: true });
    }
    for (const [a, right] of [[q(0), q(1)], [q(1, 2), q(1)], [q(1), q(2)]] as [Q, Q][]) {
      out.push({ shape: "one", kind: "open", h, a, left: a, right, leftClosed: false });
    }
    for (const [a, c, right] of [[q(0), q(1, 2), q(2)], [q(0), q(1, 4), q(1)], [q(1, 2), q(1, 4), q(1)], [q(1), q(1, 2), q(2)]] as [Q, Q, Q][]) {
      out.push({ shape: "one", kind: "far", h, a, c, left: q(a[0] * c[1] + c[0] * a[1], a[1] * c[1]), right, leftClosed: true });
    }
    for (const side of [1, 2]) out.push({ shape: "two", kind: "through", h, a: q(0), left: q(-side), right: q(side), leftClosed: true });
  }
  return out;
}

const rampSignature = (v: RampVariant) =>
  `${v.shape};${v.kind};h=${v.h};a=${qKey(v.a)};I=${qKey(v.left)}..${v.right ? qKey(v.right) : "inf"}`;
const rampDifficulty = (v: RampVariant): PracticeDifficulty =>
  v.kind === "open" ? "advanced" : v.kind === "far" || v.shape === "two" ? "medium" : "easy";

function buildRamp(v: RampVariant, rng: SeededRandom): Built {
  const { h, kind, shape } = v;
  const two = shape === "two";
  const book = new Book();
  const a = qv(v.a);
  const { dom, tex: domTex } = domainOf(v.left, v.right, v.leftClosed, true);
  const A = qL(v.a);
  const hL = String(h);
  const hn = co(h, "n");
  const halfH = fr(h, 2);
  const shifted = v.a[0] === 0 ? "x" : `\\left(x-${A}\\right)`;
  const mid = two || v.a[0] === 0 ? `${hn}x` : `${hn}${shifted}`;
  /** a + t as LaTeX. */
  const aPlus = (t: string) => (v.a[0] === 0 ? t : `${A}+${t}`);
  const endTex = aPlus(H`\frac{1}{n}`);
  const midTex = aPlus(H`\frac{1}{2n}`);
  const c = v.c ?? q(1, 2);
  const cv = qv(c);
  const nFar = Math.round(1 / cv);
  const farLeft = qL(v.left);

  const model: Model = {
    value: two
      ? (n, x) => (x <= -1 / n ? -h : x >= 1 / n ? h : h * n * x)
      : (n, x) => (x <= a ? 0 : x >= a + 1 / n ? h : h * n * (x - a)),
    limit: two ? (x) => (x > 0 ? h : x < 0 ? -h : 0) : (x) => (x > a ? h : 0),
    domain: dom,
    uniform: kind === "far",
    ...(kind === "far" ? { sup: () => 0, nBound: nFar } : { sup: () => h, gap: h / 2, witness: { x: (n: number) => a + 1 / (2 * n), diff: () => h / 2 } }),
    samples: samplesIn(dom, [qv(v.left), a, a + 0.3, a + 0.6, v.right ? qv(v.right) : NaN]),
    special: [a],
    extra: (n) => [a + 1 / (2 * n), a + 1 / n],
    ...(v.right ? {} : { scanTo: () => 4 }),
  };

  const fnCases = two
    ? casesOf([[`-${hL}`, H`x\le-\frac{1}{n}`], [mid, H`-\frac{1}{n}\le x\le\frac{1}{n}`], [hL, H`x\ge\frac{1}{n}`]], domTex)
    : casesOf([["0", H`x\le ${A}`], [mid, H`${A}\le x\le ${endTex}`], [hL, H`x\ge ${endTex}`]], domTex);

  // ---- step 1: continuity of f_n at the two joints
  const joint = (id: string, lead: string, target: Chip, wrongs: Chip[]) => slotsPart(template(id, [L(lead), S(id)], [chipSlot(book, rng, id, target, wrongs)]));
  const s1Parts = two
    ? [
      joint("rp1a", H`x=-\frac{1}{n}:\quad ${mid}=`, ok(`-${hL}`, K(-h)), [
        bad(hL, K(h), H`בנקודה $x=-\frac{1}{n}$ ל־$x$ ערך שלילי, ולכן גם הביטוי $${mid}$ שלילי.`),
        bad("0", K(0), H`הציבו $x=-\frac{1}{n}$ ב־$${mid}$: מקבלים $-${hL}$.`),
        bad(`-${hn}`, seq((n) => -h * n), H`$n\cdot\frac{1}{n}=1$: הגורמים $n$ מצטמצמים.`),
        bad(H`-\frac{${hL}}{n}`, seq((n) => -h / n), H`הציבו $x=-\frac{1}{n}$: $n\cdot\left(-\frac{1}{n}\right)=-1$.`),
      ]),
      joint("rp1b", H`x=\frac{1}{n}:\quad ${mid}=`, ok(hL, K(h)), [
        bad(`-${hL}`, K(-h), H`בנקודה $x=\frac{1}{n}$ ל־$x$ ערך חיובי.`),
        bad("0", K(0), H`הציבו $x=\frac{1}{n}$ ב־$${mid}$: מקבלים $${hL}$.`),
        bad(hn, seq((n) => h * n), H`$n\cdot\frac{1}{n}=1$: הגורמים $n$ מצטמצמים.`),
        bad(fracN(h, 1, "n"), seq((n) => h / n), H`הציבו $x=\frac{1}{n}$: $n\cdot\frac{1}{n}=1$.`),
      ]),
    ]
    : [
      joint("rp1a", H`x=${A}:\quad ${mid}=`, ok("0", K(0)), [
        bad(hL, K(h), H`זה הערך בנקודה $x=${endTex}$. ב־$x=${A}$ הגורם $x-${A}$ מתאפס.`),
        bad(hn, seq((n) => h * n), H`הציבו $x=${A}$: הגורם $x-${A}$ מתאפס.`),
        bad(fracN(h, 1, "n"), seq((n) => h / n), H`הציבו $x=${A}$: הגורם $x-${A}$ מתאפס.`),
      ]),
      joint("rp1b", H`x=${endTex}:\quad ${mid}=`, ok(hL, K(h)), [
        bad("0", K(0), H`זה הערך בנקודה $x=${A}$. הציבו $x=${endTex}$, ואז $x-${A}=\frac{1}{n}$.`),
        bad(hn, seq((n) => h * n), H`$n\cdot\frac{1}{n}=1$: הגורמים $n$ מצטמצמים.`),
        bad(fracN(h, 1, "n"), seq((n) => h / n), H`$n\cdot\frac{1}{n}=1$, ולכן הערך הוא $${hL}$ ולא $${fracN(h, 1, "n")}$.`),
        bad(halfH, K(h / 2), H`זה הערך באמצע החלק העולה, $x=${midTex}$, לא בקצה הימני שלו.`),
      ]),
    ];
  const s1 = step({
    id: "rp-1", title: "רציפות $f_n$ בנקודות החיבור",
    prompt: H`כל $f_n$ מוגדרת בשלושה חלקים, ובכל חלק הביטוי רציף. חשבו את הערך של הביטוי האמצעי $${mid}$ בשתי נקודות החיבור, ובדקו שהוא מתחבר ללא קפיצה לשני החלקים האחרים.`,
    parts: s1Parts,
    hints: [two ? H`הציבו $x=\pm\frac{1}{n}$ בביטוי $${mid}$.` : H`הציבו את $x=${A}$ ואת $x=${endTex}$ בביטוי $${mid}$.`],
    solvedNote: two
      ? H`הביטוי האמצעי שווה ל־$-${hL}$ ו־$${hL}$ בנקודות החיבור, בדיוק כערכי החלקים האחרים, ולכן כל $f_n$ רציפה.`
      : H`הביטוי האמצעי שווה ל־$0$ ו־$${hL}$ בנקודות החיבור, בדיוק כערכי החלקים האחרים, ולכן כל $f_n$ רציפה.`,
  });

  // ---- step 2: the pointwise limit
  const limLine = (id: string, lead: string, target: Chip, wrongs: Chip[]) => joint(id, lead, target, wrongs);
  const infWrong = (why: string) => bad("\\infty", K(Infinity), why);
  let s2Parts;
  if (two) {
    s2Parts = [
      limLine("rp2a", H`x<0:\quad f(x)=`, ok(`-${hL}`, K(-h)), [bad("0", K(0), H`החל מ־$n$ מסוים $x<-\frac{1}{n}$, ואז $f_n(x)=-${hL}$.`), bad(hL, K(h), H`ל־$x<0$ הפונקציה $f_n$ שווה (החל מ־$n$ מסוים) ל־$-${hL}$.`), bad(`-${hn}`, seq((n) => -h * n), H`החל מ־$n$ מסוים $x<-\frac{1}{n}$, והחלק האמצעי כבר אינו רלוונטי.`)]),
      limLine("rp2b", H`x=0:\quad f(0)=`, ok("0", K(0)), [bad(hL, K(h), H`$f_n(0)=${hn}\cdot0=0$ לכל $n$.`), bad(`-${hL}`, K(-h), H`$f_n(0)=${hn}\cdot0=0$ לכל $n$.`), infWrong(H`$f_n(0)=0$ לכל $n$: סדרה קבועה.`)]),
      limLine("rp2c", H`x>0:\quad f(x)=`, ok(hL, K(h)), [bad("0", K(0), H`החל מ־$n$ מסוים $x>\frac{1}{n}$, ואז $f_n(x)=${hL}$.`), bad(`-${hL}`, K(-h), H`ל־$x>0$ הפונקציה $f_n$ שווה (החל מ־$n$ מסוים) ל־$${hL}$.`), bad(halfH, K(h / 2), H`זה הערך באמצע החלק העולה; ל־$x$ קבוע, החל מ־$n$ מסוים $x>\frac{1}{n}$.`)]),
    ];
  } else if (kind === "through") {
    s2Parts = [
      limLine("rp2a", H`x\le ${A}:\quad f(x)=`, ok("0", K(0)), [bad(hL, K(h), H`$f_n(x)=0$ לכל $x\le ${A}$ ולכל $n$.`), bad(hn, seq((n) => h * n), H`$f_n(x)=0$ לכל $x\le ${A}$ ולכל $n$.`), infWrong(H`$f_n(x)=0$ לכל $x\le ${A}$: סדרה קבועה.`)]),
      limLine("rp2b", H`x>${A}:\quad f(x)=`, ok(hL, K(h)), [bad("0", K(0), H`ל־$x>${A}$ קבוע, החל מ־$n$ מסוים $x\ge ${endTex}$, ואז $f_n(x)=${hL}$.`), bad(halfH, K(h / 2), H`זה הערך באמצע החלק העולה; ל־$x$ קבוע, החל מ־$n$ מסוים $x\ge ${endTex}$.`), infWrong(H`החל מ־$n$ מסוים $f_n(x)=${hL}$, ערך סופי.`)]),
    ];
  } else if (kind === "open") {
    s2Parts = [
      limLine("rp2a", H`${A}<x:\quad f(x)=`, ok(hL, K(h)), [bad("0", K(0), H`ל־$x>${A}$ קבוע, החל מ־$n$ מסוים $x\ge ${endTex}$, ואז $f_n(x)=${hL}$.`), bad(halfH, K(h / 2), H`זה הערך באמצע החלק העולה; ל־$x$ קבוע, החל מ־$n$ מסוים $x\ge ${endTex}$.`), infWrong(H`החל מ־$n$ מסוים $f_n(x)=${hL}$, ערך סופי.`)]),
    ];
  } else {
    s2Parts = [
      limLine("rp2a", H`x\ge ${farLeft}:\quad f(x)=`, ok(hL, K(h)), [bad("0", K(0), H`בתחום $x>${A}$, ו־$f_n(x)=${hL}$ ברגע ש־$x\ge ${endTex}$.`), bad(halfH, K(h / 2), H`זה הערך באמצע החלק העולה; ל־$x$ קבוע, החל מ־$n$ מסוים $x\ge ${endTex}$.`), infWrong(H`החל מ־$n$ מסוים $f_n(x)=${hL}$, ערך סופי.`)]),
    ];
  }
  const s2 = step({
    id: "rp-2", title: STEP_LIMIT_TITLE,
    prompt: H`חשבו את הגבול הנקודתי $f(x)=\lim_{n\to\infty}f_n(x)$ ${s2Parts.length > 1 ? "בכל אחד מחלקי התחום" : "בכל נקודה של התחום"}. ל־$x$ קבוע, באיזה חלק של ההגדרה נמצא $x$ כש־$n$ גדול?`,
    parts: s2Parts,
    hints: [H`התחילו מ־$n$ גדול כך ש־$\frac{1}{n}$ קטן מהמרחק של $x$ מ־${two ? "$0$" : `$${A}$`}.`],
    solvedNote: two
      ? H`$f(x)=-${hL}$ ל־$x<0$, $f(0)=0$ ו־$f(x)=${hL}$ ל־$x>0$.`
      : kind === "through" ? H`$f(x)=0$ ל־$x\le ${A}$ ו־$f(x)=${hL}$ ל־$x>${A}$.` : H`$f(x)=${hL}$ בכל נקודה של התחום.`,
  });

  const steps: PracticeStep[] = [];
  const verdictPrompt = H`האם $f_n\to f$ במידה שווה ${inDom(dom, domTex)}?`;
  const jumpAt = two ? "0" : A;
  const jumpText = two ? H`$f(0)=0$ אך $f$ שווה ל־$-${hL}$ משמאל ול־$${hL}$ מימין` : H`$f(${A})=0$ אך $\lim_{x\to${A}^+}f(x)=${hL}$`;

  if (kind === "through") {
    // ---- step 3: the continuity theorem
    const s3 = step({
      id: "rp-3", title: "מה מצדיק את המסקנה",
      prompt: "סמנו את כל הנימוקים הנדרשים כדי להסיק שההתכנסות אינה במידה שווה.",
      parts: [checklistPart("rp-3-why", shuffle(rng, [
        must("fn-cont", H`כל $f_n$ רציפה בתחום (שלושה חלקים רציפים שמתחברים ללא קפיצה).`),
        must("f-jump", H`הגבול $f$ אינו רציף ב־$x=${jumpAt}$: ${jumpText}.`),
        must("thm", H`${THEOREM_NAME}: גבול במידה שווה של פונקציות רציפות הוא פונקציה רציפה.`),
        extra("mono", H`כל $f_n$ אינה יורדת בתחום.`, "נכון, אך אינו משפיע על הטיעון."),
        nope("same-at", H`$f_n(${jumpAt})=f(${jumpAt})$ לכל $n$, ולכן הפער ליד $x=${jumpAt}$ שואף ל־$0$.`, H`הפער קטן ב־$x=${jumpAt}$ עצמה, אך לא בנקודות הקרובות אליה: ב־$x=${midTex}$ הוא גדול.`),
        nope("pw", H`הגבול הנקודתי קיים בכל נקודה של התחום, ולכן ההתכנסות במידה שווה.`, "קיום הגבול בכל נקודה הוא התכנסות נקודתית בלבד."),
        nope("width", H`החלק האמצעי מצטמצם לנקודה אחת כש־$n\to\infty$, ולכן ההתכנסות במידה שווה.`, H`רוחב החלק האמצעי שואף ל־$0$, אך הגובה שלו ($${hL}$) נשאר קבוע.`),
      ]))],
      hints: [H`${THEOREM_NAME} דורש: $f_n$ רציפות, והגבול במידה שווה. מה מוכיחים בשלילת המסקנה?`],
      solvedNote: H`$f_n$ רציפות ו־$f$ אינה רציפה: ההתכנסות אינה במידה שווה.`,
    });
    // ---- step 4: the explicit gap
    const xn = two ? H`\frac{1}{2n}` : midTex;
    const s4 = step({
      id: "rp-4", title: "הפער במפורש",
      prompt: H`נסמן $x_n=${xn}$ (אמצע החלק העולה). חשבו את $f_n(x_n)$ ואת הפער $\lvert f_n(x_n)-f(x_n)\rvert$.`,
      parts: [
        joint("rp4a", H`f_n(x_n)=`, ok(halfH, K(h / 2)), [
          bad(hL, K(h), H`זה הערך של $f$ ב־$x_n$, לא של $f_n$. הציבו $x=${xn}$ בביטוי $${mid}$.`),
          bad("0", K(0), H`ב־$x_n$ הפונקציה $f_n$ נמצאת בחלק האמצעי, ולא בחלק שבו היא מתאפסת.`),
          bad(fracN(h, 2, "n"), seq((n) => h / (2 * n)), H`$n\cdot\frac{1}{2n}=\frac12$: הגורם $n$ מצטמצם.`),
        ]),
        joint("rp4b", H`\lvert f_n(x_n)-f(x_n)\rvert=`, ok(halfH, K(h / 2)), [
          bad(hL, K(h), H`זה הערך של $f(x_n)$; הפער הוא $${hL}-${halfH}$.`),
          bad("0", K(0), H`$f(x_n)=${hL}$ ו־$f_n(x_n)=${halfH}$ שונים.`),
          bad(fracN(h, 2, "n"), seq((n) => h / (2 * n)), H`הפער אינו תלוי ב־$n$: $${hL}-${halfH}$.`),
        ]),
      ],
      hints: [H`$x_n>${jumpAt}$ ולכן $f(x_n)=${hL}$.`],
      solvedNote: H`$\lvert f_n(x_n)-f(x_n)\rvert=${halfH}$ לכל $n$, ולכן $M_n\ge ${halfH}$ ואינו שואף ל־$0$.`,
    });
    const s5 = verdictStep(rng, "rp-5", verdictPrompt, [
      good("not-uniform", H`לא: $f_n$ רציפות והגבול $f$ אינו רציף ב־$x=${jumpAt}$.`),
      wrong("uniform-pw", H`כן, כי $f_n(x)\to f(x)$ בכל נקודה.`, "התכנסות נקודתית אינה מספיקה."),
      wrong("uniform-small", H`כן, כי $f_n=f$ מחוץ לסביבה צרה של $x=${jumpAt}$, שרוחבה שואף ל־$0$.`, H`הפער בתוך הסביבה הצרה נשאר גדול: $M_n\ge ${halfH}$, ללא קשר לרוחבה.`),
    ], [H`אם הגבול אינו רציף והסדרה רציפה, אין התכנסות במידה שווה.`],
    H`$f_n\not\to f$ במידה שווה.`,
    H`כל $f_n$ רציפה בתחום; $f$ קופצת ב־$x=${jumpAt}$ (${jumpText}), ולכן אינה רציפה שם. לפי ${THEOREM_NAME}, גבול במידה שווה של פונקציות רציפות הוא רציף, ולכן ההתכנסות אינה במידה שווה. ישירות: ב־$x_n=${xn}$ הפער הוא $${halfH}$, ולכן $M_n\ge ${halfH}\not\to0$.`);
    steps.push(s1, s2, s3, s4, s5);
  } else if (kind === "open") {
    const s3 = step({
      id: "rp-3", title: H`האם ${THEOREM_NAME} מועיל?`,
      prompt: H`התחום אינו כולל את $x=${A}$, ושם הגבול $f=${hL}$ קבוע. האם אפשר להסיק מ${THEOREM_NAME} שההתכנסות אינה במידה שווה?`,
      parts: [choicePart("rp-3-cont", "בחרו.", shuffle(rng, [
        good("no-help", H`לא: $f=${hL}$ רציפה בתחום, ולכן אין סתירה למשפט. צריך לבדוק את $M_n$ ישירות.`),
        wrong("yes-jump", H`כן, כי $f$ אינה רציפה ב־$x=${A}$.`, H`הנקודה $x=${A}$ אינה בתחום; ב־$(${A},${qL(v.right!)}]$ הפונקציה $f$ קבועה.`),
        wrong("yes-fn", H`כן, כי $f_n$ רציפות, ולכן גם הגבול $f$ רציף.`, "המשפט דורש התכנסות במידה שווה כהנחה; כאן זו בדיוק השאלה."),
      ]))],
      hints: [H`${THEOREM_NAME}: אם $f_n$ רציפות והגבול אינו רציף, אין התכנסות במידה שווה. האם $f$ אינה רציפה בתחום?`],
      solvedNote: H`גם $f_n$ וגם $f$ רציפות בתחום, ולכן המשפט אינו מכריע: מחשבים את $M_n$.`,
    });
    const s4 = step({
      id: "rp-4", title: H`חישוב $M_n$`,
      prompt: H`ב־$(${A},${endTex}]$ מתקיים $\lvert f_n-f\rvert=${hL}-${mid}$, והוא יורד ב־$x$. חשבו את הגבול שלו כש־$x\to${A}^+$ (עם $n$ קבוע), ואת $M_n$ וגבולו.`,
      parts: [
        joint("rp4a", H`\lim_{x\to${A}^+}\lvert f_n(x)-f(x)\rvert=`, ok(hL, K(h)), [
          bad("0", K(0), H`הגבול ב־$n\to\infty$ הוא $0$; כאן $n$ קבוע ו־$x\to${A}^+$, ואז $f_n(x)\to0$ ו־$f(x)=${hL}$.`),
          bad(hn, seq((n) => h * n), H`כש־$x\to${A}^+$ מתקיים $f_n(x)\to0$, ואילו $f(x)=${hL}$.`),
          bad(halfH, K(h / 2), H`זה הפער באמצע החלק העולה; כאן $x$ שואף לקצה השמאלי שלו.`),
        ]),
        slotsPart(template("rp4b", [L(H`M_n=`), S("rp4b1"), L(H`\xrightarrow[n\to\infty]{}`), S("rp4b2")], [
          chipSlot(book, rng, "rp4b1", ok(hL, K(h)), [
            bad(hn, seq((n) => h * n), H`הפער לא עולה על $${hL}$: $f_n$ ו־$f$ שתיהן בין $0$ ל־$${hL}$.`),
            bad("0", K(0), H`$M_n$ הוא סופרמום לפי $x$ עבור $n$ קבוע, והפער ליד $x=${A}$ מתקרב ל־$${hL}$.`),
            bad(halfH, K(h / 2), H`זה הפער באמצע החלק העולה, לא הסופרמום.`),
          ]),
          chipSlot(book, rng, "rp4b2", ok(hL, K(h)), [
            bad("0", K(0), H`$M_n=${hL}$ לכל $n$: סדרה קבועה.`),
            infWrong(H`$M_n=${hL}$ לכל $n$: סדרה קבועה.`),
            bad(halfH, K(h / 2), H`$M_n=${hL}$ לכל $n$.`),
          ]),
        ])),
      ],
      hints: [H`הפער $${hL}-${mid}$ יורד ב־$x$, ולכן הסופרמום הוא הגבול בקצה השמאלי $x\to${A}^+$, ואינו מתקבל.`],
      solvedNote: H`$M_n=${hL}$ לכל $n$ (סופרמום שאינו מתקבל), ולכן $M_n\not\to0$.`,
    });
    const s5 = verdictStep(rng, "rp-5", verdictPrompt, [
      good("not-uniform", H`לא במידה שווה: $M_n=${hL}\not\to0$ (אף שהגבול $f$ רציף).`),
      wrong("uniform-cont", H`כן, כי הגבול $f=${hL}$ רציף בתחום.`, H`רציפות הגבול היא תנאי הכרחי בלבד: כאן $M_n=${hL}\not\to0$.`),
      wrong("uniform-pw", H`כן, כי $f_n(x)\to f(x)$ בכל נקודה של התחום.`, "התכנסות נקודתית אינה מספיקה."),
    ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    H`$M_n\not\to0$: ההתכנסות אינה במידה שווה.`,
    H`ב־$(${A},${endTex}]$ הפער $\lvert f_n-f\rvert=${hL}-${mid}$ יורד ב־$x$, ובשאר התחום הוא $0$. לכן $M_n=\lim_{x\to${A}^+}(${hL}-${mid})=${hL}$ לכל $n$ ו־$M_n\not\to0$: ההתכנסות אינה במידה שווה, אף שהגבול רציף ו־${THEOREM_NAME} אינו מכריע.`);
    steps.push(s1, s2, s3, s4, s5);
  } else {
    // far from the ramp: uniform
    const nSlot = chipSlot(book, rng, "rp3a", ok(String(nFar), K(nFar)), [
      bad(String(nFar + 1), K(nFar + 1), H`זה תנאי מספיק אך לא שקול: מ־$n=${nFar}$ כבר מתקיים $\frac{1}{n}\le ${qL(c)}$.`),
      bad(String(Math.max(1, nFar - 1)), K(Math.max(1, nFar - 1)), H`עבור $n=${Math.max(1, nFar - 1)}$ מתקיים $\frac{1}{n}>${qL(c)}$.`),
      bad(qL(c), K(cv), H`זה הערך של $\frac{1}{n}$ בגבול, לא ערך של $n$. פתרו את אי־השוויון.`),
      bad(String(2 * nFar), K(2 * nFar), H`זה תנאי מספיק אך לא שקול: כבר מ־$n=${nFar}$ מתקיים $\frac{1}{n}\le ${qL(c)}$.`),
    ]);
    const s3 = step({
      id: "rp-3", title: "מאיזה $n$ החלק הקבוע מכסה את התחום",
      prompt: H`התחום מתחיל ב־$x=${farLeft}=${aPlus(qL(c))}$. החלק הקבוע של $f_n$ מתחיל ב־$x=${endTex}$. מתי כל התחום נמצא בחלק הקבוע, ומה אז $M_n$?`,
      parts: [
        slotsPart(template("rp3a", [L(H`\frac{1}{n}\le ${qL(c)}\iff n\ge`), S("rp3a")], [nSlot])),
        slotsPart(template("rp3b", [L(H`n\ge ${nFar}:\quad M_n=\sup\lvert f_n-f\rvert=`), S("rp3b")], [
          chipSlot(book, rng, "rp3b", ok("0", K(0)), [
            bad(hL, K(h), H`בחלק הקבוע $f_n=${hL}=f$, ולכן הפער הוא $0$.`),
            bad(halfH, K(h / 2), H`זה הערך באמצע החלק העולה, שאינו בתחום מ־$n=${nFar}$.`),
            infWrong(H`בחלק הקבוע $f_n=f$.`),
          ]),
        ])),
      ],
      hints: [H`החלק הקבוע מתחיל ב־$x=${endTex}$. דרשו $${endTex}\le ${farLeft}$.`],
      solvedNote: H`ל־$n\ge ${nFar}$ מתקיים $f_n=f=${hL}$ בכל התחום, ולכן $M_n=0$.`,
    });
    const s4 = step({
      id: "rp-4", title: "מה מצדיק את המסקנה",
      prompt: "סמנו את כל הנימוקים הנדרשים כדי להסיק שההתכנסות במידה שווה.",
      parts: [checklistPart("rp-4-why", shuffle(rng, [
        must("equal", H`מ־$n=${nFar}$ ואילך $f_n(x)=f(x)$ לכל $x$ בתחום.`),
        must("sup", H`לכן $M_n=0$ מ־$n=${nFar}$ ואילך, ו־$M_n\to0$ (מבחן הסופרמום).`),
        extra("cont", H`$f=${hL}$ רציפה בתחום, כמו $f_n$.`, "נכון, אך רציפות הגבול אינה נדרשת לטיעון (והיא אינה מספיקה)."),
        nope("cont-enough", H`$f_n$ ו־$f$ רציפות בתחום, ולכן ההתכנסות במידה שווה.`, "רציפות של $f_n$ ושל הגבול אינה מבטיחה התכנסות במידה שווה."),
        nope("pw", H`$f_n(x)\to f(x)$ בכל נקודה של התחום.`, "התכנסות נקודתית אינה מספיקה."),
      ]))],
      hints: [H`אם $f_n=f$ בכל התחום החל מ־$n$ מסוים, כמה הוא $M_n$?`],
      solvedNote: H`$M_n=0$ החל מ־$n=${nFar}$: ההתכנסות במידה שווה.`,
    });
    const s5 = verdictStep(rng, "rp-5", verdictPrompt, [
      good("uniform", H`כן: מ־$n=${nFar}$ ואילך $f_n=f$ בתחום, ולכן $M_n=0\to0$.`),
      wrong("not-jump", H`לא, כי $f$ אינה רציפה ב־$x=${A}$.`, H`הנקודה $x=${A}$ אינה בתחום $${domTex}$: סוג ההתכנסות תלוי בתחום.`),
      wrong("not-pos", H`לא, כי $f_n\ne f$ עבור $n$ קטן.`, H`מה שחשוב הוא התנהגות $M_n$ כש־$n\to\infty$.`),
    ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    H`$M_n=0$ החל מ־$n=${nFar}$: ההתכנסות במידה שווה.`,
    H`$f=${hL}$ בתחום. מ־$n=${nFar}$ ואילך $\frac{1}{n}\le ${qL(c)}$, ולכן $f_n(x)=${hL}=f(x)$ לכל $x\ge ${farLeft}$ ו־$M_n=0$. לפי מבחן הסופרמום ההתכנסות במידה שווה (בניגוד לתחום שכולל את $x=${A}$).`);
    steps.push(s1, s2, s3, s4, s5);
  }
  void midTex;

  const xMin = Math.min(0, qv(v.left)) - 0.1 * (v.right ? qv(v.right) - qv(v.left) : 2);
  const xMax = v.right ? qv(v.right) + 0.1 * (qv(v.right) - qv(v.left)) : 3;
  const view = windowOf(model, xMin, xMax);
  const plot: PracticePlotSpec = {
    value: model.value,
    limit: model.limit,
    domain: dom,
    view,
    maxN: 40,
    limitBreaks: two || kind === "through" ? [a] : [],
  };
  return {
    book, model,
    exercise: finishExercise({
      id: RAMP_ID, signature: rampSignature(v), difficulty: rampDifficulty(v),
      title: two ? "עלייה ליניארית דו־צדדית: גבול קופץ" : kind === "through" ? "עלייה ליניארית: גבול קופץ" : kind === "open" ? "עלייה ליניארית: סופרמום שאינו מתקבל" : "עלייה ליניארית הרחק מהתחום",
      statement: statementOf(dom, domTex), formula: fnCases, steps, book, plot,
    }),
  };
}

export const RAMP = makeFamily<RampVariant>({
  id: RAMP_ID,
  grid: rampGrid,
  kindOf: (v) => `${v.shape}-${v.kind}`,
  difficulty: rampDifficulty,
  signature: rampSignature,
  build: buildRamp,
});

// =============================================================================================
// 2. Unbounded limits: bounded continuous f_n whose limit is unbounded
// =============================================================================================

type CapFn = "inv" | "root" | "ln";
export type UnboundedVariant =
  | { kind: "ramp"; p: 1 | 2; s: 0 | 1; dom: "I1" | "I2" | "ray" | "farA" | "farB" }
  | { kind: "cap"; fn: CapFn; dom: "C1" | "C2" | "far" };

const UNB_ID = "cont-unbounded";

function unboundedGrid(): UnboundedVariant[] {
  const out: UnboundedVariant[] = [];
  for (const p of [1, 2] as const) for (const s of [0, 1] as const) {
    for (const dom of ["I1", "I2", "ray", "farA", "farB"] as const) out.push({ kind: "ramp", p, s, dom });
  }
  for (const fn of ["inv", "root", "ln"] as const) for (const dom of ["C1", "C2", "far"] as const) out.push({ kind: "cap", fn, dom });
  return out;
}

const unboundedSignature = (v: UnboundedVariant) => (v.kind === "ramp" ? `ramp;p=${v.p};s=${v.s};${v.dom}` : `cap;${v.fn};${v.dom}`);
const isFar = (v: UnboundedVariant) => v.dom === "farA" || v.dom === "farB" || v.dom === "far";
function unboundedDifficulty(v: UnboundedVariant): PracticeDifficulty {
  if (v.kind === "ramp") return v.p === 1 && v.s === 0 ? "easy" : "medium";
  return isFar(v) ? "medium" : v.fn === "inv" ? "medium" : "advanced";
}

function unboundedDomain(v: UnboundedVariant): { dom: Dom; tex: string } {
  if (v.kind === "ramp") {
    const table = { I1: domainOf(q(0), q(1), true, true), I2: domainOf(q(0), q(2), true, true), ray: domainOf(q(0), null, true, false), farA: domainOf(q(1, 2), q(2), true, true), farB: domainOf(q(1, 4), q(1), true, true) };
    return table[v.dom as keyof typeof table];
  }
  if (v.dom === "far") return domainOf(q(1, 4), q(1), true, true);
  if (v.dom === "C1") return domainOf(q(0), q(1), false, true);
  return v.fn === "ln" ? domainOf(q(0), q(1, 2), false, true) : domainOf(q(0), q(2), false, true);
}

function buildUnbounded(v: UnboundedVariant, rng: SeededRandom): Built {
  const book = new Book();
  const far = isFar(v);
  const { dom, tex: domTex } = unboundedDomain(v);
  const verdictPrompt = H`האם $f_n\to f$ במידה שווה ${inDom(dom, domTex)}?`;
  const steps: PracticeStep[] = [];
  let model: Model;
  let formula: string;
  let title: string;
  const infChip = (why: string) => bad("\\infty", K(Infinity), why);
  const slotLine = (id: string, lead: string, target: Chip, wrongs: Chip[]) => slotsPart(template(id, [L(lead), S(id)], [chipSlot(book, rng, id, target, wrongs)]));

  if (v.kind === "ramp") {
    const { p, s } = v;
    const mBase = s ? "(n+1)" : "n";
    const mTex = s ? "n+1" : "n";
    const m = (n: number) => n + s;
    const pw = (e: number) => (e === 0 ? "1" : e === 1 ? mTex : `${mBase}^{${e}}`);
    const mp = pw(p);
    const fL = p === 1 ? H`\frac{1}{x}` : H`\frac{1}{x^{2}}`;
    const jTex = H`\frac{1}{${mTex}}`;
    const a = v.dom === "farA" ? 0.5 : v.dom === "farB" ? 0.25 : 0;
    const aL = v.dom === "farA" ? "\\tfrac12" : v.dom === "farB" ? "\\tfrac14" : "0";
    const rightEnd = dom.right;
    const rightCond = rightEnd === Infinity ? "" : H`\le ${rightEnd}`;
    model = {
      value: (n, x) => (x <= 0 ? 0 : x <= 1 / m(n) ? m(n) ** (p + 1) * x : x ** -p),
      limit: (x) => (x === 0 ? 0 : x ** -p),
      domain: dom,
      uniform: far,
      ...(far
        ? { sup: () => 0, nBound: Math.round(1 / a) - s }
        : { gap: 50, witness: { x: (n: number) => 1 / (2 * m(n)), diff: (n: number) => (2 ** p - 0.5) * m(n) ** p } }),
      samples: samplesIn(dom, far ? [a, 0.75, 1, rightEnd] : [0, 0.5, 1, 1.5, rightEnd]),
      extra: (n) => [1 / (2 * m(n)), 1 / m(n)],
      ...(rightEnd === Infinity ? { scanTo: () => 4 } : {}),
    };
    formula = casesOf([
      [H`${pw(p + 1)}x`, H`0\le x\le ${jTex}`],
      [fL, H`${jTex}\le x${rightCond}`],
    ], domTex);
    title = far ? "גבול לא חסום: תחום הרחק מ־0" : "גבול לא חסום מפונקציות חסומות";

    // ---- step 1: continuity of f_n at the joint
    const s1 = step({
      id: "ub-1", title: "רציפות $f_n$ בנקודת החיבור",
      prompt: H`בכל חלק $f_n$ נתונה בביטוי רציף, ולכן נבדוק רק את נקודת החיבור $x=${jTex}$. חשבו את הגבול משמאל ואת הגבול מימין בנקודה זו.`,
      parts: [
        slotLine("ub1a", H`\lim_{x\to\left(${jTex}\right)^-}f_n(x)=\lim_{x\to\left(${jTex}\right)^-}${pw(p + 1)}x=`, ok(mp, seq((n) => m(n) ** p)), [
          bad(pw(p + 1), seq((n) => m(n) ** (p + 1)), H`הציבו $x=${jTex}$: $${pw(p + 1)}\cdot${jTex}$, וצמצמו גורם $${mTex}$ אחד.`),
          bad(pw(p - 1), seq((n) => m(n) ** (p - 1)), H`$${pw(p + 1)}\cdot${jTex}$: מצמצמים גורם $${mTex}$ אחד בלבד, לא שניים.`),
          bad(H`\frac{1}{${mp}}`, seq((n) => 1 / m(n) ** p), H`$${pw(p + 1)}\cdot${jTex}=${mp}$, ולא ההופכי.`),
        ]),
        slotLine("ub1b", H`\lim_{x\to\left(${jTex}\right)^+}f_n(x)=\lim_{x\to\left(${jTex}\right)^+}${fL}=`, ok(mp, seq((n) => m(n) ** p)), [
          bad(H`\frac{1}{${mp}}`, seq((n) => 1 / m(n) ** p), H`$${fL}$ ב־$x=${jTex}$ שווה ל־$${mp}$, ולא להופכי שלו.`),
          bad(pw(p + 1), seq((n) => m(n) ** (p + 1)), H`הציבו $x=${jTex}$ ב־$${fL}$.`),
          infChip(H`$x$ שואף ל־$${jTex}>0$ ולא ל־$0$, ולכן הביטוי אינו שואף לאינסוף.`),
        ]),
      ],
      hints: [H`שני הביטויים רציפים ב־$x=${jTex}$, ולכן כל אחד מהגבולות החד־צדדיים מתקבל בהצבה.`],
      solvedNote: H`שני הגבולות החד־צדדיים שווים ל־$${mp}$, וזה גם הערך $f_n\left(${jTex}\right)$. לכן כל $f_n$ רציפה בתחום, והיא חסומה ב־$${mp}$.`,
    });

    // ---- step 2: the pointwise limit
    const posRange = rightEnd === Infinity ? H`x>0` : H`0<x${rightCond}`;
    const lineZero = far
      ? null
      : slotLine("ub2a", H`x=0:\quad f(0)=`, ok("0", K(0)), [
        infChip(H`$f_n(0)=0$ לכל $n$: סדרה קבועה.`),
        bad("1", K(1), H`$f_n(0)=${pw(p + 1)}\cdot0=0$ לכל $n$.`),
        bad(mp, seq((n) => m(n) ** p), H`$f_n(0)=0$ לכל $n$; הערך $${mp}$ הוא הערך בנקודת החיבור.`),
      ]);
    const linePos = slotLine("ub2b", far ? H`x\ge ${aL}:\quad f(x)=` : H`${posRange}:\quad f(x)=`, ok(fL, xs((x) => x ** -p)), [
      bad("0", K(0), H`ל־$x>0$ קבוע, החל מ־$n$ מסוים $x\ge ${jTex}$, ואז $f_n(x)=${fL}$.`),
      bad(p === 1 ? "x" : "x^{2}", xs((x) => x ** p), H`זה ההופכי: בחלק השני $f_n(x)=${fL}$.`),
      bad(p === 1 ? H`\frac{1}{x^{2}}` : H`\frac{1}{x^{3}}`, xs((x) => x ** -(p + 1)), H`בחלק השני $f_n(x)=${fL}$, בלי חזקה נוספת.`),
      infChip(H`ל־$x$ קבוע, החל מ־$n$ מסוים $f_n(x)=${fL}$, ערך סופי.`),
    ]);
    const s2 = step({
      id: "ub-2", title: STEP_LIMIT_TITLE,
      prompt: H`חשבו את הגבול הנקודתי $f(x)=\lim_{n\to\infty}f_n(x)$. ל־$x>0$ קבוע, באיזה חלק נמצא $x$ כש־$n$ גדול?`,
      parts: lineZero ? [lineZero, linePos] : [linePos],
      hints: [H`ל־$x>0$ קבוע, החל מ־$n$ מסוים $\frac{1}{${mTex}}<x$, ואז $f_n(x)=${fL}$.`],
      solvedNote: far ? H`$f(x)=${fL}$ בכל נקודה של התחום.` : H`$f(0)=0$ ו־$f(x)=${fL}$ לכל $x>0$: הגבול אינו חסום ליד $0$.`,
    });

    if (!far) {
      const s3 = step({
        id: "ub-3", title: "מה מצדיק את המסקנה",
        prompt: H`סמנו את כל הנימוקים הנדרשים כדי להסיק שההתכנסות אינה במידה שווה, בעזרת ${THEOREM_NAME}.`,
        parts: [checklistPart("ub-3-why", shuffle(rng, [
          must("fn-cont", H`כל $f_n$ רציפה בתחום (שני ביטויים רציפים שמתחברים בנקודת החיבור).`),
          must("f-disc", H`הגבול $f$ אינו רציף ב־$x=0$: $f(0)=0$ אך $f(x)\to\infty$ כש־$x\to0^+$.`),
          must("thm", H`${THEOREM_NAME}: גבול במידה שווה של פונקציות רציפות הוא פונקציה רציפה.`),
          extra("bdd", H`כל $f_n$ חסומה ו־$f$ אינה חסומה.`, "נכון, ומשמש נימוק שני לאותה מסקנה (השלב הבא); אינו נחוץ לטיעון של משפט הרציפות."),
          nope("same-zero", H`$f_n(0)=f(0)=0$ לכל $n$, ולכן אין בעיה ב־$x=0$.`, "השוויון ב־$x=0$ עצמה אינו חשוב: $f$ אינה רציפה שם, כי היא אינה חסומה ליד $0$."),
          nope("pw", H`הגבול הנקודתי קיים בכל נקודה של התחום, ולכן ההתכנסות במידה שווה.`, "קיום הגבול בכל נקודה הוא התכנסות נקודתית בלבד."),
          nope("limit-cont", H`$f(x)=${fL}$ רציפה בכל $x>0$, ולכן $f$ רציפה בתחום.`, "ב־$x=0$ ערך הגבול הוא $f(0)=0$, אך $f(x)$ אינה שואפת ל־$0$ כש־$x\\to0^+$."),
        ]))],
        hints: [H`${THEOREM_NAME} דורש: $f_n$ רציפות, והגבול במידה שווה. אם $f$ אינה רציפה, אין התכנסות במידה שווה.`],
        solvedNote: H`$f_n$ רציפות ו־$f$ אינה רציפה ב־$x=0$: ההתכנסות אינה במידה שווה.`,
      });
      const s4 = step({
        id: "ub-4", title: "נימוק שני: חסימות",
        prompt: H`גם משפט אחר מוביל לאותה מסקנה: גבול במידה שווה של פונקציות חסומות הוא פונקציה חסומה. מצאו חסם ל־$f_n$, ובדקו אם $f$ חסומה.`,
        parts: [
          slotsPart(template("ub4a", [L(H`0\le f_n(x)\le`), S("ub4a")], [
            chipSlot(book, rng, "ub4a", ok(mp, seq((n) => m(n) ** p)), [
              bad(pw(p - 1), seq((n) => m(n) ** (p - 1)), H`זה אינו חסם: בנקודת החיבור $f_n=${mp}$.`),
              bad(H`\frac{${mp}}{2}`, seq((n) => m(n) ** p / 2), H`זה אינו חסם: בנקודת החיבור $f_n=${mp}$.`),
              ...(s ? [bad(`n^{${p}}`, seq((n) => n ** p), H`זה אינו חסם: בנקודת החיבור $f_n=(n+1)^{${p}}$.`)] : []),
              bad(H`\frac{1}{${mp}}`, seq((n) => 1 / m(n) ** p), H`זה אינו חסם: בנקודת החיבור $f_n=${mp}$.`),
            ], seq((n) => m(n) ** p)),
          ])),
          choicePart("ub4b", H`בחרו את הטענה הנכונה על $f(x)=${fL}$.`, shuffle(rng, [
            good("unbounded", H`$f$ אינה חסומה: $f(x)\to\infty$ כש־$x\to0^+$.`),
            wrong("bounded-fn", H`$f$ חסומה, כי כל $f_n$ חסומה.`, "גבול נקודתי של פונקציות חסומות אינו חייב להיות חסום; זה בדיוק המצב כאן."),
            wrong("bounded-cont", H`$f$ חסומה, כי היא רציפה בכל $x>0$.`, H`רציפות בכל נקודה חיובית אינה מבטיחה חסימות: $f(x)\to\infty$ כש־$x\to0^+$.`),
          ])),
        ],
        hints: [H`בודקים את $f$ ליד $x=0$.`],
        solvedNote: H`כל $f_n$ חסומה ב־$${mp}$, אך $f$ אינה חסומה. לכן גם לפי משפט החסימות ההתכנסות אינה במידה שווה.`,
      });
      const s5 = verdictStep(rng, "ub-5", verdictPrompt, [
        good("not-uniform", H`לא: $f_n$ רציפות והגבול $f$ אינו רציף ב־$x=0$; כמו כן $f_n$ חסומות ו־$f$ אינה חסומה.`),
        wrong("uniform-pw", H`כן, כי $f_n(x)\to f(x)$ בכל נקודה.`, "התכנסות נקודתית אינה מספיקה."),
        wrong("uniform-eq", H`כן, כי $f_n(x)=f(x)$ לכל $x\ge ${jTex}$.`, H`השוויון מתקיים רק החל מ־$${jTex}$, ושם הפער $f(x)-f_n(x)$ ליד $0$ אינו חסום.`),
      ], [H`אם הגבול אינו רציף והסדרה רציפה, אין התכנסות במידה שווה.`],
      H`$f_n\not\to f$ במידה שווה.`,
      H`כל $f_n$ רציפה בתחום, ו־$f(0)=0$ אך $f(x)=${fL}\to\infty$ כש־$x\to0^+$, ולכן $f$ אינה רציפה ב־$x=0$; לפי ${THEOREM_NAME} ההתכנסות אינה במידה שווה. נימוק שני: $0\le f_n\le ${mp}$, כלומר כל $f_n$ חסומה, ואילו $f$ אינה חסומה; גבול במידה שווה של פונקציות חסומות הוא חסום, ולכן אין התכנסות במידה שווה.`);
      steps.push(s1, s2, s3, s4, s5);
    } else {
      const nFar = Math.round(1 / a) - s;
      const s3 = step({
        id: "ub-3", title: "מאיזה $n$ החלק השני מכסה את התחום",
        prompt: H`התחום מתחיל ב־$x=${aL}$. החלק השני של $f_n$ ($f_n=${fL}$) מתחיל ב־$x=${jTex}$. מתי כל התחום נמצא בחלק השני, ומה אז $M_n$?`,
        parts: [
          slotLine("ub3a", H`${jTex}\le ${aL}\iff n\ge`, ok(String(nFar), K(nFar)), [
            bad(String(nFar + 1), K(nFar + 1), H`זה תנאי מספיק אך לא שקול: כבר מ־$n=${nFar}$ מתקיים $${jTex}\le ${aL}$.`),
            bad(String(nFar + 2), K(nFar + 2), H`זה תנאי מספיק אך לא שקול: כבר מ־$n=${nFar}$ מתקיים $${jTex}\le ${aL}$.`),
            bad(String(nFar - 1), K(nFar - 1), H`עבור $n=${nFar - 1}$ מתקיים $${jTex}>${aL}$.`),
            bad(H`${aL}`, K(a), H`זה ערך של $x$, לא של $n$.`),
          ]),
          slotLine("ub3b", H`n\ge ${nFar}:\quad M_n=\sup\lvert f_n-f\rvert=`, ok("0", K(0)), [
            bad("1", K(1), H`בחלק השני $f_n=f$, ולכן הפער הוא $0$.`),
            bad(mp, seq((n) => m(n) ** p), H`זה גובה $f_n$ בנקודת החיבור, שנמצאת מחוץ לתחום מ־$n=${nFar}$.`),
            infChip(H`בחלק השני $f_n=f$, ולכן הפער הוא $0$.`),
          ]),
        ],
        hints: [H`דרשו $\frac{1}{${mTex}}\le ${aL}$.`],
        solvedNote: H`ל־$n\ge ${nFar}$ מתקיים $f_n=f$ בכל התחום, ולכן $M_n=0$.`,
      });
      const s4 = step({
        id: "ub-4", title: "מה מצדיק את המסקנה",
        prompt: "סמנו את כל הנימוקים הנדרשים כדי להסיק שההתכנסות במידה שווה.",
        parts: [checklistPart("ub-4-why", shuffle(rng, [
          must("equal", H`מ־$n=${nFar}$ ואילך $f_n(x)=f(x)$ לכל $x$ בתחום.`),
          must("sup", H`לכן $M_n=0$ מ־$n=${nFar}$ ואילך, ו־$M_n\to0$ (מבחן הסופרמום).`),
          extra("cont", H`$f_n$ ו־$f$ רציפות בתחום.`, "נכון, אך אינו נדרש לטיעון (ואינו מספיק)."),
          nope("unb", H`$f$ אינה חסומה, ולכן ההתכנסות אינה במידה שווה.`, H`$f=${fL}$ אינה חסומה רק ליד $x=0$, שאינו בתחום; בתחום $f\le ${p === 1 ? (1 / a) : (1 / a) ** 2}$.`),
          nope("pw", H`$f_n(x)\to f(x)$ בכל נקודה של התחום.`, "התכנסות נקודתית אינה מספיקה."),
        ]))],
        hints: [H`אם $f_n=f$ בכל התחום החל מ־$n$ מסוים, כמה הוא $M_n$?`],
        solvedNote: H`$M_n=0$ החל מ־$n=${nFar}$: ההתכנסות במידה שווה.`,
      });
      const s5 = verdictStep(rng, "ub-5", verdictPrompt, [
        good("uniform", H`כן: מ־$n=${nFar}$ ואילך $f_n=f$ בתחום, ולכן $M_n=0\to0$.`),
        wrong("not-unb", H`לא, כי $f$ אינה חסומה.`, H`$f$ אינה חסומה רק ליד $x=0$, שאינו בתחום $${domTex}$.`),
        wrong("not-pos", H`לא, כי $f_n\ne f$ עבור $n$ קטן.`, H`מה שחשוב הוא התנהגות $M_n$ כש־$n\to\infty$.`),
      ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
      H`$M_n=0$ החל מ־$n=${nFar}$: ההתכנסות במידה שווה.`,
      H`מ־$n=${nFar}$ ואילך $\frac{1}{${mTex}}\le ${aL}$, ולכן $f_n(x)=${fL}=f(x)$ לכל $x\ge ${aL}$ ו־$M_n=0$. לפי מבחן הסופרמום ההתכנסות במידה שווה (בניגוד לתחום שכולל את $x=0$).`);
      steps.push(s1, s2, s3, s4, s5);
    }
  } else {
    // ---- min{n, h(x)} on (0, b]
    const { fn } = v;
    const hTex = fn === "inv" ? H`\frac{1}{x}` : fn === "root" ? H`\frac{1}{\sqrt{x}}` : H`\ln\frac{1}{x}`;
    const hNum = (x: number) => (fn === "inv" ? 1 / x : fn === "root" ? 1 / Math.sqrt(x) : Math.log(1 / x));
    const jTex = fn === "inv" ? H`\frac{1}{n}` : fn === "root" ? H`\frac{1}{n^{2}}` : "e^{-n}";
    const jNum = (n: number) => (fn === "inv" ? 1 / n : fn === "root" ? 1 / n ** 2 : Math.exp(-n));
    const halfTex = fn === "inv" ? H`\frac{1}{2n}` : fn === "root" ? H`\frac{1}{4n^{2}}` : "e^{-2n}";
    const halfNum = (n: number) => (fn === "inv" ? 1 / (2 * n) : fn === "root" ? 1 / (4 * n * n) : Math.exp(-2 * n));
    const hEq = fn === "inv" ? H`\frac{1}{x}=n` : fn === "root" ? H`\frac{1}{\sqrt{x}}=n` : H`\ln\frac{1}{x}=n`;
    const rightEnd = dom.right;
    const a = 0.25;
    model = {
      value: (n, x) => Math.min(n, hNum(x)),
      limit: hNum,
      domain: dom,
      uniform: far,
      ...(far
        ? { sup: () => 0, nBound: fn === "inv" ? 4 : fn === "root" ? 2 : 2 }
        : { gap: fn === "ln" ? 20 : 50, witness: { x: halfNum, diff: (n: number) => n } }),
      // e^{-2n} underflows to 0 beyond n = 372, so the logarithmic variant is scanned at smaller indices.
      ...(fn === "ln" ? { ns: [20, 50, 100] as [number, number, number] } : {}),
      samples: samplesIn(dom, far ? [a, 0.5, rightEnd] : [0.25, 0.5, rightEnd]),
      extra: (n) => [halfNum(n), jNum(n)],
    };
    formula = H`f_n(x)=\min\left\{n,\ ${hTex}\right\},\qquad x\in${domTex}`;
    title = far ? "חיתוך עם הקבוע n: תחום הרחק מ־0" : "חיתוך עם הקבוע n: גבול לא חסום";

    if (!far) {
      const s1 = step({
        id: "ub-1", title: "נקודת החיבור",
        prompt: H`$f_n(x)$ שווה ל־$n$ כש־$${hTex}\ge n$, ול־$${hTex}$ אחרת. מצאו את נקודת החיבור: הנקודה $x$ שבה $${hEq}$.`,
        parts: [slotLine("ub1a", H`${hEq}\iff x=`, ok(jTex, seq(jNum)), fn === "inv" ? [
          bad("n", seq((n) => n), H`הפתרון הוא $x=\frac{1}{n}$: $x=n$ נותן $\frac1x=\frac{1}{n}$.`),
          bad(H`\frac{1}{n^{2}}`, seq((n) => 1 / n ** 2), H`$\frac1x=n$ גורר $x=\frac{1}{n}$, בלי העלאה בריבוע.`),
          bad(H`\frac{1}{\sqrt{n}}`, seq((n) => 1 / Math.sqrt(n)), H`$\frac1x=n$ גורר $x=\frac{1}{n}$, בלי שורש.`),
        ] : fn === "root" ? [
          bad(H`\frac{1}{n}`, seq((n) => 1 / n), H`$\frac{1}{\sqrt{x}}=n$ גורר $\sqrt{x}=\frac{1}{n}$, ולכן $x=\frac{1}{n^{2}}$ (העלו בריבוע).`),
          bad("n^{2}", seq((n) => n ** 2), H`$\sqrt{x}=\frac{1}{n}$, ולכן $x=\frac{1}{n^{2}}$ ולא $n^{2}$.`),
          bad(H`\frac{1}{\sqrt{n}}`, seq((n) => 1 / Math.sqrt(n)), H`$\sqrt{x}=\frac{1}{n}$, ולכן $x=\frac{1}{n^{2}}$.`),
        ] : [
          bad("e^{n}", seq((n) => Math.exp(n)), H`$\ln\frac1x=n$ גורר $\frac1x=e^{n}$, ולכן $x=e^{-n}$. הערך $e^{n}$ גדול מ־$1$, מחוץ לתחום.`),
          bad(H`\frac{1}{n}`, seq((n) => 1 / n), H`$\ln\frac1x=n$ גורר $\frac1x=e^{n}$, ולכן $x=e^{-n}$.`),
          bad(H`\frac{1}{\ln n}`, seq((n) => 1 / Math.log(n)), H`$\ln\frac1x=n$ גורר $\frac1x=e^{n}$, ולכן $x=e^{-n}$.`),
        ])],
        hints: [fn === "inv" ? H`הפכו את שני האגפים של $\frac1x=n$.` : fn === "root" ? H`העלו את שני האגפים של $\frac{1}{\sqrt{x}}=n$ בריבוע, או הפכו אותם.` : H`העלו את $e$ בחזקת שני האגפים של $\ln\frac1x=n$.`],
        solvedNote: H`$f_n(x)=n$ ל־$0<x\le ${jTex}$ ו־$f_n(x)=${hTex}$ מ־$x=${jTex}$ ואילך. כל $f_n$ רציפה בתחום (מינימום של שתי פונקציות רציפות) וחסומה ב־$n$.`,
      });
      const s2 = step({
        id: "ub-2", title: STEP_LIMIT_TITLE,
        prompt: H`חשבו את הגבול הנקודתי $f(x)=\lim_{n\to\infty}f_n(x)$ לכל $x$ בתחום. ל־$x$ קבוע, החל מ־$n$ מסוים $${hTex}\le n$.`,
        parts: [slotLine("ub2a", H`f(x)=`, ok(hTex, xs((x) => hNum(x))), [
          bad("0", K(0), H`החל מ־$n$ מסוים $${hTex}\le n$, ואז $f_n(x)=${hTex}$, לא $0$.`),
          infChip(H`$f_n(x)=\min\{n,${hTex}\}\le ${hTex}$, ערך סופי ל־$x$ קבוע.`),
          bad("n", K(1), H`הגבול אינו יכול להיות תלוי ב־$n$; החל מ־$n$ מסוים $f_n(x)=${hTex}$.`),
        ])],
        hints: [H`החל מ־$n$ מסוים $n\ge ${hTex}$, ואז המינימום הוא $${hTex}$.`],
        solvedNote: H`$f(x)=${hTex}$ לכל $x$ בתחום: $f$ רציפה בתחום ואינה חסומה.`,
      });
      const s3 = step({
        id: "ub-3", title: "מה מצדיק את המסקנה",
        prompt: "סמנו את כל הנימוקים הנדרשים כדי להסיק שההתכנסות אינה במידה שווה.",
        parts: [checklistPart("ub-3-why", shuffle(rng, [
          must("fn-bdd", H`כל $f_n$ חסומה: $0\le f_n(x)\le n$.`),
          must("f-unb", H`$f$ אינה חסומה: $f(x)=${hTex}\to\infty$ כש־$x\to0^+$.`),
          must("thm-bdd", "גבול במידה שווה של פונקציות חסומות הוא פונקציה חסומה."),
          extra("fn-cont", H`כל $f_n$ רציפה בתחום, כמינימום של שתי פונקציות רציפות.`, "נכון, אך ההנחה אינה מועילה כאן: הגבול $f$ רציף בתחום, ולכן משפט הרציפות אינו נותן סתירה."),
          nope("f-disc", H`$f$ אינה רציפה, ולכן לפי ${THEOREM_NAME} אין התכנסות במידה שווה.`, H`$f(x)=${hTex}$ רציפה בכל נקודה של התחום: ${THEOREM_NAME} אינו מועיל כאן.`),
          nope("unb-only", H`$f$ אינה חסומה, ולכן ההתכנסות אינה במידה שווה.`, "זה נכון רק כשכל $f_n$ חסומה; אם גם $f_n$ אינן חסומות, ייתכן $f_n\\to f$ במידה שווה (למשל $f_n=f$)."),
          nope("pw", H`הגבול הנקודתי קיים בכל נקודה של התחום, ולכן ההתכנסות במידה שווה.`, "קיום הגבול בכל נקודה הוא התכנסות נקודתית בלבד."),
        ]))],
        hints: [H`הגבול רציף בתחום, ולכן ${THEOREM_NAME} אינו עוזר. נסו משפט אחר: חסימות.`],
        solvedNote: H`$f_n$ חסומות ו־$f$ אינה חסומה: ההתכנסות אינה במידה שווה.`,
      });
      const s4 = step({
        id: "ub-4", title: "בדיקה ישירה",
        prompt: H`בדקו גם ישירות. נבחר את הנקודה $x_n$, משמאל לנקודת החיבור, שבה $${hTex}=2n$. חשבו את $x_n$ ואת הפער $f(x_n)-f_n(x_n)$.`,
        parts: [
          slotLine("ub4a", H`x_n=`, ok(halfTex, seq(halfNum)), [
            bad(jTex, seq(jNum), H`זו נקודת החיבור, שבה $${hTex}=n$: שם $f=f_n$, והפער הוא $0$.`),
            bad(fn === "inv" ? H`\frac{2}{n}` : fn === "root" ? H`\frac{4}{n^{2}}` : "e^{-n/2}", seq((n) => (fn === "inv" ? 2 / n : fn === "root" ? 4 / n ** 2 : Math.exp(-n / 2))), H`זו נקודה מימין לנקודת החיבור, שבה $${hTex}=\frac{n}{2}$: שם $f_n=f$, והפער $0$.`),
            bad("0", K(0), H`$x=0$ אינו בתחום.`),
          ]),
          slotLine("ub4b", H`f(x_n)-f_n(x_n)=`, ok("n", seq((n) => n)), [
            bad("2n", seq((n) => 2 * n), H`זה $f(x_n)$; יש לחסר את $f_n(x_n)=n$.`),
            bad("0", K(0), H`$f(x_n)=2n$ ו־$f_n(x_n)=n$ שונים.`),
            infChip(H`$x_n$ קבוע עבור $n$ נתון, והפער סופי.`),
          ]),
        ],
        hints: [H`ב־$x_n$ מתקיים $${hTex}=2n>n$, ולכן $f_n(x_n)=n$ ו־$f(x_n)=2n$.`],
        solvedNote: H`$f(x_n)-f_n(x_n)=n$, ולכן $M_n\ge n\to\infty$.`,
      });
      const s5 = verdictStep(rng, "ub-5", verdictPrompt, [
        good("not-uniform", H`לא: $f_n$ חסומות ו־$f$ אינה חסומה (ואף $M_n\ge n$).`),
        wrong("uniform-cont", H`כן, כי $f_n$ ו־$f$ רציפות בתחום.`, "רציפות הגבול היא תנאי הכרחי בלבד, ואינה מבטיחה התכנסות במידה שווה."),
        wrong("uniform-pw", H`כן, כי $f_n(x)\to f(x)$ בכל נקודה.`, "התכנסות נקודתית אינה מספיקה."),
      ], [H`אם $f_n$ חסומות ו־$f$ אינה חסומה, אין התכנסות במידה שווה.`],
      H`$f_n\not\to f$ במידה שווה.`,
      H`$0\le f_n\le n$, כלומר כל $f_n$ חסומה, אך $f(x)=${hTex}\to\infty$ כש־$x\to0^+$ אינה חסומה. גבול במידה שווה של פונקציות חסומות הוא חסום, ולכן ההתכנסות אינה במידה שווה. (${THEOREM_NAME} אינו עוזר כאן: $f$ רציפה בתחום.) ישירות: $f(x_n)-f_n(x_n)=n$ ב־$x_n=${halfTex}$, ולכן $M_n\ge n$.`);
      steps.push(s1, s2, s3, s4, s5);
    } else {
      const aNum = 0.25;
      const hA = fn === "inv" ? "4" : fn === "root" ? "2" : H`\ln4`;
      const hAnum = hNum(aNum);
      const deriv = fn === "inv" ? H`h'(x)=-\frac{1}{x^{2}}` : fn === "root" ? H`h'(x)=-\frac{1}{2x\sqrt{x}}` : H`h'(x)=-\frac{1}{x}`;
      const s1 = step({
        id: "ub-1", title: STEP_LIMIT_TITLE,
        prompt: H`נסמן $h(x)=${hTex}$. חשבו את הגבול הנקודתי $f(x)=\lim_{n\to\infty}f_n(x)$ לכל $x$ בתחום.`,
        parts: [slotLine("ub1a", H`f(x)=`, ok(hTex, xs((x) => hNum(x))), [
          bad("0", K(0), H`החל מ־$n$ מסוים $${hTex}\le n$, ואז $f_n(x)=${hTex}$, לא $0$.`),
          infChip(H`$f_n(x)\le ${hTex}$, ערך סופי ל־$x$ קבוע.`),
          bad("n", K(1), H`הגבול אינו יכול להיות תלוי ב־$n$.`),
        ])],
        hints: [H`החל מ־$n$ מסוים $n\ge h(x)$, ואז המינימום הוא $h(x)$.`],
        solvedNote: H`$f(x)=${hTex}$ לכל $x$ בתחום.`,
      });
      const s2 = step({
        id: "ub-2", title: "מתי $f_n=f$ בכל התחום",
        prompt: H`$f_n=f$ בנקודה $x$ כש־$h(x)\le n$. התחום מתחיל ב־$x=\frac14$. מצאו את $n$ שמבטיח $h(x)\le n$ בכל התחום, ומה אז $M_n$.`,
        parts: [
          slotLine("ub2a", H`\max_{x\ge\frac14}h(x)\le n\iff n\ge`, ok(hA, K(hAnum)), fn === "inv" ? [
            bad("2", K(2), H`זה $h\left(\frac14\right)$ של $\frac{1}{\sqrt{x}}$; כאן $h\left(\frac14\right)=\frac{1}{1/4}=4$.`),
            bad(H`\frac{1}{4}`, K(0.25), H`זה ערך של $x$, לא של $h(x)$.`),
            bad("16", K(16), H`$h\left(\frac14\right)=4$ (הציבו $x=\frac14$ ב־$\frac1x$).`),
          ] : fn === "root" ? [
            bad("4", K(4), H`זה $h\left(\frac14\right)$ של $\frac1x$; כאן $h\left(\frac14\right)=\frac{1}{\sqrt{1/4}}=2$.`),
            bad(H`\frac{1}{2}`, K(0.5), H`$\sqrt{\frac14}=\frac12$, ולכן $h\left(\frac14\right)=\frac{1}{1/2}=2$.`),
            bad("16", K(16), H`$h\left(\frac14\right)=2$.`),
          ] : [
            bad("4", K(4), H`זה $h\left(\frac14\right)$ של $\frac1x$; כאן $h\left(\frac14\right)=\ln4$.`),
            bad(H`\ln2`, K(Math.log(2)), H`$\ln\frac{1}{1/4}=\ln4$, לא $\ln2$.`),
            bad(H`\frac14`, K(0.25), H`זה ערך של $x$, לא של $h(x)$.`),
          ]),
          slotLine("ub2b", H`n\ge ${hA}:\quad M_n=\sup\lvert f_n-f\rvert=`, ok("0", K(0)), [
            bad("1", K(1), H`כש־$h(x)\le n$ מתקיים $f_n(x)=h(x)=f(x)$.`),
            bad("n", seq((n) => n), H`הפער הוא $0$: המינימום שווה ל־$h(x)$.`),
            infChip(H`בתחום $h\le ${hA}$, והפער הוא $0$.`),
          ]),
        ],
        hints: [H`$h$ יורדת, ולכן הערך הגדול ביותר שלה בתחום הוא ב־$x=\frac14$.`],
        solvedNote: H`ל־$n\ge ${hA}$ מתקיים $f_n=f$ בכל התחום, ולכן $M_n=0$.`,
      });
      const s3 = step({
        id: "ub-3", title: "מה מצדיק את המסקנה",
        prompt: "סמנו את כל הנימוקים הנדרשים כדי להסיק שההתכנסות במידה שווה.",
        parts: [checklistPart("ub-3-why", shuffle(rng, [
          must("dec", H`$h$ יורדת בתחום: לפי משפט לגרנז', $${deriv}<0$, ולכן $h(x)\le h\left(\frac14\right)=${hA}$.`),
          must("equal", H`מ־$n\ge ${hA}$ מתקיים $n\ge h(x)$ לכל $x$ בתחום, ולכן $f_n=f$ ו־$M_n=0$.`),
          extra("cont", H`$f_n$ ו־$f$ רציפות בתחום.`, "נכון, אך אינו נדרש לטיעון (ואינו מספיק)."),
          nope("unb", H`$f$ אינה חסומה, ולכן ההתכנסות אינה במידה שווה.`, H`$f$ אינה חסומה רק ליד $x=0$, שאינו בתחום; בתחום $f\le ${hA}$.`),
          nope("pw", H`$f_n(x)\to f(x)$ בכל נקודה של התחום.`, "התכנסות נקודתית אינה מספיקה."),
        ]))],
        hints: [H`למה $h(x)\le h\left(\frac14\right)$ לכל $x\ge\frac14$? בדקו את סימן הנגזרת.`],
        solvedNote: H`$M_n=0$ החל מ־$n\ge ${hA}$: ההתכנסות במידה שווה.`,
      });
      const s4 = verdictStep(rng, "ub-4", verdictPrompt, [
        good("uniform", H`כן: מ־$n\ge ${hA}$ מתקיים $f_n=f$ בתחום, ולכן $M_n=0\to0$.`),
        wrong("not-unb", H`לא, כי $f$ אינה חסומה.`, H`$f$ אינה חסומה רק ליד $x=0$, שאינו בתחום $${domTex}$.`),
        wrong("not-pos", H`לא, כי $f_n\ne f$ עבור $n$ קטן.`, H`מה שחשוב הוא התנהגות $M_n$ כש־$n\to\infty$.`),
      ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
      H`$M_n=0$ החל מ־$n\ge ${hA}$: ההתכנסות במידה שווה.`,
      H`$h(x)=${hTex}$ יורדת (לפי משפט לגרנז', $${deriv}<0$), ולכן $h(x)\le h\left(\frac14\right)=${hA}$ בתחום. ל־$n\ge ${hA}$ מתקיים $f_n=\min\{n,h\}=h=f$ בכל התחום, ו־$M_n=0$. לפי מבחן הסופרמום ההתכנסות במידה שווה (בניגוד לתחום שכולל את הנקודות הקרובות ל־$0$).`);
      steps.push(s1, s2, s3, s4);
    }
  }

  const xMax = dom.right === Infinity ? 3 : dom.right * 1.1;
  const xMin = dom.left <= 0 ? -0.08 * (dom.right === Infinity ? 3 : dom.right) : dom.left * 0.7;
  const view = windowOf(model, xMin, xMax, far ? Infinity : 6);
  // The limit of the ramp variants has the isolated value f(0) = 0 at the left end, then climbs to infinity.
  const plot: PracticePlotSpec = { value: model.value, limit: model.limit, domain: dom, view, maxN: 40, ...(v.kind === "ramp" && !far ? { limitBreaks: [0] } : {}) };
  return {
    book, model,
    exercise: finishExercise({
      id: UNB_ID, signature: unboundedSignature(v), difficulty: unboundedDifficulty(v), title,
      statement: statementOf(dom, domTex), formula, steps, book, plot,
    }),
  };
}

export const UNBOUNDED = makeFamily<UnboundedVariant>({
  id: UNB_ID,
  grid: unboundedGrid,
  kindOf: (v) => (v.kind === "ramp" ? `ramp-${isFar(v) ? "far" : "full"}` : `cap-${isFar(v) ? "far" : "full"}`),
  difficulty: unboundedDifficulty,
  signature: unboundedSignature,
  build: buildUnbounded,
});

// =============================================================================================
// 3. A moving peak: tents and bumps with a continuous limit, whose supremum is read off at the peak
// =============================================================================================

type PeakShape = "tent" | "tentR" | "bump";
type HeightLaw = "one" | "invn" | "invsqrt";
export type PeakVariant = { shape: PeakShape; g: HeightLaw; h: 1 | 2 | 3; dom: "I1" | "farHalf" | "farRay" };

const PEAK_ID = "cont-moving-peak";

function peakGrid(): PeakVariant[] {
  const out: PeakVariant[] = [];
  for (const g of ["one", "invn", "invsqrt"] as const) {
    for (const h of [1, 2, 3] as const) {
      out.push({ shape: "tent", g, h, dom: "I1" }, { shape: "bump", g, h, dom: "I1" });
      if (h < 3) out.push({ shape: "tentR", g, h, dom: "I1" });
    }
  }
  for (const h of [1, 2, 3] as const) for (const dom of ["farHalf", "farRay"] as const) out.push({ shape: "bump", g: "one", h, dom });
  return out;
}

const peakSignature = (v: PeakVariant) => `${v.shape};g=${v.g};h=${v.h};${v.dom}`;
const peakIsFar = (v: PeakVariant) => v.dom !== "I1";
function peakDifficulty(v: PeakVariant): PracticeDifficulty {
  if (peakIsFar(v)) return "advanced";
  return v.shape === "bump" ? "medium" : "easy";
}

function peakDomain(v: PeakVariant): { dom: Dom; tex: string } {
  if (v.dom === "I1") return domainOf(q(0), q(1), true, true);
  return v.dom === "farHalf" ? domainOf(q(1, 2), q(1), true, true) : domainOf(q(1, 4), null, true, false);
}

function buildPeak(v: PeakVariant, rng: SeededRandom): Built {
  const { shape, g, h } = v;
  const book = new Book();
  const far = peakIsFar(v);
  const { dom, tex: domTex } = peakDomain(v);
  const uniform = g !== "one" || far;
  const hL = String(h);
  const halfH = fr(h, 2);
  const heightNum = (n: number) => (g === "one" ? h : g === "invn" ? h / n : h / Math.sqrt(n));
  const HTex = g === "one" ? hL : g === "invn" ? fracN(h, 1, "n") : H`\frac{${h}}{\sqrt{n}}`;
  const coefTex = g === "one" ? (h === 1 ? "" : `${h}`) : HTex;
  const peakAt = (n: number) => (shape === "tentR" ? 1 - 1 / n : 1 / n);
  const peakTex = shape === "tentR" ? H`1-\frac{1}{n}` : H`\frac{1}{n}`;
  const aNum = v.dom === "farHalf" ? 0.5 : 0.25;
  const q0 = v.dom === "farHalf" ? 2 : 4;
  const bumpAt = (n: number, x: number) => (2 * n * x) / (1 + n * n * x * x);
  const model: Model = {
    value: shape === "tent"
      ? (n, x) => heightNum(n) * Math.max(0, 1 - Math.abs(n * x - 1))
      : shape === "tentR"
        ? (n, x) => heightNum(n) * Math.max(0, 1 - Math.abs(n * (x - 1) + 1))
        : (n, x) => heightNum(n) * bumpAt(n, x),
    limit: () => 0,
    domain: dom,
    uniform,
    ...(far
      ? { sup: (n: number) => heightNum(n) * bumpAt(n, aNum), nBound: q0, ns: [100, 400, 1600] as [number, number, number] }
      : uniform
        ? { sup: heightNum, ...(g === "invsqrt" ? { ns: [100, 10_000, 1_000_000] as [number, number, number] } : {}) }
        : { sup: heightNum, gap: h }),
    ...(far ? {} : { witness: { x: peakAt, diff: heightNum } }),
    samples: samplesIn(dom, far ? [0.5, 1, 2] : [0, 0.5, 1]),
    extra: (n) => [peakAt(n), 1 / n],
    ...(dom.right === Infinity ? { scanTo: () => 6 } : {}),
  };

  const coef = coefTex;
  const bumpNum = g === "one" ? `${co(2 * h, "n")}x` : g === "invn" ? `${2 * h}x` : `${2 * h}\\sqrt{n}\\,x`;
  const formula = shape === "tent"
    ? H`f_n(x)=${coef}\max\left\{0,\ 1-\lvert nx-1\rvert\right\},\qquad x\in${domTex}`
    : shape === "tentR"
      ? H`f_n(x)=${coef}\max\left\{0,\ 1-\lvert n(x-1)+1\rvert\right\},\qquad x\in${domTex}`
      : H`f_n(x)=\frac{${bumpNum}}{1+n^{2}x^{2}},\qquad x\in${domTex}`;

  const slotLine = (id: string, lead: string, target: Chip, wrongs: Chip[]) => slotsPart(template(id, [L(lead), S(id)], [chipSlot(book, rng, id, target, wrongs)]));
  const infChip = (why: string) => bad("\\infty", K(Infinity), why);
  const verdictPrompt = H`האם $f_n\to f$ במידה שווה ${inDom(dom, domTex)}?`;
  const steps: PracticeStep[] = [];

  // ---- step 1: the pointwise limit
  const heightWrongs = (why: string): Chip[] => [
    bad(HTex, seq(heightNum), why),
    bad(hL, K(h), why),
    bad("1", K(1), why),
    infChip(why),
  ];
  let s1Parts;
  if (far) {
    s1Parts = [slotLine("pk1a", H`x\ge ${shape === "bump" && v.dom === "farHalf" ? "\\tfrac12" : "\\tfrac14"}:\quad f(x)=`, ok("0", K(0)), heightWrongs(H`ל־$x$ קבוע, החל מ־$n$ מסוים $f_n(x)\le\frac{${2 * h}}{nx}$, והביטוי שואף ל־$0$.`))];
  } else if (shape === "tentR") {
    s1Parts = [
      slotLine("pk1a", H`0\le x<1:\quad f(x)=`, ok("0", K(0)), heightWrongs(H`ל־$x<1$ קבוע, החל מ־$n$ מסוים $1-\frac{2}{n}>x$, והפסגה כבר מימין ל־$x$: $f_n(x)=0$.`)),
      slotLine("pk1b", H`x=1:\quad f(1)=`, ok("0", K(0)), heightWrongs(H`$f_n(1)=0$ לכל $n$: ב־$x=1$ הביטוי $1-\lvert n(x-1)+1\rvert$ שווה ל־$0$.`)),
    ];
  } else {
    s1Parts = [
      slotLine("pk1a", H`x=0:\quad f(0)=`, ok("0", K(0)), heightWrongs(H`$f_n(0)=0$ לכל $n$: הפסגה נמצאת ב־$x=\frac{1}{n}$, לא ב־$0$.`)),
      slotLine("pk1b", H`0<x\le1:\quad f(x)=`, ok("0", K(0)), heightWrongs(shape === "tent" ? H`ל־$x>0$ קבוע, החל מ־$n$ מסוים $\frac{2}{n}<x$, והפסגה כבר משמאל ל־$x$: $f_n(x)=0$.` : H`ל־$x>0$ קבוע, $f_n(x)\le\frac{${2 * h}}{nx}\to0$.`)),
    ];
  }
  steps.push(step({
    id: "pk-1", title: STEP_LIMIT_TITLE,
    prompt: H`חשבו את הגבול הנקודתי $f(x)=\lim_{n\to\infty}f_n(x)$ ${s1Parts.length > 1 ? "בשני חלקי התחום" : "בכל נקודה של התחום"}.`,
    parts: s1Parts,
    hints: [shape === "bump" ? H`בשבר $\frac{${bumpNum}}{1+n^{2}x^{2}}$ המכנה גדל כמו $n^{2}$ והמונה לכל היותר כמו $n$.` : H`הפסגה נעה: ל־$x$ קבוע, החל מ־$n$ מסוים היא כבר רחוקה מ־$x$.`],
    solvedNote: H`$f=0$ בכל נקודה של התחום, הפונקציה הגבולית רציפה.`,
  }));

  if (!far) {
    // ---- step 2: the candidate table
    const candRow = (id: string, lead: string, correct: Chip, wrongs: Chip[], isMaximum: boolean): CandidateRow =>
      ({ id, isMaximum, template: template(`pk2-${id}`, [L(lead), S(`pk2${id}`)], [chipSlot(book, rng, `pk2${id}`, correct, wrongs)]) });
    const zeroWrongs = (why: string): Chip[] => [bad(HTex, seq(heightNum), why), bad(halfH, K(h / 2), why), bad("1", K(1), why), bad(fracN(1, 1, "n"), seq((n) => 1 / n), why)];
    const peakWrongs = (why: string): Chip[] => [bad("0", K(0), why), bad(halfH, K(h / 2), why), bad(co(h, "n"), seq((n) => h * n), why), bad(fracN(h, 1, "n"), seq((n) => h / n), why), bad(hL, K(h), why)];
    let rows: CandidateRow[];
    let captions: Record<string, string>;
    if (shape === "tent") {
      rows = [
        candRow("a", H`f_n(0)=`, ok("0", K(0)), zeroWrongs(H`הציבו $x=0$: $1-\lvert-1\rvert=0$.`), false),
        candRow("b", H`f_n\left(\frac{1}{n}\right)=`, ok(HTex, seq(heightNum)), peakWrongs(H`הציבו $x=\frac{1}{n}$: $1-\lvert1-1\rvert=1$, והגובה הוא $${HTex}$.`), true),
        candRow("c", H`f_n\left(\frac2n\right)=`, ok("0", K(0)), zeroWrongs(H`הציבו $x=\frac2n$: $1-\lvert2-1\rvert=0$.`), false),
      ];
      captions = { a: "קצה", b: "נקודת שבירה", c: "נקודת שבירה" };
    } else if (shape === "tentR") {
      rows = [
        candRow("a", H`f_n\left(1-\frac2n\right)=`, ok("0", K(0)), zeroWrongs(H`הציבו $x=1-\frac2n$: $n(x-1)+1=-1$, ולכן $1-\lvert-1\rvert=0$.`), false),
        candRow("b", H`f_n\left(1-\frac{1}{n}\right)=`, ok(HTex, seq(heightNum)), peakWrongs(H`הציבו $x=1-\frac{1}{n}$: $n(x-1)+1=0$, ולכן הביטוי הוא $1$ והגובה $${HTex}$.`), true),
        candRow("c", H`f_n(1)=`, ok("0", K(0)), zeroWrongs(H`הציבו $x=1$: $n(x-1)+1=1$, ולכן $1-\lvert1\rvert=0$.`), false),
      ];
      captions = { a: "נקודת שבירה", b: "נקודת שבירה", c: "קצה" };
    } else {
      const bumpOne = g === "one" ? `\\frac{${co(2 * h, "n")}}{1+n^{2}}` : g === "invn" ? `\\frac{${2 * h}}{1+n^{2}}` : `\\frac{${2 * h}\\sqrt{n}}{1+n^{2}}`;
      rows = [
        candRow("a", H`f_n(0)=`, ok("0", K(0)), zeroWrongs(H`הציבו $x=0$: המונה מתאפס.`), false),
        candRow("b", H`f_n\left(\frac{1}{n}\right)=`, ok(HTex, seq(heightNum)), peakWrongs(H`הציבו $x=\frac{1}{n}$: $\frac{2\cdot1}{1+1}=1$, והגובה הוא $${HTex}$.`), true),
        candRow("c", H`f_n(1)=`, ok(bumpOne, seq((n) => heightNum(n) * bumpAt(n, 1))), [
          bad("0", K(0), H`הציבו $x=1$: המונה אינו מתאפס.`),
          bad(HTex, seq(heightNum), H`זה הערך ב־$x=\frac{1}{n}$; ב־$x=1$ המכנה גדול יותר.`),
          bad(halfH, K(h / 2), H`הציבו $x=1$ ב־$f_n$.`),
        ], false),
      ];
      captions = { a: "קצה", b: "נקודה חשודה לקיצון", c: "קצה" };
    }
    steps.push(step({
      id: "pk-2", title: "היכן המקסימום",
      prompt: H`$f=0$, ולכן $\lvert f_n-f\rvert=f_n$ (שאינה שלילית). חשבו את $f_n$ בנקודות החשודות, וסמנו את המועמד שנותן את המקסימום.`,
      parts: [tablePart("pk-2-table", rows, captions, "זה אינו המועמד שנותן את המקסימום: השוו את שלושת הערכים.")],
      hints: [shape === "bump" ? H`$f_n'(x)=0$ ב־$x=\frac{1}{n}$: זו הנקודה החשודה לקיצון הפנימית.` : H`הפסגה היא נקודת השבירה שבה $f_n$ מפסיקה לעלות.`],
      solvedNote: H`המקסימום הוא בפסגה $x=${peakTex}$: $M_n=f_n\left(${peakTex}\right)=${HTex}$.`,
    }));
    // ---- step 3: M_n and its limit
    steps.push(step({
      id: "pk-3", title: H`$M_n$ וגבולו`,
      prompt: H`כתבו את $M_n=\sup\lvert f_n-f\rvert$ וחשבו את גבולו.`,
      parts: [slotsPart(template("pk-3-mn", [L(H`M_n=`), S("pk3a"), L(H`\xrightarrow[n\to\infty]{}`), S("pk3b")], [
        chipSlot(book, rng, "pk3a", ok(HTex, seq(heightNum)), [
          bad("0", K(0), H`זה הגבול הנקודתי, לא $M_n$: $M_n$ הוא הגובה של הפסגה עבור $n$ נתון.`),
          bad(halfH, K(h / 2), H`זה אינו גובה הפסגה.`),
          bad(co(h, "n"), seq((n) => h * n), H`גובה הפסגה אינו גדל עם $n$.`),
          bad(fracN(h, 1, "n"), seq((n) => h / n), H`זה גובה הפסגה של סדרה אחרת; בדקו את $f_n$ בפסגה.`),
          bad(hL, K(h), H`בדקו את $f_n$ בפסגה: הגובה תלוי ב־$n$ או שהוא קבוע?`),
        ]),
        chipSlot(book, rng, "pk3b", ok(uniform ? "0" : hL, K(uniform ? 0 : h)), uniform
          ? [bad(hL, K(h), H`הגובה $${HTex}$ דועך עם $n$.`), bad("1", K(1), H`הגובה $${HTex}$ שואף ל־$0$.`), infChip(H`הגובה $${HTex}$ שואף ל־$0$.`)]
          : [bad("0", K(0), H`גובה הפסגה קבוע, $${hL}$: הוא אינו דועך.`), bad("1", K(1), H`הגובה הוא $${hL}$ לכל $n$.`), infChip(H`הגובה הוא $${hL}$ לכל $n$: ערך סופי.`)]),
      ]))],
      hints: [H`$M_n=f_n$ בנקודה שמצאתם בשלב הקודם.`],
      solvedNote: uniform ? H`$M_n=${HTex}\to0$.` : H`$M_n=${hL}\not\to0$.`,
    }));
    steps.push(verdictStep(rng, "pk-4", verdictPrompt, uniform
      ? [
        good("uniform", H`כן: $M_n=${HTex}\to0$.`),
        wrong("not-moving", H`לא, כי הפסגה נעה עם $n$.`, "תנועת הפסגה אינה חשובה כשגובהה שואף ל־$0$: מבחן הסופרמום בודק את הגובה."),
        wrong("not-pos", H`לא, כי $f_n(x_n)>0$ בפסגה $x_n=${peakTex}$ לכל $n$.`, H`חיוביות אינה מספיקה: מה שחשוב הוא אם $M_n\to0$.`),
      ]
      : [
        good("not-uniform", H`לא במידה שווה: $M_n=${hL}\not\to0$ (אף שהגבול $f=0$ רציף).`),
        wrong("uniform-cont", H`כן, כי כל $f_n$ והגבול $f=0$ רציפות.`, H`${THEOREM_NAME} נותן תנאי הכרחי בלבד: רציפות הגבול אינה מבטיחה התכנסות במידה שווה.`),
        wrong("uniform-pw", H`כן, כי $f_n(x)\to0$ בכל נקודה.`, "התכנסות נקודתית אינה מספיקה: הפסגה בגובה $h$ בורחת מכל נקודה קבועה."),
      ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    uniform ? H`$M_n\to0$: ההתכנסות במידה שווה.` : H`$M_n\not\to0$: ההתכנסות אינה במידה שווה.`,
    uniform
      ? H`$f=0$ ו־$f_n\ge0$, ולכן $M_n=\max f_n=f_n\left(${peakTex}\right)=${HTex}\to0$. לפי מבחן הסופרמום ההתכנסות במידה שווה.`
      : H`$f=0$ ו־$f_n\ge0$, ולכן $M_n=\max f_n=f_n\left(${peakTex}\right)=${hL}$ לכל $n$ ו־$M_n\not\to0$. לפי מבחן הסופרמום ההתכנסות אינה במידה שווה, אף ש־$f_n$ והגבול רציפות (${THEOREM_NAME} אינו מכריע כאן).`));
  } else {
    // far from the peak: the supremum is the value at the left end, by monotonicity (Lagrange)
    const aL = v.dom === "farHalf" ? "\\tfrac12" : "\\tfrac14";
    const bumpA = H`\frac{${2 * h * q0}n}{${q0 * q0}+n^{2}}`;
    const deriv = H`f_n'(x)=\frac{${co(2 * h, "n")}\left(1-n^{2}x^{2}\right)}{\left(1+n^{2}x^{2}\right)^{2}}`;
    steps.push(step({
      id: "pk-2", title: "מתי הפסגה מחוץ לתחום",
      prompt: H`הפסגה נמצאת ב־$x=\frac{1}{n}$, והתחום מתחיל ב־$x=${aL}$. מתי הפסגה משמאל לתחום?`,
      parts: [slotLine("pk2a", H`\frac{1}{n}\le ${aL}\iff n\ge`, ok(String(q0), K(q0)), [
        bad(String(q0 + 1), K(q0 + 1), H`זה תנאי מספיק אך לא שקול: כבר מ־$n=${q0}$ מתקיים $\frac{1}{n}\le ${aL}$.`),
        bad(String(q0 - 1), K(q0 - 1), H`עבור $n=${q0 - 1}$ מתקיים $\frac{1}{n}>${aL}$.`),
        bad(aL, K(1 / q0), H`זה ערך של $x$, לא של $n$.`),
        bad(String(2 * q0), K(2 * q0), H`זה תנאי מספיק אך לא שקול: כבר מ־$n=${q0}$ מתקיים $\frac{1}{n}\le ${aL}$.`),
      ])],
      hints: [H`פתרו את $\frac{1}{n}\le ${aL}$.`],
      solvedNote: H`מ־$n\ge ${q0}$ הפסגה $x=\frac{1}{n}$ אינה מימין ל־$x=${aL}$: כל התחום נמצא מימין לפסגה.`,
    }));
    steps.push(step({
      id: "pk-3", title: "היכן המקסימום",
      prompt: "סמנו את כל הנימוקים הנדרשים כדי להסיק שהמקסימום של $f_n$ בתחום הוא בקצה השמאלי, מ־$n$ מסוים.",
      parts: [checklistPart("pk-3-why", shuffle(rng, [
        must("dec", H`לפי משפט לגרנז', $${deriv}<0$ ל־$x>\frac{1}{n}$, ולכן $f_n$ יורדת ב־$\left[\frac{1}{n},\infty\right)$.`),
        must("inside", H`מ־$n\ge ${q0}$ התחום כולו מימין ל־$\frac{1}{n}$, ולכן $f_n$ יורדת בתחום.`),
        extra("nonneg", H`$f_n(x)\ge0$ לכל $x\ge0$, ולכן $\lvert f_n-f\rvert=f_n$.`, "נכון, ומשמש בהצבה $f=0$; אינו קובע היכן המקסימום."),
        nope("peak", H`הפסגה $x=\frac{1}{n}$ שייכת לתחום, ולכן $M_n=${hL}$.`, H`מ־$n\ge ${q0}$ מתקיים $\frac{1}{n}\le ${aL}$: הפסגה מחוץ לתחום (או בקצהו).`),
        nope("endpoint", H`המקסימום של פונקציה רציפה הוא תמיד בקצה השמאלי של התחום.`, "המקסימום נקבע לפי המונוטוניות של $f_n$ בתחום, לא לפי מיקום הקצה."),
      ]))],
      hints: [H`סימן $f_n'$ נקבע לפי הגורם $1-n^{2}x^{2}$: מתי הוא שלילי?`],
      solvedNote: H`$f_n$ יורדת בתחום, ולכן $M_n=f_n\left(${aL}\right)$.`,
    }));
    steps.push(step({
      id: "pk-4", title: H`$M_n$ וגבולו`,
      prompt: H`כתבו את $M_n=f_n\left(${aL}\right)$ וחשבו את גבולו.`,
      parts: [slotsPart(template("pk-4-mn", [L(H`M_n=`), S("pk4a"), L(H`\xrightarrow[n\to\infty]{}`), S("pk4b")], [
        chipSlot(book, rng, "pk4a", ok(bumpA, seq((n) => bumpAt(n, aNum) * h)), [
          bad(hL, K(h), H`זה גובה הפסגה, שנמצאת מחוץ לתחום מ־$n=${q0}$.`),
          bad(H`\frac{${co(2 * h, "n")}}{1+n^{2}}`, seq((n) => h * bumpAt(n, 1)), H`זה הערך ב־$x=1$; בקצה השמאלי $x=${aL}$.`),
          bad(H`\frac{${2 * h * q0}}{n}`, seq((n) => (2 * h * q0) / n), H`זה חסם עליון לערך, לא הערך עצמו: הציבו $x=${aL}$ ב־$f_n$.`),
        ]),
        chipSlot(book, rng, "pk4b", ok("0", K(0)), [
          bad(hL, K(h), H`הערך ב־$x=${aL}$ שואף ל־$0$, כי המכנה גדל כמו $n^{2}$.`),
          bad("1", K(1), H`המונה מסדר $n$ והמכנה מסדר $n^{2}$.`),
          infChip(H`המכנה מסדר $n^{2}$ מנצח את המונה מסדר $n$.`),
        ]),
      ]))],
      hints: [H`הציבו $x=${aL}$ ב־$\frac{${bumpNum}}{1+n^{2}x^{2}}$ וכפלו ב־$${q0 * q0}$ מונה ומכנה.`],
      solvedNote: H`$M_n=${bumpA}\to0$.`,
    }));
    steps.push(verdictStep(rng, "pk-5", verdictPrompt, [
      good("uniform", H`כן: $M_n=${bumpA}\to0$.`),
      wrong("not-peak", H`לא, כי $M_n=${hL}$ (גובה הפסגה).`, H`הפסגה $x=\frac{1}{n}$ יוצאת מהתחום $${domTex}$; סוג ההתכנסות תלוי בתחום.`),
      wrong("not-pos", H`לא, כי $M_n>0$ לכל $n$.`, H`חיוביות אינה מספיקה: מה שחשוב הוא אם $M_n\to0$.`),
    ], [H`מבחן הסופרמום: ההתכנסות במידה שווה אם ורק אם $M_n\to0$.`],
    H`$M_n\to0$: ההתכנסות במידה שווה.`,
    H`$f=0$ ו־$f_n\ge0$. מ־$n\ge ${q0}$ התחום מימין לפסגה $x=\frac{1}{n}$, ו־$f_n$ יורדת שם (לפי משפט לגרנז', $${deriv}<0$), ולכן $M_n=f_n\left(${aL}\right)=${bumpA}\to0$. לפי מבחן הסופרמום ההתכנסות במידה שווה (בניגוד לתחום שכולל את הפסגה, שבו $M_n=${hL}$).`));
  }

  const xMax = dom.right === Infinity ? 3 : dom.right * 1.08;
  const view = windowOf(model, -0.06 * (dom.right === Infinity ? 3 : 1), xMax);
  const plot: PracticePlotSpec = {
    value: model.value, limit: model.limit, domain: dom, view, maxN: 40,
    ...(far ? { marker: () => aNum, markerLabel: "הקצה השמאלי, שם המקסימום" } : { marker: peakAt, markerLabel: "הפסגה הנעה" }),
  };
  return {
    book, model,
    exercise: finishExercise({
      id: PEAK_ID, signature: peakSignature(v), difficulty: peakDifficulty(v),
      title: far ? "פסגה שבורחת מהתחום" : uniform ? "פסגה נעה שגובהה דועך" : "פסגה נעה בגובה קבוע",
      statement: statementOf(dom, domTex, "המוגדרת למטה"), formula, steps, book, plot,
    }),
  };
}

export const MOVING_PEAK = makeFamily<PeakVariant>({
  id: PEAK_ID,
  grid: peakGrid,
  kindOf: (v) => `${v.shape}-${v.dom}`,
  difficulty: peakDifficulty,
  signature: peakSignature,
  build: buildPeak,
});

// =============================================================================================
// 4a. Discontinuous f_n: integer parts. c floor(nx)/n converges uniformly (the converse of the theorem fails)
// =============================================================================================

type FloorKind = "lin" | "quad";
export type FloorVariant = { kind: FloorKind; c: 1 | 2; dom: "half" | "closed" | "sym" | "ray" | "two" };

const FLOOR_ID = "cont-floor";

function floorGrid(): FloorVariant[] {
  const out: FloorVariant[] = [];
  for (const c of [1, 2] as const) {
    for (const dom of ["half", "closed", "sym", "ray"] as const) out.push({ kind: "lin", c, dom });
    for (const dom of ["closed", "two", "ray"] as const) out.push({ kind: "quad", c, dom });
  }
  return out;
}

const floorSignature = (v: FloorVariant) => `${v.kind};c=${v.c};${v.dom}`;
const floorDifficulty = (v: FloorVariant): PracticeDifficulty => (v.kind === "lin" ? "easy" : v.dom === "ray" ? "advanced" : "medium");

function floorDomain(v: FloorVariant): { dom: Dom; tex: string } {
  switch (v.dom) {
    case "half": return domainOf(q(0), q(1), true, false);
    case "closed": return domainOf(q(0), q(1), true, true);
    case "sym": return domainOf(q(-1), q(1), true, true);
    case "two": return domainOf(q(0), q(2), true, true);
    default: return domainOf(q(0), null, true, false);
  }
}

/** floor(n x) with a hair of rounding slack, so that the exact jump points k/n take the value of the right-hand piece. */
const floorOf = (n: number, x: number) => Math.floor(n * x + 1e-10);

function buildFloor(v: FloorVariant, rng: SeededRandom): Built {
  const { kind, c } = v;
  const lin = kind === "lin";
  const book = new Book();
  const { dom, tex: domTex } = floorDomain(v);
  const ray = dom.right === Infinity;
  const hi = ray ? (lin ? 6 : 12) : dom.right;
  const bTop = ray ? 0 : dom.right;
  const fnTex = lin ? H`\frac{${co(c, "\\lfloor nx\\rfloor")}}{n}` : H`\frac{${co(c, "\\lfloor nx\\rfloor")}}{n^{2}}`;
  const cx = co(c, "x");
  const cn = fracN(c, 1, "n");
  const jump = lin ? cn : fracN(c, 1, "n^{2}");
  const uniform = lin || !ray;
  const model: Model = {
    value: lin ? (n, x) => (c * floorOf(n, x)) / n : (n, x) => (c * floorOf(n, x)) / (n * n),
    limit: lin ? (x) => c * x : () => 0,
    domain: dom,
    uniform,
    ...(lin
      ? { sup: (n: number) => c / n, nBound: 1 }
      : ray
        ? { gap: c, witness: { x: (n: number) => n, diff: () => c } }
        : { bound: (n: number) => (c * bTop) / n }),
    samples: samplesIn(dom, [dom.left, 0.5, -0.5, 1, 1.5]),
    extra: (n) => {
      const out: number[] = [];
      const lo = Math.max(dom.left, -1);
      for (let k = Math.ceil(lo * n) + 1; k <= Math.floor(hi * n) + 1; k += 1) out.push((k - 1e-6) / n);
      return lin ? out : [n, ...out.slice(-3)];
    },
    ...(ray ? { scanTo: lin ? () => 6 : (n: number) => n + 2 } : {}),
  };

  const slotLine = (id: string, lead: string, target: Chip, wrongs: Chip[], bound?: number[]) => slotsPart(template(id, [L(lead), S(id)], [chipSlot(book, rng, id, target, wrongs, bound)]));
  const infChip = (why: string) => bad("\\infty", K(Infinity), why);
  const verdictPrompt = H`האם $f_n\to f$ במידה שווה ${inDom(dom, domTex)}?`;
  const steps: PracticeStep[] = [];

  // ---- step 1: the f_n are not continuous
  steps.push(step({
    id: "fl-1", title: H`האם $f_n$ רציפות?`,
    prompt: H`הפונקציה $\lfloor y\rfloor$ היא החלק השלם של $y$. בדקו את הרציפות של $f_n(x)=${fnTex}$.`,
    parts: [choicePart("fl-1-cont", "בחרו את הטענה הנכונה.", shuffle(rng, [
      good("jumps", H`לא: ל־$n\ge2$ הפונקציה $f_n$ קופצת ב־$${jump}$ בכל נקודה פנימית $x=\frac{k}{n}$ של התחום.`),
      wrong("cont", H`כל $f_n$ רציפה, כי $nx$ רציפה.`, H`$\lfloor y\rfloor$ קופצת בכל $y$ שלם, ולכן $f_n$ קופצת כש־$nx$ שלם, כלומר ב־$x=\frac{k}{n}$.`),
      wrong("between", H`$f_n$ קבועה בין הנקודות $\frac{k}{n}$, ולכן רציפה בכל התחום.`, "רציפות בין הנקודות אינה מספיקה: בנקודות $\\frac{k}{n}$ עצמן יש קפיצה."),
    ]))],
    hints: [H`לאילו $x$ המספר $nx$ שלם? מה קורה ל־$\lfloor nx\rfloor$ שם?`],
    solvedNote: H`$f_n$ אינן רציפות (ל־$n\ge2$), ולכן ${THEOREM_NAME}, שמניח שהן רציפות, אינו חל כאן.`,
  }));

  // ---- step 2: the pointwise limit
  const xSig = (f: (x: number) => number) => xs(f);
  steps.push(step({
    id: "fl-2", title: STEP_LIMIT_TITLE,
    prompt: H`חשבו את הגבול הנקודתי $f(x)=\lim_{n\to\infty}f_n(x)$. ${lin ? "היעזרו באי־השוויון $nx-1<\\lfloor nx\\rfloor\\le nx$." : "היעזרו באי־השוויון $\\lfloor nx\\rfloor\\le nx$."}`,
    parts: [slotLine("fl2a", H`f(x)=`, lin ? ok(cx, xSig((x) => c * x)) : ok("0", K(0)), lin
      ? [
        bad("0", K(0), H`$\lfloor nx\rfloor\approx nx$, ולכן $\frac{\lfloor nx\rfloor}{n}\approx x$ ולא $0$.`),
        bad(co(c, "\\lfloor x\\rfloor"), xSig((x) => c * Math.floor(x)), H`$\lfloor nx\rfloor$ הוא החלק השלם של $nx$, לא של $x$.`),
        bad(c === 1 ? H`\frac{x}{2}` : "x", xSig((x) => (c === 1 ? x / 2 : x)), H`$nx-1<\lfloor nx\rfloor\le nx$: חלקו ב־$n$ ובצעו את הגבול.`),
        bad(String(c), K(c), H`הגבול תלוי ב־$x$: $nx-1<\lfloor nx\rfloor\le nx$.`),
      ]
      : [
        bad(cx, xSig((x) => c * x), H`הגבול של $\frac{\lfloor nx\rfloor}{n}$ הוא $x$, אבל כאן המכנה הוא $n^{2}$: מקבלים עוד גורם $\frac{1}{n}$.`),
        bad(String(c), K(c), H`$0\le\lfloor nx\rfloor\le nx$, ולכן $0\le f_n(x)\le\frac{${cx}}{n}\to0$.`),
        infChip(H`$0\le f_n(x)\le\frac{${cx}}{n}$, ולכן $f_n(x)\to0$ ל־$x$ קבוע.`),
      ])],
    hints: [lin ? H`$x-\frac{1}{n}<\frac{\lfloor nx\rfloor}{n}\le x$, וצמצמו את $n$.` : H`$0\le\frac{\lfloor nx\rfloor}{n^{2}}\le\frac{x}{n}$.`],
    solvedNote: lin ? H`$f(x)=${cx}$: הגבול רציף.` : H`$f(x)=0$: הגבול רציף.`,
  }));

  // ---- step 3: the bound, or the moving point
  if (lin) {
    steps.push(step({
      id: "fl-3", title: H`חסם על הפער`,
      prompt: H`לפי $nx-1<\lfloor nx\rfloor\le nx$ מתקבל $${cx}-f_n(x)=\frac{${co(c, "(nx-\\lfloor nx\\rfloor)")}}{n}$ ו־$0\le nx-\lfloor nx\rfloor<1$. מצאו חסם עליון לפער, ומה אז $M_n$ וגבולו.`,
      parts: [
        slotLine("fl3a", H`0\le ${cx}-f_n(x)<`, ok(cn, seq((n) => c / n)), [
          bad(fracN(c, 2, "n"), seq((n) => c / (2 * n)), H`זה אינו חסם: כש־$nx$ קרוב משמאל לשלם, הפער מתקרב ל־$${cn}$.`),
          bad(fracN(c, 1, "n^{2}"), seq((n) => c / n ** 2), H`זה אינו חסם: $nx-\lfloor nx\rfloor$ יכול להתקרב ל־$1$, והפער ל־$${cn}$.`),
          bad(H`\frac{${c}}{n+1}`, seq((n) => c / (n + 1)), H`זה אינו חסם: הפער מתקרב ל־$${cn}$.`),
        ], seq((n) => c / n)),
        slotsPart(template("fl3b", [L(H`M_n=`), S("fl3b1"), L(H`\xrightarrow[n\to\infty]{}`), S("fl3b2")], [
          chipSlot(book, rng, "fl3b1", ok(cn, seq((n) => c / n)), [
            bad("0", K(0), H`הפער חיובי בנקודות שאינן $\frac kn$, ו־$M_n$ הוא סופרמום לפי $x$ עבור $n$ נתון.`),
            bad(String(c), K(c), H`הפער קטן מ־$${cn}$, לא מ־$${c}$.`),
            bad(fracN(c, 2, "n"), seq((n) => c / (2 * n)), H`הפער מתקרב ל־$${cn}$ משמאל לכל נקודה $\frac kn$.`),
          ]),
          chipSlot(book, rng, "fl3b2", ok("0", K(0)), [
            bad(String(c), K(c), H`$${cn}\to0$.`),
            bad("1", K(1), H`$${cn}\to0$.`),
            infChip(H`$${cn}\to0$.`),
          ]),
        ])),
      ],
      hints: [H`$0\le nx-\lfloor nx\rfloor<1$: חלקו ב־$n$ וכפלו ב־$${c}$.`],
      solvedNote: H`$0\le ${cx}-f_n(x)<${cn}$, ולכן $M_n=${cn}\to0$ (סופרמום שאינו מתקבל).`,
    }));
  } else if (!ray) {
    const bC = fracN(c * bTop, 1, "n");
    steps.push(step({
      id: "fl-3", title: H`חסם על $f_n$`,
      prompt: H`$f=0$, ולכן $\lvert f_n-f\rvert=f_n$. מצאו חסם ל־$f_n(x)$ בעזרת $\lfloor nx\rfloor\le nx$, ומשם חסם ל־$M_n$ בתחום.`,
      parts: [
        slotLine("fl3a", H`0\le f_n(x)\le`, ok(H`\frac{${cx}}{n}`, nx((n, x) => (c * x) / n)), [
          bad(H`\frac{${cx}}{n^{2}}`, nx((n, x) => (c * x) / n ** 2), H`זה אינו חסם: $\lfloor nx\rfloor$ יכול להיות קרוב ל־$nx$, ו־$f_n=\frac{${co(c, "\\lfloor nx\\rfloor")}}{n^{2}}$ מגיע ל־$\frac{${cx}}{n}$.`),
          bad(c === 1 ? H`\frac{x}{2n}` : H`\frac{x}{n}`, nx((n, x) => (c === 1 ? x / (2 * n) : x / n)), H`זה אינו חסם: $\lfloor nx\rfloor$ יכול להיות קרוב ל־$nx$.`),
          bad(fracN(c, 1, "n^{2}"), nx((n) => c / n ** 2), H`זה אינו חסם: ב־$x\ge1$ הפונקציה $f_n$ גדולה מ־$\frac{${c}}{n^{2}}$.`),
        ], nx((n, x) => (c * floorOf(n, x)) / (n * n))),
        slotsPart(template("fl3b", [L(H`M_n\le`), S("fl3b1"), L(H`\xrightarrow[n\to\infty]{}`), S("fl3b2")], [
          chipSlot(book, rng, "fl3b1", ok(bC, seq((n) => (c * bTop) / n)), [
            bad(fracN(c * bTop, 1, "n^{2}"), seq((n) => (c * bTop) / n ** 2), H`זה אינו חסם: ב־$x=${bTop}$ מתקיים $f_n(${bTop})=\frac{${c * bTop}}{n}$.`),
            bad(fracN(c * bTop, 2, "n"), seq((n) => (c * bTop) / (2 * n)), H`זה אינו חסם: ב־$x=${bTop}$ מתקיים $f_n(${bTop})=\frac{${c * bTop}}{n}$.`),
            bad(fracN(c, 1, "n^{2}"), seq((n) => c / n ** 2), H`זה אינו חסם: בקצה הימני $f_n$ גדולה מזה.`),
          ], seq((n) => (c * floorOf(n, bTop)) / (n * n))),
          chipSlot(book, rng, "fl3b2", ok("0", K(0)), [
            bad(String(c * bTop), K(c * bTop), H`$\frac{${c * bTop}}{n}\to0$.`),
            bad("1", K(1), H`$\frac{${c * bTop}}{n}\to0$.`),
            infChip(H`$\frac{${c * bTop}}{n}\to0$.`),
          ]),
        ])),
      ],
      hints: [H`$\lfloor nx\rfloor\le nx$, ולכן $\frac{\lfloor nx\rfloor}{n^{2}}\le\frac{x}{n}$. בתחום $x\le ${bTop}$.`],
      solvedNote: H`$0\le f_n(x)\le\frac{${cx}}{n}\le ${bC}$, ולכן $M_n\to0$.`,
    }));
  } else {
    steps.push(step({
      id: "fl-3", title: "נקודה נעה",
      prompt: H`בתחום יש $x$ גדולים כרצוננו. בדקו את $f_n$ בנקודה $x_n$ שגדלה עם $n$: מצאו $x_n$ שבה $f_n(x_n)$ אינה שואפת ל־$0$, וחשבו אותה.`,
      parts: [
        slotLine("fl3a", H`x_n=`, ok("n", seq((n) => n)), [
          bad("1", K(1), H`$f_n(1)=\frac{${co(c, "n")}}{n^{2}}=${cn}\to0$.`),
          bad(H`\frac{1}{n}`, seq((n) => 1 / n), H`$f_n\left(\frac{1}{n}\right)=\frac{${c}}{n^{2}}\to0$.`),
          bad(H`\sqrt{n}`, seq((n) => Math.sqrt(n)), H`$f_n\left(\sqrt{n}\right)\approx\frac{${co(c, "n\\sqrt{n}")}}{n^{2}}=\frac{${c}}{\sqrt{n}}\to0$.`),
        ]),
        slotLine("fl3b", H`f_n(x_n)=\frac{${co(c, "\\lfloor n^{2}\\rfloor")}}{n^{2}}=`, ok(String(c), K(c)), [
          bad("0", K(0), H`$\lfloor n^{2}\rfloor=n^{2}$, ולכן הביטוי הוא $${c}$.`),
          bad(cn, seq((n) => c / n), H`$\lfloor n^{2}\rfloor=n^{2}$ מצטמצם עם המכנה $n^{2}$ ללא גורם נוסף.`),
          bad(co(c, "n"), seq((n) => c * n), H`$\lfloor n^{2}\rfloor=n^{2}$, והמכנה הוא $n^{2}$.`),
        ]),
      ],
      hints: [H`בחרו $x_n$ כך ש־$nx_n$ גדול כמו $n^{2}$.`],
      solvedNote: H`$f_n(n)=${c}$ לכל $n$, ולכן $M_n\ge ${c}$ ואינו שואף ל־$0$.`,
    }));
  }

  // ---- step 4: the verdict
  const THEOREM_SILENT = H`${THEOREM_NAME} אינו חל כאן ($f_n$ אינן רציפות), ואין בכך סתירה.`;
  steps.push(verdictStep(rng, "fl-4", verdictPrompt, uniform
    ? [
      good("uniform", lin
        ? H`כן: $0\le ${cx}-f_n(x)<${cn}$, ולכן $M_n\le ${cn}\to0$, אף ש־$f_n$ אינן רציפות.`
        : H`כן: $0\le f_n(x)\le\frac{${cx}}{n}\le ${fracN(c * bTop, 1, "n")}$, ולכן $M_n\to0$, אף ש־$f_n$ אינן רציפות.`),
      wrong("not-disc", H`לא, כי $f_n$ אינן רציפות.`, H`${THEOREM_NAME} אומר שרציפות $f_n$ וההתכנסות במידה שווה גוררות רציפות הגבול; לא להפך. התכנסות במידה שווה אפשרית גם כש־$f_n$ אינן רציפות.`),
      wrong("contradiction", H`לא, כי הגבול רציף ו־$f_n$ אינן רציפות, בסתירה ל${THEOREM_NAME}.`, "המשפט מניח ש־$f_n$ רציפות; כשההנחה אינה מתקיימת אין סתירה."),
    ]
    : [
      good("not-uniform", H`לא: $f_n(n)=${c}$ לכל $n$, ולכן $M_n\ge ${c}\not\to0$ (בנקודה נעה).`),
      wrong("uniform-cont", H`כן, כי הגבול $f=0$ רציף.`, "רציפות הגבול אינה מבטיחה התכנסות במידה שווה."),
      wrong("uniform-pw", H`כן, כי $f_n(x)\to0$ בכל נקודה, ו־$0\le f_n(x)\le\frac{${cx}}{n}$.`, H`החסם $\frac{${cx}}{n}$ תלוי ב־$x$ וגדל ללא גבול בתחום, ולכן אינו חסם אחיד.`),
    ],
  [lin ? H`מצאו חסם אחיד לפער: אחד שאינו תלוי ב־$x$.` : ray ? H`האם החסם $\frac{${cx}}{n}$ אחיד בתחום?` : H`בתחום $x\le ${bTop}$, ולכן אפשר לחסום את $f_n$ בחסם שאינו תלוי ב־$x$.`],
  uniform ? H`$M_n\to0$: ההתכנסות במידה שווה.` : H`$M_n\not\to0$: ההתכנסות אינה במידה שווה.`,
  uniform
    ? lin
      ? H`$nx-1<\lfloor nx\rfloor\le nx$, ולכן $0\le ${cx}-f_n(x)<${cn}$ לכל $x$, והסופרמום $M_n\le ${cn}\to0$: התכנסות במידה שווה לפונקציה הרציפה $f(x)=${cx}$, אף שאף $f_n$ ($n\ge2$) אינה רציפה. ${THEOREM_SILENT} הדוגמה מראה שההפך מ${THEOREM_NAME} אינו נכון.`
      : H`$0\le\lfloor nx\rfloor\le nx$, ולכן $0\le f_n(x)\le\frac{${cx}}{n}\le ${fracN(c * bTop, 1, "n")}$ בתחום, והסופרמום $M_n\to0$: התכנסות במידה שווה לפונקציה הרציפה $f=0$, אף שאף $f_n$ ($n\ge2$) אינה רציפה. ${THEOREM_SILENT}`
    : H`ב־$x_n=n$ מתקיים $f_n(x_n)=\frac{${co(c, "\\lfloor n^{2}\\rfloor")}}{n^{2}}=${c}$ ו־$f(x_n)=0$, ולכן $M_n\ge ${c}$ ואינו שואף ל־$0$: ההתכנסות אינה במידה שווה, אף שהגבול $f=0$ רציף (${THEOREM_NAME} אינו חל, כי $f_n$ אינן רציפות).`));

  const xMax = ray ? hi : dom.right * 1.1;
  const view = windowOf(model, -0.1 * (ray ? hi : 1), xMax, Infinity, lin ? [1, 2, 5, 40] : [1, 2, 5]);
  const plot: PracticePlotSpec = {
    value: model.value, limit: model.limit, domain: dom, view, maxN: 40,
    breaks: (n) => {
      const from = Math.max(dom.left, view.xMin);
      const to = Math.min(dom.right, view.xMax);
      const out: number[] = [];
      for (let k = Math.ceil(from * n); k / n <= to; k += 1) if (k / n > from) out.push(k / n);
      return out;
    },
    ...(ray && !lin ? { marker: (n: number) => n, markerLabel: "הנקודה הנעה" } : {}),
  };
  return {
    book, model,
    exercise: finishExercise({
      id: FLOOR_ID, signature: floorSignature(v), difficulty: floorDifficulty(v),
      title: lin ? "חלק שלם: התכנסות במידה שווה לפונקציה רציפה" : ray ? "חלק שלם: נקודה נעה" : "חלק שלם בריבוע המכנה",
      statement: statementOf(dom, domTex, "המוגדרת למטה בעזרת החלק השלם"), formula: H`f_n(x)=${fnTex},\qquad x\in${domTex}`, steps, book, plot,
    }),
  };
}

export const FLOOR = makeFamily<FloorVariant>({
  id: FLOOR_ID,
  grid: floorGrid,
  kindOf: (v) => `${v.kind}-${v.dom === "ray" ? "ray" : "fin"}`,
  difficulty: floorDifficulty,
  signature: floorSignature,
  build: buildFloor,
});

// =============================================================================================
// 4b. Discontinuous f_n: indicators of [0, 1/n] and of the point x = 1/n (the theorem is silent)
// =============================================================================================

type IndKind = "interval" | "point";
export type IndicatorVariant = { kind: IndKind; g: "one" | "invn"; h: 1 | 2; dom: "closed1" | "closed2" | "open1" };

const IND_ID = "cont-indicator";

function indicatorGrid(): IndicatorVariant[] {
  const out: IndicatorVariant[] = [];
  for (const kind of ["interval", "point"] as const) for (const g of ["one", "invn"] as const) for (const h of [1, 2] as const) {
    for (const dom of ["closed1", "closed2", "open1"] as const) out.push({ kind, g, h, dom });
  }
  return out;
}

const indicatorSignature = (v: IndicatorVariant) => `${v.kind};g=${v.g};h=${v.h};${v.dom}`;
function indicatorDifficulty(v: IndicatorVariant): PracticeDifficulty {
  if (v.kind === "interval") return v.g === "one" ? (v.dom === "open1" ? "medium" : "easy") : "medium";
  return v.g === "one" && v.dom !== "open1" ? "medium" : "advanced";
}

function indicatorDomain(v: IndicatorVariant): { dom: Dom; tex: string } {
  return v.dom === "closed1" ? domainOf(q(0), q(1), true, true) : v.dom === "closed2" ? domainOf(q(0), q(2), true, true) : domainOf(q(0), q(1), false, true);
}

function buildIndicator(v: IndicatorVariant, rng: SeededRandom): Built {
  const { kind, g, h } = v;
  const book = new Book();
  const { dom, tex: domTex } = indicatorDomain(v);
  const interval = kind === "interval";
  const uniform = g === "invn";
  const hL = String(h);
  const heightNum = (n: number) => (g === "one" ? h : h / n);
  const HTex = g === "one" ? hL : fracN(h, 1, "n");
  const closed = dom.leftClosed;
  const model: Model = {
    value: interval ? (n, x) => (x <= 1 / n ? heightNum(n) : 0) : (n, x) => (x === 1 / n ? heightNum(n) : 0),
    limit: interval && g === "one" ? (x) => (x === 0 ? h : 0) : () => 0,
    domain: dom,
    uniform,
    sup: heightNum,
    ...(uniform ? {} : { gap: h }),
    witness: { x: interval ? (n: number) => 1 / (2 * n) : (n: number) => 1 / n, diff: heightNum },
    samples: samplesIn(dom, [0, 0.5, 1]),
    extra: (n) => [1 / n, 1 / (2 * n)],
  };
  const fnCases = casesOf(interval
    ? [[HTex, H`x\le\frac{1}{n}`], ["0", H`x>\frac{1}{n}`]]
    : [[HTex, H`x=\frac{1}{n}`], ["0", H`x\ne\frac{1}{n}`]], domTex);
  const xMid = interval ? H`\frac{1}{2n}` : H`\frac{1}{n}`;
  const slotLine = (id: string, lead: string, target: Chip, wrongs: Chip[]) => slotsPart(template(id, [L(lead), S(id)], [chipSlot(book, rng, id, target, wrongs)]));
  const infChip = (why: string) => bad("\\infty", K(Infinity), why);
  const verdictPrompt = H`האם $f_n\to f$ במידה שווה ${inDom(dom, domTex)}?`;
  const steps: PracticeStep[] = [];

  steps.push(step({
    id: "in-1", title: H`האם $f_n$ רציפות?`,
    prompt: H`הסדרה נתונה בשני חלקים. בדקו את הרציפות של $f_n$ ב־$x=\frac{1}{n}$.`,
    parts: [choicePart("in-1-cont", "בחרו את הטענה הנכונה.", shuffle(rng, [
      good("jump", interval
        ? H`לא: $f_n(\frac{1}{n})=${HTex}$ אך $f_n(x)=0$ לכל $x>\frac{1}{n}$, ולכן $f_n$ קופצת ב־$x=\frac{1}{n}$.`
        : H`לא: $f_n(\frac{1}{n})=${HTex}$ אך $f_n(x)=0$ בכל נקודה אחרת, ולכן $f_n$ אינה רציפה ב־$x=\frac{1}{n}$.`),
      wrong("cont-const", H`כן, כי $f_n$ קבועה בכל אחד מהחלקים.`, "קבועה בכל חלק אינה גוררת רציפות בנקודת החיבור: צריך להשוות את הגבולות החד־צדדיים לערך."),
      wrong("cont-small", H`כן, כי הקפיצה קטנה כש־$n$ גדול.`, interval && g === "invn" ? "אין קפיצה קטנה כשלעצמה: אם יש קפיצה, הפונקציה אינה רציפה (גם אם הקפיצה קטנה)." : "גודל הקפיצה אינו שואף ל־$0$; ואף אם היה שואף, $f_n$ עדיין אינה רציפה."),
    ]))],
    hints: [H`השוו את $f_n(\frac{1}{n})$ לערכי $f_n$ סמוך ל־$x=\frac{1}{n}$.`],
    solvedNote: H`$f_n$ אינה רציפה, ולכן ${THEOREM_NAME}, שמניח ש־$f_n$ רציפות, אינו חל כאן.`,
  }));

  const limParts = interval && g === "one" && closed
    ? [
      slotLine("in2a", H`x=0:\quad f(0)=`, ok(hL, K(h)), [
        bad("0", K(0), H`$f_n(0)=${hL}$ לכל $n$ ($0\le\frac{1}{n}$): סדרה קבועה.`),
        infChip(H`$f_n(0)=${hL}$ לכל $n$: סדרה קבועה.`),
        bad(hL === "1" ? "2" : "1", K(h === 1 ? 2 : 1), H`$f_n(0)=${hL}$ לכל $n$.`),
      ]),
      slotLine("in2b", H`x>0:\quad f(x)=`, ok("0", K(0)), [
        bad(hL, K(h), H`ל־$x>0$ קבוע, החל מ־$n$ מסוים $\frac{1}{n}<x$, ואז $f_n(x)=0$.`),
        infChip(H`החל מ־$n$ מסוים $f_n(x)=0$.`),
        bad(fr(h, 2), K(h / 2), H`$f_n$ מקבלת רק את הערכים $0$ ו־$${hL}$.`),
      ]),
    ]
    : [slotLine("in2a", interval && closed ? H`x\ge0:\quad f(x)=` : H`x>0:\quad f(x)=`, ok("0", K(0)), [
      bad(hL, K(h), interval
        ? H`ל־$x>0$ קבוע, החל מ־$n$ מסוים $\frac{1}{n}<x$, ואז $f_n(x)=0$${closed ? H`; ב־$x=0$ הגובה $${HTex}$ שואף ל־$0$` : ""}.`
        : H`$f_n(x)=${HTex}$ רק עבור $n=\frac1x$, לכל היותר עבור $n$ אחד.`),
      bad(fr(h, 2), K(h / 2), H`$f_n$ מקבלת רק את הערכים $0$ ו־$${HTex}$, ולא ערך בינוני.`),
      infChip(H`$f_n$ מקבלת רק את הערכים $0$ ו־$${HTex}$.`),
    ])];
  steps.push(step({
    id: "in-2", title: STEP_LIMIT_TITLE,
    prompt: H`חשבו את הגבול הנקודתי $f(x)=\lim_{n\to\infty}f_n(x)$ ${limParts.length > 1 ? "בשני חלקי התחום" : "בכל נקודה של התחום"}.`,
    parts: limParts,
    hints: [interval ? H`ל־$x>0$ קבוע, מתי מתקיים $x\le\frac{1}{n}$?` : H`ל־$x$ קבוע, כמה ערכי $n$ מקיימים $x=\frac{1}{n}$?`],
    solvedNote: interval && g === "one" && closed ? H`$f(0)=${hL}$ ו־$f(x)=0$ ל־$x>0$: הגבול אינו רציף ב־$0$.` : H`$f=0$ בכל נקודה של התחום: הגבול רציף.`,
  }));

  if (!uniform) {
    steps.push(step({
      id: "in-3", title: "הפער בנקודה נעה",
      prompt: H`מצאו נקודה $x_n$ שבה $f_n$ שווה ל־$${hL}$ ו־$f$ שווה ל־$0$ (נקודה שנעה עם $n$), וחשבו את הפער.`,
      parts: [
        slotLine("in3a", H`x_n=`, ok(xMid, seq((n) => (interval ? 1 / (2 * n) : 1 / n))), interval
          ? [
            bad(H`\frac{2}{n}`, seq((n) => 2 / n), H`ב־$x=\frac2n>\frac{1}{n}$ מתקיים $f_n=0$, והפער $0$.`),
            bad(H`\frac{3}{2n}`, seq((n) => 3 / (2 * n)), H`ב־$x=\frac{3}{2n}>\frac{1}{n}$ מתקיים $f_n=0$, והפער $0$.`),
            bad("1", K(1), H`ב־$x=1$ מתקיים $f_n=0$ ל־$n\ge2$, והפער $0$.`),
          ]
          : [
            bad(H`\frac{1}{2n}`, seq((n) => 1 / (2 * n)), H`$f_n(x)=${hL}$ רק ב־$x=\frac{1}{n}$; בכל נקודה אחרת $f_n=0$.`),
            bad(H`\frac{2}{n}`, seq((n) => 2 / n), H`$f_n(x)=${hL}$ רק ב־$x=\frac{1}{n}$; בכל נקודה אחרת $f_n=0$.`),
            bad(H`\frac{1}{n^{2}}`, seq((n) => 1 / n ** 2), H`$f_n(x)=${hL}$ רק ב־$x=\frac{1}{n}$; בכל נקודה אחרת $f_n=0$.`),
          ]),
        slotLine("in3b", H`\lvert f_n(x_n)-f(x_n)\rvert=`, ok(hL, K(h)), [
          bad("0", K(0), H`$f_n(x_n)=${hL}$ ו־$f(x_n)=0$ שונים.`),
          bad(co(h, "n"), seq((n) => h * n), H`$f_n$ מקבלת רק את הערכים $0$ ו־$${hL}$.`),
          bad(fracN(h, 1, "n"), seq((n) => h / n), H`גובה הקפיצה הוא $${hL}$, קבוע.`),
        ]),
      ],
      hints: [interval ? H`בחרו $x_n\in(0,\frac{1}{n}]$, שם $f_n=${hL}$ ו־$f=0$.` : H`$f_n(x)\ne0$ רק ב־$x=\frac{1}{n}$.`],
      solvedNote: H`$\lvert f_n(x_n)-f(x_n)\rvert=${hL}$ לכל $n$, ולכן $M_n=${hL}\not\to0$.`,
    }));
  } else {
    steps.push(step({
      id: "in-3", title: H`חישוב $M_n$`,
      prompt: H`$f=0$ ו־$f_n$ מקבלת רק את הערכים $0$ ו־$${HTex}$. חשבו את $M_n=\sup\lvert f_n-f\rvert$ ואת גבולו.`,
      parts: [slotsPart(template("in-3-mn", [L(H`M_n=`), S("in3a"), L(H`\xrightarrow[n\to\infty]{}`), S("in3b")], [
        chipSlot(book, rng, "in3a", ok(HTex, seq(heightNum)), [
          bad("0", K(0), H`$M_n$ הוא הסופרמום לפי $x$ עבור $n$ נתון, וב־$x=${xMid}$ הפער הוא $${HTex}$ ולא $0$.`),
          bad(hL, K(h), H`זה הגובה של $f_1$; עבור $n$ כללי הגובה הוא $${HTex}$.`),
          bad(co(h, "n"), seq((n) => h * n), H`הגובה הוא $${HTex}$ ואינו גדל עם $n$.`),
        ]),
        chipSlot(book, rng, "in3b", ok("0", K(0)), [
          bad(hL, K(h), H`$${HTex}\to0$.`),
          bad("1", K(1), H`$${HTex}\to0$.`),
          infChip(H`$${HTex}\to0$.`),
        ]),
      ]))],
      hints: [H`$\lvert f_n(x)-f(x)\rvert=f_n(x)\le ${HTex}$, והשוויון מתקבל.`],
      solvedNote: H`$M_n=${HTex}\to0$.`,
    }));
  }

  steps.push(verdictStep(rng, "in-4", verdictPrompt, uniform
    ? [
      good("uniform", H`כן: $M_n=${HTex}\to0$, אף ש־$f_n$ אינן רציפות.`),
      wrong("not-disc", H`לא, כי $f_n$ אינן רציפות.`, H`${THEOREM_NAME} אינו אומר ש־$f_n$ חייבות להיות רציפות; התכנסות במידה שווה אפשרית גם כשהן אינן.`),
      wrong("not-jump", H`לא, כי $f_n$ קופצת ב־$x=\frac{1}{n}$.`, H`גודל הקפיצה הוא $${HTex}\to0$: מבחן הסופרמום בודק את הגובה.`),
    ]
    : [
      good("not-uniform", H`לא: $M_n=${hL}\not\to0$ (ישירות מהגדרת הסופרמום).`),
      ...(interval && g === "one" && closed
        ? [wrong("not-thm", H`לא, כי הגבול $f$ אינו רציף ב־$x=0$, לפי ${THEOREM_NAME}.`, H`${THEOREM_NAME} מניח ש־$f_n$ רציפות, וכאן הן אינן. הטיעון אינו תקף (גם אם המסקנה נכונה): צריך לחשב את $M_n$.`)]
        : [wrong("uniform-cont", H`כן, כי הגבול $f=0$ רציף.`, "רציפות הגבול אינה מבטיחה התכנסות במידה שווה, ובמיוחד כש־$f_n$ אינן רציפות.")]),
      wrong("uniform-pw", H`כן, כי $f_n(x)\to f(x)$ בכל נקודה.`, "התכנסות נקודתית אינה מספיקה."),
    ], [H`${THEOREM_NAME} אינו חל כש־$f_n$ אינן רציפות. מה בודקים במקומו?`],
  uniform ? H`$M_n\to0$: ההתכנסות במידה שווה.` : H`$M_n\not\to0$: ההתכנסות אינה במידה שווה.`,
  uniform
    ? H`$f=0$ ו־$\lvert f_n-f\rvert=f_n\le ${HTex}$, עם שוויון, ולכן $M_n=${HTex}\to0$: ההתכנסות במידה שווה, אף ש־$f_n$ אינן רציפות.`
    : H`$f_n$ אינן רציפות, ולכן ${THEOREM_NAME} אינו חל, גם אם הגבול אינו רציף. ישירות: ב־$x_n=${xMid}$ מתקיים $\lvert f_n(x_n)-f(x_n)\rvert=${hL}$, ולכן $M_n=${hL}\not\to0$ ואין התכנסות במידה שווה.`));

  const view = windowOf(model, -0.1, dom.right * 1.1);
  const plot: PracticePlotSpec = {
    value: model.value, limit: model.limit, domain: dom, view, maxN: 40,
    breaks: (n) => [1 / n],
    // f(0) = h at the closed left end, then 0: an isolated value of the limit.
    limitBreaks: interval && g === "one" && closed ? [0] : [],
  };
  return {
    book, model,
    exercise: finishExercise({
      id: IND_ID, signature: indicatorSignature(v), difficulty: indicatorDifficulty(v),
      title: interval ? "פונקציה אופיינית של קטע שמתכווץ" : "פונקציה אופיינית של נקודה נעה",
      statement: statementOf(dom, domTex, "המוגדרת למטה"), formula: fnCases, steps, book, plot,
    }),
  };
}

export const INDICATOR = makeFamily<IndicatorVariant>({
  id: IND_ID,
  grid: indicatorGrid,
  kindOf: (v) => `${v.kind}-${v.g}`,
  difficulty: indicatorDifficulty,
  signature: indicatorSignature,
  build: buildIndicator,
});

// =============================================================================================
// The registry
// =============================================================================================

/** Every family of the topic, in the order of the specification. */
export const CONTINUITY_FAMILIES = [UNBOUNDED, RAMP, MOVING_PEAK, FLOOR, INDICATOR] as const;
