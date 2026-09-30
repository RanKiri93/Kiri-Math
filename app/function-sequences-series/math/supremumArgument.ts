/**
 * Step data and checkers of the supremum-test activity (docs/plans/supremum-test-activity.md).
 * Pure TypeScript, no React. The activity component is a thin renderer over SUP_STEPS:
 *
 *   for each step of SUP_STEPS[exampleId]:
 *     render step.title, step.prompt (Hebrew with inline $...$ math) and step.parts;
 *     show step.hints one at a time and the optional step.disclosure;
 *     on "check": checkStep(step, answers); on "reveal": revealAnswers(step);
 *     graphs: graphFlagsFor(steps, index, solved).
 *
 * Answers are tokens, never numbers: `e` lives only inside LaTeX labels. All Hebrew copy is in
 * this file, grouped per step, for the hebrew-copy review.
 */
import type { SupExampleId } from './supremumExamples';
import type {
  CandidateFilling,
  CandidateRow,
  CandidateTableSpec,
  CheckResult,
  ChecklistSpec,
  ChoiceSpec,
  SlotFilling,
  SlotSpec,
  SlotTemplateSpec,
  TemplateSegment,
  Token,
  TokenId,
  TokenLabel,
} from './supremumTypes';

const H = String.raw;

// ---------------------------------------------------------------------------------------------
// Token registry (chip id -> LaTeX label). `e` appears only inside LaTeX strings.
// ---------------------------------------------------------------------------------------------

const TOKEN_LATEX: Record<TokenId, string> = {
  zero: '0',
  one: '1',
  two: '2',
  half: '\\frac12',
  quarter: '\\frac14',
  'inv-e': '\\frac1e',
  e: 'e',
  inf: '\\infty',
  x0: 'x_0',
  'x0-sq': 'x_0^2',
  n: 'n',
  n2: 'n^2',
  'neg-n2': '-n^2',
  'two-n': '2n',
  'inv-n': '\\frac1n',
  'inv-n2': '\\frac{1}{n^2}',
  'n-over-e': '\\frac{n}{e}',
  'four-over-e2': '\\frac{4}{e^2}',
  'four-over-n-e2': '\\frac{4}{ne^2}',
  'two-over-n': '\\frac2n',
  'n-over-2': '\\frac n2',
  'two-over-n-e': '\\frac{2}{ne}',
  'n-e-neg-n': 'ne^{-n}',
  'e-neg-n': 'e^{-n}',
  'two-x-n': '2x^n',
  'x-n': 'x^n',
  'two-x-2n': '2x^{2n}',
  'two-n-x-n': '2nx^n',
  'root-two': '2^{-1/n}',
  'two-neg-n': '2^{-n}',
  'two-inv-n': '2^{1/n}',
  'sup-e3p': '2^{-n}\\left(1-2^{-n}\\right)',
  gt0: '>0',
  eq0: '=0',
  lt0: '<0',
  le0: '\\le 0',
  ge0: '\\ge 0',
  le: '\\le',
  ge: '\\ge',
  gt: '>',
  lt: '<',
};

export const SUP_TOKENS: Record<TokenId, TokenLabel> = Object.fromEntries(
  Object.entries(TOKEN_LATEX).map(([id, latex]) => [id, { latex }]),
) as Record<TokenId, TokenLabel>;

export function tokenLabel(id: TokenId): TokenLabel {
  const label = SUP_TOKENS[id];
  if (!label) throw new RangeError(`Unknown token: ${id}`);
  return label;
}

export function tokensOf(ids: TokenId[]): Token[] {
  return ids.map((id) => ({ id, label: tokenLabel(id) }));
}

// ---------------------------------------------------------------------------------------------
// Step types
// ---------------------------------------------------------------------------------------------

/** Which "maximum" marker the function graph shows. `origin`: the point (0,0). `critical`: at x_n
 * (draw it faded when the example's criticalInterior(n) is false). `argmax`: at the true maximum. */
export type MaxMarker = 'none' | 'origin' | 'critical' | 'argmax';

/** What the graphs show. Cumulative: the full state once the step is solved. */
export type GraphFlags = {
  limitLine: boolean;
  tangent: boolean;
  signStrip: boolean;
  maxMarker: MaxMarker;
  supLine: boolean;
  /** The M_n-vs-n graph. */
  mnGraph: boolean;
  epsilonControl: boolean;
  /** Draw the curve outside the domain faded (context). Static for an example. */
  fadedOutsideDomain: boolean;
};

export const BASE_GRAPH: GraphFlags = {
  limitLine: false,
  tangent: false,
  signStrip: false,
  maxMarker: 'none',
  supLine: false,
  mnGraph: false,
  epsilonControl: false,
  fadedOutsideDomain: false,
};

export type Disclosure = { summary: string; body: string };

type PartBase = {
  id: string;
  /** Optional Hebrew line above the part (inline $...$ math allowed). */
  lead?: string;
};

export type SlotsPart = PartBase & { kind: 'slots'; template: SlotTemplateSpec; reveal: SlotFilling };
export type TablePart = PartBase & {
  kind: 'table';
  table: CandidateTableSpec;
  /** Row id -> Hebrew kind caption ("קצה", "נקודה חשודה לקיצון", "גבול באינסוף"). */
  captions: Record<string, string>;
  reveal: CandidateFilling;
};
export type ChecklistPart = PartBase & { kind: 'checklist'; checklist: ChecklistSpec; reveal: string[] };
export type ChoicePart = PartBase & { kind: 'choice'; choice: ChoiceSpec; reveal: string };
export type StepPart = SlotsPart | TablePart | ChecklistPart | ChoicePart;

/** A student's input for one part; which shape depends on the part's kind. */
export type PartAnswer = SlotFilling | CandidateFilling | string[] | string | undefined;
export type StepAnswers = Partial<Record<string, PartAnswer>>;
export type StepCheckResult = CheckResult & { partId?: string };

export type Step = {
  /** e.g. "E1-4b". */
  id: string;
  exampleId: SupExampleId;
  title: string;
  /** Hebrew, inline math as $...$. */
  prompt: string;
  parts: StepPart[];
  /** Shown one at a time, in order. */
  hints: string[];
  disclosure?: Disclosure;
  /** Hebrew feedback shown when the step is solved (or revealed). */
  solvedNote: string;
  /** Graph state once the step is solved. */
  graph: GraphFlags;
};

// ---------------------------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------------------------

const L = (latex: string): TemplateSegment => ({ latex });
const S = (slotId: string): TemplateSegment => ({ slot: slotId });

function slot(id: string, chips: TokenId[], accepted: TokenId | TokenId[], diagnoses?: Partial<Record<TokenId, string>>): SlotSpec {
  return { id, chips, accepted: Array.isArray(accepted) ? accepted : [accepted], ...(diagnoses ? { diagnoses } : {}) };
}

function template(id: string, segments: TemplateSegment[], slots: SlotSpec[], unordered?: string[][]): SlotTemplateSpec {
  return { id, segments, slots, ...(unordered ? { unordered } : {}) };
}

function revealSlots(t: SlotTemplateSpec): SlotFilling {
  return Object.fromEntries(t.slots.map((s) => [s.id, s.accepted[0]]));
}

function slotsPart(t: SlotTemplateSpec, lead?: string): SlotsPart {
  return { kind: 'slots', id: t.id, template: t, reveal: revealSlots(t), ...(lead ? { lead } : {}) };
}

/** A one-slot row of a candidate table: `lead` [slot]. */
function row(
  tableId: string,
  id: string,
  lead: string,
  chips: TokenId[],
  accepted: TokenId,
  diagnoses: Partial<Record<TokenId, string>>,
  isMaximum: boolean,
): CandidateRow {
  return {
    id,
    isMaximum,
    template: template(`${tableId}-${id}`, [L(lead), S('v')], [slot('v', chips, accepted, diagnoses)]),
  };
}

function tablePart(id: string, rows: CandidateRow[], captions: Record<string, string>, wrongMaximumMessage: string, lead?: string): TablePart {
  const filling: CandidateFilling = {
    rows: Object.fromEntries(rows.map((r) => [r.id, revealSlots(r.template)])),
    maximumRowId: rows.find((r) => r.isMaximum)?.id,
  };
  return { kind: 'table', id, table: { id, rows, wrongMaximumMessage }, captions, reveal: filling, ...(lead ? { lead } : {}) };
}

function checklistPart(id: string, items: ChecklistSpec['items'], lead?: string): ChecklistPart {
  return {
    kind: 'checklist',
    id,
    checklist: { id, items },
    reveal: items.filter((i) => i.required).map((i) => i.id),
    ...(lead ? { lead } : {}),
  };
}

function choicePart(id: string, prompt: string, options: ChoiceSpec['options'], lead?: string): ChoicePart {
  return {
    kind: 'choice',
    id,
    choice: { id, prompt, options },
    reveal: options.find((o) => o.correct)!.id,
    ...(lead ? { lead } : {}),
  };
}

const graph = (flags: Partial<GraphFlags>): GraphFlags => ({ ...BASE_GRAPH, ...flags });

// ---------------------------------------------------------------------------------------------
// Shared Hebrew building blocks
// ---------------------------------------------------------------------------------------------

const TABLE_WRONG_MAX = 'המקסימום הוא המועמד שערכו הגדול ביותר. השוו את הערכים שבטבלה.';
const SLOT_GENERIC = 'המשבצת המסומנת אינה נכונה.';

const CAPTIONS = {
  'end-left': 'קצה התחום',
  'end-right': 'קצה התחום',
  critical: 'נקודה חשודה לקיצון פנימית',
  infinity: 'גבול באינסוף',
};

