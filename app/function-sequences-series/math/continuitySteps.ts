/**
 * Step data of the "continuity of the limit" activity: three guided examples of the theorem
 * "a uniform limit of continuous functions is continuous". Pure TypeScript, no React; the checkers
 * are the shared engine in guidedSteps.ts.
 *
 * DRAFT: the step outline, Hebrew copy and options here are a first scaffold, to be rewritten
 * example by example with the course owner. All student-facing copy of the activity's steps is in
 * this file.
 */
import type { ContExampleId, ContGraphFlags } from './continuityExamples';
import {
  L,
  S,
  choicePart,
  slot,
  slotsPart,
  template,
  type GuidedStep,
} from './guidedSteps';
import type { TokenId, TokenLabel } from './supremumTypes';

const H = String.raw;

/** A step of the continuity activity: the shared guided step with this activity's graph state. */
export type ContStep = GuidedStep<ContExampleId, ContGraphFlags>;

const TOKEN_LATEX: Record<TokenId, string> = {
  zero: '0',
  half: '\\tfrac12',
  one: '1',
  inf: '\\infty',
  'n-plus-1': 'n+1',
  'n-plus-1-sq': '(n+1)^2',
  'inv-x': '\\tfrac1x',
  x: 'x',
  'inv-n': '\\tfrac1n',
};

export const CONT_TOKENS: Record<TokenId, TokenLabel> = Object.fromEntries(
  Object.entries(TOKEN_LATEX).map(([id, latex]) => [id, { latex }]),
) as Record<TokenId, TokenLabel>;

const graph = (flags: Partial<ContGraphFlags>): ContGraphFlags => ({ limit: false, band: false, jumps: false, ...flags });

/** The theorem every example tests, as the intro states it. */
export const CONTINUITY_THEOREM = H`תהי $\{f_n\}$ סדרת פונקציות רציפות בקטע $I$, המתכנסת במידה שווה ב־$I$ לפונקציה $f$. אז $f$ רציפה ב־$I$.`;

// ---------------------------------------------------------------------------------------------
// C1: x^n / (1 + x^{2n}) on [0,2]
// ---------------------------------------------------------------------------------------------

