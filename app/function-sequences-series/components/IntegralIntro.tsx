"use client";

import { INTEGRAL_THEOREM } from "../math/integralSteps";
import { MathInlineText } from "./MathInlineText";

/**
 * Opening panel of the limit-and-integral activity, built like the other intros: an explanation
 * above the divider, then (inside the open `.convergence-proof` disclosure) the theorem in an
 * emphasized box: the extended theorem, its hypothesis and three numbered conclusions. The lead
 * paragraphs are DRAFT copy, to be replaced with the course owner's text.
 */
export function IntegralIntro({ hidden, returning, onStart }: { hidden?: boolean; returning: boolean; onStart: () => void }) {
  return <section className="module-intro-card convergence-entry integral-intro" hidden={hidden}>
    <h3 data-step-heading tabIndex={-1}>גבול ואינטגרל</h3>
    <p>מתי מותר להחליף בין הגבול לבין האינטגרל? המשפט נותן תנאי מספיק: התכנסות במידה שווה. בפעילות זו נשתמש בו כדי לחשב גבול של אינטגרלים בלי לחשב אותם, ונראה גם דוגמה שבה ההחלפה מותרת אף שההתכנסות אינה במידה שווה.</p>
    <p>בגרפים אפשר לראות את השטח שמתחת לגרף של <MathInlineText text="$f_n$" />, ולצידו את סדרת האינטגרלים.</p>
    <details className="convergence-proof" open>
      <summary>משפט האינטגרציה</summary>
      <section className="convergence-definition formal" aria-label="משפט האינטגרציה">
        <h4>משפט</h4>
        <p><MathInlineText text={INTEGRAL_THEOREM.hypothesis} /></p>
        <ol>
          {INTEGRAL_THEOREM.conclusions.map((text, index) => <li key={index}><MathInlineText text={text} /></li>)}
        </ol>
      </section>
    </details>
    <div className="convergence-entry-action">
      <button className="panel-action" type="button" onClick={onStart}>{returning ? "חזרה לפעילות" : "להתחלת הפעילות"}</button>
    </div>
  </section>;
}
