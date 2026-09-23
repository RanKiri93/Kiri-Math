import nerdamer from "nerdamer";
import "nerdamer/Algebra.js";
import "nerdamer/Calculus.js";
import { differentiate } from "./differentiate";
import { parseFormula, toNerdamer, type FormulaAst, type ParsedFormula } from "./formulaParser";
import { ensureSymbolicNerdamerMode, safeEvaluate } from "./nerdamerConfig";
import type { FundamentalCompletionQuestion } from "../practice/fundamentalCompletionQuestions";

type SymbolicExpression = nerdamer.Expression & {
  simplify: () => SymbolicExpression;
  expand: () => SymbolicExpression;
  evaluate: (substitutions?: Record<string, string>) => { text: () => string };
};

type NerdamerFactory = {
  (expression: string, substitutions?: Record<string, string>): SymbolicExpression;
  convertToLaTeX: (expression: string) => string;
};

const nerdamerFactory = nerdamer as unknown as NerdamerFactory;

export type AnswerVerificationState =
  | "idle"
  | "parseError"
  | "domainError"
  | "notSolution"
  | "solutionButDependent"
  | "correct"
  | "inconclusive";

export type AnswerVerificationResult = {
  state: AnswerVerificationState;
  parsed?: ParsedFormula;
  residualLatex?: string;
  wronskianLatex?: string;
};

const numericalTolerance = 1e-7;
const maxReadableTeXLength = 130;

export function verifyFundamentalCompletionAnswer(
  question: FundamentalCompletionQuestion,
  input: string,
): AnswerVerificationResult {
  let candidate: ParsedFormula;

  try {
    candidate = parseFormula(input);
  } catch {
    return { state: "parseError" };
  }

  const machineData = parseQuestionMachineData(question);

  if (!isDefinedAtSamples(candidate.nerdamer, question.safeEvaluationPoints)) {
    return { state: "domainError", parsed: candidate };
  }

  const candidatePrime = differentiate(candidate.ast);
  const candidateSecond = differentiate(candidatePrime);
  const residualRaw = `(${toNerdamer(candidateSecond)})+((${machineData.p}))*(${toNerdamer(
    candidatePrime,
  )})+((${machineData.q}))*(${candidate.nerdamer})`;

  const residualStatus = classifyResidual(
    residualRaw,
    machineData.residualClearFactor,
    question.safeEvaluationPoints,
  );
  if (residualStatus === "nonzero") {
    return {
      state: "notSolution",
      parsed: candidate,
      residualLatex: readableLatexFromString(residualRaw),
    };
  }
  if (residualStatus === "unknown") {
    return {
      state: "inconclusive",
      parsed: candidate,
      residualLatex: readableLatexFromString(residualRaw),
    };
  }

  const knownAst = parseFormula(question.knownSolutionExpression).ast;
  const knownPrime = differentiate(knownAst);
  const wronskianRaw = `((${machineData.known}))*(${toNerdamer(candidatePrime)})-(${toNerdamer(
    knownPrime,
  )})*(${candidate.nerdamer})`;

  if (isProvablyZeroExpression(wronskianRaw)) {
    return {
      state: "solutionButDependent",
      parsed: candidate,
      wronskianLatex: "0",
    };
  }

  if (
    isProvablyNonZeroExpression(wronskianRaw) ||
    hasNonZeroSample(wronskianRaw, question.safeEvaluationPoints)
  ) {
    return {
      state: "correct",
      parsed: candidate,
      wronskianLatex: readableLatexFromString(wronskianRaw),
    };
  }

  return {
    state: "inconclusive",
    parsed: candidate,
    wronskianLatex: readableLatexFromString(wronskianRaw),
  };
}

export function parseQuestionMachineData(question: FundamentalCompletionQuestion): {
  p: string;
  q: string;
  known: string;
  canonical: string;
  residualClearFactor?: string;
} {
  return {
    p: parseFormula(question.pExpression).nerdamer,
    q: parseFormula(question.qExpression).nerdamer,
    known: parseFormula(question.knownSolutionExpression).nerdamer,
    canonical: parseFormula(question.canonicalSecondSolutionExpression).nerdamer,
    residualClearFactor: question.residualClearFactorExpression
      ? parseFormula(question.residualClearFactorExpression).nerdamer
      : undefined,
  };
}