const C1_STEPS: ContStep[] = [
  {
    id: 'C1-1',
    exampleId: 'C1',
    title: 'הגבול הנקודתי',
    prompt: H`חשבו את הגבול של $f_n(x)$ כאשר $n\to\infty$, בכל אחד משלושת החלקים של הקטע.`,
    parts: [
      slotsPart(template('C1-1-below', [L(H`0\le x<1:\quad \lim_{n\to\infty}f_n(x)=`), S('v')], [
        slot('v', ['zero', 'half', 'one', 'inf'], 'zero', {
          half: H`$\tfrac12$ הוא הערך בנקודה $x=1$ בלבד.`,
          one: H`כאשר $0\le x<1$ מתקיים $x^n\to0$.`,
          inf: H`המונה שואף ל־$0$ והמכנה ל־$1$.`,
        }),
      ])),
      slotsPart(template('C1-1-at-one', [L(H`x=1:\quad \lim_{n\to\infty}f_n(1)=`), S('v')], [
        slot('v', ['zero', 'half', 'one', 'inf'], 'half', {
          zero: H`הציבו $x=1$: $f_n(1)=\frac{1}{1+1}$ לכל $n$.`,
          one: H`הציבו $x=1$: $f_n(1)=\frac{1}{1+1}$ לכל $n$.`,
        }),
      ])),
      slotsPart(template('C1-1-above', [L(H`1<x\le2:\quad \lim_{n\to\infty}f_n(x)=`), S('v')], [
        slot('v', ['zero', 'half', 'one', 'inf'], 'zero', {
          inf: H`חלקו מונה ומכנה ב־$x^{2n}$: $f_n(x)=\frac{x^{-n}}{x^{-2n}+1}$, ו־$x^{-n}\to0$.`,
          one: H`חלקו מונה ומכנה ב־$x^{2n}$: $f_n(x)=\frac{x^{-n}}{x^{-2n}+1}$.`,
        }),
      ])),
    ],
    hints: [
      H`ב־$x>1$ חלקו את המונה ואת המכנה ב־$x^{2n}$.`,
    ],
    solvedNote: H`הגבול הנקודתי הוא $f(x)=0$ לכל $x\ne1$, ו־$f(1)=\tfrac12$.`,
    graph: graph({ limit: true, jumps: true }),
  },
  {
    id: 'C1-2',
    exampleId: 'C1',
    title: 'האם הגבול רציף?',
    prompt: H`כל $f_n$ רציפה ב־$[0,2]$. האם גם פונקציית הגבול $f$ רציפה שם?`,
    parts: [
      choicePart('C1-2-continuous', H`בחרו את הטענה הנכונה על $f$.`, [
        { id: 'jump-at-one', correct: true, label: H`$f$ אינה רציפה ב־$x=1$: $\lim_{x\to1}f(x)=0\ne\tfrac12=f(1)$.` },
        { id: 'continuous', correct: false, label: H`$f$ רציפה, כי היא גבול של פונקציות רציפות.`, diagnosis: 'גבול נקודתי של פונקציות רציפות אינו חייב להיות רציף; זו בדיוק השאלה.' },
        { id: 'jump-at-zero', correct: false, label: H`$f$ אינה רציפה ב־$x=0$.`, diagnosis: H`ליד $x=0$ הפונקציה $f$ שווה ל־$0$ ו־$f(0)=0$.` },
      ]),
    ],
    hints: [H`השוו את $f(1)$ לערכי $f$ בנקודות הקרובות ל־$1$.`],
    solvedNote: H`$f$ קופצת ב־$x=1$, ולכן אינה רציפה שם.`,
    graph: graph({ limit: true, jumps: true }),
  },
  {
    id: 'C1-3',
    exampleId: 'C1',
    title: 'המסקנה',
    prompt: H`מה אפשר להסיק על סוג ההתכנסות ב־$[0,2]$?`,
    parts: [
      choicePart('C1-3-verdict', H`בחרו את המסקנה ואת הנימוק.`, [
        { id: 'correct', correct: true, label: H`ההתכנסות אינה במידה שווה: אילו הייתה, $f$ הייתה רציפה כגבול במידה שווה של פונקציות רציפות.` },
        { id: 'uniform', correct: false, label: H`ההתכנסות במידה שווה, כי הגבול קיים בכל נקודה.`, diagnosis: 'קיום הגבול בכל נקודה הוא התכנסות נקודתית בלבד.' },
        { id: 'no-conclusion', correct: false, label: H`אי אפשר להסיק דבר ממשפט הרציפות.`, diagnosis: 'המשפט נותן תנאי הכרחי: אם הגבול אינו רציף, ההתכנסות אינה במידה שווה.' },
      ]),
    ],
    hints: [H`נסחו את המשפט בצורה השקולה (השלילה של המסקנה גוררת את השלילה של ההנחה).`],
    solvedNote: H`$f_n$ רציפות ו־$f$ אינה רציפה, ולכן ההתכנסות ב־$[0,2]$ אינה במידה שווה.`,
    graph: graph({ limit: true, jumps: true, band: true }),
  },
];

// ---------------------------------------------------------------------------------------------
// C2: (n+1)^2 x on [0, 1/(n+1)], 1/x on [1/(n+1), 1]
// ---------------------------------------------------------------------------------------------

