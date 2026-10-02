/**
 * Step data of the "limit and integral" activity: guided examples of the theorem that uniform
 * convergence allows exchanging limit and integral. Pure TypeScript, no React; the checkers are the
 * shared engine in guidedSteps.ts.
 *
 * DRAFT: the step outline, Hebrew copy and options are a first scaffold, to be rewritten example by
 * example with the course owner. All student-facing copy of the activity's steps is in this file.
 * Example I3 (cos^n x) is optional: it may be skipped without blocking the finish view.
 */
import type { IntExampleId, IntGraphFlags } from './integralExamples';
import { L, S, choicePart, slot, slotsPart, template, type GuidedStep } from './guidedSteps';
import type { TokenId, TokenLabel } from './supremumTypes';

const H = String.raw;

/** A step of the integral activity: the shared guided step with this activity's graph state. */
export type IntStep = GuidedStep<IntExampleId, IntGraphFlags>;

/** The examples the activity walks through; the last one is optional. */
export const INT_ACTIVITY_ORDER: readonly IntExampleId[] = ['I1', 'I2', 'I3'];
export const INT_OPTIONAL: readonly IntExampleId[] = ['I3'];

const TOKEN_LATEX: Record<TokenId, string> = {
  zero: '0',
  half: '\\tfrac12',
  one: '1',
  inf: '\\infty',
  x: 'x',
  'inv-n': '\\tfrac1n',
  'inv-2n': '\\tfrac1{2n}',
  'crit-cbrt': '\\tfrac{1}{\\sqrt[3]{2}\\,n}',
  'cbrt-n': '\\sqrt[3]{2}\\,n',
  'mn-i1': '\\tfrac{2^{2/3}}{3n}',
  'two-thirds': '\\tfrac23',
  'int-i2': '\\tfrac{\\ln(1+n^2)}{2n}',
  'int-i2-wrong': '\\tfrac{\\ln(1+n^2)}{n}',
  'arctan-n': '\\tfrac{\\arctan n}{n}',
  a: 'a',
  'one-minus-a': '1-a',
  'cos-n-a': '\\cos^n a',
  'eps-half': '\\tfrac{\\varepsilon}{2}',
  eps: '\\varepsilon',
  'two-eps': '2\\varepsilon',
  'eps-sq': '\\varepsilon^2',
};

export const INT_TOKENS: Record<TokenId, TokenLabel> = Object.fromEntries(
  Object.entries(TOKEN_LATEX).map(([id, latex]) => [id, { latex }]),
) as Record<TokenId, TokenLabel>;

const graph = (flags: Partial<IntGraphFlags>): IntGraphFlags =>
  ({ limit: false, area: false, band: false, integrals: false, supremum: false, ...flags });

/** The extended integration theorem, as the intro states it: its hypothesis and three conclusions. */
export const INTEGRAL_THEOREM: { hypothesis: string; conclusions: readonly string[] } = {
  hypothesis: H`אם $f_n$ אינטגרביליות בקטע $[a,b]$ ומתכנסות שם במידה שווה לפונקציה גבולית $f$, אזי:`,
  conclusions: [
    H`$f$ אינטגרבילית בקטע $[a,b]$.`,
    H`לכל $x\in[a,b]$ מתקיים $\displaystyle\lim_{n\to\infty}\int_a^x f_n(t)\,dt=\int_a^x f(t)\,dt$.`,
    H`סדרת צוברות השטח $F_n(x)=\int_a^x f_n(t)\,dt$ מתכנסת במידה שווה בקטע לפונקציה הגבולית $F(x)=\int_a^x f(t)\,dt$.`,
  ],
};

// ---------------------------------------------------------------------------------------------
// I1: x / (1 + n^3 x^3) on [0,1] — uniform, so the integrals tend to 0 without computing them
// ---------------------------------------------------------------------------------------------

