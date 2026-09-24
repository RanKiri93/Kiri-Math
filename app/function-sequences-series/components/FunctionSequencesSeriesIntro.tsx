import { OdeNotesSections } from "../../ode/OdeNotesSections";
import { MathText } from "./MathText";

export function FunctionSequencesSeriesIntro() {
  return (
    <div className="module-intro-page" aria-label="מבוא לסדרות וטורי פונקציות">
      <article className="module-intro-card module-intro-content" aria-label="מפת דרך של המודול">
        <p className="course-kicker">מפת דרך</p>
        <h2>סדרות וטורי פונקציות</h2>
        <p>
          מודול זה פותח את החלק המתמטי של הקורס: כיצד סדרת פונקציות יכולה להתכנס לפונקציה, מתי טור של
          פונקציות מגדיר פונקציה שאפשר לעבוד איתה, ומה הקשר בין טורי חזקות לטורי טיילור. כאן מופיעה מפת
          הדרך של ארבעת הפרקים. בלשונית סדרות פונקציות מחכה מסלול חקירה מודרך; שאר הפעילויות בבנייה.
        </p>
        <OdeNotesSections moduleId="function-sequences-series" />
      </article>

      <div className="module-intro-grid function-series-roadmap">
        <article className="module-intro-card">
          <p className="course-kicker">א · סדרות פונקציות</p>
          <h3>התכנסות של סדרה</h3>
          <p>
            נתבונן בסדרת פונקציות
          </p>
          <p className="intro-equation">
            <MathText block math="f_1,f_2,f_3,\ldots" />
          </p>
          <p>
            ונשאל כיצד היא יכולה להתכנס לפונקציית גבול <MathText math="f" />. נעסוק בהתכנסות נקודתית,
            בהתכנסות במידה שווה ובהשפעת התחום על ההתכנסות. מתחילים בתחזיות וגרפים, ואפשר לדלג ישירות לאתגר.
          </p>
        </article>

        <article className="module-intro-card">
          <p className="course-kicker">ב · טורי פונקציות</p>
          <h3>סכומים חלקיים</h3>
          <p>
            טור פונקציות נלמד דרך סדרת הסכומים החלקיים
          </p>
          <p className="intro-equation">
            <MathText block math="S_N(x)=\sum_{n=0}^{N}f_n(x)" />
          </p>
          <p>
            ולכן כל מה שנאמר על סדרות פונקציות חל גם כאן, על <MathText math="S_N" />. יופיעו תנאים
            הכרחיים להתכנסות במידה שווה, מבחן <MathText math="M" /> של ויירשטראס, מבחן לייבניץ, ומשפטים
            על רציפות, אינטגרציה וגזירה של סכום הטור.
          </p>
        </article>

        <article className="module-intro-card">
          <p className="course-kicker">ג · טורי חזקות</p>
          <h3>רדיוס ותחום</h3>
          <p>
            טור חזקות הוא טור מהצורה
          </p>
          <p className="intro-equation">
            <MathText block math="\sum_{n=0}^{\infty}a_n(x-x_0)^n" />
          </p>
          <p>
            נכיר את מרכז הטור <MathText math="x_0" />, את רדיוס ההתכנסות, ואת ההתנהגות בתוך הרדיוס
            ומחוצה לו. נדון בהתכנסות במידה שווה על קטעים פנימיים מתאימים, בבדיקה נפרדת של נקודות הקצה,
            ובגזירה ואינטגרציה איבר־איבר.
          </p>
        </article>

        <article className="module-intro-card">
          <p className="course-kicker">ד · טורי טיילור</p>
          <h3>מהפונקציה לטור</h3>
          <p>
            כאשר הטור הוא טור טיילור של פונקציה, המקדמים נקבעים על ידי הנגזרות בנקודת הפיתוח:
          </p>
          <p className="intro-equation">
            <MathText block math="a_n=\frac{f^{(n)}(x_0)}{n!}" />
          </p>
          <p>
            החלק האחרון של המודול יעסוק בקשר בין פונקציה לבין טור החזקות שלה, ובבניית טורים חדשים מתוך
            טורים מוכרים.
          </p>
        </article>
      </div>
    </div>
  );
}
