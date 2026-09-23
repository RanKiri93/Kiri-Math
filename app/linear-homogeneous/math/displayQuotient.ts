/**
 * Display-oriented rewriting of inverse-power products into quotients.
 *
 * Symbolic algebra may keep forms like (1+x)^(-1)*(2*x+3); for human display
 * we prefer (2*x+3)/(1+x) so LaTeX can render a real fraction.
 *
 * This is cosmetic only — callers must not use the result for verification.
 */

export function rewriteInversePowersAsQuotient(expression: string): string {
  const trimmed = expression.trim();
  if (!trimmed || !/\^\(-\d+\)/.test(trimmed)) {
    return trimmed;
  }

  const terms = splitTopLevelSum(trimmed);
  if (terms.length === 0) {
    return trimmed;
  }

  const rewritten = terms.map((term) => rewriteProductTerm(term.expression, term.sign));
  let result = rewritten[0];
  for (const part of rewritten.slice(1)) {
    result += part.startsWith("-") ? part : `+${part}`;
  }
  return result;
}

type SignedTerm = { sign: 1 | -1; expression: string };

function splitTopLevelSum(expression: string): SignedTerm[] {
  const terms: SignedTerm[] = [];
  let depth = 0;
  let start = 0;
  let sign: 1 | -1 = 1;

  for (let index = 0; index < expression.length; index += 1) {
    const char = expression[index];
    if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    else if (depth === 0 && (char === "+" || char === "-")) {
      if (index === start) {
        // Leading sign of the first term / unary after operator.
        sign = char === "-" ? -1 : 1;
        start = index + 1;
        continue;
      }
      const piece = expression.slice(start, index).trim();
      if (piece) {
        terms.push({ sign, expression: piece });
      }
      sign = char === "-" ? -1 : 1;
      start = index + 1;
    }
  }

  const last = expression.slice(start).trim();
  if (last) {
    terms.push({ sign, expression: last });
  }
  return terms;
}

function rewriteProductTerm(expression: string, sign: 1 | -1): string {
  const factors = splitTopLevelProduct(expression);
  if (factors.length === 0) {
    return sign === -1 ? `-(${expression})` : expression;
  }

  const numerator: string[] = [];
  const denominator: string[] = [];

  for (const factor of factors) {
    const inverse = matchNegativePowerFactor(factor);
    if (inverse) {
      denominator.push(inverse.power === 1 ? inverse.base : `(${inverse.base})^(${inverse.power})`);
    } else {
      numerator.push(factor);
    }
  }

  if (denominator.length === 0) {
    const body = factors.join("*");
    return sign === -1 ? (body.startsWith("-") ? body.slice(1) : `-${body}`) : body;
  }

  const numBody = numerator.length === 0 ? "1" : numerator.length === 1 ? numerator[0] : numerator.join("*");
  const denBody = denominator.length === 1 ? denominator[0] : denominator.join("*");
  const quotient = `(${numBody})/(${denBody})`;
  return sign === -1 ? `-(${quotient})` : quotient;
}

function splitTopLevelProduct(expression: string): string[] {
  const factors: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < expression.length; index += 1) {
    const char = expression[index];
    if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    else if (char === "*" && depth === 0) {
      const piece = expression.slice(start, index).trim();
      if (piece) factors.push(piece);
      start = index + 1;
    }
  }

  const last = expression.slice(start).trim();
  if (last) factors.push(last);
  return factors;
}

function matchNegativePowerFactor(
  factor: string,
): { base: string; power: number } | undefined {
  const trimmed = factor.trim();
  // (base)^(-n)
  const parenPower = trimmed.match(/^\((.+)\)\^\(-(\d+)\)$/);
  if (parenPower) {
    return { base: parenPower[1], power: Number(parenPower[2]) };
  }
  // x^(-n) or identifier^(-n)
  const barePower = trimmed.match(/^([A-Za-z]|[0-9]+)\^\(-(\d+)\)$/);
  if (barePower) {
    return { base: barePower[1], power: Number(barePower[2]) };
  }
  return undefined;
}
