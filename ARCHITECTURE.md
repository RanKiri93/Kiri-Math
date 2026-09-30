# ארכיטקטורת האתר — Kiri Math (קורסים 104136, 104214)

מסמך זה מתאר את הארכיטקטורה של האתר: מעטפת הקורסים, מבנה התוכן, המודולים, שכבות הלוגיקה המתמטית, ומערכת העיצוב.

**עדכון אחרון:** 30 בספטמבר 2026 (מעקב השלמת פעילויות)

---

## 1. תמונה כללית

האתר (שם עבודה: **Kiri Math**) הוא סביבת לימוד בעברית מלאה (RTL) לשני קורסים: משוואות דיפרנציאליות רגילות (104136) וטורי פוריה והתמרות אינטגרליות (104214). הקורסים מאורגנים לפי פרקי הרשימות; מודולים אינטראקטיביים קיימים כרגע רק בקורס מד״ר. קורס פוריה מציג חומרי קורס ופרקי רשימות דרך אותה מעטפת משותפת. הגישה לעמודי הקורס מותנית בחשבון ובהרשאה שניתנת ידנית; אין הרשמה עצמית או רכישה מקוונת.

### מפת האתר

```
/  (קטלוג הקורסים — שני הקורסים, עם מצב נעול/זמין; משתמש מחובר רואה הרשאותיו)
├── /ode                                    משוואות דיפרנציאליות רגילות — פאנל «חומר הקורס»
    ├── /ode/1                              פרק 1 · סדרות וטורים של פונקציות
    │   ├── /ode/1/function-sequences              סדרות פונקציות                  [בבנייה]
    │   │     └── תפריט פעילויות: מעבדת התכנסות פעילה; 3 פעילויות מתוכננות
    │   ├── /ode/1/function-series                טורי פונקציות                    [בבנייה] · placeholder
    │   ├── /ode/1/power-series                   טורי חזקות                       [בבנייה] · placeholder
    │   └── /ode/1/taylor-series                  טורי טיילור                      [בבנייה] · placeholder
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
└── /fourier                                 טורי פוריה והתמרות אינטגרליות — «חומר הקורס»
    ├── /fourier/1 … /fourier/4             פרקים 1–4, ללא מודולים אינטראקטיביים
    └── חומרי קורס: רשימות, סילבוס מורחב ודף נוסחאות
```

הכתובות הישנות (`/phase-plane`, `/constant-coefficients-euler`, `/linear-homogeneous`, `/function-sequences-series`) מפנות (307) לנתיב החדש; כתובת מודול הסדרות הישנה מפנה ל-`/ode/1/function-sequences`.

### מצב המודולים

| מודול | כרטיס בעמוד הפרק | מצב |
|---|---|---|
| מישור פאזה | פעיל | שלם: מבוא, מעבדה, הרכבת מטריצה, תרגול |
| מקדמים קבועים ואוילר | פעיל | שלם: מבוא, הרכבה, שלושה מצבי תרגול |
| ליניאריות הומוגניות | **בבנייה** | מבוא ומעבדת הרכבה (סדר 2) פעילים; תרגול השלמה למערכת יסודית פעיל; לשונית וורונסקיאן placeholder; הורדת סדר כללית ויציבות עדיין תיאורטיות בלבד |
| סדרות פונקציות | **בבנייה** | תפריט פעילויות ומסלול מעבדת התכנסות מודרך פעילים; שלוש פעילויות נוספות מתוכננות |
| טורי פונקציות | **בבנייה** | placeholder |
| טורי חזקות | **בבנייה** | placeholder |
| טורי טיילור | **בבנייה** | placeholder |
| קורס טורי פוריה והתמרות אינטגרליות | ללא מודולים | חומרי הקורס וארבעת פרקי הרשימות פעילים; אין מודולים אינטראקטיביים |

### טכנולוגיות

| רכיב | פירוט |
|---|---|
| Framework | **vinext** 0.0.50 (Vite 8 + Next.js 16 App Router) |
| UI | React 19, TypeScript |
| מתמטיקה | KaTeX + react-katex |
| אלגברה סימבולית | **nerdamer** 1.1.13 — בשימוש במודול הליניארי ההומוגני בלבד |
| בדיקות | **vitest** — `npm test`; כולל אימות, הרשאות ונתיבי PDF לצד בדיקות המודולים, הקורסים, הניווט, האיורים והסנכרון (ראו §9) |
| פונט | Assistant (משקלים 400/600/700/800) דרך `@fontsource` |
| פריסה | Cloudflare Workers (`worker/index.ts`), wrangler |
| DB | SQLite מקומי דרך `node:sqlite` ב-`.data/auth.sqlite`; ב-Workers ‏API של D1 דרך `app/_auth/database.ts`; סכימת Drizzle מקבילה ב-`db/schema.ts`; מיגרציות SQL ב-`drizzle/` (`0000_auth.sql`, `0001_activity_progress.sql`) |
| קבצי קורס | מקורות PDF פרטיים ב-`private/courses/`, מוגשים ממנו ב-Node; ב-Workers ובאמולטור הפיתוח מוגשים מעותקים ב-private R2 |

### ניהול State

React מקומי בלבד: `useState` / `useMemo` / `useRef` / `useEffect`. **אין** Context, Redux או localStorage לנתוני תרגול. חריגים ממוקדים: העדפת גודל הטקסט היא מפתח localStorage יחיד (`kiri-math:text-size`), העדפת תצוגה בלבד; אימות משתמשים משתמש בעוגיית session ובמסד נתונים לנתוני חשבון, הרשאות וגישה; חריג שלישי: סימוני השלמה של פעילויות מוגדרות־סיום נשמרים בשרת, באותו מסד (ראו «מעקב השלמת פעילויות» ב-§2); נשמרת ההשלמה בלבד, ללא תשובות או מצב באמצע פעילות. סטטיסטיקות תרגול עדיין בזיכרון בלבד ומתאפסות ברענון. קורסים, פרקים ומודולים הם נתיבים; לשוניות בתוך מודול מנוהלות ב-state פנימי. עמודי הקורס והפרקים הם server components ומאמתים הרשאה בשרת; מעבר הכניסה בדשבורד בלבד. שאלות תרגול נוצרות עם RNG זרוע.

---

## 2. ניתוב ועמודים

