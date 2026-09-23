import { MathText } from "./MathText";
import { SectionPlaceholder } from "./SectionPlaceholder";

export function TaylorSeriesSection() {
  return (
    <SectionPlaceholder
      ariaLabel="טורי טיילור"
      title="טורי טיילור"
      description={
        <>
          <p>
            טור טיילור מחבר בין פונקציה גזירה מספיק פעמים לבין טור החזקות שלה סביב נקודת פיתוח. בחלק זה
            נעבור מנגזרות למקדמים, נזהה טורים מוכרים, ונבנה מהם טורים חדשים.
          </p>
          <p className="intro-equation">
            <MathText block math="a_n=\frac{f^{(n)}(x_0)}{n!}" />
          </p>
        </>
      }
      plannedActivities={[
        {
          title: "מנגזרות למקדמים",
          detail: (
            <>
              מעבר מ־<MathText math="f^{(n)}(x_0)" /> למקדמי הטור, וזיהוי טורים מוכרים.
            </>
          ),
        },
        {
          title: "בניית טורים חדשים",
          detail: (
            <>
              הצבה, כפל ב־<MathText math="x^k" />, וגזירה או אינטגרציה של טורים מוכרים.
            </>
          ),
        },
        {
          title: "זיהוי הפונקציה",
          detail: <>תרגול שבו מזהים פונקציה מתוך טור חזקות נתון.</>,
        },
      ]}
    />
  );
}
