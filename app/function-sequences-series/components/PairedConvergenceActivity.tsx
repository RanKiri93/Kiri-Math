"use client";

import { useState, type ReactNode } from "react";
import { classifyConvergence, intervalLatex } from "../math/convergence";
import {
  checkEscape, isPersistentWitness, REPAIR_CHOICES, repairedDomain, trackingPoint,
  type PairId, type RepairDomain, type TrackingRule,
} from "../math/convergenceActivity";
import {
  Choice, CLASSIFICATIONS, ExploreActions, FeedbackBox, Hints,
  LabWorkspace, LimitPrediction, NumberControl, SliderPanel, TaskCard, type Feedback, type LessonProps,
} from "./ConvergenceUI";
import { MathText } from "./MathText";
import { SequencePlot, type PlotWindow } from "./SequencePlot";

const IDS: PairId[] = ["near", "far"];
const SYMBOLS = { near: "f_n", far: "g_n" };
const RULES: { value: TrackingRule; label: ReactNode }[] = [
  { value: "fixed", label: <MathText math="x_0" /> },
  { value: "reciprocal", label: <MathText math="1/n" /> },
  { value: "index", label: <MathText math="n" /> },
];
const PAIR_FORMULA = <div className="convergence-formula-card">
  <div className="convergence-formula-pair" dir="ltr">
    <MathText block math="f_n(x)=\frac{nx}{1+n^2x^2}," />
    <MathText block math="g_n(x)=\frac{x^2}{n^2+x^2}," />
    <MathText block math="x\ge0" />
  </div>
</div>;
const VIEW_RIGHTS =[0.025, 0.1, 0.5, 1, 4, 16, 64, 256, 512];
const DOMAIN_OPTIONS: { value: RepairDomain; label: string }[] = [
  { value: "full", label: "התחום המקורי" },
  { value: "away", label: "מרחק חיובי מאפס" },
  { value: "bounded", label: "קצה ימני סופי" },
  { value: "open", label: "הוצאת אפס בלבד" },
];