| Route | קובץ | תפקיד |
|---|---|---|
| `/` | `app/page.tsx` | קטלוג הקורסים: רשת `CourseCard`; למשתמש מחובר מוצגות הרשאותיו. `AccountBar` נמצא בדשבורד בלבד; הכרטיסים עוגנים רגילים. רק עוגן זמין מסומן `data-course-entry` ומקבל מעבר מ-`CourseEntry` המתמשך ב-layout; כרטיסי אורח/נעול אינם עוברים דרכו |
| `/login` | `app/login/page.tsx` | התחברות בשם משתמש וסיסמה |
| `/access-required` | `app/access-required/page.tsx` | הסבר על צורך בהרשאה לקורס |
| `/api/auth/login`, `/api/auth/logout` | `app/api/auth/{login,logout}/route.ts` | POST בלבד; אימות מקור, הגבלת ניסיונות התחברות, יצירה וביטול של session |
| `/ode` | `app/ode/page.tsx` | `CourseShell` עם פאנל «חומר הקורס» (`CourseMaterialsPanel`) |
| `/ode/1` … `/ode/6` | `app/ode/{1..6}/page.tsx` | עמוד פרק דרך `OdeChapterPage` (async; מקבל את `user` מכל `page.tsx`): `CourseShell` + `ChapterPanel`, עם ספירת השלמות לכרטיסי מודולים שיש להם פעילויות |
| `/ode/5/phase-plane` | `app/ode/5/phase-plane/page.tsx` | טוען את `PhasePlaneModule` |
| `/ode/4/constant-coefficients-euler` | `app/ode/4/constant-coefficients-euler/page.tsx` | טוען את `ConstantCoefficientsEulerModule` (3 לשוניות) |
| `/ode/4/linear-homogeneous` | `app/ode/4/linear-homogeneous/page.tsx` | טוען את `LinearHomogeneousModule` (4 לשוניות) |
| `/ode/1/function-sequences` | `app/ode/1/function-sequences/page.tsx` | טוען את השלמות המשתמש (`getActivityCompletions`) ואת `SubjectModule` מהתיקייה המשותפת (prop `completions`); תפריט מציג מעבדת התכנסות מודרכת, את «מבחן הסופרמום: חישוב וטיעון» ועוד 3 פעילויות מתוכננות |
| `/ode/1/function-series`, `/ode/1/power-series`, `/ode/1/taylor-series` | `app/ode/1/{function-series,power-series,taylor-series}/page.tsx` | טוענים את `SubjectModule` עם הנושא המתאים; תוכן placeholder |
| `/ode/1/function-sequences-series` | `app/ode/1/function-sequences-series/page.tsx` | הפניה שרתית ל-`/ode/1/function-sequences` (307) |
| `/fourier` | `app/fourier/page.tsx` | `CourseShell` ו-`CourseMaterialsPanel` עם איור קורס ייעודי |
| `/fourier/1` … `/fourier/4` | `app/fourier/{1..4}/page.tsx` | עמוד פרק דרך `FourierChapterPage` ו-`ChapterPanel`; איור ייעודי לכל פרק |
| `/phase-plane`, `/constant-coefficients-euler`, `/linear-homogeneous`, `/function-sequences-series` | `page.tsx` בתיקייה הישנה | `redirect()` שרתי (307) לנתיב החדש תחת `/ode/N/` |
| `/api/progress/complete` | `app/api/progress/complete/route.ts` | POST בלבד: אימות מקור, גוף JSON עד 512 בתים, פעילות שברישום הקורס, session והרשאת הקורס; upsert אידמפוטנטי. תשובות: 204 / 400 / 401 / 403 / 503 |
| `/courses/[course]/[file]` | `app/courses/[course]/[file]/route.ts` | GET/HEAD לקובצי PDF פרטיים; בדיקת session והרשאת קורס, כולל בקשות Range |
| layout | `app/layout.tsx` | `lang="he" dir="rtl"`, טעינת Assistant + KaTeX CSS + `globals.css`; עוטף את תוכן האתר ב-`CourseEntry` client מתמשך ומרכיב אחריו `<TextSizeControl />` בכל עמוד; ב-`<head>` סקריפט inline (`textSizeBootScript`) ו-`suppressHydrationWarning` על `<html>`; כותרת `%s · Kiri Math` |

עמודי הקורס, הפרקים והמודולים ממתינים ל-`requireCourse` בשרת לפני הצגת תוכן. נתיבים דינמיים נתמכים כעת, בין היתר עבור הורדת הקבצים הפרטיים.

ניווט: מהדשבורד לכרטיס הקורס; בעמודי הקורס מסילת פרקים (`ChapterRail`) עם «חומר הקורס» ופרקים 1–6 במד״ר או 1–4 בפוריה; בכל מודול topbar עם breadcrumbs (`Kiri Math › שם הקורס › פרק N · שם`) וכפתורי לשוניות (state, לא URL).

### מעטפת האתר (`app/_site/`)

שכבה שאינה תלויה בקורס מסוים: כל רכיב מקבל `CourseDefinition`. רוב הרכיבים server components; `NotesReader.tsx` ו-`NotesDialog.tsx` הם client components, ו-`NotesFrame`/`NotesToc` נטענים דרכם. `CourseEntry.tsx` הוא client component מתמשך שמורכב ב-layout השורש; `ArtSvg` ו-`FadedEquations` בלי hooks, ואיור הכרטיס מועתק לפורטל רק לאחר לחיצה.

| קובץ | תפקיד |
|---|---|
| `courseModel.ts` | טיפוסים (`CourseDefinition`, `CourseModule` עם `activities?` רשות, `CourseActivity`, `NotesChapter`, `CourseResource`, `CourseSummary`, `Crumb`) ועזרים טהורים: `notesPageHref` (עמוד מודפס + היסט → `#page=`), `modulesForChapter`, `modulesForSection`, `sectionRangeLabel`, `courseCrumbs`, `moduleCrumbs`, `findActivity` (חיפוש פעילות לפי קורס, מודול ומזהה), `summarizeCourse`; `siteName`. בלי React |
| `notesNavigation.ts` | ניווט טהור בתוך הרשימות: `NotesTarget` (שער / פרק / סעיף), `locateNotesTarget` (עמוד, כותרת, הסעיף הקודם והבא על פני כל הפרקים; פרק שהסעיף הראשון שלו מתחיל בעמוד הפרק מתנרמל לסעיף), `notesTargetFromData` (מתוך `data-notes-*`), `notesViewerSrc` (כתובת ה-iframe עם פרמטרי המציג), `notesLocationHref`. בלי React |
| `useNotesReader.ts` | `useNotesReaderAvailable()` — `useSyncExternalStore` על `(min-width: 821px)`, המשלים של `max-width: 820px` ב-CSS; בשרת `false`. `notesTargetFromClick` — מיירט רק לחיצה שמאלית רגילה (`isPlainLeftClick`) על קישור עם `data-notes-*` |
| `NotesFrame.tsx` | מסגרת הצפייה: שורת מיקום (פרק, עמוד, כותרת), הסעיף הקודם/הבא, מתג «תוכן העניינים» (אופציונלי), «פתיחה בלשונית חדשה», «הורדה», «סגירה» (אופציונלי), ו-iframe של מציג ה-PDF המובנה. `key={loadKey}` טוען את ה-iframe מחדש בכל מעבר, כי שינוי `#page=` לבדו לא מזיז את כל המציגים |
| `NotesToc.tsx` | תוכן העניינים המלא: כרטיס לכל פרק (קישור לעמוד הפרק + קישור לעמוד שלו ברשימות) ו-`NotesSectionList`; `aria-current="location"` על היעד הפתוח |
| `NotesReader.tsx` | הקורא שבפאנל «חומר הקורס»: תוכן העניינים בעמודה גוללת לצד `NotesFrame`, בגובה המסך. נפתח בעמוד השער; בחירה בתוכן העניינים מחליפה את העמוד במקום לפתוח לשונית. מתחת ל-821px אין iframe, ותוכן העניינים נשאר רשימת קישורים ללשונית חדשה |
| `NotesDialog.tsx` | `NotesDialogHost`: עוטף פאנל פרק ומיירט את קישורי הרשימות שבו; פותח `NotesFrame` ב-`<dialog>` מקורי (`showModal()`: שכבה עליונה, Esc, החזרת focus לקישור). הסגירה קוראת ל-`close()` וה-state מתאפס ב-`onClose`, אחרת ה-focus לא חוזר |
| `CourseMaterialsPanel.tsx` | פאנל החומר המלא: כרטיסי PDF (רשימות, סילבוס מורחב, דף נוסחאות) ו-`NotesReader`. `art` אופציונלי: מוטיב קומפקטי בקצה הכותרת, מוסתר מ-820px |
| `ChapterPanel.tsx` | פאנל פרק בתוך `NotesDialogHost`: כותרת עם מספר וקישור לפרק ברשימות, כרטיסי המודולים (או מצב ריק; prop רשות `completed` — ספירת השלמות לפי מודול — מציג במודול שיש לו פעילויות «הושלמו k מתוך m פעילויות» או «כל הפעילויות הושלמו», `.course-module-progress(.complete)`), סעיפי הפרק, מעבר לפרק הקודם/הבא. `art` אופציונלי: מוטיב מוחלט בקצה הכותרת, דוהה אל הטקסט, מוסתר מ-820px |
| `NotesSectionList.tsx` | סעיפים: קישור לעמוד הסעיף ברשימות (`href` ללשונית חדשה + `data-notes-section` לקורא), תגיות המודולים שמכסים אותו, מספר עמוד |
| `NotesSectionLinks.tsx` | רשימת סעיפים לקריאה מתוך מודול: `href` ללשונית חדשה, `data-notes-section`, מספר הסעיף כאי LTR וכותרת. בלי hooks. זורק אם סעיף חסר ברשימות |
| `notesNavigation.test.ts` | 12 בדיקות: שער, מעבר בין סעיפים וחציית פרקים, קצוות, פרק עם מבוא / בלי מבוא / בלי סעיפים, יעד לא קיים, מעבר על כל 35 הסעיפים האמיתיים, פרסור `data-*`, התאמת עמוד ה-iframe לקישור ללשונית חדשה |
| `art/` | מנוע איורים טהור, בלי React ובלי RNG: `types.ts`, `geometry.ts` (מיפוי, מסלולים, שברונים, חיתוך לדיסקה), `integrate.ts` (RK4), `art.test.ts` |
| `ArtSvg.tsx` | SVG מוטמע של `ArtPiece`. `pathLength={1}` משמש קווים מקווקווים; API האופציונלי `animated` מוסיף אינדקסי `--i` לקווים, אך אינו בשימוש ב-`CourseCard` (API legacy). בלי `<marker>` ובלי `vector-effect` |
| `FadedEquations.tsx` | נוסחאות KaTeX דהויות (`aria-hidden`, `pointer-events: none`). מיקום ב-`left`/`top` פיזיים, לא בלוגיים, כי העמוד RTL |
| `CourseEntry.tsx` | מעטפת client מתמשכת: מאזינה רק לעוגנים זמינים עם `data-course-entry`; `CourseCard` עצמו נשאר עוגן רגיל, וכרטיסי אורח/נעול אינם מסומנים. `prefetch` ב-hover/focus; בלחיצה רגילה משכפלת לפורטל ב-`document.body` את אזור האיור הדקורטיבי בלבד, כך שהכרטיס המקורי שומר על הפריסה. `courseEntryMotion.ts` מניע את הכריכה השלמה (בלי ציור מסלולים לפי הסדר): נייר 120ms, תנועה 420ms בשולחן עבודה / 300ms במסך קומפקטי, זיהוי כותרת עדין והמסה לשקיפות. `router.push` מתחיל אחרי 120ms; רק commit של נתיב היעד מבקש חשיפה, לאחר השלמת הכניסה ודעיכה של 200ms. Esc/Tab/לחיצה חוזרת/שינוי גודל או העדפת תנועה מדלגים ב-100ms; נתיב איטי מוגבל ל-1800ms ואז דעיכה של 160ms. ללא WAAPI או עם reduced motion נשאר ניווט עוגן רגיל, ללא אנימציה או השהיה. אין נעילת גלילה |
| `courseEntryMotion.ts` | תזמון מעבר הכניסה ב-WAAPI: ניווט יחיד, reveal/skip/cancel ושומר זמן מרבי |
| `courseEntryMotion.test.ts`, `courseEntryRendering.test.ts` | בדיקות lifecycle, תזמון וגאומטריית המעבר, דילוג, ביטול, כשל ו-frame סופי; בדיקות כרטיס הגישה והקישורים הרגילים |
| `clicks.ts` | `isPlainLeftClick`: לחיצה ראשית בלי מקש ובלי `defaultPrevented`. משותף למעבר הכניסה ולקורא הרשימות |
| `clicks.test.ts` | לחיצה רגילה מול כפתור אחר, מקש, ו-`defaultPrevented` |
| `CourseCard.tsx` | כרטיס קורס בדשבורד כעוגן רגיל; רק קורס זמין מקבל `data-course-entry`. פס איור (`ArtSvg` + תת־קבוצה של הנוסחאות הדהויות), ואז קוד, שם, תיאור, מספר פרקים ומודולים. `ArtSvg` עדיין תומך ב-API אנימציה, אך הכרטיס אינו משתמש בו |
| `textSize.ts` | טהור, בלי React: `TEXT_SIZE_LEVELS` (אחוזי font-size לשורש, 100…131.25), `DEFAULT_TEXT_SIZE_INDEX = 1` (106.25%), `TEXT_SIZE_STORAGE_KEY` (`"kiri-math:text-size"`), `clampTextSizeIndex`, `textSizeValue`, ו-`textSizeBootScript` — סקריפט inline ב-`<head>` שמחיל רמה שמורה שאינה ברירת המחדל על `document.documentElement.style.fontSize` לפני הציור הראשון (עטוף ב-try/catch) |
| `textSize.test.ts` | בדיקות ל-`textSize.ts` |
| `TextSizeControl.tsx` | client: קבוצה צפה קבועה של שני כפתורים (א− / א+, `aria-label` «הקטנת הטקסט» / «הגדלת הטקסט») בפינת ה-inline-end התחתונה (שמאל תחתון ב-RTL), `z-index: 40` (מתחת ל-`.modal-backdrop`, 50), מוסתרת בהדפסה. `useSyncExternalStore` עם ה-font-size ה-inline של אלמנט השורש כמקור אמת; כותבת/מסירה את מפתח ה-localStorage ומסתנכרנת בין לשוניות דרך אירוע `storage` |
| `Breadcrumbs.tsx` | `nav.site-breadcrumbs`; כל תווית עטופה ב-`<bdi>` |
| `BrandWordmark.tsx` | סמליל הטקסט «Kiri Math» (LTR) |

