/**
 * Data for the "limit and integral" activity: three sequences on [0,1], their pointwise limits,
 * the integrals I_n = integral of f_n over [0,1] and the suprema M_n = sup|f_n - f|.
 * Pure TypeScript, no React. Floats exist for plotting and tests only.
 */

export type IntExampleId = "I1" | "I2" | "I3";
export const INT_EXAMPLE_ORDER: readonly IntExampleId[] = ["I1", "I2", "I3"];

/** The largest index the n slider offers (peaks near 1/n stay visible at 1/40 = 0.025). */
export const INT_MAX_N = 40;

/** What the graphs show; cumulative per step, like the continuity activity's flags. */
export type IntGraphFlags = {
  /** Draw the pointwise limit f (I3: an isolated point at x=0). */
  limit: boolean;
  /** Shade the area under f_n on the domain. */
  area: boolean;
  /** Draw the epsilon-band around f. */
  band: boolean;
  /** Show the second plot: I_n against n. */
  integrals: boolean;
  /** In the second plot, also plot M_n = sup|f_n - f| against n. */
  supremum: boolean;
  /** Split the domain at a point a (shown with an a slider): the optional example's argument. */
  split?: boolean;
};
export const INT_BASE_GRAPH: IntGraphFlags = {
  limit: false, area: false, band: false, integrals: false, supremum: false,
};

export type IntExample = {
  id: IntExampleId;
  /** Full definition as display LaTeX ("f_n(x)=..."). */
  fnLatex: string;
  /** Short LaTeX for a navigation label, without "f_n(x)=". */
  shortLatex: string;
  domainLatex: string;
  limitLatex: string;
  value(n: number, x: number): number;
  limit(x: number): number;
  /** The integral of f_n over [0,1]: closed form for I2, an adaptive Simpson rule otherwise. */
  integral(n: number): number;
  /** The integral of f over [0,1] (zero for all three). */
  limitIntegral: number;
  /** sup over [0,1] of |f_n - f|; for I3 the value 1 is approached as x -> 0+, not attained. */
  sup(n: number): number;
  uniform: boolean;
  view: { xMin: number; xMax: number; yMin: number; yMax: number };
};

export function assertIntN(n: number): void {
  if (!Number.isInteger(n) || n < 1 || n > INT_MAX_N) {
    throw new RangeError(`n must be an integer in [1, ${INT_MAX_N}], got ${n}`);
  }
}

function assertIntX(x: number): void {
  if (typeof x !== "number" || Number.isNaN(x) || x < 0 || x > 1) {
    throw new RangeError(`x must lie in [0, 1], got ${x}`);
  }
}

function simpsonPanel(f: (x: number) => number, a: number, b: number, fa: number, fm: number, fb: number,
  whole: number, tol: number, depth: number): number {
  const m = (a + b) / 2;
  const flm = f((a + m) / 2);
  const frm = f((m + b) / 2);
  const left = ((m - a) / 6) * (fa + 4 * flm + fm);
  const right = ((b - m) / 6) * (fm + 4 * frm + fb);
  if (depth <= 0 || Math.abs(left + right - whole) <= 15 * tol) return left + right + (left + right - whole) / 15;
  return simpsonPanel(f, a, m, fa, flm, fm, left, tol / 2, depth - 1)
    + simpsonPanel(f, m, b, fm, frm, fb, right, tol / 2, depth - 1);
}

/** Adaptive Simpson on [0,1], started from 64 equal panels so a narrow peak cannot be missed. */
function integrate01(f: (x: number) => number): number {
  const panels = 64;
  let total = 0;
  for (let i = 0; i < panels; i += 1) {
    const a = i / panels;
    const b = (i + 1) / panels;
    const fa = f(a);
    const fb = f(b);
    const fm = f((a + b) / 2);
    const whole = ((b - a) / 6) * (fa + 4 * fm + fb);
    total += simpsonPanel(f, a, b, fa, fm, fb, whole, 1e-13, 30);
  }
  return total;
}

function memoIntegral(f: (n: number, x: number) => number): (n: number) => number {
  const cache = new Map<number, number>();
  return (n) => {
    assertIntN(n);
    let v = cache.get(n);
    if (v === undefined) { v = integrate01((x) => f(n, x)); cache.set(n, v); }
    return v;
  };
}

// ---- I1 ---------------------------------------------------------------------------------------
const i1Value = (n: number, x: number) => x / (1 + (n * x) ** 3);

const I1: IntExample = {
  id: "I1",
  fnLatex: String.raw`f_n(x)=\frac{x}{1+n^3x^3}`,
  shortLatex: String.raw`\frac{x}{1+n^3x^3}`,
  domainLatex: "[0,1]",
  limitLatex: "f(x)=0",
  value(n, x) { assertIntN(n); assertIntX(x); return i1Value(n, x); },
  limit(x) { assertIntX(x); return 0; },
  integral: memoIntegral(i1Value),
  limitIntegral: 0,
  // maximum at x_n = 1/(cbrt(2) n): f_n(x_n) = 2^(2/3) / (3n)
  sup(n) { assertIntN(n); return 2 ** (2 / 3) / (3 * n); },
  uniform: true,
  view: { xMin: -0.05, xMax: 1.05, yMin: -0.05, yMax: 0.6 },
};

// ---- I2 ---------------------------------------------------------------------------------------
const i2Value = (n: number, x: number) => (n * x) / (1 + (n * x) ** 2);

const I2: IntExample = {
  id: "I2",
  fnLatex: String.raw`f_n(x)=\frac{nx}{1+n^2x^2}`,
  shortLatex: String.raw`\frac{nx}{1+n^2x^2}`,
  domainLatex: "[0,1]",
  limitLatex: "f(x)=0",
  value(n, x) { assertIntN(n); assertIntX(x); return i2Value(n, x); },
  limit(x) { assertIntX(x); return 0; },
  integral(n) { assertIntN(n); return Math.log(1 + n * n) / (2 * n); },
  limitIntegral: 0,
  sup(n) { assertIntN(n); return 0.5; },
  uniform: false,
  view: { xMin: -0.05, xMax: 1.05, yMin: -0.05, yMax: 0.6 },
};

// ---- I3 ---------------------------------------------------------------------------------------
const i3Value = (n: number, x: number) => Math.cos(x) ** n;

const I3: IntExample = {
  id: "I3",
  fnLatex: String.raw`f_n(x)=\cos^n x`,
  shortLatex: String.raw`\cos^n x`,
  domainLatex: "[0,1]",
  limitLatex: String.raw`f(x)=\begin{cases}1 & x=0\\[2pt] 0 & 0<x\le 1\end{cases}`,
  value(n, x) { assertIntN(n); assertIntX(x); return i3Value(n, x); },
  limit(x) { assertIntX(x); return x === 0 ? 1 : 0; },
  integral: memoIntegral(i3Value),
  limitIntegral: 0,
  sup(n) { assertIntN(n); return 1; },
  uniform: false,
  view: { xMin: -0.05, xMax: 1.05, yMin: -0.1, yMax: 1.1 },
};

export const INT_EXAMPLES: Record<IntExampleId, IntExample> = { I1, I2, I3 };

/** sup over [a,1] of |f_n - f| for I3 (a in (0,1]): cos^n(a). Extra to the brief. */
export function i3SupBeyond(n: number, a: number): number {
  assertIntN(n);
  if (!(a > 0 && a <= 1)) throw new RangeError(`a must lie in (0, 1], got ${a}`);
  return Math.cos(a) ** n;
}
