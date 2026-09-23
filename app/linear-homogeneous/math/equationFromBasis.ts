import { differentiate } from "./differentiate";
import {
  basisAstToLatex,
  expressionToLatex,
  generalSolutionLatex,
  homogeneousEquationLatex,
  wronskianLatex,
} from "./equationFormatting";
import { parseFormula, toNerdamer, type FormulaAst, type ParsedFormula } from "./formulaParser";
import {
  isProvablyZeroExpression,
  simplifyExpression,
} from "./fundamentalCompletionVerifier";
import { ensureSymbolicNerdamerMode } from "./nerdamerConfig";
import { symbolicDeterminant } from "./symbolicDeterminant";
import {
  compactViaLinearShift,
  containsRadicals,
  displayScore,
  expressionComplexity,
  lightSimplify,
  preferSimpler,
  readableQuotient,
  readableSimplify,
  safeDivide,
} from "./symbolicSimplify";
import nerdamer from "nerdamer";
import "nerdamer/Calculus.js";

export type EquationOrder = 2 | 3 | 4;

export type EquationFromBasisSuccess = {
  status: "success";
  order: EquationOrder;
  basisExpressions: string[];
  basisLatex: string[];
  wronskianExpression: string;
  wronskianLatex: string;
  /** coefficients[k] = a_k */
  coefficients: string[];
  coefficientLatex: string[];
  equationLatex: string;
  generalSolutionLatex: string;
  residuals: string[];
};

export type EquationFromBasisFailure =
  | {
      status: "invalidOrder";
      order: number;
    }
  | {
      status: "parseError";
      index: number;
      message: string;
    }
  | {
      status: "degenerateWronskian";
      order: EquationOrder;
      wronskianExpression: string;
      wronskianLatex: string;
    }
  | {
      status: "inconclusive";
      order: EquationOrder;
      stage: "wronskian" | "coefficientConstruction" | "verification";
      message?: string;
      wronskianExpression?: string;
    };

export type EquationFromBasisResult = EquationFromBasisSuccess | EquationFromBasisFailure;

/**
 * Build the unique monic homogeneous linear ODE of order n=2..4
 * for which the given basis is a fundamental set (where W ≠ 0).
 *
 * coefficients[k] = a_k in
 *   y^(n) + a_(n-1) y^(n-1) + ... + a_0 y = 0
 * via a_k = (-1)^(n+k) * Delta_k / W.
 */
export function buildHomogeneousEquationFromBasis(
  basisInputs: readonly string[],
): EquationFromBasisResult {
  ensureSymbolicNerdamerMode();
  const order = basisInputs.length;
  if (order !== 2 && order !== 3 && order !== 4) {
    return { status: "invalidOrder", order };
  }

  const parsed: ParsedFormula[] = [];
  for (const [index, input] of basisInputs.entries()) {
    try {
      parsed.push(parseFormula(input));
    } catch (error) {
      return {
        status: "parseError",
        index,
        message: error instanceof Error ? error.message : "parse error",
      };
    }
  }

  try {
    const hasRadicals = parsed.some((item) => containsRadicals(item.nerdamer));
    // Fast path avoids expand-first blow-up for ordinary exp/poly bases.
    // Radical bases stay on the generic minor path (compactViaLinearShift).
    if (order === 2 && !hasRadicals) {
      const fast = constructSecondOrderFastPath(parsed);
      if (fast) {
        return fast;
      }
    }
    return constructFromParsedBasis(order, parsed);
  } catch {
    return {
      status: "inconclusive",
      order,
      stage: "coefficientConstruction",
    };
  }
}

/**
 * Dedicated n=2 path: W, p=-W'/W, q=(y1'y2''-y1''y2')/W with readable
 * rational simplification. Avoids expand-first blow-up of generic minors.
 */
