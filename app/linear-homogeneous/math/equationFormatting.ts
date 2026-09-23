import nerdamer from "nerdamer";
import "nerdamer/Algebra.js";
import "./nerdamerConfig";
import { rewriteInversePowersAsQuotient } from "./displayQuotient";
import { parseFormula, toLatex, type FormulaAst } from "./formulaParser";

const nerdamerWithLatex = nerdamer as typeof nerdamer & {
  convertToLaTeX: (expression: string) => string;
};

const derivativeSuffix: Record<number, string> = {
  0: "y",
  1: "y'",
  2: "y''",
  3: "y'''",
  4: "y^{(4)}",
};

export function expressionToLatex(expression: string): string {
  const trimmed = rewriteInversePowersAsQuotient(expression.trim());
  if (trimmed === "0" || trimmed === "-0") {
    return "0";
  }
  try {
    return parseFormula(trimmed).latex;
  } catch {
    try {
      return nerdamerWithLatex
        .convertToLaTeX(trimmed)
        .replaceAll("\\mathrm{log}", "\\ln");
    } catch {
      return trimmed;
    }
  }
}

export function basisAstToLatex(ast: FormulaAst): string {
  return toLatex(ast);
}

/**
 * Format the normalized equation
 *   y^(n) + a_(n-1) y^(n-1) + ... + a_0 y = 0
 * Coefficients are indexed as coefficients[k] = a_k.
 */
export function homogeneousEquationLatex(order: number, coefficients: string[]): string {
  if (coefficients.length !== order) {
    throw new Error("homogeneousEquationLatex: coefficient count must equal order");
  }

  let latex = derivativeSuffix[order] ?? `y^{(${order})}`;
  for (let k = order - 1; k >= 0; k -= 1) {
    latex += signedCoefficientLatex(coefficients[k], derivativeSuffix[k] ?? `y^{(${k})}`);
  }
  return `${latex}=0`;
}

export function signedCoefficientLatex(expression: string, suffix: string): string {
  const simplified = normalizeCoefficientExpression(expression);
  if (simplified === "0" || simplified === "-0") {
    return "";
  }
  if (simplified === "1") {
    return `+${suffix}`;
  }
  if (simplified === "-1") {
    return `-${suffix}`;
  }
  if (simplified.startsWith("-")) {
    return `-${coefficientBodyLatex(simplified.slice(1), suffix)}`;
  }
  return `+${coefficientBodyLatex(simplified, suffix)}`;
}

function coefficientBodyLatex(expression: string, suffix: string): string {
  const displayExpression = rewriteInversePowersAsQuotient(expression);
  const latex = expressionToLatex(displayExpression);
  // Bare integers / simple numeric fractions sit flush against y, y', …
  if (/^-?[0-9]+$/.test(displayExpression) || /^[0-9]+\/[0-9]+$/.test(displayExpression)) {
    return `${latex}${suffix}`;
  }
  // Already a typeset fraction — avoid an extra outer parenthesis shell.
  if (latex.startsWith("\\frac") || latex.startsWith("-\\frac")) {
    return `${latex}${suffix}`;
  }
  return `\\left(${latex}\\right)${suffix}`;
}

function normalizeCoefficientExpression(expression: string): string {
  const trimmed = rewriteInversePowersAsQuotient(expression.trim());
  if (!trimmed) return "0";
  // Avoid nerdamer.simplify here: it can recombine expanded forms such as
  // (3/4)*(1+x)^(-2)-4 into a less useful single fraction.
  try {
    return rewriteInversePowersAsQuotient(nerdamer(trimmed).toString());
  } catch {
    return trimmed;
  }
}

/**
 * y(x) = C_1 y1 + ... + C_n yn, omitting awkward "*1" factors.
 */
export function generalSolutionLatex(basisLatex: string[]): string {
  if (basisLatex.length === 0) {
    return "y(x)=0";
  }

  const terms = basisLatex.map((latex, index) => {
    const constant = `C_{${index + 1}}`;
    if (latex === "1") {
      return constant;
    }
    if (latex === "0") {
      return "";
    }
    return `${constant}\\,${latex}`;
  }).filter(Boolean);

  if (terms.length === 0) {
    return "y(x)=0";
  }

  let body = terms[0];
  for (const term of terms.slice(1)) {
    body += term.startsWith("-") ? term : `+${term}`;
  }
  return `y(x)=${body}`;
}

export function wronskianLatex(order: number, wronskianExpression: string): string {
  const labels = Array.from({ length: order }, (_, index) => `y_${index + 1}`).join(",");
  return `W[${labels}](x)=${expressionToLatex(wronskianExpression)}`;
}
