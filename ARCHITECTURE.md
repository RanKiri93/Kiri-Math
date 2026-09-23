# ארכיטקטורת האתר — Kiri Math (קורס 104136)

מסמך זה מתאר את הארכיטקטורה של האתר: מעטפת הקורסים, מבנה התוכן, המודולים, שכבות הלוגיקה המתמטית, ומערכת העיצוב.

**עדכון אחרון:** 23 בספטמבר 2026

---

## 1. תמונה כללית

האתר (שם עבודה: **Kiri Math**) הוא סביבת לימוד אינטראקטיבית בעברית מלאה (RTL), שבנויה לארח כמה קורסים. כרגע יש בו קורס אחד, משוואות דיפרנציאליות רגילות (104136). כל קורס מאורגן לפי פרקי הרשימות שלו, ובפרקים יושבים מודולים עצמאיים. כל מודול משלב: מבוא תיאורטי, פעילות חקירה אינטראקטיבית, ותרגול עצמי עם משוב. תוכנית המבנה הרב־קורסי: `docs/plans/kiri-math-site-structure.md`.

### מפת האתר

```
/  (הקורסים שלי — כרטיס לכל קורס; כרגע קורס אחד)
└── /ode                                    משוואות דיפרנציאליות רגילות — פאנל «חומר הקורס»
    ├── /ode/1                              פרק 1 · סדרות וטורים של פונקציות
    │   └── /ode/1/function-sequences-series      סדרות וטורי פונקציות          [בבנייה]
    │         מבוא │ סדרות פונקציות │ טורי פונקציות │ טורי חזקות │ טורי טיילור
    │           └── מבוא פעיל (מפת דרך); ארבע לשוניות התוכן הן placeholders מתוכננים
    ├── /ode/2, /ode/3                      פרקים 2–3 (אין עדיין מודולים)
    ├── /ode/4                              פרק 4 · משוואות מסדר גבוה
    │   ├── /ode/4/linear-homogeneous             משוואות ליניאריות הומוגניות   [בבנייה]
    │   │     מבוא │ הרכבת משוואה │ וורונסקיאן (placeholder) │ תרגול
    │   │       └── השלמה למערכת יסודית  (סדר 2, משפחות זרועות)
    │   └── /ode/4/constant-coefficients-euler    מקדמים קבועים ומשוואות אוילר  [פעיל]
    │         מבוא │ הרכבת המשוואה │ תרגול
    │           ├── מקדמים קבועים        (תרגול רב־שלבי)
    │           ├── משוואות אוילר        (תרגול טרנספורמציה)
    │           └── שחזור משוואה         (תבניות CC סדר 2/3; אחרת tryGenerateLegacy)
    ├── /ode/5                              פרק 5 · מערכות מד״ר
    │   └── /ode/5/phase-plane                    מישור הפאזה                   [פעיל]
    │         מבוא │ מישור פאזה (מעבדה) │ הרכבת המטריצה │ תרגול עצמי
    └── /ode/6                              פרק 6 · תורת שטורם ליוביל (אין עדיין מודולים)
```

הכתובות הישנות (`/phase-plane`, `/constant-coefficients-euler`, `/linear-homogeneous`, `/function-sequences-series`) מפנות (307) לנתיב החדש.

### מצב המודולים

| מודול | כרטיס בעמוד הפרק | מצב |
|---|---|---|
| מישור פאזה | פעיל | שלם: מבוא, מעבדה, הרכבת מטריצה, תרגול |
| מקדמים קבועים ואוילר | פעיל | שלם: מבוא, הרכבה, שלושה מצבי תרגול |
| ליניאריות הומוגניות | **בבנייה** | מבוא ומעבדת הרכבה (סדר 2) פעילים; תרגול השלמה למערכת יסודית פעיל; לשונית וורונסקיאן placeholder; הורדת סדר כללית ויציבות עדיין תיאורטיות בלבד |
| סדרות וטורי פונקציות | **בבנייה** | מעטפת, ניווט ומבוא (מפת דרך) פעילים; ארבע לשוניות התוכן הן placeholders מתוכננים. אין עדיין מעבדת גרפים, מנועי תרגול או מתמטיקה סימבולית |

### טכנולוגיות

| רכיב | פירוט |
|---|---|
| Framework | **vinext** 0.0.50 (Vite 8 + Next.js 16 App Router) |
| UI | React 19, TypeScript |
| מתמטיקה | KaTeX + react-katex |
| אלגברה סימבולית | **nerdamer** 1.1.13 — בשימוש במודול הליניארי ההומוגני בלבד |
| בדיקות | **vitest** — `npm test`; במודול אוילר, במודול הליניארי ההומוגני, בנתוני הקורס (`app/ode/course.test.ts`) ובניווט הרשימות (`app/_site/notesNavigation.test.ts`) |
| פונט | Assistant (משקלים 400/600/700/800) דרך `@fontsource` |
| פריסה | Cloudflare Workers (`worker/index.ts`), wrangler |
| DB (אופציונלי) | Drizzle + D1 — הסכמה ריקה, לא בשימוש |

### ניהול State

React מקומי בלבד: `useState` / `useMemo` / `useRef` / `useEffect`. **אין** Context, Redux, localStorage או פרמטרים ב-URL. קורסים, פרקים ומודולים הם נתיבים; לשוניות בתוך מודול מנוהלות ב-state פנימי (לא בניתוב). עמודי הקורס והפרקים הם server components; ה-state היחיד בהם שייך לקורא הרשימות (הסעיף הפתוח), והוא לא נשמר בכתובת. שאלות תרגול נוצרות עם RNG זרוע (seeded) לשחזוריות. מודול ההומוגניות הליניארית **משתמש מחדש** ב-`SeededRandom` של מודול אוילר.

---

## 2. ניתוב ועמודים

| Route | קובץ | תפקיד |
|---|---|---|
| `/` | `app/page.tsx` | «הקורסים שלי»: סמליל `BrandWordmark` + רשת `CourseCard` מתוך `app/courses.ts` |
| `/ode` | `app/ode/page.tsx` | `CourseShell` עם פאנל «חומר הקורס» (`CourseMaterialsPanel`) |
| `/ode/1` … `/ode/6` | `app/ode/{1..6}/page.tsx` | עמוד פרק דרך `OdeChapterPage`: `CourseShell` + `ChapterPanel` |
| `/ode/5/phase-plane` | `app/ode/5/phase-plane/page.tsx` | טוען את `PhasePlaneModule` |
| `/ode/4/constant-coefficients-euler` | `app/ode/4/constant-coefficients-euler/page.tsx` | טוען את `ConstantCoefficientsEulerModule` (3 לשוניות) |
| `/ode/4/linear-homogeneous` | `app/ode/4/linear-homogeneous/page.tsx` | טוען את `LinearHomogeneousModule` (4 לשוניות) |
| `/ode/1/function-sequences-series` | `app/ode/1/function-sequences-series/page.tsx` | טוען את `FunctionSequencesSeriesModule` (5 לשוניות) |
| `/phase-plane`, `/constant-coefficients-euler`, `/linear-homogeneous`, `/function-sequences-series` | `page.tsx` בתיקייה הישנה | `redirect()` שרתי (307) לנתיב החדש תחת `/ode/N/` |
| `/courses/ode/*.pdf` | `public/courses/ode/` | `notes.pdf`, `syllabus.pdf`, `formula-sheet.pdf`, מועתקים ע״י `scripts/sync-course-notes.ts` |
| layout | `app/layout.tsx` | `lang="he" dir="rtl"`, טעינת Assistant + KaTeX CSS + `globals.css`; כותרת `%s · Kiri Math` |