function constructSecondOrderFastPath(parsed: ParsedFormula[]): EquationFromBasisResult | null {
  const derivativeTable = buildDerivativeTable(parsed, 2);
  const [y1, y2] = [toNerdamer(parsed[0].ast), toNerdamer(parsed[1].ast)];
  const [y1p, y2p] = [derivativeTable[1][0], derivativeTable[1][1]];
  const [y1pp, y2pp] = [derivativeTable[2][0], derivativeTable[2][1]];

  const wronskianRaw = `((${y1})*(${y2p})-(${y1p})*(${y2}))`;
  const wronskianExpression = readableSimplify(wronskianRaw);

  if (isProvablyZeroExpression(wronskianExpression) || isProvablyZeroExpression(wronskianRaw)) {
    return {
      status: "degenerateWronskian",
      order: 2,
      wronskianExpression,
      wronskianLatex: wronskianLatex(2, wronskianExpression),
    };
  }

  const wronskianPrimeRaw = nerdamer(`diff((${wronskianRaw}),x)`).toString();
  const qNumRaw = `((${y1p})*(${y2pp})-(${y1pp})*(${y2p}))`;
  const qNumReadable = readableSimplify(qNumRaw);
  const pNumReadable = readableSimplify(`(-1)*(${wronskianPrimeRaw})`);

  const pCandidates = [
    readableQuotient(pNumReadable, wronskianExpression),
    readableQuotient(`(-1)*(${wronskianPrimeRaw})`, wronskianRaw),
    compactViaLinearShift(
      readableQuotient(pNumReadable, wronskianExpression),
      wronskianExpression,
    ),
    lightSimplify(`((-1)*(${wronskianPrimeRaw}))/(${wronskianRaw})`),
  ];
  const qCandidates = [
    readableQuotient(qNumReadable, wronskianExpression),
    readableQuotient(qNumRaw, wronskianRaw),
    compactViaLinearShift(
      readableQuotient(qNumReadable, wronskianExpression),
      wronskianExpression,
    ),
    lightSimplify(`(${qNumRaw})/(${wronskianRaw})`),
  ];

  for (const p of uniqueExpressions(pCandidates).sort(byAscendingComplexity)) {
    for (const q of uniqueExpressions(qCandidates).sort(byAscendingComplexity)) {
      const coefficients = [q, p];
      const residuals: string[] = [];
      let verified = true;
      for (const column of [0, 1]) {
        const residual = buildResidual(derivativeTable, coefficients, column, 2);
        residuals.push(residual);
        if (!isResidualProvablyZero(residual, wronskianExpression)) {
          verified = false;
          break;
        }
      }
      if (verified) {
        return successResult(2, parsed, wronskianExpression, coefficients, residuals);
      }
    }
  }

  return null;
}

function byAscendingComplexity(left: string, right: string): number {
  return displayScore(left) - displayScore(right);
}

function constructFromParsedBasis(
  order: EquationOrder,
  parsed: ParsedFormula[],
): EquationFromBasisResult {
  const derivativeTable = buildDerivativeTable(parsed, order);
  const wronskianMatrix = derivativeTable.slice(0, order);
  // Prefer a compact Wronskian so clear-factor residual proofs can detect
  // linear shifts such as (x+1). Fall back if that path fails.
  const wronskianExpression = simplifyForWronskian(symbolicDeterminant(wronskianMatrix));

  if (isProvablyZeroExpression(wronskianExpression)) {
    return {
      status: "degenerateWronskian",
      order,
      wronskianExpression,
      wronskianLatex: wronskianLatex(order, wronskianExpression),
    };
  }

  const deltas: string[] = [];
  for (let k = 0; k < order; k += 1) {
    const deltaMatrix = derivativeTable.filter((_, rowIndex) => rowIndex !== k);
    try {
      // Avoid expand-simplify on radical minors: it can corrupt Delta_k.
      deltas.push(symbolicDeterminant(deltaMatrix));
    } catch {
      return {
        status: "inconclusive",
        order,
        stage: "coefficientConstruction",
        wronskianExpression,
      };
    }
  }

  const rawCoefficients = deltas.map((delta, k) =>
    coefficientFromDelta(delta, k, order, wronskianExpression, !containsRadicals(delta)),
  );
  const readableCoefficients = rawCoefficients.map((coefficient) =>
    containsRadicals(coefficient)
      ? coefficient
      : preferSimpler(coefficient, readableSimplify(coefficient)),
  );
  const compactCoefficients = readableCoefficients.map((coefficient) =>
    compactViaLinearShift(coefficient, wronskianExpression),
  );
  const coefficientCandidates = [readableCoefficients, compactCoefficients, rawCoefficients].sort(
    (left, right) =>
      left.reduce((sum, coefficient) => sum + expressionComplexity(coefficient), 0) -
      right.reduce((sum, coefficient) => sum + expressionComplexity(coefficient), 0),
  );

  let coefficients: string[] | undefined;
  let residuals: string[] = [];
  for (const candidate of coefficientCandidates) {
    const candidateResiduals: string[] = [];
    let verified = true;
    for (const column of parsed.keys()) {
      const residual = buildResidual(derivativeTable, candidate, column, order);
      candidateResiduals.push(residual);
      if (!isResidualProvablyZero(residual, wronskianExpression)) {
        verified = false;
        break;
      }
    }
    if (verified) {
      coefficients = candidate;
      residuals = candidateResiduals;
      break;
    }
  }

  if (!coefficients) {
    return {
      status: "inconclusive",
      order,
      stage: "verification",
      wronskianExpression,
    };
  }

  return successResult(order, parsed, wronskianExpression, coefficients, residuals);
}

