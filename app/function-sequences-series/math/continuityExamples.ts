/**
 * Data for the "continuity of the limit function" activity: three sequences of (mostly) continuous
 * functions, their pointwise limits, and the pieces used to draw them without connecting across a
 * jump. Pure TypeScript, no React. Floats exist for plotting and tests only.
 */

export type ContExampleId = "C1" | "C2" | "C3";
export const CONT_EXAMPLE_ORDER: readonly ContExampleId[] = ["C1", "C2", "C3"];

/** The largest index the n slider offers. */
export const CONT_MAX_N = 40;

/** What the graph shows; cumulative per step, like the supremum activity's GraphFlags. */
export type ContGraphFlags = {
  /** Draw the pointwise limit f. */
  limit: boolean;
  /** Draw the epsilon-band around f. */
  band: boolean;
  /** Emphasise discontinuities: open/closed endpoint dots and a marker at f's discontinuity. */
  jumps: boolean;
};
export const CONT_BASE_GRAPH: ContGraphFlags = { limit: false, band: false, jumps: false };

/** A piece of a piecewise function on [left,right] with endpoint inclusion. */
export type ContPiece = {
  left: number;
  right: number;
  leftClosed: boolean;
  rightClosed: boolean;
  value: (x: number) => number;
};

export type ContDomain = { left: number; right: number; leftClosed: boolean; rightClosed: boolean };

export type ContExample = {
  id: ContExampleId;
  /** Full definition as display LaTeX ("f_n(x)=..."). */
  fnLatex: string;
  /** Short LaTeX for a navigation label, without "f_n(x)=". */
  shortLatex: string;
  domainLatex: string;
  limitLatex: string;
  domain: ContDomain;
  value(n: number, x: number): number;
  limit(x: number): number;
  /** f_n as pieces (one piece when continuous). Joins between pieces are listed in both pieces. */
  pieces(n: number): ContPiece[];
  /** f as pieces; isolated points are zero-width closed pieces. */
  limitPieces: ContPiece[];
  uniform: boolean;
  /** The point where f is discontinuous, or null (C3: f(x)=x is continuous). Extra to the brief. */
  limitDiscontinuity: number | null;
  /** Default plotting window; y is clipped (C2 is unbounded). */
  view: { xMin: number; xMax: number; yMin: number; yMax: number };
};

export function assertContN(n: number): void {
  if (!Number.isInteger(n) || n < 1 || n > CONT_MAX_N) {
    throw new RangeError(`n must be an integer in [1, ${CONT_MAX_N}], got ${n}`);
  }
}

export function inContDomain(domain: ContDomain, x: number): boolean {
  return (x > domain.left || (x === domain.left && domain.leftClosed))
    && (x < domain.right || (x === domain.right && domain.rightClosed));
}

function guard(domain: ContDomain, n: number, x: number): void {
  assertContN(n);
  if (typeof x !== "number" || Number.isNaN(x) || !inContDomain(domain, x)) {
    throw new RangeError(`x must lie in the domain, got ${x}`);
  }
}

const closedPiece = (left: number, right: number, value: (x: number) => number): ContPiece =>
  ({ left, right, leftClosed: true, rightClosed: true, value });

/** floor(n x) with a guard so that n * (k / n) is read as k despite rounding. */
export function floorNx(n: number, x: number): number {
  return Math.floor(n * x + 1e-9);
}

// ---- C1 ---------------------------------------------------------------------------------------
const C1_DOMAIN: ContDomain = { left: 0, right: 2, leftClosed: true, rightClosed: true };
const c1Value = (n: number, x: number) => x ** n / (1 + x ** (2 * n));
const c1Limit = (x: number) => (x === 1 ? 0.5 : 0);