/** Conclusion when M_n does not tend to 0. */
function notUniformChoice(id: string, domain: string, lim: string): ChoicePart {
  return choicePart(id, 'מה המסקנה?', [
    {
      id: 'correct',
      correct: true,
      label: H`מכיוון ש־$M_n\not\to0$ (הגבול הוא $${lim}$), ההתכנסות ב־$${domain}$ אינה במידה שווה.`,
    },
    {
      id: 'no-pointwise',
      correct: false,
      label: H`מכיוון ש־$M_n\to${lim}$, הסדרה אינה מתכנסת נקודתית, ולכן גם לא במידה שווה.`,
      diagnosis: 'מבחן הסופרמום מודד את ההפרש מהגבול הנקודתי, שכבר חושב בשלב הראשון. ההתכנסות הנקודתית מתקיימת; מה שנכשל הוא האחידות.',
    },
    {
      id: 'moving-point',
      correct: false,
      label: H`מכיוון ש־$f_n(x_n)\not\to0$, אין גבול לסדרה בנקודה $x_n$, ולכן אין התכנסות.`,
      diagnosis: H`הנקודה $x_n$ זזה עם $n$, ואילו הגבול הנקודתי נבדק בנקודה קבועה. הערך $f_n(x_n)$ אינו סותר התכנסות נקודתית; הוא מראה ש־$M_n\ge f_n(x_n)\not\to0$.`,
    },
    {
      id: 'bounded',
      correct: false,
      label: H`$M_n$ חסומה, ולכן $f_n$ קרובות ל־0 במידה אחידה, וההתכנסות ב־$${domain}$ במידה שווה.`,
      diagnosis: H`חסימות של $M_n$ אינה מספיקה. התכנסות במידה שווה שקולה ל־$M_n\to0$.`,
    },
  ]);
}

/** Conclusion when M_n tends to 0. */
function uniformChoice(id: string, domain: string): ChoicePart {
  return choicePart(id, 'מה המסקנה?', [
    {
      id: 'correct',
      correct: true,
      label: H`לפי מבחן הסופרמום, מכיוון ש־$M_n\to0$, ההתכנסות ב־$${domain}$ במידה שווה.`,
    },
    {
      id: 'peak-moves',
      correct: false,
      label: H`הפסגה של $f_n$ נעה עם $n$, ולכן ההתכנסות ב־$${domain}$ אינה במידה שווה.`,
      diagnosis: H`תנועת הפסגה אינה הקריטריון. מה שקובע הוא גובה הפסגה $M_n$, והוא שואף כאן ל־0.`,
    },
    {
      id: 'positive',
      correct: false,
      label: H`$M_n>0$ לכל $n$, ולכן ההתכנסות אינה במידה שווה.`,
      diagnosis: H`חיוביות של $M_n$ אינה סותרת התכנסות במידה שווה: השאלה היא אם $M_n$ שואפת ל־0.`,
    },
    {
      id: 'pointwise-only',
      correct: false,
      label: 'ההתכנסות נקודתית בלבד, כי הסופרמום נבדק נקודה נקודה.',
      diagnosis: H`הסופרמום הוא על כל התחום בבת אחת, ולכן $M_n\to0$ הוא בדיוק התכנסות במידה שווה.`,
    },
  ]);
}

/** Checklist of the existence argument on an unbounded domain, shared by E1 and E2. */
function existenceChecklist(id: string): ChecklistPart {
  return checklistPart(id, [
    {
      id: 'cont',
      required: true,
      label: H`$f_n$ רציפה ב־$[0,\infty)$, ולכן גם בכל קטע $[0,R]$`,
      diagnosis: 'חסרה הרציפות. בלעדיה אי אפשר להפעיל את משפט ויירשטראס אפילו על קטע סגור וחסום.',
    },
    {
      id: 'zero-left',
      required: false,
      optional: true,
      label: H`$f_n(0)=0$`,
    },
    {
      id: 'limit-inf',
      required: true,
      label: H`$\lim_{x\to\infty}f_n(x)=0$, ולכן מספיק לבדוק קטע $[0,R]$ סופי`,
      diagnosis: H`חסר הגבול באינסוף: הוא מאפשר להסתפק בקטע $[0,R]$ סופי, שבו משפט ויירשטראס חל.`,
    },
    {
      id: 'positive',
      required: true,
      label: H`$f_n(x)>0$ לכל $x>0$, ולכן המקסימום אינו בקצה $0$`,
      diagnosis: 'חסרה נקודה שבה הפונקציה חיובית. בלעדיה הערכים בקצה 0 ובאינסוף (שניהם 0) עשויים להיות הגדולים ביותר.',
    },
    {
      id: 'weierstrass-closed',
      required: false,
      label: H`$[0,\infty)$ סגור, ולכן לפי משפט ויירשטראס יש ל־$f_n$ מקסימום.`,
      diagnosis: H`משפט ויירשטראס דורש קטע סגור וחסום. $[0,\infty)$ אינו חסום, ולכן המשפט אינו חל עליו ישירות.`,
    },
    {
      id: 'differentiable',
      required: false,
      label: H`$f_n$ גזירה בכל נקודה, ולכן יש לה מקסימום.`,
      diagnosis: H`גזירות אינה מבטיחה מקסימום: למשל $f(x)=x$ על $(0,1)$ גזירה ואין לה מקסימום. גזירות משמשת רק אחרי שידוע שהמקסימום קיים.`,
    },
    {
      id: 'bounded-above',
      required: false,
      label: H`$f_n$ חסומה מלמעלה, ולכן היא מקבלת ערך מקסימלי.`,
      diagnosis: H`חסימות מבטיחה סופרמום ולא מקסימום. למשל $1-e^{-x}$ חסומה ב־$[0,\infty)$ ואינה מקבלת את הסופרמום.`,
    },
  ], 'סמנו את כל העובדות הדרושות כדי להסיק שלפונקציה יש מקסימום.');
}

// ---------------------------------------------------------------------------------------------
// E1: f_n(x) = n x e^{-nx} on [0, infinity)
// ---------------------------------------------------------------------------------------------

const D1 = H`[0,\infty)`;

const E1_G1 = graph({ limitLine: true });
const E1_G3 = graph({ limitLine: true, maxMarker: 'origin' });
const E1_G4a = graph({ limitLine: true, maxMarker: 'origin', tangent: true });
const E1_G4b = graph({ limitLine: true, maxMarker: 'origin', tangent: true, signStrip: true });
const E1_G5 = graph({ limitLine: true, maxMarker: 'critical', tangent: true, signStrip: true });
const E1_G6 = graph({ limitLine: true, maxMarker: 'argmax', tangent: true, signStrip: true, supLine: true });
const E1_G7 = graph({ ...E1_G6, mnGraph: true, epsilonControl: true });