### אימות וגישה (`app/_auth/`)

`app/_auth/` מרכז אימות שרתי והרשאות: גיבוב סיסמאות scrypt ‏(N=32768, r=8, p=3), throttling מתמשך לפי שם משתמש ולקוח, sessions אטומים שמזהיהם נשמרים כ-hash ותוקפם 7 ימים. `requireCourse` משמש בכל עמודי הקורס; `app/courses/[course]/[file]/route.ts` מגיש GET/HEAD עם בדיקת הרשאה ותמיכה ב-PDF Range. `AccountBar` קיים בדשבורד בלבד. נתוני RanKiri המקומיים מוגדרים מחוץ למאגר; אין seed של חשבון או סיסמה בקוד. `http.ts` מייצא גם `readJsonBody(request, maxBytes)` — קריאת גוף JSON קטן ומוגבל גודל, משותפת ל-`readLoginBody` ולנתיב ההתקדמות.

### מעקב השלמת פעילויות (`app/_progress/`)

חריג שלישי וצר לכלל «אין persistence לתרגול» (`AGENTS.md`): נשמר רק סימון השלמה לפעילות שיש לה נקודת סיום מוגדרת — בלי תשובות, ניסיונות או מצב באמצע פעילות. חשיפת תשובה נחשבת השלמה. פעילויות נשארות ניתנות לחזרה והמצב שלהן מתחיל מחדש. תוכנית והחלטות: `docs/plans/activity-progress.md`.

**כלל:** כל פעילות חדשה מתוכננת עם נקודת השלמה מוגדרת ונרשמת ב-`activities` של מודול ב-`course.ts`. מודולי תרגול בלי סיום (פאזה, מקדמים קבועים, הומוגניות) אינם נמדדים.

| רכיב | תפקיד |
|---|---|
| `drizzle/0001_activity_progress.sql` | טבלת `activity_completions`: משתמש, קורס, מודול, פעילות, זמן השלמה ראשון ואחרון ומספר השלמות; מפתח ראשי על הרביעייה; נמחקת עם המשתמש (`ON DELETE CASCADE`) |
| `CourseModule.activities` (`_site/courseModel.ts`) | רישום הפעילויות הנמדדות (`id`, `title`); ב-`app/ode/course.ts` מודול סדרות הפונקציות רושם `convergence-lab` ו-`supremum-test` |
| `model.ts` | טיפוסים (`ActivityCompletion`, `ActivityRef`), `completedCountByModule`, ו-`completionDateLabel` — תאריך עברי באזור הזמן הקבוע `Asia/Jerusalem`, כדי ששרת ודפדפן יציגו אותו דבר ולא תהיה אי־התאמת hydration |
| `registry.ts` | `courseDefinitions`: slug של קורס → `CourseDefinition` |
| `validation.ts` | `parseActivityRef` — מקבל רק פעילות שברישום (דרך `findActivity`) |
| `store.ts` | `ProgressStore`: `markCompleted` (upsert אידמפוטנטי: שומר זמן ראשון, מעדכן אחרון ומגדיל מונה) ו-`listCompleted` |
| `server.ts` | `getProgressStore`; `getActivityCompletions(user, course)` — נכשל רך: כל תקלת אחסון מחזירה `[]`, וסימונים של פעילויות שהוסרו מהרישום מסוננים |
| `client.ts` | `reportActivityCompletion` — `fetch` POST חד־כיווני (fire-and-forget) ל-`/api/progress/complete` |
| `progress.test.ts`, `route.test.ts` | החנות (אידמפוטנטיות, הפרדת משתמשים וקורסים, מחיקה עם המשתמש), הרישום והולידציה, ספירה ותאריך, רינדור כרטיסי מודול ותפריט הפעילויות, ונתיב ה-HTTP (הצלחה, מקור זר, גוף לא תקין, session והרשאה, כשל אחסון) |