כל עמוד מייצא `metadata` משלו (שם הקורס, `פרק N · שם` או שם המודול). הנתיבים הם תיקיות רגילות בלבד, בלי `[param]`, route groups או parallel routes: ה-dev server (vinext) הוא מימוש מחדש של ה-App Router, ורק `page.tsx` ו-`redirect()` נבדקו עליו ועל `next build`.

ניווט: מהדשבורד לכרטיס הקורס; בעמודי הקורס מסילת פרקים (`ChapterRail`) עם «חומר הקורס» ופרקים 1–6; בכל מודול topbar עם breadcrumbs (`Kiri Math › שם הקורס › פרק N · שם`) וכפתורי לשוניות (state, לא URL).

### מעטפת האתר (`app/_site/`)

שכבה שאינה תלויה בקורס מסוים: כל רכיב מקבל `CourseDefinition`. כולם server components, חוץ מקורא הרשימות: `NotesReader.tsx` ו-`NotesDialog.tsx` הם client components, ו-`NotesFrame`/`NotesToc` נטענים דרכם.

| קובץ | תפקיד |
|---|---|
| `courseModel.ts` | טיפוסים (`CourseDefinition`, `CourseModule`, `NotesChapter`, `CourseResource`, `CourseSummary`, `Crumb`) ועזרים טהורים: `notesPageHref` (עמוד מודפס + היסט → `#page=`), `modulesForChapter`, `modulesForSection`, `sectionRangeLabel`, `courseCrumbs`, `moduleCrumbs`, `summarizeCourse`; `siteName`. בלי React |
| `notesNavigation.ts` | ניווט טהור בתוך הרשימות: `NotesTarget` (שער / פרק / סעיף), `locateNotesTarget` (עמוד, כותרת, הסעיף הקודם והבא על פני כל הפרקים; פרק שהסעיף הראשון שלו מתחיל בעמוד הפרק מתנרמל לסעיף), `notesTargetFromData` (מתוך `data-notes-*`), `notesViewerSrc` (כתובת ה-iframe עם פרמטרי המציג), `notesLocationHref`. בלי React |
| `useNotesReader.ts` | `useNotesReaderAvailable()` — `useSyncExternalStore` על `(min-width: 821px)`, המשלים של `max-width: 820px` ב-CSS; בשרת `false`. `notesTargetFromClick` — מיירט רק לחיצה שמאלית רגילה על קישור עם `data-notes-*` (Ctrl/Shift/Alt/Cmd ולחיצה אמצעית נשארים לדפדפן) |
| `NotesFrame.tsx` | מסגרת הצפייה: שורת מיקום (פרק, עמוד, כותרת), הסעיף הקודם/הבא, מתג «תוכן העניינים» (אופציונלי), «פתיחה בלשונית חדשה», «הורדה», «סגירה» (אופציונלי), ו-iframe של מציג ה-PDF המובנה. `key={loadKey}` טוען את ה-iframe מחדש בכל מעבר, כי שינוי `#page=` לבדו לא מזיז את כל המציגים |
| `NotesToc.tsx` | תוכן העניינים המלא: כרטיס לכל פרק (קישור לעמוד הפרק + קישור לעמוד שלו ברשימות) ו-`NotesSectionList`; `aria-current="location"` על היעד הפתוח |
| `NotesReader.tsx` | הקורא שבפאנל «חומר הקורס»: תוכן העניינים בעמודה גוללת לצד `NotesFrame`, בגובה המסך. נפתח בעמוד השער; בחירה בתוכן העניינים מחליפה את העמוד במקום לפתוח לשונית. מתחת ל-821px אין iframe, ותוכן העניינים נשאר רשימת קישורים ללשונית חדשה |
| `NotesDialog.tsx` | `NotesDialogHost`: עוטף פאנל פרק ומיירט את קישורי הרשימות שבו; פותח `NotesFrame` ב-`<dialog>` מקורי (`showModal()`: שכבה עליונה, Esc, החזרת focus לקישור). הסגירה קוראת ל-`close()` וה-state מתאפס ב-`onClose`, אחרת ה-focus לא חוזר |
| `CourseMaterialsPanel.tsx` | פאנל החומר המלא: כרטיסי PDF (רשימות, סילבוס מורחב, דף נוסחאות) ו-`NotesReader` |
| `ChapterPanel.tsx` | פאנל פרק בתוך `NotesDialogHost`: כותרת עם מספר וקישור לפרק ברשימות, כרטיסי המודולים (או מצב ריק), סעיפי הפרק, מעבר לפרק הקודם/הבא |
| `NotesSectionList.tsx` | סעיפים: קישור לעמוד הסעיף ברשימות (`href` ללשונית חדשה + `data-notes-section` לקורא), תגיות המודולים שמכסים אותו, מספר עמוד |
| `notesNavigation.test.ts` | 12 בדיקות: שער, מעבר בין סעיפים וחציית פרקים, קצוות, פרק עם מבוא / בלי מבוא / בלי סעיפים, יעד לא קיים, מעבר על כל 35 הסעיפים האמיתיים, פרסור `data-*`, התאמת עמוד ה-iframe לקישור ללשונית חדשה |
| `CourseCard.tsx` | כרטיס קורס בדשבורד: קוד, שם, תיאור, מספר פרקים ומודולים |
| `Breadcrumbs.tsx` | `nav.site-breadcrumbs`; כל תווית עטופה ב-`<bdi>` |
| `BrandWordmark.tsx` | סמליל הטקסט «Kiri Math» (LTR) |

### נתוני הקורס (`app/ode/`)

| קובץ | תפקיד |
|---|---|
| `course.ts` | `odeCourse`: קוד, שם, תיאור, הרשימות, הפרקים, 4 מודולים (פרק, סעיפים, סטטוס, `href`) ו-3 משאבים |
| `notesToc.ts` | **נוצר אוטומטית** מ-`main.toc` ע״י `scripts/sync-course-notes.ts`: 6 פרקים, 35 סעיפים, `notesPageOffset = 4`. לא עורכים ידנית |
| `OdeChapterPage.tsx` | עמוד פרק משותף ל-`/ode/1..6`, וגם `odeChapterMetadata` / `odeModuleMetadata` |
| `OdeModuleBreadcrumbs.tsx` | ה-breadcrumbs שבתוך ה-topbar של ארבעת המודולים |
| `course.test.ts` | 16 בדיקות: מספור פרקים וסעיפים, עמודים לא יורדים, קובץ route לכל פרק ומודול, סעיפי מודול שייכים לפרק שלו, breadcrumbs, היסט העמודים, קובצי ה-PDF קיימים |
| `../courses.ts` | רשימת הקורסים שמוצגת בדשבורד (`summarizeCourse(odeCourse)`) |

שיוך המודולים לסעיפי הרשימות:

