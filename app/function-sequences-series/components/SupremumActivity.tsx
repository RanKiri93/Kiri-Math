"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  SUP_EXAMPLES,
  SUP_EXAMPLE_ORDER,
  SUP_MAX_N,
  type SupExampleId,
} from "../math/supremumExamples";
import {
  SUP_STEPS,
  SUP_TOKENS,
  checkStep,
  graphFlagsFor,
  revealAnswers,
  type GraphFlags,
  type PartAnswer,
  type Step,
  type StepPart,
  type StepAnswers,
} from "../math/supremumArgument";
import { SUP_VIEWS, clampProbe, defaultViewIndex, probeBounds, probeSliderBounds } from "../math/supremumViews";
import { canOpenSupremumView, completedExamples, isExampleComplete, type StepsDone, type SupremumView } from "../math/supremumProgress";
import { StageNavigator, StagePaging, type Stage, type StageCopy } from "./ConvergenceNavigator";
import { ExploreActions, FeedbackBox, Hints, LabWorkspace, SliderPanel, TaskCard, type Feedback } from "./ConvergenceUI";
import { MathInlineText } from "./MathInlineText";
import { MathText } from "./MathText";
import { SupremumIntro } from "./SupremumIntro";
import { supremumExampleExplanations } from "./SupremumExampleExplanations";
import { SupremumProofDialog } from "./SupremumProofDialog";
import { PartView, SolvedNote, tokenMap, type WrongLocation } from "./GuidedStepParts";
import { SupSequencePlot } from "./SupSequencePlot";
import { SupremumPlot } from "./SupremumPlot";

type ShownFeedback = { stepId: string; status: "wrong" | "neutral"; text: string; wrong?: WrongLocation };

const TOKENS = tokenMap(SUP_TOKENS);
const EXAMPLE_COUNT = SUP_EXAMPLE_ORDER.length;
const EXAMPLE_CHIP_LABELS: Record<SupExampleId, string> = { E1: "1", E1p: "2", E2: "3", E3: "4", E3p: "5" };
const EPSILON_LOCKED_HINT = "רוחב הרצועה ייפתח בהמשך";

const record = <T,>(make: (id: SupExampleId) => T): Record<SupExampleId, T> =>
  Object.fromEntries(SUP_EXAMPLE_ORDER.map((id) => [id, make(id)])) as Record<SupExampleId, T>;

const isExampleView = (view: SupremumView): view is SupExampleId => view !== "intro" && view !== "complete";

/** The example's sequence and domain without the "f_n(x)=" prefix, e.g. "$nxe^{-nx}$ ב־$[0,\infty)$". */
export function exampleCaption(id: SupExampleId): string {
  const ex = SUP_EXAMPLES[id];
  return `$${ex.fnLatex.replace(/^f_n\(x\)=/, "")}$ ב־$${ex.domainLatex}$`;
}

const EXAMPLE_STAGES: readonly Stage[] = SUP_EXAMPLE_ORDER.map((id) => ({ id, label: <MathInlineText text={exampleCaption(id)} /> }));
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

/** Flags for free exploration and the completion screen: everything the example ever showed. */
function fullFlags(id: SupExampleId): GraphFlags {
  const steps = SUP_STEPS[id];
  return { ...steps[steps.length - 1].graph, mnGraph: true, epsilonControl: true };
}

function ExampleChips({ current, onPick }: { current: number; onPick: (index: number) => void }) {
  return <nav className="supremum-example-chips" aria-label="הדוגמאות">
    <span className="supremum-example-chips-label">דוגמאות:</span>
    {SUP_EXAMPLE_ORDER.map((id, index) => <button key={id} type="button"
      className={`supremum-example-chip${index === current ? " is-current" : ""}`}
      aria-current={index === current ? "true" : undefined} aria-label={`דוגמה ${EXAMPLE_CHIP_LABELS[id]}`}
      onClick={() => onPick(index)}>
      {EXAMPLE_CHIP_LABELS[id]}
    </button>)}
  </nav>;
}

function FormulaCard({ id }: { id: SupExampleId }) {
  const ex = SUP_EXAMPLES[id];
  return <div className="convergence-formula-card supremum-formula-card">
    <div className="convergence-formula-pair" dir="ltr">
      <MathText block math={`${ex.fnLatex},\\quad x\\in ${ex.domainLatex}`} />
    </div>
  </div>;
}