**זרימה:** `SubjectModule` מדווח דרך callbacks `onFinish` — ב-`ConvergenceLab` כשנפתח מסך הסיום («המסלול הושלם»), וב-`SupremumActivity` בלחיצה על «לסיום» בשלב האחרון — ומציג בתפריט «✓ הושלמה ב־‏<תאריך>» (`.activity-completion-mark`) על כרטיסי פעילות שהושלמו. מדיניות כשל: התקדמות לעולם לא חוסמת למידה; כתיבה שנכשלה משאירה את הפעילות רצה ומציגה את הסימון לביקור הנוכחי בלבד, וקריאה שנכשלה אינה מציגה סימונים.

**עדיין חסר:** עמוד «ההתקדמות שלי» לכל קורס, איפוס התקדמות לפעילות בודדת, תצוגה/איפוס למפעיל (`npm run auth -- progress`), ונקודות השלמה למודולי תרגול — ראו ה-backlog ב-`docs/plans/activity-progress.md`.

המסד המקומי הוא SQLite ב-`.data/auth.sqlite`; ב-Workers נעשה שימוש ב-D1 וב-private R2. אלו מסדי נתונים נפרדים. Vite חוסם הגשת קבצים מתוך `private/`, `.data/` ו-`.wrangler/` גם במצב dev. פרטי תפעול והגדרה: `docs/authentication.md`.

### נתוני הקורס (`app/ode/`)

| קובץ | תפקיד |
|---|---|
| `course.ts` | `odeCourse`: קוד, שם, תיאור, הרשימות, הפרקים, 7 מודולים (פרק, סעיפים, סטטוס, `href`) ו-3 משאבים |
| `notesToc.ts` | **נוצר אוטומטית** מ-`main.toc` ע״י `scripts/sync-course-notes.ts`: 6 פרקים, 35 סעיפים, `notesPageOffset = 4`. לא עורכים ידנית |
| `OdeChapterPage.tsx` | עמוד פרק משותף ל-`/ode/1..6` (async, מקבל `user`, טוען השלמות ל-`ChapterPanel`), וגם `odeChapterMetadata` / `odeModuleMetadata` |
| `OdeModuleBreadcrumbs.tsx` | ה-breadcrumbs שבתוך ה-topbar של ארבעת המודולים |
| `OdeNotesSections.tsx` | «לקריאה ברשימות» במבוא של מודול: מוצא את הסעיפים ב-`findModule` ועוטף את `NotesSectionLinks` ב-`NotesDialogHost` משלו, בלי לגעת בלשוניות |
| `art.ts` | איורי הקורס, בלי React: כריכה (אוכף, שדה כיוונים עם פתרון, קפיץ; משבצת ריקה לציור), מוטיב לכל פרק 1–6, וקטלוג הנוסחאות הדהויות. `odeCoverCardEquations` הוא תת־הקבוצה שעל הכרטיס |
| `art.test.ts` | דטרמיניזם, מסגרת, תקציב מסלולים, אורתוגונליות בפרק 3, ורינדור KaTeX של כל נוסחת כריכה |
| `course.test.ts` | 17 בדיקות: מספור פרקים וסעיפים, עמודים לא יורדים, קובץ route לכל פרק ומודול, סעיפי מודול שייכים לפרק שלו ומתרגמים לעמוד מודפס, breadcrumbs, היסט העמודים, קובצי ה-PDF קיימים |
| `../courses.ts` | רשימת הקורסים בדשבורד: `summarizeCourse` ועליו `art` (הכריכה ותת־קבוצת הנוסחאות). האיור לא יושב על `CourseDefinition` |

### נתוני קורס פוריה (`app/fourier/`)

| קובץ | תפקיד |
|---|---|
| `course.ts` | `fourierCourse`: קוד 104214, שם הקורס, רשימות, פרקים, ללא מודולים ושלושה משאבים |
| `notesToc.ts` | נוצר אוטומטית: 4 פרקים, 18 סעיפים, `notesPageOffset = 2`; אין לערוך ידנית |
| `page.tsx`, `{1..4}/page.tsx`, `FourierChapterPage.tsx` | עמוד חומר הקורס ועמודי הפרקים דרך המעטפת והרכיבים המשותפים ב-`app/_site/` |
| `art.ts` | איורים דטרמיניסטיים לקורס ולפרקים: הרמוניות, גאוסיאנים ודעיכה; ללא נוסחאות דהויות בכרטיס |
| `art.test.ts`, `course.test.ts` | בדיקות איורים ונתוני הקורס/נתיבים |

לקורס אין מודולים או שכבות `math/` ו-`practice/`; הוא משתמש באותה מסילת פרקים, קורא רשימות, פאנל חומר ומשאבי PDF של מעטפת האתר.

שיוך המודולים לסעיפי הרשימות בקורס מד״ר:

| מודול | פרק | סעיפים | סטטוס |
|---|---|---|---|
| סדרות פונקציות | 1 | 1.1 | בבנייה |
| טורי פונקציות | 1 | 1.2 | בבנייה |
| טורי חזקות | 1 | 1.3 | בבנייה |
| טורי טיילור | 1 | 1.3 | בבנייה |
| משוואות ליניאריות הומוגניות | 4 | 4.2–4.3 | בבנייה |
| מקדמים קבועים ומשוואות אוילר | 4 | 4.4–4.6 | פעיל |
| מישור הפאזה | 5 | 5.2–5.3 | פעיל |

**עמודי הרשימות:** `main.toc` שומר את מספרי העמודים המודפסים, ו-`#page=` מצפה לאינדקס הפיזי. ההפרש (4 עמודי פתיחה במד״ר, 2 בפוריה) נקרא מטבלת `/PageLabels` שב-PDF עצמו בזמן הסנכרון, ו-`notesPageHref` מוסיף אותו. קובצי המקור מסונכרנים ל-`private/courses/` ואינם מוגשים כקבצים סטטיים.

**קורא הרשימות:** במסך רחב (מ-821px) הרשימות נפתחות בתוך האתר: בפאנל «חומר הקורס» בקורא הקבוע, ובעמודי הפרקים ובמבוא של כל מודול («לקריאה ברשימות») בחלון `<dialog>`. זה מציג ה-PDF של הדפדפן בתוך iframe, בלי ספרייה. `notesViewerSrc` מוסיף לכתובת `view=FitH&navpanes=0&toolbar=0` (Chrome/Edge) ו-`zoom=page-width&pagemode=none` (PDF.js של Firefox); כל מציג מתעלם מהפרמטרים שאינו מכיר. בכל הקישורים ה-`href` נשאר הקישור ללשונית חדשה, כך שבלי JavaScript, במסך צר או בלחיצה עם מקש, ההתנהגות היא של שלב 1.

### מה עדיין חסר במעטפת

- עיצוב המציג המובנה מוגבל: ב-Firefox סרגל הכלים של PDF.js נשאר, ואין שליטה בצבעי המציג. אם זה לא יספיק, השלב הבא הוא מציג מבוסס pdf.js (תלות חדשה).
- משבצת הציור על כריכת הקורס (`odeCoverFigureSlot`) ריקה עד שיגיע ה-SVG. הסמליל הקיים הוא הטקסט «Kiri Math», בלי קובץ לוגו.
- התאמת המודולים לגבולות הסעיפים ברשימות, ומודולים לפרקים 2, 3 ו-6.
- אין הרשמה עצמית, רכישה/תשלום מקוונים, איפוס סיסמה בדוא״ל או ממשק ניהול; יצירת חשבון והענקת גישה מתבצעות ידנית ב-CLI.

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

**תיקייה משותפת:** `app/function-sequences-series/` — רכיבי הנושא למודולי פרק 1; כל אחד מארבעת הנושאים רשום בנפרד בעמוד הפרק. **נתיבים:** `/ode/1/function-sequences`, `/ode/1/function-series`, `/ode/1/power-series`, `/ode/1/taylor-series`. כולם מסומנים «בבנייה».

המודול עוסק בחלק המתמטי הפותח של הקורס: סדרות פונקציות, טורי פונקציות, טורי חזקות וטורי טיילור.

