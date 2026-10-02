"use client";

import { useEffect, useRef, useState } from "react";
import { mixSeed } from "../../constant-coefficients-euler/practice/random";
import { checkStep, revealAnswers, type PartAnswer, type StepAnswers, type StepPart } from "../math/guidedSteps";
import { availableLevels, availableTopics, drawExercise } from "../practice/practiceBank";
import { PRACTICE_DIFFICULTIES, PRACTICE_LEVEL_LABELS, PRACTICE_TOPICS, PRACTICE_TOPIC_LABELS, type PracticeExercise, type PracticeFilter, type PracticeLevel, type PracticeStep } from "../practice/practiceTypes";
import { FeedbackBox, Hints, SliderPanel, type Feedback } from "./ConvergenceUI";
import { PartView, SolvedNote, tokenMap, type WrongLocation } from "./GuidedStepParts";
import { MathInlineText } from "./MathInlineText";
import { MathText } from "./MathText";
import { PracticePlot } from "./PracticePlot";

type ShownFeedback = { stepId: string; status: "wrong" | "neutral"; text: string; wrong?: WrongLocation };
type Draw = { seed: number; exercise: PracticeExercise | null };

const FILTERS: readonly PracticeFilter[] = ["all", ...PRACTICE_TOPICS];
const LEVELS: readonly PracticeLevel[] = ["all", ...PRACTICE_DIFFICULTIES];

/** One step of the exercise card: open while it is the current step, then kept solved above the next. */
function PracticeStepBlock({ step, index, exercise, answers, solvedAs, feedback, current, onEdit, onCheck, onReveal }: {
  step: PracticeStep;
  index: number;
  exercise: PracticeExercise;
  answers: StepAnswers | undefined;
  solvedAs: "correct" | "revealed" | undefined;
  feedback: ShownFeedback | null;
  current: boolean;
  onEdit: (part: StepPart, next: PartAnswer) => void;
  onCheck: () => void;
  onReveal: () => void;
}) {
  const solved = solvedAs !== undefined;
  const heading = useRef<HTMLHeadingElement>(null);
  // A step that opens below the previous one takes the focus, so keyboard and screen-reader users follow it.
  useEffect(() => { if (current && index > 0) heading.current?.focus({ preventScroll: false }); }, [current, index]);
  const shown: Feedback = feedback?.stepId === step.id
    ? { status: feedback.status, content: <MathInlineText text={feedback.text} /> }
    : solved ? { status: solvedAs, content: <SolvedNote step={step} answers={answers} /> } : null;
  const wrong = feedback?.stepId === step.id ? feedback.wrong : undefined;
  const tokens = tokenMap(exercise.tokens);
  return <li className={`practice-step${solved ? " is-solved" : ""}`} data-practice-step={step.id}>
    <h4 ref={heading} tabIndex={-1}><span className="summary-step-badge">שלב {index + 1}</span> <MathInlineText text={step.title} /></h4>
    <p className="supremum-prompt"><MathInlineText text={step.prompt} /></p>
    {step.parts.map((part) => <PartView key={part.id} part={part} tokens={tokens} answer={answers?.[part.id]}
      wrong={wrong?.partId === part.id ? wrong : undefined} solved={solved} onChange={(next) => onEdit(part, next)} />)}
    {!solved && <div className="convergence-actions">
      <button type="button" className="panel-action" onClick={onCheck}>בדיקה</button>
      <button type="button" className="panel-action secondary" onClick={onReveal}>הצג תשובה לשלב</button>
    </div>}
    <FeedbackBox feedback={shown} />
    {!solved && <Hints key={step.id} hints={step.hints.map((hint, i) => <MathInlineText key={i} text={hint} />)} />}
  </li>;
}