export function PairedConvergenceActivity({ challenge, onComplete }: LessonProps & { challenge: boolean }) {
  const [stage, setStage] = useState(challenge ? 1 : 0);
  const [guided, setGuided] = useState(!challenge);
  const [n, setN] = useState(challenge ? 16 : 1);
  const [epsilon, setEpsilon] = useState(0.25);
  const [fixed, setFixed] = useState<Record<PairId, number>>({ near: 1, far: 1 });
  const [rules, setRules] = useState<Record<PairId, TrackingRule>>({ near: "fixed", far: "fixed" });
  const [domains, setDomains] = useState<Record<PairId, RepairDomain>>({ near: "full", far: "full" });
  // Guided last step: index into REPAIR_CHOICES per sequence ("" until chosen).
  const [picked, setPicked] = useState<Record<PairId, string>>({ near: "", far: "" });
  const [views, setViews] = useState<Record<PairId, PlotWindow>>({ near: { left: 0, right: 4 }, far: { left: 0, right: 4 } });
  const [delta, setDelta] = useState(0.5);
  const [bound, setBound] = useState(4);
  const [prediction, setPrediction] = useState("");
  const [contradiction, setContradiction] = useState("");
  const [trackingSolved, setTrackingSolved] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [exploring, setExploring] = useState(false);
  const finished = feedback?.status === "correct" || feedback?.status === "revealed";
  const showLimit = stage > 0 || finished || exploring;
  const showRules = stage === 2 || exploring;
  const showDomains = stage >= 3 || exploring;
  const guidedDomains = showDomains && !exploring;
  // After the moving points are found, stage 3 asks a follow-up question as a visible sub-step.
  const followUp = !exploring && stage === 2 && trackingSolved;
  const currentDomain = (id: PairId) => guidedDomains && picked[id] !== ""
    ? REPAIR_CHOICES[id][Number(picked[id])]
    : repairedDomain(showDomains && !guidedDomains ? domains[id] : "full", delta, bound);
  const currentPoint = (id: PairId) => trackingPoint(showRules ? rules[id] : "fixed", n, fixed[id]);

  function changeN(value: number) {
    setN(value);
    if (stage === 1) setFeedback(null);
  }
  function changeFixed(id: PairId, value: number) {
    setFixed((current) => ({ ...current, [id]: value }));
    setRules((current) => ({ ...current, [id]: "fixed" }));
    if (!exploring) {
      setFeedback(null);
      if (stage === 2) setTrackingSolved(false);
    }
  }
  function nextStage() {
    setStage(stage + 1); setFeedback(null);
    if (stage === 0) setN(8);
    if (stage === 1) setN(Math.min(256, n * 2));
    if (stage === 2) {
      setDomains({ near: "full", far: "full" });
      setRules({ near: "fixed", far: "fixed" });
      setPicked({ near: "", far: "" });
    }
  }
  function check(reveal = false) {
    if (stage === 0) {
      const correct = prediction === "zero";
      if (correct || reveal) {
        if (reveal) setPrediction("zero");
        setFeedback({ status: reveal ? "revealed" : "correct", content: "בשתי הסדרות, בכל נקודה קבועה הגבול הוא אפס." });
      } else setFeedback({ status: "wrong", content: prediction ? "השאירו את הנקודה קבועה והגדילו את האינדקס. הגובה אינו נשאר קבוע." : "בחרו תחזית לפני הבדיקה." });
      return;
    }
    if (stage === 1) {
      if (reveal) {
        setFixed({ near: 1 / n, far: n });
        setFeedback({ status: "revealed", content: <>בנקודות אלו הערך הוא <MathText math="1/2" />. מה יקרה כשנגדיל שוב את האינדקס?</> });
        return;
      }
      const results = IDS.map((id) => checkEscape(id, n, fixed[id], currentDomain(id), epsilon));
      const missing = results.findIndex((result) => result !== "escape");
      if (missing < 0) setFeedback({ status: "correct", content: "מצאתם חריגה בשתי הסדרות באינדקס הנוכחי. האם זה יקרה בכל אינדקס?" });
      else setFeedback({ status: "wrong", content: <>בסדרה <MathText math={SYMBOLS[IDS[missing]]} /> {results[missing] === "outside-domain" ? "הנקודה אינה בתחום." : "הנקודה עדיין בתוך הרצועה. נסו מיקום אחר."}</> });
      return;
    }
    if (stage === 2 && !trackingSolved) {
      if (reveal || IDS.every((id) => isPersistentWitness(id, rules[id]))) {
        if (reveal) setRules({ near: "reciprocal", far: "index" });
        setTrackingSolved(true); setContradiction("");
        setFeedback({ status: reveal ? "revealed" : "correct", content: <>לכל אינדקס, שתי הנקודות נשארות מחוץ לרצועה: <MathText math="f_n(1/n)=g_n(n)=1/2" />. עכשיו ענו על שאלת ההמשך.</> });
      } else setFeedback({ status: "wrong", content: "חריגה באינדקס אחד אינה מספיקה. בדקו איזה כלל שומר על הגובה כשמגדילים את האינדקס." });
      return;
    }
    if (stage === 2) {
      if (reveal || contradiction === "no") {
        if (reveal) setContradiction("no");
        setFeedback({ status: reveal ? "revealed" : "correct", content: "כאשר בודקים התכנסות נקודתית, אנחנו מקבעים את הערך של הנקודה. היות וכאן הנקודה משתנה עם כל אינדקס, אין סתירה להגדרה של התכנסות נקודתית. יחד עם זאת, כן מקבלים הוכחה שהסדרות אינן מתכנסות במידה שווה בתחום." });
      } else setFeedback({ status: "wrong", content: "האם עקבתם אחרי אותה נקודה לאורך כל הסדרה?" });
      return;
    }
    if (!reveal && IDS.some((id) => picked[id] === "")) {
      setFeedback({ status: "wrong", content: "בחרו תחום לכל אחת מהסדרות לפני הבדיקה." });
      return;
    }
    if (reveal || IDS.every((id) => classifyConvergence(id, currentDomain(id)) === "uniform")) {
      // Reveal the single correct choice of each list: [1,∞) for f_n, [0,1] for g_n.
      if (reveal) setPicked({ near: "2", far: "0" });
      setFeedback({ status: reveal ? "revealed" : "correct", content: <>
        בראשונה מתרחקים מאפס; בשנייה מגבילים את ההתרחקות לאינסוף. בשני התחומים החדשים ההתכנסות במידה שווה.
        {" "}<strong>למעשה, ניתן להחליף את <MathText math="1" /> בכל מספר חיובי</strong>: <MathText math="f_n" /> מתכנסת במידה שווה בכל תחום <MathText math="[\delta,\infty)" /> עם <MathText math="\delta>0" />, ו־<MathText math="g_n" /> בכל תחום <MathText math="[0,M]" /> עם <MathText math="M>0" />.
      </> });
      onComplete();
    } else {
      const wrongId = IDS.find((id) => classifyConvergence(id, currentDomain(id)) !== "uniform")!;
      const wrongDomain = currentDomain(wrongId);
      setFeedback({ status: "wrong", content: <>
        בסדרה <MathText math={SYMBOLS[wrongId]} /> {wrongId === "near" && wrongDomain.left === 0 && !wrongDomain.leftClosed
          ? <>הנקודה <MathText math="1/n" /> עדיין בתחום, גם בלי אפס.</>
          : wrongId === "near" ? "עדיין אפשר להתקרב לאפס כרצוננו." : "עדיין אפשר להתרחק ימינה כרצוננו."}
      </> });
    }
  }

  const titles = ["מה יקרה בנקודה קבועה?", "האם נשארת נקודה מחוץ לרצועה?", "מצאו נקודה שתנוע עם האינדקס", "שנו את התחום כדי לקבל התכנסות במידה שווה"];
  const hints = stage === 0 ? ["קבעו נקודה חיובית ובדקו מה קורה כשהאינדקס גדל."]
    : stage === 1 ? [<>שנו את <MathText math="x" />, לא את <MathText math="n" />.</>, <>ב־<MathText math="f_n" /> נסו <MathText math="x" /> קטן; ב־<MathText math="g_n" /> נסו <MathText math="x" /> גדול.</>]
    : followUp ? ["בהתכנסות נקודתית מקבעים נקודה אחת. האם הנקודות שמצאתם קבועות?"]
    : stage === 2 ? ["חפשו כלל שמשנה את המיקום, אבל לא את הגובה.", "כיוון התנועה אינו זהה בשתי הסדרות."]
    : ["איזו דרך מילוט של השגיאה נשארת בתחום?"];

  // Per-sequence answer inputs for the current step: fixed point, tracking rule, domain.
  const showPointInputs = ((stage === 1 || stage === 2) && !followUp) || exploring;
  const sequenceInputs = (showPointInputs || showDomains) && <div className="convergence-probe-controls">{IDS.map((id) => <div key={id} className="convergence-sequence-inputs">
    <h4>סדרה <MathText math={SYMBOLS[id]} /></h4>
    {showPointInputs && (!showRules || rules[id] === "fixed") && <NumberControl label={<>נקודה קבועה (<MathText math="x_0" />)</>} value={fixed[id]} min={0} max={512} onChange={(value) => changeFixed(id, value)} />}
    {showRules && <Choice compact label="מיקום הנקודה: קבוע או תלוי באינדקס" value={rules[id]} options={RULES} onChange={(value) => {
      setRules((current) => ({ ...current, [id]: value }));
      if (!exploring && stage === 2) { setTrackingSolved(false); setFeedback(null); setContradiction(""); }
    }} />}
    {guidedDomains && <Choice compact label="התחום" value={picked[id]} onChange={(value) => { setPicked((current) => ({ ...current, [id]: value })); setFeedback(null); }}
      options={REPAIR_CHOICES[id].map((domain, index) => ({ value: String(index), label: <MathText math={intervalLatex(domain)} /> }))} />}
    {showDomains && !guidedDomains && <div className="convergence-control">
      <label>התחום המתמטי
        <select value={domains[id]} onChange={(event) => {
          setDomains((current) => ({ ...current, [id]: event.target.value as RepairDomain }));
          if (!exploring) setFeedback(null);
        }}>{DOMAIN_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      </label>
      <MathText math={`D=${intervalLatex(currentDomain(id))}`} />
    </div>}
  </div>)}</div>;
  const domainParameters = showDomains && !guidedDomains && <div className="convergence-domain-controls">
    <NumberControl label={<>מרחק <MathText math="\delta" /></>} value={delta} min={0.01} max={4} onChange={(value) => { setDelta(value); if (!exploring) setFeedback(null); }} />
    <NumberControl label={<>קצה <MathText math="M" /></>} value={bound} min={0.1} max={64} onChange={(value) => { setBound(value); if (!exploring) setFeedback(null); }} />
  </div>;

  return <LabWorkspace tools={<>
    <SliderPanel n={n} onN={changeN} epsilon={epsilon} onEpsilon={setEpsilon} epsilonEnabled={exploring}
      epsilonLockedHint="במשימה המודרכת רוחב הרצועה קבוע; אפשר לשנות אותו בחקירה החופשית" />
  </>} plots={<>
    {IDS.map((id) => <SequencePlot key={id} id={id} n={n} domain={currentDomain(id)} view={views[id]} epsilon={stage > 0 || exploring ? epsilon : null}
      showLimit={showLimit} probeX={currentPoint(id)}
      onProbeChange={(value) => changeFixed(id, value)} controls={<>
        <div className="convergence-control">
          <label>חלון התצוגה בלבד
            <select dir="ltr" className="convergence-number" value={views[id].right} onChange={(event) => setViews((current) => ({ ...current, [id]: { left: 0, right: Number(event.target.value) } }))}>
              {VIEW_RIGHTS.map((value) => <option key={value} value={value}>0 — {value}</option>)}
            </select>
          </label>
        </div>
        {showRules && currentPoint(id) > views[id].right && <button className="panel-action secondary" type="button" onClick={() => {
          const right = VIEW_RIGHTS.find((value) => value > currentPoint(id)) ?? 512;
          setViews((current) => ({ ...current, [id]: { left: 0, right } }));
        }}>הצגת הנקודה בחלון</button>}
      </>} />)}
  </>} task={exploring ? <TaskCard step="חקירה חופשית" title="מה תשנו עכשיו?" response={<>
    {IDS.map((id) => <div key={id} className="result-card">
      <MathText math={SYMBOLS[id]} />: {CLASSIFICATIONS.find((option) => option.value === classifyConvergence(id, currentDomain(id)))?.label}
    </div>)}
    <details className="convergence-proof"><summary>למה?</summary>
      <p>כאשר <MathText math="\delta>0" /> ו־<MathText math="M<\infty" /> קבועים:</p>
      <MathText block math="\sup_{x\ge\delta}|f_n(x)|\le\frac1{n\delta}\longrightarrow0" />
      <MathText block math="\sup_{0\le x\le M}|g_n(x)|\le\frac{M^2}{n^2}\longrightarrow0" />
      <p>בכל קבוצה חסומה בציר החיובי, הסדרה השנייה מתכנסת במידה שווה. בקבוצה לא־חסומה הסופרמום הוא אחד.</p>
      <MathText block math="f_n(1/n)=g_n(n)=1/2" />
    </details>
    <ExploreActions onGuided={() => { setExploring(false); setEpsilon(0.25); setFeedback(null); }} />
  </>}>
    {PAIR_FORMULA}
    <p>צמצמו את הרצועה, שנו תחום או חזרו לתחום המקורי.</p>
    {sequenceInputs}
    {domainParameters}
  </TaskCard> : <TaskCard step={`${guided ? "חקירה מודרכת" : "אתגר"} · ${stage + 1} מתוך 4${followUp ? " · שאלת המשך" : ""}`} title={followUp ? "האם זה סותר התכנסות נקודתית?" : titles[stage]} response={<>
    {!(finished && (stage !== 2 || (trackingSolved && contradiction === "no"))) && <div className="convergence-actions">
      <button type="button" className="panel-action" onClick={() => check()}>{stage === 1 ? "בדיקת הנקודות" : "בדיקה"}</button>
      <button type="button" className="panel-action secondary" onClick={() => check(true)}>הצג תשובה לשלב</button>
    </div>}
    <FeedbackBox feedback={feedback} />
    {finished && (stage !== 2 || (trackingSolved && contradiction === "no")) && (stage < 3
      ? <button type="button" className="panel-action" onClick={nextStage}>{stage === 0 ? "בדיקת כל התחום" : stage === 1 ? "חיפוש חוקיות כללית" : "שינוי התחום"}</button>
      : <>
        <details className="convergence-proof"><summary>החסמים שמסבירים את התוצאה</summary>
          <MathText block math="x\ge\delta:\ |f_n(x)|\le\frac1{n\delta}\longrightarrow0" />
          <MathText block math="0\le x\le M:\ |g_n(x)|\le\frac{M^2}{n^2}\longrightarrow0" />
        </details>
        <div className="convergence-actions">
          <button type="button" className="panel-action" onClick={() => setExploring(true)}>חקירה חופשית</button>
        </div>
      </>)}
    <Hints key={`${stage}-${trackingSolved}`} hints={hints} />
    {stage === 0 && finished && <details className="convergence-proof"><summary>למה הגבול אפס?</summary>
      <p>לכל <MathText math="x_0>0" /> קבוע:</p>
      <MathText block math="f_n(x_0)=\frac1{1/(nx_0)+nx_0}\longrightarrow0" />
      <MathText block math="g_n(x_0)=\frac{x_0^2}{n^2+x_0^2}\longrightarrow0" />
      <p>באפס שתי הסדרות מתאפסות בכל אינדקס.</p>
    </details>}
  </>}>
    {stage <= 1 && PAIR_FORMULA}
    {followUp && <>
      <MathText block math="f_n(1/n)=g_n(n)=\frac12>\frac14" />
      <Choice label="התשובה שלכם" value={contradiction} onChange={(value) => { setContradiction(value); setFeedback(null); }} options={[
        { value: "yes", label: "כן" }, { value: "no", label: "לא — הנקודה משתנה עם האינדקס" },
      ]} />
    </>}
    {stage === 0 && <LimitPrediction label="התחזית בשתי הסדרות" lhs="\lim\limits_{n\to\infty} f_n(x_0)=\lim\limits_{n\to\infty} g_n(x_0)="
      value={prediction} onChange={(value) => { setPrediction(value); setFeedback(null); }} options={[
        { value: "zero", label: <MathText math="0" /> },
        { value: "half", label: <MathText math="1/2" /> },
        { value: "none", label: "אין גבול סופי" },
      ]} />}
    {stage === 1 && <>
      <p>שתיהן מתכנסות נקודתית לאפס. קבעו <MathText math="n" />, ואז מצאו נקודה מחוץ לרצועה בכל גרף.</p>
      {guided && <p className="convergence-muted">הקלידו מיקום כאן או לחצו על נקודה בגרף. שינוי החלון אינו משנה את התחום.</p>}
      {challenge && <button type="button" className="panel-action secondary" onClick={() => { setStage(0); setFeedback(null); setGuided(true); }}>בדיקה בנקודה קבועה</button>}
    </>}
    {stage === 2 && !followUp && guided && <p>בחרו <MathText math="x_n" /> לכל סדרה, ואז הגדילו את <MathText math="n" />.</p>}
    {stage === 3 && <>
      <p>בחרו תחום קבוע לכל סדרה, ואז הגדילו את <MathText math="n" />.</p>
      {guided && <p className="convergence-muted">נסו לחסום את כיוון התנועה של הנקודה שהשגיאה בה נשארה גדולה.</p>}
    </>}
    {sequenceInputs}
    {domainParameters}
  </TaskCard>} />;
}