| מודול | פרק | סעיפים | סטטוס |
|---|---|---|---|
| סדרות וטורי פונקציות | 1 | 1.1–1.3 | בבנייה |
| משוואות ליניאריות הומוגניות | 4 | 4.2–4.3 | בבנייה |
| מקדמים קבועים ומשוואות אוילר | 4 | 4.4–4.6 | פעיל |
| מישור הפאזה | 5 | 5.2–5.3 | פעיל |

**עמודי הרשימות:** `main.toc` שומר את מספרי העמודים המודפסים, ו-`#page=` מצפה לאינדקס הפיזי. ההפרש (4 עמודי פתיחה) נקרא מטבלת `/PageLabels` שב-PDF עצמו בזמן הסנכרון, ו-`notesPageHref` מוסיף אותו.

**קורא הרשימות:** במסך רחב (מ-821px) הרשימות נפתחות בתוך האתר: בפאנל «חומר הקורס» בקורא הקבוע, ובעמודי הפרקים בחלון `<dialog>`. זה מציג ה-PDF של הדפדפן בתוך iframe, בלי ספרייה. `notesViewerSrc` מוסיף לכתובת `view=FitH&navpanes=0&toolbar=0` (Chrome/Edge) ו-`zoom=page-width&pagemode=none` (PDF.js של Firefox); כל מציג מתעלם מהפרמטרים שאינו מכיר. בכל הקישורים ה-`href` נשאר הקישור ללשונית חדשה, כך שבלי JavaScript, במסך צר או בלחיצה עם מקש, ההתנהגות היא של שלב 1.

### מה עדיין חסר במעטפת

- קישורי «לקריאה ברשימות» מתוך המודולים עצמם, אל הסעיפים שהם מכסים.
- עיצוב המציג המובנה מוגבל: ב-Firefox סרגל הכלים של PDF.js נשאר, ואין שליטה בצבעי המציג. אם זה לא יספיק, השלב הבא הוא מציג מבוסס pdf.js (תלות חדשה).
- רקעים ואיורים לכל קורס, אנימציית הכניסה לקורס («משוואות דיפרנציאליות רגילות») ולוגו.
- התאמת המודולים לגבולות הסעיפים ברשימות, ומודולים לפרקים 2, 3 ו-6.
- הרשמה והתחברות: הדשבורד מציג כרגע את כל הקורסים.

---

## 3. מודול מישור הפאזה

**קובץ מרכזי:** `app/phase-plane-module.tsx` — קובץ מונוליטי אחד (~5,400 שורות) המכיל את כל הלוגיקה, הציור וה-UI. **נתיב:** `/ode/5/phase-plane`.

### לשוניות

| לשונית | תפקיד |
|---|---|
| מבוא (`phase-intro`) | placeholder לסרטון + הרחבות תיאורטיות מתקפלות: מערכות אוטונומיות, נקודות קריטיות ולינאריזציה, סיווג לפי ויאטה, ותת־מקרים (אוכף, קשרים, כוכב, קשר מנוון, מרכז, ספירלות, ישרי שיווי משקל, נילפוטנטית, שדה אפס) עם קנבסים מוקטנים |
| מישור פאזה (`phase-lab`) | מעבדה בפריסת 3 עמודות: בקרה (מטריצה, presets, צפיפות, זום, עריכת דגימות) · קנבס · ניתוח (סיווג, ערכים עצמיים, tr/det/D, פאנלי «איך מציירים») |
| הרכבת המטריצה (`matrix-assembler`) | בחירת סוג תמונה (10 סוגים) → הזנת ערכים/וקטורים עצמיים → ולידציה → הרכבת `A` והצגתה (SVG) → «פתח במעבדה» |
| תרגול עצמי (`self-practice`) | שתי פעילויות: מטריצה→תמונה ותמונה→סיווג; רמות קושי, מסיחים, סטטיסטיקות ודו״ח טעויות (בזיכרון) |

### לוגיקה מתמטית

- `classify(matrix)` — סיווג לפי עקבה, דטרמיננטה ודיסקרימיננטה `D = tr² − 4·det`; 14 סוגי `PhaseKind`.
- `eigenSummary`, `eigenDirections`, `realEigenPairs` — חישובי ערכים/וקטורים עצמיים.
- בניית מטריצות ממודלים: `diagonal` / `star` / `defective` / `complex`.
- יצירת שאלות זרועה: `generatePhaseCase`, `buildPracticeQuestion` + `distractorMap`.

### ציור (`PhaseCanvas`)

Canvas 2D מותאם DPR; אינטגרציית RK4 למסלולים; פונקציות ציור ייעודיות לכל סוג תמונה (שדה כיוונים, אוכף, קשרים, כוכב, מרכז, ספירלות, ערך עצמי אפס); ציור ישרים עצמיים, חצים וראשית.

---

## 4. מודול מקדמים קבועים ומשוואות אוילר

**תיקייה:** `app/constant-coefficients-euler/` — מודול שכבתי (~30 קומפוננטות + שכבות `math/` ו-`practice/`). מעטפת: `ConstantCoefficientsEulerModule.tsx`; **נתיב:** `/ode/4/constant-coefficients-euler`.

### לשוניות

| לשונית | קומפוננטה | תפקיד |
|---|---|---|
| מבוא | `ConstantCoefficientsEulerIntro` | תוכן תיאורטי + placeholder לסרטון |
| הרכבת המשוואה | `EquationAssemblerActivity` | שורשים → פולינום אופייני → משוואה → בסיס |
| תרגול | `PracticeHub` | מיתוג בין שלושה מצבי תרגול |

### מצבי תרגול

1. **מקדמים קבועים** — `ConstantCoefficientFullPractice`: תרגיל רב־שלבי (פולינום → שורשים → בסיס → תנאי התחלה → יציבות), עם נעילת שלבים, חשיפת פתרון וסטטיסטיקות. תנאי התחלה דלוקים כברירת מחדל, ומוגבלים לדרגה ≤ 4 (`MAX_INITIAL_CONDITION_DEGREE`).
2. **משוואות אוילר** — `EulerTransformationPractice`: מקדמי אוילר → פולינום/משוואה מתמרת → שורשים → בסיס ב-u → בסיס ב-y → יציבות. **אין** שלב תנאי התחלה — בחירה מכוונת: הצינור כבר שישה שלבים, והנגזרת הקיימת (`basisTokenDerivativeAtZero`) קשיחה ל-\(x_0=0\), מחוץ לתחום \(x>0\). תרגול בעיית קושי נשאר במקדמים קבועים (ראו `docs/plans/euler-initial-conditions.md`).
3. **שחזור משוואה** — `EquationReconstructionPractice`: בהינתן פתרונות (ואולי התנהגות) → ישימות → שורשים מאולצים / משפחה חד־פרמטרית / משפחה דו־פרמטרית / בלתי אפשרי. שבב «משפחה דו־פרמטרית» מוצג רק בסדר 3 וכאשר הקושי אינו `קל` (`reconstructionCaseFilterOptions`).

### קומפוננטות (`components/`)

