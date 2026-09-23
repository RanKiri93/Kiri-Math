import { mixSeed, SeededRandom } from "../../constant-coefficients-euler/practice/random";
import { differentiate } from "../math/differentiate";
import { parseFormula, toLatex } from "../math/formulaParser";
import {
  evaluateExpressionAt,
  verifyFundamentalCompletionAnswer,
} from "../math/fundamentalCompletionVerifier";
import type { FundamentalCompletionQuestion, HintStep } from "./fundamentalCompletionQuestions";

export type FundamentalCompletionDifficulty = "easy" | "medium" | "advanced";
export type FundamentalCompletionFamilyId =
  | "quadratic-linear-exponential"
  | "reciprocal-exponential"
  | "polynomial-pair"
  | "quadratic-quartic"
  | "shifted-linear-log"
  | "sine"
  | "cosine"
  | "log-power"
  | "sqrt-reciprocal"
  | "sqrt-exponential";

type GeneratedQuestionInput = Omit<FundamentalCompletionQuestion, "id" | "hints"> & {
  familyId: FundamentalCompletionFamilyId;
  difficulty: FundamentalCompletionDifficulty;
  signature: string;
  parameters: Record<string, number>;
};

type FundamentalCompletionTemplate = {
  familyId: FundamentalCompletionFamilyId;
  difficulty: FundamentalCompletionDifficulty;
  generateParameters: (rng: SeededRandom) => Record<string, number>;
  build: (params: Record<string, number>) => GeneratedQuestionInput;
};

export type GenerateFundamentalCompletionQuestionOptions = {
  seed?: number;
  attempt?: number;
  difficulty?: FundamentalCompletionDifficulty | "mixed";
  excludeSignatures?: readonly string[];
};

const defaultSeed = 0x104136;
const maxGenerationAttempts = 20;

export function generateFundamentalCompletionQuestion({
  seed = defaultSeed,
  attempt = 0,
  difficulty = "mixed",
  excludeSignatures = [],
}: GenerateFundamentalCompletionQuestionOptions = {}): FundamentalCompletionQuestion {
  const excluded = new Set(excludeSignatures);

  for (let offset = 0; offset < maxGenerationAttempts; offset += 1) {
    const rng = new SeededRandom(mixSeed(seed, 0xf0010000 + attempt + offset));
    const template = chooseTemplate(rng, difficulty);
    const params = template.generateParameters(rng);
    const question = withGeneratedHints(template.build(params));

    if (excluded.has(question.signature ?? "") || !passesReadabilityGate(question)) {
      continue;
    }

    if (validateGeneratedQuestion(question)) {
      return question;
    }
  }

  const fallback = withGeneratedHints(family3.build({ r: 3, s: -1 }));
  if (validateGeneratedQuestion(fallback)) {
    return fallback;
  }

  throw new Error("Failed to generate a valid fundamental completion question");
}

export function buildFundamentalCompletionQuestionFromTemplate(
  familyId: FundamentalCompletionFamilyId,
  parameters: Record<string, number>,
): FundamentalCompletionQuestion {
  const template = fundamentalCompletionTemplates.find((item) => item.familyId === familyId);
  if (!template) {
    throw new Error(`Unknown fundamental completion family: ${familyId}`);
  }
  const question = withGeneratedHints(template.build(parameters));
  if (!validateGeneratedQuestion(question)) {
    throw new Error(`Generated invalid question: ${question.signature}`);
  }
  return question;
}

function chooseTemplate(
  rng: SeededRandom,
  difficulty: FundamentalCompletionDifficulty | "mixed",
): FundamentalCompletionTemplate {
  if (difficulty !== "mixed") {
    return rng.pick(fundamentalCompletionTemplates.filter((template) => template.difficulty === difficulty));
  }

  const roll = rng.next();
  if (roll < 0.4) {
    return chooseTemplate(rng, "easy");
  }
  if (roll < 0.8) {
    return chooseTemplate(rng, "medium");
  }
  return chooseTemplate(rng, "advanced");
}