const I1_STEPS: IntStep[] = [
  {
    id: 'I1-1',
    exampleId: 'I1',
    title: 'הגבול הנקודתי',
    prompt: H`קבעו $x\in[0,1]$ וחשבו את הגבול של $f_n(x)$ כאשר $n\to\infty$.`,
    parts: [
      slotsPart(template('I1-1-limit', [L(H`\lim_{n\to\infty}\frac{x}{1+n^3x^3}=`), S('v')], [
        slot('v', ['zero', 'x', 'one', 'inf'], 'zero', {
          x: H`עבור $x>0$ המכנה $1+n^3x^3$ שואף לאינסוף.`,
          one: H`עבור $x>0$ המכנה $1+n^3x^3$ שואף לאינסוף, ועבור $x=0$ המונה הוא $0$.`,
          inf: 'המונה קבוע והמכנה גדל, ולכן המנה קטנה.',
        }),
      ])),
    ],
    hints: [H`בדקו בנפרד את $x=0$ ואת $x>0$.`],
    solvedNote: H`$f_n\to f=0$ נקודתית ב־$[0,1]$.`,
    graph: graph({ limit: true, area: true }),
  },
  {
    id: 'I1-2',
    exampleId: 'I1',
    title: 'נקודה חשודה לקיצון',
    prompt: H`מכיוון ש־$f_n\ge0$ מתקיים $M_n=\sup_{x\in[0,1]}f_n(x)$. הנגזרת היא $f_n'(x)=\frac{1-2n^3x^3}{(1+n^3x^3)^2}$. מצאו היכן היא מתאפסת.`,
    parts: [
      slotsPart(template('I1-2-critical', [L(H`f_n'(x)=0\iff x=`), S('v')], [
        slot('v', ['crit-cbrt', 'inv-n', 'inv-2n', 'cbrt-n'], 'crit-cbrt', {
          'inv-n': H`הציבו: $1-2n^3\cdot\frac1{n^3}=-1\ne0$.`,
          'inv-2n': H`פתרו $n^3x^3=\frac12$.`,
          'cbrt-n': H`$x=\sqrt[3]{2}\,n$ אינו בקטע $[0,1]$ עבור $n\ge1$; פתרו $x^3=\frac{1}{2n^3}$.`,
        }),
      ])),
    ],
    hints: [H`$1-2n^3x^3=0\iff x^3=\frac{1}{2n^3}$.`],
    solvedNote: H`הנקודה החשודה היא $x_n=\frac{1}{\sqrt[3]{2}\,n}\in(0,1)$; לפני היא $f_n$ עולה ואחריה יורדת, ולכן היא נקודת המקסימום.`,
    graph: graph({ limit: true, area: true }),
  },
  {
    id: 'I1-3',
    exampleId: 'I1',
    title: 'חישוב $M_n$',
    prompt: H`הציבו את $x_n$ ב־$f_n$. שימו לב ש־$n^3x_n^3=\frac12$.`,
    parts: [
      slotsPart(template('I1-3-mn', [L(H`M_n=f_n(x_n)=\frac{x_n}{1+\frac12}=`), S('v'), L(H`\xrightarrow[n\to\infty]{}`), S('lim')], [
        slot('v', ['mn-i1', 'two-thirds', 'half', 'inv-n'], 'mn-i1', {
          'two-thirds': H`זה המקדם: $\frac{x_n}{3/2}=\frac23x_n$. הציבו גם את $x_n$.`,
          half: H`$\frac12$ הוא $n^3x_n^3$, לא $f_n(x_n)$.`,
          'inv-n': H`$\frac23\cdot\frac{1}{\sqrt[3]{2}\,n}=\frac{2^{2/3}}{3n}$.`,
        }),
        slot('lim', ['zero', 'two-thirds', 'inf'], 'zero'),
      ])),
    ],
    hints: [H`$\frac23\cdot\frac{1}{\sqrt[3]{2}}=\frac{2}{3\cdot2^{1/3}}=\frac{2^{2/3}}{3}$.`],
    solvedNote: H`$M_n=\frac{2^{2/3}}{3n}\to0$, ולכן לפי מבחן הסופרמום $f_n\to0$ במידה שווה ב־$[0,1]$.`,
    graph: graph({ limit: true, area: true, band: true, integrals: true, supremum: true }),
  },
  {
    id: 'I1-4',
    exampleId: 'I1',
    title: 'המסקנה על האינטגרלים',
    prompt: H`מה אפשר להסיק על $\displaystyle\lim_{n\to\infty}\int_0^1f_n(x)\,dx$?`,
    parts: [
      choicePart('I1-4-verdict', H`בחרו את המסקנה ואת הנימוק.`, [
        { id: 'correct', correct: true, label: H`ההתכנסות היא במידה שווה, ולפי המשפט $\lim\int_0^1f_n(x)\,dx=\int_0^1 0\,dx=0$.` },
        { id: 'must-compute', correct: false, label: 'אי אפשר לדעת בלי לחשב את האינטגרלים במפורש.', diagnosis: 'זה בדיוק מה שהמשפט חוסך: התכנסות במידה שווה מאפשרת להחליף בין הגבול לאינטגרל.' },
        { id: 'pointwise', correct: false, label: H`הגבול הוא $0$, כי $f_n(x)\to0$ בכל נקודה, וזה מספיק.`, diagnosis: 'התכנסות נקודתית לבדה אינה מספיקה בדרך כלל להחלפת הגבול והאינטגרל; המשפט דורש התכנסות במידה שווה.' },
      ]),
    ],
    hints: [H`מהו $\int_0^1 f(x)\,dx$ עבור הגבול $f=0$?`],
    solvedNote: H`$\displaystyle\lim_{n\to\infty}\int_0^1f_n(x)\,dx=\int_0^1\lim_{n\to\infty}f_n(x)\,dx=0$.`,
    graph: graph({ limit: true, area: true, band: true, integrals: true, supremum: true }),
  },
];