const E1_STEPS: Step[] = [
  {
    id: 'E1-1',
    exampleId: 'E1',
    title: 'הגבול הנקודתי',
    prompt: H`מבחן הסופרמום בודק כמה רחוקה $f_n$ מהגבול הנקודתי שלה, ולכן מתחילים בחישובו. קבעו נקודה $x_0\ge0$ והשלימו את הגבול של $f_n(x_0)=nx_0e^{-nx_0}$ כאשר $n\to\infty$.`,
    parts: [
      slotsPart(template('E1-1-pointwise', [L(H`\lim\limits_{n\to\infty} n x_0 e^{-n x_0}=`), S('v')], [
        slot('v', ['zero', 'inv-e', 'x0', 'inf'], 'zero', {
          'inv-e': H`$\frac1e$ הוא גובה הפסגה $f_n(\frac1n)$, אבל הפסגה זזה עם $n$. כאן $x_0$ נקודה קבועה.`,
          x0: H`$x_0$ קבוע, ועבור $x_0>0$ הגורם $ne^{-nx_0}$ שואף לאפס; וב־$x_0=0$ כל האיברים הם 0.`,
          inf: H`הגורם $n$ גדל, אבל $e^{-nx_0}$ קטן הרבה יותר מהר, ולכן המכפלה אינה שואפת ל־$\infty$.`,
        }),
      ])),
    ],
    hints: [
      H`עבור $x_0=0$: $f_n(0)=0$ לכל $n$.`,
      H`עבור $x_0>0$: $ne^{-nx_0}\to0$, כי מעריכית עולה מהר יותר מכל חזקה של $n$.`,
    ],
    solvedNote: H`הגבול הנקודתי הוא $f(x)=0$ לכל $x\ge0$. עכשיו אפשר להשתמש במבחן הסופרמום.`,
    graph: E1_G1,
  },
  {
    id: 'E1-2',
    exampleId: 'E1',
    title: 'הגדרת $M_n$',
    prompt: H`המרחק המרבי של $f_n$ מהגבול $f=0$ בתחום הוא $M_n=\sup_{x\in[0,\infty)}\lvert f_n(x)-f(x)\rvert$. השלימו את ההגדרה ונמקו למה אפשר להשמיט את הערך המוחלט.`,
    parts: [
      slotsPart(template('E1-2-def', [L(H`M_n=\sup_{x\in[0,\infty)}\lvert f_n(x)-`), S('v'), L(H`\rvert`)], [
        slot('v', ['zero', 'one', 'inv-e'], 'zero', {
          one: 'הגבול הנקודתי שחושב בשלב הקודם הוא 0 ולא 1.',
          'inv-e': H`$\frac1e$ הוא ערך של $f_n$ ולא הגבול הנקודתי $f$.`,
        }),
      ])),
      choicePart('E1-2-abs', 'מדוע אפשר לכתוב $M_n=\\sup f_n(x)$ בלי ערך מוחלט?', [
        { id: 'nonnegative', correct: true, label: H`כי $f_n(x)\ge0$ לכל $x$ בתחום, ולכן $\lvert f_n(x)-0\rvert=f_n(x)$.` },
        {
          id: 'limit-zero',
          correct: false,
          label: H`כי הגבול הוא $f=0$, ולכן אין צורך בערך מוחלט.`,
          diagnosis: H`הערך המוחלט של ביטוי שווה לביטוי עצמו רק כשהביטוי אינו שלילי. זה נובע מהסימן של $f_n$, ולא מכך שהגבול הוא $0$.`,
        },
        {
          id: 'continuous',
          correct: false,
          label: H`כי $f_n$ רציפה, ולכן אינה מקבלת ערכים שליליים.`,
          diagnosis: 'רציפות אינה קובעת את הסימן של הפונקציה: גם פונקציה רציפה יכולה להיות שלילית.',
        },
      ]),
    ],
    hints: [H`$n>0$, $x\ge0$ ו־$e^{-nx}>0$. מה הסימן של המכפלה?`],
    solvedNote: H`$M_n=\sup_{x\ge0}nxe^{-nx}$. עלינו למצוא את הערך הגדול ביותר של $f_n$ בתחום, לכל $n$ קבוע.`,
    graph: E1_G1,
  },
  {
    id: 'E1-3',
    exampleId: 'E1',
    title: 'למה קיים מקסימום?',
    prompt: H`סופרמום אינו בהכרח מקסימום, ולכן לפני שמחפשים מקסימום צריך להצדיק שהוא קיים. התחום $[0,\infty)$ אינו חסום, ולכן משפט ויירשטראס אינו חל עליו ישירות.`,
    parts: [existenceChecklist('E1-3-exists')],
    hints: [
      H`איך עוברים מקטע אינסופי לקטע סגור וחסום? חפשו נקודה שבה $f_n$ חיובית, וגבול באינסוף.`,
      H`הערכים בקצה $0$ ובאינסוף הם $0$. מה עוד צריך כדי שהם לא יהיו הגדולים ביותר?`,
    ],
    disclosure: {
      summary: 'הוכחה קצרה שהמקסימום קיים',
      body: H`הפונקציה $f_n$ חיובית, למשל $f_n(\frac1n)=\frac1e>0$. מכיוון ש־$f_n(x)\to0$ כאשר $x\to\infty$, קיים $R>\frac1n$ כך ש־$f_n(x)<\frac1e$ לכל $x>R$. על הקטע הסגור והחסום $[0,R]$ הפונקציה הרציפה $f_n$ מקבלת מקסימום לפי ויירשטראס, וערכו לפחות $f_n(\frac1n)=\frac1e$, כי $\frac1n\in[0,R]$. לכן הוא גם המקסימום על כל $[0,\infty)$.`,
    },
    solvedNote: H`המקסימום קיים, ולכן אפשר לחפש אותו. המועמדים הם: הקצה $x=0$, נקודות פנימיות שבהן $f_n$ גזירה ו־$f_n'=0$, והגבול באינסוף. גם $f_n(0)=0$ נכון ושימושי לטבלת המועמדים, אבל אינו נדרש כדי להוכיח שהמקסימום קיים.`,
    graph: E1_G3,
  },
  {
    id: 'E1-4a',
    exampleId: 'E1',
    title: 'נגזרת: כלל המכפלה',
    prompt: H`$f_n$ גזירה בכל נקודה של $(0,\infty)$. חשבו את $f_n'$ בכלל המכפלה, והשלימו את המקדם החסר.`,
    parts: [
      slotsPart(template('E1-4a-product', [L(H`f_n'(x)=ne^{-nx}-`), S('c'), L(H`xe^{-nx}`)], [
        slot('c', ['n', 'n2', 'one', 'neg-n2'], 'n2', {
          n: H`חסר גורם משרשרת: $(e^{-nx})'=-ne^{-nx}$, ולכן מתקבל $n\cdot n=n^2$.`,
          'neg-n2': 'סימן המינוס כבר כתוב בביטוי, לפני המשבצת.',
          one: H`הנגזרת של $e^{-nx}$ כוללת גם את הגורם $-n$, ואת $n$ שלפני $x$.`,
        }),
      ])),
    ],
    hints: [H`$(nx\cdot e^{-nx})'=(nx)'e^{-nx}+nx\,(e^{-nx})'$.`],
    solvedNote: H`הזיזו את הנקודה על הגרף וראו שהמשיק אופקי בפסגה בלבד.`,
    graph: E1_G4a,
  },
  {
    id: 'E1-4b',
    exampleId: 'E1',
    title: 'נגזרת: פירוק לגורמים',
    prompt: H`הוציאו גורם משותף כדי לראות איפה הנגזרת מתאפסת ומה הסימן שלה.`,
    parts: [
      slotsPart(template('E1-4b-factor', [L(H`f_n'(x)=ne^{-nx}(1-`), S('c'), L(H`x)`)], [
        slot('c', ['one', 'n', 'n2', 'inv-n'], 'n', {
          n2: H`כבר הוצאתם $n$ לפני הסוגריים. נשאר $1-nx$.`,
          one: H`מהביטוי $ne^{-nx}-n^2xe^{-nx}$ מוציאים $ne^{-nx}$ ונשאר $1-nx$.`,
          'inv-n': H`$ne^{-nx}\cdot\frac1nx$ אינו $n^2xe^{-nx}$.`,
        }),
      ])),
    ],
    hints: [H`$n^2xe^{-nx}=ne^{-nx}\cdot(?)$.`],
    solvedNote: H`הסימן של $f_n'$ הוא סימן הגורם $1-nx$: חיובי משמאל לנקודה שבה הוא מתאפס, שלילי מימין לה.`,
    graph: E1_G4b,
  },
  {
    id: 'E1-5',
    exampleId: 'E1',
    title: 'נקודה חשודה לקיצון ומשפט פרמה',
    prompt: H`משפט פרמה: אם המקסימום מתקבל בנקודה פנימית של התחום, ו־$f_n$ גזירה בה, אז הנגזרת מתאפסת שם. מצאו את הנקודה החשודה לקיצון, ונמקו למה המשפט חל.`,
    parts: [
      slotsPart(template('E1-5-critical', [L(H`ne^{-nx}`), S('sign'), L(H`,\quad f_n'(x)=0\iff x=`), S('root')], [
        slot('sign', ['gt0', 'eq0', 'lt0'], 'gt0', {
          eq0: H`האקספוננט $e^{-nx}$ לעולם אינו $0$.`,
          lt0: H`האקספוננט חיובי תמיד, וגם $n$ חיובי.`,
        }),
        slot('root', ['inv-n', 'n', 'inv-n2', 'zero'], 'inv-n', {
          zero: H`$0$ הוא קצה התחום, ושם $f_n'(0)=n\ne0$. הנגזרת לא מתאפסת בו.`,
          n: H`$1-nx=0$ נותן $x=\frac1n$ ולא $x=n$.`,
          'inv-n2': H`$1-nx=0$ נותן $nx=1$, כלומר $x=\frac1n$.`,
        }),
      ])),
      choicePart('E1-5-fermat', 'מדוע מותר להשתמש במשפט פרמה בנקודה $x_n=\\frac1n$?', [
        {
          id: 'interior-differentiable',
          correct: true,
          label: H`כי $x_n=\frac1n$ נקודה פנימית של התחום ו־$f_n$ גזירה בה.`,
        },
        {
          id: 'circular',
          correct: false,
          label: H`כי $f_n'(x_n)=0$, ולכן אפשר להסתמך על המשפט.`,
          diagnosis: 'זו התוצאה של משפט פרמה ולא התנאי לשימוש בו. התנאים הם: נקודה פנימית וגזירות.',
        },
        {
          id: 'closed-domain',
          correct: false,
          label: H`כי התחום $[0,\infty)$ סגור, והמשפט חל בכל נקודה של קטע סגור.`,
          diagnosis: 'סגירות התחום אינה התנאי. משפט פרמה חל רק בנקודות פנימיות; הקצה $x=0$ אינו פנימי ולכן נבדק בנפרד.',
        },
      ]),
    ],
    hints: [
      H`מכפלה מתאפסת כשאחד הגורמים מתאפס. איזה גורם יכול להתאפס?`,
      H`האם $x=0$ נקודה פנימית של $[0,\infty)$?`,
    ],
    solvedNote: H`$x_n=\frac1n$ פנימית ו־$f_n$ גזירה בה, ולכן אם המקסימום שם, הנגזרת מתאפסת. אם המקסימום מתקבל בנקודה פנימית, היא $x_n=\frac1n$. הקצה $x=0$ והגבול באינסוף עדיין מועמדים, ונבדקים בשלב הבא. הנקודה $x_n$ זזה אל 0 כש־$n$ גדל.`,
    graph: E1_G5,
  },
  {
    id: 'E1-6',
    exampleId: 'E1',
    title: 'טבלת מועמדים',
    prompt: H`המקסימום נמצא באחד מהמועמדים: הקצה, הנקודה החשודה לקיצון הפנימית, או הגבול באינסוף. חשבו את הערך בכל אחד וסמנו את המועמד שנותן את המקסימום.`,
    parts: [
      tablePart('E1-6-table', [
        row('E1-6-table', 'end-left', 'f_n(0)=', ['zero', 'inv-e', 'n-over-e', 'e'], 'zero', {
          'inv-e': H`$f_n(0)=n\cdot0\cdot e^{0}=0$.`,
        }, false),
        row('E1-6-table', 'critical', H`f_n\!\left(\tfrac1n\right)=`, ['zero', 'inv-e', 'n-over-e', 'e'], 'inv-e', {
          'n-over-e': H`$n\cdot\frac1n=1$, ולכן ה־$n$ מצטמצם.`,
          e: H`$e^{-1}=\frac1e$ ולא $e$.`,
          zero: H`$f_n(\frac1n)=1\cdot e^{-1}>0$.`,
        }, true),
        row('E1-6-table', 'infinity', H`\lim\limits_{x\to\infty}f_n(x)=`, ['zero', 'inv-e', 'n-over-e', 'e'], 'zero', {
          'inv-e': H`כש־$x\to\infty$ המעריכית מכריעה והערך שואף ל־0.`,
        }, false),
      ], CAPTIONS, TABLE_WRONG_MAX),
    ],
    hints: [H`הציבו את המועמד ב־$f_n(x)=nxe^{-nx}$ וצמצמו.`],
    solvedNote: H`המקסימום קיים והוא אחד המועמדים, ולכן $M_n=f_n(\frac1n)=\frac1e$ לכל $n$. הקו המקווקו מראה את $M_n$: שינוי $n$ מזיז את הפסגה אבל לא משנה את גובהה.`,
    graph: E1_G6,
  },
  {
    id: 'E1-7',
    exampleId: 'E1',
    title: 'הגבול והמסקנה',
    prompt: H`השלימו את הגבול של $M_n$ והסיקו על ההתכנסות ב־$[0,\infty)$.`,
    parts: [
      slotsPart(template('E1-7-limit', [L(H`\lim\limits_{n\to\infty}M_n=`), S('v')], [
        slot('v', ['zero', 'inv-e', 'inf'], 'inv-e', {
          zero: H`$M_n=\frac1e$ לכל $n$ (לפי הטבלה), והפסגה אינה מתנוונת.`,
          inf: H`$M_n$ קבועה, ואינה שואפת ל־$\infty$.`,
        }),
      ])),
      notUniformChoice('E1-7-verdict', D1, H`\frac1e`),
    ],
    hints: [H`התבוננו בגרף של $M_n$ כפונקציה של $n$. האם הנקודות נכנסות לרצועה סביב 0?`],
    disclosure: {
      summary: 'הרהור: האם צריך את כל החישוב?',
      body: H`כדי להראות שההתכנסות אינה במידה שווה מספיק ערך אחד: $M_n\ge f_n(x_n)=\frac1e$, ולכן $M_n\not\to0$. אין צורך להראות ש־$x_n$ היא נקודת המקסימום. לעומת זאת, כדי להוכיח שההתכנסות כן במידה שווה, צריך חסם עליון על $f_n$ בכל הנקודות בבת אחת, וזה מה שהחישוב המלא נותן.`,
    },
    solvedNote: H`$M_n\equiv\frac1e\not\to0$, ולכן ההתכנסות ב־$[0,\infty)$ אינה במידה שווה. בגרף: לכל $\varepsilon<\frac1e$ אף נקודה של הגרף של $M_n$ אינה נכנסת לרצועה.`,
    graph: E1_G7,
  },
];

