/**
 * Pure plot geometry for the supremum-test activity: the function graph (G1) and the
 * M_n-versus-n graph (G2). No React. Coordinates are data coordinates unless the name says
 * "pixel"; pixel mapping reuses `plotX`/`plotY` from sequencePlot.ts with the example's own
 * y range (`sequencePlot`'s default range of +-1.2 is not used here).
 */
import {
  PLOT_HEIGHT,
  PLOT_MARGIN,
  PLOT_WIDTH,
  clipPlotSegments,
  plotX,
  plotY,
  type PlotPoint,
  type PlotSegment,
  type PlotWindow,
} from './sequencePlot';
import { SUP_MAX_N, assertSupN, inSupDomain, type SupExample } from './supremumExamples';

export { plotX };

/** Number of dots of the M_n graph: every n the activity can show. */
export const SUP_MN_MAX_N = SUP_MAX_N;
const BASE_SAMPLES = 641;
const PEAK_HALF_WIDTHS = 3;
const PEAK_SAMPLES_PER_UNIT = 16;

/** Pixel y for the example's own fixed range. */
export function supPlotY(ex: SupExample, y: number): number {
  return plotY(y, ex.yRange[0], ex.yRange[1]);
}

/** x values to sample on [left, right]: uniform, plus the maximum point, its neighbours (narrow
 * peaks at 1/n, 2/n and near 1 for E3), and both ends. Sorted and unique. */
export function supSampleXs(ex: SupExample, n: number, left: number, right: number): number[] {
  assertSupN(n);
  if (!(left <= right)) return [];
  const xs = new Set<number>();
  if (left === right) return [left];
  for (let i = 0; i < BASE_SAMPLES; i += 1) xs.add(left + (right - left) * i / (BASE_SAMPLES - 1));
  const add = (x: number) => { if (x >= left && x <= right) xs.add(x); };
  add(left);
  add(right);
  const peak = ex.criticalPoint(n);
  const argmax = ex.argmax(n);
  const width = 1 / n;
  for (const centre of [peak, argmax]) {
    add(centre);
    for (let j = -PEAK_HALF_WIDTHS * PEAK_SAMPLES_PER_UNIT; j <= PEAK_HALF_WIDTHS * PEAK_SAMPLES_PER_UNIT; j += 1) {
      add(centre + width * j / PEAK_SAMPLES_PER_UNIT);
    }
  }
  for (const c of ex.candidates) {
    const x = c.x(n);
    if (Number.isFinite(x)) add(x);
  }
  return [...xs].sort((a, b) => a - b);
}

function curve(ex: SupExample, n: number, left: number, right: number): PlotSegment {
  return supSampleXs(ex, n, left, right).map((x) => ({ x, y: ex.value(n, x) }));
}

/** The curve inside the domain (`main`) and outside it (`context`, drawn faded), on the window. */
export function supCurveSegments(ex: SupExample, n: number, view: PlotWindow): { main: PlotSegment[]; context: PlotSegment[] } {
  assertSupN(n);
  const domainLeft = Math.max(view.left, ex.domain.left);
  const domainRight = Math.min(view.right, ex.domain.right);
  const main: PlotSegment[] = [];
  const context: PlotSegment[] = [];
  if (domainLeft <= domainRight) main.push(curve(ex, n, domainLeft, domainRight));
  else context.push(curve(ex, n, view.left, view.right));
  if (domainLeft <= domainRight) {
    if (view.left < domainLeft) context.push(curve(ex, n, view.left, domainLeft));
    if (domainRight < view.right) context.push(curve(ex, n, domainRight, view.right));
  }
  return { main, context };
}

/** Same as supCurveSegments, clipped to the example's y range. */
export function supVisibleCurve(ex: SupExample, n: number, view: PlotWindow): { main: PlotSegment[]; context: PlotSegment[] } {
  const { main, context } = supCurveSegments(ex, n, view);
  return {
    main: clipPlotSegments(main, ex.yRange[0], ex.yRange[1]),
    context: clipPlotSegments(context, ex.yRange[0], ex.yRange[1]),
  };
}

export type TangentGeometry = { point: PlotPoint; slope: number; segments: PlotSegment[] };

/** Tangent line to f_n at the probe x0 (which must lie in the domain), drawn a short way to
 * both sides and clipped to the y range. */
export function tangentGeometry(ex: SupExample, n: number, x0: number, view: PlotWindow): TangentGeometry {
  assertSupN(n);
  if (!inSupDomain(ex, x0)) throw new RangeError('The probe must lie in the domain.');
  const y0 = ex.value(n, x0);
  const slope = ex.derivative(n, x0);
  const half = (view.right - view.left) * 0.06;
  const a = Math.max(view.left, x0 - half);
  const b = Math.min(view.right, x0 + half);
  const seg: PlotSegment = [{ x: a, y: y0 + slope * (a - x0) }, { x: b, y: y0 + slope * (b - x0) }];
  return { point: { x: x0, y: y0 }, slope, segments: clipPlotSegments([seg], ex.yRange[0], ex.yRange[1]) };
}

export type SignInterval = { left: number; right: number; sign: 1 | -1 | 0 };

