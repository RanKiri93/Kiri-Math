"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { MAX_DISPLAY_N } from "../math/convergenceActivity";
import type { ConvergenceKind } from "../math/convergence";
import { MathText } from "./MathText";

export type Feedback = { status: "correct" | "wrong" | "revealed" | "neutral"; content: ReactNode } | null;
export type LessonProps = { onComplete: () => void };

export const CLASSIFICATIONS: { value: ConvergenceKind; label: string }[] = [
  { value: "uniform", label: "התכנסות במידה שווה (וגם נקודתית)" },
  { value: "pointwise", label: "התכנסות נקודתית בכל התחום, אך לא במידה שווה" },
  { value: "fails-pointwise", label: "אין התכנסות נקודתית בכל התחום" },
];

export function Choice<T extends string>({ label, options, value, onChange, compact = false }: {
  label: string; options: readonly { value: T; label: ReactNode }[]; value: T | ""; onChange: (value: T) => void;
  compact?: boolean;
}) {
  const name = useId();
  return <fieldset className="convergence-fieldset">
    <legend>{label}</legend>
    <div className={`convergence-choices${compact ? " is-compact" : ""}`}>
      {options.map((option) => <label key={option.value} className={`convergence-choice${value === option.value ? " is-selected" : ""}`}>
        <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
        <span>{option.label}</span>
      </label>)}
    </div>
  </fieldset>;
}

/**
 * A limit prediction written as an equation with an answer slot, e.g.
 *   lim_{n→∞} f_n(x₀) = [ ▢ ]
 * followed by the options as a centred row of chips (radio inputs).
 */
export function LimitPrediction<T extends string>({ label, lhs, options, value, onChange }: {
  label: string; lhs: string; options: readonly { value: T; label: ReactNode }[]; value: T | ""; onChange: (value: T) => void;
}) {
  const name = useId();
  const selected = options.find((option) => option.value === value);
  return <fieldset className="convergence-limit-prediction" aria-label={label}>
    <div className="convergence-limit-equation" dir="ltr">
      <MathText math={lhs} />
      <span className={`convergence-limit-slot${selected ? " is-filled" : ""}`} dir="auto" aria-hidden="true">{selected ? selected.label : "?"}</span>
    </div>
    <div className="convergence-limit-options">
      {options.map((option) => <label key={option.value} className={`convergence-choice${value === option.value ? " is-selected" : ""}`}>
        <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
        <span>{option.label}</span>
      </label>)}
    </div>
  </fieldset>;
}

/** Bare numeric input with the same draft/validation behaviour as `NumberControl`, for grids with their own labels. */
export function NumberField({ id, value, onChange, min, max, step = "any", disabled = false }: {
  id: string; value: number; onChange: (value: number) => void; min: number; max: number; step?: number | "any"; disabled?: boolean;
}) {
  const [draft, setDraft] = useState(String(value));
  const [previous, setPrevious] = useState(value);
  // Sync only external changes (e.g. clicking a graph or doubling n), retaining invalid drafts.
  if (previous !== value) {
    setPrevious(value);
    setDraft(String(value));
  }
  const accepts = (text: string) => {
    const next = Number(text);
    return text.trim() !== "" && Number.isFinite(next) && next >= min && next <= max && (step !== 1 || Number.isInteger(next));
  };
  const valid = accepts(draft);
  return <span className="convergence-number-field">
    <input id={id} type="number" className="convergence-number" dir="ltr" min={min} max={max} step={step} disabled={disabled}
      value={draft} aria-invalid={!valid} aria-describedby={!valid ? `${id}-error` : undefined}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        if (accepts(text)) { setPrevious(Number(text)); onChange(Number(text)); }
      }} onBlur={() => { if (!valid) setDraft(String(value)); }} />
    {!valid && <span id={`${id}-error`} className="convergence-warning" dir="rtl">הזינו {step === 1 ? "מספר שלם" : "מספר"} בין <MathText math={String(min)} /> ל־<MathText math={String(max)} />.</span>}
  </span>;
}

const roundSlider = (value: number) => Number(value.toPrecision(6));

/** A slider-panel row for the probe point. `sliderMin`/`sliderMax` narrow the slider (e.g. to the view window). */
export type SliderPoint = {
  value: number; onChange: (x: number) => void; min: number; max: number; sliderMin?: number; sliderMax?: number;
};

/**
 * Display controls laid out as a small formula (LTR, as sketched by the course staff):
 *   n  = [ ]  ——slider——  [double]   ┆  ε = [ ]
 *   x₀ = [ ]  ——slider——  [reset n]  ┆  ——slider——
 * The x₀ row is optional (omit it when the point is an answer input in the task card).
 * The ε block stays visible but faded and disabled until the lesson shows the band.
 */
