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
      <details className="convergence-proof" open>
        <summary>התכנסות נקודתית והתכנסות במידה שווה — הגדרות</summary>
        <p>תהי <MathText math="\{f_n\}_{n=1}^{\infty}" /> סדרת פונקציות בקטע <MathText math="I" />.</p>
        <section className="convergence-definition" aria-label="הגדרת התכנסות נקודתית">
          <h4>התכנסות נקודתית</h4>
          <p>הסדרה מתכנסת נקודתית לפונקציה <MathText math="f" /> בנקודה <MathText math="x\in I" /> אם</p>
          <MathText block math="\lim_{n\to\infty}f_n(x)=f(x)" />
          <p>כלומר, לכל <MathText math="\varepsilon>0" /> קיים <MathText math="N\in\mathbb{N}" /> כך שלכל <MathText math="n>N" /> מתקיים</p>
          <MathText block math="|f_n(x)-f(x)|<\varepsilon" />
          <p>הסדרה מתכנסת נקודתית בקטע אם תנאי זה מתקיים בכל נקודה בקטע.</p>
        </section>
        <p>במילים פשוטות: בוחרים ערך קבוע של <MathText math="x" /> ולוקחים גבול כאשר <MathText math="n\to\infty" />, לכל ערך של <MathText math="x" /> בנפרד. האינדקס <MathText math="N" /> יכול להיות שונה מנקודה לנקודה.</p>
        <section className="convergence-definition" aria-label="הגדרת התכנסות במידה שווה">
          <h4>התכנסות במידה שווה</h4>
          <p>הסדרה מתכנסת במידה שווה לפונקציה <MathText math="f" /> בקטע <MathText math="I" /> אם לכל <MathText math="\varepsilon>0" /> קיים <MathText math="N\in\mathbb{N}" /> כך שלכל <MathText math="n>N" /> ולכל <MathText math="x\in I" /> מתקיים</p>
          <MathText block math="|f_n(x)-f(x)|<\varepsilon" />
        </section>
        <p>במילים פשוטות: לכל מידת דיוק שבוחרים, יש אינדקס אחד שמתאים לכל הנקודות בקטע. לכל <MathText math="n>N" />, כל הגרף נמצא ברצועה סביב פונקציית הגבול.</p>
      </details>
      <div className="convergence-entry-action">
        <button className="panel-action" type="button" onClick={() => open("warmup")}>להתחלת הפעילות</button>
      </div>
    </section> : <>
      <nav className="convergence-lesson-nav" aria-label="מסלול החקירה">
        {LESSONS.map((item) => <button key={item.id} type="button" aria-current={lesson === item.id ? "step" : undefined} onClick={() => open(item.id)}>
          {item.label}{completed.includes(item.id) && <span aria-label="הושלם"> · הושלם</span>}
        </button>)}
        <button type="button" onClick={() => open("pair", true)}>מעבר ישיר לאתגר</button>
        <button type="button" onClick={() => { setLesson(null); heading.current?.focus(); }}>חזרה להגדרות</button>
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