/**
 * "תרגול מסכם": exercises drawn at random from the parametric bank (practice/), optionally limited to
 * one topic. Each exercise is a single card; its steps open one below the other as the student
 * solves them. A new exercise can be drawn at any time. Nothing is stored or recorded as a
 * completed activity (no `onFinish`). The first draw uses a fixed seed so server and browser agree.
 */
export function PracticeActivity({ onExit, initialSeed = 1 }: { onExit?: () => void; initialSeed?: number }) {
  const [filter, setFilter] = useState<PracticeFilter>("all");
  const [level, setLevel] = useState<PracticeLevel>("all");
  const [draw, setDraw] = useState<Draw>(() => ({ seed: initialSeed, exercise: drawExercise("all", initialSeed) }));
  const [reached, setReached] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StepAnswers>>({});
  const [done, setDone] = useState<Record<string, "correct" | "revealed">>({});
  const [feedback, setFeedback] = useState<ShownFeedback | null>(null);
  const [n, setN] = useState(1);
  const [epsilon, setEpsilon] = useState(0.1);
  /** The visual aid can be folded away; the choice persists across drawn exercises within the visit. */
  const [aidOpen, setAidOpen] = useState(true);
  const draws = useRef(0);
  // Per-visit entropy, read after mount: the first draw is fixed (server and browser agree), the
  // following draws differ between visits.
  const entropy = useRef(0);
  useEffect(() => { entropy.current = Date.now() >>> 0; }, []);
  const topics = availableTopics(level);
  const levels = availableLevels(filter);
  const exercise = draw.exercise;
  const finished = exercise !== null && exercise.steps.every((step) => done[step.id] !== undefined);

  function redraw(nextFilter: PracticeFilter = filter, nextLevel: PracticeLevel = level) {
    draws.current += 1;
    const seed = mixSeed((draw.seed ^ entropy.current) >>> 0, draws.current);
    setDraw({ seed, exercise: drawExercise(nextFilter, seed, exercise?.signature, undefined, nextLevel) });
    setReached(0);
    setAnswers({});
    setDone({});
    setFeedback(null);
    setN(1);
  }
  function chooseFilter(next: PracticeFilter) {
    if (next === filter) return;
    setFilter(next);
    redraw(next, level);
  }
  function chooseLevel(next: PracticeLevel) {
    if (next === level) return;
    setLevel(next);
    redraw(filter, next);
  }
  function stepActions(step: PracticeStep, index: number) {
    const finish = (how: "correct" | "revealed") => {
      setDone((current) => ({ ...current, [step.id]: how }));
      setFeedback(null);
      if (exercise && index + 1 < exercise.steps.length) setReached((current) => Math.max(current, index + 1));
    };
    return {
      onEdit: (part: StepPart, next: PartAnswer) => {
        setAnswers((current) => ({ ...current, [step.id]: { ...current[step.id], [part.id]: next } }));
        setFeedback(null);
      },
      onCheck: () => {
        const result = checkStep(step, answers[step.id]);
        if (result.status === "correct") finish("correct");
        else if (result.status === "wrong") {
          setFeedback({ stepId: step.id, status: "wrong", text: result.message,
            wrong: { partId: result.partId, slotId: result.slotId, rowId: result.rowId, itemId: result.itemId } });
        } else setFeedback({ stepId: step.id, status: "neutral", text: result.message });
      },
      onReveal: () => {
        setAnswers((current) => ({ ...current, [step.id]: revealAnswers(step) }));
        finish("revealed");
      },
    };
  }

  return <div className="convergence-lab practice-activity">
    <header className="convergence-heading">
      <div className="convergence-heading-copy">
        <h2 data-convergence-heading tabIndex={-1}>תרגול מסכם</h2>
        <p className="convergence-muted">תרגילים מוגרלים בסגנון הפעילויות הקודמות. אפשר להתמקד בנושא אחד ולהגריל תרגיל חדש בכל רגע; התרגול אינו נשמר ואינו נרשם כפעילות שהושלמה.</p>
      </div>
      <div className="convergence-heading-actions">
        {onExit && <button type="button" className="panel-action secondary" onClick={onExit}>חזרה לתפריט הפעילויות</button>}
      </div>
    </header>

    <div className="practice-toolbar">
      <div className="segmented-control practice-topics" role="group" aria-label="נושא התרגילים">
        {FILTERS.map((option) => {
          const available = option === "all" || topics.includes(option);
          return <button key={option} type="button" className={option === filter ? "selected" : undefined}
            aria-pressed={option === filter} disabled={!available} title={available ? undefined : "תרגילים בנושא זה יתווספו בהמשך"}
            onClick={() => chooseFilter(option)}>{PRACTICE_TOPIC_LABELS[option]}</button>;
        })}
      </div>
      <div className="segmented-control practice-levels" role="group" aria-label="רמת הקושי">
        {LEVELS.map((option) => {
          const available = option === "all" || levels.includes(option);
          return <button key={option} type="button" className={option === level ? "selected" : undefined}
            aria-pressed={option === level} disabled={!available} title={available ? undefined : "אין תרגילים ברמה זו בנושא שנבחר"}
            onClick={() => chooseLevel(option)}>{PRACTICE_LEVEL_LABELS[option]}</button>;
        })}
      </div>
      <button type="button" className="panel-action practice-redraw" onClick={() => redraw()}>תרגיל חדש</button>
    </div>

    {exercise ? <section className="module-intro-card practice-exercise-card" aria-labelledby="practice-exercise-title" key={`${draw.seed}-${exercise.signature}`}>
      <header className="practice-exercise-header">
        <p className="course-kicker">{PRACTICE_TOPIC_LABELS[exercise.topic]} · {PRACTICE_LEVEL_LABELS[exercise.difficulty]}</p>
        <h3 id="practice-exercise-title">{exercise.title}</h3>
        <p><MathInlineText text={exercise.statement} /></p>
        <div className="supremum-proof-formula" dir="ltr"><MathText block math={exercise.formulaLatex} /></div>
      </header>
      {/* Steps in the main column; the visual aid in a narrow side column that stays in view while
          scrolling (stacked above the steps on narrow screens), and can be folded away. */}
      <div className={`practice-exercise-body${exercise.plot && aidOpen ? " has-aid" : ""}`}>
        <div className="practice-steps-column">
          <ol className="practice-steps">
            {exercise.steps.slice(0, reached + 1).map((step, index) => <PracticeStepBlock key={step.id} step={step} index={index}
              exercise={exercise} answers={answers[step.id]} solvedAs={done[step.id]} feedback={feedback} current={index === reached}
              {...stepActions(step, index)} />)}
          </ol>
          {finished && <div className="practice-finished" role="status">
            <p>סיימתם את התרגיל.</p>
            <button type="button" className="panel-action" onClick={() => redraw()}>תרגיל חדש</button>
          </div>}
        </div>
        {exercise.plot && <aside className="practice-plot-panel" aria-label="עזר חזותי">
          <div className="practice-plot-panel-header">
            <span>עזר חזותי</span>
            <button type="button" className="panel-action secondary" aria-expanded={aidOpen} onClick={() => setAidOpen((open) => !open)}>
              {aidOpen ? "הסתרת הגרף" : "הצגת הגרף"}
            </button>
          </div>
          {aidOpen && <>
            <PracticePlot spec={exercise.plot} n={Math.min(n, exercise.plot.maxN)} epsilon={epsilon} showBand />
            <SliderPanel n={n} onN={setN} nMax={exercise.plot.maxN} epsilon={epsilon} onEpsilon={setEpsilon} epsilonEnabled />
          </>}
        </aside>}
      </div>
    </section> : <section className="module-intro-card practice-exercise-card">
      <p>בנושא זה עוד אין תרגילים. בחרו נושא אחר או «כל הנושאים».</p>
    </section>}
  </div>;
}