function withGeneratedHints(question: GeneratedQuestionInput): FundamentalCompletionQuestion {
  const y1Latex = expressionLatex(question.knownSolutionExpression);
  const y1PrimeLatex = derivativeLatex(question.knownSolutionExpression);
  const hintWronskian = stripLeadingConstantFactor(
    question.wronskianExpression ?? question.canonicalSecondSolutionExpression,
  );
  const wronskianLatex = expressionLatex(hintWronskian);
  const vPrimeExpression = `(${hintWronskian})/(${question.knownSolutionExpression})^2`;
  const vPrimeLatex = expressionLatex(vPrimeExpression);

  const hints: { abel: HintStep[]; reduction: HintStep[] } = {
    abel: [
      { title: "זהו את המקדם", latex: `p(x)=${expressionLatex(question.pExpression)}` },
      {
        title: "נציג נוח של נוסחת אבל",
        text: "הביטוי נקבע עד כדי כפל בקבוע שונה מאפס.",
        latex: `e^{-\\int p(x)\\,dx}\\sim ${wronskianLatex}`,
      },
      {
        title: "משוואת הוורונסקיאן",
        latex: `${y1Latex}y'-\\left(${y1PrimeLatex}\\right)y=${wronskianLatex}`,
      },
    ],
    reduction: [
      { title: "הציבו", latex: `y=v\\cdot ${y1Latex}` },
      {
        title: "המשוואה עבור v",
        latex: `${y1Latex}v''+\\left(2\\left(${y1PrimeLatex}\\right)+${expressionLatex(
          question.pExpression,
        )}\\cdot ${y1Latex}\\right)v'=0`,
      },
      {
        title: "שלב ראשון",
        text: "משתמשים בזהות W[y_1,vy_1]=y_1^2v', עד כדי קבוע שונה מאפס.",
        latex: `v'\\sim ${vPrimeLatex}`,
      },
    ],
  };

  return {
    ...question,
    id: question.signature,
    hints,
  };
}

function validateGeneratedQuestion(question: FundamentalCompletionQuestion): boolean {
  const y1Result = verifyFundamentalCompletionAnswer(question, question.knownSolutionExpression).state;
  const y2Result = verifyFundamentalCompletionAnswer(question, question.canonicalSecondSolutionExpression).state;
  const machineExpressions = [
    question.pExpression,
    question.qExpression,
    question.knownSolutionExpression,
    question.canonicalSecondSolutionExpression,
    question.wronskianExpression,
  ]
    .filter((expression): expression is string => Boolean(expression))
    .map((expression) => parseFormula(expression).nerdamer);

  const finiteCore = machineExpressions.every((expression) =>
    question.safeEvaluationPoints.every((point) => Number.isFinite(evaluateExpressionAt(expression, point))),
  );

  const wronskianValue = question.wronskianExpression
    ? evaluateExpressionAt(parseFormula(question.wronskianExpression).nerdamer, question.safeEvaluationPoints[0])
    : 1;

  return (
    y1Result === "solutionButDependent" &&
    y2Result === "correct" &&
    finiteCore &&
    Number.isFinite(wronskianValue) &&
    Math.abs(wronskianValue) > 1e-7
  );
}

function passesReadabilityGate(question: FundamentalCompletionQuestion): boolean {
  const expressions = [
    question.pExpression,
    question.qExpression,
    question.knownSolutionExpression,
    question.canonicalSecondSolutionExpression,
  ];
  return expressions.every((expression) => {
    const divisionCount = expression.split("/").length - 1;
    return expression.length <= 140 && divisionCount <= 5;
  });
}

