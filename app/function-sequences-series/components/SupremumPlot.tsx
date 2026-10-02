"use client";

import { useId, type MouseEvent } from "react";
import {
  PLOT_HEIGHT,
  PLOT_MARGIN,
  PLOT_WIDTH,
  pointerToPlotX,
  type PlotPoint,
  type PlotSegment,
  type PlotWindow,
} from "../math/sequencePlot";
import { inSupDomain, type SupExample } from "../math/supremumExamples";
import type { GraphFlags } from "../math/supremumArgument";
import {
  criticalPointOnCurve,
  formatSupNumber,
  maximumPoint,
  plotX,
  signStripIntervals,
  supPlotY,
  supVisibleCurve,
  tangentGeometry,
} from "../math/supremumPlot";
import { SUP_VIEWS } from "../math/supremumViews";
import { MathText } from "./MathText";

const PLOT_BOTTOM = PLOT_HEIGHT - PLOT_MARGIN.bottom;
const PLOT_RIGHT = PLOT_WIDTH - PLOT_MARGIN.right;

/** A short decimal for ticks and readouts. */
export function supFormat(value: number): string {
  return formatSupNumber(value);
}

function yTickValues(ex: SupExample): number[] {
  const [min, max] = ex.yRange;
  const step = max - min > 0.4 ? 0.2 : 0.1;
  const ticks: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(Number(v.toFixed(2)));
  return ticks.filter((v) => v >= min);
}

type Props = {
  example: SupExample;
  n: number;
  view: PlotWindow;
  flags: GraphFlags;
  /** The probe x_0; it should lie in the example's domain. */
  probeX: number;
  onProbeChange?: (x: number) => void;
  /** Index into SUP_VIEWS[example.id]; with `onViewChange` it renders the window chips. */
  viewIndex?: number;
  onViewChange?: (index: number) => void;
  title?: string;
};

/**
 * G1: the graph of f_n on the example's domain, with the probe, the tangent, the sign strip, the
 * maximum marker, the sup line and the limit line, each shown only when `flags` allows it.
 * The window changes what is drawn, never the mathematical domain. Everything is an LTR island.
 */