// ---------------------------------------------------------------------------------------------
// I2: nx / (1 + n^2 x^2) on [0,1] — not uniform, yet the integrals tend to 0
// ---------------------------------------------------------------------------------------------

const I2_STEPS: IntStep[] = [
  {
    id: 'I2-1',
    exampleId: 'I2',
    title: 'הגבול הנקודתי',
    prompt: H`קבעו $x\in[0,1]$ וחשבו את הגבול של $f_n(x)$ כאשר $n\to\infty$.`,
    parts: [
      slotsPart(template('I2-1-limit', [L(H`\lim_{n\to\infty}\frac{nx}{1+n^2x^2}=`), S('v')], [
        slot('v', ['zero', 'half', 'x', 'inf'], 'zero', {
          half: H`$\frac12$ הוא הערך בנקודה הנעה $x=\frac1n$, ולא בנקודה קבועה.`,
          x: H`עבור $x>0$: $\frac{nx}{1+n^2x^2}\approx\frac{1}{nx}\to0$.`,
          inf: H`המכנה גדל כמו $n^2$ והמונה רק כמו $n$.`,
        }),
      ])),
    ],
    hints: [H`עבור $x>0$ חלקו מונה ומכנה ב־$n^2x^2$.`],
    solvedNote: H`$f_n\to f=0$ נקודתית ב־$[0,1]$.`,
    graph: graph({ limit: true, area: true }),
  },
  {
    id: 'I2-2',
    exampleId: 'I2',
    title: 'האם ההתכנסות במידה שווה?',
    prompt: H`חשבו את $f_n$ בנקודה הנעה $x=\frac1n$, והסיקו על $M_n=\sup_{x\in[0,1]}\lvert f_n(x)-0\rvert$.`,
    parts: [
      slotsPart(template('I2-2-peak', [L(H`f_n\!\left(\tfrac1n\right)=`), S('v')], [
        slot('v', ['half', 'zero', 'one', 'inv-n'], 'half', {
          zero: H`$f_n(\frac1n)=\frac{1}{1+1}$.`,
          one: H`$f_n(\frac1n)=\frac{n\cdot\frac1n}{1+n^2\cdot\frac1{n^2}}$.`,
          'inv-n': H`$n\cdot\frac1n=1$: הגורם $n$ מצטמצם.`,
        }),
      ])),
      choicePart('I2-2-verdict', H`מה המסקנה?`, [
        { id: 'not-uniform', correct: true, label: H`$M_n\ge\frac12$ לכל $n$, ולכן $M_n\not\to0$ וההתכנסות אינה במידה שווה.` },
        { id: 'uniform', correct: false, label: H`ההתכנסות במידה שווה, כי $f_n(x)\to0$ בכל נקודה.`, diagnosis: H`זו התכנסות נקודתית; התכנסות במידה שווה דורשת ש־$M_n\to0$.` },
      ]),
    ],
    hints: [H`הציבו $x=\frac1n$: $nx=1$.`],
    solvedNote: H`$M_n=\frac12$ לכל $n$ (המקסימום מתקבל ב־$x=\frac1n$), ולכן ההתכנסות אינה במידה שווה.`,
    graph: graph({ limit: true, area: true, band: true, supremum: true, integrals: true }),
  },
  {
    id: 'I2-3',
    exampleId: 'I2',
    title: 'סדרת האינטגרלים',
    prompt: H`חשבו את האינטגרלים במפורש, למשל בעזרת ההצבה $u=1+n^2x^2$.`,
    parts: [
      slotsPart(template('I2-3-integral', [L(H`\int_0^1\frac{nx}{1+n^2x^2}\,dx=`), S('v'), L(H`\xrightarrow[n\to\infty]{}`), S('lim')], [
        slot('v', ['int-i2', 'int-i2-wrong', 'arctan-n', 'half'], 'int-i2', {
          'int-i2-wrong': H`$du=2n^2x\,dx$, ולכן $nx\,dx=\frac{du}{2n}$.`,
          'arctan-n': H`$\arctan$ מתקבל מ־$\frac{1}{1+u^2}$; כאן במונה יש $x$, ולכן מתקבל $\ln$.`,
          half: H`$\frac12$ הוא הסופרמום $M_n$, לא השטח.`,
        }),
        slot('lim', ['zero', 'half', 'inf'], 'zero', {
          half: H`$\ln(1+n^2)$ גדל לאט בהרבה מ־$2n$.`,
          inf: H`$\ln(1+n^2)$ גדל לאט בהרבה מ־$2n$.`,
        }),
      ])),
    ],
    hints: [H`$\int\frac{nx}{1+n^2x^2}\,dx=\frac{1}{2n}\ln(1+n^2x^2)+C$.`],
    solvedNote: H`$\int_0^1f_n=\frac{\ln(1+n^2)}{2n}\to0=\int_0^1f$: כאן אפשר להחליף בין הגבול לאינטגרל.`,
    graph: graph({ limit: true, area: true, band: true, supremum: true, integrals: true }),
  },
  {
    id: 'I2-4',
    exampleId: 'I2',
    title: 'האם זה סותר את המשפט?',
    prompt: H`ההתכנסות אינה במידה שווה, ובכל זאת $\lim\int_0^1f_n=\int_0^1f$.`,
    parts: [
      choicePart('I2-4-converse', H`בחרו את ההסבר הנכון.`, [
        { id: 'sufficient', correct: true, label: 'אין סתירה, כשאין התכנסות במידה שווה המשפט לא אומר דבר.' },
        { id: 'contradiction', correct: false, label: 'יש סתירה, ולכן אחד החישובים שגוי.', diagnosis: 'המשפט אומר רק מה קורה כשההתכנסות במידה שווה; הוא אינו טוען דבר כשהיא אינה במידה שווה.' },
        { id: 'secretly-uniform', correct: false, label: 'ההתכנסות היא בעצם במידה שווה, כי האינטגרלים מתכנסים.', diagnosis: H`ראינו ש־$M_n=\frac12$ לכל $n$; התכנסות האינטגרלים אינה גוררת התכנסות במידה שווה.` },
      ]),
    ],
    hints: ['נסחו את המשפט כטענה מהצורה «אם… אז…». מה קורה כשההנחה אינה מתקיימת?'],
    solvedNote: 'כשההתכנסות אינה במידה שווה המשפט אינו קובע דבר: האינטגרלים יכולים להתכנס לאינטגרל הגבול (כמו כאן) או לא.',
    graph: graph({ limit: true, area: true, band: true, supremum: true, integrals: true }),
  },
];