const C2_STEPS: ContStep[] = [
  {
    id: 'C2-1',
    exampleId: 'C2',
    title: 'רציפות בנקודת החיבור',
    prompt: H`בכל אחד משני הקטעים $f_n$ מוגדרת על ידי ביטוי רציף. לכן השאלה היחידה היא רציפות בנקודת החיבור $x=\frac1{n+1}$: חשבו את הגבול משמאל ואת הגבול מימין בנקודה זו.`,
    parts: [
      slotsPart(template('C2-1-left', [L(H`\lim_{x\to\left(\frac1{n+1}\right)^-}f_n(x)=\lim_{x\to\left(\frac1{n+1}\right)^-}(n+1)^2x=`), S('v')], [
        slot('v', ['one', 'n-plus-1', 'n-plus-1-sq', 'inf'], 'n-plus-1', {
          one: H`הציבו $x=\frac1{n+1}$ בביטוי $(n+1)^2x$: נשאר גורם $n+1$ אחד.`,
          'n-plus-1-sq': H`הציבו $x=\frac1{n+1}$: $(n+1)^2\cdot\frac1{n+1}$, וצמצמו.`,
          inf: H`$n$ קבוע כאן, והגבול הוא לפי $x$; הביטוי $(n+1)^2x$ רציף ולכן הגבול מתקבל בהצבה.`,
        }),
      ])),
      slotsPart(template('C2-1-right', [L(H`\lim_{x\to\left(\frac1{n+1}\right)^+}f_n(x)=\lim_{x\to\left(\frac1{n+1}\right)^+}\frac1x=`), S('v')], [
        slot('v', ['one', 'n-plus-1', 'n-plus-1-sq', 'inf'], 'n-plus-1', {
          one: H`הציבו $x=\frac1{n+1}$ בביטוי $\frac1x$.`,
          'n-plus-1-sq': H`$\frac{1}{1/(n+1)}=n+1$.`,
          inf: H`$x$ שואף ל־$\frac1{n+1}>0$ ולא ל־$0$, ולכן $\frac1x$ אינו שואף לאינסוף.`,
        }),
      ])),
    ],
    hints: [H`שני הביטויים רציפים בנקודה $x=\frac1{n+1}$, ולכן כל אחד מהגבולות החד־צדדיים מתקבל בהצבה.`],
    solvedNote: H`הגבול משמאל והגבול מימין שווים ל־$n+1$, וזה גם הערך $f_n\left(\frac1{n+1}\right)$. לכן כל $f_n$ רציפה ב־$[0,1]$, וגם חסומה ב־$n+1$.`,
    graph: graph({ jumps: true }),
  },
  {
    id: 'C2-2',
    exampleId: 'C2',
    title: 'הגבול הנקודתי',
    prompt: H`חשבו את הגבול הנקודתי. שימו לב שלכל $x>0$ קבוע, החל מ־$n$ מסוים מתקיים $\frac1{n+1}<x$.`,
    parts: [
      slotsPart(template('C2-2-zero', [L(H`x=0:\quad \lim_{n\to\infty}f_n(0)=`), S('v')], [
        slot('v', ['zero', 'one', 'inf'], 'zero'),
      ])),
      slotsPart(template('C2-2-positive', [L(H`0<x\le1:\quad \lim_{n\to\infty}f_n(x)=`), S('v')], [
        slot('v', ['zero', 'inv-x', 'inf', 'x'], 'inv-x'),
      ])),
    ],
    hints: [H`עבור $x>0$ ו־$n$ גדול מספיק, $x$ נמצא בחלק שבו $f_n(x)=\frac1x$.`],
    solvedNote: H`$f(0)=0$ ו־$f(x)=\frac1x$ לכל $0<x\le1$: הגבול אינו רציף ב־$0$ ואינו חסום.`,
    graph: graph({ limit: true, jumps: true }),
  },
  {
    id: 'C2-3',
    exampleId: 'C2',
    title: 'המסקנה',
    prompt: H`מה אפשר להסיק על סוג ההתכנסות ב־$[0,1]$?`,
    parts: [
      choicePart('C2-3-verdict', H`בחרו את המסקנה ואת הנימוק.`, [
        { id: 'correct', correct: true, label: H`ההתכנסות אינה במידה שווה, כי $f_n$ רציפות והגבול $f$ אינו רציף ב־$x=0$.` },
        { id: 'uniform', correct: false, label: H`ההתכנסות במידה שווה, כי $f_n(x)=f(x)$ לכל $x\ge\frac1{n+1}$.`, diagnosis: H`השוויון מתקיים רק החל מ־$\frac1{n+1}$; ליד $0$ ההפרש $\frac1x-f_n(x)$ אינו חסום.` },
        { id: 'bounded-only', correct: false, label: H`אי אפשר להסיק דבר, כי כל $f_n$ חסומה.`, diagnosis: 'החסימות של כל f_n אינה מונעת את המסקנה; היא דווקא נותנת נימוק נוסף.' },
      ]),
    ],
    hints: [H`האם $f$ רציפה ב־$0$?`],
    disclosure: {
      summary: 'נימוק נוסף: גבול במידה שווה של פונקציות חסומות',
      body: H`אפשר להוכיח באופן כללי: אם כל $f_n$ חסומה ו־$f_n\to f$ במידה שווה, אז גם $f$ חסומה. כאן כל $f_n$ חסומה ב־$n+1$, אבל $f(x)=\frac1x$ אינה חסומה ב־$(0,1]$, ולכן גם מכאן ההתכנסות אינה במידה שווה.`,
    },
    solvedNote: H`$f_n$ רציפות ו־$f$ אינה רציפה ב־$0$, ולכן ההתכנסות אינה במידה שווה. בנוסף, $f$ אינה חסומה, בעוד שכל $f_n$ חסומה.`,
    graph: graph({ limit: true, jumps: true, band: true }),
  },
];

