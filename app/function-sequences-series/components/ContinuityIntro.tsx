"use client";

import { CONTINUITY_THEOREM } from "../math/continuitySteps";
import { MathInlineText } from "./MathInlineText";

/**
 * Opening panel of the continuity-of-the-limit activity, built like the other intros: the course
 * owner's explanation of how the theorem is used, then (below the divider of the open
 * `.convergence-proof` disclosure) the formal reminder: the theorem in an emphasized box.
 */
export function ContinuityIntro({ hidden, returning, onStart }: { hidden?: boolean; returning: boolean; onStart: () => void }) {
  return <section className="module-intro-card convergence-entry continuity-intro" hidden={hidden}>
    <h3 data-step-heading tabIndex={-1}>רציפות פונקציית הגבול</h3>
    <p>על פי משפט, סדרת פונקציות רציפות המתכנסת במידה שווה מתכנסת לפונקציה גבולית רציפה. השימוש המיידי של המשפט ברור: להסיק שפונקציית הגבול רציפה מבלי לבדוק זאת.</p>
    <p>אך שימוש נפוץ מאוד במשפט הוא דווקא בצורה השקולה שלו (השלילה): אם סדרת פונקציות רציפות מתכנסת לפונקציה גבולית לא רציפה, ההתכנסות לא יכולה להיות במידה שווה. ניתן להיעזר במשפט זה כדי לשלול התכנסות במידה שווה של סדרת הפונקציות, מבלי לבדוק זאת במפורש (למשל על ידי מבחן הסופרמום).</p>
    <p>בפעילות זו נבחן את הצורה השקולה של המשפט ואת השימוש בה, ונראה גם דוגמה למקרה שבו המשפט אינו עוזר ומתקבלת תוצאה מפתיעה.</p>
    <details className="convergence-proof" open>
      <summary>משפט הרציפות</summary>
      <section className="convergence-definition formal" aria-label="משפט הרציפות">
        <h4>משפט</h4>
        <p><MathInlineText text={CONTINUITY_THEOREM} /></p>
      </section>
    </details>
    <div className="convergence-entry-action">
      <button className="panel-action" type="button" onClick={onStart}>{returning ? "חזרה לפעילות" : "להתחלת הפעילות"}</button>
    </div>
  </section>;
}