const family1: FundamentalCompletionTemplate = {
  familyId: "quadratic-linear-exponential",
  difficulty: "medium",
  generateParameters: (rng) => ({
    a: rng.pick([-2, -1, 1, 2]),
    b: rng.pick([-4, -3, -2, -1, 1, 2, 3, 4]),
  }),
  build: ({ a, b }) => {
    const r = b / (2 * a);
    const safePoint = r + 1;
    const denominator = polynomialTerms([
      { coefficient: 2 * a, monomial: "x" },
      { coefficient: -b, monomial: "" },
    ]);
    return question({
      familyId: "quadratic-linear-exponential",
      difficulty: "medium",
      signature: `f1:a=${a};b=${b}`,
      parameters: { a, b },
      interval: `x > ${numberText(r)}`,
      intervalLatex: `I=\\left(${numberLatex(r)},\\infty\\right)`,
      pExpression: `(${polynomialTerms([
        { coefficient: b * b, monomial: "" },
        { coefficient: -4 * a * a, monomial: "x^2" },
        { coefficient: -2 * a, monomial: "" },
      ])})/(${denominator})`,
      qExpression: `${coefficientFactor(2 * a * b)}*(${polynomialTerms([
        { coefficient: 2 * a, monomial: "x^2" },
        { coefficient: -b, monomial: "x" },
        { coefficient: 1, monomial: "" },
      ])})/(${denominator})`,
      knownSolutionExpression: a === 1 ? "exp(x^2)" : `exp(${a}*x^2)`,
      canonicalSecondSolutionExpression: b === 1 ? "exp(x)" : b === -1 ? "exp(-x)" : `exp(${b}*x)`,
      wronskianExpression: `(${polynomialTerms([
        { coefficient: b, monomial: "" },
        { coefficient: -2 * a, monomial: "x" },
      ])})*exp(${polynomialTerms([
        { coefficient: a, monomial: "x^2" },
        { coefficient: b, monomial: "x" },
      ])})`,
      safeEvaluationPoints: [safePoint, safePoint + 1],
    });
  },
};

const family2: FundamentalCompletionTemplate = {
  familyId: "reciprocal-exponential",
  difficulty: "medium",
  generateParameters: (rng) => {
    const a = rng.pick([-3, -2, -1, 1, 2, 3]);
    let b = rng.pick([-3, -2, -1, 1, 2, 3]);
    if (a === b) b = -a;
    return { a, b };
  },
  build: ({ a, b }) => {
    const sum = a + b;
    const pExpression =
      sum === 0 ? "2/x" : `2/x${sum > 0 ? "+" : "-"}${Math.abs(sum)}/x^2`;
    return question({
      familyId: "reciprocal-exponential",
      difficulty: "medium",
      signature: `f2:a=${a};b=${b}`,
      parameters: { a, b },
      interval: "x > 0",
      intervalLatex: "I=\\left(0,\\infty\\right)",
      pExpression,
      qExpression: `${a * b}/x^4`,
      knownSolutionExpression: `exp(${a}/x)`,
      canonicalSecondSolutionExpression: `exp(${b}/x)`,
      wronskianExpression:
        sum === 0
          ? `${a - b}/x^2`
          : `${a - b}/x^2*exp(${sum}/x)`,
      safeEvaluationPoints: [1, 2],
    });
  },
};

const family3: FundamentalCompletionTemplate = {
  familyId: "polynomial-pair",
  difficulty: "easy",
  generateParameters: (rng) => {
    const pairs: Array<{ r: number; s: number }> = [];
    for (const r of [-3, -2, -1, 0, 1, 2, 3, 4]) {
      for (const s of [-3, -2, -1, 0, 1, 2, 3, 4]) {
        if (r > s && Math.abs(r - s) % 2 === 0) pairs.push({ r, s });
      }
    }
    return rng.pick(pairs);
  },
  build: ({ r, s }) => {
    const m = (r + s) / 2;
    return question({
      familyId: "polynomial-pair",
      difficulty: "easy",
      signature: `f3:r=${r};s=${s}`,
      parameters: { r, s, m },
      interval: `x > ${r}`,
      intervalLatex: `I=\\left(${r},\\infty\\right)`,
      pExpression: `-2*(${linearShiftExpression(m)})/((${linearShiftExpression(r)})*(${linearShiftExpression(s)}))`,
      qExpression: `2/((${linearShiftExpression(r)})*(${linearShiftExpression(s)}))`,
      knownSolutionExpression: linearShiftExpression(m),
      canonicalSecondSolutionExpression: polynomialTerms([
        { coefficient: 1, monomial: "x^2" },
        { coefficient: -r * s, monomial: "" },
      ]),
      wronskianExpression: `(${linearShiftExpression(r)})*(${linearShiftExpression(s)})`,
      safeEvaluationPoints: [r + 1, r + 2],
    });
  },
};

