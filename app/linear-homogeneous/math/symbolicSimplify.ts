import nerdamer from "nerdamer";
import "nerdamer/Algebra.js";
import { simplifyExpression } from "./fundamentalCompletionVerifier";
import {
  ensureSymbolicNerdamerMode,
  looksLikeRationalizedConstant,
  safeEvaluate,
} from "./nerdamerConfig";

type SymbolicExpression = nerdamer.Expression & {
  simplify: () => SymbolicExpression;
  evaluate: (substitutions?: Record<string, string>) => { text: () => string };
};

/**
 * Light simplify without expand. Safer for some quotients where nerdamer's
 * expand path can drop signs.
 */
export function lightSimplify(expression: string): string {
  ensureSymbolicNerdamerMode();
  try {
    const simplified = (nerdamer(expression) as SymbolicExpression).simplify().toString();
    // Never accept a rewrite that materializes a rationalized e/pi approximation.
    if (looksLikeRationalizedConstant(simplified) && !looksLikeRationalizedConstant(expression)) {
      return expression.trim();
    }
    return simplified;
  } catch {
    ensureSymbolicNerdamerMode();
    return expression.trim();
  }
}

export function containsRadicals(expression: string): boolean {
  return /sqrt|\^\(1\/2\)|\^\(-1\/2\)|\^\(\d+\/2\)|\^\(-\d+\/2\)/.test(expression);
}

