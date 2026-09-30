"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { WarmupActivity, OscillationActivity } from "./SimpleConvergenceActivities";
import { PowerConvergenceActivity } from "./PowerConvergenceActivity";
import { PairedConvergenceActivity } from "./PairedConvergenceActivity";
import { MathText } from "./MathText";
import { canOpenConvergenceView, completeConvergenceLesson, CONVERGENCE_LESSONS, type ConvergenceLesson, type ConvergenceView } from "../lessonProgress";
import { ConvergenceNavigator, ConvergencePaging } from "./ConvergenceNavigator";
import { convergenceLessonExplanations } from "./ConvergenceLessonExplanations";

export function ConvergenceLab({ onExit, onFinish }: { onExit?: () => void; onFinish?: () => void }) {
  const [view, setView] = useState<ConvergenceView>("definitions");
  const [lastLesson, setLastLesson] = useState<ConvergenceLesson>("warmup");
  const [visited, setVisited] = useState<ConvergenceLesson[]>([]);
  const [completed, setCompleted] = useState<readonly ConvergenceLesson[]>([]);
  const [switching, setSwitching] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const navigation = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const transition = useRef(0);
  const pending = useRef(false);
  const focusAfterTransition = useRef(false);

  useEffect(() => () => {
    transition.current += 1;
    animation.current?.cancel();
  }, []);

  function open(next: ConvergenceView) {
    if (next === view || pending.current || !canOpenConvergenceView(next, completed)) return;
    const ticket = ++transition.current;
    pending.current = true;
    setSwitching(true);
    const commit = () => {
      if (ticket !== transition.current) return;
      setView(next);
      // Reaching the finish view is the lab's completion point (docs/plans/activity-progress.md).
      if (next === "complete") onFinish?.();
      if (next !== "definitions" && next !== "complete") {
        setLastLesson(next);
        setVisited((current) => current.includes(next) ? current : [...current, next]);
      }
    };
    if (!stage.current?.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      commit();
      return;
    }
    try {
      animation.current = stage.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: "ease-in", fill: "forwards" });
      void animation.current.finished.then(commit, commit);
    } catch { commit(); }
  }

  useLayoutEffect(() => {
    if (!pending.current) return;
    const ticket = transition.current;
    animation.current?.cancel();
    const finish = () => {
      if (ticket !== transition.current) return;
      pending.current = false;
      focusAfterTransition.current = true;
      setSwitching(false);
    };
    if (!stage.current?.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    try {
      animation.current = stage.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
      void animation.current.finished.then(finish, finish);
    } catch { finish(); }
  }, [view]);

  useLayoutEffect(() => {
    if (switching || !focusAfterTransition.current) return;
    focusAfterTransition.current = false;
    if (stage.current?.closest("[hidden]")) return;
    stage.current?.querySelector<HTMLElement>("section:not([hidden]) [data-step-heading]")?.focus({ preventScroll: true });
    const target = view === "definitions" ? stage.current : navigation.current;
    if (target && target.getBoundingClientRect().top < 0) target.scrollIntoView({ block: "start", behavior: "instant" });
  }, [view, switching]);

  function complete(id: ConvergenceLesson) {
    setCompleted((current) => completeConvergenceLesson(current, id));
  }
  return <div className="convergence-lab">
    <header className="convergence-heading">
      <div className="convergence-heading-copy">
        <h2 data-convergence-heading tabIndex={-1}>התכנסות נקודתית ובמידה שווה</h2>
        <p className="convergence-muted">בחרו נקודה, שנו את האינדקס ובדקו מה קורה על כל התחום.</p>
      </div>
      <div className="convergence-heading-actions">
        {view !== "definitions" && <button type="button" className="panel-action secondary" disabled={switching} onClick={() => open("definitions")}>חזרה להגדרות</button>}
        {onExit && <button type="button" className="panel-action secondary" disabled={switching} onClick={onExit}>חזרה לתפריט הפעילויות</button>}
      </div>
    </header>
    <div ref={navigation} hidden={view === "definitions"}>
      {view !== "definitions" && <ConvergenceNavigator view={view} completed={completed} busy={switching} onOpen={open} />}
    </div>
    <div ref={stage} className="convergence-stage" aria-busy={switching} inert={switching}>
    <section className="module-intro-card convergence-entry" hidden={view !== "definitions"}>
      <h3 data-step-heading tabIndex={-1}>מתקרבים — אבל באיזה מובן?</h3>
      <p>בסדרות של פונקציות, בדומה לסדרות של מספרים (המוכרות לנו מהחדו״א), מגדירים גבול.</p>
      <p>הרעיון של גבול עבור סדרת פונקציות מגיע מאינטואיציה זהה לזו של סדרות של מספרים. כלומר, לסדרת פונקציות יש גבול אם היא &quot;מתקרבת כרצוננו&quot; לפונקציה גבולית כלשהי.<br />בפעילות זו תפגשו את שני הסוגים הנפוצים של &quot;התקרבות&quot; בשפה של סדרות פונקציות, התכנסות נקודתית והתכנסות במידה שווה.</p>
      <p>לאחר שתחזרו על ההגדרות שלעיל, מומלץ להיעזר בכלים הגרפיים ובפעילות המודרכת על מנת לקבל אינטואיציה גיאומטרית להבדל בין סוגי ההתכנסות, ועל התלות של התכנסות זו בתחום שבו מוגדרות הפונקציות.</p>
      <details className="convergence-proof" open>
        <summary>התכנסות נקודתית והתכנסות במידה שווה — הגדרות</summary>
        <p>תהי <MathText math="\{f_n\}_{n=1}^{\infty}" /> סדרת פונקציות בקטע <MathText math="I" />.</p>
        <section className="convergence-definition formal" aria-label="הגדרת התכנסות נקודתית">
          <h4>התכנסות נקודתית</h4>
          <p>הסדרה מתכנסת נקודתית לפונקציה <MathText math="f" /> בנקודה <MathText math="x\in I" /> אם</p>
          <MathText block math="\lim_{n\to\infty}f_n(x)=f(x)" />
          <p>כלומר, לכל <MathText math="\varepsilon>0" /> קיים <MathText math="N\in\mathbb{N}" /> כך שלכל <MathText math="n>N" /> מתקיים</p>
          <MathText block math="|f_n(x)-f(x)|<\varepsilon" />
          <p>הסדרה מתכנסת נקודתית בקטע אם תנאי זה מתקיים בכל נקודה בקטע.</p>
        </section>
        <p>במילים פשוטות: בוחרים ערך קבוע של <MathText math="x" /> ולוקחים גבול כאשר <MathText math="n\to\infty" />, לכל ערך של <MathText math="x" /> בנפרד. האינדקס <MathText math="N" /> יכול להיות שונה מנקודה לנקודה.</p>
        <section className="convergence-definition formal" aria-label="הגדרת התכנסות במידה שווה">
          <h4>התכנסות במידה שווה</h4>
          <p>הסדרה מתכנסת במידה שווה לפונקציה <MathText math="f" /> בקטע <MathText math="I" /> אם לכל <MathText math="\varepsilon>0" /> קיים <MathText math="N\in\mathbb{N}" /> כך שלכל <MathText math="n>N" /> ולכל <MathText math="x\in I" /> מתקיים</p>
          <MathText block math="|f_n(x)-f(x)|<\varepsilon" />
        </section>
        <p>במילים פשוטות: לכל מידת דיוק שבוחרים, יש אינדקס אחד שמתאים לכל הנקודות בקטע. לכל <MathText math="n>N" />, כל הגרף נמצא ברצועה סביב פונקציית הגבול.</p>
      </details>
      <div className="convergence-entry-action">
        <button className="panel-action" type="button" onClick={() => open(lastLesson)}>{visited.length ? "חזרה לפעילות" : "להתחלת הפעילות"}</button>
      </div>
    </section>
    {CONVERGENCE_LESSONS.map(({ id, label }) => visited.includes(id) && <section className="convergence-lesson-panel" key={id} hidden={view !== id} aria-labelledby={`convergence-part-${id}`}>
      <header className="convergence-part-header">
        <h3 className="convergence-part-title" id={`convergence-part-${id}`} data-step-heading tabIndex={-1}>{label}</h3>
        <div className="convergence-explanation-slot" data-lesson-explanation={id} aria-hidden={convergenceLessonExplanations[id] == null ? true : undefined}>
          {convergenceLessonExplanations[id]}
        </div>
      </header>
      {id === "warmup" && <WarmupActivity onComplete={() => complete("warmup")} />}
      {id === "power" && <PowerConvergenceActivity onComplete={() => complete("power")} />}
      {id === "oscillation" && <OscillationActivity onComplete={() => complete("oscillation")} />}
      {id === "pair" && <PairedConvergenceActivity challenge={false} onComplete={() => complete("pair")} />}
    </section>)}
    {view === "complete" && <section className="module-intro-card convergence-finish">
      <h3 data-step-heading tabIndex={-1}>המסלול הושלם</h3>
      <button type="button" className="panel-action secondary" onClick={() => open("pair")}>חזרה לחלק האחרון</button>
    </section>}
    </div>
    {view !== "definitions" && view !== "complete" && <div className="convergence-sequence-footer">
      <ConvergencePaging view={view} completed={completed} busy={switching} onOpen={open} />
    </div>}
  </div>;
}
