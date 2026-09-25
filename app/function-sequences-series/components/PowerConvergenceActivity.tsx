"use client";

import { useState } from "react";
import { classifyConvergence, limitLatex, type ConvergenceKind, type Interval } from "../math/convergence";
import { MathText } from "./MathText";
import { SequencePlot } from "./SequencePlot";
import {
  Choice, CLASSIFICATIONS, EpsilonControl, ExploreActions, FeedbackBox, Hints,
  IndexControl, LabWorkspace, NumberControl, TaskCard, type Feedback, type LessonProps,
} from "./ConvergenceUI";

const ENDPOINTS = [0.5, 1, 2];

function PowerExplanation({ right, closed }: { right: number; closed: boolean }) {
  if (right < 1) return <>
    <p>כל הגרף נצמד לאפס, עם חסם משותף לכל הנקודות.</p>
    <MathText block math={`0\\le x^n\\le ${right}^n\\longrightarrow0`} />
  </>;
  if (right > 1) return <p>בנקודות שבהן <MathText math="x>1" /> הערכים גדלים ללא גבול. אין גבול ממשי סופי בכל התחום.</p>;
  return <>
    <p>{closed ? <>בקצה <MathText math="f(1)=1" />, ולכן השגיאה שם אפס. ממש משמאל לקצה היא יכולה להיות קרובה לאחד.</> : "גם בלי הקצה אפשר להתקרב אליו כרצוננו. הוצאתו אינה מתקנת את ההתכנסות."}</p>
    <MathText block math={`\\sup_{x\\in[0,1${closed ? "]" : ")"}}|x^n-f(x)|=1`} />
    <p>הסופרמום אינו מתקבל באף נקודה.</p>
  </>;
}

export function PowerConvergenceActivity({ onComplete, onNext }: LessonProps) {
  const [step, setStep] = useState(0);
  const [n, setN] = useState(1);
  const [probe, setProbe] = useState(0.4);
  const [answer, setAnswer] = useState<ConvergenceKind | "">("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [predicted, setPredicted] = useState(false);
  const [exploring, setExploring] = useState(false);
  const [right, setRight] = useState(1);
  const [closed, setClosed] = useState(true);
  const [epsilon, setEpsilon] = useState(0.25);
  const b = exploring ? right : ENDPOINTS[step];
  const domain: Interval = { left: 0, right: b, leftClosed: true, rightClosed: exploring ? closed : true };
  const kind = classifyConvergence("power", domain);
  const finished = feedback?.status === "correct" || feedback?.status === "revealed";
  function check(reveal = false) {
    if (reveal || answer === kind) {
      setFeedback({ status: reveal ? "revealed" : "correct", content: <PowerExplanation right={b} closed={domain.rightClosed} /> });
      if (step === 2) onComplete();
    } else {
      const message = b < 1 ? "בדקו את הערך הגדול ביותר: הוא מתקבל בקצה הימני."
        : b === 1 && answer === "fails-pointwise" ? "בדקו את הקצה בנפרד: שם כל האיברים שווים לאחד."
        : b === 1 ? "הגדילו את האינדקס ובחרו נקודה חדשה קרובה יותר לקצה."
        : "בחרו נקודה גדולה מאחד ובדקו אם הערכים מתקרבים למספר סופי.";
      setFeedback({ status: "wrong", content: message });
    }
  }
  function nextDomain() {
    setStep(step + 1); setN(1); setAnswer(""); setFeedback(null); setPredicted(false);
  }
  return <LabWorkspace controls={<>
    <IndexControl n={n} onChange={setN} />
    <section className="panel-section">
      <NumberControl label={<>נקודת בדיקה (<MathText math="x_0" />)</>} value={probe} min={0} max={2} onChange={setProbe} />
      <EpsilonControl value={epsilon} onChange={setEpsilon} />
      <p className="convergence-muted">הנקודה נשארת קבועה כשמשנים את האינדקס.</p>
    </section>
    {exploring && <section className="panel-section">
      <h3>התחום המתמטי</h3>
      <NumberControl label={<>קצה ימני <MathText math="b" /></>} value={right} min={0.1} max={2} onChange={setRight} />
      <div className="convergence-actions">
        {[0.5, 1, 2].map((value) => <button key={value} type="button" className="panel-action secondary" onClick={() => setRight(value)}><MathText math={`b=${value}`} /></button>)}
      </div>
      <label className="convergence-toggle"><input type="checkbox" checked={closed} onChange={(event) => setClosed(event.target.checked)} />הכללת הקצה הימני</label>
    </section>}
  </>} plots={<SequencePlot id="power" n={n} domain={domain} view={{ left: 0, right: 2 }} powerContext epsilon={finished || exploring ? epsilon : null}
    showLimit={finished || exploring} probeX={probe} onProbeChange={setProbe} />}
  task={exploring ? <TaskCard step="חקירה חופשית" title="האם הוצאת הקצה מספיקה?">
    <p>השוו בין קצה קטן מאחד לבין קצה שאינו כלול בתחום.</p>
    <p>{CLASSIFICATIONS.find((option) => option.value === kind)?.label}</p>
    <details className="convergence-proof"><summary>למה?</summary><PowerExplanation right={b} closed={closed} /></details>
    <ExploreActions onNext={onNext} onGuided={() => setExploring(false)} />
  </TaskCard> : <TaskCard step={`שינוי התחום · ${step + 1} מתוך 3`} title={step === 0 ? "מה יקרה בקטע הקטן?" : "הרחבנו את התחום. מה ישתנה?"}>
    <MathText block math={`D=[0,${b}]`} />
    <Choice label="סוג ההתכנסות" value={answer} options={CLASSIFICATIONS} onChange={(value) => { setAnswer(value); setFeedback(null); }} />
    {!predicted ? <button type="button" className="panel-action" disabled={!answer} onClick={() => setPredicted(true)}>שמירת התחזית וחקירה</button> : <>
      <p className="convergence-muted">שנו את האינדקס ובדקו נקודות לפני הכרעה.</p>
      {!finished && <div className="convergence-actions">
        <button type="button" className="panel-action" onClick={() => check()}>בדיקת התחזית</button>
        <button type="button" className="panel-action secondary" onClick={() => check(true)}>הצג תשובה לשלב</button>
      </div>}
    </>}
    <FeedbackBox feedback={feedback} />
    {finished && <>
      {kind !== "fails-pointwise" && <MathText block math={limitLatex("power", domain)} />}
      {step < 2 ? <button type="button" className="panel-action" onClick={nextDomain}>הרחבת התחום</button> : <div className="convergence-actions">
        <button type="button" className="panel-action" onClick={onNext}>להמשך המסלול</button>
        <button type="button" className="panel-action secondary" onClick={() => setExploring(true)}>חקירה חופשית</button>
      </div>}
    </>}
    <Hints key={step} hints={[step === 0 ? "השוו את כל הערכים לערך בקצה הימני." : step === 1 ? "בדקו את הקצה וגם נקודות קרובות אליו." : "בדקו נקודה שנוספה לתחום."]} />
  </TaskCard>} />;
}