// ---------------------------------------------------------------------------------------------
// C3: floor(nx)/n on [0,1)
// ---------------------------------------------------------------------------------------------

const C3_STEPS: ContStep[] = [
  {
    id: 'C3-1',
    exampleId: 'C3',
    title: 'האם $f_n$ רציפות?',
    prompt: H`הגדילו את $n$ והתבוננו בגרף של $f_n(x)=\frac{\lfloor nx\rfloor}{n}$ ב־$[0,1)$.`,
    parts: [
      choicePart('C3-1-continuity', H`בחרו את הטענה הנכונה.`, [
        { id: 'jumps', correct: true, label: H`$f_1$ רציפה, אך $f_n$ אינה רציפה כאשר $n\geq 2$.` },
        { id: 'all-continuous', correct: false, label: H`כל $f_n$ רציפות, כי $\lfloor nx\rfloor$ רציפה.`, diagnosis: H`$\lfloor y\rfloor$ קופצת בכל מספר שלם $y$.` },
        { id: 'all-jump', correct: false, label: H`כל $f_n$, כולל $f_1$, אינן רציפות ב־$[0,1)$.`, diagnosis: H`ב־$[0,1)$ מתקיים $\lfloor x\rfloor=0$, ולכן $f_1\equiv0$.` },
      ]),
    ],
    hints: [H`עבור $x\in[\frac kn,\frac{k+1}n)$ מתקיים $\lfloor nx\rfloor=k$.`],
    solvedNote: H`החל מ־$n=2$ כל $f_n$ אינה רציפה.`,
    graph: graph({ jumps: true }),
  },
  {
    id: 'C3-2',
    exampleId: 'C3',
    title: 'התכנסות במידה שווה',
    prompt: H`השתמשו ב־$nx-1<\lfloor nx\rfloor\le nx$ כדי לחסום את $\lvert f_n(x)-x\rvert$.`,
    parts: [
      slotsPart(template('C3-2-bound', [L(H`0\le x-f_n(x)<`), S('v')], [
        slot('v', ['inv-n', 'one', 'x', 'zero'], 'inv-n', {
          zero: 'ההפרש אינו אפס: למשל בנקודות שבין שני שלמים.',
          one: 'זה חסם נכון אך אינו שואף ל־0, ולכן אינו מספיק.',
        }),
      ])),
    ],
    hints: [H`חלקו את אי השוויון $nx-1<\lfloor nx\rfloor\le nx$ ב־$n$.`],
    solvedNote: H`$\sup_{x\in[0,1)}\lvert f_n(x)-x\rvert\le\frac1n\to0$, ולכן $f_n\to f(x)=x$ במידה שווה ב־$[0,1)$.`,
    graph: graph({ limit: true, band: true, jumps: true }),
  },
  {
    id: 'C3-3',
    exampleId: 'C3',
    title: 'מה הדוגמה מראה?',
    prompt: H`הפונקציות $f_n$ אינן רציפות, והגבול $f(x)=x$ רציף, וההתכנסות במידה שווה.`,
    parts: [
      choicePart('C3-3-converse', H`מה הדוגמה מלמדת על משפט הרציפות?`, [
        { id: 'one-direction', correct: true, label: 'המשפט נכון רק בכיוון אחד: גבול רציף אינו מחייב שהפונקציות בסדרה רציפות, גם כשההתכנסות במידה שווה.' },
        { id: 'contradiction', correct: false, label: 'הדוגמה סותרת את המשפט.', diagnosis: H`המשפט מניח שכל $f_n$ רציפה; כאן ההנחה אינה מתקיימת, ולכן אין סתירה.` },
        { id: 'converse-true', correct: false, label: 'הדוגמה מראה שאם הגבול רציף, ההתכנסות במידה שווה.', diagnosis: H`גבול רציף אינו מבטיח התכנסות במידה שווה; למשל $nxe^{-nx}$ ב־$[0,\infty)$ מהפעילות הקודמת.` },
      ]),
    ],
    hints: [H`מה הן ההנחות של המשפט, ומה המסקנה שלו?`],
    solvedNote: H`המשפט אומר: רציפות $f_n$ והתכנסות במידה שווה גוררות רציפות של $f$. ההפך אינו נכון בהכרח.`,
    graph: graph({ limit: true, band: true, jumps: true }),
  },
];

