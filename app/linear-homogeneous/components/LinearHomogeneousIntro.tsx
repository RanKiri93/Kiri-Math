import type { ReactNode } from "react";
import { MathText } from "./MathText";

type IntroTopic = {
  title: string;
  kicker: string;
  body: ReactNode;
};

const solutionSpaceSubTopics: IntroTopic[] = [
  {
    title: "פתרונות כמרחב וקטורי",
    kicker: "מבנה אלגברי",
    body: (
      <>
        <p>
          החל מחלק זה נניח כי מקדמי המשוואה רציפים, על אף שחלק מהמשפטים תקפים גם ללא הנחה זו.
        </p>
        <div className="intro-claim">
          <p>
            <strong>טענה.</strong> אוסף הפתרונות למשוואה הליניארית ההומוגנית
          </p>
          <p className="intro-equation">
            <MathText block math="y^{(n)}+a_{n-1}(x)y^{(n-1)}+\dots+a_1(x)y'+a_0(x)y=0" />
          </p>
          <p>הוא מרחב וקטורי.</p>
        </div>
        <p>
          המשמעות היא שלכל משוואה ליניארית הומוגנית, הפונקציה <MathText math="y(x)=0" /> תמיד מהווה
          פתרון. בנוסף, אם <MathText math="y_1(x),y_2(x)" /> שני פתרונות של המשוואה, גם הפונקציה{" "}
          <MathText math="\alpha y_1(x)+\beta y_2(x)" /> תהיה פתרון של המשוואה לכל בחירה של{" "}
          <MathText math="\alpha,\beta\in\mathbb{R}" />.
        </p>
      </>
    ),
  },
  {
    title: "תלות ואי-תלות ליניארית",
    kicker: "קריטריון לפתרונות",
    body: (
      <>
        <p>
          בחלק הקודם ראינו כי מרחב הפתרונות למשוואה ליניארית והומוגנית הוא מרחב וקטורי. מתברר, שניתן
          לומר הרבה יותר מזה. למרחב זה ניתן למצוא בסיס, שמשמעותו קבוצה בלתי תלויה ליניארית ופורשת. אך
          לשם כך יהיה עלינו להגדיר בצורה מסודרת מהי תלות ליניארית בין פונקציות.
        </p>
        <div className="intro-claim">
          <p>
            <strong>הגדרה (תלות ליניארית בקטע/קרן).</strong> תהיינה{" "}
            <MathText math="y_1(x),\dots,y_k(x)" /> פונקציות בקטע/קרן <MathText math="I" />. אומרים כי
            הפונקציות <strong>תלויות ליניארית</strong> אם ניתן למצוא קבועים{" "}
            <MathText math="c_1,\dots,c_k" />, לא כולם אפס, כך שמתקיים
          </p>
          <p className="intro-equation">
            <MathText block math="c_1y_1(x)+\dots+c_ky_k(x)=0,\quad \forall x\in I" />
          </p>
          <p>
            במידה ואין קבועים כאלה, אומרים כי הפונקציות <strong>בלתי תלויות ליניארית</strong>.
          </p>
        </div>
        <p>
          בדיקת תלות ליניארית יכולה להיות משימה קצת מורכבת, היות והיא דורשת מאיתנו למצוא קבועים{" "}
          <MathText math="c_1,\dots,c_k" /> המתאימים לכל ערכי <MathText math="x" /> בקטע/קרן. אך ישנם
          קריטריונים מקלים במידה ומניחים משהו נוסף על הפונקציות, ומשתמשים בכלי המתמטי הבא.
        </p>
        <div className="intro-claim">
          <p>
            <strong>הגדרה (וורונסקיאן).</strong> תהיינה <MathText math="y_1(x),\dots,y_k(x)" /> פונקציות
            גזירות <MathText math="k-1" /> פעמים בקטע/קרן <MathText math="I" />. ה<strong>וורונסקיאן</strong>{" "}
            של הפונקציות בקטע הוא הפונקציה
          </p>
          <p className="intro-equation">
            <MathText
              block
              math="W[y_1,\dots,y_k](x)=\det\begin{pmatrix}y_1(x)&\dots&y_k(x)\\y_1'(x)&\dots&y_k'(x)\\\vdots&\ddots&\vdots\\y_1^{(k-1)}(x)&\dots&y_k^{(k-1)}(x)\end{pmatrix}"
            />
          </p>
        </div>
        <div className="intro-claim">
          <p>
            <strong>טענה.</strong> תהיינה <MathText math="y_1(x),\dots,y_k(x)" /> פונקציות גזירות{" "}
            <MathText math="k-1" /> פעמים ותלויות ליניארית בקטע/קרן <MathText math="I" />. אזי,{" "}
            <MathText math="W[y_1,\dots,y_k](x)=0" /> לכל <MathText math="x\in I" />.
          </p>
        </div>
        <p>
          בניסוח אחר, מספיקה נקודה אחת שבה וורונסקיאן אינו מתאפס, על מנת להסיק שקבוצת הפונקציות{" "}
          <strong>בלתי תלויה ליניארית</strong>.
        </p>
        <p>
          שימו לב שהמשפט עובד רק בכיוון אחד. אם הוורונסקיאן של פונקציות מתאפס בכל נקודה בקטע, לא ניתן
          להסיק בהכרח כי הפונקציות תלויות ליניארית. יחד עם זאת עד כה לא התייחסנו למד״ר כלל אלא לפונקציות
          כלליות לגמרי. כאשר מדובר בפתרונות של מד״ר ליניארית עם קיום ויחידות, ניתן להסיק תוצאה משמעותית
          הרבה יותר.
        </p>
        <div className="intro-claim">
          <p>
            <strong>משפט (וורונסקיאן לפתרונות של מד״ר).</strong> תהיינה{" "}
            <MathText math="y_1(x),\dots,y_n(x)" /> קבוצה של <MathText math="n" /> פתרונות למשוואה
          </p>
          <p className="intro-equation">
            <MathText block math="y^{(n)}+a_{n-1}(x)y^{(n-1)}+\dots+a_1(x)y'+a_0(x)y=0" />
          </p>
          <p>
            בקטע/קרן <MathText math="I" /> שבו <MathText math="a_0(x),\dots,a_{n-1}(x)" /> רציפות. אזי
            מתקיים בדיוק אחד מהבאים:
          </p>
          <ul className="intro-numbered-list">
            <li>
              <MathText math="W[y_1,\dots,y_n](x)=0" /> בכל הקטע, והקבוצה <strong>תלויה ליניארית</strong>.
            </li>
            <li>
              <MathText math="W[y_1,\dots,y_n](x)\neq 0" /> בכל הקטע, והקבוצה{" "}
              <strong>בלתי תלויה ליניארית</strong>.
            </li>
          </ul>
        </div>
        <p>
          כלומר, אם הוורונסקיאן מתאפס אפילו בנקודה אחת, הוא מתאפס בכל הקטע והקבוצה תהיה{" "}
          <strong>תלויה ליניארית</strong>.
        </p>
      </>
    ),
  },
  {
    title: "בסיס למרחב הפתרונות",
    kicker: "הפתרון הכללי",
    body: (
      <>
        <div className="intro-claim">
          <p>
            <strong>משפט (קיום בסיס למרחב הפתרונות).</strong> מרחב הפתרונות של המשוואה
          </p>
          <p className="intro-equation">
            <MathText block math="y^{(n)}+a_{n-1}(x)y^{(n-1)}+\dots+a_1(x)y'+a_0(x)y=0" />
          </p>
          <p>
            כאשר <MathText math="a_0(x),\dots,a_{n-1}(x)" /> רציפים בקטע/קרן <MathText math="I" /> הוא
            מרחב וקטורי <MathText math="n" /> ממדי.
          </p>
        </div>
        <p>
          המסקנה היא שכל קבוצה של <MathText math="n" /> פתרונות בת{'"'}ל למשוואה היא קבוצה פורשת. בנוסח
          מפורש, אם <MathText math="\{y_1,\dots,y_n\}" /> פתרונות בת{'"'}ל למשוואה, כל פתרון אחר של
          המשוואה הוא מהצורה
        </p>
        <p className="intro-equation">
          <MathText block math="y(x)=c_1y_1(x)+\dots+c_ny_n(x)" />
        </p>
        <p>
          כאשר <MathText math="c_1,\dots,c_n\in\mathbb{R}" /> קבועים כלשהם.
        </p>
      </>
    ),
  },
];

