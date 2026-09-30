"use client";

import { PLOT_HEIGHT, PLOT_MARGIN, PLOT_WIDTH } from "../math/sequencePlot";
import type { SupExample } from "../math/supremumExamples";
import { SUP_MN_MAX_N, epsilonBand, epsilonReadout, mnDots, mnPlotX, supPlotY } from "../math/supremumPlot";
import { MathInlineText } from "./MathInlineText";
import { MathText } from "./MathText";
import { supFormat } from "./SupremumPlot";

const PLOT_BOTTOM = PLOT_HEIGHT - PLOT_MARGIN.bottom;
const PLOT_RIGHT = PLOT_WIDTH - PLOT_MARGIN.right;
const N_TICKS = [1, 16, 32, 48, 64];

/** The Hebrew sentence under G2, with inline math. Exported for tests. */
export function epsilonReadoutText(ex: SupExample, epsilon: number): { kind: "N" | "not-tending" | "beyond-range"; text: string } {
  const r = epsilonReadout(ex, epsilon);
  if (r.N !== null) {
    const base = `עבור $\\varepsilon=${supFormat(epsilon)}$: לכל $n>${r.N}$ הנקודה $M_n$ בתוך הרצועה.`;
    if (ex.limitValue > 0) {
      // Non-uniform example, band wider than lim M_n: being inside it decides nothing.
      return { kind: "N", text: `${base} אבל הרצועה רחבה מ־$${ex.limitLatex}$, הגבול של $M_n$, ולכן היא אינה מכריעה דבר. התכנסות במידה שווה דורשת זאת לכל $\\varepsilon>0$, ולכן בוחרים $\\varepsilon<${ex.limitLatex}$.` };
    }
    return { kind: "N", text: base };
  }
  if (r.reason === "not-tending") {
    return { kind: "not-tending", text: `עבור $\\varepsilon=${supFormat(epsilon)}$: הנקודות אינן נכנסות כולן לרצועה לעולם, כי $M_n$ אינו שואף ל־$0$.` };
  }
  return { kind: "beyond-range", text: `עבור $\\varepsilon=${supFormat(epsilon)}$: בטווח המוצג עדיין יש נקודות מחוץ לרצועה, כלומר $N>${SUP_MN_MAX_N}$.` };
}

/**
 * G2: the points (n, M_n) for n = 1..64 with the band |y| < epsilon around 0 and a one-sentence
 * reading of it. Shown only when the step flags `mnGraph`.
 */
export function SupSequencePlot({ example: ex, n, epsilon }: { example: SupExample; n: number; epsilon: number }) {
  const dots = mnDots(ex);
  const band = epsilonBand(ex, epsilon);
  const readout = epsilonReadoutText(ex, epsilon);
  const y0 = supPlotY(ex, 0);
  const axisLeft = mnPlotX(0.5);
  return (
    <figure className="convergence-plot supremum-plot supremum-mn-plot" dir="ltr">
      <figcaption className="convergence-plot-caption" dir="rtl">
        <span className="convergence-plot-title">גרף הסופרמומים</span>
        <span className="convergence-plot-meta">הנקודות: <MathText math="(n,M_n),\ M_n=\sup_{x\in D}|f_n(x)|" /></span>
      </figcaption>
      <svg className="convergence-svg supremum-svg" viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`} {...{ dir: "ltr" }}
        role="img" aria-label="גרף הסופרמומים M_n כפונקציה של n, עם רצועת אפסילון">
        <rect className="convergence-band supremum-mn-band" x={axisLeft} y={band.yUpper} width={PLOT_RIGHT - axisLeft} height={Math.max(0, band.yLower - band.yUpper)} />
        <line className="convergence-band-edge" x1={axisLeft} x2={PLOT_RIGHT} y1={band.yUpper} y2={band.yUpper} />
        <line className="convergence-band-edge" x1={axisLeft} x2={PLOT_RIGHT} y1={band.yLower} y2={band.yLower} />
        <g className="convergence-axis">
          <line x1={axisLeft} y1={y0} x2={PLOT_RIGHT} y2={y0} />
          <line x1={axisLeft} y1={PLOT_MARGIN.top} x2={axisLeft} y2={PLOT_BOTTOM} />
          {N_TICKS.map((t) => <g key={t}>
            <line x1={mnPlotX(t)} x2={mnPlotX(t)} y1={PLOT_BOTTOM} y2={PLOT_BOTTOM + 4} />
            <text x={mnPlotX(t)} y={PLOT_HEIGHT - 8} textAnchor="middle">{t}</text>
          </g>)}
          <text x={axisLeft - 7} y={y0 + 4} textAnchor="end">0</text>
          <text x={axisLeft - 7} y={band.yUpper + 4} textAnchor="end">{supFormat(epsilon)}</text>
        </g>
        {dots.map((dot) => <circle key={dot.n} className={`supremum-mn-dot${dot.m < epsilon ? " is-inside" : ""}${dot.n === n ? " is-current" : ""}`}
          cx={dot.x} cy={dot.y} r={dot.n === n ? 4.5 : 2.8} />)}
      </svg>
      <div className="convergence-legend" aria-label="מקרא" dir="rtl">
        <span className="convergence-key" data-kind="mn-out">נקודה מחוץ לרצועה</span>
        <span className="convergence-key" data-kind="mn-in">נקודה בתוך הרצועה</span>
        <span className="convergence-key" data-kind="band">רצועת אפסילון</span>
      </div>
      <div className="convergence-readout supremum-readout" aria-live="polite" dir="rtl" data-readout={readout.kind}>
        <MathInlineText text={readout.text} />
      </div>
    </figure>
  );
}
