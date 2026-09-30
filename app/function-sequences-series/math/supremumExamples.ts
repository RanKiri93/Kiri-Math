/**
 * Data for the supremum-test activity (docs/plans/supremum-test-activity.md, decisions in section 7).
 * Pure TypeScript, no React. Floats (`value`, `derivative`, `supValue`, candidate `value`) exist for
 * plotting and tests only; every student-facing answer is a token id whose label is LaTeX
 * (see supremumArgument.ts), so `e` is never materialized as a number in a checking path.
 */
import type { Interval } from './convergence';
import type { PlotWindow } from './sequencePlot';
import type { TokenId } from './supremumTypes';

/** The activity never asks for n beyond this (narrow peaks stay sampleable). */
export const SUP_MAX_N = 64;

export type SupExampleId = 'E1' | 'E1p' | 'E2' | 'E3' | 'E3p';
export type SupFamily = 'E1' | 'E2' | 'E3';
export type CandidateKind = 'endpoint' | 'interior-critical' | 'limit-at-infinity';
export type SupVerdict = 'uniform' | 'not-uniform';

export type SupCandidate = {
  /** Also the row id of the candidate table. */
  id: 'end-left' | 'end-right' | 'critical' | 'infinity';
  kind: CandidateKind;
  /** The x of the candidate, as LaTeX (e.g. "\\frac1n", "\\infty"). */
  xLatex: string;
  /** Float x for plots and tests; Infinity for the limit-at-infinity candidate. */
  x: (n: number) => number;
  /** Token id (in supremumArgument's registry) of the exact candidate value. */
  valueToken: TokenId;
  /** Float value f_n(x_n), or the limit at infinity. Tests and plots only. */
  value: (n: number) => number;
  /** True when this candidate gives the supremum (for every n). */
  isMaximum: boolean;
};

export type SupExample = {
  id: SupExampleId;
  family: SupFamily;
  /** "f_n(x)=..." */
  fnLatex: string;
  domain: Interval;
  domainLatex: string;
  value: (n: number, x: number) => number;
  /** f_n'(x), display and tests only. */
  derivative: (n: number, x: number) => number;
  /** The zero x_n of the interior factor of f_n' (may lie outside the domain). */
  criticalPoint: (n: number) => number;
  criticalLatex: string;
  /** True when x_n lies strictly inside the domain (Fermat applies to it). */
  criticalInterior: (n: number) => boolean;
  /** Where the maximum is attained. */
  argmax: (n: number) => number;
  candidates: SupCandidate[];
  /** M_n = sup |f_n - 0|, float, plots and tests only. */
  supValue: (n: number) => number;
  /** Token id of lim M_n. */
  limitToken: TokenId;
  /** lim M_n as exact LaTeX (1/e, 1/4, 0); never a decimal e. */
  limitLatex: string;
  limitValue: number;
  verdict: SupVerdict;
  /** Fixed y range of both graphs, [min, max]. */
  yRange: [number, number];
  /** Default x window of the function graph. */
  defaultView: PlotWindow;
  /** A fixed probe x_0 for the pointwise-limit step and the first tangent. */
  defaultProbe: number;
};

const E = Math.E;
const closed = (left: number, right: number): Interval => ({ left, right, leftClosed: true, rightClosed: true });
const halfLine = (left: number): Interval => ({ left, right: Infinity, leftClosed: true, rightClosed: false });

const e1Value = (n: number, x: number) => n * x * Math.exp(-n * x);
const e1Derivative = (n: number, x: number) => n * Math.exp(-n * x) * (1 - n * x);
const e2Value = (n: number, x: number) => n * x * x * Math.exp(-n * x);
const e2Derivative = (n: number, x: number) => n * x * Math.exp(-n * x) * (2 - n * x);
const e3Value = (n: number, x: number) => x ** n * (1 - x ** n);
const e3Derivative = (n: number, x: number) => n * x ** (n - 1) * (1 - 2 * x ** n);

const zero = () => 0;
const endLeft = (xLatex: string, x: (n: number) => number, valueToken: TokenId,
  value: (n: number) => number, isMaximum = false): SupCandidate =>
  ({ id: 'end-left', kind: 'endpoint', xLatex, x, valueToken, value, isMaximum });
const atInfinity = (): SupCandidate =>
  ({ id: 'infinity', kind: 'limit-at-infinity', xLatex: '\\infty', x: () => Infinity, valueToken: 'zero', value: zero, isMaximum: false });