// ---------------------------------------------------------------------------------------------
// E1p: the same sequence on [1, infinity)
// ---------------------------------------------------------------------------------------------

const D1P = H`[1,\infty)`;
const P_G8 = graph({ limitLine: true, fadedOutsideDomain: true, maxMarker: 'critical' });
const P_G9 = graph({ limitLine: true, fadedOutsideDomain: true, maxMarker: 'argmax', signStrip: true, supLine: true });
const P_G10 = graph({ ...P_G9, mnGraph: true, epsilonControl: true });

const E1P_STEPS: Step[] = [
  {
    id: 'E1p-8',
    exampleId: 'E1p',
    title: 'איפה הנקודה החשודה לקיצון?',
    prompt: H`עכשיו התחום הוא $[1,\infty)$. הנגזרת $f_n'(x)=ne^{-nx}(1-nx)$ זהה, ולכן שוב $x_n=\frac1n$. בדקו אם היא נמצאת בתחום.`,
    parts: [
      slotsPart(template('E1p-8-compare', [L(H`\frac1n`), S('rel'), L(H`1\qquad(n\ge1)`)], [
        slot('rel', ['le', 'gt'], 'le', {
          gt: H`לכל $n\ge1$ מתקיים $n\ge1$, ולכן $\frac1n\le1$.`,
        }),
      ])),
      choicePart('E1p-8-location', H`מה מסיקים על $x_n=\frac1n$ ביחס לתחום $[1,\infty)$?`, [
        {
          id: 'outside',
          correct: true,
          label: H`לכל $n\ge2$ היא מחוץ לתחום ולכן אין נקודה חשודה לקיצון פנימית.`,
        },
        {
          id: 'inside',
          correct: false,
          label: H`היא בתוך התחום כשה־$n$ גדול, ולכן משפט פרמה נותן מועמד פנימי.`,
          diagnosis: H`$\frac1n$ קטן מ־1 כש־$n\ge2$, כלומר נמצא משמאל לתחום, ואינו נכנס אליו כש־$n$ גדל.`,
        },
        {
          id: 'no-max',
          correct: false,
          label: H`אין ל־$f_n$ מקסימום ב־$[1,\infty)$, כי אין נקודה חשודה לקיצון פנימית.`,
          diagnosis: 'המקסימום עדיין קיים, אך אינו בנקודה חשודה לקיצון פנימית. בשלב הבא נראה איפה הוא, ולמה הוא קיים.',
        },
      ]),
    ],
    hints: [H`השוו $\frac1n$ לקצה $1$ עבור $n=1,2,3$.`],
    solvedNote: H`רק ב־$n=1$ הנקודה $x_n$ בקצה $x=1$; בשאר המקרים משפט פרמה אינו נותן מועמד. הפסגה בגרף (המעומעמת) נמצאת מחוץ לתחום, והפונקציה מחוץ לתחום מוצגת רק כהקשר. לכן בודקים את סימן הנגזרת בכל התחום.`,
    graph: P_G8,
  },
  {
    id: 'E1p-9',
    exampleId: 'E1p',
    title: 'מונוטוניות ומיקום המקסימום',
    prompt: H`כשאין נקודה חשודה לקיצון פנימית, בודקים את סימן הנגזרת בכל התחום. מונוטוניות קובעת איפה המקסימום, ומראה גם שהוא קיים.`,
    parts: [
      slotsPart(template('E1p-9-sign', [L(H`x\ge1\ \Rightarrow\ 1-nx`), S('sign')], [
        slot('sign', ['le0', 'ge0'], 'le0', {
          ge0: H`$nx\ge n\ge1$ ולכן $1-nx\le0$.`,
        }),
      ])),
      choicePart('E1p-9-monotone', H`מכיוון ש־$f_n'(x)=ne^{-nx}(1-nx)\le0$ על $[1,\infty)$, מה נובע?`, [
        {
          id: 'decreasing',
          correct: true,
          label: H`$f_n$ יורדת ב־$[1,\infty)$, ולכן המקסימום בקצה השמאלי $x=1$.`,
        },
        {
          id: 'increasing',
          correct: false,
          label: H`$f_n$ עולה ב־$[1,\infty)$, כי בנגזרת הגורם $ne^{-nx}$ חיובי.`,
          diagnosis: H`הגורם $ne^{-nx}$ אכן חיובי, אבל $1-nx\le0$. נגזרת שאינה חיובית פירושה שהפונקציה אינה עולה, כלומר יורדת.`,
        },
        {
          id: 'peak',
          correct: false,
          label: H`המקסימום מתקבל ב־$x=\frac1n$, כי זו הנקודה שבה הנגזרת מתאפסת.`,
          diagnosis: H`$\frac1n$ אינה בתחום עבור $n\ge2$, ולכן אינה יכולה להיות מקסימום על התחום.`,
        },
      ]),
      tablePart('E1p-9-table', [
        row('E1p-9-table', 'end-left', 'f_n(1)=', ['n-e-neg-n', 'e-neg-n', 'inv-e', 'zero'], 'n-e-neg-n', {
          'e-neg-n': H`חסר הגורם $n$: $f_n(1)=n\cdot1\cdot e^{-n}$.`,
          'inv-e': H`$\frac1e=f_n(\frac1n)$, אבל $\frac1n$ אינה בתחום.`,
          zero: H`$f_n(1)=ne^{-n}>0$.`,
        }, true),
        row('E1p-9-table', 'infinity', H`\lim\limits_{x\to\infty}f_n(x)=`, ['n-e-neg-n', 'e-neg-n', 'inv-e', 'zero'], 'zero', {}, false),
      ], CAPTIONS, TABLE_WRONG_MAX),
    ],
    hints: [
      H`אם $f_n'\le0$ בקטע, הפונקציה לא עולה בו.`,
      H`הציבו $x=1$ ב־$nxe^{-nx}$.`,
    ],
    solvedNote: H`מכיוון ש־$f_n$ יורדת, $f_n(x)\le f_n(1)$ לכל $x\ge1$: המקסימום קיים ומתקבל ב־$x=1$. $M_n=f_n(1)=ne^{-n}$. סמן המקסימום קפץ לקצה $x=1$, והקו המקווקו יורד עם $n$.`,
    graph: P_G9,
  },
  {
    id: 'E1p-10',
    exampleId: 'E1p',
    title: 'הגבול והמסקנה',
    prompt: H`השלימו את הגבול של $M_n=ne^{-n}$ והסיקו על ההתכנסות ב־$[1,\infty)$.`,
    parts: [
      slotsPart(template('E1p-10-limit', [L(H`\lim\limits_{n\to\infty}M_n=\lim\limits_{n\to\infty}ne^{-n}=`), S('v')], [
        slot('v', ['zero', 'inv-e', 'inf'], 'zero', {
          'inv-e': H`$\frac1e$ הוא $M_1$ בלבד; עבור $n$ גדול $ne^{-n}$ קטן בהרבה.`,
          inf: H`$e^{-n}$ שואף לאפס מהר יותר מ־$n$ שגדל.`,
        }),
      ])),
      uniformChoice('E1p-10-verdict', D1P),
    ],
    hints: [H`$ne^{-n}=\frac{n}{e^n}$: מעריכית מול ליניארי.`],
    solvedNote: H`$M_n=ne^{-n}\to0$, ולכן ההתכנסות ב־$[1,\infty)$ במידה שווה, בניגוד ל־$[0,\infty)$. שינוי התחום העביר את המקסימום לקצה. בגרף, לכל $\varepsilon>0$ יש $N$ כך ש־$M_n<\varepsilon$ לכל $n>N$.`,
    graph: P_G10,
  },
];