const family4: FundamentalCompletionTemplate = {
  familyId: "quadratic-quartic",
  difficulty: "easy",
  generateParameters: (rng) => ({ c: rng.pick([1, 2, 3, 4, 5]) }),
  build: ({ c }) =>
    question({
      familyId: "quadratic-quartic",
      difficulty: "easy",
      signature: `f4:c=${c}`,
      parameters: { c },
      interval: "x > 0",
      intervalLatex: "I=\\left(0,\\infty\\right)",
      pExpression: `-(5*x^2+${6 * c})/(x*(x^2+${2 * c}))`,
      qExpression: `8/(x^2+${2 * c})`,
      knownSolutionExpression: `x^2+${c}`,
      canonicalSecondSolutionExpression: "x^4",
      wronskianExpression: `2*x^3*(x^2+${2 * c})`,
      safeEvaluationPoints: [1, 2],
    }),
};

const family5: FundamentalCompletionTemplate = {
  familyId: "shifted-linear-log",
  difficulty: "easy",
  generateParameters: (rng) => ({ h: rng.pick([-3, -2, -1, 0, 1, 2, 3]) }),
  build: ({ h }) => {
    const shift = linearShiftExpression(h);
    return question({
      familyId: "shifted-linear-log",
      difficulty: "easy",
      signature: `f5:h=${h}`,
      parameters: { h },
      interval: `x > ${h}`,
      intervalLatex: `I=\\left(${h},\\infty\\right)`,
      pExpression: `-1/(${shift})`,
      qExpression: `1/(${shift})^2`,
      knownSolutionExpression: shift,
      canonicalSecondSolutionExpression: `(${shift})*ln(${shift})`,
      wronskianExpression: shift,
      safeEvaluationPoints: [h + 1, h + 2],
    });
  },
};

const family6: FundamentalCompletionTemplate = {
  familyId: "sine",
  difficulty: "advanced",
  generateParameters: (rng) => ({ k: rng.pick([1, 2, 3]) }),
  build: ({ k }) => {
    const argument = scaledX(k);
    return question({
      familyId: "sine",
      difficulty: "advanced",
      signature: `f6:k=${k}`,
      parameters: { k },
      interval: k === 1 ? "0 < x < pi" : `0 < x < pi/${k}`,
      intervalLatex: k === 1 ? "I=\\left(0,\\pi\\right)" : `I=\\left(0,\\frac{\\pi}{${k}}\\right)`,
      pExpression: k === 1 ? `-3*cot(${argument})` : `-${3 * k}*cot(${argument})`,
      qExpression:
        k === 1 ? `1+3*cot(${argument})^2` : `${k * k}*(1+3*cot(${argument})^2)`,
      knownSolutionExpression: `sin(${argument})`,
      canonicalSecondSolutionExpression: `sin(${argument})*cos(${argument})`,
      wronskianExpression: k === 1 ? `-sin(${argument})^3` : `-${k}*sin(${argument})^3`,
      safeEvaluationPoints: [Math.PI / (2 * k)],
    });
  },
};

