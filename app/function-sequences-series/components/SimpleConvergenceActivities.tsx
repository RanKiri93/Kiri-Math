"use client";

import { useState, type ReactNode } from "react";
import { REAL_LINE } from "../math/convergenceActivity";
import { MathText } from "./MathText";
import { SequencePlot } from "./SequencePlot";
import {
  Choice, CLASSIFICATIONS, ExploreActions, FeedbackBox, Hints,
  LabWorkspace, LimitPrediction, NumberControl, SliderPanel, TaskCard, type Feedback, type LessonProps,
} from "./ConvergenceUI";
import type { ConvergenceKind, Interval, SequenceId } from "../math/convergence";

type WarmupFamily = { id: SequenceId; label: string; formula: string; domain: Interval; probe: number; limit: string; error: (n: number) => number; errorLatex: string };

const WARMUP_FAMILIES: WarmupFamily[] = [
  { id: "linear", label: "ישר דועך", formula: "\\frac{x}{n}", domain: { left: 0, right: 1, leftClosed: true, rightClosed: true }, probe: 0.75, limit: "0", error: (n) => 1 / n, errorLatex: "\\frac1n" },
  { id: "shifted-oscillation", label: "תנודות סביב הישר", formula: "x+\\frac{\\sin(nx)}{n}", domain: { left: -0.5, right: 0.5, leftClosed: true, rightClosed: true }, probe: 0.25, limit: "x_0", error: (n) => 1 / n, errorLatex: "\\frac1n" },
  { id: "power", label: "חזקה דועכת", formula: "x^n", domain: { left: 0, right: 0.5, leftClosed: true, rightClosed: true }, probe: 0.25, limit: "0", error: (n) => 0.5 ** n, errorLatex: "\\left(\\frac12\\right)^n" },
];

export function WarmupActivity({ onComplete }: LessonProps) {
  const [familyId, setFamilyId] = useState<SequenceId>("linear");
  const picker = <Choice label="בחרו סדרה" value={familyId} onChange={setFamilyId} compact options={WARMUP_FAMILIES.map(({ id, label }) => ({ value: id, label }))} />;
  return <WarmupExample key={familyId} family={WARMUP_FAMILIES.find(({ id }) => id === familyId)!} picker={picker} onComplete={onComplete} />;
}

