"use client";

import { useId } from "react";
import { PLOT_HEIGHT, PLOT_MARGIN, PLOT_WIDTH } from "../math/sequencePlot";
import type { ContExample, ContGraphFlags, ContPiece } from "../math/continuityExamples";
import { MathText } from "./MathText";

const PLOT_BOTTOM = PLOT_HEIGHT - PLOT_MARGIN.bottom;
const PLOT_RIGHT = PLOT_WIDTH - PLOT_MARGIN.right;
const INNER_WIDTH = PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right;
const INNER_HEIGHT = PLOT_HEIGHT - PLOT_MARGIN.top - PLOT_MARGIN.bottom;
const SAMPLES = 160;
/** Endpoint dots are drawn only while they stay legible: C3 has 2n of them. */
export const CONT_DOT_MAX_N = 12;

type View = ContExample["view"];
type Point = { x: number; y: number };
type Dot = { x: number; y: number; closed: boolean };

/** Sample points of a piece, denser toward both ends (the 1/x branch of C2 needs the left end). */
function samplePiece(piece: ContPiece): Point[] {
  const width = piece.right - piece.left;
  if (width === 0) return [];
  const points: Point[] = [];
  for (let i = 0; i <= SAMPLES; i += 1) {
    const t = i / SAMPLES;
    const s = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
    let x = piece.left + width * s;
    // Open ends are never evaluated exactly (1/x at 0), nudge inside by a hair.
    if (i === 0 && !piece.leftClosed) x = piece.left + width * 1e-9;
    if (i === SAMPLES && !piece.rightClosed) x = piece.right - width * 1e-9;
    const y = piece.value(x);
    if (Number.isFinite(y)) points.push({ x, y });
  }
  return points;
}

function yTicks(view: View): number[] {
  for (const step of [0.25, 0.5, 1, 2, 4, 5, 10]) {
    const count = Math.floor(view.yMax / step + 1e-9) + 1;
    if (count <= 6) return Array.from({ length: count }, (_, i) => Number((i * step).toFixed(2)));
  }
  return [0];
}

function xTicks(ex: ContExample): number[] {
  const { left, right } = ex.domain;
  const step = right - left > 1.5 ? 1 : 0.5;
  const ticks: number[] = [];
  for (let x = left; x <= right + 1e-9; x += step) ticks.push(Number(x.toFixed(2)));
  return ticks;
}

/** Open/closed endpoint dots for a piecewise function; drops points where the function is continuous. */
export function endpointDots(pieces: ContPiece[], domain: ContExample["domain"]): Dot[] {
  const raw: Dot[] = [];
  for (const p of pieces) {
    for (const [x, closed] of [[p.left, p.leftClosed], [p.right, p.rightClosed]] as const) {
      const y = p.value(x);
      if (Number.isFinite(y)) raw.push({ x, y, closed });
    }
  }
  const xs = [...new Set(raw.map((d) => d.x))];
  const dots: Dot[] = [];
  for (const x of xs) {
    const group = raw.filter((d) => d.x === x);
    const interior = x > domain.left && x < domain.right;
    const flat = group.every((d) => Math.abs(d.y - group[0].y) < 1e-9);
    if (interior && flat) continue; // a continuous join: no dot
    for (const d of group) {
      const same = dots.find((e) => e.x === d.x && Math.abs(e.y - d.y) < 1e-9);
      if (same) same.closed = same.closed || d.closed;
      else dots.push({ ...d });
    }
  }
  return dots;
}

type Props = {
  example: ContExample;
  n: number;
  flags: ContGraphFlags;
  epsilon: number;
};

/**
 * The graph of f_n for the continuity activity, with the limit f, the epsilon-band and the jump
 * markers shown only when `flags` allows. Every piece is its own path, so nothing is connected
 * across a jump. The figure is an LTR island and carries no numeric readout.
 */