const family7: FundamentalCompletionTemplate = {
  familyId: "cosine",
  difficulty: "advanced",
  generateParameters: (rng) => ({ k: rng.pick([1, 2, 3]) }),
  build: ({ k }) => {
    const argument = scaledX(k);
    return question({
      familyId: "cosine",
      difficulty: "advanced",
      signature: `f7:k=${k}`,
      parameters: { k },
      interval: k === 1 ? "-pi/2 < x < pi/2" : `-pi/${2 * k} < x < pi/${2 * k}`,
      intervalLatex:
        k === 1
          ? "I=\\left(-\\frac{\\pi}{2},\\frac{\\pi}{2}\\right)"
          : `I=\\left(-\\frac{\\pi}{${2 * k}},\\frac{\\pi}{${2 * k}}\\right)`,
      pExpression: k === 1 ? `2*tan(${argument})` : `${2 * k}*tan(${argument})`,
      qExpression:
        k === 1 ? `1+2*tan(${argument})^2` : `${k * k}*(1+2*tan(${argument})^2)`,
      knownSolutionExpression: `cos(${argument})`,
      canonicalSecondSolutionExpression: `x*cos(${argument})`,
      wronskianExpression: `cos(${argument})^2`,
      safeEvaluationPoints: [0, 0.2 / k],
    });
  },
};

const family8: FundamentalCompletionTemplate = {
  familyId: "log-power",
  difficulty: "medium",
  generateParameters: (rng) => ({ m: rng.pick([2, 3, 4]) }),
  build: ({ m }) =>
    question({
      familyId: "log-power",
      difficulty: "medium",
      signature: `f8:m=${m}`,
      parameters: { m },
      interval: "x > 2",
      intervalLatex: "I=\\left(2,\\infty\\right)",
      pExpression: `-((${m * m - m})*ln(x)+1)/(x*(${m}*ln(x)-1))`,
      qExpression: `${m * m}/(x^2*(${m}*ln(x)-1))`,
      knownSolutionExpression: "ln(x)",
      canonicalSecondSolutionExpression: `x^${m}`,
      wronskianExpression: `x^${m - 1}*(${m}*ln(x)-1)`,
      residualClearFactorExpression: `x^2*(${m}*ln(x)-1)`,
      safeEvaluationPoints: [3, 4],
    }),
};

const family9: FundamentalCompletionTemplate = {
  familyId: "sqrt-reciprocal",
  difficulty: "easy",
  generateParameters: (rng) => ({ h: rng.pick([-3, -2, -1, 0, 1, 2, 3]) }),
  build: ({ h }) => {
    const shift = linearShiftExpression(h);
    return question({
      familyId: "sqrt-reciprocal",
      difficulty: "easy",
      signature: `f9:h=${h}`,
      parameters: { h },
      interval: `x > ${h}`,
      intervalLatex: `I=\\left(${h},\\infty\\right)`,
      pExpression: `1/(${shift})`,
      qExpression: `-1/(4*(${shift})^2)`,
      knownSolutionExpression: `sqrt(${shift})`,
      canonicalSecondSolutionExpression: `1/sqrt(${shift})`,
      wronskianExpression: `-1/(${shift})`,
      residualClearFactorExpression: `4*(${shift})^2`,
      safeEvaluationPoints: [h + 1, h + 2],
    });
  },
};

const family10: FundamentalCompletionTemplate = {
  familyId: "sqrt-exponential",
  difficulty: "medium",
  generateParameters: (rng) => ({ h: rng.pick([-2, -1, 0, 1, 2]), c: rng.pick([1, 2, 3]) }),
  build: ({ h, c }) => {
    const shift = linearShiftExpression(h);
    return question({
      familyId: "sqrt-exponential",
      difficulty: "medium",
      signature: `f10:h=${h};c=${c}`,
      parameters: { h, c },
      interval: `x > ${h}`,
      intervalLatex: `I=\\left(${h},\\infty\\right)`,
      pExpression: `-1/(${shift})`,
      qExpression: `3/(4*(${shift})^2)-${c * c}`,
      knownSolutionExpression: `sqrt(${shift})*exp(${c}*x)`,
      canonicalSecondSolutionExpression: `sqrt(${shift})*exp(-${c}*x)`,
      wronskianExpression: `-${2 * c}*(${shift})`,
      residualClearFactorExpression: `4*(${shift})^2`,
      safeEvaluationPoints: [h + 1, h + 2],
    });
  },
};

export const fundamentalCompletionTemplates: readonly FundamentalCompletionTemplate[] = [
  family1,
  family2,
  family3,
  family4,
  family5,
  family6,
  family7,
  family8,
  family9,
  family10,
];

