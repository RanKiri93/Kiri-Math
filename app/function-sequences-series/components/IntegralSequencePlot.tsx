"use client";

import { PLOT_HEIGHT, PLOT_MARGIN, PLOT_WIDTH } from "../math/sequencePlot";
import { INT_MAX_N, type IntExample, type IntGraphFlags } from "../math/integralExamples";
import { MathText } from "./MathText";

const PLOT_BOTTOM = PLOT_HEIGHT - PLOT_MARGIN.bottom;
const PLOT_RIGHT = PLOT_WIDTH - PLOT_MARGIN.right;
const INNER_WIDTH = PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right;
const INNER_HEIGHT = PLOT_HEIGHT - PLOT_MARGIN.top - PLOT_MARGIN.bottom;
const N_TICKS = [1, 10, 20, 30, 40];

/** Fixed vertical range per example so the trend stays comparable between n values. */
export function integralSequenceRange(ex: IntExample): { yMin: number; yMax: number; ticks: number[] } {
  return ex.id === "I3"
    ? { yMin: -0.05, yMax: 1.1, ticks: [0, 0.5, 1] }
    : { yMin: -0.03, yMax: 0.6, ticks: [0, 0.2, 0.4, 0.6] };
}

/** x position of the point n (n = 1 .. INT_MAX_N), with half a step of room at both ends. */
export function integralSequenceX(n: number): number {
  return PLOT_MARGIN.left + ((n - 0.5) / INT_MAX_N) * INNER_WIDTH;
}

/**
 * The second plot of the limit-and-integral activity: the points (n, I_n), I_n = integral of f_n over
 * [0,1], a reference line at the integral of f and, with `flags.supremum`, the points (n, M_n).
 * Legend only, no numeric readout. The shell decides whether to show it (`flags.integrals`).
 */
export function IntegralSequencePlot({ example: ex, n, flags }: { example: IntExample; n: number; flags: IntGraphFlags }) {
  const { yMin, yMax, ticks } = integralSequenceRange(ex);
  const py = (y: number) => PLOT_MARGIN.top + ((yMax - y) / (yMax - yMin)) * INNER_HEIGHT;
  const ns = Array.from({ length: INT_MAX_N }, (_, i) => i + 1);
  const axisLeft = PLOT_MARGIN.left;

  return (
    <figure className="convergence-plot integral-sequence-plot" dir="ltr">
      <figcaption className="convergence-plot-caption" dir="rtl">
        <span className="convergence-plot-title">סדרת האינטגרלים</span>
        <span className="convergence-plot-meta">הנקודות: <MathText math={String.raw`(n,I_n),\ I_n=\int_0^1 f_n(x)\,dx`} /></span>
        {flags.supremum && (
          <span className="convergence-plot-meta">והנקודות: <MathText math={String.raw`(n,M_n),\ M_n=\sup_{x\in[0,1]}|f_n(x)-f(x)|`} /></span>
        )}
      </figcaption>

      <svg className="convergence-svg integral-sequence-svg" viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`} {...{ dir: "ltr" }}
        role="img" aria-label="הנקודות I_n כפונקציה של n, עם קו האינטגרל של פונקציית הגבול">
        <g className="convergence-axis">
          <line x1={axisLeft} y1={py(0)} x2={PLOT_RIGHT} y2={py(0)} />
          <line x1={axisLeft} y1={PLOT_MARGIN.top} x2={axisLeft} y2={PLOT_BOTTOM} />
          {N_TICKS.map((t) => <g key={t}>
            <line x1={integralSequenceX(t)} x2={integralSequenceX(t)} y1={py(0)} y2={py(0) + 4} />
            <text x={integralSequenceX(t)} y={PLOT_HEIGHT - 8} textAnchor="middle">{t}</text>
          </g>)}
          {ticks.filter((y) => y !== 0).map((y) => <g key={y}>
            <line x1={axisLeft - 3} x2={axisLeft + 3} y1={py(y)} y2={py(y)} />
            <text x={axisLeft - 7} y={py(y) + 4} textAnchor="end">{y}</text>
          </g>)}
          <text x={axisLeft - 7} y={py(0) + 4} textAnchor="end">0</text>
        </g>

        <line className="convergence-limit integral-reference" data-part="reference"
          x1={axisLeft} x2={PLOT_RIGHT} y1={py(ex.limitIntegral)} y2={py(ex.limitIntegral)} />
        <text className="integral-reference-label" data-part="reference-label"
          x={PLOT_RIGHT - 2} y={py(ex.limitIntegral) - 6} textAnchor="end">∫f</text>

        {flags.supremum && ns.map((k) => (
          <circle key={`m-${k}`} className={`integral-sup-dot${k === n ? " is-current" : ""}`} data-part="sup-dot"
            cx={integralSequenceX(k)} cy={py(ex.sup(k))} r={k === n ? 4.5 : 2.8} />
        ))}
        {ns.map((k) => (
          <circle key={`i-${k}`} className={`integral-dot${k === n ? " is-current" : ""}`} data-part="integral-dot"
            cx={integralSequenceX(k)} cy={py(ex.integral(k))} r={k === n ? 4.5 : 2.8} />
        ))}
      </svg>

      <div className="convergence-legend integral-legend" aria-label="מקרא" dir="rtl">
        <span className="convergence-key" data-kind="integral-dot"><MathText math="I_n" /> האינטגרל של <MathText math="f_n" /></span>
        <span className="convergence-key" data-kind="limit">האינטגרל של <MathText math="f" /></span>
        {flags.supremum && <span className="convergence-key" data-kind="sup-dot"><MathText math="M_n" /> הסופרמום של <MathText math="|f_n-f|" /></span>}
      </div>
    </figure>
  );
}
