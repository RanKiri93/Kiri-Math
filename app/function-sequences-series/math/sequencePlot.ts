import { pointwiseLimit, sequenceValue, type Interval, type SequenceId } from './convergence';

export type PlotWindow = { left: number; right: number };
export type PlotPoint = { x: number; y: number };
export type PlotSegment = PlotPoint[];

export const PLOT_WIDTH = 640;
export const PLOT_HEIGHT = 260;
export const PLOT_MARGIN = { left: 42, right: 14, top: 12, bottom: 30 };
export const PLOT_Y_MIN = -1.2;
export const PLOT_Y_MAX = 1.2;
const SAMPLE_BUDGET = 2400;
const BASE_SAMPLES_PER_PIXEL = 2;
const OSCILLATION_SAMPLES_PER_PERIOD = 16;

export function plotX(x: number, view: PlotWindow): number {
  return PLOT_MARGIN.left + ((x - view.left) / (view.right - view.left))
    * (PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right);
}

export function plotY(y: number, min = PLOT_Y_MIN, max = PLOT_Y_MAX): number {
  return PLOT_MARGIN.top + ((max - y) / (max - min))
    * (PLOT_HEIGHT - PLOT_MARGIN.top - PLOT_MARGIN.bottom);
}

export function approximationLatex(value: number): string {
  if (!Number.isFinite(value)) return value < 0 ? "\\to-\\infty" : "\\to\\infty";
  const formatted = Number.isInteger(value) ? String(value) : Number(value.toPrecision(4)).toString();
  return `\\approx ${formatted}`;
}

export function pointerToPlotX(clientX: number, rect: Pick<DOMRect, 'left' | 'width'>, view: PlotWindow): number {
  return view.left + ((clientX - rect.left) / rect.width) * (view.right - view.left);
}

function intersectsDomain(x: number, domain: Interval): boolean {
  return (x > domain.left || (x === domain.left && domain.leftClosed))
    && (x < domain.right || (x === domain.right && domain.rightClosed));
}

function curveRanges(domain: Interval, view: PlotWindow): Array<[number, number]> {
  const left = Math.max(view.left, domain.left);
  const right = Math.min(view.right, domain.right);
  return left <= right ? [[left, right]] : [];
}

function sampleXs(id: SequenceId, n: number, left: number, right: number, budget: number): number[] {
  const width = right - left;
  const pixels = PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right;
  const baseCount = Math.ceil(pixels * BASE_SAMPLES_PER_PIXEL) + 1;
  const frequencyCount = id === 'oscillation' || id === 'shifted-oscillation'
    ? Math.ceil(width * n / (2 * Math.PI) * OSCILLATION_SAMPLES_PER_PERIOD)
    : 0;
  const count = Math.max(2, Math.min(budget, Math.max(baseCount, frequencyCount)));
  const xs = new Set<number>();
  for (let i = 0; i < count; i += 1) xs.add(left + width * i / (count - 1));

  if (id === 'near') {
    const peak = 1 / n;
    const localRight = Math.min(right, 10 / n);
    const localLeft = Math.max(left, 0);
    if (localLeft <= peak && peak <= localRight) {
      const localCount = Math.min(budget - xs.size, 256);
      for (let i = 0; i < localCount; i += 1) {
        xs.add(localLeft + (localRight - localLeft) * i / Math.max(1, localCount - 1));
      }
      xs.add(peak);
    }
  }

  if (id === 'power') {
    for (const scale of [1, 1 - 1 / n, 1 - 2 / n, 1 - 4 / n, 1 - 8 / n, PLOT_Y_MAX ** (1 / n), 1 + 1 / n]) {
      if (scale > left && scale < right) xs.add(scale);
    }
  }

  const critical = id === 'linear' || id === 'far' ? n : null;
  if (critical !== null && critical > left && critical < right) xs.add(critical);
  return [...xs].sort((a, b) => a - b);
}

export function sequencePlotSegments(
  id: SequenceId,
  n: number,
  domain: Interval,
  view: PlotWindow,
  budget = SAMPLE_BUDGET,
): PlotSegment[] {
  return curveRanges(domain, view).map(([left, right]) => sampleXs(id, n, left, right, budget)
    .map((x) => ({ x, y: sequenceValue(id, n, x) })));
}

export function limitPlotSegments(id: SequenceId, domain: Interval, view: PlotWindow): PlotSegment[] {
  if (id === 'power') {
    const ranges: PlotSegment[] = [];
    const left = Math.max(view.left, domain.left);
    const right = Math.min(view.right, domain.right, 1);
    if (left <= right && left < 1) ranges.push([{ x: left, y: 0 }, { x: right, y: 0 }]);
    if (intersectsDomain(1, domain) && view.left <= 1 && view.right >= 1) {
      ranges.push([{ x: 1, y: 1 }]);
    }
    return ranges;
  }

  const left = Math.max(view.left, domain.left);
  const right = Math.min(view.right, domain.right);
  if (left > right) return [];
  const start = pointwiseLimit(id, left);
  const end = pointwiseLimit(id, right);
  return start === null || end === null ? [] : [[{ x: left, y: start }, { x: right, y: end }]];
}

export function epsilonPlotSegments(
  id: SequenceId,
  domain: Interval,
  view: PlotWindow,
  epsilon: number,
): PlotSegment[] {
  return limitPlotSegments(id, domain, view).map((segment) => segment.length === 1
    ? [{ x: segment[0].x, y: segment[0].y - epsilon }, { x: segment[0].x, y: segment[0].y + epsilon }]
    : [
      { x: segment[0].x, y: segment[0].y - epsilon },
      { x: segment[1].x, y: segment[1].y - epsilon },
      { x: segment[1].x, y: segment[1].y + epsilon },
      { x: segment[0].x, y: segment[0].y + epsilon },
    ]);
}

export function oscillationResolutionExceeded(
  id: SequenceId,
  n: number,
  view: PlotWindow,
  budget = SAMPLE_BUDGET,
): boolean {
  if (id !== 'oscillation' && id !== 'shifted-oscillation') return false;
  const required = (view.right - view.left) * n / (2 * Math.PI) * OSCILLATION_SAMPLES_PER_PERIOD;
  return required > budget;
}

export function sequencePlotSampleBudget(): number {
  return SAMPLE_BUDGET;
}

/** Clip the polyline, not just the SVG viewport: giant powers otherwise overflow SVG precision.
 * Do not clamp y values; that would invent a horizontal curve along the frame. */
export function clipPlotSegments(segments: PlotSegment[], min = PLOT_Y_MIN, max = PLOT_Y_MAX): PlotSegment[] {
  const result: PlotSegment[] = [];
  for (const points of segments) {
    let current: PlotSegment = [];
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      if (!Number.isFinite(a.y) || !Number.isFinite(b.y)
        || (a.y < min && b.y < min) || (a.y > max && b.y > max)) {
        if (current.length > 1) result.push(current);
        current = [];
        continue;
      }
      const intersection = (y: number) => ({ x: a.x + (b.x - a.x) * ((y - a.y) / (b.y - a.y)), y });
      const start = a.y < min ? intersection(min) : a.y > max ? intersection(max) : a;
      const end = b.y < min ? intersection(min) : b.y > max ? intersection(max) : b;
      if (!current.length) current.push(start);
      current.push(end);
      if (b.y < min || b.y > max) {
        if (current.length > 1) result.push(current);
        current = [];
      }
    }
    if (current.length > 1) result.push(current);
  }
  return result;
}