function WarmupExample({ family, picker, onComplete }: LessonProps & { family: WarmupFamily; picker: ReactNode }) {
  const [n, setN] = useState(1);
  const [x, setX] = useState(family.probe);
  const [epsilon, setEpsilon] = useState(0.25);
  const [band, setBand] = useState(false);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [exploring, setExploring] = useState(false);
  const expectedAnswer = family.id === "shifted-oscillation" ? "point" : "zero";
  const finished = band && (feedback?.status === "correct" || feedback?.status === "revealed");
  function check() {
    if (!band) {
      setFeedback((answer === expectedAnswer || (x === 0 && (answer === "zero" || answer === "point")))
        ? { status: "correct", content: <>בנקודה הקבועה הגבול הוא <MathText math={family.limit} />.</> }
        : { status: "wrong", content: !answer ? "בחרו תחזית לפני הבדיקה." : family.id === "shifted-oscillation" ? "התוספת המתנודדת מתקרבת לאפס. מה נשאר?" : family.id === "power" ? "הנקודה קבועה בין אפס לחצי. מה קורה לחזקות שלה?" : "הנקודה נשארת קבועה והמכנה גדל. נסו שוב." });
      if (answer === expectedAnswer || (x === 0 && (answer === "zero" || answer === "point"))) onComplete();
    } else if (family.error(n) < epsilon) {
      setFeedback({ status: "correct", content: <>כל הגרף בתוך הרצועה, כי השגיאה חסומה על ידי <MathText math={family.errorLatex} />.</> });
      onComplete();
    } else {
      setFeedback({ status: "wrong", content: <>החסם <MathText math={family.errorLatex} /> עדיין אינו קטן מ־<MathText math="\varepsilon" />. הגדילו את האינדקס.</> });
    }
  }
  function reveal() {
    if (!band) setAnswer(expectedAnswer);
    setFeedback({ status: "revealed", content: !band
      ? <MathText math={family.id === "shifted-oscillation" ? "x_0+\\frac{\\sin(nx_0)}n\\longrightarrow x_0" : family.id === "power" ? "x_0^n\\longrightarrow0\\quad(0\\le x_0\\le\\frac12)" : "\\frac{x_0}{n}\\longrightarrow0"} />
      : <>השגיאה חסומה על ידי <MathText math={family.errorLatex} />; הגדילו את <MathText math="n" /> עד שהחסם קטן מ־<MathText math="\varepsilon" />.</> });
    onComplete();
  }
  return <LabWorkspace tools={<>
    <SliderPanel n={n} onN={(value) => { setN(value); if (band) setFeedback(null); }}
      point={{ value: x, min: family.domain.left, max: family.domain.right, onChange: (value) => { setX(value); setFeedback(null); } }}
      epsilon={epsilon} epsilonEnabled={band || exploring} epsilonLockedHint="רוחב הרצועה ייפתח בבדיקת הרצועה"
      onEpsilon={(value) => { setEpsilon(value); if (!exploring) setFeedback(null); }} />
  </>} plots={<SequencePlot id={family.id} n={n} domain={family.domain} view={{ left: family.domain.left, right: family.domain.right }} epsilon={band || exploring ? epsilon : null}
    showLimit={band || exploring || feedback?.status === "correct" || feedback?.status === "revealed"} probeX={x} onProbeChange={(value) => { setX(value); setFeedback(null); }} />}
  task={exploring ? <TaskCard step="חקירה חופשית" title="שנו את האינדקס והרצועה" response={<ExploreActions onGuided={() => { setExploring(false); setFeedback(null); }} />}>
    {picker}
    <div className="convergence-formula-card"><MathText block math={`f_n(x)=${family.formula},\\quad x\\in[${family.domain.left},${family.domain.right}]`} /></div>
    <p>בדקו כיצד הגרף מתקרב לגבול.</p>
  </TaskCard> : <TaskCard step="היכרות" title={band ? "הכניסו את הגרף לרצועה" : "מהו הגבול בנקודה קבועה?"} response={<>
    {!finished && <div className="convergence-actions">
      <button type="button" className="panel-action" onClick={check}>בדיקה</button>
      <button type="button" className="panel-action secondary" onClick={reveal}>הצג תשובה לשלב</button>
    </div>}
    <FeedbackBox feedback={feedback} />
    {!band && (feedback?.status === "correct" || feedback?.status === "revealed") && <div className="convergence-actions">
      <button type="button" className="panel-action" onClick={() => { setBand(true); setFeedback(null); }}>בדיקת הרצועה (רשות)</button>
      <button type="button" className="panel-action secondary" onClick={() => setExploring(true)}>חקירה חופשית</button>
    </div>}
    {finished && <div className="convergence-actions">
      <button type="button" className="panel-action secondary" onClick={() => setExploring(true)}>חקירה חופשית</button>
    </div>}
    {!band && <Hints hints={["השאירו את הנקודה במקומה והגדילו את האינדקס."]} />}
  </>}>
    {picker}
    <div className="convergence-formula-card"><MathText block math={`f_n(x)=${family.formula},\\quad x\\in[${family.domain.left},${family.domain.right}]`} /></div>
    {!band ? <>
      <LimitPrediction label="התחזית שלכם" lhs="\lim\limits_{n\to\infty} f_n(x_0)=" value={answer} onChange={(value) => { setAnswer(value); setFeedback(null); }} options={[
        { value: "zero", label: <MathText math="0" /> }, { value: "point", label: <MathText math="x_0" /> }, { value: "none", label: "אין גבול סופי" },
      ]} />
    </> : <p>הגדילו את האינדקס עד שהחסם <MathText math={family.errorLatex} /> קטן מ־<MathText math="\varepsilon" />. כך כל הגרף יהיה בתוך הרצועה.</p>}
  </TaskCard>} />;
}

