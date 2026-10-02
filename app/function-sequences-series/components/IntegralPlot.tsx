"use client";

import { useId } from "react";
import { PLOT_HEIGHT, PLOT_MARGIN, PLOT_WIDTH } from "../math/sequencePlot";
import type { IntExample, IntGraphFlags } from "../math/integralExamples";
import { MathText } from "./MathText";

const PLOT_BOTTOM = PLOT_HEIGHT - PLOT_MARGIN.bottom;
const PLOT_RIGHT = PLOT_WIDTH - PLOT_MARGIN.right;
const INNER_WIDTH = PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right;
const INNER_HEIGHT = PLOT_HEIGHT - PLOT_MARGIN.top - PLOT_MARGIN.bottom;
/** Dense enough for the narrow peaks near 1/n at n = 40. */
const SAMPLES = 480;

type Point = { x: number; y: number };

/** Samples of f_n over [from, to] inside [0,1]. */
export function integralSamples(ex: IntExample, n: number, from = 0, to = 1): Point[] {
  const points: Point[] = [];
  const count = Math.max(2, Math.round(SAMPLES * (to - from)));
  for (let i = 0; i <= count; i += 1) {
    // End exactly at `to`: from + (to - from) can round past it (a=0.2: 0.2 + 0.8 = 1.0000000000000002),
    // and the example rejects x outside its domain.
    const x = i === count ? to : from + ((to - from) * i) / count;
    points.push({ x, y: ex.value(n, x) });
  }
  return points;
}

type Props = {
  example: IntExample;
  n: number;
  flags: IntGraphFlags;
  epsilon: number;
  /** A point a in (0,1): shade [0,a] and [a,1] in two styles and mark x=a. Drawn whenever given. */
  split?: number;
};

/**
 * The graph of f_n on [0,1] for the limit-and-integral activity, with the limit f, the epsilon-band
 * and the shaded area under f_n shown only when `flags` allows. An LTR island with no numeric readout.
 */