| קובץ | תפקיד |
|---|---|
| `MathText.tsx`, `DisplayMath.tsx` | רינדור KaTeX inline/block (ראו §7) |
| `StepCard.tsx`, `PracticeStats.tsx` | כרטיס שלב נעול/פתוח; חמשת מספרי הסשן (`שאלות` = שאלות שנפתרו, לא שהוצגו) |
| `RootGroupEditor.tsx`, `PracticeRootGroupEditor.tsx` | עריכת קבוצות שורשים (הרכבה / תרגול) |
| `PolynomialCoefficientEditor.tsx`, `DifferentialEquationCoefficientEditor.tsx`, `EulerCoefficientEditor.tsx`, `InitialCoefficientEditor.tsx` | עורכי מקדמים לסוגי הצגה שונים |
| `InitialConditionsStage.tsx`, `StabilityStage.tsx` | שלבי תנאי התחלה ויציבות |
| `ConstantBasisComposer.tsx`, `BasisElementComposer.tsx`, `EulerBasisElementComposer.tsx`, `BasisEditor.tsx` | הרכבת איברי בסיס (CC ואוילר) |
| `MathParameterInput.tsx` | שדה קלט נומרי בתוך נוסחה |
| `ReconstructionGivenData.tsx`, `ReconstructionInputs.tsx`, `ReconstructionFamilyConclusion.tsx`, `ReconstructionTwoParameterConclusion.tsx` | רכיבי פעילות השחזור, כולל מסקנה דו־פרמטרית (סדר 3) |

### שכבת המתמטיקה (`math/`)

| קובץ | תפקיד |
|---|---|
| `polynomial.ts`, `roots.ts` | פולינומים, פריסה משורשים, פרסור וולידציה |
| `basis.ts`, `basisDerivatives.ts` | אסימוני בסיס ↔ LaTeX (CC: `e^{rx}`, `x^k`; אוילר: `x^r`, `ln`); נגזרות ב-0 |
| `eulerConversion.ts` | המרת מקדמים חזקות ↔ falling factorial |
| `stability.ts` | סיווג יציבות לפי שורשים + נימוק |
| `initialConditions.ts` | מטריצת תנאי התחלה (Wronskian) ופתרונה |
| `reconstruction.ts`, `reconstructionBehavior.ts` | שורשים מאולצים, ישימות, ניתוח (יחיד / חד־פרמטרי / דו־פרמטרי / בלתי אפשרי); התנהגות ב-±∞ |
| `givenSolutionExpression.ts`, `rootCanonicalization.ts` | ביטויי פתרונות נתונים; קנוניזציה ומיזוג ריבויים |
| `parameterDomains.ts`, `affinePolynomial.ts`, `twoParameterFormatting.ts` | תחומי פרמטרים חופשיים; LaTeX לפולינומים אפיניים ומשפחות דו־פרמטריות |
| `algebraicFormatting.ts` | פורמט LaTeX משותף (ללא `1r`, סימנים כפולים וכו׳) |
| `mathTypography.ts` | helpers למחלקות CSS של גדלי נוסחאות |

### שכבת התרגול (`practice/`)

| קובץ | תפקיד |
|---|---|
| `random.ts` | `SeededRandom`, `mixSeed` — **משותף גם למודול ההומוגניות** |
| `questionGeneration.ts`, `eulerQuestionGeneration.ts`, `initialConditionGeneration.ts` | יצירת שאלות לכל מצב |
| `answerEvaluation.ts`, `polynomialEvaluation.ts`, `rootEvaluation.ts`, `initialConditionEvaluation.ts`, `stabilityEvaluation.ts` | בדיקת תשובות לכל שלב |
| `basisComposer.ts`, `rootDisplay.ts`, `stats.ts` | עזרי הרכבה, תצוגה, וסטטיסטיקות סשן (`answered` עולה בהשלמה או בנטישה אחרי שלב נכון; לא במount ולא בשבבים) |
| `reconstructionQuestionGeneration.ts`, `reconstructionEvaluation.ts` | תזמור יצירה והערכה לשחזור; `buildReconstructionQuestion` מנתב לפי `(equationKind, order)` |
| `reconstruction/order2Generation.ts`, `order3Generation.ts` | אינסטנציאציה משוקללת של תבניות `constant-coefficients` בסדר 2 ו-3 |
| `reconstruction/templates/shared.ts`, `order2.ts` (34 תבניות), `order3.ts` (36 תבניות) | מאגרי תבניות ל-CC סדר 2 ו-3 בלבד |

**ניתוב גנרטור שחזור** (`buildReconstructionQuestion`): מאגרי 34+36 התבניות מכסים רק `constant-coefficients` בסדר 2 ו-3. כל צירוף אחר — `euler` בכל סדר, ו-`constant-coefficients` בסדר 4–6 — עובר ל-`tryGenerateLegacy` ב-100% מהשאלות; זו לא נפילת קצה «אם אין תבנית מתאימה».

| `equationKind` | `order` | גנרטור |
|---|---|---|
| `constant-coefficients` | 2 | `buildOrder2ConstantCoefficientQuestion` (`order2.ts`, 34 תבניות) |
| `constant-coefficients` | 3 | `buildOrder3ConstantCoefficientQuestion` (`order3.ts`, 36 תבניות) |
| `constant-coefficients` | 4–6 | `tryGenerateLegacy` |
| `euler` | 2–6 | `tryGenerateLegacy` |

**זרימת יצירת שאלת שחזור (נתיב תבניות):** סינון לפי סוג/קושי → דגימת פרמטרים → ניתוח עם `analyzeReconstruction`. אין נפילה משם ל-legacy. אם כל ניסיונות `tryGenerateLegacy` נכשלים נשאר `fallbackQuestion`.

**סטטיסטיקות תרגול** (`PracticeStats` / `stats.ts`): `שאלות` סופר שאלות שנפתרו — השלמה עצמאית או בעזרת «הצג תשובה», או נטישה אחרי שלב שהיה פעם `correct`. שלוש החלפות קושי בלי בדיקה לא מזיזות את המספרים. `completionKind` נשאר reveal מול לא-reveal; ניסיונות שגויים לא מורידים. בדיקה: `practice/stats.test.ts`.

`templateMatchesDifficulty` ו-`order3TemplateMatchesDifficulty` בלעדיים (`template.difficulty === session`), באותה סמנטיקה כמו `generateRootGroups` במקדמים קבועים ובאוילר: שבב `קל` / `בינוני` / `קשה` דוגם רק תבניות עם אותו תג. התא הריק היחיד — סדר 3 × «משפחה דו־פרמטרית» × `קל` — אינו מוצג ב-UI (`reconstructionCaseFilterOptions`). בסשן `קשה` עם `caseFilter=mixed`, כל הדגימות בסדר 2 ובסדר 3 מגיעות מתבנית `hard` (לפני השינוי: 15.1% ו-19.3%).

### קבצי תשתית

- `types.ts` — לשוניות, מצבי תרגול, אסימוני בסיס, סטטוסי שלבים, סוגי שחזור ויציבות.
- `constants.ts` — גבולות (`MAX_DEGREE=6`), מאגרי שורשים, תוויות עבריות, מכסות ניסיונות יצירה.
- `utils/` — `formatting.ts`, `parsing.ts`, `id.ts`.

---

## 5. מודול משוואות ליניאריות הומוגניות

**תיקייה:** `app/linear-homogeneous/` — מודול שכבתי (components / math / practice), במבנה דומה למודול אוילר. מעטפת: `LinearHomogeneousModule.tsx`; **נתיב:** `/ode/4/linear-homogeneous`. מסומן בעמוד פרק 4 כ«מודול בבנייה».

