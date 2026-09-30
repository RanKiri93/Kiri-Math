"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { OdeModuleBreadcrumbs } from "../ode/OdeModuleBreadcrumbs";
import { OdeNotesSections } from "../ode/OdeNotesSections";
import { ConvergenceLab } from "./components/ConvergenceLab";
import { SupremumActivity } from "./components/SupremumActivity";
import { FunctionSeriesSection } from "./components/FunctionSeriesSection";
import { PowerSeriesSection } from "./components/PowerSeriesSection";
import { TaylorSeriesSection } from "./components/TaylorSeriesSection";
import { reportActivityCompletion } from "../_progress/client";
import { completionDateLabel } from "../_progress/model";

type Activity = "lab" | "supremum";
/** Registry ids in `app/ode/course.ts`; the stored completion marks use these. */
const ACTIVITY_IDS: Record<Activity, string> = { lab: "convergence-lab", supremum: "supremum-test" };
export type ActivityCompletionMark = { activityId: string; lastCompletedAt: number };
type Subject = "function-sequences" | "function-series" | "power-series" | "taylor-series";
const SUBJECTS: Record<Subject, { title: string; intro: () => ReactNode }> = {
  "function-sequences": { title: "סדרות פונקציות", intro: () => null },
  "function-series": { title: "טורי פונקציות", intro: () => <FunctionSeriesSection /> },
  "power-series": { title: "טורי חזקות", intro: () => <PowerSeriesSection /> },
  "taylor-series": { title: "טורי טיילור", intro: () => <TaylorSeriesSection /> },
};

