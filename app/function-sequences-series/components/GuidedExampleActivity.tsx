"use client";

import { useId, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { checkStep, revealAnswers, type GuidedStep, type PartAnswer, type StepAnswers, type StepPart } from "../math/guidedSteps";
import { areStepsDone, canOpenGuidedView, finishedExamples, type GuidedView, type ProgressOptions, type StepsDone } from "../math/guidedProgress";
import type { Token, TokenId } from "../math/supremumTypes";
import { StageNavigator, StagePaging, type Stage, type StageCopy } from "./ConvergenceNavigator";
import { ExploreActions, FeedbackBox, Hints, LabWorkspace, SliderPanel, TaskCard, type Feedback } from "./ConvergenceUI";
import { GuidedProofDialog, SummaryContent } from "./GuidedProofDialog";
import { PartView, SolvedNote, type WrongLocation } from "./GuidedStepParts";
import { MathInlineText } from "./MathInlineText";
import { MathText } from "./MathText";

/** Everything that distinguishes one guided-example activity from another. */
export type GuidedActivityConfig<E extends string, G> = {
  /** Extra class on the root, e.g. "continuity-activity". */
  className: string;
  /** Prefix of element ids, e.g. "continuity". */
  idPrefix: string;
  /** Class on the stage track list, sizing its columns (e.g. "continuity-progress-list"). */
  listClassName: string;
  title: string;
  subtitle: ReactNode;
  order: readonly E[];
  /** Examples the student may skip; the finish view opens once the others are finished. */
  optional?: readonly E[];
  steps: Record<E, GuidedStep<E, G>[]>;
  tokens: Record<TokenId, Token>;
  /** Display LaTeX of the example: its sequence and domain. */
  formula: (id: E) => string;
  /** Hebrew navigation label with inline $...$ math. */
  caption: (id: E) => string;
  graphFlagsFor: (steps: GuidedStep<E, G>[], index: number, solved: boolean) => G;
  /** Graph state of free exploration. */
  exploreFlags: G;
  epsilonEnabled: (flags: G) => boolean;
  /** Whether the graphs split the domain at a point `a` (then an `a` slider is offered). */
  splitEnabled?: (id: E, flags: G) => boolean;
  nMax: number;
  renderPlots: (args: { id: E; n: number; epsilon: number; flags: G; split?: number }) => ReactNode;
  /** The goal page; `onStart` opens the last example the student worked on. */
  Intro: ComponentType<{ hidden: boolean; returning: boolean; onStart: () => void }>;
  /** Summary pop-up paragraphs per example; examples without one get no pop-up. */
  summary?: (id: E) => readonly string[] | undefined;
  finishTitle: string;
  finishBody: ReactNode;
};

type ShownFeedback = { stepId: string; status: "wrong" | "neutral"; text: string; wrong?: WrongLocation };

const EPSILON_LOCKED_HINT = "רוחב הרצועה ייפתח בהמשך";
const SPLIT_MIN = 0.02;
const SPLIT_MAX = 0.9;
const EXAMPLE_COPY: StageCopy = {
  navLabel: "דוגמאות הפעילות",
  progress: (position, total) => `דוגמה ${position} מתוך ${total}`,
  finished: "הפעילות הושלמה",
  previous: "הדוגמה הקודמת",
  next: "הדוגמה הבאה",
  finish: "סיום הפעילות",
  lockedTitle: "תיפתח לאחר השלמת הדוגמה הקודמת",
  status: { done: "הושלמה", current: "הדוגמה הנוכחית", available: "זמינה", locked: "נעולה" },
};

/** The split point `a` of the domain, for examples whose argument splits the integral. */
function SplitSlider({ value, onChange }: { value: number; onChange: (a: number) => void }) {
  const id = useId();
  return <div className="guided-split-slider" dir="ltr">
    <label className="convergence-slider-label" htmlFor={id}><MathText math={`a=${value.toFixed(2)}`} /></label>
    <input id={id} type="range" dir="ltr" aria-label="שינוי נקודת הפיצול a" min={SPLIT_MIN} max={SPLIT_MAX} step={0.01} value={value}
      onChange={(event) => onChange(Number(event.target.value))} />
  </div>;
}

/**
 * Shell of a guided-example activity on the shared guided-step engine (continuity of the limit,
 * limit and integral): a goal page, one stage per example (number, sequence, explanation slot, step
 * card with check / reveal / hints / previous step, graphs, n and ε sliders), a summary pop-up when
 * an example is finished, and a finish view with free exploration. Examples open in order; a
 * revealed step counts; optional examples never block. Restarting an example clears its answers
 * but keeps it finished. Component state only; the activity menu keeps it mounted while hidden.
 */
export function GuidedExampleActivity<E extends string, G>({ config, onExit, onFinish, initialView = "intro" }: {
  config: GuidedActivityConfig<E, G>;
  onExit?: () => void;
  onFinish?: () => void;
  /** Opening view; only the goal page or the first example make sense (later ones start locked). */
  initialView?: GuidedView<E>;
}) {
  const { order, steps: allSteps } = config;
  const optional = config.optional ?? [];
  const count = order.length;
  const isExampleView = (view: GuidedView<E>): view is E => view !== "intro" && view !== "complete";
  const [view, setView] = useState<GuidedView<E>>(initialView);
  const [lastExample, setLastExample] = useState<E>(order[0]);
  const [started, setStarted] = useState(initialView !== "intro");
  const [exploring, setExploring] = useState(false);
  const [exploreIndex, setExploreIndex] = useState(count - 1);
  /** The finished example's summary pop-up; it opens by itself when the example's last step is done. */
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [stepAt, setStepAt] = useState<Partial<Record<E, number>>>({});
  const [answers, setAnswers] = useState<Record<string, StepAnswers>>({});
  const [done, setDone] = useState<StepsDone>({});
  /** Examples finished at some point; restarting an example does not remove it from here. */
  const [finishedBefore, setFinishedBefore] = useState<E[]>([]);
  const [feedback, setFeedback] = useState<ShownFeedback | null>(null);
  const [n, setN] = useState(1);
  const [epsilon, setEpsilon] = useState(0.1);
  const [split, setSplit] = useState(0.2);
  const root = useRef<HTMLDivElement>(null);
  const navigation = useRef<HTMLDivElement>(null);
  const scrollAfterOpen = useRef(false);

  const progress: ProgressOptions<E> = { finishedBefore, optional };
  const guided = isExampleView(view);
  const id: E = guided ? view : order[exploreIndex];
  const exIndex = order.indexOf(id);
  const steps = allSteps[id];
  const stepIndex = stepAt[id] ?? 0;
  const step = steps[stepIndex];
  const solved = done[step.id] !== undefined;
  const flags = guided ? config.graphFlagsFor(steps, stepIndex, solved) : config.exploreFlags;
  const finished = finishedExamples(order, allSteps, done, progress);
  const canOpen = (next: string) => canOpenGuidedView(order, allSteps, next as GuidedView<E>, done, progress);
  const following: GuidedView<E> = exIndex < count - 1 ? order[exIndex + 1] : "complete";
  /** Leaving the last required example: the optional one that follows may be skipped. */
  const optionalNext = following !== "complete" && optional.includes(following) ? following : null;
  const exampleDone = areStepsDone(steps, done);
  const hasProgress = stepIndex > 0 || steps.some((s) => done[s.id] !== undefined);
  const summary = config.summary?.(id);
  const showSplit = config.splitEnabled?.(id, flags) ?? false;
  const stages: readonly Stage[] = order.map((stageId) => ({
    id: stageId,
    label: <MathInlineText text={optional.includes(stageId) ? `${config.caption(stageId)} (רשות)` : config.caption(stageId)} />,
  }));
  const titleId = `${config.idPrefix}-example-title`;
  const formulaId = `${config.idPrefix}-example-formula`;

  const shown: Feedback = feedback?.stepId === step.id
    ? { status: feedback.status, content: <MathInlineText text={feedback.text} /> }
    : solved
      ? { status: done[step.id], content: <SolvedNote step={step} answers={answers[step.id]} /> }
      : null;
  const wrong = feedback?.stepId === step.id ? feedback.wrong : undefined;

  useLayoutEffect(() => {
    if (!scrollAfterOpen.current) return;
    scrollAfterOpen.current = false;
    const target = view === "intro" ? root.current : navigation.current;
    if (target && target.getBoundingClientRect().top < 0) target.scrollIntoView({ block: "start", behavior: "instant" });
  }, [view]);

  function open(next: GuidedView<E>) {
    if (next === view || !canOpenGuidedView(order, allSteps, next, done, progress)) return;
    if (next !== "intro") setStarted(true);
    if (isExampleView(next)) {
      setLastExample(next);
      if (next !== id) setN(1);
    }
    setSummaryOpen(false);
    if (next === "complete") {
      setExploring(false);
      // Reaching the finish view is the activity's completion point (docs/plans/activity-progress.md).
      onFinish?.();
    }
    setFeedback(null);
    scrollAfterOpen.current = true;
    setView(next);
  }
  function editPart(part: StepPart, next: PartAnswer) {
    setAnswers((current) => ({ ...current, [step.id]: { ...current[step.id], [part.id]: next } }));
    setFeedback(null);
  }
  /** Records the current step; finishing an example's last open step opens its summary, if any. */
  function finishStep(how: "correct" | "revealed") {
    const nextDone = { ...done, [step.id]: how };
    setDone(nextDone);
    setFeedback(null);
    if (!areStepsDone(steps, done) && areStepsDone(steps, nextDone)) {
      setFinishedBefore((current) => current.includes(id) ? current : [...current, id]);
      if (summary) setSummaryOpen(true);
    }
  }
  function check() {
    const result = checkStep(step, answers[step.id]);
    if (result.status === "correct") finishStep("correct");
    else if (result.status === "wrong") {
      setFeedback({
        stepId: step.id, status: "wrong", text: result.message,
        wrong: { partId: result.partId, slotId: result.slotId, rowId: result.rowId, itemId: result.itemId },
      });
    } else setFeedback({ stepId: step.id, status: "neutral", text: result.message });
  }
  function reveal() {
    setAnswers((current) => ({ ...current, [step.id]: revealAnswers(step) }));
    finishStep("revealed");
  }
  function next() {
    if (stepIndex < steps.length - 1) {
      setStepAt((current) => ({ ...current, [id]: stepIndex + 1 }));
      setFeedback(null);
    } else open(following);
  }
  function previous() {
    if (stepIndex === 0) return;
    setStepAt((current) => ({ ...current, [id]: stepIndex - 1 }));
    setFeedback(null);
  }
  /** Clears this example's answers and returns to its first step; it stays finished if it was. */
  function restart() {
    const ids = new Set(steps.map((s) => s.id));
    setDone((current) => Object.fromEntries(Object.entries(current).filter(([stepId]) => !ids.has(stepId))) as StepsDone);
    setAnswers((current) => Object.fromEntries(Object.entries(current).filter(([stepId]) => !ids.has(stepId))));
    setStepAt((current) => ({ ...current, [id]: 0 }));
    setFeedback(null);
    setSummaryOpen(false);
    setN(1);
  }

  const isLastStep = stepIndex === steps.length - 1;
  const nextLabel = !isLastStep ? "לשלב הבא" : optionalNext ? "לסיום הפעילות" : following !== "complete" ? "לדוגמה הבאה" : "לסיום";
  const advance = () => (isLastStep && optionalNext ? open("complete") : next());

  const task = view === "complete" && !exploring
    ? <TaskCard key="complete" step="סיום הפעילות" title={config.finishTitle} response={<div className="convergence-actions">
      <button type="button" className="panel-action" onClick={() => setExploring(true)}>חקירה חופשית</button>
      <button type="button" className="panel-action secondary" onClick={() => open(lastExample)}>חזרה לדוגמאות</button>
    </div>}>
      {config.finishBody}
    </TaskCard>
    : view === "complete"
      ? <TaskCard key="explore" step="חקירה חופשית" title="חקירה חופשית של הדוגמאות" response={<ExploreActions onGuided={() => setExploring(false)} />}>
        <div className="convergence-formula-card supremum-formula-card"><div className="convergence-formula-pair" dir="ltr"><MathText block math={config.formula(id)} /></div></div>
        <nav className="supremum-example-chips" aria-label="הדוגמאות">
          <span className="supremum-example-chips-label">דוגמאות:</span>
          {order.map((exampleId, index) => <button key={exampleId} type="button"
            className={`supremum-example-chip${index === exIndex ? " is-current" : ""}`}
            aria-current={index === exIndex ? "true" : undefined} aria-label={`דוגמה ${index + 1}`}
            onClick={() => { setExploreIndex(index); setN(1); }}>{index + 1}</button>)}
        </nav>
        <p>שנו את <MathText math="n" /> ואת <MathText math="\varepsilon" /> בכל אחת מהדוגמאות.</p>
      </TaskCard>
      : <TaskCard key={`${id}-${stepIndex}`} step={`שלב ${stepIndex + 1} מתוך ${steps.length}`}
        title={<MathInlineText text={step.title} />} response={<>
          {!solved && <div className="convergence-actions">
            <button type="button" className="panel-action" onClick={check}>בדיקה</button>
            <button type="button" className="panel-action secondary" onClick={reveal}>הצג תשובה לשלב</button>
          </div>}
          <FeedbackBox feedback={shown} />
          {solved && <div className="convergence-actions">
            <button type="button" className="panel-action" onClick={advance}>{nextLabel}</button>
            {isLastStep && optionalNext && <button type="button" className="panel-action secondary" onClick={() => open(optionalNext)}>לדוגמת הרשות</button>}
          </div>}
          {stepIndex > 0 && <button type="button" className="panel-action secondary guided-previous-step" onClick={previous}>לשלב הקודם</button>}
          <Hints key={step.id} hints={step.hints.map((hint, i) => <MathInlineText key={i} text={hint} />)} />
          {step.disclosure && <details className="convergence-proof" key={`${step.id}-disclosure`}>
            <summary>{step.disclosure.summary}</summary>
            <p><MathInlineText text={step.disclosure.body} /></p>
          </details>}
        </>}>
        <p className="supremum-prompt"><MathInlineText text={step.prompt} /></p>
        {step.parts.map((part) => <PartView key={part.id} part={part} tokens={config.tokens} answer={answers[step.id]?.[part.id]}
          wrong={wrong?.partId === part.id ? wrong : undefined} solved={solved} onChange={(nextAnswer) => editPart(part, nextAnswer)} />)}
      </TaskCard>;

  const workspace = <LabWorkspace task={task} plots={config.renderPlots({ id, n, epsilon, flags, split: showSplit ? split : undefined })} tools={
    <SliderPanel n={n} onN={setN} nMax={config.nMax} epsilon={epsilon} onEpsilon={setEpsilon}
      epsilonEnabled={config.epsilonEnabled(flags)} epsilonLockedHint={EPSILON_LOCKED_HINT}
      extra={showSplit ? <SplitSlider value={split} onChange={setSplit} /> : undefined} />
  } />;
  const openFromTrack = (next: string) => open(next as GuidedView<E>);

  return <div ref={root} className={`convergence-lab supremum-activity ${config.className}`}>
    <header className="convergence-heading">
      <div className="convergence-heading-copy">
        <h2 data-convergence-heading tabIndex={-1}>{config.title}</h2>
        <p className="convergence-muted">{config.subtitle}</p>
      </div>
      <div className="convergence-heading-actions">
        {view !== "intro" && <button type="button" className="panel-action secondary" onClick={() => open("intro")}>מטרת הפעילות</button>}
        {onExit && <button type="button" className="panel-action secondary" onClick={onExit}>חזרה לתפריט הפעילויות</button>}
      </div>
    </header>
    <div ref={navigation} hidden={view === "intro"}>
      {view !== "intro" && <StageNavigator stages={stages} current={view} completed={finished} canOpen={canOpen} busy={false}
        copy={EXAMPLE_COPY} listClassName={config.listClassName} onOpen={openFromTrack} />}
    </div>
    <config.Intro hidden={view !== "intro"} returning={started} onStart={() => open(lastExample)} />
    {guided && <section className="convergence-lesson-panel" aria-labelledby={`${titleId} ${formulaId}`}>
      <header className="convergence-part-header supremum-example-header">
        <div className="supremum-example-heading">
          <h3 className="convergence-part-title" id={titleId}>דוגמה {exIndex + 1}{optional.includes(id) ? " (רשות)" : ""}</h3>
          <div key={id} className="supremum-example-formula" id={formulaId} dir="ltr">
            <MathText block math={config.formula(id)} />
          </div>
          <div className="guided-example-actions">
            {exampleDone && summary && <button type="button" className="panel-action secondary" onClick={() => setSummaryOpen(true)}>סיכום הדוגמה</button>}
            {hasProgress && <button type="button" className="panel-action secondary" onClick={restart}>התחלת הדוגמה מחדש</button>}
          </div>
        </div>
        <div className="convergence-explanation-slot" data-example-explanation={id} aria-hidden="true" />
      </header>
      {workspace}
    </section>}
    {guided && summary && <GuidedProofDialog kicker={`דוגמה ${exIndex + 1}`} title="סיכום הדוגמה" open={summaryOpen}
      nextLabel={optionalNext || following === "complete" ? "לסיום הפעילות" : "לדוגמה הבאה"}
      onNext={() => open(optionalNext ? "complete" : following)}
      secondaryNext={optionalNext ? { label: "לדוגמת הרשות", onClick: () => open(optionalNext) } : undefined}
      onClose={() => setSummaryOpen(false)}>
      <SummaryContent formulaLatex={config.formula(id)} paragraphs={summary} />
    </GuidedProofDialog>}
    {view === "complete" && workspace}
    {view !== "intro" && <div className="convergence-sequence-footer">
      <StagePaging stages={stages} current={view} canOpen={canOpen} busy={false} copy={EXAMPLE_COPY} onOpen={openFromTrack} />
    </div>}
  </div>;
}
