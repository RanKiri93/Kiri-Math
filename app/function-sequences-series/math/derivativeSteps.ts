/**
 * Step data of the "limit and derivative" activity: guided examples of the term-by-term
 * differentiation theorem. Pure TypeScript, no React; the checkers are the shared engine in
 * guidedSteps.ts.
 *
 * DRAFT: the step outline, Hebrew copy and options are a first scaffold, to be rewritten example by
 * example with the course owner. All student-facing copy of the activity's steps is in this file.
 */
import type { DerExampleId, DerGraphFlags } from './derivativeExamples';
import { L, S, choicePart, slot, slotsPart, template, type GuidedStep } from './guidedSteps';
import type { TokenId, TokenLabel } from './supremumTypes';

const H = String.raw;

/** A step of the derivative activity: the shared guided step with this activity's graph state. */
export type DerStep = GuidedStep<DerExampleId, DerGraphFlags>;

const TOKEN_LATEX: Record<TokenId, string> = {
  zero: '0',
  half: '\\tfrac12',
  one: '1',
  inf: '\\infty',
  n: 'n',
  'inv-sqrt-n': '\\tfrac{1}{\\sqrt n}',
  'inv-n': '\\tfrac1n',
  'pi-over-4n': '\\tfrac{\\pi}{4n}',
  'pi-over-2n': '\\tfrac{\\pi}{2n}',
  'd1-prime': '\\tfrac{2x}{1+nx^2}',
  'd1-prime-wrong': '\\tfrac{2nx}{1+nx^2}',
  'd1-prime-wrong2': '\\tfrac{1}{n(1+nx^2)}',
  'd2-prime': '\\tfrac{x^{n-1}}{1+x^{2n}}',
  'd2-prime-wrong': '\\tfrac{nx^{n-1}}{1+x^{2n}}',
  'd2-prime-wrong2': '\\tfrac{1}{n(1+x^{2n})}',
};

export const DER_TOKENS: Record<TokenId, TokenLabel> = Object.fromEntries(
  Object.entries(TOKEN_LATEX).map(([id, latex]) => [id, { latex }]),
) as Record<TokenId, TokenLabel>;

const graph = (flags: Partial<DerGraphFlags>): DerGraphFlags =>
  ({ limit: false, band: false, derivative: false, derivLimit: false, derivBand: false, ...flags });

/** The differentiation theorem, as the intro states it: three hypotheses and the conclusion. DRAFT wording. */
export const DERIVATIVE_THEOREM: { hypotheses: readonly string[]; conclusion: string } = {
  hypotheses: [
    H`$f_n$ גזירות בקטע $[a,b]$;`,
    H`קיימת נקודה $x_0\in[a,b]$ שבה הסדרה $\{f_n(x_0)\}$ מתכנסת;`,
    H`סדרת הנגזרות $\{f_n'\}$ מתכנסת במידה שווה ב־$[a,b]$ לפונקציה $g$.`,
  ],
  conclusion: H`אזי $f_n$ מתכנסות במידה שווה ב־$[a,b]$ לפונקציה גזירה $f$, ומתקיים $f'=g$, כלומר $\left(\lim_{n\to\infty}f_n\right)'=\lim_{n\to\infty}f_n'$.`,
};

// ---------------------------------------------------------------------------------------------
// D1: ln(1+nx^2)/n on [0,1] — all hypotheses hold
// ---------------------------------------------------------------------------------------------