המודול עוסק במשוואה המנורמלת
`y^{(n)}+a_{n-1}(x)y^{(n-1)}+⋯+a_0(x)y=0`
עם מקדמים רציפים בקטע/קרן.

### לשוניות

| לשונית | קומפוננטה | מצב |
|---|---|---|
| מבוא | `LinearHomogeneousIntro` | **פעיל** — תוכן תיאורטי + placeholder לסרטון |
| הרכבת משוואה | `EquationAssemblerActivity` | **פעיל** — סדר 2 בלבד ב-UI |
| וורונסקיאן | `WronskianPlaceholder` | **placeholder** — «בבנייה» |
| תרגול | `PracticePlaceholder` → `FundamentalCompletionActivity` | **פעיל** — השלמה למערכת יסודית (סדר 2) |

### מבוא

הרחבות מתקפלות (`.intro-expansion` / `.intro-sub-expansion`):

- קיום ויחידות למשוואות ליניאריות
- מרחב הפתרונות: מבנה אלגברי, תלות/אי־תלות, וורונסקיאן, משפט וורונסקיאן לפתרונות, קיום בסיס
- נוסחת אבל + שחזור משוואה מבסיס (משפט Abel–Liouville / uniqueness של המשוואה המנורמלת)
- הורדת סדר: נוסחת אבל (סדר 2) ווריאציית פרמטרים (כללי)
- יציבות: פסקה קצרה בלבד, בלי פעילות

### פעילות הרכבת משוואה

הזנת שתי פונקציות `y₁(x)`, `y₂(x)` בתחביר נוסחה חופשי → פרסור → בניית המשוואה המנורמלת הייחודית שמערכת זו היא בסיס שלה (כאשר `W ≠ 0`).

פריסת 3 עמודות (`.fundamental-activity-grid`): בקרה · כרטיס קלט עם תצוגה מקדימה חיה · פאנל תוצאה (`p(x)`, `q(x)`, וורונסקיאן, פתרון כללי). כשלונות: שגיאת פרסור, וורונסקיאן מנוון, חישוב סימבולי לא חד־משמעי.

ה-UI מוגבל לשתי פונקציות (סדר 2). שכבת המתמטיקה תומכת גם בסדר 3 ו-4.

### תרגול: השלמה למערכת יסודית

נתונה משוואה מסדר 2 ופתרון אחד `y₁`. הסטודנט מזין מועמד ל-`y₂`. האימות הסימבולי מבחין בין: שגיאת פרסור, בעיית תחום, אינו פתרון, פתרון תלוי ליניארית, נכון, ולא חד־משמעי.

- רמות: קל / בינוני / קשה / מעורב (40% / 40% / 20%).
- רמזים מדורגים בשתי דרכים: נוסחת אבל / הצבה `y=vy₁`.
- סטטיסטיקות בזיכרון: שאלות, נפתרו, דיוק, רצף.
- תשובה נכונה כוללת גם כפולה של הפתרון הקנוני וגם צירוף ליניארי עם `y₁`.

### שכבת המתמטיקה (`math/`)

המודול הראשון שמשתמש באלגברה סימבולית כללית (nerdamer), בניגוד למודול אוילר שעובד עם שורשים/פולינומים מובְנים.

| קובץ | תפקיד |
|---|---|
| `formulaParser.ts` | פרסר נוסחאות: `+ − * / ^`, `exp/ln/log/sin/cos/tan/cot/sqrt`, קבועים `e`/`pi`; פלט AST + מחרוזת nerdamer + LaTeX. דורש כפל מפורש (`3*x`) |
| `differentiate.ts` | גזירה סימבולית על ה-AST (לא דרך nerdamer) |
| `nerdamerConfig.ts` | שומר על `e`/`π` סימבוליים; `safeEvaluate` עם restore של `PARSE2NUMBER` אחרי זריקה |
| `equationFromBasis.ts` | בניית המשוואה המנורמלת מבסיס (`n=2,3,4`); מסלול מהיר לסדר 2 (`p=−W′/W`, `q=(y₁′y₂″−y₁″y₂′)/W`); מסלול כללי דרך מינורים |
| `symbolicDeterminant.ts` | דטרמיננטה סימבולית עד 4×4 (פיתוח לפי שורה) |
| `symbolicSimplify.ts` | פישוט קריא לתצוגה: `readableSimplify`, `readableQuotient`, `compactViaLinearShift`; **לא** לאימות |
| `displayQuotient.ts` | שכתוב קוסמטי `(1+x)^(-1)*(2x+3)` → מנה; לתצוגה בלבד |
| `equationFormatting.ts` | LaTeX למשוואה, וורונסקיאן, פתרון כללי ומקדמים |
| `fundamentalCompletionVerifier.ts` | אימות תשובה: שיור המשוואה + וורונסקיאן מול `y₁` בנקודות דגימה ובדיקה סימבולית של אפס |
| `mathTypography.ts` | עותק של ה-helpers ממודול אוילר |

### שכבת התרגול (`practice/`)

| קובץ | תפקיד |
|---|---|
| `fundamentalCompletionGenerator.ts` | 10 משפחות תבניות עם פרמטרים זרועים; שער קריאות; ולידציה שהקנוני עובר את ה-verifier |
| `fundamentalCompletionQuestions.ts` | טיפוס השאלה + fixtures ישנים לרגרסיה (הריצה בפועל מהגנרטור) |

**משפחות השאלות:**

| משפחה | קושי | דוגמה טיפוסית |
|---|---|---|
| `polynomial-pair` | קל | זוג פולינומים |
| `quadratic-quartic` | קל | `x²+1` ו-`x⁴` |
| `shifted-linear-log` | קל | `(ax+b) ln(ax+b)` |
| `sqrt-reciprocal` | קל | `√(x−h)` ו-`1/√(x−h)` |
| `quadratic-linear-exponential` | בינוני | `e^{ax²}` ו-`e^{bx}` |
| `reciprocal-exponential` | בינוני | `e^{c/x}` |
| `log-power` | בינוני | `ln x` ו-`x^m` |
| `sqrt-exponential` | בינוני | `√(x−h) e^{±cx}` |
| `sine` | קשה | `sin(kx)`, `sin(kx)cos(kx)` |
| `cosine` | קשה | `cos(kx)`, `x cos(kx)` |

### קומפוננטות (`components/`)

| קובץ | תפקיד |
|---|---|
| `MathText.tsx`, `DisplayMath.tsx` | עותק של רינדור KaTeX ממולול אוילר |
| `LinearHomogeneousIntro.tsx` | מבוא תיאורטי |
| `EquationAssemblerActivity.tsx` | מעבדת הרכבה מסדר 2 |
| `FundamentalCompletionActivity.tsx` | תרגול השלמה למערכת יסודית |
| `PracticePlaceholder.tsx` | מעטפת דקה שטוענת את פעילות ההשלמה |
| `WronskianPlaceholder.tsx` | מסך «בקרוב» ללשונית הוורונסקיאן |

### בדיקות (`*.test.ts`)

Vitest (`npm test`, `app/**/*.test.ts`):