export function ContinuityPlot({ example: ex, n, flags, epsilon }: Props) {
  const uid = useId().replace(/:/g, "");
  const clipId = `continuity-clip-${uid}`;
  const descId = `continuity-desc-${uid}`;
  const view = ex.view;
  const px = (x: number) => PLOT_MARGIN.left + ((x - view.xMin) / (view.xMax - view.xMin)) * INNER_WIDTH;
  const py = (y: number) => PLOT_MARGIN.top + ((view.yMax - y) / (view.yMax - view.yMin)) * INNER_HEIGHT;
  const yCap = view.yMax + 2 * (view.yMax - view.yMin);
  const cy = (y: number) => py(Math.min(yCap, Math.max(-yCap, y)));
  const pathOf = (points: Point[]) => points.map((p, i) => `${i === 0 ? "M" : "L"}${px(p.x).toFixed(2)},${cy(p.y).toFixed(2)}`).join(" ");
  const visible = (d: Dot) => d.x >= view.xMin && d.x <= view.xMax && d.y >= view.yMin && d.y <= view.yMax;

  const fnPieces = ex.pieces(n);
  const fnPaths = fnPieces.map((p) => samplePiece(p));
  const limitPaths = flags.limit || flags.band ? ex.limitPieces.map((p) => ({ piece: p, points: samplePiece(p) })) : [];

  const showEpsilon = flags.band && Number.isFinite(epsilon) && epsilon > 0;
  const bandPolygon = (points: Point[]): string => {
    const upper = points.map((p) => `${px(p.x).toFixed(2)},${cy(p.y + epsilon).toFixed(2)}`);
    const lower = [...points].reverse().map((p) => `${px(p.x).toFixed(2)},${cy(p.y - epsilon).toFixed(2)}`);
    return `M${[...upper, ...lower].join(" L")} Z`;
  };

  const showDots = flags.jumps && n <= CONT_DOT_MAX_N;
  const fnDots = showDots ? endpointDots(fnPieces, ex.domain).filter(visible) : [];
  const limitDots = flags.jumps && flags.limit ? endpointDots(ex.limitPieces, ex.domain).filter(visible) : [];

  // The true peak of f_n when it leaves the window (C2): a small marker at the top edge.
  let peak: Point | null = null;
  for (const points of fnPaths) for (const p of points) if (p.y > view.yMax && (!peak || p.y > peak.y)) peak = p;
  const discontinuity = flags.jumps && flags.limit ? ex.limitDiscontinuity : null;
  const axisX = px(Math.max(view.xMin, Math.min(0, view.xMax)));

  return (
    <figure className="convergence-plot continuity-plot" dir="ltr">
      <figcaption className="convergence-plot-caption" dir="rtl">
        <span className="convergence-plot-title">גרף הפונקציה</span>
        <span className="convergence-plot-meta">הפונקציה: <MathText math={ex.fnLatex} /></span>
        <span className="convergence-plot-meta">התחום: <MathText math={ex.domainLatex} /></span>
        <span className="convergence-plot-meta">האינדקס: <MathText math={`n=${n}`} /></span>
      </figcaption>

      <svg className="convergence-svg continuity-svg" viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`} {...{ dir: "ltr" }}
        role="img" aria-label={`גרף הפונקציה f_${n}`} aria-describedby={descId}>
        <desc id={descId}>
          גרף של f עבור n שווה {n}{flags.limit ? ", עם פונקציית הגבול" : ""}{flags.band ? " ורצועת ε סביבה" : ""}.
        </desc>
        <defs>
          <clipPath id={clipId}>
            <rect x={PLOT_MARGIN.left} y={PLOT_MARGIN.top} width={INNER_WIDTH} height={INNER_HEIGHT} />
          </clipPath>
        </defs>

        <g className="convergence-axis">
          <line x1={PLOT_MARGIN.left} y1={py(0)} x2={PLOT_RIGHT} y2={py(0)} />
          <line x1={axisX} y1={PLOT_MARGIN.top} x2={axisX} y2={PLOT_BOTTOM} />
          {xTicks(ex).map((x) => <g key={`xt-${x}`}>
            <line x1={px(x)} x2={px(x)} y1={py(0) - 3} y2={py(0) + 3} />
            <text x={px(x)} y={PLOT_HEIGHT - 8} textAnchor="middle">{x}</text>
          </g>)}
          {yTicks(view).filter((y) => y !== 0).map((y) => <g key={`yt-${y}`}>
            <line x1={axisX - 3} x2={axisX + 3} y1={py(y)} y2={py(y)} />
            <text x={PLOT_MARGIN.left - 7} y={py(y) + 4} textAnchor="end">{y}</text>
          </g>)}
        </g>

        <g clipPath={`url(#${clipId})`}>
          {showEpsilon && limitPaths.map(({ piece, points }, i) => piece.right === piece.left
            ? <line key={`bl-${i}`} className="convergence-band-edge continuity-band-point" data-part="band"
                x1={px(piece.left)} x2={px(piece.left)} y1={py(piece.value(piece.left) - epsilon)} y2={py(piece.value(piece.left) + epsilon)} />
            : points.length > 1 && <path key={`bp-${i}`} className="convergence-band continuity-band" data-part="band" d={bandPolygon(points)} />)}
          {discontinuity !== null && (
            <line className="continuity-jump-marker" data-part="discontinuity"
              x1={px(discontinuity)} x2={px(discontinuity)} y1={PLOT_MARGIN.top} y2={PLOT_BOTTOM} />
          )}
          {flags.limit && limitPaths.map(({ piece, points }, i) => piece.left === piece.right
            ? <circle key={`lp-${i}`} className="convergence-limit-point convergence-endpoint-closed" data-part="limit"
                cx={px(piece.left)} cy={py(piece.value(piece.left))} r="4" />
            : points.length > 1 && <path key={`lp-${i}`} className="convergence-limit continuity-limit" data-part="limit" d={pathOf(points)} />)}
          {fnPaths.map((points, i) => points.length > 1
            && <path key={`fp-${i}`} className="convergence-curve continuity-curve" data-part="curve" d={pathOf(points)} />)}
          {limitDots.map((d, i) => <circle key={`ld-${i}`} data-part="dot"
            className={`convergence-limit-point${d.closed ? " convergence-endpoint-closed" : ""}`} cx={px(d.x)} cy={py(d.y)} r="4" />)}
          {fnDots.map((d, i) => <circle key={`fd-${i}`} data-part="dot"
            className={d.closed ? "convergence-endpoint-closed" : "convergence-endpoint-open"} cx={px(d.x)} cy={py(d.y)} r="4" />)}
        </g>

        {peak && (
          <g className="continuity-peak" data-part="peak">
            <polygon className="continuity-peak-marker"
              points={`${px(peak.x) - 5},${PLOT_MARGIN.top + 9} ${px(peak.x) + 5},${PLOT_MARGIN.top + 9} ${px(peak.x)},${PLOT_MARGIN.top + 1}`} />
            <text className="continuity-peak-label" x={px(peak.x) + 9} y={PLOT_MARGIN.top + 10} textAnchor="start">{Number(peak.y.toFixed(2))}</text>
          </g>
        )}
      </svg>

      <div className="convergence-legend continuity-legend" aria-label="מקרא" dir="rtl">
        <span className="convergence-key" data-kind="curve">הגרף של <MathText math={`f_{${n}}`} /></span>
        {flags.limit && <span className="convergence-key" data-kind="limit">פונקציית הגבול <MathText math="f" /></span>}
        {flags.band && <span className="convergence-key" data-kind="band">רצועה סביב <MathText math="f" /> ברוחב <MathText math="\varepsilon" /></span>}
        {flags.jumps && <span className="convergence-key" data-kind="closed-dot">נקודה מלאה: הערך נלקח</span>}
        {flags.jumps && <span className="convergence-key" data-kind="open-dot">נקודה ריקה: הערך אינו נלקח</span>}
        {flags.jumps && flags.limit && ex.limitDiscontinuity !== null && <span className="convergence-key" data-kind="jump">נקודת אי־רציפות של <MathText math="f" /></span>}
        {peak && <span className="convergence-key" data-kind="peak">שיא הגרף מחוץ לחלון</span>}
      </div>
    </figure>
  );
}
