"use client";

import { useRef, useState } from "react";
import { WarmupActivity, OscillationActivity } from "./SimpleConvergenceActivities";
import { PowerConvergenceActivity } from "./PowerConvergenceActivity";
import { PairedConvergenceActivity } from "./PairedConvergenceActivity";
import { MathText } from "./MathText";

type Lesson = "warmup" | "power" | "oscillation" | "pair";
const LESSONS: { id: Lesson; label: string }[] = [
  { id: "warmup", label: "היכרות קצרה" },
  { id: "power", label: "אותה סדרה, תחום אחר" },
  { id: "oscillation", label: "תנודות מתכווצות" },
  { id: "pair", label: "איפה מסתתרת השגיאה?" },
];

export function ConvergenceLab() {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [challenge, setChallenge] = useState(false);
  const [completed, setCompleted] = useState<Lesson[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  function open(id: Lesson, harder = false) {
    setChallenge(harder);
    setLesson(id);
    heading.current?.focus();
  }
  function complete(id: Lesson) {
    setCompleted((current) => current.includes(id) ? current : [...current, id]);
  }
  return <div className="convergence-lab">
    <header className="convergence-heading">
      <h2 ref={heading} tabIndex={-1}>התכנסות נקודתית ובמידה שווה</h2>
      <p className="convergence-muted">בחרו נקודה, שנו את האינדקס ובדקו מה קורה על כל התחום.</p>
    </header>
    {lesson === null ? <section className="module-intro-card convergence-entry">
      <h3>מתקרבים — אבל באיזה מובן?</h3>
      <p>מסלול קצר של תחזיות וניסויים, עם מקום לחקירה חופשית.</p>
      <div className="convergence-actions">
        <button className="panel-action" type="button" onClick={() => open("warmup")}>תחילת המסלול</button>
        <button className="panel-action secondary" type="button" onClick={() => open("power")}>דילוג על ההיכרות</button>
        <button className="panel-action secondary" type="button" onClick={() => open("pair", true)}>התחלה באתגר</button>
      </div>
      <details className="convergence-proof">
        <summary>תזכורת קצרה</summary>
        <p>נקודתית: מקבעים <MathText math="x" /> ובודקים גבול. במידה שווה: מאינדקס מסוים, כל הגרפים נשארים ברצועה סביב הגבול, בכל התחום.</p>
        <p><MathText math="\forall\varepsilon>0\ \exists N\ \forall n>N\ \forall x\in D:\ |f_n(x)-f(x)|<\varepsilon" /></p>
      </details>
    </section> : <>
      <nav className="convergence-lesson-nav" aria-label="מסלול החקירה">
        {LESSONS.map((item) => <button key={item.id} type="button" aria-current={lesson === item.id ? "step" : undefined} onClick={() => open(item.id)}>
          {item.label}{completed.includes(item.id) && <span aria-label="הושלם"> · הושלם</span>}
        </button>)}
        <button type="button" onClick={() => { setLesson(null); heading.current?.focus(); }}>בחירת מסלול</button>
      </nav>
      {lesson === "warmup" && <WarmupActivity onComplete={() => complete("warmup")} onNext={() => open("power")} />}
      {lesson === "power" && <PowerConvergenceActivity onComplete={() => complete("power")} onNext={() => open("oscillation")} />}
      {lesson === "oscillation" && <OscillationActivity onComplete={() => complete("oscillation")} onNext={() => open("pair")} />}
      {lesson === "pair" && <PairedConvergenceActivity key={challenge ? "challenge" : "guided"} challenge={challenge} onComplete={() => complete("pair")}
        onNext={() => {
          const next = LESSONS.find((item) => item.id !== "pair" && item.id !== "warmup" && !completed.includes(item.id));
          if (next) open(next.id); else setLesson(null);
        }} />}
    </>}
  </div>;
}