export function expressionComplexity(expression: string): number {
  const trimmed = expression.replace(/\s+/g, "");
  const operators = (trimmed.match(/[+\-*/^(),]/g) ?? []).length;
  const expMentions = (trimmed.match(/e\^|exp\(/g) ?? []).length;
  const polyDegreeHint = Math.max(
    0,
    ...[...(trimmed.matchAll(/\^(\d+)/g) ?? [])].map((match) => Number(match[1])),
  );
  return trimmed.length + 4 * operators + 8 * expMentions + 3 * polyDegreeHint;
}

/**
 * Prefer a candidate rewrite only when it is no more complex than the original
 * (with a small tolerance for parentheses / canonical punctuation).
 * Uses displayScore so partial-fraction splits do not beat compact rationals.
 */
export function preferSimpler(original: string, candidate: string): string {
  if (!candidate || candidate === original) {
    return original;
  }
  if (looksLikeRationalizedConstant(candidate) && !looksLikeRationalizedConstant(original)) {
    return original;
  }
  return displayScore(candidate) <= displayScore(original) + 8 ? candidate : original;
}

function stripOuterParentheses(expression: string): string {
  // Protect negative-power markers so (-1) inside ^(-1) is not stripped.
  let result = expression.replace(/\s+/g, "").replace(/\^\(-1\)/g, "^INV");
  let previous = "";
  while (result !== previous) {
    previous = result;
    result = result.replace(/\([^()]*\)/g, "P");
  }
  return result;
}

/**
 * Prefer compact single-rational forms over partial fractions / leftover exps.
 */
export function displayScore(expression: string): number {
  let score = expressionComplexity(expression);
  score += 50 * (expression.match(/e\^|exp\(/g) ?? []).length;
  const stripped = stripOuterParentheses(expression);
  // Penalize A ± B^(-1) partial-fraction splits, but not intentional
  // differences like (3/4)*(1+x)^(-2)-4.
  if (/P\^INV[+-](?:P|[0-9.]+)|(?:^|-)(?:P|[0-9.]+)[+-]P\^INV/.test(stripped)) {
    score += 120;
  }
  return score;
}

/**
 * Factor a shared exponential out of a sum when every term carries it.
 * Example: e^(3*x)+e^(3*x)*x -> (e^(3*x))*(1+x)
 *
 * Avoid expand on radical expressions — nerdamer corrupts those identities.
 */
export function factorSharedExponential(expression: string): string {
  if (containsRadicals(expression)) {
    return lightSimplify(expression);
  }

  const light = lightSimplify(expression);
  const exponents = uniqueExponentialExponents(light);
  if (exponents.length === 0) {
    return light;
  }

  let best = light;
  for (const exponent of exponents) {
    const factor = exponentialFactor(exponent);
    try {
      // Multiply by exp(-exponent) then expand: this cancels shared exponentials
      // that plain simplify leaves intact.
      const cleared = nerdamer(`(${light})*(${factor})^(-1)`).expand().toString();
      if (looksLikeRationalizedConstant(cleared)) {
        ensureSymbolicNerdamerMode();
        continue;
      }
      const clearedSimp = lightSimplify(cleared);
      if (containsExponential(clearedSimp) || containsRadicals(clearedSimp)) {
        continue;
      }
      const rebuilt = `(${factor})*(${clearedSimp})`;
      best = preferSimpler(best, rebuilt);
    } catch {
      ensureSymbolicNerdamerMode();
      // try next exponent
    }
  }
  return best;
}

/**
 * Human-readable simplification for lab display:
 * preserve structure, cancel shared exponentials, avoid expand-first blow-up.
 */
export function readableSimplify(expression: string): string {
  const trimmed = expression.trim();
  if (!trimmed) return "0";
  if (containsRadicals(trimmed)) {
    return lightSimplify(trimmed);
  }

  const light = lightSimplify(trimmed);
  const factored = factorSharedExponential(light);
  let best = preferSimpler(light, factored);

  // Expand only when it improves display score AND stays numerically equivalent.
  // nerdamer expand can corrupt negative powers (e.g. (2*x+3)^(-1) -> ^4).
  try {
    const expanded = simplifyExpression(best).toString();
    if (
      displayScore(expanded) <= displayScore(best) + 8 &&
      agreesNumerically(best, expanded)
    ) {
      best = expanded;
    }
  } catch {
    // keep best
  }

  return preferFractionForm(best);
}

/**
 * Simplify a quotient for display: factor shared exponentials from numerator
 * and denominator, cancel them, then simplify the remaining rational part.
 */
export function readableQuotient(numerator: string, denominator: string): string {
  const den = denominator.trim();
  const num = numerator.trim();
  const preferred =
    den.startsWith("-")
      ? `(((-1)*(${num}))/((-1)*(${den})))`
      : `((${num})/(${den}))`;

  // Radical quotients: keep the structural form; expand/cancel corrupts them.
  if (containsRadicals(num) || containsRadicals(den)) {
    return preferred;
  }

  // Pre-factor each side so expand/simplify on the quotient can cancel
  // exponentials without first inflating raw Wronskian minors.
  const numReady = factorSharedExponential(num);
  const denReady = factorSharedExponential(den);
  const preferredReady =
    denReady.startsWith("-")
      ? `(((-1)*(${numReady}))/((-1)*(${denReady})))`
      : `((${numReady})/(${denReady}))`;

  const direct = preferFractionForm(readableSimplify(preferredReady));
  const cancelledExps = cancelSharedExponentials(numReady, denReady);
  const withGcd = cancelPolynomialGcd(cancelledExps.num, cancelledExps.den);
  const cancelled = preferFractionForm(lightSimplify(`(${withGcd.num})/(${withGcd.den})`));

  return preferSimpler(preferSimpler(direct, cancelled), preferFractionForm(lightSimplify(preferredReady)));
}

/**
 * Divide numerator by denominator with workarounds for nerdamer sign bugs
 * on negative denominators (e.g. 4/(-4*(1+x)) simplifying to +(1+x)^(-1)).
 */
export function safeDivide(numerator: string, denominator: string, options?: { allowSimplify?: boolean }): string {
  const den = denominator.trim();
  const num = numerator.trim();
  const allowSimplify = options?.allowSimplify ?? !containsRadicals(num);

  const preferred =
    den.startsWith("-")
      ? `(((-1)*(${num}))/((-1)*(${den})))`
      : `((${num})/(${den}))`;

  if (!allowSimplify || containsRadicals(num) || containsRadicals(den)) {
    return preferred;
  }

  // Prefer readable cancellation over expand-first simplifyExpression, which
  // can inflate (x+1)^n*exp(...) quotients into huge polynomials, and can
  // corrupt negative powers (e.g. (2*x+3)^(-1) -> ^4).
  const readable = readableQuotient(num, den);
  try {
    const expanded = simplifyExpression(preferred).toString();
    if (
      displayScore(expanded) <= displayScore(readable) + 8 &&
      agreesNumerically(preferred, expanded)
    ) {
      return preferFractionForm(expanded);
    }
  } catch {
    // keep readable
  }
  return readable;
}

export function safeSimplifyDeterminant(expression: string): string {
  if (!containsRadicals(expression)) {
    const readable = readableSimplify(expression);
    try {
      const expanded = simplifyExpression(expression).toString();
      if (
        expressionComplexity(expanded) <= expressionComplexity(readable) + 8 &&
        agreesNumerically(expression, expanded)
      ) {
        return expanded;
      }
    } catch {
      return readable;
    }
    return readable;
  }

  // Radical dets: accept a simplified form only when it is radical-free and
  // agrees numerically with the raw determinant (e.g. Delta -> -4). Reject
  // corrupted simplify results such as a wrong polynomial for Delta_0.
  for (const candidate of [() => lightSimplify(expression), () => simplifyExpression(expression).toString()]) {
    try {
      const simplified = candidate();
      if (!containsRadicals(simplified) && agreesNumerically(expression, simplified)) {
        return simplified;
      }
    } catch {
      // try next strategy
    }
  }

  return expression;
}

function agreesNumerically(left: string, right: string): boolean {
  ensureSymbolicNerdamerMode();
  const points = [0.5, 1, 2, 3, -0.5];
  let comparisons = 0;
  for (const point of points) {
    try {
      const leftValue = Number(
        safeEvaluate(nerdamer(left) as SymbolicExpression, { x: String(point) }),
      );
      const rightValue = Number(
        safeEvaluate(nerdamer(right) as SymbolicExpression, { x: String(point) }),
      );
      if (!Number.isFinite(leftValue) || !Number.isFinite(rightValue)) {
        continue;
      }
      comparisons += 1;
      if (Math.abs(leftValue - rightValue) > 1e-6 * (1 + Math.abs(leftValue))) {
        return false;
      }
    } catch {
      // skip non-evaluable sample points; safeEvaluate restores symbolic mode
    }
  }
  return comparisons >= 2;
}

export function detectIntegerLinearShift(expression: string): number | undefined {
  const xPlusConstant = expression.match(/\(x([+-]\d+)\)/);
  if (xPlusConstant) {
    return Number(xPlusConstant[1]);
  }
  const constantPlusX = expression.match(/\((-?\d+)\+x\)/);
  if (constantPlusX) {
    return Number(constantPlusX[1]);
  }
  return undefined;
}

/**
 * Compact an expression by substituting x = u - shift, simplifying in u,
 * then substituting back. Essential for radical coefficients such as
 * 3/(4*(x+1)^2)-4 that nerdamer cannot simplify in x directly.
 */
export function compactViaLinearShift(expression: string, shiftHint: string): string {
  const shift = detectIntegerLinearShift(shiftHint) ?? detectIntegerLinearShift(expression);
  if (shift === undefined) {
    return expression;
  }

  try {
    const inU = (nerdamer(expression, { x: `(u-(${shift}))` }) as SymbolicExpression)
      .simplify()
      .toString();
    // Expand in the shifted variable to split terms like
    // (-1/4)*(-3+16*u^2)/u^2 into (3/4)/u^2 - 4. Do not simplify after
    // substituting back — that recombines into a form residual proofs miss.
    const expandedInU = nerdamer(inU).expand().toString();
    return nerdamer(expandedInU, { u: `(x+(${shift}))` }).toString();
  } catch {
    return expression;
  }
}

/**
 * Cancel exponential factors between numerator and denominator.
 * Tries every exponential appearing on either side — not only identical
 * shared exponents — so e^(x^2)*e^(-3*x) / e^(-3*x+x^2) cancels cleanly.
 */
function cancelSharedExponentials(
  numerator: string,
  denominator: string,
): { num: string; den: string } {
  const nFactored = factorSharedExponential(numerator);
  const dFactored = factorSharedExponential(denominator);
  const candidates = [
    ...uniqueExponentialExponents(dFactored),
    ...uniqueExponentialExponents(nFactored),
  ];

  let bestNum = nFactored;
  let bestDen = dFactored;
  let bestScore = expressionComplexity(`(${bestNum})/(${bestDen})`);

  for (const exponent of candidates) {
    const factor = exponentialFactor(exponent);
    try {
      const nBody = lightSimplify(nerdamer(`(${nFactored})*(${factor})^(-1)`).expand().toString());
      const dBody = lightSimplify(nerdamer(`(${dFactored})*(${factor})^(-1)`).expand().toString());
      if (
        containsRadicals(nBody) ||
        containsRadicals(dBody) ||
        looksLikeRationalizedConstant(nBody) ||
        looksLikeRationalizedConstant(dBody)
      ) {
        ensureSymbolicNerdamerMode();
        continue;
      }
      const clearedBonus =
        !containsExponential(nBody) && !containsExponential(dBody) ? 1000 : 0;
      const score = expressionComplexity(`(${nBody})/(${dBody})`) - clearedBonus;
      if (score < bestScore) {
        bestNum = nBody;
        bestDen = dBody;
        bestScore = score;
      }
    } catch {
      ensureSymbolicNerdamerMode();
      // try next exponent
    }
  }

  return { num: bestNum, den: bestDen };
}

/**
 * Cancel a common univariate polynomial GCD from a quotient when both sides
 * are (effectively) polynomials. Safe no-op when GCD is trivial or unavailable.
 */
function cancelPolynomialGcd(numerator: string, denominator: string): { num: string; den: string } {
  if (containsExponential(numerator) || containsExponential(denominator)) {
    return { num: numerator, den: denominator };
  }
  if (containsRadicals(numerator) || containsRadicals(denominator)) {
    return { num: numerator, den: denominator };
  }

  try {
    const nExpanded = nerdamer(numerator).expand().toString();
    const dExpanded = nerdamer(denominator).expand().toString();
    const gcd = nerdamer(`gcd((${nExpanded}),(${dExpanded}))`).toString();
    if (!gcd || gcd === "1" || gcd === "-1" || gcd === "0") {
      return { num: numerator, den: denominator };
    }

    const nCancelled = lightSimplify(`(${nExpanded})/(${gcd})`);
    const dCancelled = lightSimplify(`(${dExpanded})/(${gcd})`);
    // Prefer cancellation only when it reduces complexity.
    const before = expressionComplexity(`(${numerator})/(${denominator})`);
    const after = expressionComplexity(`(${nCancelled})/(${dCancelled})`);
    if (after <= before + 8) {
      return { num: nCancelled, den: dCancelled };
    }
  } catch {
    // keep original factors
  }

  return { num: numerator, den: denominator };
}

/**
 * Prefer a/b over a*b^(-1) for simple two-factor products only.
 * Uses [^()] so nested parentheses cannot flip unrelated factors
 * (e.g. must not rewrite -6*(1+2*x)*(1+x)*(2*x+3)^(-1)).
 */
function preferFractionForm(expression: string): string {
  const trimmed = expression.trim();
  const patterns: Array<{ regex: RegExp; num: number; den: number; sign?: number }> = [
    { regex: /^(-)?\(([^()]+)\)\*\(([^()]+)\)\^\(-1\)$/, sign: 1, num: 2, den: 3 },
    { regex: /^(-)?\(([^()]+)\)\^\(-1\)\*\(([^()]+)\)$/, sign: 1, num: 3, den: 2 },
    { regex: /^(-)?([0-9.]+)\*\(([^()]+)\)\^\(-1\)$/, sign: 1, num: 2, den: 3 },
    { regex: /^(-)?\(([^()]+)\)\^\(-1\)\*([0-9.]+)$/, sign: 1, num: 3, den: 2 },
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern.regex);
    if (!match) continue;
    const sign = match[pattern.sign!] ?? "";
    const numerator = match[pattern.num];
    const denominator = match[pattern.den];
    const candidate = `${sign}(${numerator})/(${denominator})`;
    return preferSimpler(trimmed, lightSimplify(candidate));
  }

  return trimmed;
}

function uniqueExponentialExponents(expression: string): string[] {
  const exponents = new Set<string>();
  // e^(...)
  for (const match of expression.matchAll(/e\^\(([^)]+)\)/g)) {
    exponents.add(match[1]);
  }
  // nerdamer often writes e^x^2 / e^x without parentheses
  for (const match of expression.matchAll(/e\^([a-zA-Z](?:\^\d+)?)/g)) {
    exponents.add(match[1]);
  }
  // Prefer exp(...) (E_TO_EXP / our toNerdamer policy).
  for (const argument of extractFunctionArguments(expression, "exp")) {
    exponents.add(stripBalancedOuterParens(argument));
  }
  return [...exponents];
}