| קובץ | מכסה |
|---|---|
| `equationFromBasis.test.ts` | דטרמיננטות; הרכבה מסדר 2/3/4; וורונסקיאן מנוון; שגיאות פרסור |
| `fundamentalCompletion.test.ts` | פרסר; אימות תשובות קנוניות ולא־קנוניות; יצירת משפחות |
| `symbolicSimplify.test.ts` | פישוט קריא ומנות |
| `displayQuotient.test.ts` | שכתוב חזקות שליליות למנות |
| `exactConstants.test.ts` | `e`/`π` נשארים סימבוליים ואינם מתרציונלים |

### מה עדיין חסר במודול

- פעילות וורונסקיאן אינטראקטיבית (הלשונית קיימת כ-placeholder).
- UI להרכבה מסדר 3–4 (המתמטיקה כבר תומכת).
- תרגול הורדת סדר כללית (וריאציית פרמטרים ל-`n>2`) ויציבות — מופיעים במבוא בלבד.
- מצבי תרגול נוספים מעבר להשלמה למערכת יסודית.

---

## 6. מודול סדרות וטורי פונקציות

**תיקייה:** `app/function-sequences-series/` — מודול שכבתי במבנה דומה למודולי אוילר וההומוגניות. **נתיב:** `/ode/1/function-sequences-series`. מסומן בעמוד פרק 1 כ«מודול בבנייה».

המודול עוסק בחלק המתמטי הפותח של הקורס: סדרות פונקציות, טורי פונקציות, טורי חזקות וטורי טיילור.

המעטפת היא `FunctionSequencesSeriesModule.tsx`, שנטענת מ-`app/ode/1/function-sequences-series/page.tsx`. המעטפת אחראית ל-layout, ל-topbar ולמצב הלשוניות בלבד (`useState` מקומי; רענון מחזיר ללשונית הראשונה). אין Context, localStorage או פרמטרים ב-URL.

### לשוניות

| לשונית | קומפוננטה | מצב |
|---|---|---|
| מבוא (`intro`) | `FunctionSequencesSeriesIntro` | **פעיל** — מפת דרך של ארבעה פרקים, לא ספר לימוד |
| סדרות פונקציות (`function-sequences`) | `FunctionSequencesSection` | **placeholder מתוכנן** |
| טורי פונקציות (`function-series`) | `FunctionSeriesSection` | **placeholder מתוכנן** |
| טורי חזקות (`power-series`) | `PowerSeriesSection` | **placeholder מתוכנן** |
| טורי טיילור (`taylor-series`) | `TaylorSeriesSection` | **placeholder מתוכנן** |

ארבע לשוניות התוכן משתמשות ב-`SectionPlaceholder` משותף: כותרת, תיאור קצר עם נוסחאות, רשימת «פעילויות מתוכננות», ומסגרת «פעילות אינטראקטיבית / בבנייה». **אין** עדיין מעבדת גרפים, Canvas, מנועי תרגול או לוגיקה סימבולית.

### מבוא

ארבעה כרטיסים ברשת `.module-intro-grid`:

- סדרות פונקציות — התכנסות נקודתית מול במידה שווה, והעברת רציפות/אינטגרציה/גזירה דרך הגבול.
- טורי פונקציות — נקודת המבט `S_N`, מבחן `M` של ויירשטראס, לייבניץ, ומשפטי העברה לסכום.
- טורי חזקות — מרכז, רדיוס, קטעים פנימיים, נקודות קצה, גזירה ואינטגרציה איבר־איבר.
- טורי טיילור — הקשר `a_n=f^{(n)}(x_0)/n!` ובניית טורים מתוך טורים מוכרים.

### קומפוננטות (`components/`)

| קובץ | תפקיד |
|---|---|
| `MathText.tsx`, `DisplayMath.tsx` | עותק של רינדור KaTeX ממודול אוילר (ראו §7) |
| `FunctionSequencesSeriesIntro.tsx` | מפת דרך של המודול |
| `SectionPlaceholder.tsx` | מעטפת משותפת ללשוניות התוכן שטרם מומשו |
| `FunctionSequencesSection.tsx`, `FunctionSeriesSection.tsx`, `PowerSeriesSection.tsx`, `TaylorSeriesSection.tsx` | תוכן מתוכנן לכל פרק |

`math/mathTypography.ts` הוא עותק של עזרי מחלקות CSS, שנדרש ל-`MathText`/`DisplayMath`. אין עדיין שכבת `math/` אלגוריתמית ואין תיקיית `practice/`.

### הכנה למעבדת גרפים

המחלקה `.function-series-lab-grid` כבר מוגדרת ב-`globals.css` באותם breakpoints של שאר רשתות שלוש העמודות (בקרה · גרף · ניתוח). היא **אינה בשימוש ב-UI** בשלב זה.

### מה עדיין חסר במודול

- מעבדת גרפים לסדרות (`f_n`, `f`, פונקציית שגיאה, supremum).
- פעילויות על טורי פונקציות, טורי חזקות וטורי טיילור.
- שכבות `math/` ו-`practice/` (משפחות פונקציות, רדיוס התכנסות, גנרטורים, `SeededRandom`).

---

## 7. מערכת רינדור מתמטי

**Stack:** `katex` + `react-katex`; ה-CSS נטען ב-layout הראשי.

| שכבה | מיקום | התנהגות |
|---|---|---|
| `DisplayMath` | `constant-coefficients-euler/components/`, `linear-homogeneous/components/`, `function-sequences-series/components/` ועותק מקומי ב-`phase-plane-module.tsx` | `katex.renderToString` עם `displayMode: true`; מחלקה `math-display`; `dir="ltr"` |
| `MathText` | אותן שלוש תיקיות | inline דרך `InlineMath` עם וריאנטים `inline` / `compact` / `standard`; מצב `block` מפנה ל-`DisplayMath` |
| `MathText` מקומי | `phase-plane-module.tsx` | `InlineMath` + `.math-render` עם `data-variant` (ברירת מחדל `inline`); מצב `block` מפנה ל-`DisplayMath` המקומי |
| אסימוני גודל | `math/mathTypography.ts` (עותק בכל מודול שכבתי) + `globals.css` | `--math-size-inline` (1em), `--math-size-compact`, `--math-size-standard` (clamp רספונסיבי) |

הערה: מודול מישור הפאזה **אינו** מייבא את צמד `MathText`/`DisplayMath` של המודולים השכבתיים — שני הרכיבים מוגדרים מקומית ב-`phase-plane-module.tsx`. מודולי ההומוגניות וסדרות הפונקציות מעתיקים את הצמד של מודול אוילר (אין חבילה משותפת עדיין).

---

## 8. מערכת העיצוב

**קובץ יחיד:** `app/globals.css` (~4,480 שורות) — כל העיצוב מבוסס מחלקות CSS מותאמות (Tailwind מיובא אך כמעט לא בשימוש utility). **Theme בהיר בלבד** — אין dark mode.

### שפה עיצובית: «מחברת נייר»

רקע קרם עם רשת משבצות עדינה (32×32px) ומשטח זהב רדיאלי קלוש; פאנלים «זכוכיתיים» עם blur; מתמטיקה בגופן KaTeX על רקע נייר.

### אסימוני עיצוב (`:root`)