/**
 * "Supremum test: compute and argue". A walk through the five examples of `SUP_STEPS`, presented
 * as stages like the convergence lab: a goal page, one stage per example with its own title and
 * explanation slot, and a finish view that offers free exploration. Every step is a guided
 * template checked by `checkStep`, and the graphs follow `graphFlagsFor`.
 * State is component state only (no practice persistence); the menu keeps this component mounted while hidden.
 *
 * Navigation: a step is left only after it is solved or revealed ("לשלב הבא"). An example opens once
 * every step of the previous one is finished (`canOpenSupremumView`); a revealed step counts. The
 * stage track returns to any open example at the step where the student left it.
 */
export function SupremumActivity({ onExit, onFinish, initialView = "intro" }: {
  onExit?: () => void; onFinish?: () => void;
  /** Opening view; only the first example (or the goal page) makes sense, since later ones start locked. */
  initialView?: "intro" | "E1";
}) {
  const [view, setView] = useState<SupremumView>(initialView);
  const [lastExample, setLastExample] = useState<SupExampleId>(SUP_EXAMPLE_ORDER[0]);
  const [started, setStarted] = useState(initialView !== "intro");
  const [exploring, setExploring] = useState(false);
  /** The finished example's full-proof pop-up; it opens by itself when the example's last step is done. */
  const [proofOpen, setProofOpen] = useState(false);
  const [exploreIndex, setExploreIndex] = useState(EXAMPLE_COUNT - 1);
  const [stepAt, setStepAt] = useState<Record<SupExampleId, number>>(() => record(() => 0));
  const [answers, setAnswers] = useState<Record<string, StepAnswers>>({});
  const [done, setDone] = useState<StepsDone>({});
  /** Examples finished at some point; restarting an example does not remove it from here. */
  const [finishedBefore, setFinishedBefore] = useState<SupExampleId[]>([]);
  const [feedback, setFeedback] = useState<ShownFeedback | null>(null);
  const [n, setN] = useState(1);
  const [epsilon, setEpsilon] = useState(0.1);
  const [probes, setProbes] = useState<Record<SupExampleId, number>>(() => record((id) => SUP_EXAMPLES[id].defaultProbe));
  const [viewIndex, setViewIndex] = useState<Record<SupExampleId, number>>(() => record(defaultViewIndex));
  const root = useRef<HTMLDivElement>(null);
  const navigation = useRef<HTMLDivElement>(null);
  const scrollAfterOpen = useRef(false);

  const guided = isExampleView(view);
  const id: SupExampleId = guided ? view : SUP_EXAMPLE_ORDER[exploreIndex];
  const exIndex = SUP_EXAMPLE_ORDER.indexOf(id);
  const ex = SUP_EXAMPLES[id];
  const steps = SUP_STEPS[id];
  const stepIndex = stepAt[id];
  const step: Step = steps[stepIndex];
  const solved = done[step.id] !== undefined;
  const flags: GraphFlags = guided ? graphFlagsFor(steps, stepIndex, solved) : fullFlags(id);
  const plotView = SUP_VIEWS[id][viewIndex[id]];
  const probe = clampProbe(ex, plotView, probes[id]);
  const bounds = probeBounds(ex);
  const sliderBounds = probeSliderBounds(ex, plotView);
  const finished = completedExamples(done, finishedBefore);
  const canOpen = (next: string) => canOpenSupremumView(next as SupremumView, done, finishedBefore);
  const hasProgress = stepIndex > 0 || steps.some((s) => done[s.id] !== undefined);
  const following: SupremumView = exIndex < EXAMPLE_COUNT - 1 ? SUP_EXAMPLE_ORDER[exIndex + 1] : "complete";

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

  function open(next: SupremumView) {
    if (next === view || !canOpenSupremumView(next, done, finishedBefore)) return;
    if (next !== "intro") setStarted(true);
    if (isExampleView(next)) {
      setLastExample(next);
      if (next !== id) setN(1);
    }
    setProofOpen(false);
    if (next === "complete") {
      setExploring(false);
      // Reaching the finish view is the activity's completion point (docs/plans/activity-progress.md).
      onFinish?.();
    }
    setFeedback(null);
    scrollAfterOpen.current = true;
    setView(next);
  }
  function exploreExample(index: number) {
    setExploreIndex(index);
    setN(1);
  }
  function editPart(part: StepPart, next: PartAnswer) {
    setAnswers((current) => ({ ...current, [step.id]: { ...current[step.id], [part.id]: next } }));
    setFeedback(null);
  }
  function check() {
    const result = checkStep(step, answers[step.id]);
    if (result.status === "correct") {
      finishStep("correct");
    } else if (result.status === "wrong") {
      setFeedback({
        stepId: step.id, status: "wrong", text: result.message,
        wrong: { partId: result.partId, slotId: result.slotId, rowId: result.rowId, itemId: result.itemId },
      });
    } else {
      setFeedback({ stepId: step.id, status: "neutral", text: result.message });
    }
  }
  function reveal() {
    setAnswers((current) => ({ ...current, [step.id]: revealAnswers(step) }));
    finishStep("revealed");
  }
  /** Records the current step; finishing an example's last open step opens its full proof. */
  function finishStep(how: "correct" | "revealed") {
    const nextDone = { ...done, [step.id]: how };
    setDone(nextDone);
    setFeedback(null);
    if (!isExampleComplete(id, done) && isExampleComplete(id, nextDone)) {
      setFinishedBefore((current) => current.includes(id) ? current : [...current, id]);
      setProofOpen(true);
    }
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
    setProofOpen(false);
    setN(1);
  }
  function next() {
    if (stepIndex < steps.length - 1) {
      setStepAt((current) => ({ ...current, [id]: stepIndex + 1 }));
      setFeedback(null);
    } else open(following);
  }
  function setProbe(x: number) {
    setProbes((current) => ({ ...current, [id]: x }));
  }

  const isLastStep = stepIndex === steps.length - 1;
  const nextLabel = !isLastStep ? "לשלב הבא" : following !== "complete" ? "לדוגמה הבאה" : "לסיום";

  const task = view === "complete" && !exploring
    ? <TaskCard key="complete" step="סיום הפעילות" title="סיימתם את חמש הדוגמאות" response={<div className="convergence-actions">
      <button type="button" className="panel-action" onClick={() => setExploring(true)}>חקירה חופשית</button>
      <button type="button" className="panel-action secondary" onClick={() => open(lastExample)}>חזרה לדוגמאות</button>
    </div>}>
      <p>בכל דוגמה חישבתם את <MathText math="M_n=\sup_{x\in D}|f_n(x)|" /> וקבעתם לפי מבחן הסופרמום אם ההתכנסות במידה שווה. שימו לב איך התחום קבע את התשובה.</p>
      <p className="convergence-muted">בחקירה החופשית אפשר לשנות את האינדקס, את נקודת הבדיקה ואת רוחב הרצועה בכל אחת מהדוגמאות.</p>
    </TaskCard>
    : view === "complete"
      ? <TaskCard key="explore" step="חקירה חופשית" title="חקירה חופשית של הדוגמאות" response={<ExploreActions onGuided={() => setExploring(false)} />}>
        <FormulaCard key={id} id={id} />
        <ExampleChips current={exIndex} onPick={exploreExample} />
        <p>שנו את <MathText math="n" />, את נקודת הבדיקה ואת <MathText math="\varepsilon" />, ושנו את חלון התצוגה כדי לראות את הפסגה.</p>
      </TaskCard>
      : <TaskCard key={`${id}-${stepIndex}`} step={`שלב ${stepIndex + 1} מתוך ${steps.length}`}
        title={<MathInlineText text={step.title} />} response={<>
          {!solved && <div className="convergence-actions">
            <button type="button" className="panel-action" onClick={check}>בדיקה</button>
            <button type="button" className="panel-action secondary" onClick={reveal}>הצג תשובה לשלב</button>
          </div>}
          <FeedbackBox feedback={shown} />
          {solved && <button type="button" className="panel-action" onClick={next}>{nextLabel}</button>}
          {stepIndex > 0 && <button type="button" className="panel-action secondary guided-previous-step" onClick={previous}>לשלב הקודם</button>}
          <Hints key={step.id} hints={step.hints.map((hint, i) => <MathInlineText key={i} text={hint} />)} />
          {step.disclosure && <details className="convergence-proof" key={`${step.id}-disclosure`}>
            <summary>{step.disclosure.summary}</summary>
            <p><MathInlineText text={step.disclosure.body} /></p>
          </details>}
        </>}>
        <p className="supremum-prompt"><MathInlineText text={step.prompt} /></p>
        {step.parts.map((part) => <PartView key={part.id} part={part} tokens={TOKENS} answer={answers[step.id]?.[part.id]}
          wrong={wrong?.partId === part.id ? wrong : undefined} solved={solved} onChange={(nextAnswer) => editPart(part, nextAnswer)} />)}
      </TaskCard>;

  const plots: ReactNode = <>
    <SupremumPlot example={ex} n={n} view={plotView} flags={flags} probeX={probe} onProbeChange={setProbe}
      viewIndex={viewIndex[id]} onViewChange={(index) => setViewIndex((current) => ({ ...current, [id]: index }))} />
    {flags.mnGraph && <SupSequencePlot example={ex} n={n} epsilon={epsilon} />}
  </>;

  const workspace = <LabWorkspace task={task} plots={plots} tools={
    <SliderPanel n={n} onN={setN} nMax={SUP_MAX_N}
      point={{ value: probe, onChange: (x) => setProbe(clampProbe(ex, plotView, x)), min: bounds.min, max: bounds.max, sliderMin: sliderBounds.min, sliderMax: sliderBounds.max }}
      epsilon={epsilon} onEpsilon={setEpsilon} epsilonEnabled={flags.epsilonControl} epsilonLockedHint={EPSILON_LOCKED_HINT} />
  } />;
  const openFromTrack = (next: string) => open(next as SupremumView);

  return <div ref={root} className="convergence-lab supremum-activity">
    <header className="convergence-heading">
      <div className="convergence-heading-copy">
        <h2 data-convergence-heading tabIndex={-1}>שימוש במבחן הסופרמום</h2>
        <p className="convergence-muted">היכרות עם טכניקות נפוצות לחישוב הסופרמום של <MathText math="|f_n-f|" /> ונימוק נכון של השימוש במשפט.</p>
      </div>
      <div className="convergence-heading-actions">
        {view !== "intro" && <button type="button" className="panel-action secondary" onClick={() => open("intro")}>מטרת הפעילות</button>}
        {onExit && <button type="button" className="panel-action secondary" onClick={onExit}>חזרה לתפריט הפעילויות</button>}
      </div>
    </header>
    <div ref={navigation} hidden={view === "intro"}>
      {view !== "intro" && <StageNavigator stages={EXAMPLE_STAGES} current={view} completed={finished} canOpen={canOpen} busy={false}
        copy={EXAMPLE_COPY} listClassName="supremum-progress-list" onOpen={openFromTrack} />}
    </div>
    <SupremumIntro hidden={view !== "intro"} returning={started} onStart={() => open(lastExample)} />
    {guided && <section className="convergence-lesson-panel" aria-labelledby="supremum-example-title supremum-example-formula">
      <header className="convergence-part-header supremum-example-header">
        {/* The example every step card below works on: its number, then its sequence and domain. */}
        <div className="supremum-example-heading">
          <h3 className="convergence-part-title" id="supremum-example-title">דוגמה {exIndex + 1}</h3>
          <div key={id} className="supremum-example-formula" id="supremum-example-formula" dir="ltr">
            <MathText block math={`${ex.fnLatex},\\quad x\\in ${ex.domainLatex}`} />
          </div>
          <div className="guided-example-actions">
            {isExampleComplete(id, done) && <button type="button" className="panel-action secondary supremum-proof-open" onClick={() => setProofOpen(true)}>ההוכחה המלאה</button>}
            {hasProgress && <button type="button" className="panel-action secondary" onClick={restart}>התחלת הדוגמה מחדש</button>}
          </div>
        </div>
        <div className="convergence-explanation-slot" data-example-explanation={id} aria-hidden={supremumExampleExplanations[id] == null ? true : undefined}>
          {supremumExampleExplanations[id]}
        </div>
      </header>
      {workspace}
    </section>}
    {guided && <SupremumProofDialog id={id} position={exIndex + 1} open={proofOpen}
      nextLabel={following === "complete" ? "לסיום הפעילות" : "לדוגמה הבאה"} onNext={() => open(following)} onClose={() => setProofOpen(false)} />}
    {view === "complete" && workspace}
    {view !== "intro" && <div className="convergence-sequence-footer">
      <StagePaging stages={EXAMPLE_STAGES} current={view} canOpen={canOpen} busy={false} copy={EXAMPLE_COPY} onOpen={openFromTrack} />
    </div>}
  </div>;
}
