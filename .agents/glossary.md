# Hebrew Terminology Glossary

Canonical Hebrew wording for student-facing text. The goal is that a student meets the
same term in the same form in every module. Extend this file whenever a new term is
introduced; it is meant to grow.

Source of truth for existing terms: `app/constant-coefficients-euler/constants.ts`, which
holds most of the curated label maps.

## Core objects

| Concept | Hebrew |
| --- | --- |
| Ordinary differential equation | משוואה דיפרנציאלית רגילה |
| Normalized equation | המשוואה המנורמלת |
| Characteristic polynomial | פולינום אופייני |
| Normalized characteristic polynomial | הפולינום האופייני המנורמל |
| Root / multiplicity | שורש / ריבוי |
| Basis | בסיס |
| Fundamental system | מערכת יסודית |
| Wronskian | וורונסקיאן |
| Abel's formula | נוסחת אבל |
| Reduction of order | הורדת סדר |
| Variation of parameters | וריאציית פרמטרים |
| Initial conditions | תנאי התחלה |
| General solution | פתרון כללי |
| Linear dependence / independence | תלות ליניארית / אי־תלות ליניארית |
| Euler equation | משוואת אוילר |
| Constant coefficients | מקדמים קבועים |

## Phase plane

| Concept | Hebrew |
| --- | --- |
| Phase plane | מישור פאזה |
| Autonomous system | מערכת אוטונומית |
| Critical point | נקודה קריטית |
| Linearization | לינאריזציה |
| Eigenvalue / eigenvector | ערך עצמי / וקטור עצמי |
| Trace / determinant / discriminant | עקבה / דטרמיננטה / דיסקרימיננטה |
| Saddle | אוכף |
| Node | קשר |
| Star | כוכב |
| Degenerate node | קשר מנוון |
| Center | מרכז |
| Spiral | ספירלה |
| Direction field | שדה כיוונים |
| Trajectory | מסלול |

## Stability

Use these exactly — they are the three-way classification the course uses:

| Concept | Hebrew |
| --- | --- |
| Asymptotically stable | יציבה אסימפטוטית |
| Stable but not asymptotically stable | יציבה אך לא יציבה אסימפטוטית |
| Unstable | אינה יציבה |

Standard justifications: `לכל השורשים חלק ממשי שלילי` ·
`קיים שורש בעל חלק ממשי חיובי` ·
`אין שורש בעל חלק ממשי חיובי, אך קיים שורש על הציר המדומה בריבוי גדול מ־1`

## Reconstruction outcomes

| Concept | Hebrew |
| --- | --- |
| Unique equation | משוואה יחידה |
| One-parameter family | משפחה חד־פרמטרית |
| Two-parameter family | משפחה דו־פרמטרית |
| No such equation | אין משוואה מתאימה |
| Forced roots | שורשים מוכרחים |
| Degree overflow (forced data exceed the order) | השורשים המוכרחים חורגים מהסדר |
| Behavior conflict | סתירה לתנאי ההתנהגות |
| Free monic quadratic | גורם ריבועי מנורמל חופשי |
| Leading coefficient | מקדם מוביל |

## Sequences and series (planned module)

| Concept | Hebrew |
| --- | --- |
| Sequence / series of functions | סדרת פונקציות / טור פונקציות |
| Pointwise convergence | התכנסות נקודתית |
| Uniform convergence | התכנסות במידה שווה |
| Weierstrass M-test | מבחן M של ויירשטראס |
| Power series | טור חזקות |
| Radius of convergence | רדיוס התכנסות |
| Taylor series | טור טיילור |
| Term-by-term differentiation / integration | גזירה / אינטגרציה איבר־איבר |

## Action labels

Same student action, same wording. Use the noun form on chrome buttons, not a
singular imperative (`בדיקה`, not `בדוק`).

| Action | Hebrew |
| --- | --- |
| Check (single-stage practice) | בדיקה |
| Check a named stage | בדיקת X (keep naming the object) |
| New question (sidebar; may abandon the current one) | שאלה חדשה |
| Next question (after the current one is done) | שאלה הבאה |
| Reveal the answer for a stage | הצג תשובה לשלב |
| Hint (button or disclosure) | רמז |
| Hints (section heading when several are shown) | רמזים |
| Clear the typed answer | איפוס תשובה |
| Reset session statistics | איפוס מעקב |
| Practice tab | תרגול |
| Assemble-equation tab | הרכבת המשוואה |
| Difficulty heading | רמת קושי |
| Module tab bar `aria-label` | לשוניות המודול |
| Awaiting check | ממתינים לבדיקה |
| Brief correct status | נכון (no exclamation mark) |
| Questions answered (stats) | שאלות |
| Completed independently (stats) | הושלמו בנפרד |
| Session accuracy (stats) | דיוק |
| Mixed difficulty chip | מעורב |

## Site and course navigation

The site shell in `app/_site/`. A course is organized by the chapters (פרקים) and
sections (סעיפים) of its lecture notes; the modules live inside chapters.

| Concept | Hebrew |
| --- | --- |
| Dashboard heading | הקורסים שלי |
| Enter a course (card CTA) | כניסה לקורס |
| Full-materials panel | חומר הקורס |
| Lecture notes (the PDF) | רשימות הקורס (in running text: הרשימות) |
| Extended syllabus | סילבוס מורחב |
| Formula sheet | דף נוסחאות |
| Table of contents | תוכן העניינים |
| Chapter / section of the notes | פרק / סעיף |
| Chapter label | פרק N · שם הפרק |
| Page reference | עמ׳ N |
| Module status | מודול פעיל / מודול בבנייה |
| Interactive modules (chapter section heading) | מודולים אינטראקטיביים |
| Open the chapter in the notes | פתיחת הפרק ברשימות |
| Previous / next chapter | הפרק הקודם / הפרק הבא |
| Breadcrumbs `aria-label` | מיקום באתר |
| Chapter rail `aria-label` | פרקי הקורס |
| Chapter pager `aria-label` | מעבר בין פרקים |

Notes reader (`NotesFrame`), in the course page and the chapter-page dialog:

| Concept | Hebrew |
| --- | --- |
| Previous / next section (icon buttons, `aria-label`) | הסעיף הקודם / הסעיף הבא |
| Show or hide the table of contents (toggle) | תוכן העניינים |
| Open the PDF outside the site | פתיחה בלשונית חדשה |
| Download the PDF | הורדה |
| Close (icon button, `aria-label`; same as the module modals) | סגירה |
| Location before any section is chosen | עמוד השער |
| Iframe `title` | רשימות הקורס |

## Difficulty chips

Student-facing labels are **קל / בינוני / קשה**, plus **מעורב** when a session mixes them.
The third tier is **קשה**, not `מתקדם`. TypeScript keys may still be `hard` or `advanced`;
do not rename keys to match the Hebrew.

## Orthography

- Use the maqaf `־` in compounds: `חד־פרמטרית`, `דו־פרמטרית`, `איבר־איבר`, `אי־תלות`.
  Not a hyphen-minus.
- Use `מ־1`, not `מ-1`.
- Guillemets `« »` appear in `ARCHITECTURE.md` for UI labels; in the UI itself prefer
  plain quotation marks.
- Mathematical symbols always render through KaTeX, never as Unicode characters in Hebrew
  prose. Write `\lambda` in LaTeX, not `λ` inline.
- Terminal punctuation belongs outside an LTR math island, or it will jump to the wrong
  side of the line.
