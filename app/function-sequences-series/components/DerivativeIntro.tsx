"use client";

import { DERIVATIVE_THEOREM } from "../math/derivativeSteps";
import { MathInlineText } from "./MathInlineText";

/**
 * Opening panel of the limit-and-derivative activity, built like the other intros: an explanation
 * above the divider, then (inside the open `.convergence-proof` disclosure) the theorem in an
 * emphasized box: its three hypotheses as a numbered list and the conclusion. The lead paragraphs
 * are DRAFT copy, to be replaced with the course owner's text.
 */
export function DerivativeIntro({ hidden, returning, onStart }: { hidden?: boolean; returning: boolean; onStart: () => void }) {
  return <section className="module-intro-card convergence-entry derivative-intro" hidden={hidden}>
    <h3 data-step-heading tabIndex={-1}>גבול ונגזרת</h3>
    <p>מתי הנגזרת של פונקציית הגבול היא הגבול של הנגזרות? כאן התכנסות במידה שווה של הסדרה עצמה אינה מספיקה: משפט הגזירה דורש התכנסות במידה שווה של סדרת הנגזרות, והתכנסות של הסדרה בנקודה אחת לפחות.</p>
    <p>בפעילות זו נראה דוגמה שבה כל התנאים מתקיימים, ושתי דוגמאות שבהן תנאי אחר נכשל בכל פעם. בגרפים מוצגות הסדרה וסדרת הנגזרות זו לצד זו.</p>
    <details className="convergence-proof" open>
      <summary>משפט הגזירה</summary>
      <section className="convergence-definition formal" aria-label="משפט הגזירה">
        <h4>משפט</h4>
        <p>תהי <MathInlineText text="$\{f_n\}$" /> סדרת פונקציות, ונניח:</p>
        <ol>
          {DERIVATIVE_THEOREM.hypotheses.map((text, index) => <li key={index}><MathInlineText text={text} /></li>)}
        </ol>
        <p><MathInlineText text={DERIVATIVE_THEOREM.conclusion} /></p>
      </section>
    </details>
    <div className="convergence-entry-action">
      <button className="panel-action" type="button" onClick={onStart}>{returning ? "חזרה לפעילות" : "להתחלת הפעילות"}</button>
    </div>
  </section>;
}