function exponentialFactor(exponent: string): string {
  return `exp(${exponent})`;
}

function extractFunctionArguments(expression: string, name: string): string[] {
  const results: string[] = [];
  const needle = `${name}(`;
  let index = 0;
  while (index < expression.length) {
    const start = expression.indexOf(needle, index);
    if (start < 0) break;
    let depth = 0;
    let cursor = start + needle.length - 1;
    const argumentStart = cursor + 1;
    for (; cursor < expression.length; cursor += 1) {
      if (expression[cursor] === "(") depth += 1;
      else if (expression[cursor] === ")") {
        depth -= 1;
        if (depth === 0) {
          results.push(expression.slice(argumentStart, cursor));
          index = cursor + 1;
          break;
        }
      }
    }
    if (depth !== 0) break;
  }
  return results;
}

function stripBalancedOuterParens(expression: string): string {
  let trimmed = expression.trim();
  while (trimmed.startsWith("(") && trimmed.endsWith(")")) {
    let depth = 0;
    let wrapsEntire = true;
    for (let index = 0; index < trimmed.length; index += 1) {
      if (trimmed[index] === "(") depth += 1;
      else if (trimmed[index] === ")") {
        depth -= 1;
        if (depth === 0 && index < trimmed.length - 1) {
          wrapsEntire = false;
          break;
        }
      }
    }
    if (!wrapsEntire) break;
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function containsExponential(expression: string): boolean {
  return /e\^|exp\(/.test(expression);
}