const abelSubTopics: IntroTopic[] = [
  {
    title: "שחזור משוואה מבסיס הפתרונות",
    kicker: "מהבסיס למשוואה",
    body: (
      <>
        <div className="intro-claim">
          <p>
            <strong>משפט (שחזור משוואה מבסיס הפתרונות).</strong> נניח כי{" "}
            <MathText math="y_1,\dots,y_n" /> פונקציות גזירות <MathText math="n" /> פעמים בקטע/קרן{" "}
            <MathText math="I" />, כך שמתקיים <MathText math="W[y_1,\dots,y_n](x)\neq 0" /> בכל הקטע. אזי
            המשוואה
          </p>
          <p className="intro-equation">
            <MathText block math="\frac{W[y_1,\dots,y_n,y](x)}{W[y_1,\dots,y_n](x)}=0" />
          </p>
          <p>
            היא משוואה ליניארית הומוגנית מסדר <MathText math="n" /> המקיימת את תנאי משפט הקיום והיחידות
            ב-<MathText math="I" />, כך ש-<MathText math="\{y_1,\dots,y_n\}" /> הוא בסיס למרחב הפתרונות
            שלה. יתרה מכך, זוהי המשוואה המנורמלת היחידה שמקיימת את הדרוש.
          </p>
        </div>
        <p>
          מנגד, אם קיים <MathText math="x_0\in I" /> שעבורו{" "}
          <MathText math="W[y_1,\dots,y_n](x_0)=0" />, לא קיימת משוואה ליניארית מסדר <MathText math="n" />{" "}
          עם קיום ויחידות שהקבוצה הנ״ל היא בסיס למרחב הפתרונות שלה.
        </p>
      </>
    ),
  },
];

