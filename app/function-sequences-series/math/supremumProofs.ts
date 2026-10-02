/**
 * Complete model proofs of the five supremum-test examples, shown in a pop-up when the student
 * finishes an example. Pure TypeScript, no React. Each proof follows the order and the arguments of
 * the example's steps in supremumArgument.ts. Hebrew with inline $...$ math; `display` is LaTeX.
 */
import { EXISTENCE_PROOF } from "./supremumArgument";
import type { SupExampleId } from "./supremumExamples";

const H = String.raw;

export type { ProofSection } from "./guidedSteps";
import type { ProofSection } from "./guidedSteps";

/** The complete, concise proof of one example, shown in a pop-up when the student finishes the example. */
export type FullProof = { sections: readonly ProofSection[] };

/** The approved minimal existence argument on [0,∞), shared with the E1-3 and E2-2 step feedback. */
const EXISTENCE_UNBOUNDED = EXISTENCE_PROOF;

export const SUP_FULL_PROOFS: Record<SupExampleId, FullProof> = {
  E1: {
    sections: [
      {
        heading: H`הגבול הנקודתי`,
        body: H`ב־$x_0=0$ מתקיים $f_n(0)=0$ לכל $n$. לכל $x_0>0$ מתקיים $f_n(x_0)=x_0\cdot ne^{-nx_0}\to0$, כי מעריכית גוברת על כל חזקה של $n$. לכן $f_n\to f=0$ נקודתית ב־$[0,\infty)$.`,
      },
      {
        heading: H`הגדרת $M_n$`,
        body: H`$f_n(x)=nxe^{-nx}\ge0$ לכל $x\ge0$, ולכן $\lvert f_n(x)-f(x)\rvert=f_n(x)$ ומתקבל:`,
        display: H`M_n=\sup_{x\ge0}f_n(x).`,
      },
      {
        heading: H`קיום מקסימום`,
        body: EXISTENCE_UNBOUNDED,
      },
      {
        heading: H`מציאת המקסימום`,
        body: H`$f_n$ גזירה ב־$(0,\infty)$, ולפי משפט פרמה, אם המקסימום מתקבל בנקודה פנימית אז הנגזרת מתאפסת בה. הנגזרת היא`,
        display: H`f_n'(x)=ne^{-nx}(1-nx),\qquad f_n'(x)=0\iff x=\tfrac1n.`,
      },
      {
        heading: H`חישוב $M_n$ והמסקנה`,
        body: H`המקסימום הוא אחד המועמדים: $f_n(0)=0$, הגבול באינסוף הוא $0$, ו־$f_n(\frac1n)=\frac1e>0$. לכן $M_n=\frac1e$ לכל $n$, ובפרט $M_n\not\to0$. לפי מבחן הסופרמום, ההתכנסות ב־$[0,\infty)$ אינה במידה שווה.`,
        display: H`M_n=f_n\!\left(\tfrac1n\right)=\frac1e\ \xrightarrow[n\to\infty]{}\ \frac1e\ne0.`,
      },
    ],
  },
  E1p: {
    sections: [
      {
        heading: H`הגבול הנקודתי`,
        body: H`לכל $x_0\ge1$ מתקיים $f_n(x_0)=x_0\cdot ne^{-nx_0}\to0$, כי מעריכית גוברת על כל חזקה של $n$. לכן $f_n\to f=0$ נקודתית ב־$[1,\infty)$.`,
      },
      {
        heading: H`הגדרת $M_n$`,
        body: H`$f_n(x)=nxe^{-nx}\ge0$, ולכן $\lvert f_n(x)-f(x)\rvert=f_n(x)$ ומתקבל:`,
        display: H`M_n=\sup_{x\ge1}f_n(x).`,
      },
      {
        heading: H`מונוטוניות ומיקום המקסימום`,
        body: H`הנגזרת $f_n'(x)=ne^{-nx}(1-nx)$ מתאפסת רק ב־$x=\frac1n\le1$, כלומר אין נקודה חשודה לקיצון פנימית. לכל $x\ge1$ מתקיים $nx\ge n\ge1$, ולכן $1-nx\le0$ ו־$f_n'\le0$. מכאן $f_n$ יורדת ב־$[1,\infty)$ ו־$f_n(x)\le f_n(1)$ לכל $x\ge1$, כלומר המקסימום קיים ומתקבל בקצה $x=1$.`,
      },
      {
        heading: H`חישוב $M_n$ והמסקנה`,
        body: H`לפי מבחן הסופרמום, מכיוון ש־$M_n\to0$ (מעריכית גוברת על $n$), ההתכנסות ב־$[1,\infty)$ במידה שווה.`,
        display: H`M_n=f_n(1)=ne^{-n}\ \xrightarrow[n\to\infty]{}\ 0.`,
      },
    ],
  },
  E2: {
    sections: [
      {
        heading: H`הגבול הנקודתי`,
        body: H`ב־$x_0=0$ מתקיים $f_n(0)=0$. לכל $x_0>0$ מתקיים $f_n(x_0)=x_0^2\cdot ne^{-nx_0}\to0$, כי $x_0^2$ קבוע ומעריכית גוברת על $n$. לכן $f_n\to f=0$ נקודתית ב־$[0,\infty)$.`,
      },
      {
        heading: H`הגדרת $M_n$`,
        body: H`$f_n(x)=nx^2e^{-nx}\ge0$, ולכן $\lvert f_n(x)-f(x)\rvert=f_n(x)$ ומתקבל:`,
        display: H`M_n=\sup_{x\ge0}f_n(x).`,
      },
      {
        heading: H`קיום מקסימום`,
        body: EXISTENCE_UNBOUNDED,
      },
      {
        heading: H`מציאת המקסימום`,
        body: H`$f_n$ גזירה ב־$(0,\infty)$, ולפי משפט פרמה, אם המקסימום מתקבל בנקודה פנימית אז הנגזרת מתאפסת בה. הנגזרת היא`,
        display: H`f_n'(x)=nxe^{-nx}(2-nx),\qquad f_n'(x)=0,\ x>0\iff x=\tfrac2n.`,
      },
      {
        heading: H`חישוב $M_n$ והמסקנה`,
        body: H`המועמדים: $f_n(0)=0$, הגבול באינסוף הוא $0$, ו־$f_n(\frac2n)=n\cdot\frac{4}{n^2}\cdot e^{-2}>0$. לכן המקסימום מתקבל ב־$\frac2n$. לפי מבחן הסופרמום, מכיוון ש־$M_n\to0$, ההתכנסות ב־$[0,\infty)$ במידה שווה.`,
        display: H`M_n=f_n\!\left(\tfrac2n\right)=\frac{4}{ne^2}\ \xrightarrow[n\to\infty]{}\ 0.`,
      },
    ],
  },
  E3: {
    sections: [
      {
        heading: H`הגבול הנקודתי`,
        body: H`לכל $0\le x_0<1$ מתקיים $x_0^n\to0$, ולכן $f_n(x_0)=x_0^n(1-x_0^n)\to0$. ב־$x=1$ מתקיים $f_n(1)=1\cdot(1-1)=0$ לכל $n$. לכן $f_n\to f=0$ נקודתית בכל $[0,1]$.`,
      },
      {
        heading: H`הגדרת $M_n$`,
        body: H`ב־$[0,1]$ מתקיים $0\le x^n\le1$, ולכן $f_n(x)=x^n(1-x^n)\ge0$ ומתקבל:`,
        display: H`M_n=\sup_{x\in[0,1]}f_n(x).`,
      },
      {
        heading: H`קיום מקסימום`,
        body: H`$f_n$ רציפה על הקטע הסגור והחסום $[0,1]$, ולכן לפי משפט ויירשטראס היא מקבלת בו מקסימום.`,
      },
      {
        heading: H`מציאת המקסימום`,
        body: H`הקצוות $0$ ו־$1$ הם מועמדים. ב־$(0,1)$ הפונקציה גזירה, ולפי משפט פרמה, אם המקסימום מתקבל בנקודה פנימית אז הנגזרת מתאפסת בה:`,
        display: H`f_n'(x)=nx^{n-1}(1-2x^n),\qquad f_n'(x)=0,\ x>0\iff x^n=\tfrac12\iff x=2^{-1/n}\in(0,1).`,
      },
      {
        heading: H`חישוב $M_n$ והמסקנה`,
        body: H`$f_n(0)=f_n(1)=0$, ו־$f_n(2^{-1/n})=\frac12\left(1-\frac12\right)=\frac14>0$. לכן המקסימום הוא $\frac14$ לכל $n$, ובפרט $M_n\not\to0$. לפי מבחן הסופרמום, ההתכנסות ב־$[0,1]$ אינה במידה שווה.`,
        display: H`M_n=f_n\!\left(2^{-1/n}\right)=\frac14\ \xrightarrow[n\to\infty]{}\ \frac14\ne0.`,
      },
    ],
  },
  E3p: {
    sections: [
      {
        heading: H`הגבול הנקודתי`,
        body: H`לכל $0\le x_0\le\frac12$ מתקיים $x_0^n\to0$, ולכן $f_n(x_0)=x_0^n(1-x_0^n)\to0$. לכן $f_n\to f=0$ נקודתית ב־$\left[0,\frac12\right]$.`,
      },
      {
        heading: H`הגדרת $M_n$`,
        body: H`ב־$\left[0,\frac12\right]$ מתקיים $0\le x^n\le1$, ולכן $f_n(x)\ge0$ ומתקבל:`,
        display: H`M_n=\sup_{x\in[0,1/2]}f_n(x).`,
      },
      {
        heading: H`מונוטוניות ומיקום המקסימום`,
        body: H`הנגזרת $f_n'(x)=nx^{n-1}(1-2x^n)$ מתאפסת ב־$x>0$ רק ב־$x=2^{-1/n}\ge\frac12$, כלומר אין נקודה חשודה לקיצון פנימית. לכל $0\le x\le\frac12$ מתקיים $2x^n\le2^{1-n}\le1$, ולכן $f_n'\ge0$. מכאן $f_n$ עולה ב־$\left[0,\frac12\right]$ ו־$f_n(x)\le f_n(\frac12)$ לכל $x$ בקטע, כלומר המקסימום קיים ומתקבל בקצה הימני $x=\frac12$.`,
      },
      {
        heading: H`חישוב $M_n$ והמסקנה`,
        body: H`לפי מבחן הסופרמום, מכיוון ש־$M_n\le2^{-n}\to0$, ההתכנסות ב־$\left[0,\frac12\right]$ במידה שווה.`,
        display: H`M_n=f_n\!\left(\tfrac12\right)=2^{-n}\left(1-2^{-n}\right)\le2^{-n}\ \xrightarrow[n\to\infty]{}\ 0.`,
      },
    ],
  },
};
