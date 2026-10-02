"use client";

import { useId } from "react";
import { PLOT_HEIGHT, PLOT_MARGIN, PLOT_WIDTH } from "../math/sequencePlot";
import type { DerExample, DerGraphFlags } from "../math/derivativeExamples";
import { MathText } from "./MathText";

const PLOT_BOTTOM = PLOT_HEIGHT - PLOT_MARGIN.bottom;
const PLOT_RIGHT = PLOT_WIDTH - PLOT_MARGIN.right;
const INNER_WIDTH = PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right;
const INNER_HEIGHT = PLOT_HEIGHT - PLOT_MARGIN.top - PLOT_MARGIN.bottom;
/** Dense enough for the steep rise of x^(n-1)/(1+x^(2n)) near x = 1 at n = 40. */
const SAMPLES = 480;

type Point = { x: number; y: number };
type View = DerExample["view"];

/** Samples of a function of x over [0,1]; the last sample is exactly x = 1 (the example rejects x > 1). */
export function derivativeSamples(f: (x: number) => number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= SAMPLES; i += 1) {
    const x = i === SAMPLES ? 1 : i / SAMPLES;
    points.push({ x, y: f(x) });
  }
  return points;
}

/** y ticks (zero excluded) that fit the window. */
function yTicksOf(view: View): number[] {
  const range = view.yMax - view.yMin;
  const step = range > 3 ? 1 : range > 1.2 ? 0.5 : 0.2;
  const first = Math.ceil(view.yMin / step - 1e-9);
  const last = Math.floor(view.yMax / step + 1e-9);
  const ticks: number[] = [];
  for (let i = first; i <= last; i += 1) if (i !== 0) ticks.push(Number((i * step).toFixed(2)));
  return ticks;
}

type PanelProps = {
  view: View;
  clipId: string;
  descId: string;
  svgClass: string;
  label: string;
  desc: string;
  curve: Point[];
  /** Limit function of the panel, drawn only when `showLimit`. */
  limit: ((x: number) => number) | null;
  showLimit: boolean;
  showBand: boolean;
  epsilon: number;
  /** Part-name prefix: "" for the f panel, "deriv-" for the f' panel. */
  prefix: string;
};