export function SliderPanel({ n, onN, nMax = MAX_DISPLAY_N, point, epsilon, onEpsilon, epsilonEnabled, epsilonLockedHint, extra }: {
  n: number; onN: (n: number) => void;
  /** Largest index offered (default: the lab display limit). */
  nMax?: number;
  point?: SliderPoint;
  epsilon: number; onEpsilon: (epsilon: number) => void; epsilonEnabled: boolean;
  /** Tooltip while ε is disabled. */
  epsilonLockedHint?: string;
  /** Further display toggles (Hebrew), shown under the panel. */
  extra?: ReactNode;
}) {
  const id = useId();
  const sliderMin = point ? Math.max(point.min, point.sliderMin ?? point.min) : 0;
  const sliderMax = point ? Math.min(point.max, point.sliderMax ?? point.max) : 1;
  const pointStep = roundSlider((sliderMax - sliderMin) / 200);
  const reset = <button className="panel-action secondary convergence-slider-reset" type="button" dir="rtl" onClick={() => onN(1)} disabled={n === 1}>חזרה להתחלה</button>;
  return <div className="convergence-tool convergence-slider-panel" dir="ltr">
    <div className="convergence-slider-rows">
      <label className="convergence-slider-label" htmlFor={`${id}-n`}><MathText math="n=" /></label>
      <NumberField id={`${id}-n`} value={n} min={1} max={nMax} step={1} onChange={onN} />
      <input type="range" dir="ltr" aria-label="שינוי האינדקס בגרירה" min={1} max={nMax} step={1} value={n}
        onChange={(event) => onN(Number(event.target.value))} />
      <button className="panel-action" type="button" dir="rtl" onClick={() => onN(Math.min(nMax, n * 2))} disabled={n === nMax}>הכפלת האינדקס</button>
      {point && <>
        <label className="convergence-slider-label" htmlFor={`${id}-x`}><MathText math="x_0=" /></label>
        <NumberField id={`${id}-x`} value={point.value} min={point.min} max={point.max} onChange={point.onChange} />
        <input type="range" dir="ltr" aria-label="הזזת הנקודה הקבועה" min={sliderMin} max={sliderMax} step={pointStep} value={point.value}
          onChange={(event) => point.onChange(roundSlider(Number(event.target.value)))} />
      </>}
      {reset}
    </div>
    <span className="convergence-slider-divider" aria-hidden="true" />
    <fieldset className="convergence-slider-epsilon" disabled={!epsilonEnabled}
      title={epsilonEnabled ? undefined : epsilonLockedHint ?? "רוחב הרצועה ייפתח בהמשך"}>
      <div className="convergence-slider-epsilon-value">
        <label className="convergence-slider-label" htmlFor={`${id}-e`}><MathText math="\varepsilon=" /></label>
        <NumberField id={`${id}-e`} value={epsilon} min={0.01} max={0.5} step={0.01} onChange={onEpsilon} disabled={!epsilonEnabled} />
      </div>
      <input type="range" dir="ltr" aria-label="רוחב הרצועה" min={0.01} max={0.5} step={0.01} value={epsilon}
        onChange={(event) => onEpsilon(roundSlider(Number(event.target.value)))} />
    </fieldset>
    {extra && <div className="convergence-slider-extra" dir="rtl">{extra}</div>}
    {n === nMax && <p className="convergence-muted" dir="rtl">זהו גבול התצוגה, לא סוף הסדרה.</p>}
  </div>;
}

export function NumberControl({ label, value, onChange, min, max, step = "any" }: {
  label: ReactNode; value: number; onChange: (value: number) => void; min: number; max: number; step?: number | "any";
}) {
  const id = useId();
  return <div className="convergence-control">
    <label htmlFor={id}><span className="convergence-control-label">{label}</span></label>
    <NumberField id={id} value={value} min={min} max={max} step={step} onChange={onChange} />
  </div>;
}

export function Hints({ hints }: { hints: ReactNode[] }) {
  const [count, setCount] = useState(0);
  return <div className="convergence-hints">
    {count > 0 && <p>{hints[count - 1]}</p>}
    {count < hints.length && <button type="button" onClick={() => setCount(count + 1)}>{count ? "רמז נוסף" : "רמז"}</button>}
  </div>;
}

export function FeedbackBox({ feedback }: { feedback: Feedback }) {
  return <div aria-live="polite" aria-atomic="true">
    {feedback && <div className="convergence-feedback" data-status={feedback.status}>
      <strong>{feedback.status === "correct" ? "נכון. " : feedback.status === "revealed" ? "הסבר: " : ""}</strong>{feedback.content}
    </div>}
  </div>;
}

/**
 * The active step. In RTL the prompt (question and this step's answer inputs) sits on the
 * right and the response column (check, feedback, next step, hints) on its left, so the
 * student reads, answers, and checks in one horizontal sweep.
 */
export function TaskCard({ step, title, children, response }: {
  step: string; title: ReactNode; children?: ReactNode; response?: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [step]);
  return <section className="convergence-task">
    <div className="convergence-task-prompt">
      <span className="convergence-step-label">{step}</span>
      <h3 ref={heading} tabIndex={-1}>{title}</h3>
      {children}
    </div>
    {response && <div className="convergence-task-response">{response}</div>}
  </section>;
}

/**
 * Stacked lesson workspace: the task strip on top, then the viewing tools (index, band,
 * probe) that only change what is displayed, then the graphs. Controls that constitute an
 * answer belong in the task card, next to the check button, not in `tools`.
 */
export function LabWorkspace({ task, tools, plots }: { task: ReactNode; tools: ReactNode; plots: ReactNode }) {
  return <div className="convergence-workspace">
    <section className="convergence-task-strip" aria-label="המשימה הפעילה">{task}</section>
    <section className="convergence-toolbar" aria-label="כלי התצוגה">{tools}</section>
    <section className="convergence-canvas" aria-label="המחשת הסדרות">
      <div className="convergence-plots">{plots}</div>
    </section>
  </div>;
}

export function ExploreActions({ onGuided }: { onGuided: () => void }) {
  return <div className="convergence-actions">
    <button className="panel-action secondary" type="button" onClick={onGuided}>חזרה למשימה</button>
  </div>;
}
