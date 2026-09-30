"use client";

import { MathInlineText } from "./MathInlineText";
import { MathText } from "./MathText";

/** Opening panel of the supremum activity: goal, the supremum test, and the recipe for computing M_n. */
export function SupremumIntro({ hidden, returning, onStart }: { hidden?: boolean; returning: boolean; onStart: () => void }) {
  return <section className="module-intro-card convergence-entry supremum-intro" hidden={hidden}>
    <h3 data-step-heading tabIndex={-1}>מבחן הסופרמום: מחשבים ומנמקים</h3>
    <p><MathInlineText text="בפעילות הזו מחשבים את $M_n$ בפועל ומנמקים כל צעד, כמו בפתרון בחינה. המטרה: להשתמש נכון במבחן הסופרמום, ולזכור את נימוקי החדו״א שנדרשים כדי למצוא מקסימום." /></p>
    <details className="convergence-proof" open>
      <summary>מבחן הסופרמום ומתכון לחישוב</summary>
      <section className="convergence-definition" aria-label="מבחן הסופרמום">
        <h4>מבחן הסופרמום</h4>
        <p><MathInlineText text="נניח ש־$f_n\to f$ נקודתית בתחום $D$, ונסמן" /></p>
        <MathText block math="M_n=\sup_{x\in D}|f_n(x)-f(x)|" />
        <p><MathInlineText text="אז $f_n\to f$ במידה שווה ב־$D$ אם ורק אם $M_n\to0$ כאשר $n\to\infty$." /></p>
      </section>
      <section className="convergence-definition" aria-label="איך מחשבים את Mn">
        <h4>איך מחשבים את <MathText math="M_n" /></h4>
        <ol>
          <li><MathInlineText text="מוצאים את הגבול הנקודתי $f$. בלעדיו אי אפשר להפעיל את המבחן." /></li>
          <li><MathInlineText text="מנמקים למה $|f_n-f|$ מקבלת מקסימום בתחום: בקטע סגור וחסום לפי ויירשטראס; בתחום לא חסום לפי רציפות והתנהגות בקצוות." /></li>
          <li>גוזרים ומוצאים נקודות חשודות לקיצון. משפט פרמה חל רק בנקודות פנימיות שבהן הפונקציה גזירה.</li>
          <li>משווים בין כל המועמדים: נקודות הקצה, הנקודות החשודות הפנימיות והגבול באינסוף. אם הנקודה החשודה יוצאת מהתחום, המונוטוניות קובעת היכן המקסימום.</li>
          <li><MathInlineText text="מחשבים את $\lim_{n\to\infty}M_n$ ומסיקים לפי מבחן הסופרמום." /></li>
        </ol>
      </section>
      <p><MathInlineText text="חמש דוגמאות: $nxe^{-nx}$ ב־$[0,\infty)$ וב־$[1,\infty)$, $nx^2e^{-nx}$ ב־$[0,\infty)$, ו־$x^n(1-x^n)$ ב־$[0,1]$ וב־$[0,\tfrac12]$." /></p>
    </details>
    <div className="convergence-entry-action">
      <button className="panel-action" type="button" onClick={onStart}>{returning ? "חזרה לפעילות" : "להתחלת הפעילות"}</button>
    </div>
  </section>;
}