// ---------------------------------------------------------------------------------------------
// E2: f_n(x) = n x^2 e^{-nx} on [0, infinity) (compressed)
// ---------------------------------------------------------------------------------------------

const E2_G1 = graph({ limitLine: true });
const E2_G2 = graph({ limitLine: true, maxMarker: 'origin' });
const E2_G3 = graph({ limitLine: true, maxMarker: 'origin', tangent: true, signStrip: true });
const E2_G4 = graph({ limitLine: true, maxMarker: 'critical', tangent: true, signStrip: true });
const E2_G5 = graph({ limitLine: true, maxMarker: 'argmax', tangent: true, signStrip: true, supLine: true });
const E2_G6 = graph({ ...E2_G5, mnGraph: true, epsilonControl: true });

const E2_STEPS: Step[] = [
  {
    id: 'E2-1',
    exampleId: 'E2',
    title: 'הגבול הנקודתי',
    prompt: H`אותה שיטה, סדרה חדשה: $f_n(x)=nx^2e^{-nx}$ ב־$[0,\infty)$. קבעו $x_0\ge0$ והשלימו את הגבול.`,
    parts: [
      slotsPart(template('E2-1-pointwise', [L(H`\lim\limits_{n\to\infty} n x_0^2 e^{-n x_0}=`), S('v')], [
        slot('v', ['zero', 'four-over-e2', 'x0-sq'], 'zero', {
          'four-over-e2': H`$\frac{4}{e^2}$ אינו הגבול בנקודה קבועה: עבור $x_0>0$ מתקיים $ne^{-nx_0}\to0$, וב־$x_0=0$ כל האיברים הם 0.`,
          'x0-sq': H`$x_0$ קבוע, ועבור $x_0>0$ מתקיים $ne^{-nx_0}\to0$, ולכן המכפלה שואפת ל־0.`,
        }),
      ])),
    ],
    hints: [H`עבור $x_0>0$: $ne^{-nx_0}\to0$, ו־$x_0^2$ קבוע.`],
    solvedNote: H`הגבול הנקודתי הוא $f=0$ ב־$[0,\infty)$, ו־$f_n\ge0$ שם, ולכן $M_n=\sup_{x\ge0}f_n(x)$.`,
    graph: E2_G1,
  },
  {
    id: 'E2-2',
    exampleId: 'E2',
    title: 'למה קיים מקסימום?',
    prompt: H`שוב תחום לא חסום, ולכן שוב צריך להצדיק שהמקסימום קיים. נמקו כמו ב־$nxe^{-nx}$.`,
    parts: [existenceChecklist('E2-2-exists')],
    hints: [H`הערכים בקצה 0 ובאינסוף הם 0, ו־$f_n>0$ בכל נקודה חיובית.`],
    solvedNote: H`הנימוקים זהים לדוגמה הקודמת, ולכן המקסימום קיים. $f_n(0)=0$ נכון, אך אינו נדרש להוכחת הקיום.`,
    graph: E2_G2,
  },
  {
    id: 'E2-3',
    exampleId: 'E2',
    title: 'הנגזרת',
    prompt: H`גזרו והוציאו גורם משותף. הפעם יש בפירוק גם הגורם $x$.`,
    parts: [
      slotsPart(template('E2-3-factor', [L(H`f_n'(x)=nxe^{-nx}\,(`), S('a'), L('-'), S('b'), L(H`x)`)], [
        slot('a', ['one', 'two', 'n', 'two-n'], 'two', {
          one: H`$(x^2)'=2x$ ולא $x$.`,
          n: H`הגורם $n$ כבר הוצא מחוץ לסוגריים.`,
          'two-n': H`הגורם $n$ כבר הוצא מחוץ לסוגריים; נשאר רק הקבוע $2$.`,
        }),
        slot('b', ['one', 'n', 'n2', 'two'], 'n', {
          n2: H`כבר הוצאתם $n$ מחוץ לסוגריים.`,
          one: H`הנגזרת של $e^{-nx}$ מוסיפה את הגורם $-n$.`,
          two: H`$2$ הוא המקדם של האיבר הראשון, ולא של $x$ בשני.`,
        }),
      ])),
    ],
    hints: [H`$(nx^2e^{-nx})'=2nxe^{-nx}-n^2x^2e^{-nx}$. הוציאו $nxe^{-nx}$.`],
    solvedNote: H`ב־$x>0$ הסימן של $f_n'$ הוא סימן הגורם $2-nx$.`,
    graph: E2_G3,
  },
  {
    id: 'E2-4',
    exampleId: 'E2',
    title: 'נקודות חשודות ומשפט פרמה',
    prompt: H`מצאו את כל האפסים של $f_n'$ ב־$[0,\infty)$, והחליטו מה מעמדו של כל אחד.`,
    parts: [
      slotsPart(template('E2-4-zeros', [L(H`f_n'(x)=0\iff x\in\{`), S('r0'), L(H`,\ `), S('r1'), L(H`\}`)], [
        slot('r0', ['zero', 'inv-n', 'two-over-n'], 'zero', {
          'inv-n': H`זה האפס מהדוגמה הקודמת; כאן הגורם $x$ נותן אפס ב־0.`,
          'two-over-n': H`האפס $\frac2n$ כבר נכתב במשבצת השנייה. חפשו את האפס השני.`,
        }),
        slot('r1', ['zero', 'inv-n', 'two-over-n', 'n-over-2', 'two'], 'two-over-n', {
          zero: H`האפס $0$ כבר נכתב. חפשו את האפס השני.`,
          'inv-n': H`$\frac1n$ שייך ל־$nxe^{-nx}$. כאן $2-nx=0$ נותן $x=\frac2n$.`,
          'n-over-2': H`$2-nx=0$ נותן $x=\frac2n$ ולא $\frac n2$.`,
          two: H`$2-nx=0$ נותן $x=\frac2n$; ב־$x=2$ הגורם $2-nx$ מתאפס רק עבור $n=1$, ובאופן כללי אינו מתאפס.`,
        }),
      ], [['r0', 'r1']])),
      choicePart('E2-4-endpoint', 'מה מעמדו של האפס $x=0$?', [
        {
          id: 'endpoint-candidate',
          correct: true,
          label: H`$x=0$ הוא קצה ולא נקודה פנימית, ולכן משפט פרמה אינו חל עליו.`,
        },
        {
          id: 'interior',
          correct: false,
          label: H`$x=0$ נקודה פנימית, ולכן לפי משפט פרמה המקסימום מתקבל בה.`,
          diagnosis: H`$0$ הוא הקצה השמאלי של $[0,\infty)$, אינו פנימי, והמשפט אינו חל עליו.`,
        },
        {
          id: 'drop',
          correct: false,
          label: H`אפשר להתעלם מ־$x=0$, כי הנגזרת מתאפסת בו ולכן הוא אינו מועמד.`,
          diagnosis: 'קצה תמיד נבדק כמועמד. התאפסות הנגזרת אינה פוסלת אותו ואינה קובעת שהוא מקסימום.',
        },
      ]),
    ],
    hints: [
      H`שני הגורמים $x$ ו־$2-nx$ יכולים להתאפס.`,
      H`נקודה פנימית של $[0,\infty)$ היא $x>0$.`,
    ],
    solvedNote: H`אם המקסימום מתקבל בנקודה פנימית, היא $x_n=\frac2n$. הקצה $0$ נשאר מועמד ונבדק ישירות, יחד עם הגבול באינסוף, בטבלה.`,
    graph: E2_G4,
  },
  {
    id: 'E2-5',
    exampleId: 'E2',
    title: 'טבלת מועמדים',
    prompt: H`חשבו את הערכים בשלושת המועמדים וסמנו את המקסימום.`,
    parts: [
      tablePart('E2-5-table', [
        row('E2-5-table', 'end-left', 'f_n(0)=', ['zero', 'four-over-n-e2', 'four-over-e2', 'two-over-n-e'], 'zero', {}, false),
        row('E2-5-table', 'critical', H`f_n\!\left(\tfrac2n\right)=`, ['zero', 'four-over-n-e2', 'four-over-e2', 'two-over-n-e'], 'four-over-n-e2', {
          'four-over-e2': H`$n\cdot\frac{4}{n^2}=\frac4n$, ולכן נשאר $n$ במכנה.`,
          'two-over-n-e': H`$(\frac2n)^2=\frac{4}{n^2}$ והמעריך הוא $-n\cdot\frac2n=-2$, כלומר $e^{-2}$.`,
          zero: H`$f_n(\frac2n)>0$.`,
        }, true),
        row('E2-5-table', 'infinity', H`\lim\limits_{x\to\infty}f_n(x)=`, ['zero', 'four-over-n-e2', 'four-over-e2', 'two-over-n-e'], 'zero', {}, false),
      ], CAPTIONS, TABLE_WRONG_MAX),
    ],
    hints: [H`$f_n(\frac2n)=n\cdot\frac{4}{n^2}\cdot e^{-2}$.`],
    solvedNote: H`$M_n=f_n(\frac2n)=\frac{4}{ne^2}$. הפעם הגובה תלוי ב־$n$.`,
    graph: E2_G5,
  },
  {
    id: 'E2-6',
    exampleId: 'E2',
    title: 'הגבול והמסקנה',
    prompt: H`השלימו את הגבול של $M_n$ והסיקו על ההתכנסות ב־$[0,\infty)$.`,
    parts: [
      slotsPart(template('E2-6-limit', [L(H`\lim\limits_{n\to\infty}M_n=`), S('v')], [
        slot('v', ['zero', 'four-over-e2', 'inf'], 'zero', {
          'four-over-e2': H`$M_n=\frac{4}{ne^2}$ ויש בו את המכנה $n$.`,
          inf: H`$M_n=\frac{4}{ne^2}$ קטן כש־$n$ גדל.`,
        }),
      ])),
      uniformChoice('E2-6-verdict', D1),
    ],
    hints: [H`מה קורה ל־$\frac{4}{ne^2}$ כש־$n\to\infty$?`],
    solvedNote: H`$M_n\to0$, ולכן ב־$nx^2e^{-nx}$ ההתכנסות ב־$[0,\infty)$ במידה שווה, בניגוד ל־$nxe^{-nx}$.`,
    graph: E2_G6,
  },
  {
    id: 'E2-7',
    exampleId: 'E2',
    title: 'הרהור: מה הבדיל?',
    prompt: H`בשתי הסדרות $nxe^{-nx}$ ו־$nx^2e^{-nx}$ הפסגה נעה אל 0. מדוע ההתכנסות במידה שווה רק באחת?`,
    parts: [
      choicePart('E2-7-reflection', 'מהו ההסבר הנכון?', [
        {
          id: 'height',
          correct: true,
          label: H`גובה הפסגה $M_n$: קבוע בראשונה ושואף ל־0 בשנייה.`,
        },
        {
          id: 'speed',
          correct: false,
          label: 'בשנייה הפסגה נעה לאפס מהר יותר, ולכן ההתכנסות במידה שווה.',
          diagnosis: H`שתי הפסגות נעות לאפס בקצב של סדר $\frac1n$. ההבדל הוא בגובה.`,
        },
        {
          id: 'two-zeros',
          correct: false,
          label: H`בשנייה יש שתי נקודות שבהן $f_n'=0$, ולכן יש בה יותר מועמדים.`,
          diagnosis: H`מספר האפסים של הנגזרת אינו משנה: $x=0$ הוא קצה ואינו נקודה פנימית. מה שקובע הוא $M_n$.`,
        },
      ]),
    ],
    hints: [H`השוו את $\lim M_n$ בשתי הדוגמאות.`],
    solvedNote: H`הגובה הוא $\frac1e$ בראשונה ו־$\frac{4}{ne^2}$ בשנייה. הערך של $M_n$ קובע, לא עצם התנועה של הפסגה: כדי להכריע יש לחשב את $M_n$ ולבדוק אם הוא שואף ל־0.`,
    graph: E2_G6,
  },
];

