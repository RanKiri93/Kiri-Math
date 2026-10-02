/**
 * Data for the "limit and derivative" activity: three sequences on [0,1], their derivatives, the
 * pointwise limits f of f_n and g of f_n', and the suprema of |f_n - f| and |f_n' - g|.
 * Pure TypeScript, no React. Floats exist for plotting and tests only.
 */

export type DerExampleId = "D1" | "D2" | "D3";
export const DER_EXAMPLE_ORDER: readonly DerExampleId[] = ["D1", "D2", "D3"];

/** The largest index the n slider offers. */
export const DER_MAX_N = 40;

/** What the graphs show; cumulative per step. */
export type DerGraphFlags = {
  /** Draw the pointwise limit f of f_n (when it exists). */
  limit: boolean;
  /** Draw the epsilon-band around f. */
  band: boolean;
  /** Show the second panel: f_n' (and g when `derivLimit`). */
  derivative: boolean;
  /** Draw g = lim f_n' in the second panel (D2: open and closed dots at x=1). */
  derivLimit: boolean;
  /** Draw the epsilon-band around g in the second panel. */
  derivBand: boolean;
};
export const DER_BASE_GRAPH: DerGraphFlags = {
  limit: false, band: false, derivative: false, derivLimit: false, derivBand: false,
};

type View = { xMin: number; xMax: number; yMin: number; yMax: number };

export type DerExample = {
  id: DerExampleId;
  /** Full definition as display LaTeX ("f_n(x)=..."). */
  fnLatex: string;
  /** Short LaTeX for a navigation label, without "f_n(x)=". */
  shortLatex: string;
  domainLatex: string;
  derivativeLatex: string;
  value(n: number, x: number): number;
  derivative(n: number, x: number): number;
  /** Pointwise limit of f_n, or null when it does not exist (D3). */
  limit: ((x: number) => number) | null;
  /** Pointwise limit g of f_n' (D2: 0 on [0,1), 1/2 at x=1). */
  derivativeLimit(x: number): number;
  /** sup over [0,1] of |f_n - f|, or null when f does not exist. */
  sup(n: number): number | null;
  /** sup over [0,1] of |f_n' - g| (D2: exact maximum of x^(n-1)/(1+x^(2n)), which tends to 1/2). */
  derivativeSup(n: number): number;
  /** Window for f_n (D3: values up to n leave it; the plot marks the clipped value). */
  view: View;
  derivativeView: View;
};

export function assertDerN(n: number): void {
  if (!Number.isInteger(n) || n < 1 || n > DER_MAX_N) {
    throw new RangeError(`n must be an integer in [1, ${DER_MAX_N}], got ${n}`);
  }
}

function assertDerX(x: number): void {
  if (typeof x !== "number" || Number.isNaN(x) || x < 0 || x > 1) {
    throw new RangeError(`x must lie in [0, 1], got ${x}`);
  }
}

// ---- D1: ln(1+nx^2)/n -------------------------------------------------------------------------
const D1: DerExample = {
  id: "D1",
  fnLatex: String.raw`f_n(x)=\frac{\ln(1+nx^2)}{n}`,
  shortLatex: String.raw`\frac{\ln(1+nx^2)}{n}`,
  domainLatex: "[0,1]",
  derivativeLatex: String.raw`f_n'(x)=\frac{2x}{1+nx^2}`,
  value(n, x) { assertDerN(n); assertDerX(x); return Math.log(1 + n * x * x) / n; },
  derivative(n, x) { assertDerN(n); assertDerX(x); return (2 * x) / (1 + n * x * x); },
  limit(x) { assertDerX(x); return 0; },
  derivativeLimit(x) { assertDerX(x); return 0; },
  // f_n increases, so the supremum is at x = 1.
  sup(n) { assertDerN(n); return Math.log(1 + n) / n; },
  // maximum of 2x/(1+nx^2) at x = 1/sqrt(n)
  derivativeSup(n) { assertDerN(n); return 1 / Math.sqrt(n); },
  view: { xMin: -0.05, xMax: 1.05, yMin: -0.05, yMax: 0.75 },
  derivativeView: { xMin: -0.05, xMax: 1.05, yMin: -0.05, yMax: 1.1 },
};

// ---- D2: arctan(x^n)/n ------------------------------------------------------------------------
const D2: DerExample = {
  id: "D2",
  fnLatex: String.raw`f_n(x)=\frac{\arctan(x^n)}{n}`,
  shortLatex: String.raw`\frac{\arctan(x^n)}{n}`,
  domainLatex: "[0,1]",
  derivativeLatex: String.raw`f_n'(x)=\frac{x^{n-1}}{1+x^{2n}}`,
  value(n, x) { assertDerN(n); assertDerX(x); return Math.atan(x ** n) / n; },
  derivative(n, x) { assertDerN(n); assertDerX(x); return x ** (n - 1) / (1 + x ** (2 * n)); },
  limit(x) { assertDerX(x); return 0; },
  derivativeLimit(x) { assertDerX(x); return x === 1 ? 0.5 : 0; },
  sup(n) { assertDerN(n); return Math.PI / (4 * n); },
  derivativeSup(n) {
    assertDerN(n);
    if (n === 1) return 1; // 1/(1+x^2) decreases: the maximum is at x = 0
    // critical point x^(2n) = (n-1)/(n+1); there the value is x^(n-1) (n+1)/(2n)
    const t = ((n - 1) / (n + 1)) ** (1 / (2 * n));
    return (t ** (n - 1) * (n + 1)) / (2 * n);
  },
  view: { xMin: -0.05, xMax: 1.05, yMin: -0.05, yMax: 0.9 },
  derivativeView: { xMin: -0.05, xMax: 1.05, yMin: -0.05, yMax: 1.1 },
};

// ---- D3: f_n = n ------------------------------------------------------------------------------
const D3: DerExample = {
  id: "D3",
  fnLatex: "f_n(x)=n",
  shortLatex: "n",
  domainLatex: "[0,1]",
  derivativeLatex: "f_n'(x)=0",
  value(n, x) { assertDerN(n); assertDerX(x); return n; },
  derivative(n, x) { assertDerN(n); assertDerX(x); return 0; },
  limit: null,
  derivativeLimit(x) { assertDerX(x); return 0; },
  sup(n) { assertDerN(n); return null; },
  derivativeSup(n) { assertDerN(n); return 0; },
  view: { xMin: -0.05, xMax: 1.05, yMin: -0.5, yMax: 5.5 },
  derivativeView: { xMin: -0.05, xMax: 1.05, yMin: -0.5, yMax: 1.5 },
};

export const DER_EXAMPLES: Record<DerExampleId, DerExample> = { D1, D2, D3 };
