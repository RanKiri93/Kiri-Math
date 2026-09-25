"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { OdeModuleBreadcrumbs } from "../ode/OdeModuleBreadcrumbs";
import { OdeNotesSections } from "../ode/OdeNotesSections";
import { ConvergenceLab } from "./components/ConvergenceLab";
import { FunctionSeriesSection } from "./components/FunctionSeriesSection";
import { PowerSeriesSection } from "./components/PowerSeriesSection";
import { TaylorSeriesSection } from "./components/TaylorSeriesSection";

type Subject = "function-sequences" | "function-series" | "power-series" | "taylor-series";
const SUBJECTS: Record<Subject, { title: string; intro: () => ReactNode }> = {
  "function-sequences": { title: "סדרות פונקציות", intro: () => null },
  "function-series": { title: "טורי פונקציות", intro: () => <FunctionSeriesSection /> },
  "power-series": { title: "טורי חזקות", intro: () => <PowerSeriesSection /> },
  "taylor-series": { title: "טורי טיילור", intro: () => <TaylorSeriesSection /> },
};

export function SubjectModule({ subject }: { subject: Subject }) {
  const [activityOpen, setActivityOpen] = useState(false);
  const { title, intro } = SUBJECTS[subject];
  return <main className="app-shell" dir="rtl">
    <header className="topbar module-page-topbar">
      <div><OdeModuleBreadcrumbs moduleId={subject} /><h1>{title}</h1></div>
    </header>
    {subject !== "function-sequences" ? <>{intro()}<OdeNotesSections moduleId={subject} /></> : activityOpen ? <>
      <div className="convergence-actions"><button type="button" className="panel-action secondary" onClick={() => setActivityOpen(false)}>חזרה לתפריט הפעילויות</button></div>
      <ConvergenceLab />
    </> : <section className="module-intro-page" aria-label="פעילויות בסדרות פונקציות">
      <article className="module-intro-card module-intro-content">
        <p className="course-kicker">סדרות פונקציות</p>
        <h2>פעילויות בסדרות פונקציות</h2>
        <p>נבחן התכנסות נקודתית והתכנסות במידה שווה, ואת השפעת התחום על ההתכנסות. מעבדת ההתכנסות זמינה כעת; פעילויות על רציפות, אינטגרציה וגזירה מתוכננות.</p>
        <OdeNotesSections moduleId={subject} />
      </article>
      <div className="module-intro-grid">
        <article className="module-intro-card">
          <p className="course-kicker">פעילות זמינה</p><h3>התכנסות נקודתית ובמידה שווה</h3>
          <p>תחזיות וחקירה של התכנסות נקודתית ובמידה שווה, עם גרפים ותחומים משתנים.</p>
          <button type="button" className="panel-action" onClick={() => setActivityOpen(true)}>פתיחת המעבדה</button>
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
    </section>}
  </main>;
}