export const SUP_EXAMPLES: Record<SupExampleId, SupExample> = {
  E1: {
    id: 'E1',
    family: 'E1',
    fnLatex: 'f_n(x)=nxe^{-nx}',
    domain: halfLine(0),
    domainLatex: '[0,\\infty)',
    value: e1Value,
    derivative: e1Derivative,
    criticalPoint: (n) => 1 / n,
    criticalLatex: '\\frac1n',
    criticalInterior: () => true,
    argmax: (n) => 1 / n,
    candidates: [
      endLeft('0', zero, 'zero', zero),
      { id: 'critical', kind: 'interior-critical', xLatex: '\\frac1n', x: (n) => 1 / n, valueToken: 'inv-e', value: () => 1 / E, isMaximum: true },
      atInfinity(),
    ],
    supValue: () => 1 / E,
    limitToken: 'inv-e',
    limitLatex: '\\frac1e',
    limitValue: 1 / E,
    verdict: 'not-uniform',
    yRange: [-0.05, 0.45],
    defaultView: { left: 0, right: 6 },
    defaultProbe: 1,
  },
  E1p: {
    id: 'E1p',
    family: 'E1',
    fnLatex: 'f_n(x)=nxe^{-nx}',
    domain: halfLine(1),
    domainLatex: '[1,\\infty)',
    value: e1Value,
    derivative: e1Derivative,
    criticalPoint: (n) => 1 / n,
    criticalLatex: '\\frac1n',
    // 1/n <= 1: never strictly inside (1, infinity); at the endpoint only for n = 1.
    criticalInterior: () => false,
    argmax: () => 1,
    candidates: [
      endLeft('1', () => 1, 'n-e-neg-n', (n) => n * Math.exp(-n), true),
      atInfinity(),
    ],
    supValue: (n) => n * Math.exp(-n),
    limitToken: 'zero',
    limitLatex: '0',
    limitValue: 0,
    verdict: 'uniform',
    yRange: [-0.05, 0.45],
    defaultView: { left: 0, right: 6 },
    defaultProbe: 2,
  },
  E2: {
    id: 'E2',
    family: 'E2',
    fnLatex: 'f_n(x)=nx^2e^{-nx}',
    domain: halfLine(0),
    domainLatex: '[0,\\infty)',
    value: e2Value,
    derivative: e2Derivative,
    criticalPoint: (n) => 2 / n,
    criticalLatex: '\\frac2n',
    criticalInterior: () => true,
    argmax: (n) => 2 / n,
    candidates: [
      endLeft('0', zero, 'zero', zero),
      { id: 'critical', kind: 'interior-critical', xLatex: '\\frac2n', x: (n) => 2 / n, valueToken: 'four-over-n-e2', value: (n) => 4 / (n * E * E), isMaximum: true },
      atInfinity(),
    ],
    supValue: (n) => 4 / (n * E * E),
    limitToken: 'zero',
    limitLatex: '0',
    limitValue: 0,
    verdict: 'uniform',
    yRange: [-0.05, 0.6],
    // x_1 = 2, so the window must reach x >= 2 (with room for the tail).
    defaultView: { left: 0, right: 6 },
    defaultProbe: 1,
  },
  E3: {
    id: 'E3',
    family: 'E3',
    fnLatex: 'f_n(x)=x^n(1-x^n)',
    domain: closed(0, 1),
    domainLatex: '[0,1]',
    value: e3Value,
    derivative: e3Derivative,
    criticalPoint: (n) => 2 ** (-1 / n),
    criticalLatex: '2^{-1/n}',
    criticalInterior: () => true,
    argmax: (n) => 2 ** (-1 / n),
    candidates: [
      endLeft('0', zero, 'zero', zero),
      { id: 'end-right', kind: 'endpoint', xLatex: '1', x: () => 1, valueToken: 'zero', value: zero, isMaximum: false },
      { id: 'critical', kind: 'interior-critical', xLatex: '2^{-1/n}', x: (n) => 2 ** (-1 / n), valueToken: 'quarter', value: () => 0.25, isMaximum: true },
    ],
    supValue: () => 0.25,
    limitToken: 'quarter',
    limitLatex: '\\frac14',
    limitValue: 0.25,
    verdict: 'not-uniform',
    yRange: [-0.03, 0.3],
    defaultView: { left: 0, right: 1 },
    defaultProbe: 0.8,
  },
  E3p: {
    id: 'E3p',
    family: 'E3',
    fnLatex: 'f_n(x)=x^n(1-x^n)',
    domain: closed(0, 0.5),
    domainLatex: '\\left[0,\\tfrac12\\right]',
    value: e3Value,
    derivative: e3Derivative,
    criticalPoint: (n) => 2 ** (-1 / n),
    criticalLatex: '2^{-1/n}',
    // 2^{-1/n} >= 1/2, with equality only for n = 1 (then it is the endpoint, not interior).
    criticalInterior: () => false,
    argmax: () => 0.5,
    candidates: [
      endLeft('0', zero, 'zero', zero),
      { id: 'end-right', kind: 'endpoint', xLatex: '\\frac12', x: () => 0.5, valueToken: 'sup-e3p', value: (n) => 2 ** -n * (1 - 2 ** -n), isMaximum: true },
    ],
    supValue: (n) => 2 ** -n * (1 - 2 ** -n),
    limitToken: 'zero',
    limitLatex: '0',
    limitValue: 0,
    verdict: 'uniform',
    yRange: [-0.03, 0.3],
    defaultView: { left: 0, right: 1 },
    defaultProbe: 0.4,
  },
};

/** The lecturer's order (plan section 7, decision 6). */
export const SUP_EXAMPLE_ORDER: SupExampleId[] = ['E1', 'E1p', 'E2', 'E3', 'E3p'];

export function assertSupN(n: number): void {
  if (!Number.isInteger(n) || n < 1 || n > SUP_MAX_N) {
    throw new RangeError(`n must be an integer in 1..${SUP_MAX_N}.`);
  }
}

/** True when x belongs to the example's domain. */
export function inSupDomain(ex: SupExample, x: number): boolean {
  const d = ex.domain;
  return (x > d.left || (x === d.left && d.leftClosed)) && (x < d.right || (x === d.right && d.rightClosed));
}