const D1_STEPS: DerStep[] = [
  {
    id: 'D1-1',
    exampleId: 'D1',
    title: 'התכנסות בנקודה אחת',
    prompt: H`התנאי הראשון של המשפט דורש התכנסות בנקודה אחת לפחות. הנקודה הנוחה ביותר היא $x_0=0$.`,
    parts: [
      slotsPart(template('D1-1-zero', [L(H`f_n(0)=\frac{\ln(1+0)}{n}=`), S('v')], [
        slot('v', ['zero', 'inv-n', 'one'], 'zero', { 'inv-n': H`$\ln1=0$.`, one: H`$\ln1=0$.` }),
      ])),
    ],
    hints: [H`$\ln 1=0$.`],
    solvedNote: H`$f_n(0)=0$ לכל $n$, ולכן הסדרה מתכנסת בנקודה $x_0=0$.`,
    graph: graph({}),
  },
  {
    id: 'D1-2',
    exampleId: 'D1',
    title: 'סדרת הנגזרות',
    prompt: H`גזרו את $f_n(x)=\frac{\ln(1+nx^2)}{n}$.`,
    parts: [
      slotsPart(template('D1-2-prime', [L(H`f_n'(x)=`), S('v')], [
        slot('v', ['d1-prime', 'd1-prime-wrong', 'd1-prime-wrong2'], 'd1-prime', {
          'd1-prime-wrong': H`לפי כלל השרשרת $\left(\ln(1+nx^2)\right)'=\frac{2nx}{1+nx^2}$, ועוד יש לחלק ב־$n$.`,
          'd1-prime-wrong2': H`נגזרת $\ln u$ היא $\frac{u'}{u}$; אל תשכחו את $u'=2nx$.`,
        }),
      ])),
    ],
    hints: [H`$\left(\ln u\right)'=\frac{u'}{u}$ עם $u=1+nx^2$.`],
    solvedNote: H`$f_n'(x)=\frac{2x}{1+nx^2}$.`,
    graph: graph({ derivative: true }),
  },
  {
    id: 'D1-3',
    exampleId: 'D1',
    title: 'התכנסות במידה שווה של הנגזרות',
    prompt: H`לפי אי שוויון הממוצעים $1+nx^2\ge2\sqrt n\,x$. השתמשו בו כדי לחסום את $f_n'$ בקטע.`,
    parts: [
      slotsPart(template('D1-3-bound', [L(H`0\le f_n'(x)=\frac{2x}{1+nx^2}\le`), S('v'), L(H`\xrightarrow[n\to\infty]{}`), S('lim')], [
        slot('v', ['inv-sqrt-n', 'inv-n', 'one', 'half'], 'inv-sqrt-n', {
          'inv-n': H`$\frac{2x}{2\sqrt n\,x}=\frac{1}{\sqrt n}$.`,
          one: H`החסם $1$ נכון, אבל אינו שואף ל־$0$ ולכן אינו מספיק.`,
          half: H`$\frac12$ אינו תלוי ב־$n$ ואינו שואף ל־$0$.`,
        }),
        slot('lim', ['zero', 'one', 'inf'], 'zero'),
      ])),
    ],
    hints: [H`$\frac{2x}{1+nx^2}\le\frac{2x}{2\sqrt n\,x}$ עבור $x>0$.`],
    solvedNote: H`$\sup_{x\in[0,1]}\lvert f_n'(x)-0\rvert\le\frac1{\sqrt n}\to0$, ולכן $f_n'\to g=0$ במידה שווה ב־$[0,1]$.`,
    graph: graph({ derivative: true, derivLimit: true, derivBand: true }),
  },
  {
    id: 'D1-4',
    exampleId: 'D1',
    title: 'המסקנה',
    prompt: H`כל תנאי המשפט מתקיימים. מה אפשר להסיק על $f_n$ עצמן?`,
    parts: [
      choicePart('D1-4-verdict', H`בחרו את המסקנה.`, [
        { id: 'correct', correct: true, label: H`$f_n$ מתכנסות במידה שווה לפונקציה גזירה $f$ עם $f'=0$ ו־$f(0)=0$, ולכן $f\equiv0$.` },
        { id: 'pointwise-only', correct: false, label: H`$f_n$ מתכנסות רק נקודתית, כי המשפט עוסק בנגזרות בלבד.`, diagnosis: H`המשפט קובע גם ש־$f_n$ עצמן מתכנסות במידה שווה.` },
        { id: 'no-conclusion', correct: false, label: H`אי אפשר להסיק דבר בלי לחשב את $\lim f_n(x)$ בכל נקודה.`, diagnosis: H`זה בדיוק מה שהמשפט חוסך: מספיקה התכנסות בנקודה אחת והתכנסות במידה שווה של הנגזרות.` },
      ]),
    ],
    hints: [H`פונקציה שנגזרתה $0$ בקטע היא קבועה.`],
    solvedNote: H`$f_n\to f\equiv0$ במידה שווה ב־$[0,1]$, ואכן $\sup\lvert f_n\rvert=\frac{\ln(1+n)}{n}\to0$.`,
    graph: graph({ limit: true, band: true, derivative: true, derivLimit: true, derivBand: true }),
  },
];

// ---------------------------------------------------------------------------------------------
// D2: arctan(x^n)/n on [0,1] — the derivatives do not converge uniformly
// ---------------------------------------------------------------------------------------------