`SubjectModule.tsx` הוא shell משותף, נטען מדפי הנושא השונים בפרק 1. הוא מציג topbar ו-breadcrumbs, ובנושא סדרות פונקציות תפריט פעילויות עם מצב מקומי `openActivity: "lab" | "supremum" | null` לפתיחת פעילות וחזרה לתפריט. לאחר mount ראשון כל פעילות שהופעלה נשארת ב-host מוסתר משלה כשהתפריט או פעילות אחרת מוצגים, כדי לשמר את מצבה בזיכרון; מעבר להגדרות ובחזרה, וכן חזרה לתפריט, אינם מאפסים עבודה. בתפריט כרטיס «מבחן הסופרמום: חישוב וטיעון» אחרי כרטיס המעבדה (פעילות זמינה, לא נעולה); תיאורו ממליץ לעבור קודם את מעבדת ההתכנסות (ראו `SubjectModule.test.ts`). prop רשות `completions` מציג על כרטיס פעילות שהושלמה «✓ הושלמה ב־‏<תאריך>», ו-callbacks `onFinish` ב-`ConvergenceLab` וב-`SupremumActivity` מדווחים השלמה לשרת (ראו «מעקב השלמת פעילויות» ב-§2). שני כרטיסי הפעילות הזמינים ממוספרים בכותרת («1. התכנסות נקודתית ובמידה שווה», «2. שימוש במבחן הסופרמום») ואין להם עוד תווית «פעילות זמינה». טקסט המבוא של התפריט עטוף ב-`.convergence-menu-lead`, ו-`.convergence-menu .module-intro-content` הוא גריד דו־עמודות (≈7fr/3fr) עם צד «לקריאה ברשימות» בצד, מופרד בגבול inline-start; ב-≤820px הוא חוזר לערימה עם מפריד אופקי. רענון או עזיבת הנתיב מאפסים אותה. יתר שלושת הנושאים מציגים את רכיבי ה-placeholder שלהם. `FunctionSequencesSeriesModule.tsx`,‏ `FunctionSequencesSeriesIntro.tsx`,‏ `FunctionSequencesSection.tsx` ו-`types.ts` הישנים הוסרו; הנתיבים הישנים מפנים לנושא סדרות הפונקציות.

### לשוניות

| לשונית | קומפוננטה | מצב |
|---|---|---|
| סדרות פונקציות (`function-sequences`) | `SubjectModule` → תפריט פעילויות / `ConvergenceLab` | **פעיל חלקית** — שתי פעילויות: מסלול מודרך של ארבעה שיעורים במעבדת התכנסות ופעילות «מבחן הסופרמום»; שלוש פעילויות נוספות מתוכננות |
| טורי פונקציות (`function-series`) | `SubjectModule` → `FunctionSeriesSection` | **placeholder** |
| טורי חזקות (`power-series`) | `SubjectModule` → `PowerSeriesSection` | **placeholder** |
| טורי טיילור (`taylor-series`) | `SubjectModule` → `TaylorSeriesSection` | **placeholder** |

שלושת הנושאים `function-series`, `power-series`, `taylor-series` מציגים placeholders עם תיאור קצר ופעילויות מתוכננות. בנושא סדרות הפונקציות מוצג תפריט פעילות נפרד: מעבדת ההתכנסות פעילה כמסלול רציף בן ארבעה שיעורים, ומבחן הסופרמום פעיל כפעילות נפרדת; שלוש פעילויות על רציפות, אינטגרל ונגזרת מתוכננות. ציור המעבדה הוא SVG מקורי, לא Canvas ולא תלות plotter.

### מעבדת התכנסות

המעבדה בוחנת התכנסות נקודתית מול במידה שווה דרך ארבעה שיעורים עוקבים, לפי הסדר: היכרות עם שלוש דוגמאות לבחירה — `x/n` על `[0,1]`,‏ `x+sin(nx)/n` על `[-0.5,0.5]`, ו-`x^n` על `[0,0.5]` — עם בדיקת רצועה אופציונלית; משפחת `x^n` על תחומים משתנים; תנודות `sin(nx)/n`; והשוואה בין `nx/(1+n²x²)` לבין `x²/(n²+x²)`. כל שיעור נפתח לאחר השלמת הקודם בתשובה נכונה או בחשיפת תשובה; הניווט מאפשר לפתוח רק שיעור זמין, אך ההשלמה אינה מקפיצה אוטומטית לשיעור הבא. «החלק הבא» הוא פעולה מפורשת, כדי להשאיר זמן למשוב ולחקירה. בפעילות ההיכרות בחירת כל משפחה זמינה, והשלמת תחזית הגבול בנקודה קבועה פותחת את השיעור הבא; בדיקת הרצועה נשארת רשות. בפעילות החזקה הגרף ממשיך חזותית גם מחוץ לתחום שנבחר, באמצעות דגימה וחיתוך קיימים, אך התחום הנבחר בלבד קובע את גבולותיו ואת בדיקת הנקודה. בפעילות התנודות נדרשת השלמת הסיווג; בזוגית המסלול כולל תחזית, חיפוש ועדות נגדית, ניסוח מושגי ותיקון תחום סופי. אין כניסה ישירה לאתגר או דילוג על החימום. אין יצירת שאלות אקראיות.

| רכיב | תפקיד |
|---|---|
| `ConvergenceLab.tsx` | הגדרות פורמליות, הצגת שיעורים שבוקרו תוך הסתרת האחרים לשימור state, מעבר בדהייה: דעיכה של 120ms ואז כניסה של 180ms (נעקפות ב-reduced motion), ניווט והתקדמות בזיכרון; completion פותח שיעור אך אינו מעביר אליו אוטומטית; חזרה להגדרות ולתפריט אינה מאפסת פעילות |
| `lessonProgress.ts` | סדר ארבעת השיעורים, שערי פתיחה והשלמה טהורים; מגדיר גישה רק לשיעור הראשון שלאחר הקודמים שהושלמו |
| `ConvergenceNavigator.tsx` | ניווט מסלול עליון ופקדי קודם/הבא גם בתחתית; מעבר הבא מפורש, נעילה עד השלמת שיעור קודם. הרכיבים הכלליים `StageNavigator`/`StagePaging` (שלבים, העתק עברי `StageCopy` לפי מין שם העצם) משותפים לפעילות הסופרמום |
| `ConvergenceLessonExplanations.tsx` | ארבעה slots ריקים מסוג `ReactNode`, מתחת לכותרת כל חלק, למילוי תוכן הסבר בהמשך; אין בהם טקסט הוראה חדש |
| `SimpleConvergenceActivities.tsx`, `PowerConvergenceActivity.tsx`, `PairedConvergenceActivity.tsx` | משימות, בקרות, משוב ורמזים; ההיכרות מציעה שלוש דוגמאות ותחזית גבול שמספיקה לפתיחת הבא, בדיקת רצועה רשות; הסיווג בתנודות והשלב האחרון של תיקון תחום בזוגית משלימים את מסלולם. בשלב 3 של הזוגית, אחרי שנמצא כלל המעקב, שאלת הסתירה להתכנסות נקודתית מוצגת כתת־שלב גלוי (`followUp`): כותרת ותווית חדשות ב-`TaskCard`, השאלה בראש הכרטיס וקלטי הכלל מוסתרים. `SliderPanel` משותף מציע בחירת `n` בגרירה בטווח 1–256 לצד קלט מספרי מדויק, ושאר הקלטים נשארים מדויקים. כל חלק מציג את הסדרה ב-`.convergence-formula-card`; תחזית הגבול בהיכרות ובשלב הראשון בזוגית היא `LimitPrediction`. ממשק `challenge` הפנימי בזוגית נשאר, אך מעטפת המעבדה משתמשת ב-`challenge={false}` |
| `ConvergenceUI.tsx` | רכיבי UI משותפים למעבדה. `LabWorkspace({ task, tools, plots })` מרנדר `.convergence-workspace` אנכי, באותו סדר בכל breakpoint: פס משימה `.convergence-task-strip`, סרגל כלי צפייה `.convergence-toolbar` (ובו `SliderPanel`) ואז `.convergence-canvas` עם הגרפים. `TaskCard` מקבל `response` רשות ומפצל ל-`.convergence-task-prompt` (שלב, כותרת, שאלה וקלטי התשובה) ול-`.convergence-task-response` (בדיקה/חשיפה, משוב, שלב הבא, רמזים והוכחות). כלל: בקרה שהיא חלק מהתשובה (נקודה קבועה, כלל מעקב, בחירת תחום — בשלב המודרך מתוך שישה קטעים קונקרטיים לכל סדרה, עם תשובה נכונה אחת בדיוק (`REPAIR_CHOICES` שב-`math/convergenceActivity.ts`), ובחקירה החופשית עם δ/M, קצה `b` וסגור בחקירה חופשית, בורר הסדרה בחימום) יושבת בכרטיס המשימה ליד כפתור הבדיקה; בקרות תצוגה בלבד בסרגל הכלים. `SliderPanel` (בכל ארבעת החלקים) הוא פאנל LTR בצורת נוסחה: שורת `n=` ושורת `x_0=` רשות (`point`; בזוגית הנקודות הן קלטי תשובה ולכן אין שורה) עם תיבה, סליידר וכפתורי הכפלה/איפוס; מימין לקו מקווקו גוש `\varepsilon=` (0.01–0.5) עם סליידר, מעומעם ומושבת עד שהרצועה זמינה (`epsilonEnabled`); `extra` לבקרות תצוגה נוספות. `LimitPrediction` מציג תחזית גבול כמשוואה `\lim f_n(x_0)=` עם משבצת תשובה ושבבי אפשרויות. `NumberField` הוא קלט המספר המשותף (טיוטה ואימות) שגם `NumberControl` משתמש בו. `.convergence-formula-card` ממסגר וממרכז את הסדרה הנחקרת ומופיע באנימציה קצרה (מבוטלת ב-reduced motion) |
| `SequencePlot.tsx` | תצוגת גרפים מקורית ב-SVG; `powerContext` מציג המשך של `x^n` מחוץ לתחום הנבחר בהקשר חזותי בלבד; `controls` רשות מרנדר `.convergence-plot-controls` מתחת לכיתוב, לחלון הצפייה של הגרף (בחירת חלון וכפתור «הצגת הנקודה בחלון» בזוגית; מרכז וחצי-רוחב בתנודות) |