const introTopics: IntroTopic[] = [
  {
    title: "נוסחת אבל",
    kicker: "התנהגות הוורונסקיאן",
    body: (
      <>
        <div className="intro-claim">
          <p>
            <strong>משפט (נוסחת אבל).</strong> יהיו <MathText math="y_1(x),\dots,y_n(x)" /> פתרונות
            למשוואה
          </p>
          <p className="intro-equation">
            <MathText block math="y^{(n)}+a_{n-1}(x)y^{(n-1)}+\dots+a_1(x)y'+a_0(x)y=0" />
          </p>
          <p>
            בקטע <MathText math="I" /> שבו המקדמים <MathText math="a_0(x),\dots,a_{n-1}(x)" /> רציפים.
            אזי, קיים <MathText math="C\in\mathbb{R}" /> שעבורו
          </p>
          <p className="intro-equation">
            <MathText block math="W[y_1,\dots,y_n](x)=Ce^{-\int a_{n-1}(x)\,dx}" />
          </p>
          <p>
            בפרט, לכל <MathText math="x_0\in I" /> ניתן לכתוב במפורש
          </p>
          <p className="intro-equation">
            <MathText
              block
              math="W[y_1,\dots,y_n](x)=W[y_1,\dots,y_n](x_0)e^{-\int_{x_0}^{x}a_{n-1}(t)\,dt}"
            />
          </p>
        </div>
        <p>
          שימו לב שמכאן אנחנו מזהים הוכחה נוספת לכך שאם הוורונסקיאן מתאפס בנקודה אחת, הוא יתאפס בכל
          הנקודות בקטע (על אף שמשפט זה לא מספק את התוצאה הנוספת לגבי תלות ליניארית).
        </p>
        <div className="intro-sub-expansion-list">
          {abelSubTopics.map((topic) => (
            <details className="intro-sub-expansion" key={topic.title}>
              <summary>{topic.title}</summary>
              <div className="intro-sub-expansion-body">
                <p className="course-kicker">{topic.kicker}</p>
                {topic.body}
              </div>
            </details>
          ))}
        </div>
      </>
    ),
  },
  {
    title: "הורדת סדר משוואה",
    kicker: "שימוש בפתרון ידוע",
    body: (
      <>
        <div className="intro-claim">
          <p>
            <strong>משפט (הורדת סדר משוואה, אבל).</strong> יהא <MathText math="y_1(x)" /> פתרון לא
            טריוויאלי של המשוואה
          </p>
          <p className="intro-equation">
            <MathText block math="y''+a_1(x)y'+a_2(x)y=0" />
          </p>
          <p>
            בקטע/קרן <MathText math="I" /> שבו <MathText math="a_1(x),a_2(x)" /> פונקציות רציפות. אזי,
            הפונקציה
          </p>
          <p className="intro-equation">
            <MathText
              block
              math="y_2(x)=y_1(x)\int \frac{e^{-\int a_1(x)\,dx}}{(y_1(x))^2}\,dx"
            />
          </p>
          <p>
            היא פתרון נוסף למשוואה כך ש-<MathText math="\{y_1,y_2\}" /> בת{'"'}ל.
          </p>
        </div>

        <p>נעבור לשיטה השנייה, המבוססת על וריאציית פרמטרים.</p>

        <div className="intro-claim">
          <p>
            <strong>משפט (הורדת סדר משוואה, וריאציית פרמטרים).</strong> תהא{" "}
            <MathText math="y_1,\dots,y_k" /> קבוצה של <MathText math="k<n" /> פתרונות בת{'"'}ל למשוואה
          </p>
          <p className="intro-equation">
            <MathText block math="y^{(n)}+a_{n-1}(x)y^{(n-1)}+\dots+a_1(x)y'+a_0(x)y=0" />
          </p>
          <p>
            בקטע/קרן <MathText math="I" /> שבו המקדמים{" "}
            <MathText math="a_0(x),\dots,a_{n-1}(x)" /> רציפים. אזי, לכל פתרון <MathText math="y" /> של
            המשוואה, קיים <MathText math="v" /> עבורו <MathText math="y(x)=v(x)y_1(x)" />, והוא פתרון של
            משוואה ליניארית מהצורה
          </p>
          <p className="intro-equation">
            <MathText block math="v^{(n)}+b_{n-1}(x)v^{(n-1)}+\dots+b_1(x)v'(x)=0" />
          </p>
          <p>
            כאשר <MathText math="b_1(x),\dots,b_{n-1}(x)" /> רציפים ב-<MathText math="I" />. בסימון{" "}
            <MathText math="z=v'" />, מתקבלת המשוואה
          </p>
          <p className="intro-equation">
            <MathText block math="z^{(n-1)}+b_{n-1}(x)z^{(n-2)}+\dots+b_1(x)z(x)=0" />
          </p>
          <p>
            שהיא משוואה מסדר <MathText math="n-1" />, שלה יש <MathText math="k-1" /> פתרונות בת{'"'}ל
          </p>
          <p className="intro-equation">
            <MathText
              block
              math="z_1(x)=\left(\frac{y_2(x)}{y_1(x)}\right)',\dots,z_{k-1}(x)=\left(\frac{y_k(x)}{y_1(x)}\right)'"
            />
          </p>
        </div>

        <p>
          שימו לב שבצורה כזאת, הפתרון <MathText math="y_1" /> מאפשר להוריד את המשוואה סדר אחד, אך לאחר
          הורדה זו מקבלים <MathText math="k-1" /> פתרונות למשוואה החדשה, וניתן להשתמש בהם כדי להמשיך
          ולהוריד את המשוואה סדר נוסף, עד שלבסוף מורידים את המשוואה <MathText math="k" /> פעמים את הסדר
          למשוואה מסדר <MathText math="n-k" />.
        </p>
        <p>
          היתרון של השיטה הזאת הוא הכלליות שלה ביחס לשיטה הקודמת, שתקפה רק למשוואה מסדר שני, אך היא בד{'"'}כ
          מסובכת למדי מבחינה חישובית.
        </p>
      </>
    ),
  },
  {
    title: "יציבות",
    kicker: "התנהגות פתרונות",
    body: (
      <p>
        בסיום נבחן כיצד התנהגות הפתרונות בקטע או בקרן משפיעה על שאלות יציבות: האם פתרונות נשארים חסומים,
        מתכנסים לאפס, או מתרחקים כאשר מתקדמים לאורך התחום.
      </p>
    ),
  },
];