const D2_STEPS: DerStep[] = [
  {
    id: 'D2-1',
    exampleId: 'D2',
    title: 'התכנסות בנקודה אחת',
    prompt: H`גם כאן הנקודה הנוחה היא $x_0=0$.`,
    parts: [
      slotsPart(template('D2-1-zero', [L(H`f_n(0)=\frac{\arctan 0}{n}=`), S('v')], [
        slot('v', ['zero', 'inv-n', 'pi-over-4n'], 'zero', { 'pi-over-4n': H`$\frac{\pi}{4}=\arctan1$; כאן $\arctan0=0$.` }),
      ])),
    ],
    hints: [H`$\arctan0=0$.`],
    solvedNote: H`$f_n(0)=0$ לכל $n$: התנאי הראשון מתקיים.`,
    graph: graph({}),
  },
  {
    id: 'D2-2',
    exampleId: 'D2',
    title: 'סדרת הנגזרות',
    prompt: H`גזרו את $f_n(x)=\frac1n\arctan(x^n)$.`,
    parts: [
      slotsPart(template('D2-2-prime', [L(H`f_n'(x)=`), S('v')], [
        slot('v', ['d2-prime', 'd2-prime-wrong', 'd2-prime-wrong2'], 'd2-prime', {
          'd2-prime-wrong': H`הגורם $n$ מהנגזרת של $x^n$ מצטמצם עם $\frac1n$.`,
          'd2-prime-wrong2': H`לפי כלל השרשרת יש להכפיל גם בנגזרת של $x^n$.`,
        }),
      ])),
    ],
    hints: [H`$\left(\arctan u\right)'=\frac{u'}{1+u^2}$ עם $u=x^n$.`],
    solvedNote: H`$f_n'(x)=\frac{x^{n-1}}{1+x^{2n}}$.`,
    graph: graph({ derivative: true }),
  },
  {
    id: 'D2-3',
    exampleId: 'D2',
    title: 'הגבול של הנגזרות',
    prompt: H`חשבו את הגבול הנקודתי $g$ של סדרת הנגזרות.`,
    parts: [
      slotsPart(template('D2-3-below', [L(H`0\le x<1:\quad \lim_{n\to\infty}f_n'(x)=`), S('v')], [
        slot('v', ['zero', 'half', 'one'], 'zero', { half: H`$\frac12$ מתקבל רק ב־$x=1$.` }),
      ])),
      slotsPart(template('D2-3-one', [L(H`x=1:\quad \lim_{n\to\infty}f_n'(1)=`), S('v')], [
        slot('v', ['zero', 'half', 'one'], 'half', { zero: H`הציבו $x=1$: $\frac{1}{1+1}$.`, one: H`הציבו $x=1$: $\frac{1}{1+1}$.` }),
      ])),
      choicePart('D2-3-uniform', H`האם $f_n'$ מתכנסות במידה שווה ב־$[0,1]$?`, [
        { id: 'not-uniform', correct: true, label: H`לא: $f_n'$ רציפות והגבול $g$ אינו רציף ב־$x=1$.` },
        { id: 'uniform', correct: false, label: H`כן, כי $f_n'(x)\to0$ כמעט בכל נקודה.`, diagnosis: 'נקודה אחת מספיקה כדי שהגבול לא יהיה רציף, וזה שולל התכנסות במידה שווה.' },
      ]),
    ],
    hints: [H`עבור $0\le x<1$: $x^{n-1}\to0$ (ב־$x=0$ החל מ־$n=2$).`],
    solvedNote: H`$g=0$ ב־$[0,1)$ ו־$g(1)=\frac12$. הגבול אינו רציף, ולכן ההתכנסות של הנגזרות אינה במידה שווה, והתנאי השלישי של המשפט אינו מתקיים.`,
    graph: graph({ derivative: true, derivLimit: true, derivBand: true }),
  },
  {
    id: 'D2-4',
    exampleId: 'D2',
    title: 'מה קורה לסדרה עצמה?',
    prompt: H`השתמשו ב־$0\le\arctan(x^n)\le\frac\pi4$ ב־$[0,1]$.`,
    parts: [
      slotsPart(template('D2-4-bound', [L(H`0\le f_n(x)\le`), S('v'), L(H`\xrightarrow[n\to\infty]{}`), S('lim')], [
        slot('v', ['pi-over-4n', 'pi-over-2n', 'inv-n', 'one'], 'pi-over-4n', {
          'pi-over-2n': H`$\frac{\pi}{2n}$ נכון אבל לא הדוק: ב־$[0,1]$ מתקיים $x^n\le1$ ולכן $\arctan(x^n)\le\frac\pi4$.`,
          'inv-n': H`$\arctan1=\frac\pi4<1$; החסם $\frac1n$ נכון, אך השתמשו בערך המדויק.`,
          one: H`החסם $1$ אינו שואף ל־$0$.`,
        }),
        slot('lim', ['zero', 'one', 'inf'], 'zero'),
      ])),
      choicePart('D2-4-compare', H`מה המסקנה?`, [
        { id: 'mismatch', correct: true, label: H`$f_n\to f=0$ במידה שווה, אבל $f'(1)=0\ne\frac12=g(1)$: הנגזרת של הגבול אינה גבול הנגזרות.` },
        { id: 'match', correct: false, label: H`$f'=g$ בכל הקטע, כי $f_n$ מתכנסות במידה שווה.`, diagnosis: H`$f\equiv0$ ולכן $f'(1)=0$, בעוד ש־$g(1)=\frac12$.` },
        { id: 'contradiction', correct: false, label: 'הדוגמה סותרת את משפט הגזירה.', diagnosis: 'התנאי השלישי של המשפט (התכנסות במידה שווה של הנגזרות) אינו מתקיים, ולכן אין סתירה.' },
      ]),
    ],
    hints: [H`השוו את $f'(1)$ עם $g(1)$.`],
    solvedNote: H`התכנסות במידה שווה של $f_n$ אינה מספיקה כדי שגבול הנגזרות יהיה הנגזרת של הגבול; המשפט דורש התכנסות במידה שווה של הנגזרות.`,
    graph: graph({ limit: true, band: true, derivative: true, derivLimit: true, derivBand: true }),
  },
];

