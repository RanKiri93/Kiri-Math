"use client";

import { useState } from "react";
import { REAL_LINE, UNIT_INTERVAL } from "../math/convergenceActivity";
import { MathText } from "./MathText";
import { SequencePlot } from "./SequencePlot";
import {
  Choice, CLASSIFICATIONS, EpsilonControl, ExploreActions, FeedbackBox, Hints,
  IndexControl, LabWorkspace, NumberControl, TaskCard, type Feedback, type LessonProps,
} from "./ConvergenceUI";
import type { ConvergenceKind } from "../math/convergence";

export function WarmupActivity({ onComplete, onNext }: LessonProps) {
  const [n, setN] = useState(1);
  const [x, setX] = useState(0.75);
  const [epsilon, setEpsilon] = useState(0.25);
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [exploring, setExploring] = useState(false);
  const finished = step === 1 && (feedback?.status === "correct" || feedback?.status === "revealed");
  const showLimit = step > 0 || feedback?.status === "correct" || feedback?.status === "revealed";
  function check() {
    if (step === 0) {
      setFeedback(answer === "zero" || (answer === "point" && x === 0)
        ? { status: "correct", content: "בכל נקודה קבועה, הערכים מתקרבים לאפס." }
        : { status: "wrong", content: answer ? "הנקודה נשארת קבועה; המכנה גדל. נסו שוב." : "בחרו תחזית לפני הבדיקה." });
    } else if (1 / n < epsilon) {
      setFeedback({ status: "correct", content: <>כל הגרף בפנים, וגם כל הבאים אחריו: <MathText math="0\le x/n\le1/n" />.</> });
      onComplete();
    } else {
      setFeedback({ status: "wrong", content: <>בקצה <MathText math="x=1" /> עדיין מתקיים <MathText math="f_n(1)\ge\varepsilon" />. הגדילו את האינדקס.</> });
    }
  }
  function reveal() {
    if (step === 0) setAnswer("zero");
    setFeedback({ status: "revealed", content: step === 0
      ? <MathText math="\frac{x_0}{n}\longrightarrow0" />
      : <>מספיק לבחור <MathText math="n>1/\varepsilon" />. החסם <MathText math="1/n" /> ממשיך לקטון.</> });
    if (step === 1) onComplete();
  }
  return <LabWorkspace controls={<>
    <IndexControl n={n} onChange={(value) => { setN(value); if (step === 1) setFeedback(null); }} />
    <section className="panel-section">
      <NumberControl label={<>נקודה קבועה <MathText math="x_0" /></>} value={x} min={0} max={1} onChange={(value) => { setX(value); if (step === 0) setFeedback(null); }} />
      {(step > 0 || exploring) && <EpsilonControl value={epsilon} onChange={(value) => { setEpsilon(value); if (!exploring) setFeedback(null); }} />}
    </section>
    <button className="panel-action secondary" type="button" onClick={onNext}>דילוג על ההיכרות</button>
  </>} plots={<SequencePlot id="linear" n={n} domain={UNIT_INTERVAL} view={{ left: 0, right: 1 }} epsilon={step > 0 ? epsilon : null}
    showLimit={showLimit || exploring} probeX={x} onProbeChange={(value) => { setX(value); if (step === 0) setFeedback(null); }} probeLabel="נקודה קבועה" />}
  task={exploring ? <TaskCard step="חקירה חופשית" title="נסו רצועה צרה יותר">
    <p>שנו את הנקודה ואת רוחב הרצועה. אותו חסם מתאים לכל הנקודות.</p>
    <MathText block math="\sup_{x\in[0,1]}|f_n(x)|=\frac1n\longrightarrow0" />
    <ExploreActions onNext={onNext} onGuided={() => { setExploring(false); setFeedback(null); }} />
  </TaskCard> : <TaskCard step={`היכרות · ${step + 1} מתוך 2`} title={step === 0 ? "לאן מתקרבים בנקודה קבועה?" : "הכניסו את כל הגרף לרצועה"}>
    {step === 0 ? <Choice label="התחזית שלכם" value={answer} onChange={(value) => { setAnswer(value); setFeedback(null); }} options={[
      { value: "zero", label: <MathText math="0" /> }, { value: "point", label: <MathText math="x_0" /> }, { value: "none", label: "אין גבול סופי" },
    ]} /> : <p>הגדילו את האינדקס ובדקו אם כל הערכים קרובים לאפס.</p>}
    <FeedbackBox feedback={feedback} />
    {!finished && <div className="convergence-actions">
      <button type="button" className="panel-action" onClick={check}>בדיקה</button>
      <button type="button" className="panel-action secondary" onClick={reveal}>הצג תשובה לשלב</button>
    </div>}
    {step === 0 && (feedback?.status === "correct" || feedback?.status === "revealed") &&
      <button type="button" className="panel-action" onClick={() => { setStep(1); setFeedback(null); }}>ומה קורה בכל התחום?</button>}
    {finished && <div className="convergence-actions">
      <button type="button" className="panel-action" onClick={onNext}>להמשך המסלול</button>
      <button type="button" className="panel-action secondary" onClick={() => setExploring(true)}>חקירה חופשית</button>
    </div>}
    <Hints key={step} hints={[step === 0 ? "השאירו את הנקודה במקומה והגדילו את האינדקס." : <>בדקו את הקצה <MathText math="x=1" />.</>]} />
  </TaskCard>} />;
}