// ---------------------------------------------------------------------------------------------
// I3 (optional): cos^n x on [0,1] — not uniform on [0,1], uniform on every [a,1]; split the integral
// ---------------------------------------------------------------------------------------------

const I3_STEPS: IntStep[] = [
  {
    id: 'I3-1',
    exampleId: 'I3',
    title: 'הגבול הנקודתי וסוג ההתכנסות',
    prompt: H`חשבו את הגבול הנקודתי של $f_n(x)=\cos^n x$ ב־$[0,1]$, והסיקו אם ההתכנסות בקטע במידה שווה.`,
    parts: [
      slotsPart(template('I3-1-zero', [L(H`x=0:\quad \lim_{n\to\infty}\cos^n 0=`), S('v')], [
        slot('v', ['one', 'zero', 'inf'], 'one', { zero: H`$\cos0=1$, ולכן $\cos^n0=1$ לכל $n$.` }),
      ])),
      slotsPart(template('I3-1-positive', [L(H`0<x\le1:\quad \lim_{n\to\infty}\cos^n x=`), S('v')], [
        slot('v', ['zero', 'one', 'inf'], 'zero', { one: H`עבור $0<x\le1$ מתקיים $0<\cos x<1$, ולכן החזקות שואפות ל־$0$.` }),
      ])),
      choicePart('I3-1-uniform', H`האם ההתכנסות ב־$[0,1]$ במידה שווה?`, [
        { id: 'not-uniform', correct: true, label: H`לא: $f_n$ כולן רציפות בעוד שפונקציית הגבול לא רציפה.` },
        { id: 'uniform', correct: false, label: H`כן, כי $\cos^n x\to0$ בכל נקודה פרט לאחת.`, diagnosis: 'נקודה אחת מספיקה כדי שהגבול לא יהיה רציף, וזה כבר שולל התכנסות במידה שווה.' },
        { id: 'at-zero', correct: false, label: H`לא, כי $f_n(0)=1$ אינו שואף ל־$0$.`, diagnosis: H`ב־$x=0$ אין בעיה: $f_n(0)=f(0)=1$. הבעיה היא הקפיצה של הגבול ב־$0$.` },
      ]),
    ],
    hints: [H`עבור $0<x\le1$: $0<\cos x<1$.`],
    solvedNote: H`$f(0)=1$ ו־$f(x)=0$ ל־$0<x\le1$. הגבול אינו רציף, ולכן ההתכנסות ב־$[0,1]$ אינה במידה שווה, ואי אפשר להפעיל ישירות את משפט האינטגרציה.`,
    graph: graph({ limit: true, area: true }),
  },
  {
    id: 'I3-2',
    exampleId: 'I3',
    title: 'פיצול האינטגרל',
    prompt: H`נתון: לכל $0<a<1$ מתקיים $\sup_{x\in[a,1]}\cos^n x=\cos^n a\to0$, כלומר בקטע $[a,1]$ ההתכנסות במידה שווה. פצלו $\int_0^1f_n=\int_0^af_n+\int_a^1f_n$ והשלימו את שני החלקים.`,
    parts: [
      slotsPart(template('I3-2-left', [L(H`0\le\int_0^a\cos^n x\,dx\le`), S('v')], [
        slot('v', ['a', 'one-minus-a', 'cos-n-a', 'zero'], 'a', {
          'one-minus-a': H`$1-a$ הוא אורך הקטע $[a,1]$; כאן מדובר בקטע $[0,a]$.`,
          'cos-n-a': H`$\cos^n a$ חוסם את $f_n$ בקטע $[a,1]$, לא בקטע $[0,a]$; שם הערכים קרובים ל־$1$.`,
          zero: H`ליד $0$ הפונקציה קרובה ל־$1$, ולכן האינטגרל חיובי.`,
        }),
      ])),
      slotsPart(template('I3-2-right', [L(H`\lim_{n\to\infty}\int_a^1\cos^n x\,dx=`), S('v')], [
        slot('v', ['zero', 'a', 'one-minus-a', 'one'], 'zero', {
          'one-minus-a': H`בקטע $[a,1]$ ההתכנסות במידה שווה לגבול $0$, ולכן לפי המשפט האינטגרלים שואפים ל־$\int_a^1 0\,dx$.`,
        }),
      ])),
    ],
    hints: [H`$0\le\cos^n x\le1$, ולכן האינטגרל על קטע חסום באורך הקטע.`],
    solvedNote: H`החלק $[0,a]$ קטן כי הקטע צר: הוא לכל היותר $a$. החלק $[a,1]$ שואף ל־$0$ לפי משפט האינטגרציה.`,
    graph: graph({ limit: true, area: true, split: true, integrals: true }),
  },
  {
    id: 'I3-3',
    exampleId: 'I3',
    title: 'הרכבת הטיעון',
    prompt: H`יהי $0<\varepsilon<1$. בחרו את $a$, ולפי השלב הקודם קיים $N$ כך שלכל $n>N$ מתקיים $\int_a^1f_n<\frac{\varepsilon}{2}$. השלימו.`,
    parts: [
      slotsPart(template('I3-3-a', [L(H`a=`), S('v')], [
        slot('v', ['eps-half', 'eps', 'two-eps', 'eps-sq'], 'eps-half', {
          eps: H`אז החלק $[0,a]$ לבדו עלול להגיע ל־$\varepsilon$, ולא יישאר מקום לחלק השני.`,
          'two-eps': H`$a$ צריך להיות קטן מ־$\varepsilon$: החלק $[0,a]$ חסום ב־$a$.`,
          'eps-sq': H`גם זה עובד, אבל הבחירה הטבעית היא לחלק את $\varepsilon$ שווה בשווה בין שני החלקים.`,
        }),
      ])),
      slotsPart(template('I3-3-total', [L(H`0\le\int_0^1f_n=\int_0^af_n+\int_a^1f_n<`), S('left'), L(H`+\tfrac{\varepsilon}{2}=`), S('total')], [
        slot('left', ['eps-half', 'eps', 'a', 'one'], 'eps-half', {
          a: H`נכון ש־$\int_0^af_n\le a$; הציבו את הבחירה $a=\frac{\varepsilon}{2}$.`,
          one: H`החסם $1$ נכון אבל גס מדי: החלק $[0,a]$ חסום ב־$a$.`,
        }),
        slot('total', ['eps', 'two-eps', 'eps-half'], 'eps'),
      ])),
    ],
    hints: [H`חלקו את $\varepsilon$ בין שני החלקים.`],
    solvedNote: H`לכל $0<\varepsilon<1$ קיים $N$ כך שלכל $n>N$ מתקיים $0\le\int_0^1f_n<\varepsilon$. לכן $\lim_{n\to\infty}\int_0^1f_n=0=\int_0^1f$, אף שההתכנסות ב־$[0,1]$ אינה במידה שווה.`,
    graph: graph({ limit: true, area: true, split: true, integrals: true }),
  },
];

