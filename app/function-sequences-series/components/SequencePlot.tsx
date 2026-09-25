"use client";

import { useId, type MouseEvent } from "react";
import {
  inInterval,
  intervalLatex,
  pointwiseLimit,
  sequenceLatex,
  sequenceValue,
  type Interval,
  type SequenceId,
} from "../math/convergence";
import {
  epsilonPlotSegments,
  approximationLatex,
  clipPlotSegments,
  limitPlotSegments,
  oscillationResolutionExceeded,
  plotX,
  plotY,
  pointerToPlotX,
  PLOT_HEIGHT,
  PLOT_MARGIN,
  PLOT_WIDTH,
  sequencePlotSegments,
  type PlotWindow,
} from "../math/sequencePlot";
import { MathText } from "./MathText";

export type { PlotWindow };

type Props = {
  id: SequenceId;
  n: number;
  domain: Interval;
  view: PlotWindow;
  epsilon: number | null;
  showLimit: boolean;
  probeX: number | null;
  onProbeChange?: (x: number) => void;
  probeLabel?: string;
  envelope?: boolean;
  title?: string;
  /** Show x^n outside its selected domain as visual context only. */
  powerContext?: boolean;
};

const formatApprox = (value: number): string => {
  if (!Number.isFinite(value)) return value < 0 ? "-\\infty" : "\\infty";
  return Number.isInteger(value) ? String(value) : Number(value.toPrecision(4)).toString();
};

const PLOT_Y_MAX = 1.2;

function sequenceSymbol(id: SequenceId): string {
  if (id === "far") return "g";
  return "f";
}