const C1: ContExample = {
  id: "C1",
  fnLatex: String.raw`f_n(x)=\frac{x^n}{1+x^{2n}}`,
  shortLatex: String.raw`\frac{x^n}{1+x^{2n}}`,
  domainLatex: "[0,2]",
  limitLatex: String.raw`f(x)=\begin{cases}0 & x\ne 1\\[2pt] \tfrac12 & x=1\end{cases}`,
  domain: C1_DOMAIN,
  value(n, x) { guard(C1_DOMAIN, n, x); return c1Value(n, x); },
  limit(x) { guard(C1_DOMAIN, 1, x); return c1Limit(x); },
  pieces: (n) => { assertContN(n); return [closedPiece(0, 2, (x) => c1Value(n, x))]; },
  limitPieces: [
    { left: 0, right: 1, leftClosed: true, rightClosed: false, value: () => 0 },
    closedPiece(1, 1, () => 0.5),
    { left: 1, right: 2, leftClosed: false, rightClosed: true, value: () => 0 },
  ],
  uniform: false,
  limitDiscontinuity: 1,
  view: { xMin: -0.1, xMax: 2.1, yMin: -0.1, yMax: 0.7 },
};

// ---- C2 ---------------------------------------------------------------------------------------
const C2_DOMAIN: ContDomain = { left: 0, right: 1, leftClosed: true, rightClosed: true };
const c2Value = (n: number, x: number) => (x <= 1 / (n + 1) ? (n + 1) ** 2 * x : 1 / x);
const c2Limit = (x: number) => (x === 0 ? 0 : 1 / x);

const C2: ContExample = {
  id: "C2",
  fnLatex: String.raw`f_n(x)=\begin{cases}(n+1)^2x & 0\le x\le \frac1{n+1}\\[2pt] \frac1x & \frac1{n+1}\le x\le 1\end{cases}`,
  shortLatex: String.raw`\min\left\{(n+1)^2x,\tfrac1x\right\}`,
  domainLatex: "[0,1]",
  limitLatex: String.raw`f(x)=\begin{cases}\frac1x & 0<x\le 1\\[2pt] 0 & x=0\end{cases}`,
  domain: C2_DOMAIN,
  value(n, x) { guard(C2_DOMAIN, n, x); return c2Value(n, x); },
  limit(x) { guard(C2_DOMAIN, 1, x); return c2Limit(x); },
  pieces: (n) => {
    assertContN(n);
    const t = 1 / (n + 1);
    return [closedPiece(0, t, (x) => (n + 1) ** 2 * x), closedPiece(t, 1, (x) => 1 / x)];
  },
  limitPieces: [
    closedPiece(0, 0, () => 0),
    { left: 0, right: 1, leftClosed: false, rightClosed: true, value: (x) => 1 / x },
  ],
  uniform: false,
  limitDiscontinuity: 0,
  view: { xMin: -0.05, xMax: 1.05, yMin: -1, yMax: 12 },
};

// ---- C3 ---------------------------------------------------------------------------------------
const C3_DOMAIN: ContDomain = { left: 0, right: 1, leftClosed: true, rightClosed: false };

const C3: ContExample = {
  id: "C3",
  fnLatex: String.raw`f_n(x)=\frac{\lfloor nx\rfloor}{n}`,
  shortLatex: String.raw`\frac{\lfloor nx\rfloor}{n}`,
  domainLatex: "[0,1)",
  limitLatex: "f(x)=x",
  domain: C3_DOMAIN,
  value(n, x) { guard(C3_DOMAIN, n, x); return floorNx(n, x) / n; },
  limit(x) { guard(C3_DOMAIN, 1, x); return x; },
  pieces: (n) => {
    assertContN(n);
    return Array.from({ length: n }, (_, k) => ({
      left: k / n, right: (k + 1) / n, leftClosed: true, rightClosed: false, value: () => k / n,
    }));
  },
  limitPieces: [{ left: 0, right: 1, leftClosed: true, rightClosed: false, value: (x) => x }],
  uniform: true,
  limitDiscontinuity: null,
  view: { xMin: -0.05, xMax: 1.05, yMin: -0.1, yMax: 1.1 },
};

export const CONT_EXAMPLES: Record<ContExampleId, ContExample> = { C1, C2, C3 };
