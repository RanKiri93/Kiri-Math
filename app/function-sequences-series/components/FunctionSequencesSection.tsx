import { MathText } from "./MathText";
import { SectionPlaceholder } from "./SectionPlaceholder";

export function FunctionSequencesSection() {
  return (
    <SectionPlaceholder
      ariaLabel="סדרות פונקציות"
      title="סדרות פונקציות"
      description={
        <>
          <p>
            בחלק זה נחקור התכנסות של סדרת פונקציות <MathText math="(f_n)" /> לפונקציית גבול{" "}
            <MathText math="f" />: מתי ההתכנסות נקודתית בלבד, ומתי היא במידה שווה על קטע. נראה כיצד
            פונקציית השגיאה והסופרמום שלה מפרידים בין שני המושגים, ומתי מותר להעביר רציפות, אינטגרציה
            וגזירה דרך הגבול.
          </p>
          <p className="intro-equation">
            <MathText block math="E_n(x)=\lvert f_n(x)-f(x)\rvert" />
          </p>
        </>
      }
      plannedActivities={[
        {
          title: "מעבדת גרפים",
          detail: (
            <>
              הצגת <MathText math="f_n" /> ו־<MathText math="f" /> יחד, כולל כמה אינדקסים בו־זמנית,
              ומעבר חזותי בין התכנסות נקודתית להתכנסות במידה שווה.
            </>
          ),
        },
        {
          title: "פונקציית שגיאה וסופרמום",
          detail: (
            <>
              המחשת <MathText math="E_n(x)=\lvert f_n(x)-f(x)\rvert" /> ושל{" "}
              <MathText math="\sup_x \lvert f_n(x)-f(x)\rvert" /> כמדד להתכנסות במידה שווה.
            </>
          ),
        },
        {
          title: "משחק ε–N",
          detail: (
            <>
              פעילות שבה בוחרים <MathText math="\varepsilon>0" /> ומחפשים <MathText math="N" /> מתאים,
              כדי להבחין בין התכנסות בכל נקודה לבין שליטה אחידה על כל הקטע.
            </>
          ),
        },
        {
          title: "דוגמאות נגדיות",
          detail: (
            <>
              מקרים שבהם הגבול אינו רציף, או שאי אפשר להעביר אינטגרציה או גזירה דרך הגבול בלי התכנסות
              במידה שווה (או תנאים מחליפים).
            </>
          ),
        },
      ]}
    />
  );
}