| משתנה | ערך | תפקיד |
|---|---|---|
| `--paper` | `#fbf7ed` | רקע העמוד והקנבס (קרם) |
| `--paper-deep` | `#efe4cf` | נייר עמוק יותר: רקע אזור הצפייה בקורא הרשימות (`.notes-frame-viewer`) |
| `--ink` | `#252b33` | טקסט ראשי |
| `--muted` | `#6f736f` | תוויות משניות |
| `--line` | `rgba(37,43,51,0.16)` | מסגרות |
| `--blue` | `#235789` | Accent ראשי: קישורים, focus, מצבים נבחרים, מתמטיקה |
| `--blue-soft` | `#dce9f5` | מילוי כחול רך (לשוניות פעילות, בחירות) |
| `--green` | `#2f7f72` | הצלחה / פעולות משניות |
| `--green-soft` | `#dcece7` | מילוי ירוק רך |
| `--rust` | `#b85735` | שגיאה / אזהרה / הערות |
| `--danger` | `#b42318` | טקסט הרסני / שגיאה (נפרד מ-`--rust`) |
| `--gold` | `#c38c2c` | מבטא זהב (שטיפת העמוד, placeholders) |
| `--panel` | `rgba(255,252,244,0.82)` | רקע פאנלים |
| `--raised` | `#fffdf8` | משטח מוגבה / מילוי שדות ו-chips |
| `--shadow` | `0 24px 80px rgba(37,43,51,0.12)` | הצללת פאנלים |
| `--math-size-*` | ראו §7 | גדלי KaTeX |

צבעים סמנטיים נוספים (לא כמשתנים): ירוק תשובה נכונה `rgba(34,120,70,…)`, אדום קלט שגוי `rgba(180,50,50,0.55)`, ענבר «נחשף» `rgba(120,95,20,0.45)`. `#fff` על `.polynomial-coefficient-tooltip` הוא טקסט הפוך מאושר; דוגמיות המקרא `#2c456b` / `#83aff0` / `#ff9d00` נשארות ליטרלים.

### טיפוגרפיה

- **UI:** Assistant (400/600/700/800), נטען ב-`app/layout.tsx`.
- **מתמטיקה וקלט נומרי:** `KaTeX_Main, "Times New Roman", serif`.
- כותרות גדולות עם `clamp()` רספונסיבי (למשל `h1`: `clamp(2rem, 4vw, 4.25rem)`, משקל 800); תוויות מקטע קטנות (`0.78rem`, משקל 800, muted).

### RTL / LTR

- שורש: `<html lang="he" dir="rtl">`; כל מעטפת מודול מוסיפה `dir="rtl"`.
- **דפוס בידוד מתמטיקה:** כל עטיפת נוסחה מקבלת `dir="ltr"` ב-HTML + `direction: ltr; unicode-bidi: isolate` ב-CSS (`.math-display`, `.math-render`, שורות מקדמים, מטריצות SVG וכו׳).
- כלל אצבע: טקסט הדרכה עברי — RTL; נוסחאות, מטריצות, שורות מקדמים ו**שדות נוסחה חופשית** — איי LTR מבודדים.

### דפוסי פריסה

- **Shell:** `.app-shell` — רוחב מרבי ~1540px, ריפוד 22px (14px במובייל).
- **Topbar:** `.topbar` עם כותרת + ניווט `.module-pill` (פעיל → מילוי כחול רך).
- **רשתות 3 עמודות** (ה-DNA המשותף של כל המודולים; במסך רחב כל השש חולקות `minmax(270px, 330px) minmax(520px, 1fr) minmax(260px, 340px)`):

| מחלקה | שימוש |
|---|---|
| `.lab-grid` | מעבדת מישור פאזה: בקרה · קנבס · ניתוח |
| `.assembler-grid` / `.equation-assembler-grid` | פעילויות הרכבה (פאזה / אוילר) |
| `.fundamental-activity-grid` | הרכבה ותרגול במודול ההומוגניות |
| `.function-series-lab-grid` | שמורה למעבדת סדרות פונקציות עתידית: בקרה · גרף · ניתוח (לא בשימוש ב-UI עדיין) |
| `.practice-grid` | מסכי תרגול במודול אוילר |

- **פאנלים:** `.control-panel` / `.canvas-panel` / `.analysis-panel` — רקע `--panel`, רדיוס 8px, `backdrop-filter: blur(14px)`, הצללת `--shadow`. כרטיסים מקוננים: `.panel-section`, `.result-card` (ו-`.result-card.primary` עם גרדיאנט כחול להדגשת הסיווג).
- **לשוניות משנה:** `.segmented-control`, `.practice-mode-nav`.
- **מעטפת האתר:** דשבורד `.dashboard` עם `.course-card`; `.course-shell-body` — רשת `minmax(230px, 290px) minmax(0, 1fr)` של `nav.chapter-rail` (sticky) ו-`.course-panel`; בפאנלים `.resource-grid` (3 עמודות), `.notes-toc` ו-`.notes-section` (רשת: קישור · תגיות · עמוד, עם `.module-tag`), `.course-module-card.active` מול `.construction` בעמודי הפרקים, ו-`nav.chapter-pager`. `nav.site-breadcrumbs` מופיע בכל ה-topbars; המפריד `›` מתהפך אוטומטית ב-RTL.
- **קורא הרשימות:** `.notes-reader` — רשת `minmax(240px, 0.42fr) minmax(0, 1fr)` בגובה `clamp(560px, 100vh − 44px, 1100px)`: `.notes-reader-toc` (עמודה גוללת; בתוכה הסעיף שורה אחת בלי עמודת העמוד, והתגיות בשורה משלהן) ו-`.notes-frame` (סרגל `.notes-frame-bar` עם `.notes-frame-button` ואזור צפייה על `--paper-deep`). `.toc-hidden` מקפל לעמודה אחת. היעד הפתוח מסומן ב-`--blue-soft` דרך `aria-current="location"`.

### דפוסי רכיבים

- **כפתורים:** `.panel-action` (ראשי, כחול-דיו על `#fffdf8`; `.secondary` ירוק), כפתורי preset/chips, `.icon-button`.
- **קלטים:** מיושרים למרכז, גופן KaTeX_Main לשדות נומריים, focus עם טבעת כחולה `0 0 0 3px rgba(35,87,137,0.14)`; מטריצות עם סוגריים מצוירים ב-pseudo-elements.
- **קלט נוסחה חופשית** (מודול הומוגניות): `.formula-input-label` + `.formula-preview` — שדה LTR עם תצוגת KaTeX חיה מתחתיו.
- **משוב תרגול:** `.quiz-option.correct` / `.wrong` (ירוק/rust), `.coefficient-correct` / `.coefficient-incorrect`, `.practice-step-card.status-*`, השלמה עצמאית (ירוק) מול נעזרת (ענבר).
- **מקרא קנבס:** `.legend-item` עם דוגמיות צבע — ישרים עצמיים `#2c456b`, וקטורים עצמיים `#83aff0`, מסלולים `#ff9d00`, שדה `rgba(35,87,137,0.32)`.
- **מודלים:** `.modal-backdrop` (דיו 22% + blur) + `.sample-modal`. חלון הרשימות בעמודי הפרקים הוא `<dialog>` מקורי, `.notes-dialog`, עם `::backdrop` באותם ערכים; בזמן שהוא פתוח `html:has(.notes-dialog[open])` נועל את גלילת העמוד.