export function IntegralPlot({ example: ex, n, flags, epsilon, split }: Props) {
  const uid = useId().replace(/:/g, "");
  const clipId = `integral-clip-${uid}`;
  const descId = `integral-desc-${uid}`;
  const view = ex.view;
  const px = (x: number) => PLOT_MARGIN.left + ((x - view.xMin) / (view.xMax - view.xMin)) * INNER_WIDTH;
  const py = (y: number) => PLOT_MARGIN.top + ((view.yMax - y) / (view.yMax - view.yMin)) * INNER_HEIGHT;
  const fmt = (v: number) => v.toFixed(2);
  const pathOf = (points: Point[]) => points.map((p, i) => `${i === 0 ? "M" : "L"}${fmt(px(p.x))},${fmt(py(p.y))}`).join(" ");
  const areaOf = (points: Point[]) =>
    `${pathOf(points)} L${fmt(px(points[points.length - 1].x))},${fmt(py(0))} L${fmt(px(points[0].x))},${fmt(py(0))} Z`;

  const curve = integralSamples(ex, n);
  const hasSplit = split !== undefined && split > 0 && split < 1;
  const showEpsilon = flags.band && Number.isFinite(epsilon) && epsilon > 0;
  // f is discontinuous at 0 when its value there differs from the value just to the right (I3).
  const pointAtZero = ex.limit(0) !== ex.limit(1);
  const limitY = ex.limit(1);
  const yStep = view.yMax > 1 ? 0.5 : 0.2;
  const yTicks = Array.from({ length: Math.floor(view.yMax / yStep + 1e-9) + 1 }, (_, i) => Number((i * yStep).toFixed(2)));

  return (
    <figure className="convergence-plot integral-plot" dir="ltr">
      <figcaption className="convergence-plot-caption" dir="rtl">
        <span className="convergence-plot-title">גרף הפונקציה</span>
        <span className="convergence-plot-meta">הפונקציה: <MathText math={ex.fnLatex} /></span>
        <span className="convergence-plot-meta">התחום: <MathText math={ex.domainLatex} /></span>
        <span className="convergence-plot-meta">האינדקס: <MathText math={`n=${n}`} /></span>
      </figcaption>

      <svg className="convergence-svg integral-svg" viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`} {...{ dir: "ltr" }}
        role="img" aria-label={`גרף הפונקציה f_${n}`} aria-describedby={descId}>
        <desc id={descId}>
          גרף של f עבור n שווה {n}{flags.limit ? ", עם פונקציית הגבול" : ""}{flags.band ? " ורצועת ε סביבה" : ""}
          {flags.area ? ", והשטח שמתחת לגרף מוצלל" : ""}.
        </desc>
        <defs>
          <clipPath id={clipId}>
            <rect x={PLOT_MARGIN.left} y={PLOT_MARGIN.top} width={INNER_WIDTH} height={INNER_HEIGHT} />
          </clipPath>
        </defs>

        <g className="convergence-axis">
          <line x1={PLOT_MARGIN.left} y1={py(0)} x2={PLOT_RIGHT} y2={py(0)} />
          <line x1={px(0)} y1={PLOT_MARGIN.top} x2={px(0)} y2={PLOT_BOTTOM} />
          {[0, 0.5, 1].map((x) => <g key={`xt-${x}`}>
            <line x1={px(x)} x2={px(x)} y1={py(0) - 3} y2={py(0) + 3} />
            <text x={px(x)} y={PLOT_HEIGHT - 8} textAnchor="middle">{x}</text>
          </g>)}
          {yTicks.filter((y) => y !== 0).map((y) => <g key={`yt-${y}`}>
            <line x1={px(0) - 3} x2={px(0) + 3} y1={py(y)} y2={py(y)} />
            <text x={PLOT_MARGIN.left - 7} y={py(y) + 4} textAnchor="end">{y}</text>
          </g>)}
        </g>

        <g clipPath={`url(#${clipId})`}>
          {showEpsilon && (
            <rect className="convergence-band integral-band" data-part="band"
              x={px(0)} y={py(limitY + epsilon)} width={px(1) - px(0)} height={Math.max(0, py(limitY - epsilon) - py(limitY + epsilon))} />
          )}
          {showEpsilon && pointAtZero && (
            <line className="convergence-band-edge integral-band-point" data-part="band"
              x1={px(0)} x2={px(0)} y1={py(ex.limit(0) - epsilon)} y2={py(ex.limit(0) + epsilon)} />
          )}
          {flags.area && !hasSplit && (
            <path className="integral-area" data-part="area" d={areaOf(curve)} />
          )}
          {hasSplit && (
            <>
              <path className="integral-area integral-area-left" data-part="area-left" d={areaOf(integralSamples(ex, n, 0, split))} />
              <path className="integral-area integral-area-right" data-part="area-right" d={areaOf(integralSamples(ex, n, split, 1))} />
            </>
          )}
          {flags.limit && (
            <line className="convergence-limit integral-limit" data-part="limit"
              x1={px(0)} x2={px(1)} y1={py(limitY)} y2={py(limitY)} />
          )}
          <path className="convergence-curve integral-curve" data-part="curve" d={pathOf(curve)} />
          {flags.limit && pointAtZero && (
            <>
              <circle className="convergence-limit-point integral-limit-open" data-part="limit-open" cx={px(0)} cy={py(limitY)} r="4" />
              <circle className="convergence-limit-point convergence-endpoint-closed" data-part="limit-point"
                cx={px(0)} cy={py(ex.limit(0))} r="4" />
            </>
          )}
          {hasSplit && (
            <line className="integral-split-line" data-part="split-line"
              x1={px(split)} x2={px(split)} y1={PLOT_MARGIN.top} y2={PLOT_BOTTOM} />
          )}
        </g>
        {hasSplit && (
          <text className="integral-split-label" data-part="split-label" x={px(split)} y={PLOT_BOTTOM + 13} textAnchor="middle">a</text>
        )}
      </svg>

      <div className="convergence-legend integral-legend" aria-label="מקרא" dir="rtl">
        <span className="convergence-key" data-kind="curve">הגרף של <MathText math={`f_{${n}}`} /></span>
        {flags.limit && <span className="convergence-key" data-kind="limit">פונקציית הגבול <MathText math="f" /></span>}
        {flags.band && <span className="convergence-key" data-kind="band">רצועה סביב <MathText math="f" /> ברוחב <MathText math="\varepsilon" /></span>}
        {flags.area && !hasSplit && <span className="convergence-key" data-kind="area">השטח שמתחת לגרף: האינטגרל</span>}
        {hasSplit && <span className="convergence-key" data-kind="area-left">השטח מעל <MathText math="[0,a]" /></span>}
        {hasSplit && <span className="convergence-key" data-kind="area-right">השטח מעל <MathText math="[a,1]" /></span>}
      </div>
    </figure>
  );
}
