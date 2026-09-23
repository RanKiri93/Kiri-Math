import { MathText } from "./MathText";
import { SectionPlaceholder } from "./SectionPlaceholder";

export function PowerSeriesSection() {
  return (
    <SectionPlaceholder
      ariaLabel="טורי חזקות"
      title="טורי חזקות"
      description={
        <>
          <p>
            טור חזקות מאופיין במרכז <MathText math="x_0" /> ובמקדמים <MathText math="a_n" />. בחלק זה
            נחשב את רדיוס ההתכנסות, נראה את תחום ההתכנסות, ונבדיל בין מה שקורה בפנים הקטע הפתוח לבין
            נקודות הקצה.
          </p>
          <p className="intro-equation">
            <MathText block math="\sum_{n=0}^{\infty}a_n(x-x_0)^n" />
          </p>
        </>
      }
      plannedActivities={[
        {
          title: "מרכז, מקדמים ורדיוס",
          detail: (
            <>
              זיהוי <MathText math="x_0" /> והמקדמים, וחישוב רדיוס ההתכנסות <MathText math="R" />.
            </>
          ),
        },
        {
          title: "ויזואליזציה של התחום",
          detail: (
            <>
              המחשת <MathText math="\lvert x-x_0\rvert<R" /> וקטעים סגורים פנימיים שעליהם מתקבלת התכנסות
              במידה שווה.
            </>
          ),
        },
        {
          title: "נקודות הקצה",
          detail: <>בדיקה נפרדת של שתי נקודות הקצה, שאינן נקבעות על ידי הרדיוס לבדו.</>,
        },
        {
          title: "גזירה ואינטגרציה איבר־איבר",
          detail: (
            <>
              בניית טור הנגזרת וטור האינטגרל, והמחשת העובדה שרדיוס ההתכנסות אינו משתנה בפעולות אלה.
            </>
          ),
        },
      ]}
    />
  );
}