### רספונסיביות

| Breakpoint | אפקט |
|---|---|
| ≤1180px | רשתות 3 עמודות → 2; פאנל הניתוח נפרס לרוחב; מסילת הפרקים הופכת לרצועה מעל הפאנל: «חומר הקורס» והפאנל הפעיל עם תווית, שאר הפרקים שבבי מספר (התווית נשארת לקוראי מסך וב-`title`) |
| ≤960px | `.stability-classification-grid` → שתי עמודות |
| ≤820px | הכול לעמודה אחת; topbar נערם; קנבס בגובה מוקטן; `.resource-grid` לעמודה אחת; תגיות הסעיפים יורדות לשורה משלהן; `chapter-pager` נערם; קורא הרשימות מצטמצם לתוכן העניינים בלבד (בלי iframe; הקישורים ללשונית חדשה) |
| ≤680px / ≤640px | רשתות בסיס ויציבות → עמודה אחת |
| ≥760px | `.lambda-option-list` → שלוש עמודות (שאילתת `min-width` היחידה בקובץ) |

גלילה אופקית מכוונת לנוסחאות רחבות (`.math-display-centered`, שורות נוסחה).

### זהות ויזואלית של המודולים

אין פלטת צבעים נפרדת לכל מודול — כולם חולקים את אותם אסימונים. ההבחנה היא מבנית: מישור הפאזה מזוהה עם הקנבס והמקרא; מודול אוילר עם צינור כרטיסי השלבים (`.practice-step-card`) ורצועות המידע (`.euler-transform-strip`); מודול ההומוגניות עם קלט נוסחה חופשית (`.formula-answer-card`) ותצוגה מקדימה חיה; מודול סדרות הפונקציות עדיין במעטפת ובמפת דרך בלבד.

---

## 9. תשתית ופריסה

- **פיתוח:** `npm run dev` (vinext), `npm run build` (`next build --webpack`).
- **בדיקות:** `npm test` (vitest) — `app/constant-coefficients-euler/{math,practice}/*.test.ts`, `app/linear-homogeneous/math/*.test.ts`, `app/ode/course.test.ts`, `app/_site/notesNavigation.test.ts`.
- **סנכרון הרשימות:** `npx tsx scripts/sync-course-notes.ts [תיקיית הרשימות]` (ברירת מחדל: שתי רמות מעל המאגר), להרצה אחרי כל קומפילציה של הרשימות. הסקריפט מפרסר את `main.toc`, מנרמל כותרות (גרשיים, מקפים; נכשל אם נשאר LaTeX), בודק שהסעיפים שייכים לפרקים ושהעמודים לא יורדים, קורא את היסט העמודים מ-`/PageLabels`, כותב את `app/ode/notesToc.ts` ומעתיק את `main.pdf`, `ExtendedSyllabus_winter2026.pdf` ו-`FormulaSheet.pdf` ל-`public/courses/ode/`.
- **Worker:** `worker/index.ts` — handler ל-Cloudflare Workers + אופטימיזציית תמונות.
- **DB:** `db/schema.ts` ריק בכוונה; `db/index.ts` מצפה ל-binding בשם `DB` (D1). לא בשימוש כרגע.
- **סקריפטי אימות** (`scripts/`, לא מחוברים ל-package.json — מריצים ידנית; שייכים למודול אוילר):

| סקריפט | בודק |
|---|---|
| `verify-algebraic-formatting-cases.ts` | פורמט LaTeX של פולינומים |
| `verify-euler-cases.ts` | המרות אוילר ויצירת שאלות |
| `verify-initial-conditions-cases.ts` | נגזרות בסיס ומטריצת תנאי התחלה |
| `verify-stability-cases.ts` | ניתוח יציבות והערכת תשובות |
| `verify-root-canonicalization-cases.ts` | קנוניזציה ומיזוג שורשים |
| `verify-reconstruction-cases.ts` | ניתוח שחזור ושורשים מאולצים |
| `verify-order2-reconstruction-templates.ts` | כל 34 תבניות סדר 2 |
| `verify-order3-reconstruction-templates.ts` | כל 36 תבניות סדר 3 |
| `verify-math-size-tokens.mjs` | עקביות אסימוני גודל CSS |

---

## 10. הערות ארכיטקטוניות

- **שני סגנונות מבניים:** מישור הפאזה הוא קובץ מונוליטי אחד; מודולי אוילר, ההומוגניות וסדרות הפונקציות בנויים בשכבות (components / math / practice לפי הצורך). בשלושתם המעטפת היא `<Name>Module.tsx` (`"use client"`), וה-`page.tsx` שטוען אותה יושב תחת `app/ode/N/`. כל פיצול עתידי של מישור הפאזה כדאי שילך בכיוון הזה.
- **מבנה רב־קורסי:** `app/_site/` לא מכיר קורס מסוים. קורס הוא תיקייה עם `course.ts`, תוכן עניינים שנוצר מהרשימות, ונתיבי פרקים ומודולים; הוא נרשם ב-`app/courses.ts`. הנתיבים שטוחים ומפורשים (תיקייה לכל פרק ולכל מודול), ו-`course.test.ts` מוודא שהרישום והתיקיות לא נפרדים.
- **קורא הרשימות משודרג, לא מחליף:** כל קישור לרשימות הוא קודם כול קישור רגיל ללשונית חדשה, והקורא רק מיירט אותו. לכן אין מצב שבו הרשימות לא נגישות. ה-breakpoint של 820px קיים פעמיים, ב-CSS וב-`useNotesReaderAvailable`; מי שמשנה אחד צריך לשנות את השני.
- **כפילות מכוונת:** ל-`MathText`/`DisplayMath`/`mathTypography` יש ארבע גרסאות (פאזה מקומית; עותק זהה באוילר, בהומוגניות ובסדרות הפונקציות). אין עדיין חבילת UI מתמטי משותפת.
- **שתי פרדיגמות מתמטיות:** מודולי הפאזה ואוילר עובדים עם מבנים סגורים (מטריצות 2×2, שורשים, פולינומים). מודול ההומוגניות מפרסר נוסחאות חופשיות ומפעיל nerdamer — עם מדיניות זהירות סביב `e`/`π` ופישוט לתצוגה מול אימות. מודול סדרות הפונקציות עדיין בלי שכבת מתמטיקה אלגוריתמית.
- **שיתוף נקודתי:** הגנרטור של ההשלמה למערכת יסודית מייבא `SeededRandom` ממודול אוילר. זה הקשר היחיד בין המודולים בקוד. מודול סדרות הפונקציות מתוכנן למחזר את אותו `SeededRandom` כשתיבנה שכבת `practice/`. בנוסף, ארבעת המודולים מייבאים את `app/ode/OdeModuleBreadcrumbs` — תלות בשכבת הקורס, לא במודול אחר. מודול שישותף בעתיד בין קורסים יצטרך לקבל את ה-breadcrumbs מבחוץ.
- **ללא persistence:** סטטיסטיקות תרגול חיות בזיכרון בלבד ומתאפסות ברענון — בחירה מודעת בשלב זה.
