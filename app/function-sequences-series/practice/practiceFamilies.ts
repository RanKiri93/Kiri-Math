/**
 * The exercise families of the summary practice. DEMO: two small families that exercise the
 * infrastructure (drawing, validation, the card UI). The real bank is designed later, family by
 * family, with the course owner; replace or extend this list then.
 */
import { L, S, choicePart, slot, slotsPart, template } from "../math/guidedSteps";
import type { TokenLabel } from "../math/supremumTypes";
import type { PracticeFamily } from "./practiceTypes";
import { CONTINUITY_FAMILIES } from "./continuityFamilies";
import { SUPREMUM_FAMILIES } from "./supremumFamilies";
import { UNIFORM_FAMILIES } from "./uniformFamilies";

const H = String.raw;
const latex = (value: string): TokenLabel => ({ latex: value });

/** A rational in lowest terms, as LaTeX ("\tfrac{2}{3}" or "1"). */
function fraction(numerator: number, denominator: number): string {
  return denominator === 1 ? String(numerator) : `\\tfrac{${numerator}}{${denominator}}`;
}

/**
 * x^n on [0,b] with b < 1: converges uniformly to 0, M_n = b^n.
 * Parameters: b ∈ {1/3, 1/2, 2/3, 3/4}. Difficulty: easy (one supremum, monotone function).
 */
const POWER_ON_SUBINTERVAL: PracticeFamily = {
  id: "power-on-subinterval",
  topic: "pointwise",
  difficulties: ["easy"],
  generate(rng) {
    const [p, q] = rng.pick([[1, 3], [1, 2], [2, 3], [3, 4]] as const);
    const b = fraction(p, q);
    const bPow = `\\left(${b}\\right)^n`;
    return {
      familyId: this.id,
      signature: `b=${p}/${q}`,
      topic: this.topic,
      difficulty: "easy",
      title: "התכנסות במידה שווה בתת־קטע",
      plot: {
        value: (n, x) => x ** n,
        limit: () => 0,
        domain: { left: 0, right: p / q, leftClosed: true, rightClosed: true },
        view: { xMin: 0, xMax: 1.1, yMin: -0.06, yMax: 1.1 },
        maxN: 40,
      },
      statement: H`בדקו האם הסדרה מתכנסת במידה שווה בקטע $\left[0,${b}\right]$.`,
      formulaLatex: H`f_n(x)=x^n,\quad x\in\left[0,${b}\right]`,
      tokens: {
        zero: latex("0"),
        one: latex("1"),
        b: latex(b),
        "b-pow": latex(bPow),
        inf: latex("\\infty"),
      },
      steps: [
        {
          id: "pos-1",
          exampleId: "practice",
          title: "הגבול הנקודתי",
          prompt: H`חשבו את הגבול הנקודתי בקטע.`,
          parts: [slotsPart(template("pos-1-limit", [L(H`0\le x\le ${b}:\quad \lim_{n\to\infty}x^n=`), S("v")], [
            slot("v", ["zero", "one", "b", "inf"], "zero", { one: H`$1$ מתקבל רק ב־$x=1$, שאינו בקטע.` }),
          ]))],
          hints: [H`$0\le x\le ${b}<1$.`],
          solvedNote: H`$f_n\to f=0$ נקודתית בקטע.`,
          graph: null,
        },
        {
          id: "pos-2",
          exampleId: "practice",
          title: H`חישוב $M_n$`,
          prompt: H`$x^n$ עולה בקטע. חשבו את $M_n=\sup_{x\in[0,${b}]}\lvert x^n-0\rvert$.`,
          parts: [slotsPart(template("pos-2-mn", [L(H`M_n=`), S("v"), L(H`\xrightarrow[n\to\infty]{}`), S("lim")], [
            slot("v", ["b-pow", "one", "b", "zero"], "b-pow", {
              one: H`$1$ הוא הסופרמום ב־$[0,1]$; כאן הקטע מסתיים ב־$${b}$.`,
              b: H`זה הערך של $f_1$; עבור $n$ כללי הציבו $x=${b}$ ב־$x^n$.`,
            }),
            slot("lim", ["zero", "one", "inf"], "zero"),
          ]))],
          hints: [H`פונקציה עולה מקבלת את המקסימום בקצה הימני.`],
          solvedNote: H`$M_n=${bPow}\to0$.`,
          graph: null,
        },
        {
          id: "pos-3",
          exampleId: "practice",
          title: "המסקנה",
          prompt: H`מה המסקנה לפי מבחן הסופרמום?`,
          parts: [choicePart("pos-3-verdict", H`בחרו את המסקנה.`, [
            { id: "uniform", correct: true, label: H`ההתכנסות בקטע במידה שווה, כי $M_n\to0$.` },
            { id: "not-uniform", correct: false, label: H`ההתכנסות אינה במידה שווה, כי ב־$[0,1]$ היא אינה במידה שווה.`, diagnosis: H`סוג ההתכנסות תלוי בתחום: כאן הקטע אינו מגיע ל־$1$.` },
          ])],
          hints: [H`מבחן הסופרמום: התכנסות במידה שווה אם ורק אם $M_n\to0$.`],
          solvedNote: H`$M_n\to0$, ולכן $x^n\to0$ במידה שווה ב־$\left[0,${b}\right]$.`,
          graph: null,
        },
      ],
    };
  },
};