// ---------------------------------------------------------------------------------------------
// D3: f_n(x) = n on [0,1] — derivatives converge uniformly, the sequence converges nowhere
// ---------------------------------------------------------------------------------------------

const D3_STEPS: DerStep[] = [
  {
    id: 'D3-1',
    exampleId: 'D3',
    title: 'סדרת הנגזרות',
    prompt: H`חשבו את הנגזרות של $f_n(x)=n$.`,
    parts: [
      slotsPart(template('D3-1-prime', [L(H`f_n'(x)=`), S('v')], [
        slot('v', ['zero', 'one', 'n'], 'zero', { one: H`$n$ קבוע ביחס ל־$x$.`, n: H`הגזירה היא לפי $x$, ו־$n$ קבוע.` }),
      ])),
    ],
    hints: [H`נגזרת של קבוע היא $0$.`],
    solvedNote: H`$f_n'\equiv0$ לכל $n$, ולכן סדרת הנגזרות מתכנסת במידה שווה (לפונקציה $0$).`,
    graph: graph({ derivative: true, derivLimit: true, derivBand: true }),
  },
  {
    id: 'D3-2',
    exampleId: 'D3',
    title: 'איזה תנאי נכשל?',
    prompt: H`ובכל זאת $f_n(x)=n\to\infty$ בכל נקודה. איזה תנאי של משפט הגזירה אינו מתקיים?`,
    parts: [
      choicePart('D3-2-condition', H`בחרו את התנאי.`, [
        { id: 'point', correct: true, label: H`התנאי של התכנסות בנקודה אחת לפחות: $\{f_n(x_0)\}$ אינה מתכנסת באף נקודה.` },
        { id: 'uniform-derivatives', correct: false, label: 'התנאי של התכנסות במידה שווה של הנגזרות.', diagnosis: H`$f_n'\equiv0$ מתכנסות במידה שווה.` },
        { id: 'differentiable', correct: false, label: H`התנאי ש־$f_n$ גזירות.`, diagnosis: 'פונקציה קבועה גזירה בכל נקודה.' },
      ]),
    ],
    hints: [H`בדקו כל תנאי בנפרד.`],
    solvedNote: H`בלי התכנסות בנקודה אחת לפחות, התכנסות במידה שווה של הנגזרות אינה מספיקה: היא קובעת את $f_n$ רק עד כדי קבוע, וכאן הקבועים בורחים לאינסוף.`,
    graph: graph({ derivative: true, derivLimit: true, derivBand: true }),
  },
];

export const DER_STEPS: Record<DerExampleId, DerStep[]> = {
  D1: D1_STEPS,
  D2: D2_STEPS,
  D3: D3_STEPS,
};

/** Graph state at step `index`: the solved state, or the state left by the previous step. */
export function derGraphFlagsFor(steps: DerStep[], index: number, solved: boolean): DerGraphFlags {
  if (solved) return steps[index].graph;
  if (index > 0) return steps[index - 1].graph;
  return graph({});
}