function Panel({ view, clipId, descId, svgClass, label, desc, curve, limit, showLimit, showBand, epsilon, prefix }: PanelProps) {
  const px = (x: number) => PLOT_MARGIN.left + ((x - view.xMin) / (view.xMax - view.xMin)) * INNER_WIDTH;
  const py = (y: number) => PLOT_MARGIN.top + ((view.yMax - y) / (view.yMax - view.yMin)) * INNER_HEIGHT;
  const fmt = (v: number) => v.toFixed(2);
  const path = curve.map((p, i) => `${i === 0 ? "M" : "L"}${fmt(px(p.x))},${fmt(py(p.y))}`).join(" ");

  const bandOn = showBand && limit !== null && Number.isFinite(epsilon) && epsilon > 0;
  const inside = limit ? limit(0.5) : 0; // the value of the limit on [0,1)
  const atOne = limit ? limit(1) : 0;
  const jumpAtOne = limit !== null && atOne !== inside;

  // The true peak of the curve when it leaves the window (D3, f_n = n): a marker at the top edge.
  let peak: Point | null = null;
  for (const p of curve) {
    if (p.y > view.yMax && (!peak || p.y > peak.y || (p.y === peak.y && Math.abs(p.x - 0.5) < Math.abs(peak.x - 0.5)))) peak = p;
  }
  const markerX = peak ? px(Math.max(0.05, Math.min(0.95, peak.x))) : 0;

  return (
    <svg className={`convergence-svg ${svgClass}`} viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`} {...{ dir: "ltr" }}
      role="img" aria-label={label} aria-describedby={descId}>
      <desc id={descId}>{desc}</desc>
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
        {yTicksOf(view).map((y) => <g key={`yt-${y}`}>
          <line x1={px(0) - 3} x2={px(0) + 3} y1={py(y)} y2={py(y)} />
          <text x={PLOT_MARGIN.left - 7} y={py(y) + 4} textAnchor="end">{y}</text>
        </g>)}
      </g>

      <g clipPath={`url(#${clipId})`}>
        {bandOn && (
          <rect className="convergence-band derivative-band" data-part={`${prefix}band`}
            x={px(0)} y={py(inside + epsilon)} width={px(1) - px(0)} height={Math.max(0, py(inside - epsilon) - py(inside + epsilon))} />
        )}
        {bandOn && jumpAtOne && (
          <line className="convergence-band-edge derivative-band-point" data-part={`${prefix}band`}
            x1={px(1)} x2={px(1)} y1={py(atOne - epsilon)} y2={py(atOne + epsilon)} />
        )}
        {showLimit && limit !== null && (
          <line className="convergence-limit derivative-limit" data-part={`${prefix}limit`}
            x1={px(0)} x2={px(1)} y1={py(inside)} y2={py(inside)} />
        )}
        <path className="convergence-curve derivative-curve" data-part={`${prefix}curve`} d={path} />
        {showLimit && jumpAtOne && (
          <>
            <circle className="convergence-limit-point derivative-limit-open" data-part={`${prefix}limit-open`} cx={px(1)} cy={py(inside)} r="4" />
            <circle className="convergence-limit-point convergence-endpoint-closed" data-part={`${prefix}limit-point`}
              cx={px(1)} cy={py(atOne)} r="4" />
          </>
        )}
      </g>

      {peak && (
        <g className="derivative-peak" data-part={`${prefix}peak`}>
          <polygon className="derivative-peak-marker"
            points={`${markerX - 5},${PLOT_MARGIN.top + 9} ${markerX + 5},${PLOT_MARGIN.top + 9} ${markerX},${PLOT_MARGIN.top + 1}`} />
          <text className="derivative-peak-label" x={markerX + 9} y={PLOT_MARGIN.top + 10} textAnchor="start">{Number(peak.y.toFixed(2))}</text>
        </g>
      )}
    </svg>
  );
}

type Props = {
  example: DerExample;
  n: number;
  flags: DerGraphFlags;
  epsilon: number;
};

/**
 * The graphs of the limit-and-derivative activity: f_n with its limit f and epsilon-band, and, when
 * `flags.derivative`, a second panel with f_n', its limit g (D2: with the jump at x = 1) and a band.
 * LTR islands with no numeric readout.
 */
export function DerivativePlot({ example: ex, n, flags, epsilon }: Props) {
  const uid = useId().replace(/:/g, "");
  const curve = derivativeSamples((x) => ex.value(n, x));
  const hasLimit = ex.limit !== null;
  const g = (x: number) => ex.derivativeLimit(x);
  const jumpG = g(1) !== g(0.5);

  let primeCurve: Point[] = [];
  if (flags.derivative) primeCurve = derivativeSamples((x) => ex.derivative(n, x));
  // A peak marker also applies to f_n (D3 only); it never applies to the derivative panels in these examples.
  const clipped = Math.max(...curve.map((p) => p.y)) > ex.view.yMax;

  return (
    <>
      <figure className="convergence-plot derivative-plot" dir="ltr">
        <figcaption className="convergence-plot-caption" dir="rtl">
          <span className="convergence-plot-title">גרף הפונקציה</span>
          <span className="convergence-plot-meta">הפונקציה: <MathText math={ex.fnLatex} /></span>
          <span className="convergence-plot-meta">התחום: <MathText math={ex.domainLatex} /></span>
          <span className="convergence-plot-meta">האינדקס: <MathText math={`n=${n}`} /></span>
        </figcaption>

        <Panel view={ex.view} clipId={`derivative-clip-${uid}`} descId={`derivative-desc-${uid}`} svgClass="derivative-svg"
          label={`גרף הפונקציה f_${n}`}
          desc={`גרף של f עבור n שווה ${n}${flags.limit && hasLimit ? ", עם פונקציית הגבול" : ""}${flags.band && hasLimit ? " ורצועת ε סביבה" : ""}.`}
          curve={curve} limit={ex.limit} showLimit={flags.limit} showBand={flags.band} epsilon={epsilon} prefix="" />

        <div className="convergence-legend derivative-legend" aria-label="מקרא" dir="rtl">
          <span className="convergence-key" data-kind="curve">הגרף של <MathText math={`f_{${n}}`} /></span>
          {flags.limit && hasLimit && <span className="convergence-key" data-kind="limit">פונקציית הגבול <MathText math="f" /></span>}
          {flags.band && hasLimit && <span className="convergence-key" data-kind="band">רצועה סביב <MathText math="f" /> ברוחב <MathText math="\varepsilon" /></span>}
          {clipped && <span className="convergence-key" data-kind="peak">ערך הגרף מחוץ לחלון</span>}
        </div>
      </figure>

      {flags.derivative && (
        <figure className="convergence-plot derivative-plot derivative-prime-plot" dir="ltr">
          <figcaption className="convergence-plot-caption" dir="rtl">
            <span className="convergence-plot-title">גרף הנגזרת</span>
            <span className="convergence-plot-meta">הנגזרת: <MathText math={ex.derivativeLatex} /></span>
            <span className="convergence-plot-meta">האינדקס: <MathText math={`n=${n}`} /></span>
          </figcaption>

          <Panel view={ex.derivativeView} clipId={`derivative-prime-clip-${uid}`} descId={`derivative-prime-desc-${uid}`}
            svgClass="derivative-svg derivative-prime-svg"
            label={`גרף הנגזרת f_${n}'`}
            desc={`גרף של הנגזרת עבור n שווה ${n}${flags.derivLimit ? ", עם פונקציית הגבול של הנגזרות" : ""}${flags.derivBand ? " ורצועת ε סביבה" : ""}.`}
            curve={primeCurve} limit={g} showLimit={flags.derivLimit} showBand={flags.derivBand} epsilon={epsilon} prefix="deriv-" />

          <div className="convergence-legend derivative-legend" aria-label="מקרא" dir="rtl">
            <span className="convergence-key" data-kind="curve">הגרף של <MathText math={`f_{${n}}'`} /></span>
            {flags.derivLimit && <span className="convergence-key" data-kind="limit">פונקציית הגבול <MathText math="g" /></span>}
            {flags.derivBand && <span className="convergence-key" data-kind="band">רצועה סביב <MathText math="g" /> ברוחב <MathText math="\varepsilon" /></span>}
            {flags.derivLimit && jumpG && <span className="convergence-key" data-kind="closed-dot">נקודה מלאה: הערך נלקח</span>}
            {flags.derivLimit && jumpG && <span className="convergence-key" data-kind="open-dot">נקודה ריקה: הערך אינו נלקח</span>}
          </div>
        </figure>
      )}
    </>
  );
}