// ---------------------------------------------------------------------------------------------
// E3: f_n(x) = x^n (1 - x^n) on [0, 1], then on [0, 1/2]
// ---------------------------------------------------------------------------------------------

const D3 = H`[0,1]`;
const D3P = H`\left[0,\tfrac12\right]`;

const E3_G1 = graph({ limitLine: true });
const E3_G3 = graph({ limitLine: true });
const E3_G4 = graph({ limitLine: true, tangent: true, signStrip: true });
const E3_G5 = graph({ limitLine: true, tangent: true, signStrip: true, maxMarker: 'critical' });
const E3_G6 = graph({ ...E3_G5, maxMarker: 'argmax', supLine: true });
const E3_G7 = graph({ ...E3_G6, mnGraph: true, epsilonControl: true });

const E3_STEPS: Step[] = [
  {
    id: 'E3-1',
    exampleId: 'E3',
    title: 'הגבול הנקודתי',
    prompt: H`הסדרה $f_n(x)=x^n(1-x^n)$ ב־$[0,1]$. בדקו את הגבול בנקודה קבועה $0\le x_0<1$ ובנקודה $x=1$.`,
    parts: [
      slotsPart(template('E3-1-pointwise', [L(H`0\le x_0<1:\quad\lim\limits_{n\to\infty}x_0^n(1-x_0^n)=`), S('v')], [
        slot('v', ['zero', 'one', 'quarter'], 'zero', {
          one: H`עבור $0\le x_0<1$ מתקיים $x_0^n\to0$, ולכן $x_0^n(1-x_0^n)\to0\cdot1=0$.`,
          quarter: H`$\frac14$ הוא גובה הפסגה, אבל הפסגה זזה. $x_0$ קבוע ו־$x_0^n\to0$.`,
        }),
      ])),
      slotsPart(template('E3-1-endpoint', [L(H`f_n(1)=`), S('v')], [
        slot('v', ['zero', 'one', 'quarter'], 'zero', {
          one: H`ב־$x^n$ הגבול ב־1 הוא 1, אבל כאן $f_n(1)=1\cdot(1-1)=0$.`,
          quarter: H`$f_n(1)=1^n(1-1^n)=0$.`,
        }),
      ])),
    ],
    hints: [H`עבור $0\le x_0<1$ מתקיים $x_0^n\to0$.`, H`הציבו $x=1$: $1^n(1-1^n)$.`],
    solvedNote: H`הגבול הנקודתי הוא $f=0$ בכל $[0,1]$ (בניגוד ל־$x^n$, שבו הגבול ב־1 הוא 1).`,
    graph: E3_G1,
  },
  {
    id: 'E3-3',
    exampleId: 'E3',
    title: 'למה קיים מקסימום?',
    prompt: H`ב־$[0,1]$ מתקיים $x^n\le1$, ולכן $f_n\ge0$ ו־$M_n=\sup f_n$. לפני שמחפשים מקסימום, צריך להצדיק שהוא קיים.`,
    parts: [
      choicePart('E3-3-exists', H`מדוע ל־$f_n$ יש מקסימום ב־$[0,1]$?`, [
        {
          id: 'weierstrass',
          correct: true,
          label: H`כי $f_n$ רציפה על קטע סגור וחסום (משפט ויירשטראס).`,
        },
        {
          id: 'zero-ends',
          correct: false,
          label: H`כי $f_n(0)=f_n(1)=0$, ולכן מובטח שקיים ערך מקסימלי.`,
          diagnosis: 'ערכי הקצוות אינם מבטיחים שקיים מקסימום. מה שמבטיח אותו הוא הרציפות על קטע סגור וחסום.',
        },
        {
          id: 'bounded',
          correct: false,
          label: H`כי $f_n$ חסומה בקטע, ולכן היא מקבלת ערך מקסימלי.`,
          diagnosis: 'חסימות מבטיחה סופרמום סופי, לא מקסימום. מה שמבטיח מקסימום הוא הרציפות על קטע סגור וחסום.',
        },
      ]),
    ],
    hints: [H`כאן הקטע חסום. מה זה משנה, בהשוואה ל־$[0,\infty)$?`],
    disclosure: {
      summary: 'ההבדל מהדוגמאות הקודמות',
      body: H`ב־$[0,\infty)$ הקטע אינו חסום, ולכן היה צריך הוכחה נפרדת שהמקסימום קיים. כאן משפט ויירשטראס חל ישירות.`,
    },
    solvedNote: H`המקסימום קיים. כדי למצוא אותו נבדוק את כל המועמדים: שני הקצוות, והנקודות הפנימיות שבהן $f_n'=0$.`,
    graph: E3_G3,
  },
  {
    id: 'E3-4',
    exampleId: 'E3',
    title: 'הנגזרת',
    prompt: H`$f_n$ גזירה בכל נקודה של $(0,1)$. גזרו והוציאו גורם משותף; במשבצת יש להשלים ביטוי שלם.`,
    parts: [
      slotsPart(template('E3-4-derivative', [L(H`f_n'(x)=nx^{n-1}(1-`), S('c'), L(H`)`)], [
        slot('c', ['two-x-n', 'x-n', 'two-x-2n', 'two-n-x-n'], 'two-x-n', {
          'x-n': H`$(x^{2n})'=2nx^{2n-1}$: המקדם 2 מגיע מהחזקה $2n$.`,
          'two-x-2n': H`$\frac{x^{2n-1}}{x^{n-1}}=x^n$ ולא $x^{2n}$.`,
          'two-n-x-n': H`הגורם $n$ כבר הוצא מחוץ לסוגריים.`,
        }),
      ])),
    ],
    hints: [H`$f_n(x)=x^n-x^{2n}$, ולכן $f_n'(x)=nx^{n-1}-2nx^{2n-1}$.`],
    solvedNote: H`הסימן של $f_n'$ הוא סימן הגורם $1-2x^n$.`,
    graph: E3_G4,
  },
  {
    id: 'E3-5',
    exampleId: 'E3',
    title: 'נקודות חשודות ומשפט פרמה',
    prompt: H`מצאו את האפסים של $f_n'$ בתחום (עבור $n\ge2$), והחליטו אילו נקודות הן מועמדות למקסימום.`,
    parts: [
      slotsPart(template('E3-5-zeros', [L(H`f_n'(x)=0\iff x\in\{`), S('r0'), L(H`,\ `), S('r1'), L(H`\}`)], [
        slot('r0', ['zero', 'half', 'root-two'], 'zero', {
          half: H`$\frac12$ אינו אפס של $f_n'$ (מלבד המקרה $n=1$).`,
          'root-two': H`האפס $2^{-1/n}$ כבר נכתב במשבצת השנייה. חפשו את האפס השני.`,
        }),
        slot('r1', ['zero', 'root-two', 'two-neg-n', 'half', 'two-inv-n'], 'root-two', {
          zero: H`האפס $0$ כבר נכתב. חפשו את האפס השני.`,
          'two-neg-n': H`זה $(\frac12)^n$ ולא השורש מסדר $n$ של $\frac12$. $x^n=\frac12$ נותן $x=2^{-1/n}$.`,
          half: H`$x^n=\frac12$ נותן $x=2^{-1/n}$; $\frac12$ מתאים רק ל־$n=1$.`,
          'two-inv-n': H`$2^{1/n}>1$ מחוץ לתחום. $x^n=\frac12$ נותן $x=2^{-1/n}$.`,
        }),
      ], [['r0', 'r1']])),
      choicePart('E3-5-candidates', 'אילו נקודות צריך לבדוק כמועמדות למקסימום?', [
        {
          id: 'ends-and-interior',
          correct: true,
          label: H`שני הקצוות $x=0$ ו־$x=1$, והנקודה הפנימית $2^{-1/n}$ שבה $f_n'=0$.`,
        },
        {
          id: 'interior-only',
          correct: false,
          label: H`רק הנקודה $2^{-1/n}$, כי מקסימום חייב להיות באפס של הנגזרת.`,
          diagnosis: 'מקסימום יכול להיות גם בקצה, ומשפט פרמה חל רק בנקודות פנימיות. לכן מוסיפים את הקצוות לרשימה.',
        },
        {
          id: 'ends-only',
          correct: false,
          label: H`רק הקצוות $x=0$ ו־$x=1$, כי הפונקציה מתאפסת בהם.`,
          diagnosis: 'הערך 0 בקצוות אינו אומר שהם מקסימום: יש נקודה פנימית שבה הפונקציה חיובית, ולכן המקסימום אינו בקצה. את הנקודה הפנימית צריך לבדוק.',
        },
      ]),
    ],
    hints: [H`$1-2x^n=0$ נותן $x^n=\frac12$.`, H`האם $0$ ו־$1$ נקודות פנימיות של $[0,1]$?`],
    disclosure: {
      summary: 'הערה על המקרה הקטן ביותר של האינדקס',
      body: H`עבור $n=1$ הנגזרת היא $1-2x$ ואינה מתאפסת ב־$0$. אבל $0$ הוא קצה ונשאר מועמד בטבלה בכל מקרה.`,
    },
    solvedNote: H`הנקודה החשודה לקיצון $x_n=2^{-1/n}$ היא נקודה פנימית של $[0,1]$, והיא מתקרבת לקצה $1$ כש־$n\to\infty$.`,
    graph: E3_G5,
  },
  {
    id: 'E3-6',
    exampleId: 'E3',
    title: 'טבלת מועמדים',
    prompt: H`חשבו את הערך בכל מועמד וסמנו את המקסימום.`,
    parts: [
      tablePart('E3-6-table', [
        row('E3-6-table', 'end-left', 'f_n(0)=', ['zero', 'quarter', 'half', 'two-neg-n'], 'zero', {}, false),
        row('E3-6-table', 'end-right', 'f_n(1)=', ['zero', 'quarter', 'half', 'two-neg-n'], 'zero', {
          quarter: H`$f_n(1)=1\cdot(1-1)=0$.`,
        }, false),
        row('E3-6-table', 'critical', H`f_n\!\left(2^{-1/n}\right)=`, ['zero', 'quarter', 'half', 'two-neg-n'], 'quarter', {
          half: H`$x_n^n=\frac12$, ולכן $f_n(x_n)=\frac12\left(1-\frac12\right)=\frac14$ ולא $\frac12$.`,
          'two-neg-n': H`$(2^{-1/n})^n=\frac12$ ולא $2^{-n}$.`,
          zero: H`$f_n(x_n)=\frac12\cdot\frac12>0$.`,
        }, true),
      ], CAPTIONS, TABLE_WRONG_MAX),
    ],
    hints: [H`$(2^{-1/n})^n=\frac12$.`],
    disclosure: {
      summary: 'קיצור: הצבה במקום נגזרת',
      body: H`בהצבה $t=x^n\in[0,1]$ מתקבל $f_n=t(1-t)\le\frac14$, עם שוויון ב־$t=\frac12$, כלומר ב־$x=2^{-1/n}$. זו אותה תוצאה בלי נגזרת.`,
    },
    solvedNote: H`$M_n=f_n(2^{-1/n})=\frac14$ לכל $n$.`,
    graph: E3_G6,
  },
  {
    id: 'E3-7',
    exampleId: 'E3',
    title: 'הגבול והמסקנה',
    prompt: H`השלימו את הגבול של $M_n$ והסיקו על ההתכנסות ב־$[0,1]$.`,
    parts: [
      slotsPart(template('E3-7-limit', [L(H`\lim\limits_{n\to\infty}M_n=`), S('v')], [
        slot('v', ['zero', 'quarter', 'half'], 'quarter', {
          zero: H`$M_n=\frac14$ לכל $n$ (לפי הטבלה).`,
          half: H`$M_n=\frac12\cdot\frac12=\frac14$.`,
        }),
      ])),
      notUniformChoice('E3-7-verdict', D3, H`\frac14`),
    ],
    hints: [H`האם הנקודות של $M_n$ נכנסות לרצועה $M_n<\varepsilon$ כאשר $\varepsilon<\frac14$?`],
    disclosure: {
      summary: 'הרהור: האם צריך את כל החישוב?',
      body: H`כדי להראות שההתכנסות אינה במידה שווה מספיק למצוא נקודות $x_n$ ו־$c>0$ כך ש־$f_n(x_n)\ge c$ לכל $n$ (כאן $x_n=2^{-1/n}$ ו־$c=\frac14$). אז $M_n\ge c$, ולכן $M_n\not\to0$. לעומת זאת, להוכחת התכנסות במידה שווה צריך חסם עליון על $f_n$ בכל התחום.`,
    },
    solvedNote: H`$M_n\equiv\frac14\not\to0$, ולכן ההתכנסות ב־$[0,1]$ אינה במידה שווה.`,
    graph: E3_G7,
  },
];