function question(input: Omit<GeneratedQuestionInput, "equationLatex" | "knownSolutionLatex">): GeneratedQuestionInput {
  return {
    ...input,
    equationLatex: equationLatex(input.pExpression, input.qExpression),
    knownSolutionLatex: `y_1=${expressionLatex(input.knownSolutionExpression)}`,
  };
}

function equationLatex(pExpression: string, qExpression: string): string {
  return `y''${signedCoefficientLatex(pExpression, "y'")}${signedCoefficientLatex(qExpression, "y")}=0`;
}

function signedCoefficientLatex(expression: string, suffix: string): string {
  const trimmed = expression.trim();
  if (trimmed === "0" || trimmed === "-0") {
    return "";
  }
  if (trimmed === "1") {
    return `+${suffix}`;
  }
  if (trimmed === "-1") {
    return `-${suffix}`;
  }
  if (trimmed.startsWith("-")) {
    return `-${coefficientLatex(trimmed.slice(1), suffix)}`;
  }
  return `+${coefficientLatex(trimmed, suffix)}`;
}

function coefficientLatex(expression: string, suffix: string): string {
  const latex = expressionLatex(expression);
  if (/^[0-9]+$/.test(expression) || /^[0-9]+\/[0-9]+$/.test(expression)) {
    return `${latex}${suffix}`;
  }
  return `\\left(${latex}\\right)${suffix}`;
}

function expressionLatex(expression: string): string {
  return parseFormula(expression).latex;
}

function derivativeLatex(expression: string): string {
  try {
    return toLatex(differentiate(parseFormula(expression).ast));
  } catch {
    return `\\left(${expressionLatex(expression)}\\right)'`;
  }
}

function scaledX(k: number): string {
  return k === 1 ? "x" : `${k}*x`;
}

function linearShiftExpression(h: number): string {
  if (h === 0) return "x";
  if (h > 0) return `x-${h}`;
  return `x+${-h}`;
}

function numberText(value: number): string {
  if (Number.isInteger(value)) return String(value);
  const denominator = 2;
  const numerator = value * denominator;
  if (Number.isInteger(numerator)) return `${numerator}/${denominator}`;
  return value.toFixed(2);
}

function numberLatex(value: number): string {
  if (Number.isInteger(value)) return String(value);
  const denominator = 2;
  const numerator = value * denominator;
  if (Number.isInteger(numerator)) {
    if (numerator < 0) return `-\\frac{${-numerator}}{${denominator}}`;
    return `\\frac{${numerator}}{${denominator}}`;
  }
  return value.toFixed(2);
}

function coefficientFactor(value: number): string {
  if (value === 1) return "1";
  if (value === -1) return "(-1)";
  return String(value);
}

function polynomialTerms(terms: Array<{ coefficient: number; monomial: string }>): string {
  const combined = new Map<string, number>();
  for (const term of terms) {
    combined.set(term.monomial, (combined.get(term.monomial) ?? 0) + term.coefficient);
  }

  const parts: string[] = [];
  for (const [monomial, coefficient] of combined) {
    if (coefficient === 0) continue;
    const absolute = Math.abs(coefficient);
    let body = "";
    if (monomial === "") {
      body = String(absolute);
    } else if (absolute === 1) {
      body = monomial;
    } else {
      body = `${absolute}*${monomial}`;
    }
    if (parts.length === 0) {
      parts.push(coefficient < 0 ? `-${body}` : body);
    } else {
      parts.push(coefficient < 0 ? `-${body}` : `+${body}`);
    }
  }
  return parts.join("") || "0";
}

function stripLeadingConstantFactor(expression: string): string {
  const trimmed = expression.trim();
  const match = trimmed.match(/^(-?\d+)\*(.+)$/);
  if (!match) return trimmed;
  const coefficient = Number(match[1]);
  if (!Number.isFinite(coefficient) || coefficient === 0) return trimmed;
  // Keep a clean positive representative for Abel hints.
  return match[2];
}
