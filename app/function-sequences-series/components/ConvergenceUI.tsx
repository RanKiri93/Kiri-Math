"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { MAX_DISPLAY_N } from "../math/convergenceActivity";
import type { ConvergenceKind } from "../math/convergence";
import { MathText } from "./MathText";

export type Feedback = { status: "correct" | "wrong" | "revealed" | "neutral"; content: ReactNode } | null;
export type LessonProps = { onComplete: () => void; onNext: () => void };

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

export function NumberControl({ label, value, onChange, min, max, step = "any" }: {
  label: ReactNode; value: number; onChange: (value: number) => void; min: number; max: number; step?: number | "any";
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [previous, setPrevious] = useState(value);
  // Sync only external changes (e.g. clicking a graph or doubling n), retaining invalid drafts.
  if (previous !== value) {
    setPrevious(value);
    setDraft(String(value));
  }
  const number = Number(draft);
  const valid = draft.trim() !== "" && Number.isFinite(number) && number >= min && number <= max
    && (step !== 1 || Number.isInteger(number));
  return <div className="convergence-control">
    <label htmlFor={id}>{label}</label>
    <input id={id} type="number" className="convergence-number" dir="ltr" min={min} max={max} step={step}
      value={draft} aria-invalid={!valid} aria-describedby={!valid ? `${id}-error` : undefined}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        const next = Number(text);
        if (text.trim() !== "" && Number.isFinite(next) && next >= min && next <= max && (step !== 1 || Number.isInteger(next))) {
          setPrevious(next);
          onChange(next);
        }
      }} onBlur={() => { if (!valid) setDraft(String(value)); }} />
    {!valid && <span id={`${id}-error`} className="convergence-warning">הזינו {step === 1 ? "מספר שלם" : "מספר"} בין <MathText math={String(min)} /> ל־<MathText math={String(max)} />.</span>}
  </div>;
}

export function IndexControl({ n, onChange }: { n: number; onChange: (n: number) => void }) {
  return <section className="panel-section">
    <NumberControl label={<>אינדקס <MathText math="n" /></>} value={n} min={1} max={MAX_DISPLAY_N} step={1} onChange={onChange} />
    <div className="convergence-actions">
      <button className="panel-action" type="button" onClick={() => onChange(Math.min(MAX_DISPLAY_N, n * 2))} disabled={n === MAX_DISPLAY_N}>הכפלת האינדקס</button>
      <button className="panel-action secondary" type="button" onClick={() => onChange(1)} disabled={n === 1}>חזרה להתחלה</button>
    </div>
    {n === MAX_DISPLAY_N && <p className="convergence-muted">זהו גבול התצוגה, לא סוף הסדרה.</p>}
  </section>;
}

export function EpsilonControl({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <div className="convergence-control">
    <label>רוחב הרצועה <MathText math="\varepsilon" />
      <select className="convergence-number" dir="ltr" value={value} onChange={(event) => onChange(Number(event.target.value))}>
        <option value={0.5}>0.5</option><option value={0.25}>0.25</option><option value={0.1}>0.1</option><option value={0.05}>0.05</option>
      </select>
    </label>
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

export function TaskCard({ step, title, children }: { step: string; title: ReactNode; children: ReactNode }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [step]);
  return <section className="convergence-task">
    <span className="convergence-step-label">{step}</span>
    <h3 ref={heading} tabIndex={-1}>{title}</h3>
    {children}
  </section>;
}

export function LabWorkspace({ controls, plots, task }: { controls: ReactNode; plots: ReactNode; task: ReactNode }) {
  return <div className="function-series-lab-grid">
    <aside className="analysis-panel" aria-label="המשימה הפעילה">{task}</aside>
    <aside className="control-panel" aria-label="בקרת החקירה">{controls}</aside>
    <section className="canvas-panel" aria-label="המחשת הסדרות">
      <div className="convergence-plots">{plots}</div>
      <div className="convergence-legend" aria-label="מקרא">
        <span className="convergence-key" data-kind="curve">איבר הסדרה</span>
        <span className="convergence-key" data-kind="limit">גבול (כשמוצג)</span>
        <span className="convergence-key" data-kind="probe">נקודת בדיקה</span>
      </div>
      <p className="convergence-muted">חלון התצוגה אינו התחום כולו. הגרף ממחיש; הנימוק מתייחס לכל הסדרה.</p>
    </section>
  </div>;
}

export function ExploreActions({ onNext, onGuided }: { onNext: () => void; onGuided: () => void }) {
  return <div className="convergence-actions">
    <button className="panel-action" type="button" onClick={onNext}>להמשך המסלול</button>
    <button className="panel-action secondary" type="button" onClick={onGuided}>חזרה למשימה</button>
  </div>;
}