export function LinearHomogeneousIntro() {
  return (
    <div className="module-intro-page" aria-label="מבוא למשוואות ליניאריות הומוגניות">
      <article className="module-intro-card video-placeholder module-intro-video">
        <div className="section-heading">מקום לסרטון</div>
        <div className="embedded-placeholder">
          <span>Embedded video</span>
          <strong>יתווסף בהמשך</strong>
        </div>
      </article>

      <article className="module-intro-card module-intro-content" aria-label="מודול לימודי">
        <p className="course-kicker">מודול לימודי</p>
        <h2>משוואות ליניאריות הומוגניות</h2>
        <p>
          במודול זה נעסוק במשוואות ליניאריות הומוגניות מסדר <MathText math="n" />. הצורה הכללית והמנורמלת
          של המשוואה היא
        </p>
        <p className="intro-equation">
          <MathText block math="y^{(n)}+a_{n-1}(x)y^{(n-1)}+\dots+a_1(x)y'+a_0(x)y=0" />
        </p>
        <p>
          כאשר <MathText math="a_0(x),\dots,a_{n-1}(x)" /> פונקציות רציפות בקטע/קרן{" "}
          <MathText math="I" />.
        </p>
        <p>
          דרישת הרציפות של המקדמים <MathText math="a_0,\dots,a_{n-1}" /> היא דרישה מינימלית לקיום
          ויחידות.
        </p>

        <div className="intro-claim">
          <p>
            <strong>משפט (קיום ויחידות למשוואות ליניאריות).</strong> תהא
          </p>
          <p className="intro-equation">
            <MathText block math="y^{(n)}+a_{n-1}(x)y^{(n-1)}+\dots+a_1(x)y'+a_0(x)y=f(x)" />
          </p>
          <p>
            משוואה ליניארית מסדר <MathText math="n" /> כאשר{" "}
            <MathText math="f(x),a_0(x),\dots,a_{n-1}(x)" /> פונקציות רציפות בקטע/קרן{" "}
            <MathText math="I" />. אזי, לכל <MathText math="x_0\in I" />, ולכל{" "}
            <MathText math="c_1,\dots,c_n\in\mathbb{R}" />, קיים פתרון יחיד למשוואה המוגדר בקטע/קרן{" "}
            <MathText math="I" />, שמקיים את תנאי ההתחלה
          </p>
          <p className="intro-equation">
            <MathText block math="y(x_0)=c_1,\quad y'(x_0)=c_2,\quad \dots,\quad y^{(n-1)}(x_0)=c_n" />
          </p>
        </div>
        <p>
          במקרה של משוואות הומוגניות, <MathText math="f(x)=0" /> ולכן רציפות המקדמים היא תנאי מינימלי
          לכך שלכל תנאי התחלה יהיה פתרון, ושכל פתרון יהיה מוגדר בכל הקטע/קרן <MathText math="I" />.
        </p>

        <div className="intro-expansion-list">
          <details className="intro-expansion">
            <summary>מרחב הפתרונות למשוואה</summary>
            <div className="intro-expansion-body">
              <div className="intro-sub-expansion-list">
                {solutionSpaceSubTopics.map((topic) => (
                  <details className="intro-sub-expansion" key={topic.title}>
                    <summary>{topic.title}</summary>
                    <div className="intro-sub-expansion-body">
                      <p className="course-kicker">{topic.kicker}</p>
                      {topic.body}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </details>

          {introTopics.map((topic) => (
            <details className="intro-expansion" key={topic.title}>
              <summary>{topic.title}</summary>
              <div className="intro-expansion-body">
                <p className="course-kicker">{topic.kicker}</p>
                {topic.body}
              </div>
            </details>
          ))}
        </div>
      </article>
    </div>
  );
}