export function SequencePlot({
  id,
  n,
  domain,
  view,
  epsilon,
  showLimit,
  probeX,
  onProbeChange,
  probeLabel,
  envelope = false,
  title,
  powerContext = false,
}: Props) {
  const generatedId = useId().replace(/:/g, "");
  const descId = `convergence-plot-desc-${generatedId}`;
  const clipId = `convergence-clip-${generatedId}`;
  const domainLeft = Math.max(view.left, domain.left);
  const domainRight = Math.min(view.right, domain.right);
  const inDomain = probeX !== null && inInterval(probeX, domain);
  const inView = probeX !== null && probeX >= view.left && probeX <= view.right;
  const valueAtProbe = inDomain && probeX !== null ? sequenceValue(id, n, probeX) : null;
  const limitAtProbe = inDomain && probeX !== null ? pointwiseLimit(id, probeX) : null;
  const errorAtProbe = valueAtProbe !== null && limitAtProbe !== null
    ? Math.abs(valueAtProbe - limitAtProbe)
    : null;
  const symbol = sequenceSymbol(id);
  const resolutionWarning = oscillationResolutionExceeded(id, n, view);
  const sequenceSegments = sequencePlotSegments(id, n, domain, view);
  // Context is display-only: the selected interval still governs limits and probes.
  const contextSegments = powerContext && id === "power"
    ? [[view.left, Math.min(view.right, domain.left)], [Math.max(view.left, domain.right), view.right]]
      .filter(([left, right]) => left < right)
      .flatMap(([left, right]) => sequencePlotSegments(id, n, { left, right, leftClosed: true, rightClosed: true }, view))
    : [];
  const limitSegments = showLimit ? limitPlotSegments(id, domain, view) : [];
  const epsilonSegments = showLimit && epsilon !== null
    ? epsilonPlotSegments(id, domain, view, epsilon)
    : [];

  const pathFor = (points: { x: number; y: number }[]): string => points
    .map((point, index) => `${index === 0 ? "M" : "L"}${plotX(point.x, view)},${plotY(point.y)}`)
    .join(" ");

  const handlePointer = (event: MouseEvent<SVGSVGElement>): void => {
    if (!onProbeChange) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const plotLeft = bounds.left + bounds.width * PLOT_MARGIN.left / PLOT_WIDTH;
    const plotWidth = bounds.width * (PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right) / PLOT_WIDTH;
    const plotTop = bounds.top + bounds.height * PLOT_MARGIN.top / PLOT_HEIGHT;
    const plotBottom = bounds.bottom - bounds.height * PLOT_MARGIN.bottom / PLOT_HEIGHT;
    if (event.clientX < plotLeft || event.clientX > plotLeft + plotWidth || event.clientY < plotTop || event.clientY > plotBottom) return;
    const x = pointerToPlotX(event.clientX, { left: plotLeft, width: plotWidth }, view);
    if (Number.isFinite(x) && inInterval(x, domain)) onProbeChange(x);
  };

  const xTicks = [view.left, (view.left + view.right) / 2, view.right];
  const yTicks = [-1, -0.5, 0, 0.5, 1];
  return (
    <figure className="convergence-plot">
      <figcaption className="convergence-plot-caption">
        {title && <span className="convergence-plot-title">{title}</span>}
        <span className="convergence-plot-meta">
          הסדרה: <MathText math={`${symbol}_n(x)=${sequenceLatex(id)}`} />
        </span>
        <span className="convergence-plot-meta">
          התחום: <MathText math={intervalLatex(domain)} />
        </span>
        <span className="convergence-plot-meta">
          חלון התצוגה: <MathText math={`[${formatApprox(view.left)},${formatApprox(view.right)}]`} />
        </span>
      </figcaption>

      <svg
        className="convergence-svg"
        viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
        {...{ dir: "ltr" }}
        role="img"
        aria-label={title ?? `גרף הסדרה ${symbol}_${n}(x)`}
        aria-describedby={descId}
        onClick={handlePointer}
      >
        <desc id={descId}>
          גרף של {symbol} עבור n שווה {n}{showLimit ? ", יחד עם הגבול הנקודתי במקום שבו הוא קיים" : ""}.
          לחיצה בתוך התחום ובאזור הגרף בוחרת נקודת בדיקה.
        </desc>
        <defs>
          <clipPath id={clipId}>
            <rect
              x={PLOT_MARGIN.left}
              y={PLOT_MARGIN.top}
              width={PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right}
              height={PLOT_HEIGHT - PLOT_MARGIN.top - PLOT_MARGIN.bottom}
            />
          </clipPath>
        </defs>

        <g className="convergence-axis">
          <line x1={PLOT_MARGIN.left} y1={plotY(0)} x2={PLOT_WIDTH - PLOT_MARGIN.right} y2={plotY(0)} />
          <line
            x1={plotX(Math.max(view.left, Math.min(0, view.right)), view)}
            y1={PLOT_MARGIN.top}
            x2={plotX(Math.max(view.left, Math.min(0, view.right)), view)}
            y2={PLOT_HEIGHT - PLOT_MARGIN.bottom}
          />
          {xTicks.map((x, index) => (
            <g key={`xtick-${index}`}>
              <line x1={plotX(x, view)} x2={plotX(x, view)} y1={plotY(0) - 3} y2={plotY(0) + 3} />
              <text x={plotX(x, view)} y={PLOT_HEIGHT - 8} textAnchor="middle">{formatApprox(x)}</text>
            </g>
          ))}
          {yTicks.map((y) => (
            <g key={`ytick-${y}`}>
              <line x1={plotX(Math.max(view.left, Math.min(0, view.right)), view) - 3} x2={plotX(Math.max(view.left, Math.min(0, view.right)), view) + 3} y1={plotY(y)} y2={plotY(y)} />
              <text x={PLOT_MARGIN.left - 7} y={plotY(y) + 4} textAnchor="end">{formatApprox(y)}</text>
            </g>
          ))}
        </g>

        <g clipPath={`url(#${clipId})`}>
          {clipPlotSegments(contextSegments).map((segment, index) => <path key={`context-${index}`} className="convergence-curve convergence-context-curve" d={pathFor(segment)} />)}
          {powerContext && id === "power" && [domain.left, domain.right].filter((x) => x > view.left && x < view.right).map((x) => <line key={`boundary-${x}`} className="convergence-domain-boundary" x1={plotX(x, view)} x2={plotX(x, view)} y1={PLOT_MARGIN.top} y2={PLOT_HEIGHT - PLOT_MARGIN.bottom} />)}
           {epsilonSegments.map((segment, index) => segment.length === 2 ? (
             <path key={`band-${index}`} className="convergence-band-edge" d={pathFor(segment)} />
           ) : (
             <g key={`band-${index}`}>
               <polygon className="convergence-band" points={segment.map((p) => `${plotX(p.x, view)},${plotY(p.y)}`).join(" ")} />
               <path className="convergence-band-edge" d={pathFor(segment.slice(0, 2))} />
               <path className="convergence-band-edge" d={pathFor(segment.slice(2))} />
             </g>
           ))}
          {(envelope || resolutionWarning) && (id === "oscillation" || id === "shifted-oscillation") && (
            <>
              <line className="convergence-envelope" x1={plotX(domainLeft, view)} x2={plotX(domainRight, view)} y1={plotY((id === "shifted-oscillation" ? domainLeft : 0) + 1 / n)} y2={plotY((id === "shifted-oscillation" ? domainRight : 0) + 1 / n)} />
              <line className="convergence-envelope" x1={plotX(domainLeft, view)} x2={plotX(domainRight, view)} y1={plotY((id === "shifted-oscillation" ? domainLeft : 0) - 1 / n)} y2={plotY((id === "shifted-oscillation" ? domainRight : 0) - 1 / n)} />
            </>
          )}
          {clipPlotSegments(limitSegments).map((segment, index) => (
            <path key={`limit-${index}`} className="convergence-curve convergence-limit" d={pathFor(segment)} />
          ))}
          {!resolutionWarning && clipPlotSegments(sequenceSegments).map((segment, index) => (
            <path key={`sequence-${index}`} className="convergence-curve" d={pathFor(segment)} />
          ))}
          {showLimit && id === "power" && domain.left <= 1 && domain.right >= 1 && view.left <= 1 && view.right >= 1 && (
            <>
              {domain.left < 1 && <circle className="convergence-endpoint-open convergence-limit-point" cx={plotX(1, view)} cy={plotY(0)} r="4" />}
              {inInterval(1, domain)
                ? <circle className="convergence-endpoint-closed convergence-limit-point" cx={plotX(1, view)} cy={plotY(1)} r="4" />
                : domain.right === 1 && <circle className="convergence-endpoint-open" cx={plotX(1, view)} cy={plotY(1)} r="4" />}
            </>
          )}
          {!resolutionWarning && !domain.leftClosed && Number.isFinite(domain.left) && domain.left >= view.left && domain.left <= view.right && (
            <circle className="convergence-endpoint-open" cx={plotX(domain.left, view)} cy={plotY(sequenceValue(id, n, domain.left))} r="4" />
          )}
          {!resolutionWarning && !domain.rightClosed && Number.isFinite(domain.right) && domain.right >= view.left && domain.right <= view.right && (
            <circle className="convergence-endpoint-open" cx={plotX(domain.right, view)} cy={plotY(sequenceValue(id, n, domain.right))} r="4" />
          )}
          {showLimit && !domain.leftClosed && Number.isFinite(domain.left) && domain.left >= view.left && domain.left <= view.right && pointwiseLimit(id, domain.left) !== null && (
            <circle className="convergence-endpoint-open convergence-limit-point" cx={plotX(domain.left, view)} cy={plotY(pointwiseLimit(id, domain.left)!)} r="4" />
          )}
          {showLimit && !(id === "power" && domain.right === 1) && !domain.rightClosed && Number.isFinite(domain.right) && domain.right >= view.left && domain.right <= view.right && pointwiseLimit(id, domain.right) !== null && (
            <circle className="convergence-endpoint-open convergence-limit-point" cx={plotX(domain.right, view)} cy={plotY(pointwiseLimit(id, domain.right)!)} r="4" />
          )}
          {probeX !== null && inDomain && inView && valueAtProbe !== null && Math.abs(valueAtProbe) <= PLOT_Y_MAX && (
            <circle className="convergence-probe" cx={plotX(probeX, view)} cy={plotY(valueAtProbe ?? 0)} r="5" />
          )}
        </g>
      </svg>

      <div className="convergence-legend" aria-label="מקרא">
        <span className="convergence-key" data-kind="curve">איבר הסדרה</span>
        {powerContext && id === "power" && <span className="convergence-key" data-kind="context">מחוץ לתחום הנבדק</span>}
        {showLimit && <span className="convergence-key" data-kind="limit">פונקציית הגבול</span>}
        {showLimit && epsilon !== null && <span className="convergence-key" data-kind="band">רצועת אפסילון</span>}
        {probeX !== null && <span className="convergence-key" data-kind="probe">נקודת בדיקה</span>}
      </div>


      {resolutionWarning && (
        <p className="convergence-warning">התנודות צפופות מדי להצגת מסלול אמין; מוצגת מעטפת התנודות.</p>
      )}

      {probeX !== null && (
        <div className="convergence-readout" aria-live="polite">
          <strong>{probeLabel ?? "נקודת בדיקה"}: <MathText math={`x${approximationLatex(probeX)}`} /></strong>
          {!inDomain ? <span>הנקודה מחוץ לתחום</span> : <>
              {!inView && <span>הנקודה מחוץ לחלון התצוגה</span>}
              {inView && valueAtProbe !== null && Math.abs(valueAtProbe) > PLOT_Y_MAX && <span>ערך הנקודה מחוץ לטווח האנכי</span>}
              <span className="convergence-readout-values" dir="ltr">
                <MathText math={`${symbol}_{${n}}(${formatApprox(probeX)})${approximationLatex(valueAtProbe!)}`} />
                {showLimit && limitAtProbe !== null && <>
                  ; <MathText math={`${symbol}(${formatApprox(probeX)})${approximationLatex(limitAtProbe)}`} />
                  ; <MathText math={`|${symbol}_{${n}}-${symbol}|${approximationLatex(errorAtProbe!)}`} />
                </>}
                {showLimit && limitAtProbe === null && <>; אין גבול סופי בנקודה</>}
              </span>
            </>}
        </div>
      )}
    </figure>
  );
}