export function SubjectModule({ subject, completions = [] }: { subject: Subject; completions?: readonly ActivityCompletionMark[] }) {
  // Each started activity keeps a hidden host, so leaving to the menu preserves the student's work.
  const [openActivity, setOpenActivity] = useState<Activity | null>(null);
  const [started, setStarted] = useState<Activity[]>([]);
  const [lastOpened, setLastOpened] = useState<Activity | null>(null);
  const [finishedAt, setFinishedAt] = useState<Partial<Record<Activity, number>>>(() => {
    const marks: Partial<Record<Activity, number>> = {};
    for (const activity of Object.keys(ACTIVITY_IDS) as Activity[]) {
      const mark = completions.find((entry) => entry.activityId === ACTIVITY_IDS[activity]);
      if (mark) marks[activity] = mark.lastCompletedAt;
    }
    return marks;
  });
  const finish = (activity: Activity) => {
    setFinishedAt((current) => ({ ...current, [activity]: Date.now() }));
    reportActivityCompletion("ode", subject, ACTIVITY_IDS[activity]);
  };
  const hosts = useRef<Record<Activity, HTMLDivElement | null>>({ lab: null, supremum: null });
  const entryButtons = useRef<Record<Activity, HTMLButtonElement | null>>({ lab: null, supremum: null });
  const open = (activity: Activity) => {
    setStarted((current) => current.includes(activity) ? current : [...current, activity]);
    setLastOpened(activity);
    setOpenActivity(activity);
  };
  useEffect(() => {
    if (openActivity) hosts.current[openActivity]?.querySelector<HTMLElement>("[data-convergence-heading]")?.focus({ preventScroll: true });
    else if (lastOpened) entryButtons.current[lastOpened]?.focus({ preventScroll: true });
  }, [openActivity, lastOpened]);
  const { title, intro } = SUBJECTS[subject];
  return <main className={`app-shell${subject === "function-sequences" ? " function-sequences-module" : ""}`} dir="rtl">
    <header className="topbar module-page-topbar">
      <div><OdeModuleBreadcrumbs moduleId={subject} /><h1>{title}</h1></div>
    </header>
    {subject !== "function-sequences" ? <>{intro()}<OdeNotesSections moduleId={subject} /></> : <>
    {started.includes("lab") && <div ref={(node) => { hosts.current.lab = node; }} className="convergence-activity-host" hidden={openActivity !== "lab"}>
      <ConvergenceLab onExit={() => setOpenActivity(null)} onFinish={() => finish("lab")} />
    </div>}
    {started.includes("supremum") && <div ref={(node) => { hosts.current.supremum = node; }} className="convergence-activity-host" hidden={openActivity !== "supremum"}>
      <SupremumActivity onExit={() => setOpenActivity(null)} onFinish={() => finish("supremum")} />
    </div>}
    <section className="module-intro-page convergence-menu" hidden={openActivity !== null} aria-label="פעילויות בסדרות פונקציות">
      <article className="module-intro-card module-intro-content">
        <div className="convergence-menu-lead">
          <p className="course-kicker">סדרות פונקציות</p>
          <h2>פעילויות בסדרות פונקציות</h2>
          <p>בפעילויות שמוצגות לעיל נקנה אינטואיציה גרפית ופורמלית להבדל בין התכנסות נקודתית והתכנסות במידה שווה. לאחר מכן נחדד חלק מן הכלים הפרקטיים שאיתם נהוג לחשב את הפונקציה הגבולית ולקבוע האם בתחום נתון ההתכנסות היא במידה שווה. לבסוף, נחדד את האופן שבו ניתן להשתמש במשפטים על רציפות הפונקציה הגבולית, אינטגרציה איבר-איבר וגזירה איבר-איבר. סדר הפעילויות מתאים לסדר הלמידה המופיע ברשימות הקורס.</p>
        </div>
        <OdeNotesSections moduleId={subject} />
      </article>
      <div className="module-intro-grid">
        <article className="module-intro-card">
          <h3 id="sequences-activity-lab">1. התכנסות נקודתית ובמידה שווה</h3>
          <p>אינטואיציה גיאומטרית להתכנסות נקודתית, התכנסות במידה שווה וההבדל ביניהן. הדגמת סוגי התכנסות בתתי-תחומים שונים.</p>
          <CompletionMark time={finishedAt.lab} />
          <button ref={(node) => { entryButtons.current.lab = node; }} type="button" className="panel-action" aria-describedby="sequences-activity-lab" onClick={() => open("lab")}>כניסה לפעילות</button>
        </article>
        <article className="module-intro-card">
          <h3 id="sequences-activity-supremum">2. שימוש במבחן הסופרמום</h3>
          <p>שימוש במבחן הסופרמום לבדיקת התכנסות במידה שווה בתחום נתון. נראה כיצד ניתן להשתמש בטכניקות מהחשבון הדיפרנציאלי למציאת הסופרמום במפורש, על מנת להסיק בצורה פשוטה התכנסות/אי-התכנסות במידה שווה.</p>
          <CompletionMark time={finishedAt.supremum} />
          <button ref={(node) => { entryButtons.current.supremum = node; }} type="button" className="panel-action" aria-describedby="sequences-activity-supremum" onClick={() => open("supremum")}>כניסה לפעילות</button>
        </article>
        {([
          { title: "רציפות פונקציית הגבול", detail: "מתי רציפות של איברי הסדרה וההתכנסות במידה שווה מבטיחות שרציפות נשמרת בגבול?" },
          { title: "גבול ואינטגרל", detail: "באילו תנאים אפשר להחליף בין גבול הסדרה לבין אינטגרציה על קטע?" },
          { title: "גבול ונגזרת", detail: "אילו תנאים על הסדרה והנגזרות מאפשרים לגזור את פונקציית הגבול?" },
        ]).map((activity) => <article className="module-intro-card" key={activity.title}>
          <p className="course-kicker">פעילות מתוכננת</p><h3>{activity.title}</h3>
          <p>{activity.detail}</p>
          <span className="embedded-placeholder"><span>פעילות אינטראקטיבית</span><strong>בבנייה</strong></span>
        </article>)}
      </div>
    </section></>}
  </main>;
}

function CompletionMark({ time }: { time?: number }) {
  if (time === undefined) return null;
  return <p className="activity-completion-mark" data-activity-complete>
    <span aria-hidden="true">✓</span> הושלמה ב־<bdi dir="ltr">{completionDateLabel(time)}</bdi>
  </p>;
}