| שכבת מתמטיקה (`math/`) | תפקיד |
|---|---|
| `convergence.ts` | סיווג אנליטי ידני, גבולות, שגיאות supremum ועדות נגדית עבור משפחות מוגדרות; ללא CAS |
| `convergenceActivity.ts` | בדיקות טהורות למבני אינטראקציה ותשובות |
| `sequencePlot.ts` | גאומטריית תצוגה בלבד: תחום מול חלון צפייה, דגימה ונקודות קריטיות; `clipPlotSegments` חותך קטעי פוליליין אנכיים במפורש (לא clamp לערכי y), לצד אזהרות רזולוציה ומעטפת |

| בדיקות | כיסוי |
|---|---|
| `convergence.test.ts`, `convergenceVerification.test.ts` | סיווג ושגיאות אנליטיים ואימותי התכנסות |
| `convergenceActivity.test.ts` | בדיקות האינטראקציה הטהורות |
| `lessonProgress.test.ts` | סדר, שערי שיעורים, השלמות בסדר נכון והתנהגות idempotent |
| `components/convergenceNavigation.test.ts` | רינדור ניווט, נעילה, מצבי התקדמות ו-slots של ההסברים |
| `sequencePlot.test.ts` | גאומטריית הגרף ותנאי תצוגה |
| `components/convergenceRendering.test.ts` | SSR: הסתרת גבול לפני תחזית, קצה פתוח/סגור, היעדר פאנל ערכים מתחת לגרף, מעטפת תנודות והמשך חזותי של `x^n` בלי לשנות את התחום הפעיל |

### מבחן הסופרמום: חישוב וטיעון

פעילות שנייה בנושא סדרות פונקציות, המלווה בתוכנית `docs/plans/supremum-test-activity.md` (§7 מתעד את החלטות המרצה). התלמיד מחשב בפועל את `M_n=\sup|f_n-f|` ומנמק את המסקנה לפי מבחן הסופרמום: קיום מקסימום, משפט פרמה, נקודות קצה, ואז התכנסות `M_n→0` או היעדרה. סדר הדוגמאות: E1 → E1′ → E2 → E3 → E3′ (סה״כ 27 שלבים), בחלוקה: E1 `nxe^{-nx}` על `[0,∞)`, E1′ אותה על `[1,∞)`, E2 `nx^2e^{-nx}`, E3 `x^n(1-x^n)` על `[0,1]`, E3′ אותה על `[0,1/2]`. `SUP_MAX_N = 64`. התשובות הן **אסימונים (tokens) מתוך מאגר סגור** ותבניות מודרכות; אין CAS ואין קלט נוסחה חופשי (החלטת המרצה), ו-`e` מופיע רק בתוך מחרוזות LaTeX. כל הטקסט העברי נמצא ב-`supremumArgument.ts`.

| רכיב (`components/`) | תפקיד |
|---|---|
| `SupremumActivity.tsx` | shell הפעילות על `LabWorkspace`/`TaskCard`/`SliderPanel`, במבנה שלבים כמו מעבדת ההתכנסות: מסך מטרה, מסלול של חמש דוגמאות (`StageNavigator` עם `.supremum-progress-list`, חמש עמודות, שלוש עד 1180px ושתיים עד 640px), כותרת וחריץ הסבר לכל דוגמה, ומסך סיום עם חקירה חופשית (שבבי הדוגמאות מופיעים רק בה). מעבר בין שלבים, משוב, רמזים וחשיפה. `initialView` רשות (`"intro"`/`"E1"`) משמש את בדיקות ה-SSR; `onFinish` נקרא בפתיחת מסך הסיום |
| `SupremumExampleExplanations.tsx` | חריצי הסבר מהמרצה לכל דוגמה (`null` עד שייכתב טקסט), כמו `ConvergenceLessonExplanations.tsx` |
| `SupremumIntro.tsx` | מסך הפתיחה (מטרת הפעילות, ניסוח מבחן הסופרמום ומתכון בן חמישה שלבים לחישוב $M_n$); הפעילות נפתחת בו, ופעולת «מטרת הפעילות» חוזרת אליו בלי לאבד התקדמות |
| `SupremumPlot.tsx` | גרף G1 ב-SVG: העקום, הקשר מעומעם מחוץ לתחום, משיק, רצועת סימן של `f_n′`, סמן מקסימום, קו הסופרמום ובוחרי חלון צפייה |
| `SupSequencePlot.tsx` | גרף G2: `M_n` כנגד `n`, רצועת ε וקריאת «n>N» |
| `SlotTemplate.tsx` | תבנית משבצות עם אסימונים, כולל קבוצות `unordered` רשות |
| `CandidateTable.tsx` | טבלת מועמדים עם כיתוב לכל שורה |
| `ReasonChecklist.tsx` | רשימת נימוקים, עם פריטים «נכון אך לא נדרש» רשות |
| `SpecChoice.tsx`, `MathInlineText.tsx` | בחירה מרשימה ורינדור KaTeX משולב בטקסט |

`SliderPanel` ב-`ConvergenceUI.tsx` קיבל prop רשות `nMax` (ברירת מחדל `MAX_DISPLAY_N`). מחלקות ה-CSS הן משפחת `supremum-` ב-`globals.css`.

| שכבת מתמטיקה (`math/`) | תפקיד |
|---|---|
| `supremumTypes.ts` | החוזה המשותף: אסימונים, תבניות משבצות (עם קבוצות `unordered`), טבלאות מועמדים, רשימות בדיקה (עם פריטי «נכון אך לא נדרש»), בחירות ו-`CheckResult` |
| `supremumExamples.ts` | הדוגמאות המוכנות E1, E1p, E2, E3, E3p (`SUP_EXAMPLES`, `SUP_EXAMPLE_ORDER`), `SUP_MAX_N`, בדיקות תחום |
| `supremumArgument.ts` | מאגר האסימונים, נתוני השלבים לכל דוגמה (`SUP_STEPS`), הבודקים (`checkSlots`, `checkCandidateTable`, `checkChecklist`, `checkChoice`, `checkStep`), דגלי הגרף והעתקי העברית |
| `supremumPlot.ts` | גאומטריית הגרפים: עקום ואזור הקשר, משיק, רצועת סימן, נקודות `M_n`, רצועת ε וקריאת «n>N», עיצוב מספרים |
| `supremumViews.ts` | חלונות צפייה (שבבים) וגבולות בדיקת הנקודה |
| `supremumProgress.ts` | התקדמות בין הדוגמאות: דוגמה הושלמה כשכל שלביה נפתרו או נחשפו; דוגמה (ומסך הסיום) נפתחת רק אחרי כל הקודמות (`canOpenSupremumView`) |
| `supremumOrder.ts` | סדר תצוגה דטרמיניסטי ומעורבב (hash של המזהה → `mixSeed` → `SeededRandom`) לאפשרויות, לפריטי רשימות ולשבבי המשבצות, כדי שמיקום התשובה הנכונה לא יסגיר אותה; הבדיקה לפי מזהים ואינה מושפעת. `supremumArgument.test.ts` אוכף גם איזון אורכים בין האפשרויות |