export function SupremumPlot({ example: ex, n, view, flags, probeX, onProbeChange, viewIndex, onViewChange, title }: Props) {
  const uid = useId().replace(/:/g, "");
  const descId = `supremum-plot-desc-${uid}`;
  const clipId = `supremum-clip-${uid}`;
  const px = (x: number) => plotX(x, view);
  const py = (y: number) => supPlotY(ex, y);
  const pathFor = (points: PlotSegment) => points.map((p, i) => `${i === 0 ? "M" : "L"}${px(p.x)},${py(p.y)}`).join(" ");
  const inView = (x: number) => x >= view.left && x <= view.right;

  const probeInDomain = inSupDomain(ex, probeX);
  const probeVisible = probeInDomain && inView(probeX);
  const probeY = probeInDomain ? ex.value(n, probeX) : 0;
  const curves = supVisibleCurve(ex, n, view);
  const tangent = flags.tangent && probeInDomain ? tangentGeometry(ex, n, probeX, view) : null;
  const strip = flags.signStrip ? signStripIntervals(ex, n, view) : [];

  // Domain shading: only when a finite endpoint lies inside the window.
  const domainLeft = Math.max(view.left, ex.domain.left);
  const domainRight = Math.min(view.right, ex.domain.right);
  const clipsDomain = domainLeft > view.left || domainRight < view.right;
  const endpoints = [ex.domain.left, ex.domain.right].filter((x) => Number.isFinite(x) && inView(x));

  const maxPoint: (PlotPoint & { faded: boolean }) | null = (() => {
    if (flags.maxMarker === "origin") return inSupDomain(ex, 0) ? { x: 0, y: ex.value(n, 0), faded: false } : null;
    if (flags.maxMarker === "critical") {
      const c = criticalPointOnCurve(ex, n);
      return { x: c.x, y: c.y, faded: !c.interior };
    }
    if (flags.maxMarker === "argmax") return { ...maximumPoint(ex, n), faded: false };
    return null;
  })();
  const supY = ex.supValue(n);

  const handlePointer = (event: MouseEvent<SVGSVGElement>): void => {
    if (!onProbeChange) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const left = bounds.left + bounds.width * PLOT_MARGIN.left / PLOT_WIDTH;
    const width = bounds.width * (PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right) / PLOT_WIDTH;
    const top = bounds.top + bounds.height * PLOT_MARGIN.top / PLOT_HEIGHT;
    const bottom = bounds.bottom - bounds.height * PLOT_MARGIN.bottom / PLOT_HEIGHT;
    if (event.clientX < left || event.clientX > left + width || event.clientY < top || event.clientY > bottom) return;
    const x = pointerToPlotX(event.clientX, { left, width }, view);
    if (Number.isFinite(x) && inSupDomain(ex, x)) onProbeChange(Number(x.toPrecision(6)));
  };

  const xTicks = [view.left, (view.left + view.right) / 2, view.right];
  const axisX = px(Math.max(view.left, Math.min(0, view.right)));
  const views = SUP_VIEWS[ex.id];

  return (
    <figure className="convergence-plot supremum-plot" dir="ltr">
      <figcaption className="convergence-plot-caption" dir="rtl">
        <span className="convergence-plot-title">{title ?? "גרף הפונקציה"}</span>
        <span className="convergence-plot-meta">הפונקציה: <MathText math={ex.fnLatex} /></span>
        <span className="convergence-plot-meta">התחום: <MathText math={ex.domainLatex} /></span>
        <span className="convergence-plot-meta">האינדקס: <MathText math={`n=${n}`} /></span>
      </figcaption>

      {onViewChange && <div className="convergence-plot-controls supremum-view-controls" dir="rtl">
        <span className="supremum-view-label" id={`${descId}-views`}>חלון התצוגה בלבד:</span>
        <div className="supremum-view-chips" role="group" aria-labelledby={`${descId}-views`}>
          {views.map((v, index) => <button key={index} type="button" className={`supremum-view-chip${viewIndex === index ? " is-selected" : ""}`}
            aria-pressed={viewIndex === index} onClick={() => onViewChange(index)}>
            <MathText math={`[${supFormat(v.left)},${supFormat(v.right)}]`} />
          </button>)}
        </div>
      </div>}

      <svg className="convergence-svg supremum-svg" viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`} {...{ dir: "ltr" }}
        role="img" aria-label={title ?? `גרף הפונקציה f_${n}`} aria-describedby={descId} onClick={handlePointer}>
        <desc id={descId}>
          גרף של f עבור n שווה {n} על התחום, עם נקודת בדיקה{flags.tangent ? ", משיק" : ""}{flags.supLine ? " וקו הסופרמום" : ""}.
          לחיצה בתוך התחום בוחרת נקודת בדיקה.
        </desc>
        <defs>
          <clipPath id={clipId}>
            <rect x={PLOT_MARGIN.left} y={PLOT_MARGIN.top} width={PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right} height={PLOT_HEIGHT - PLOT_MARGIN.top - PLOT_MARGIN.bottom} />
          </clipPath>
        </defs>

        {clipsDomain && domainLeft <= domainRight && (
          <rect className="supremum-domain-shade" x={px(domainLeft)} y={PLOT_MARGIN.top} width={Math.max(0, px(domainRight) - px(domainLeft))} height={PLOT_BOTTOM - PLOT_MARGIN.top} />
        )}

        <g className="convergence-axis">
          <line x1={PLOT_MARGIN.left} y1={py(0)} x2={PLOT_RIGHT} y2={py(0)} />
          <line x1={axisX} y1={PLOT_MARGIN.top} x2={axisX} y2={PLOT_BOTTOM} />
          {xTicks.map((x, index) => <g key={`xt-${index}`}>
            <line x1={px(x)} x2={px(x)} y1={PLOT_BOTTOM} y2={PLOT_BOTTOM + 4} />
            <text x={px(x)} y={PLOT_HEIGHT - 8} textAnchor="middle">{supFormat(x)}</text>
          </g>)}
          {yTickValues(ex).map((y) => <g key={`yt-${y}`}>
            <line x1={axisX - 3} x2={axisX + 3} y1={py(y)} y2={py(y)} />
            <text x={PLOT_MARGIN.left - 7} y={py(y) + 4} textAnchor="end">{supFormat(y)}</text>
          </g>)}
        </g>

        <g clipPath={`url(#${clipId})`}>
          {endpoints.filter((x) => x > view.left && x < view.right).map((x) => (
            <line key={`b-${x}`} className="convergence-domain-boundary" x1={px(x)} x2={px(x)} y1={PLOT_MARGIN.top} y2={PLOT_BOTTOM} />
          ))}
          {flags.fadedOutsideDomain && curves.context.map((seg, i) => <path key={`c-${i}`} className="convergence-curve convergence-context-curve" d={pathFor(seg)} />)}
          {flags.limitLine && domainLeft <= domainRight && (
            <line className="convergence-limit supremum-limit-line" x1={px(domainLeft)} x2={px(domainRight)} y1={py(0)} y2={py(0)} />
          )}
          {flags.supLine && (
            <line className="supremum-sup-line" x1={PLOT_MARGIN.left} x2={PLOT_RIGHT} y1={py(supY)} y2={py(supY)} />
          )}
          {curves.main.map((seg, i) => <path key={`m-${i}`} className="convergence-curve" d={pathFor(seg)} />)}
          {tangent && tangent.segments.map((seg, i) => <path key={`t-${i}`} className="supremum-tangent" d={pathFor(seg)} />)}
          {endpoints.map((x) => inSupDomain(ex, x)
            ? <circle key={`e-${x}`} className="convergence-endpoint-closed" cx={px(x)} cy={py(ex.value(n, x))} r="4" />
            : <circle key={`e-${x}`} className="convergence-endpoint-open" cx={px(x)} cy={py(ex.value(n, x))} r="4" />)}
          {probeVisible && <>
            <line className="convergence-probe-line" x1={px(probeX)} x2={px(probeX)} y1={py(0)} y2={py(probeY)} />
            <circle className="convergence-probe" cx={px(probeX)} cy={py(probeY)} r="5" />
          </>}
          {maxPoint && inView(maxPoint.x) && (
            <circle className={`supremum-max-marker${maxPoint.faded ? " is-faded" : ""}`} data-marker={flags.maxMarker}
              cx={px(maxPoint.x)} cy={py(maxPoint.y)} r="6" />
          )}
        </g>

        {flags.supLine && (
          <text className="supremum-sup-label" x={PLOT_RIGHT - 4} y={py(supY) - 5} textAnchor="end">M<tspan className="supremum-sup-label-index" dy="3">n</tspan></text>
        )}

        {strip.length > 0 && <g className="supremum-sign-strip">
          {strip.map((interval, i) => {
            const x1 = px(interval.left);
            const x2 = px(interval.right);
            const top = py(0) + 4;
            const height = Math.max(6, PLOT_BOTTOM - top);
            return <g key={`s-${i}`}>
              <rect className={`supremum-sign-cell ${interval.sign > 0 ? "is-plus" : interval.sign < 0 ? "is-minus" : "is-zero"}`}
                x={x1} y={top} width={Math.max(0, x2 - x1)} height={height} />
              {x2 - x1 >= 16 && interval.sign !== 0 && (
                <text className="supremum-sign-text" x={(x1 + x2) / 2} y={top + height / 2 + 4} textAnchor="middle">{interval.sign > 0 ? "+" : "−"}</text>
              )}
            </g>;
          })}
        </g>}
      </svg>

      <div className="convergence-legend" aria-label="מקרא" dir="rtl">
        <span className="convergence-key" data-kind="curve">הגרף בתחום</span>
        {flags.fadedOutsideDomain && <span className="convergence-key" data-kind="context">מחוץ לתחום (להקשר בלבד)</span>}
        {flags.limitLine && <span className="convergence-key" data-kind="limit">פונקציית הגבול</span>}
        <span className="convergence-key" data-kind="probe">נקודת בדיקה</span>
        {flags.tangent && <span className="convergence-key" data-kind="tangent">משיק</span>}
        {flags.signStrip && <span className="convergence-key" data-kind="sign">סימן הנגזרת</span>}
        {flags.maxMarker !== "none" && <span className="convergence-key" data-kind="max">{flags.maxMarker === "argmax" ? "המקסימום" : "נקודה חשודה לקיצון"}</span>}
        {flags.supLine && <span className="convergence-key" data-kind="sup">הסופרמום</span>}
      </div>
    </figure>
  );
}