export const CONT_STEPS: Record<ContExampleId, ContStep[]> = {
  C1: C1_STEPS,
  C2: C2_STEPS,
  C3: C3_STEPS,
};

/** Graph state at step `index`: the solved state, or the state left by the previous step. */
export function contGraphFlagsFor(steps: ContStep[], index: number, solved: boolean): ContGraphFlags {
  if (solved) return steps[index].graph;
  if (index > 0) return steps[index - 1].graph;
  return graph({});
}

/**
 * The summary pop-up of each example, shown when the example is finished: paragraphs of Hebrew
 * with inline $...$ math. Course owner's text, lightly proofread.
 */
export const CONT_SUMMARIES: Record<ContExampleId, readonly string[]> = {
  C1: [
    H`בדוגמה זו ראינו סדרה של פונקציות רציפות המתכנסות נקודתית לפונקציה גבולית שאינה רציפה. במקרה שלנו – בעלת אי־רציפות סליקה בנקודה $x=1$.`,
    H`על פי המשפט, אם סדרה של פונקציות רציפות מתכנסת במידה שווה, הפונקציה הגבולית בהכרח רציפה.`,
    H`אי לכך, לא ייתכן שסדרת הפונקציות בדוגמה זו מתכנסת במידה שווה, וזאת אף על פי שלא בדקנו זאת במפורש.`,
  ],
  C2: [
    H`דוגמה זו דומה לדוגמה הקודמת, אך הפעם המצב חמור יותר. כאן הראינו שסדרה של פונקציות רציפות וחסומות יכולה להתכנס לפונקציה גבולית שכלל אינה חסומה, ובפרט אינה רציפה.`,
    H`המסקנה כאן זהה – לא ייתכן שסדרת הפונקציות מתכנסת במידה שווה.`,
    H`בנוסף, ישנה דרך נוספת להשתכנע בכך, המבוססת על משפט אחר שניתן להוכיח: סדרה של פונקציות חסומות המתכנסת במידה שווה מתכנסת לפונקציה גבולית שגם היא חסומה.`,
    H`גם תוצאה זו נשללת בדוגמה שלנו, ולכן הסדרה אינה מתכנסת במידה שווה.`,
  ],
  C3: [
    H`דוגמה זו מעט מפתיעה. למעט $f_1$, כל הפונקציות בסדרה אינן רציפות.`,
    H`יתרה מכך, לפונקציה $f_n(x)$ יש בדיוק $n-1$ נקודות אי־רציפות, כך שככל שערכו של $n$ גדל, מספר נקודות אי־הרציפות גדל. יחד עם זאת, ניתן להוכיח במפורש שסדרה זו מתכנסת במידה שווה לפונקציה הגבולית $f(x)=x$, שהיא פונקציה רציפה.`,
    H`כלומר, מהמשפט על רציפות הפונקציה הגבולית לא ניתן להסיק שאם הפונקציות בסדרה אינן רציפות, גם הפונקציה הגבולית אינה רציפה.`,
  ],
};