| בדיקות | כיסוי |
|---|---|
| `math/supremumExamples.test.ts`, `math/supremumArgument.test.ts`, `math/supremumPlot.test.ts`, `math/supremumVerify.test.ts`, `math/supremumProgress.test.ts` | הדוגמאות, הבודקים, גאומטריית הגרפים, אימות מספרי של הנתונים וסדר פתיחת הדוגמאות |
| `components/supremumInputs.test.ts`, `components/supremumRendering.test.ts` | רכיבי הקלט ורינדור SSR של הפעילות והגרפים |

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
| `SubjectModule.tsx` | shell משותף לארבעת הנושאים; תפריט הפעילויות ומעבר למעבדת ההתכנסות או למבחן הסופרמום עבור סדרות פונקציות |
| `SupremumActivity.tsx`, `SupremumPlot.tsx`, `SupSequencePlot.tsx`, `SlotTemplate.tsx`, `CandidateTable.tsx`, `ReasonChecklist.tsx`, `SpecChoice.tsx`, `MathInlineText.tsx` | פעילות מבחן הסופרמום (ראו לעיל) |
| `FunctionSeriesSection.tsx`, `PowerSeriesSection.tsx`, `TaylorSeriesSection.tsx` | תוכן placeholder לשלושת הנושאים שטרם מומשו |

`math/mathTypography.ts` הוא עותק של עזרי מחלקות CSS, שנדרש ל-`MathText`/`DisplayMath`. קיימת שכבת `math/` עבור מעבדת ההתכנסות ומבחן הסופרמום (קבצי `supremum*.ts`), אך אין תיקיית `practice/` נפרדת: בדיקות התשובה והאינטראקציה הטהורות נמצאות ב-`math/convergenceActivity.ts`, ובפעילות הסופרמום ב-`math/supremumArgument.ts`.

### מה עדיין חסר במודול

- הרחבת מעבדת ההתכנסות מעבר למשפחות האנליטיות הקבועות, ובפרט משימות ε–N ואי־רציפות/העברת גבול.
- מילוי ארבעת slots ההסבר ב-`ConvergenceLessonExplanations.tsx` בתוכן לימודי, אם יידרש; כרגע הם ריקים במכוון.
- הרחבות אפשריות למבחן הסופרמום (v2): שלב `[a,∞)`, «מצאו את השורה השגויה», והדוגמה הנוספת `x/(n+x)`.
- פעילויות על טורי פונקציות, טורי חזקות וטורי טיילור.
- שכבת `practice/` נפרדת, גנרטורים ו-`SeededRandom` עבור תרגול שנוצר.
- נושאי רציפות, אינטגרציה וגזירה איבר־איבר; הם נשארים מתוכננים ואינם ממומשים במעבדה הנוכחית.

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

**קובץ יחיד:** `app/globals.css` (~4,808 שורות) — כל העיצוב מבוסס מחלקות CSS מותאמות (Tailwind מיובא אך כמעט לא בשימוש utility). **Theme בהיר בלבד** — אין dark mode. `html { font-size: 106.25%; }` — הטקסט הבסיסי מעט גדול מברירת המחדל של הדפדפן, וכמעט כל הגדלים ב-`rem` ולכן מסתדרים איתו; כללי `.text-size-control` / `.text-size-button` ממוקמים מיד לפני `.sample-table`.

### שפה עיצובית: «מחברת נייר»

רקע קרם עם רשת משבצות עדינה (32×32px) ומשטח זהב רדיאלי קלוש; פאנלים «זכוכיתיים» עם blur; מתמטיקה בגופן KaTeX על רקע נייר.

### אסימוני עיצוב (`:root`)

| משתנה | ערך | תפקיד |
|---|---|---|
| `--paper` | `#fbf7ed` | רקע העמוד והקנבס (קרם) |
| `--paper-deep` | `#efe4cf` | נייר עמוק יותר: רקע אזור הצפייה בקורא הרשימות (`.notes-frame-viewer`) ורקע פס האיור בכרטיס הקורס (`.course-card-art`) |
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
| `.convergence-workspace` | מעבדת ההתכנסות: ערימה אנכית זהה בכל breakpoint — `.convergence-task-strip` · `.convergence-toolbar` · `.convergence-canvas`. פס המשימה במסך רחב בשתי עמודות (הנחיה מימין ב-RTL, תגובה משמאלה, מופרדות בקו), ועד 820px נערמות. `.convergence-plots` הם auto-fit (שני גרפי הזוגית זה לצד זה כשרחב); גרף יחיד ממורכז ברוחב עד 980px. `.function-series-lab-grid` נשאר ברשימות ה-breakpoint המשותפות אך אינו בשימוש אף רכיב |
| `.practice-grid` | מסכי תרגול במודול אוילר |

- **פאנלים:** `.control-panel` / `.canvas-panel` / `.analysis-panel` — רקע `--panel`, רדיוס 8px, `backdrop-filter: blur(14px)`, הצללת `--shadow`. כרטיסים מקוננים: `.panel-section`, `.result-card` (ו-`.result-card.primary` עם גרדיאנט כחול להדגשת הסיווג).
- **לשוניות משנה:** `.segmented-control`, `.practice-mode-nav`.
- **מעטפת האתר:** דשבורד `.dashboard` עם `.course-card`; `.course-shell-body` — רשת `minmax(230px, 290px) minmax(0, 1fr)` של `nav.chapter-rail` (sticky) ו-`.course-panel`; בפאנלים `.resource-grid` (3 עמודות), `.notes-toc` ו-`.notes-section` (רשת: קישור · תגיות · עמוד, עם `.module-tag`), `.course-module-card.active` מול `.construction` בעמודי הפרקים, ו-`nav.chapter-pager`. `nav.site-breadcrumbs` מופיע בכל ה-topbars; המפריד `›` מתהפך אוטומטית ב-RTL.
- **קורא הרשימות:** `.notes-reader` — רשת `minmax(240px, 0.42fr) minmax(0, 1fr)` בגובה `clamp(560px, 100vh − 44px, 1100px)`: `.notes-reader-toc` (עמודה גוללת; בתוכה הסעיף שורה אחת בלי עמודת העמוד, והתגיות בשורה משלהן) ו-`.notes-frame` (סרגל `.notes-frame-bar` עם `.notes-frame-button` ואזור צפייה על `--paper-deep`). `.toc-hidden` מקפל לעמודה אחת. היעד הפתוח מסומן ב-`--blue-soft` דרך `aria-current="location"`.
- **איורים:** בקצוות בלבד, אף פעם לא מתחת לטקסט גוף, ולא במעבדות, בתרגול או במסילת הפרקים. קווים דרך `ArtSvg` (`pathLength={1}`, צבעי אסימון, `aria-hidden`). נוסחאות דהויות דרך `FadedEquations`. כרטיס הדשבורד: פס איור ביחס 8∶5. כותרת «חומר הקורס» וכותרות הפרקים: מוטיב בקצה, מוסתר מ-820px; בפרק הוא דוהה אל הטקסט עם `mask-image`.
- **מעבר הכניסה:** `.course-entry-root`, `.course-entry-overlay`, `.course-entry-paper`, `.course-entry-scene`, `.course-entry-art`, `.course-entry-heading`, `.course-entry-code` ו-`.course-entry-title`. הפורטל ב-`document.body` מציג עותק דקורטיבי של הכריכה, בלי לשנות את פריסת המקור; WAAPI מניע את האיור השלם ומשנה את רקע הכריכה לשקוף. אין `clip-path`, ציור קווים מדורג או נעילת גלילה. האזור מותאם לרוחב, למסכים קצרים ול-safe areas ומשתמש באסימוני הפלטה הקיימים.

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
| `prefers-reduced-motion: reduce` | כרטיסים בלי הרמת hover; מעבר הכניסה מדולג לחלוטין ומתבצע ניווט עוגן רגיל ללא השהיה. אין כלל כזה במקום אחר בקובץ |