export const INT_STEPS: Record<IntExampleId, IntStep[]> = {
  I1: I1_STEPS,
  I2: I2_STEPS,
  I3: I3_STEPS,
};

/**
 * The summary pop-up of each example, shown when the example is finished: paragraphs of Hebrew
 * with inline $...$ math. DRAFT, written in the style of the continuity summaries; to be replaced
 * with the course owner's text.
 */
export const INT_SUMMARIES: Record<IntExampleId, readonly string[]> = {
  I1: [
    H`בדוגמה זו הוכחנו, בעזרת מבחן הסופרמום, שסדרת הפונקציות מתכנסת במידה שווה לפונקציה $f=0$ בקטע $[0,1]$.`,
    H`על פי המשפט, מכאן נובע מיד ש־$\lim_{n\to\infty}\int_0^1f_n(x)\,dx=\int_0^1 0\,dx=0$, וזאת בלי לחשב אף אחד מהאינטגרלים – חישוב שאינו פשוט כלל במקרה זה.`,
    H`יתרה מכך, לפי החלק השלישי של המשפט, גם צוברות השטח $F_n(x)=\int_0^xf_n(t)\,dt$ מתכנסות במידה שווה לפונקציה $F=0$ בכל הקטע.`,
  ],
  I2: [
    H`כאן סדרת הפונקציות אינה מתכנסת במידה שווה: הפסגה בגובה $\frac12$ נעה לעבר $0$, אך גובהה אינו קטן.`,
    H`ובכל זאת, חישוב מפורש מראה ש־$\int_0^1f_n(x)\,dx=\frac{\ln(1+n^2)}{2n}\to0=\int_0^1f(x)\,dx$: הפסגה הולכת ונעשית צרה, ולכן השטח שמתחתיה קטן.`,
    H`אין בכך סתירה למשפט. המשפט נותן תנאי מספיק ולא הכרחי: כשההתכנסות אינה במידה שווה הוא פשוט אינו קובע דבר, ויש לבדוק את סדרת האינטגרלים בדרך אחרת.`,
  ],
  I3: [
    H`גם בדוגמה זו ההתכנסות בקטע $[0,1]$ אינה במידה שווה – הפונקציה הגבולית אינה רציפה ב־$x=0$ – ולכן אי אפשר להפעיל את המשפט ישירות.`,
    H`עם זאת, בכל קטע $[a,1]$ ההתכנסות במידה שווה. לכן פיצלנו את האינטגרל: החלק שמעל $[0,a]$ קטן כי הקטע צר (לכל היותר $a$), והחלק שמעל $[a,1]$ שואף ל־$0$ לפי המשפט. בחירת $a=\frac{\varepsilon}{2}$ הראתה שלכל $\varepsilon$ האינטגרל קטן מ־$\varepsilon$ החל מ־$n$ מסוים.`,
    H`זו טכניקה שימושית: כשההתכנסות במידה שווה נכשלת רק ליד נקודה אחת, מבודדים את הנקודה בקטע קטן ומטפלים בשאר הקטע בעזרת המשפט.`,
  ],
};

/** Graph state at step `index`: the solved state, or the state left by the previous step. */
export function intGraphFlagsFor(steps: IntStep[], index: number, solved: boolean): IntGraphFlags {
  if (solved) return steps[index].graph;
  if (index > 0) return steps[index - 1].graph;
  return graph({ area: true });
}
