"use client";

import { useId } from "react";
import { PLOT_HEIGHT, PLOT_MARGIN, PLOT_WIDTH } from "../math/sequencePlot";
import type { PracticePlotSpec } from "../practice/practiceTypes";
import { MathText } from "./MathText";

const PLOT_BOTTOM = PLOT_HEIGHT - PLOT_MARGIN.bottom;
const PLOT_RIGHT = PLOT_WIDTH - PLOT_MARGIN.right;
const INNER_WIDTH = PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right;
const INNER_HEIGHT = PLOT_HEIGHT - PLOT_MARGIN.top - PLOT_MARGIN.bottom;
/** Uniform grid points, plus geometric points hugging both ends so narrow peaks near an end are drawn. */
const UNIFORM_SAMPLES = 500;
const END_SAMPLES = 80;
const END_RATIO_MIN = 1e-6;

type Point = { x: number; y: number };

/**
 * The x values drawn on [from, to]: a uniform grid plus log-spaced offsets from both ends. The
 * list is sorted, deduplicated, starts at `from` and ends exactly at `to` (never beyond it).
 */
export function practiceSampleXs(from: number, to: number): number[] {
  if (!(to > from)) return [];
  const width = to - from;
  const xs: number[] = [];
  for (let i = 0; i < UNIFORM_SAMPLES; i += 1) xs.push(from + (width * i) / UNIFORM_SAMPLES);
  for (let k = 0; k < END_SAMPLES; k += 1) {
    const r = END_RATIO_MIN ** (1 - k / (END_SAMPLES - 1)) * 0.5;
    xs.push(from + width * r, to - width * r);
  }
  xs.push(to);
  xs.sort((a, b) => a - b);
  const out: number[] = [];
  for (const x of xs) {
    const clamped = Math.min(to, Math.max(from, x));
    if (out.length === 0 || clamped > out[out.length - 1]) out.push(clamped);
  }
  return out;
}

const BREAK_NUDGE = 1e-9;
/** More jumps than this (a fine staircase): split the curve but draw no dots. */
export const BREAK_DOT_MAX = 24;

/**
 * Splits the sampled x values at the `breaks` of a piecewise function: one list per piece, never containing
 * a break itself. Every piece but the first starts a hair to the right of its break (its right-hand limit),
 * every piece but the last ends a hair to the left of the next one. A break at an end of (from, to) only
 * trims that end (the isolated value there is drawn as a dot, see `breakDots`); breaks outside [from, to]
 * are ignored. Without any break the single list is returned unchanged.
 */
export function splitSamples(xs: number[], breaks: number[], from: number, to: number): number[][] {
  const finite = breaks.filter((b) => Number.isFinite(b));
  const cuts = [...new Set(finite.filter((b) => b > from && b < to))].sort((a, b) => a - b);
  const atFrom = finite.includes(from);
  const atTo = finite.includes(to);
  if (cuts.length === 0 && !atFrom && !atTo) return [xs];
  const eps = (to - from) * BREAK_NUDGE;
  const bounds = [from, ...cuts, to];
  return bounds.slice(0, -1).map((lo, i) => {
    const hi = bounds[i + 1];
    const first = i === 0;
    const last = i === bounds.length - 2;
    const inner = xs.filter((x) => x > lo + eps && x < hi - eps);
    return [first ? (atFrom ? from + eps : lo) : lo + eps, ...inner, last ? (atTo ? to - eps : hi) : hi - eps];
  });
}

/**
 * The dots at the breaks of `fn`: the left and right limits (a closed dot where the value taken equals
 * that limit, an open one where it does not) and a closed dot for a value equal to neither. A break at an
 * end of (from, to) has only the limit from inside. A break where `fn` is in fact continuous gives no dot.
 */