גלילה אופקית מכוונת לנוסחאות רחבות (`.math-display-centered`, שורות נוסחה).

### זהות ויזואלית של המודולים

אין פלטת צבעים נפרדת לכל מודול — כולם חולקים את אותם אסימונים. ההבחנה היא מבנית: מישור הפאזה מזוהה עם הקנבס והמקרא; מודול אוילר עם צינור כרטיסי השלבים (`.practice-step-card`) ורצועות המידע (`.euler-transform-strip`); מודול ההומוגניות עם קלט נוסחה חופשית (`.formula-answer-card`) ותצוגה מקדימה חיה; מודול סדרות הפונקציות עם גרפי SVG מקוריים ומשימות מודרכות.

---

## 9. תשתית ופריסה

- **פיתוח:** `npm run dev` (vinext), `npm run build` (`next build --webpack`).
- **בדיקות:** `npm test` (vitest) — `app/constant-coefficients-euler/{math,practice}/*.test.ts`, `app/linear-homogeneous/math/*.test.ts`, `app/function-sequences-series/math/*.test.ts`, בדיקות קורסים ואיורים, ניווט, סנכרון, זיהוי לחיצה, מעבר כניסה ורינדור כרטיס. בדיקות הסנכרון מכסות תאימות לפקודת ODE, הפרדת קורסים, פרסור כותרות וארגומנטים לא תקינים.
- **סנכרון הרשימות:** `npx tsx scripts/sync-course-notes.ts [תיקיית הרשימות]` (ברירת מחדל: ODE, שתי רמות מעל המאגר); לקורס פוריה: `npx tsx scripts/sync-course-notes.ts --course fourier "<תיקיית הרשימות>"`. הסקריפט מפרסר `main.toc`, מנרמל כותרות ובודק שיוך סעיפים ומונוטוניות עמודים, קורא היסט מ-`/PageLabels`, וכותב את `notesToc.ts` המתאים ומעתיק שלושה PDFs. שמות המקור במד״ר: `main.pdf`, `ExtendedSyllabus_winter2026.pdf`, `FormulaSheet.pdf`; בפוריה: `main.pdf`, `ElaborateSyllabus.pdf`, `formula_sheet.pdf`. ב-Fourier שלוש כותרות מתמטיות מוכרות מומרות למילים עבריות; LaTeX לא מוכר נכשל במפורש. ברירת המחדל של ODE נשארת תואמת לפקודה הישנה.
- **Worker:** `worker/index.ts` — handler ל-Cloudflare Workers + אופטימיזציית תמונות; auth משתמש ב-D1 וב-private R2.
- **הגדרת מסד מקומי:** `scripts/setup-auth.ts` במצב `node` מחיל מיגרציות ממתינות לפי הסדר (0000, 0001) ומסרב לסכימה חלקית או שאינה בסדר; ב-D1 המעקב אחר מיגרציות נעשה ב-wrangler.
- **DB:** `db/schema.ts` מגדיר משתמשים, throttles, sessions והרשאות קורס וסימוני השלמת פעילויות (`activity_completions`, במקביל ל-`drizzle/0001_activity_progress.sql`); `app/_auth/` מחבר את שכבת השירות ל-Drizzle ב-Workers ול-`node:sqlite` בפיתוח מקומי.
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
| `verify-auth-http.ts` | smoke test HTTP אמיתי לכניסה, הרשאות ו-PDF; מפעיל שרת Next production או vinext dev ומשתמש בחשבונות זמניים |

**הגדרת וניהול חשבונות:** `npm run auth:setup` (בחרו `node`, `local` או `remote`); פקודות `npm run auth -- create|grant|revoke|reset-password|disable|enable|list`. מצב remote דורש תצורה אמיתית ומפורשת; setup אינו מקים או פורס משאבים. הוראות: `docs/authentication.md`.

---

## 10. הערות ארכיטקטוניות

- **שני סגנונות מבניים:** מישור הפאזה הוא קובץ מונוליטי אחד; מודולי אוילר, ההומוגניות וסדרות הפונקציות בנויים בשכבות (components / math / practice לפי הצורך). בשלושתם המעטפת היא `<Name>Module.tsx` (`"use client"`), וה-`page.tsx` שטוען אותה יושב תחת `app/ode/N/`. קורס פוריה אינו מודול: הוא משתמש ב-`app/_site/` ומוסיף נתונים ואיורים ייעודיים ב-`app/fourier/`.
- **מבנה רב־קורסי:** `app/_site/` לא מכיר קורס מסוים. קורס הוא תיקייה עם `course.ts`, תוכן עניינים שנוצר מהרשימות, ונתיבי פרקים ומודולים; הוא נרשם ב-`app/courses.ts`. הנתיבים שטוחים ומפורשים (תיקייה לכל פרק ולכל מודול), ו-`course.test.ts` מוודא שהרישום והתיקיות לא נפרדים. מנוע האיורים יושב ב-`_site/art`; הציורים של 104136 ו-104214 נמצאים בהתאמה ב-`app/ode/art.ts` וב-`app/fourier/art.ts`, ומחוברים לכרטיס ב-`courses.ts`. הם לא על `CourseDefinition`, כי האובייקט הזה נמסר לקומפוננטות client.
- **קורא הרשימות משודרג, לא מחליף:** כל קישור לרשימות הוא קודם כול קישור רגיל ללשונית חדשה, והקורא רק מיירט אותו. לכן אין מצב שבו הרשימות לא נגישות. ה-breakpoint של 820px קיים פעמיים, ב-CSS וב-`useNotesReaderAvailable`; מי שמשנה אחד צריך לשנות את השני.
- **כפילות מכוונת:** ל-`MathText`/`DisplayMath`/`mathTypography` יש ארבע גרסאות (פאזה מקומית; עותק זהה באוילר, בהומוגניות ובסדרות הפונקציות). אין עדיין חבילת UI מתמטי משותפת.
- **פרדיגמות מתמטיות:** מודולי הפאזה ואוילר עובדים עם מבנים סגורים (מטריצות 2×2, שורשים, פולינומים). מודול ההומוגניות מפרסר נוסחאות חופשיות ומפעיל nerdamer — עם מדיניות זהירות סביב `e`/`π` ופישוט לתצוגה מול אימות. מעבדת סדרות הפונקציות משתמשת בסיווג אנליטי ידני למשפחות מוגדרות ובגאומטריית SVG תצוגתית; אין בה CAS או פרסר נוסחאות כללי.
- **שיתוף נקודתי:** הגנרטור של ההשלמה למערכת יסודית מייבא `SeededRandom` ממודול אוילר. זה הקשר היחיד בין המודולים בקוד. מודול סדרות הפונקציות מתוכנן למחזר את אותו `SeededRandom` כשתיבנה שכבת `practice/`. בנוסף, ארבעת המודולים מייבאים את `app/ode/OdeModuleBreadcrumbs` — תלות בשכבת הקורס, לא במודול אחר. מודול שישותף בעתיד בין קורסים יצטרך לקבל את ה-breadcrumbs מבחוץ.
- **Persistence ממוקד:** אין שמירה של תשובות או סטטיסטיקות תרגול; הן חיות בזיכרון ומתאפסות ברענון. חריג צר אחד בצד הלקוח: `kiri-math:text-size` ב-localStorage (העדפת גודל טקסט, לעולם לא מצב תרגול). החריג השני הוא נתוני זהות, throttling, sessions והרשאות החשבונות הנדרשים לאכיפת גישה. החריג השלישי: סימוני השלמה של פעילויות (`activity_completions`, `app/_progress/`) — השלמה בלבד, בלי תשובות או מצב באמצע פעילות; כל פעילות חדשה חייבת נקודת סיום מוגדרת. אין להרחיב את ההתמדה מעבר לכך. אין רישום משתמשים או תשלום מקוון; יצירה ומתן/ביטול הרשאות נעשים ידנית דרך CLI.
