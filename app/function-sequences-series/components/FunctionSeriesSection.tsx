import { MathText } from "./MathText";
import { SectionPlaceholder } from "./SectionPlaceholder";

export function FunctionSeriesSection() {
  return (
    <SectionPlaceholder
      ariaLabel="טורי פונקציות"
      title="טורי פונקציות"
      description={
        <>
          <p>
            טור פונקציות הוא סדרת הסכומים החלקיים שלו. בחלק זה נעבור מאיברי הטור{" "}
            <MathText math="f_n" /> אל <MathText math="S_N" />, נלמד מתי ההתכנסות היא במידה שווה, ואילו
            מבחנים מאפשרים להסיק זאת בלי לחשב את הסכום במפורש.
          </p>
          <p className="intro-equation">
            <MathText block math="S_N(x)=\sum_{n=0}^{N}f_n(x)" />
          </p>
        </>
      }
      plannedActivities={[
        {
          title: "סכומים חלקיים",
          detail: (
            <>
              הצגת <MathText math="S_N" /> ומעבר ויזואלי בין איברי הטור לבין סדרת הסכומים החלקיים.
            </>
          ),
        },
        {
          title: "בחירת מבחן",
          detail: (
            <>
              תרגול זיהוי מבחן מתאים להתכנסות במידה שווה, ובפרט מבחן <MathText math="M" /> של ויירשטראס
              ומבחן לייבניץ.
            </>
          ),
        },
        {
          title: "העברה דרך הסכום",
          detail: (
            <>
              תרגול של העברת רציפות, אינטגרציה וגזירה דרך סכום הטור — ומתי הדבר מותר.
            </>
          ),
        },
      ]}
    />
  );
}