export function OscillationActivity({ onComplete, onNext }: LessonProps) {
  const [n, setN] = useState(1);
  const [x, setX] = useState(1);
  const [epsilon, setEpsilon] = useState(0.25);
  const [center, setCenter] = useState(0);
  const [radius, setRadius] = useState(4);
  const [answer, setAnswer] = useState<ConvergenceKind | "">("");
  const [predicted, setPredicted] = useState(false);
  const [envelope, setEnvelope] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [exploring, setExploring] = useState(false);
  const finished = feedback?.status === "correct" || feedback?.status === "revealed";
  const explanation = <>התנודות מצטופפות, אבל הגובה שלהן קטן בכל התחום: <MathText math="|f_n(x)|\le1/n" />.</>;
  function check(reveal = false) {
    if (reveal || answer === "uniform") {
      setFeedback({ status: reveal ? "revealed" : "correct", content: explanation });
      setEnvelope(true);
      onComplete();
    } else setFeedback({ status: "wrong", content: "בדקו את גובה התנודות, לא את מספרן. אפשר להציג את המעטפת." });
  }
  return <LabWorkspace controls={<>
    <IndexControl n={n} onChange={setN} />
    <section className="panel-section">
      <NumberControl label={<>נקודה קבועה <MathText math="x_0" /></>} value={x} min={-512} max={512} onChange={setX} />
      <EpsilonControl value={epsilon} onChange={setEpsilon} />
      <label className="convergence-toggle"><input type="checkbox" checked={envelope} onChange={(event) => setEnvelope(event.target.checked)} />הצגת מעטפת התנודות</label>
      {envelope && <MathText math="-1/n\le f_n(x)\le1/n" />}
    </section>
    <section className="panel-section">
      <h3>חלון התצוגה בלבד</h3>
      <div className="convergence-view-controls">
        <NumberControl label="מרכז" value={center} min={-100} max={100} onChange={setCenter} />
        <NumberControl label="חצי רוחב" value={radius} min={0.1} max={20} onChange={setRadius} />
      </div>
      <p className="convergence-muted">התחום נשאר כל הישר.</p>
    </section>
  </>} plots={<SequencePlot id="oscillation" n={n} domain={REAL_LINE} view={{ left: center - radius, right: center + radius }} epsilon={predicted || exploring ? epsilon : null}
    showLimit={predicted || exploring} probeX={x} onProbeChange={setX} probeLabel="נקודה קבועה" envelope={envelope} />}
  task={exploring ? <TaskCard step="חקירה חופשית" title="גם רחוק מהראשית">
    <p>שנו את החלון ואת הרצועה. החסם אינו תלוי בנקודה שבחרתם.</p>
    <MathText block math="\sup_{x\in\mathbb R}|f_n(x)|=\frac1n\longrightarrow0" />
    <ExploreActions onNext={onNext} onGuided={() => setExploring(false)} />
  </TaskCard> : <TaskCard step={predicted ? "תנודות · בדיקת התחזית" : "תנודות · תחזית"} title={predicted ? "התנודות מצטופפות. מה קורה לגובה?" : "מה יקרה בכל הישר?"}>
    <Choice label="סוג ההתכנסות" value={answer} options={CLASSIFICATIONS} onChange={(value) => { setAnswer(value); setFeedback(null); }} />
    <FeedbackBox feedback={feedback} />
    {!predicted ? <button type="button" className="panel-action" disabled={!answer} onClick={() => setPredicted(true)}>שמירת התחזית וחקירה</button> : <>
      {!finished && <div className="convergence-actions">
        <button type="button" className="panel-action" onClick={() => check()}>בדיקת התחזית</button>
        <button type="button" className="panel-action secondary" onClick={() => check(true)}>הצג תשובה לשלב</button>
      </div>}
      <Hints hints={["הציגו את המעטפת. האם היא תלויה במיקום?", <>לכל <MathText math="x" /> מתקיים <MathText math="|\sin(nx)|\le1" />.</>]} />
    </>}
    {finished && <div className="convergence-actions">
      <button type="button" className="panel-action" onClick={onNext}>לאתגר השגיאה המסתתרת</button>
      <button type="button" className="panel-action secondary" onClick={() => setExploring(true)}>חקירה חופשית</button>
    </div>}
  </TaskCard>} />;
}