const P3_G8 = graph({ limitLine: true, fadedOutsideDomain: true, maxMarker: 'critical' });
const P3_G9 = graph({ limitLine: true, fadedOutsideDomain: true, signStrip: true, maxMarker: 'argmax', supLine: true });
const P3_G10 = graph({ ...P3_G9, mnGraph: true, epsilonControl: true });

const E3P_STEPS: Step[] = [
  {
    id: 'E3p-8',
    exampleId: 'E3p',
    title: 'איפה הנקודה החשודה לקיצון?',
    prompt: H`עכשיו התחום הוא $\left[0,\frac12\right]$. הנגזרת זהה, ולכן שוב $x_n=2^{-1/n}$. בדקו אם היא בתחום.`,
    parts: [
      slotsPart(template('E3p-8-compare', [L(H`2^{-1/n}`), S('rel'), L(H`\frac12\qquad(n\ge1)`)], [
        slot('rel', ['ge', 'lt'], 'ge', {
          lt: H`$-\frac1n\ge-1$, ולכן $2^{-1/n}\ge2^{-1}=\frac12$.`,
        }),
      ])),
      choicePart('E3p-8-location', H`מה מסיקים על $x_n=2^{-1/n}$ ביחס לתחום $\left[0,\frac12\right]$?`, [
        {
          id: 'outside',
          correct: true,
          label: H`לכל $n\ge2$ היא מחוץ לתחום, ולכן אין נקודה חשודה לקיצון פנימית.`,
        },
        {
          id: 'inside',
          correct: false,
          label: H`היא בתוך התחום לכל $n$, ולכן היא מועמדת למקסימום לפי משפט פרמה.`,
          diagnosis: H`$2^{-1/n}>\frac12$ כש־$n\ge2$, כלומר מימין לקצה $\frac12$.`,
        },
        {
          id: 'only-zero',
          correct: false,
          label: H`המועמד היחיד הוא $x=0$, כי אין נקודה חשודה לקיצון פנימית.`,
          diagnosis: H`גם הקצה הימני $x=\frac12$ הוא מועמד, ונבדק ישירות.`,
        },
      ]),
    ],
    hints: [H`$\frac1n\le1$ ולכן $2^{-1/n}$ לא קטן מ־$2^{-1}$.`],
    solvedNote: H`רק ב־$n=1$ הנקודה $x_n$ בקצה $\frac12$; בשאר המקרים משפט פרמה אינו נותן מועמד. הפסגה נמצאת מחוץ לתחום (מעומעמת בגרף), ולכן בודקים את סימן הנגזרת בכל התחום.`,
    graph: P3_G8,
  },
  {
    id: 'E3p-9',
    exampleId: 'E3p',
    title: 'מונוטוניות ומיקום המקסימום',
    prompt: H`בודקים את הסימן של $f_n'(x)=nx^{n-1}(1-2x^n)$ על $\left[0,\frac12\right]$.`,
    parts: [
      slotsPart(template('E3p-9-sign', [L(H`0\le x\le\tfrac12\ \Rightarrow\ 1-2x^n`), S('sign')], [
        slot('sign', ['ge0', 'le0'], 'ge0', {
          le0: H`$2x^n\le2\cdot2^{-n}=2^{1-n}\le1$, ולכן $1-2x^n\ge0$.`,
        }),
      ])),
      choicePart('E3p-9-monotone', H`מכיוון ש־$f_n'\ge0$ על $\left[0,\frac12\right]$, מה נובע?`, [
        {
          id: 'increasing',
          correct: true,
          label: H`$f_n$ עולה ב־$\left[0,\frac12\right]$, ולכן המקסימום מתקבל בקצה הימני $x=\frac12$.`,
        },
        {
          id: 'decreasing',
          correct: false,
          label: H`$f_n$ יורדת ב־$\left[0,\frac12\right]$, ולכן המקסימום מתקבל בקצה השמאלי $x=0$.`,
          diagnosis: 'נגזרת אי־שלילית פירושה שהפונקציה אינה יורדת, כלומר עולה.',
        },
        {
          id: 'peak',
          correct: false,
          label: H`המקסימום ב־$x=2^{-1/n}$, כי שם הנגזרת מתאפסת.`,
          diagnosis: H`$2^{-1/n}\ge\frac12$, כלומר מחוץ לתחום (או בקצה כש־$n=1$).`,
        },
      ]),
      tablePart('E3p-9-table', [
        row('E3p-9-table', 'end-left', 'f_n(0)=', ['zero', 'sup-e3p', 'quarter', 'two-neg-n', 'half'], 'zero', {}, false),
        row('E3p-9-table', 'end-right', H`f_n\!\left(\tfrac12\right)=`, ['zero', 'sup-e3p', 'quarter', 'two-neg-n', 'half'], 'sup-e3p', {
          quarter: H`$\frac14$ הוא הערך ב־$2^{-1/n}$, מחוץ לתחום. כאן $f_n(\frac12)=2^{-n}(1-2^{-n})$.`,
          'two-neg-n': H`חסר הגורם $(1-2^{-n})$.`,
          half: H`$f_n(\frac12)=(\frac12)^n(1-(\frac12)^n)$.`,
        }, true),
      ], CAPTIONS, TABLE_WRONG_MAX),
    ],
    hints: [H`הציבו $x=\frac12$ ב־$x^n(1-x^n)$.`],
    solvedNote: H`מכיוון ש־$f_n$ עולה, $f_n(x)\le f_n(\frac12)$ לכל $x$ בקטע: המקסימום קיים ומתקבל ב־$x=\frac12$. $M_n=f_n(\tfrac12)=2^{-n}(1-2^{-n})$. הסמן קפץ לקצה הימני.`,
    graph: P3_G9,
  },
  {
    id: 'E3p-10',
    exampleId: 'E3p',
    title: 'הגבול והמסקנה',
    prompt: H`השלימו את הגבול של $M_n$ והסיקו על ההתכנסות ב־$\left[0,\frac12\right]$.`,
    parts: [
      slotsPart(template('E3p-10-limit', [L(H`\lim\limits_{n\to\infty}M_n=`), S('v')], [
        slot('v', ['zero', 'quarter', 'half'], 'zero', {
          quarter: H`$\frac14$ הוא $M_1$ בלבד. כאן $M_n\le2^{-n}\to0$.`,
          half: H`$\frac12$ הוא הקצה, לא הגבול.`,
        }),
      ])),
      uniformChoice('E3p-10-verdict', D3P),
    ],
    hints: [H`$M_n\le2^{-n}\to0$.`],
    solvedNote: H`$M_n\le2^{-n}\to0$, ולכן ההתכנסות ב־$\left[0,\frac12\right]$ במידה שווה, בניגוד ל־$[0,1]$. שינוי התחום העביר את המקסימום לקצה.`,
    graph: P3_G10,
  },
];