/** Sign strip: intervals of the domain (intersected with the window) on which f_n' has a
 * constant sign. Break points are the interior critical point and nothing else. */
export function signStripIntervals(ex: SupExample, n: number, view: PlotWindow): SignInterval[] {
  assertSupN(n);
  const left = Math.max(view.left, ex.domain.left);
  const right = Math.min(view.right, ex.domain.right);
  if (!(left < right)) return [];
  const breaks = [left];
  const x = ex.criticalPoint(n);
  if (x > left && x < right && x > ex.domain.left && x < ex.domain.right) breaks.push(x);
  breaks.push(right);
  const result: SignInterval[] = [];
  for (let i = 1; i < breaks.length; i += 1) {
    const a = breaks[i - 1];
    const b = breaks[i];
    // f_n' is positive left of the zero of its interior factor and negative right of it for all
    // five examples, so the sign needs no magnitude threshold (which underflows for large n).
    const mid = (a + b) / 2;
    const sign = mid < x ? 1 : mid > x ? -1 : 0;
    const last = result[result.length - 1];
    if (last && last.sign === sign) last.right = b;
    else result.push({ left: a, right: b, sign });
  }
  return result;
}

/** A short LaTeX-safe decimal: integers as is, four significant digits, and `a\cdot10^{-k}` for
 * nonzero values below 1e-4 (never JavaScript's `1e-7` text). */
export function formatSupNumber(value: number): string {
  if (!Number.isFinite(value)) return value < 0 ? '-\\infty' : '\\infty';
  if (Number.isInteger(value)) return String(value);
  const abs = Math.abs(value);
  if (abs < 1e-4 || abs >= 1e21) {
    const [mantissa, exponent] = abs.toExponential(3).split('e');
    const sign = value < 0 ? '-' : '';
    return `${sign}${Number(mantissa)}\\cdot10^{${Number(exponent)}}`;
  }
  return Number(value.toPrecision(4)).toString();
}

/** `\\approx <number>` for readouts; `\\to\\infty` for infinite values. */
export function supApproximationLatex(value: number): string {
  if (!Number.isFinite(value)) return value < 0 ? '\\to-\\infty' : '\\to\\infty';
  return `\\approx ${formatSupNumber(value)}`;
}

/** Marker of the maximum: at the true argmax, with height M_n. */
export function maximumPoint(ex: SupExample, n: number): PlotPoint {
  assertSupN(n);
  return { x: ex.argmax(n), y: ex.supValue(n) };
}

/** The point (x_n, f_n(x_n)) above the zero of f_n' (may lie outside the domain). */
export function criticalPointOnCurve(ex: SupExample, n: number): PlotPoint & { interior: boolean } {
  assertSupN(n);
  const x = ex.criticalPoint(n);
  return { x, y: ex.value(n, x), interior: ex.criticalInterior(n) };
}

// ------------------------------- G2: M_n versus n -------------------------------

export type MnDot = { n: number; m: number; x: number; y: number };

/** Pixel x of the integer n, with half a unit of room at each end. */
export function mnPlotX(n: number, maxN = SUP_MN_MAX_N): number {
  return PLOT_MARGIN.left + ((n - 0.5) / maxN) * (PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right);
}

/** One dot (n, M_n) for n = 1..maxN, in data and pixel coordinates. */
export function mnDots(ex: SupExample, maxN = SUP_MN_MAX_N): MnDot[] {
  const dots: MnDot[] = [];
  for (let n = 1; n <= maxN; n += 1) {
    const m = ex.supValue(n);
    dots.push({ n, m, x: mnPlotX(n, maxN), y: supPlotY(ex, m) });
  }
  return dots;
}

export type EpsilonBand = { lower: number; upper: number; yLower: number; yUpper: number };

const plotTop = PLOT_MARGIN.top;
const plotBottom = PLOT_HEIGHT - PLOT_MARGIN.bottom;
const clampPixel = (y: number) => Math.min(plotBottom, Math.max(plotTop, y));

/** The band |y| < epsilon around 0, with pixel edges clamped to the plot area. */
export function epsilonBand(ex: SupExample, epsilon: number): EpsilonBand {
  return {
    lower: -epsilon,
    upper: epsilon,
    yLower: clampPixel(supPlotY(ex, -epsilon)),
    yUpper: clampPixel(supPlotY(ex, epsilon)),
  };
}

export type EpsilonReadout =
  | { N: number; reason?: undefined }
  /** `not-tending`: M_n does not go below epsilon (its limit is >= epsilon). `beyond-range`:
   * M_n tends to 0 but is still >= epsilon at the last displayed n. */
  | { N: null; reason: 'not-tending' | 'beyond-range' };

/** Smallest N such that M_n < epsilon for every displayed n > N (N = 0 when all are). */
export function epsilonReadout(ex: SupExample, epsilon: number, maxN = SUP_MN_MAX_N): EpsilonReadout {
  let lastBad = 0;
  for (let n = 1; n <= maxN; n += 1) {
    if (!(ex.supValue(n) < epsilon)) lastBad = n;
  }
  if (lastBad < maxN) return { N: lastBad };
  return { N: null, reason: ex.limitValue >= epsilon ? 'not-tending' : 'beyond-range' };
}