function successResult(
  order: EquationOrder,
  parsed: ParsedFormula[],
  wronskianExpression: string,
  coefficients: string[],
  residuals: string[],
): EquationFromBasisSuccess {
  const hasRadicals =
    parsed.some((item) => containsRadicals(item.nerdamer)) ||
    coefficients.some((coefficient) => containsRadicals(coefficient));

  // Display rewrite is for readability only. Skip expensive radical rewrites
  // and keep the already-verified coefficients when a rewrite breaks residuals.
  let finalCoefficients = coefficients;
  let displayWronskian = wronskianExpression;
  if (!hasRadicals) {
    const displayCoefficients = coefficients.map((coefficient) =>
      preferSimpler(coefficient, readableSimplify(coefficient)),
    );
    const derivativeTable = buildDerivativeTable(parsed, order);
    const displayOk = residuals.every((_, column) =>
      isResidualProvablyZero(
        buildResidual(derivativeTable, displayCoefficients, column, order),
        wronskianExpression,
      ),
    );
    if (displayOk) {
      finalCoefficients = displayCoefficients;
    }
    displayWronskian = preferSimpler(wronskianExpression, readableSimplify(wronskianExpression));
  }

  const basisLatex = parsed.map((item) => basisAstToLatex(item.ast));
  return {
    status: "success",
    order,
    basisExpressions: parsed.map((item) => item.nerdamer),
    basisLatex,
    wronskianExpression: displayWronskian,
    wronskianLatex: wronskianLatex(order, displayWronskian),
    coefficients: finalCoefficients,
    coefficientLatex: finalCoefficients.map((coefficient) => expressionToLatex(coefficient)),
    equationLatex: homogeneousEquationLatex(order, finalCoefficients),
    generalSolutionLatex: generalSolutionLatex(basisLatex),
    residuals,
  };
}

function coefficientFromDelta(
  delta: string,
  k: number,
  order: number,
  wronskian: string,
  allowSimplify: boolean,
): string {
  const sign = (order + k) % 2 === 0 ? 1 : -1;
  const signedDelta = sign === 1 ? `(${delta})` : `((-1)*(${delta}))`;
  return safeDivide(signedDelta, wronskian, {
    allowSimplify: allowSimplify && !containsRadicals(delta),
  });
}

function simplifyForWronskian(expression: string): string {
  const readable = readableSimplify(expression);
  try {
    const compact = simplifyExpression(expression).toString();
    return preferSimpler(readable, compact);
  } catch {
    return readable;
  }
}

function buildDerivativeTable(parsed: ParsedFormula[], order: EquationOrder): string[][] {
  const table: string[][] = [];
  const current: FormulaAst[] = parsed.map((item) => item.ast);

  for (let derivativeOrder = 0; derivativeOrder <= order; derivativeOrder += 1) {
    table.push(current.map((ast) => toNerdamer(ast)));
    if (derivativeOrder < order) {
      for (let index = 0; index < current.length; index += 1) {
        current[index] = differentiate(current[index]);
      }
    }
  }

  return table;
}

function buildResidual(
  derivativeTable: string[][],
  coefficients: string[],
  column: number,
  order: number,
): string {
  // R = y^(n) + sum_{k=0}^{n-1} a_k y^(k)
  // Keep the residual unsimplified: nerdamer expand/simplify can hang on
  // radical–exponential expressions. Zero-proof uses clear-factor paths instead.
  let residual = `(${derivativeTable[order][column]})`;
  for (let k = 0; k < order; k += 1) {
    residual += `+((${coefficients[k]})*(${derivativeTable[k][column]}))`;
  }
  return residual;
}

function isResidualProvablyZero(residual: string, wronskian: string): boolean {
  if (isProvablyZeroExpression(residual, wronskian)) {
    return true;
  }
  // R * W clears the common denominator of the constructed coefficients.
  if (isProvablyZeroExpression(`(${residual})*(${wronskian})`, wronskian)) {
    return true;
  }
  return false;
}

function uniqueExpressions(expressions: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const expression of expressions) {
    const key = expression.replace(/\s+/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(expression);
  }
  return unique;
}