export function simplifyExpression(expression: string): SymbolicExpression {
  ensureSymbolicNerdamerMode();
  const expanded = nerdamer(expression).expand().toString();
  try {
    const simplified = symbolicExpression(expanded).simplify().toString();
    return symbolicExpression(symbolicExpression(simplified).expand().toString()).simplify();
  } catch {
    ensureSymbolicNerdamerMode();
    return symbolicExpression(expanded);
  }
}

export function isSymbolicallyZero(expression: SymbolicExpression): boolean {
  return expression.toString() === "0";
}

export function isProvablyZero(expression: SymbolicExpression, clearFactor?: string): boolean {
  return isProvablyZeroExpression(expression.toString(), clearFactor);
}

const maxDirectShiftSimplifyLength = 500;

export function isProvablyZeroExpression(expression: string, clearFactor?: string): boolean {
  if (expression.trim() === "0") {
    return true;
  }

  const hasExp = /exp\(|e\^/.test(expression);
  const hasRadical =
    containsRadicalNoise(expression) || (clearFactor ? containsRadicalNoise(clearFactor) : false);

  // Prefer the cleared residual first: multiplying by a polynomial denominator often
  // yields a compact expression after the linear shift. Skip expand when exponentials
  // are present — nerdamer can hang on cleared sqrt*exp residuals.
  if (clearFactor && !hasExp) {
    const cleared = `(${expression})*(${clearFactor})`;
    if (isZeroAfterLinearSubstitution(cleared, clearFactor, { allowExpand: true })) {
      return true;
    }
  }

  if (
    expression.length <= maxDirectShiftSimplifyLength &&
    isZeroAfterLinearSubstitution(expression, clearFactor)
  ) {
    return true;
  }

  // Avoid nerdamer expand/simplify on radical-heavy expressions: it can hang or
  // rewrite identities into enormous nonzero polynomials.
  if (hasRadical) {
    return false;
  }

  try {
    if (simplifyExpression(expression).toString() === "0") {
      return true;
    }
  } catch {
    // continue
  }

  if (!clearFactor) {
    return false;
  }

  try {
    return simplifyExpression(`(${expression})*(${clearFactor})`).toString() === "0";
  } catch {
    return false;
  }
}

function classifyResidual(
  residual: string,
  clearFactor: string | undefined,
  samplePoints: number[],
): "zero" | "nonzero" | "unknown" {
  if (isProvablyZeroExpression(residual, clearFactor)) {
    return "zero";
  }

  // For radical/exponential residuals nerdamer often cannot prove zero symbolically,
  // and direct evaluation in x can be wrong. Cleared samples after the family shift
  // are a reliable secondary witness used together with the Wronskian test below.
  if (clearFactor) {
    const clearedSamples = sampleClearedResidual(residual, clearFactor, samplePoints);
    if (clearedSamples === "zero") {
      return "zero";
    }
    if (clearedSamples === "nonzero") {
      return "nonzero";
    }
  }

  if (hasNonZeroSample(residual, samplePoints)) {
    return "nonzero";
  }

  return "unknown";
}

function sampleClearedResidual(
  residual: string,
  clearFactor: string,
  samplePoints: number[],
): "zero" | "nonzero" | "unknown" {
  const shift = detectIntegerLinearShift(clearFactor);
  if (shift === undefined || samplePoints.length === 0) {
    return "unknown";
  }

  const cleared = `(${residual})*(${clearFactor})`;
  let sawFinite = false;

  for (const point of samplePoints) {
    try {
      // Substitute then evaluate — no simplify/expand (those hang on sqrt*exp).
      const value = Number(
        safeEvaluate(nerdamerFactory(cleared, { x: `(u-(${shift}))` }), {
          u: String(point + shift),
        }),
      );
      if (!isFiniteNumber(value)) {
        return "unknown";
      }
      sawFinite = true;
      if (Math.abs(value) > numericalTolerance) {
        return "nonzero";
      }
    } catch {
      return "unknown";
    }
  }

  return sawFinite ? "zero" : "unknown";
}

function containsRadicalNoise(expression: string): boolean {
  return /sqrt|\^\(1\/2\)|\^\(-1\/2\)|\^\(\d+\/2\)|\^\(-\d+\/2\)/.test(expression);
}

function isZeroAfterLinearSubstitution(
  expression: string,
  clearFactor?: string,
  options?: { allowExpand?: boolean },
): boolean {
  const shifted = simplifyAfterLinearSubstitution(expression, clearFactor, options);
  return shifted === "0";
}

function isProvablyNonZeroExpression(expression: string, clearFactor?: string): boolean {
  if (expression.length > maxDirectShiftSimplifyLength) {
    return false;
  }

  const shifted = simplifyAfterLinearSubstitution(expression, clearFactor);
  if (shifted === undefined || shifted === "0") {
    return false;
  }

  // nerdamer can falsely simplify radical Wronskians in x to 0, but after a
  // linear shift the independence witness is typically a simple nonzero rational.
  try {
    const probePoints = [1, 2, 3, 0.5, -0.5, 4];
    return probePoints.some((point) => {
      const value = Number(safeEvaluate(symbolicExpression(shifted), { u: String(point) }));
      return isFiniteNumber(value) && Math.abs(value) > numericalTolerance;
    });
  } catch {
    return shifted.replace(/\s+/g, "") !== "0";
  }
}

function simplifyAfterLinearSubstitution(
  expression: string,
  clearFactor?: string,
  options?: { allowExpand?: boolean },
): string | undefined {
  const shift = detectIntegerLinearShift(clearFactor ?? expression);
  if (shift === undefined) {
    return undefined;
  }

  try {
    const substituted = nerdamerFactory(expression, { x: `(u-(${shift}))` });
    if (options?.allowExpand) {
      // Cleared residuals are usually polynomial-like after the shift.
      return (substituted.expand() as SymbolicExpression).simplify().toString();
    }
    // Only simplify after substitution. Expanding first is what corrupts radical
    // identities in nerdamer, and expanding a nonzero residual can hang.
    return substituted.simplify().toString();
  } catch {
    return undefined;
  }
}

function detectIntegerLinearShift(expression: string): number | undefined {
  const xPlusConstant = expression.match(/\(x([+-]\d+)\)/);
  if (xPlusConstant) {
    return Number(xPlusConstant[1]);
  }

  const constantPlusX = expression.match(/\((-?\d+)\+x\)/);
  if (constantPlusX) {
    return Number(constantPlusX[1]);
  }

  // Bare x (no constant shift) does not need a substitution fallback.
  return undefined;
}

function isDefinedAtSamples(expression: string, points: number[]): boolean {
  return points.every((point) => isFiniteNumber(evaluateExpressionAt(expression, point)));
}

function hasNonZeroSample(expression: string, points: number[]): boolean {
  return points.some((point) => {
    const value = evaluateExpressionAt(expression, point);
    return isFiniteNumber(value) && Math.abs(value) > numericalTolerance;
  });
}

export function evaluateExpressionAt(expression: string, point: number): number {
  ensureSymbolicNerdamerMode();
  const shift = detectIntegerLinearShift(expression);
  if (shift !== undefined && expression.length <= maxDirectShiftSimplifyLength) {
    try {
      // Evaluate after the linear shift that clears (x±h). Direct nerdamer
      // evaluation of radical expressions in x frequently collapses to 0.
      const shifted = nerdamerFactory(expression, { x: `(u-(${shift}))` }).simplify().toString();
      const value = Number(
        safeEvaluate(symbolicExpression(shifted), { u: String(point + shift) }),
      );
      if (isFiniteNumber(value)) {
        return value;
      }
    } catch {
      // fall through to direct evaluation
    }
  }

  try {
    return Number(safeEvaluate(symbolicExpression(expression), { x: String(point) }));
  } catch {
    return Number.NaN;
  }
}

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value) && !Number.isNaN(value);
}

function readableLatexFromString(expression: string): string | undefined {
  if (
    expression.length > maxDirectShiftSimplifyLength ||
    containsRadicalNoise(expression) ||
    /exp\(|e\^/.test(expression)
  ) {
    return undefined;
  }

  try {
    const simplified = symbolicExpression(expression).simplify().toString();
    const latex = nerdamerFactory.convertToLaTeX(simplified === "0" ? "0" : simplified);
    if (latex.length > maxReadableTeXLength) {
      return undefined;
    }
    return latex.replaceAll("\\mathrm{log}", "\\ln");
  } catch {
    return undefined;
  }
}

function symbolicExpression(expression: string): SymbolicExpression {
  return nerdamerFactory(expression);
}

export function residualExpression(ast: FormulaAst, p: string, q: string): string {
  const first = differentiate(ast);
  const second = differentiate(first);
  return `(${toNerdamer(second)})+((${p}))*(${toNerdamer(first)})+((${q}))*(${toNerdamer(ast)})`;
}