export function breakDots(fn: (x: number) => number, breaks: number[], from: number, to: number): { x: number; y: number; closed: boolean }[] {
  const eps = (to - from) * BREAK_NUDGE;
  const dots: { x: number; y: number; closed: boolean }[] = [];
  for (const b of new Set(breaks)) {
    if (!(b >= from && b <= to)) continue;
    const hasLeft = b > from;
    const hasRight = b < to;
    const left = hasLeft ? fn(b - eps) : NaN;
    const right = hasRight ? fn(b + eps) : NaN;
    const value = fn(b);
    const sides = [...(hasLeft ? [left] : []), ...(hasRight ? [right] : [])];
    if (![value, ...sides].every(Number.isFinite)) continue;
    const tol = 1e-6 * Math.max(1, Math.abs(value), ...sides.map(Math.abs));
    const atLeft = hasLeft && Math.abs(value - left) <= tol;
    const atRight = hasRight && Math.abs(value - right) <= tol;
    const split = hasLeft && hasRight && Math.abs(left - right) > tol;
    if (!split && sides.every((side) => Math.abs(value - side) <= tol)) continue;
    if (hasLeft) dots.push({ x: b, y: left, closed: atLeft });
    if (hasRight && (split || !hasLeft)) dots.push({ x: b, y: right, closed: atRight });
    if (!atLeft && !atRight) dots.push({ x: b, y: value, closed: true });
  }
  return dots;
}

/** Roughly five or six round tick values across [min, max]. */
function niceTicks(min: number, max: number): number[] {
  const span = max - min;
  if (!(span > 0)) return [min];
  const raw = span / 5;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5, 10].find((m) => m * pow >= raw) ?? 10) * pow;
  const ticks: number[] = [];
  for (let k = Math.ceil(min / step - 1e-9); k * step <= max + step * 1e-9; k += 1) {
    ticks.push(Number((k * step).toPrecision(10)));
  }
  return ticks;
}

const label = (v: number) => String(Number(v.toFixed(4)));

type Props = { spec: PracticePlotSpec; n: number; epsilon: number; showBand: boolean };

/**
 * The generic graph of a summary-practice card: f_n over the part of the domain inside the view,
 * the domain's outside faded, the pointwise limit, an optional epsilon-band and a marker per n.
 * An LTR island with no numeric readout.
 */