/**
 * x^n/(c + x^n) on [0,2]: the limit jumps at x=1 (0, 1/(c+1), 1), so the convergence is not
 * uniform by the continuity theorem. Parameters: c ∈ {1, 2, 3}. Difficulty: medium.
 */
const JUMPING_LIMIT: PracticeFamily = {
  id: "jumping-limit",
  topic: "continuity",
  difficulties: ["medium"],
  generate(rng) {
    const c = rng.pick([1, 2, 3] as const);
    const atOne = fraction(1, c + 1);
    const fnLatex = c === 1 ? "\\frac{x^n}{1+x^n}" : `\\frac{x^n}{${c}+x^n}`;
    return {
      familyId: this.id,
      signature: `c=${c}`,
      topic: this.topic,
      difficulty: "medium",
      title: "גבול לא רציף",
      plot: {
        value: (n, x) => x ** n / (c + x ** n),
        limit: (x) => (x < 1 ? 0 : x === 1 ? 1 / (c + 1) : 1),
        domain: { left: 0, right: 2, leftClosed: true, rightClosed: true },
        view: { xMin: 0, xMax: 2.1, yMin: -0.06, yMax: 1.15 },
        maxN: 40,
      },
      statement: H`האם הסדרה מתכנסת במידה שווה בקטע $[0,2]$?`,
      formulaLatex: H`f_n(x)=${fnLatex},\quad x\in[0,2]`,
      tokens: { zero: latex("0"), one: latex("1"), "at-one": latex(atOne), half: latex("\\tfrac12"), inf: latex("\\infty") },
      steps: [
        {
          id: "jl-1",
          exampleId: "practice",
          title: "הגבול הנקודתי",
          prompt: H`חשבו את הגבול הנקודתי בכל אחד משלושת חלקי הקטע.`,
          parts: [
            slotsPart(template("jl-1-below", [L(H`0\le x<1:\quad \lim f_n(x)=`), S("v")], [slot("v", ["zero", "one", "at-one"], "zero")])),
            slotsPart(template("jl-1-at", [L(H`x=1:\quad \lim f_n(1)=`), S("v")], [
              slot("v", ["zero", "one", "at-one", ...(atOne === "\\tfrac{1}{2}" ? [] : ["half"])], "at-one", { half: H`הציבו $x=1$: $\frac{1}{${c}+1}$.` }),
            ])),
            slotsPart(template("jl-1-above", [L(H`1<x\le2:\quad \lim f_n(x)=`), S("v")], [
              slot("v", ["zero", "one", "inf"], "one", { inf: H`חלקו מונה ומכנה ב־$x^n$.` }),
            ])),
          ],
          hints: [H`ב־$x>1$ חלקו מונה ומכנה ב־$x^n$.`],
          solvedNote: H`הגבול הוא $0$ ב־$[0,1)$, $${atOne}$ ב־$x=1$ ו־$1$ ב־$(1,2]$.`,
          graph: null,
        },
        {
          id: "jl-2",
          exampleId: "practice",
          title: "המסקנה",
          prompt: H`כל $f_n$ רציפה ב־$[0,2]$. מה המסקנה?`,
          parts: [choicePart("jl-2-verdict", H`בחרו את המסקנה.`, [
            { id: "not-uniform", correct: true, label: H`ההתכנסות אינה במידה שווה: $f_n$ רציפות והגבול אינו רציף ב־$x=1$.` },
            { id: "uniform", correct: false, label: H`ההתכנסות במידה שווה, כי הגבול קיים בכל נקודה.`, diagnosis: "קיום הגבול בכל נקודה הוא התכנסות נקודתית בלבד." },
          ])],
          hints: [H`האם הגבול רציף?`],
          solvedNote: H`לפי משפט הרציפות, גבול במידה שווה של פונקציות רציפות רציף; כאן הגבול קופץ ב־$x=1$.`,
          graph: null,
        },
      ],
    };
  },
};

export const PRACTICE_FAMILIES: readonly PracticeFamily[] = [POWER_ON_SUBINTERVAL, JUMPING_LIMIT, ...SUPREMUM_FAMILIES, ...UNIFORM_FAMILIES, ...CONTINUITY_FAMILIES];