export const SUP_STEPS: Record<SupExampleId, Step[]> = {
  E1: E1_STEPS,
  E1p: E1P_STEPS,
  E2: E2_STEPS,
  E3: E3_STEPS,
  E3p: E3P_STEPS,
};

/** The graph state to draw at step `index`: the solved state of the step, or the state left by the
 * previous step (for the first step: nothing but the static faded-context flag). */
export function graphFlagsFor(steps: Step[], index: number, solved: boolean): GraphFlags {
  if (solved) return steps[index].graph;
  if (index > 0) return steps[index - 1].graph;
  return { ...BASE_GRAPH, fadedOutsideDomain: steps[0].graph.fadedOutsideDomain };
}

// ---------------------------------------------------------------------------------------------
// Checkers
// ---------------------------------------------------------------------------------------------

const MSG_FILL_ALL = 'השלימו את כל המשבצות.';

export function checkSlots(t: SlotTemplateSpec, filling: SlotFilling | undefined): CheckResult {
  const f = filling ?? {};
  if (t.slots.some((s) => !f[s.id])) return { status: 'incomplete', message: MSG_FILL_ALL };
  const groups = t.unordered ?? [];
  for (const s of t.slots) {
    const chosen = f[s.id]!;
    const group = groups.find((g) => g.includes(s.id));
    // In an unordered group a token may be accepted by any slot of the group.
    const allowed = group ? t.slots.filter((o) => group.includes(o.id)).flatMap((o) => o.accepted) : s.accepted;
    if (!allowed.includes(chosen)) {
      return { status: 'wrong', slotId: s.id, message: s.diagnoses?.[chosen] ?? SLOT_GENERIC };
    }
  }
  // Within a group every token may appear once only.
  for (const group of groups) {
    const first = new Map<string, string>();
    for (const id of group) {
      const chosen = f[id]!;
      const other = first.get(chosen);
      if (other !== undefined) {
        // Point at the slot whose chip is not its own accepted token (else at the later one).
        const earlier = t.slots.find((o) => o.id === other)!;
        const blame = earlier.accepted.includes(chosen) ? t.slots.find((o) => o.id === id)! : earlier;
        return { status: 'wrong', slotId: blame.id, message: blame.diagnoses?.[chosen] ?? SLOT_GENERIC };
      }
      first.set(chosen, id);
    }
  }
  return { status: 'correct' };
}

export function checkCandidateTable(table: CandidateTableSpec, filling: CandidateFilling | undefined): CheckResult {
  const f = filling ?? { rows: {} };
  for (const r of table.rows) {
    const rowFilling = f.rows[r.id] ?? {};
    if (r.template.slots.some((s) => !rowFilling[s.id])) {
      return { status: 'incomplete', message: 'חשבו את הערך בכל אחד מהמועמדים.'};
    }
  }
  for (const r of table.rows) {
    const res = checkSlots(r.template, f.rows[r.id]);
    if (res.status === 'wrong') return { ...res, rowId: r.id };
  }
  if (!f.maximumRowId) return { status: 'incomplete', message: 'סמנו איזה מועמד נותן את המקסימום.' };
  const chosen = table.rows.find((r) => r.id === f.maximumRowId);
  if (!chosen || !chosen.isMaximum) {
    return { status: 'wrong', rowId: f.maximumRowId, message: table.wrongMaximumMessage ?? 'זה אינו המועמד שנותן את המקסימום.' };
  }
  return { status: 'correct' };
}

export function checkChecklist(spec: ChecklistSpec, selected: string[] | undefined): CheckResult {
  const chosen = new Set(selected ?? []);
  if (chosen.size === 0) return { status: 'incomplete', message: 'סמנו את הנימוקים הנכונים.' };
  for (const item of spec.items) {
    if (chosen.has(item.id) && !item.required && !item.optional) {
      return { status: 'wrong', itemId: item.id, message: item.diagnosis ?? 'אחד מהנימוקים שסימנתם אינו נכון.' };
    }
  }
  for (const item of spec.items) {
    if (item.required && !chosen.has(item.id)) {
      return { status: 'wrong', itemId: item.id, message: item.diagnosis ?? 'חסר נימוק נדרש.' };
    }
  }
  return { status: 'correct' };
}

export function checkChoice(spec: ChoiceSpec, optionId: string | undefined): CheckResult {
  if (!optionId) return { status: 'incomplete', message: 'בחרו תשובה.' };
  const option = spec.options.find((o) => o.id === optionId);
  if (!option) return { status: 'wrong', message: 'הבחירה אינה מוכרת.' };
  if (option.correct) return { status: 'correct' };
  return { status: 'wrong', itemId: option.id, message: option.diagnosis ?? 'זו אינה התשובה הנכונה.' };
}

export function checkPart(part: StepPart, answer: PartAnswer): CheckResult {
  switch (part.kind) {
    case 'slots':
      return checkSlots(part.template, answer as SlotFilling | undefined);
    case 'table':
      return checkCandidateTable(part.table, answer as CandidateFilling | undefined);
    case 'checklist':
      return checkChecklist(part.checklist, answer as string[] | undefined);
    case 'choice':
      return checkChoice(part.choice, answer as string | undefined);
  }
}

/** Checks every part and reports the first one that is not correct (in part order). */
export function checkStep(step: Step, answers: StepAnswers | undefined): StepCheckResult {
  for (const part of step.parts) {
    const res = checkPart(part, answers?.[part.id]);
    if (res.status !== 'correct') return { ...res, partId: part.id };
  }
  return { status: 'correct' };
}

/** The reveal answers of a step ("הצג תשובה לשלב"), in the same shape `checkStep` accepts. */
export function revealAnswers(step: Step): StepAnswers {
  return Object.fromEntries(step.parts.map((p) => [p.id, p.reveal]));
}