export function OscillationActivity({ onComplete }: LessonProps) {
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
    } else setFeedback({ status: "wrong", content: "בדקו את גובה התנודות, לא את מספרן. אפשר להציג את המינימום והמקסימום." });
  }
  return <LabWorkspace tools={<>
    <SliderPanel n={n} onN={setN}
      point={{ value: x, min: -512, max: 512, sliderMin: center - radius, sliderMax: center + radius, onChange: setX }}
      epsilon={epsilon} onEpsilon={setEpsilon} epsilonEnabled={predicted || exploring}
      epsilonLockedHint="רוחב הרצועה ייפתח אחרי שמירת התחזית" extra={<>
        <label className="convergence-toggle"><input type="checkbox" checked={envelope} onChange={(event) => setEnvelope(event.target.checked)} />הצגת מינימום ומקסימום</label>
        {envelope && <MathText math="-1/n\le f_n(x)\le1/n" />}
      </>} />
  </>} plots={<SequencePlot id="oscillation" n={n} domain={REAL_LINE} view={{ left: center - radius, right: center + radius }} epsilon={predicted || exploring ? epsilon : null}
    showLimit={predicted || exploring} probeX={x} onProbeChange={setX} envelope={envelope} controls={<>
      <div className="convergence-view-controls">
        <NumberControl label="מרכז החלון" value={center} min={-100} max={100} onChange={setCenter} />
        <NumberControl label="חצי רוחב" value={radius} min={0.1} max={20} onChange={setRadius} />
      </div>
      <p className="convergence-muted">החלון משנה רק את התצוגה. התחום נשאר כל הישר.</p>
    </>} />}
  task={exploring ? <TaskCard step="חקירה חופשית" title="גם רחוק מהראשית" response={<ExploreActions onGuided={() => setExploring(false)} />}>
    {oscillationFormula}
    <p>שנו את החלון ואת הרצועה. החסם אינו תלוי בנקודה שבחרתם.</p>
    <MathText block math="\sup_{x\in\mathbb R}|f_n(x)|=\frac1n\longrightarrow0" />
  </TaskCard> : <TaskCard step={predicted ? "תנודות · בדיקת התחזית" : "תנודות · תחזית"} title={predicted ? "התנודות מצטופפות. מה קורה לגובה?" : "מה יקרה בכל הישר?"} response={<>
    {!predicted ? <button type="button" className="panel-action" disabled={!answer} onClick={() => setPredicted(true)}>שמירת התחזית וחקירה</button> : <>
      {!finished && <div className="convergence-actions">
        <button type="button" className="panel-action" onClick={() => check()}>בדיקת התחזית</button>
        <button type="button" className="panel-action secondary" onClick={() => check(true)}>הצג תשובה לשלב</button>
      </div>}
    </>}
    <FeedbackBox feedback={feedback} />
    {finished && <div className="convergence-actions">
      <button type="button" className="panel-action secondary" onClick={() => setExploring(true)}>חקירה חופשית</button>
    </div>}
    {predicted && <Hints hints={["הציגו את המינימום והמקסימום. האם הם תלויים במיקום?", <>לכל <MathText math="x" /> מתקיים <MathText math="|\sin(nx)|\le1" />.</>]} />}
  </>}>
    {oscillationFormula}
    <Choice label="סוג ההתכנסות" value={answer} options={CLASSIFICATIONS} onChange={(value) => { setAnswer(value); setFeedback(null); }} />
  </TaskCard>} />;
}

const oscillationFormula = <div className="convergence-formula-card"><MathText block math="f_n(x)=\frac{\sin(nx)}{n},\quad x\in\mathbb R" /></div>;