export function PracticePlot({ spec, n, epsilon, showBand }: Props) {
  const uid = useId().replace(/:/g, "");
  const clipId = `practice-clip-${uid}`;
  const descId = `practice-desc-${uid}`;
  const { view, domain } = spec;
  const px = (x: number) => PLOT_MARGIN.left + ((x - view.xMin) / (view.xMax - view.xMin)) * INNER_WIDTH;
  const py = (y: number) => PLOT_MARGIN.top + ((view.yMax - y) / (view.yMax - view.yMin)) * INNER_HEIGHT;
  const yCap = view.yMax + 2 * (view.yMax - view.yMin);
  const cy = (y: number) => py(Math.min(yCap, Math.max(-yCap, y)));
  const pathOf = (pts: Point[]) => pts.map((p, i) => `${i === 0 ? "M" : "L"}${px(p.x).toFixed(2)},${cy(p.y).toFixed(2)}`).join(" ");

  const from = Math.max(view.xMin, domain.left);
  const to = Math.min(view.xMax, domain.right);
  const xs = practiceSampleXs(from, to);
  const sample = (fn: (x: number) => number, breaks: number[] | undefined): Point[][] =>
    splitSamples(xs, breaks ?? [], from, to).map((piece) => {
      const pts: Point[] = [];
      for (const x of piece) {
        const y = fn(x);
        if (Number.isFinite(y)) pts.push({ x, y });
      }
      return pts;
    }).filter((pts) => pts.length > 0);
  const limitFn = spec.limit;
  const curvePieces = sample((x) => spec.value(n, x), spec.breaks?.(n));
  const limitPieces = limitFn ? sample(limitFn, spec.limitBreaks) : [];
  const curve: Point[] = curvePieces.flat();
  const limitPts: Point[] = limitPieces.flat();
  const piecesPath = (pieces: Point[][]) => pieces.filter((pts) => pts.length > 1).map(pathOf).join(" ");
  const showEpsilon = showBand && limitFn !== null && Number.isFinite(epsilon) && epsilon > 0 && limitPts.length > 1;
  const bandPath = (): string => limitPieces.filter((pts) => pts.length > 1).map((pts) => {
    const upper = pts.map((p) => `${px(p.x).toFixed(2)},${cy(p.y + epsilon).toFixed(2)}`);
    const lower = [...pts].reverse().map((p) => `${px(p.x).toFixed(2)},${cy(p.y - epsilon).toFixed(2)}`);
    return `M${[...upper, ...lower].join(" L")} Z`;
  }).join(" ");
  // Dots at the interior jumps of f_n and of f (only those inside the window).
  const inWindow = (d: { x: number; y: number }) => d.x >= view.xMin && d.x <= view.xMax && d.y >= view.yMin && d.y <= view.yMax;
  // With very many jumps (a staircase) the curve is still split, but the dots would only clutter it.
  const curveBreaks = spec.breaks?.(n) ?? [];
  const breakCurveDots = curveBreaks.length > 0 && curveBreaks.length <= BREAK_DOT_MAX
    ? breakDots((x) => spec.value(n, x), curveBreaks, from, to).filter(inWindow) : [];
  const breakLimitDots = limitFn && spec.limitBreaks && spec.limitBreaks.length <= BREAK_DOT_MAX
    ? breakDots(limitFn, spec.limitBreaks, from, to).filter(inWindow) : [];

  // The window outside the domain, faded.
  const outside: { x1: number; x2: number }[] = [];
  if (domain.left > view.xMin) outside.push({ x1: view.xMin, x2: Math.min(view.xMax, domain.left) });
  if (domain.right < view.xMax) outside.push({ x1: Math.max(view.xMin, domain.right), x2: view.xMax });

  // Domain endpoints inside the view: dashed boundary and a dot on the curve.
  const ends = [
    { x: domain.left, closed: domain.leftClosed },
    { x: domain.right, closed: domain.rightClosed },
  ].filter((e) => Number.isFinite(e.x) && e.x >= view.xMin && e.x <= view.xMax);
  const endDots = ends.flatMap((e) => {
    let y = spec.value(n, e.x);
    if (!Number.isFinite(y)) {
      const near = e.x === domain.left ? curve[0] : curve[curve.length - 1];
      if (!near) return [];
      y = near.y;
    }
    return y >= view.yMin && y <= view.yMax ? [{ ...e, y }] : [];
  });

  // The true maximum of the drawn part when it leaves the window.
  let peak: Point | null = null;
  for (const p of curve) if (p.y > view.yMax && (!peak || p.y > peak.y)) peak = p;

  const markerX = spec.marker ? spec.marker(n) : null;
  const markerInDomain = markerX !== null && Number.isFinite(markerX)
    && markerX >= Math.max(view.xMin, domain.left) && markerX <= Math.min(view.xMax, domain.right);
  const markerY = markerInDomain ? spec.value(n, markerX as number) : NaN;
  const marker = markerInDomain && Number.isFinite(markerY) ? { x: markerX as number, y: markerY } : null;
  const markerBase = Math.min(view.yMax, Math.max(view.yMin, Math.min(0, view.yMax)));

  const axisY = py(Math.max(view.yMin, Math.min(0, view.yMax)));
  const axisX = px(Math.max(view.xMin, Math.min(0, view.xMax)));

  return (
    <figure className="convergence-plot practice-plot" dir="ltr">
      <figcaption className="convergence-plot-caption" dir="rtl">
        <span className="convergence-plot-title">הגרף של <MathText math="f_n" /></span>
        <span className="convergence-plot-meta">האינדקס: <MathText math={`n=${n}`} /></span>
      </figcaption>

      <svg className="convergence-svg practice-svg" viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`} {...{ dir: "ltr" }}
        role="img" aria-label={`גרף הפונקציה f_${n}`} aria-describedby={descId}>
        <desc id={descId}>
          גרף של f עבור n שווה {n}{limitFn ? ", עם פונקציית הגבול" : ""}{showEpsilon ? " ורצועת ε סביבה" : ""}.
        </desc>
        <defs>
          <clipPath id={clipId}>
            <rect x={PLOT_MARGIN.left} y={PLOT_MARGIN.top} width={INNER_WIDTH} height={INNER_HEIGHT} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          {outside.map((o, i) => (
            <rect key={`out-${i}`} className="practice-plot-outside" data-part="outside"
              x={px(o.x1)} y={PLOT_MARGIN.top} width={Math.max(0, px(o.x2) - px(o.x1))} height={INNER_HEIGHT} />
          ))}
        </g>

        <g className="convergence-axis">
          <line x1={PLOT_MARGIN.left} y1={axisY} x2={PLOT_RIGHT} y2={axisY} />
          <line x1={axisX} y1={PLOT_MARGIN.top} x2={axisX} y2={PLOT_BOTTOM} />
          {niceTicks(view.xMin, view.xMax).map((x) => <g key={`xt-${x}`}>
            <line x1={px(x)} x2={px(x)} y1={axisY - 3} y2={axisY + 3} />
            <text x={px(x)} y={PLOT_HEIGHT - 8} textAnchor="middle">{label(x)}</text>
          </g>)}
          {niceTicks(view.yMin, view.yMax).filter((y) => Math.abs(y) > 1e-12).map((y) => <g key={`yt-${y}`}>
            <line x1={axisX - 3} x2={axisX + 3} y1={py(y)} y2={py(y)} />
            <text x={PLOT_MARGIN.left - 7} y={py(y) + 4} textAnchor="end">{label(y)}</text>
          </g>)}
        </g>

        <g clipPath={`url(#${clipId})`}>
          {ends.map((e, i) => (
            <line key={`bd-${i}`} className="convergence-domain-boundary" data-part="boundary"
              x1={px(e.x)} x2={px(e.x)} y1={PLOT_MARGIN.top} y2={PLOT_BOTTOM} />
          ))}
          {showEpsilon && <path className="convergence-band" data-part="band" d={bandPath()} />}
          {limitFn && limitPts.length > 1 && (
            <path className="convergence-limit" data-part="limit" d={piecesPath(limitPieces)} />
          )}
          {curve.length > 1 && <path className="convergence-curve" data-part="curve" d={piecesPath(curvePieces)} />}
          {breakLimitDots.map((d, i) => (
            <circle key={`ld-${i}`} data-part="limit-dot" className={`convergence-limit-point${d.closed ? " convergence-endpoint-closed" : ""}`}
              cx={px(d.x)} cy={py(d.y)} r="4" />
          ))}
          {breakCurveDots.map((d, i) => (
            <circle key={`bd-${i}`} data-part="break-dot" className={d.closed ? "convergence-endpoint-closed" : "convergence-endpoint-open"}
              cx={px(d.x)} cy={py(d.y)} r="4" />
          ))}
          {endDots.map((d, i) => (
            <circle key={`ed-${i}`} data-part="dot" className={d.closed ? "convergence-endpoint-closed" : "convergence-endpoint-open"}
              cx={px(d.x)} cy={py(d.y)} r="4" />
          ))}
          {marker && (
            <g data-part="marker">
              <line className="convergence-probe-line" x1={px(marker.x)} x2={px(marker.x)} y1={cy(marker.y)} y2={py(markerBase)} />
              <circle className="convergence-probe" cx={px(marker.x)} cy={cy(marker.y)} r="5" />
            </g>
          )}
        </g>

        {peak && (
          <g className="practice-plot-peak" data-part="peak">
            <polygon className="practice-plot-peak-marker"
              points={`${px(peak.x) - 5},${PLOT_MARGIN.top + 9} ${px(peak.x) + 5},${PLOT_MARGIN.top + 9} ${px(peak.x)},${PLOT_MARGIN.top + 1}`} />
            <text className="practice-plot-peak-label" x={px(peak.x) + 9} y={PLOT_MARGIN.top + 10} textAnchor="start">{label(peak.y)}</text>
          </g>
        )}
      </svg>

      <div className="convergence-legend practice-plot-legend" aria-label="מקרא" dir="rtl">
        <span className="convergence-key" data-kind="curve">הגרף של <MathText math={`f_{${n}}`} /></span>
        {limitFn && <span className="convergence-key" data-kind="limit">פונקציית הגבול <MathText math="f" /></span>}
        {showEpsilon && <span className="convergence-key" data-kind="band">רצועה סביב <MathText math="f" /> ברוחב <MathText math="\varepsilon" /></span>}
        {marker && <span className="convergence-key" data-kind="probe">{spec.markerLabel ?? "נקודה מסומנת"}</span>}
        {(endDots.length > 0 || breakCurveDots.some((d) => d.closed)) && <span className="convergence-key" data-kind="closed-dot">נקודה מלאה: הערך נלקח</span>}
        {(endDots.some((d) => !d.closed) || breakCurveDots.some((d) => !d.closed)) && <span className="convergence-key" data-kind="open-dot">נקודה ריקה: הערך אינו נלקח</span>}
        {outside.length > 0 && <span className="convergence-key" data-kind="outside">מחוץ לתחום ההגדרה</span>}
        {peak && <span className="convergence-key" data-kind="peak">שיא הגרף מחוץ לחלון</span>}
      </div>
    </figure>
  );
}
