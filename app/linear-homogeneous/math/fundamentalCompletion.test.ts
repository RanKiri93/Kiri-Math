import { describe, expect, it } from "vitest";
import { fundamentalCompletionQuestions } from "../practice/fundamentalCompletionQuestions";
import { parseFormula } from "./formulaParser";
import {
  evaluateExpressionAt,
  isSymbolicallyZero,
  parseQuestionMachineData,
  simplifyExpression,
  verifyFundamentalCompletionAnswer,
} from "./fundamentalCompletionVerifier";
import {
  buildFundamentalCompletionQuestionFromTemplate,
  generateFundamentalCompletionQuestion,
  type FundamentalCompletionDifficulty,
  type FundamentalCompletionFamilyId,
} from "../practice/fundamentalCompletionGenerator";

const noncanonicalValidAnswers: Record<string, string[]> = {
  q1: ["exp(-3*x)", "-5*exp(-3*x)", "5*exp(-3*x)+7*exp(x^2)"],
  q2: ["exp(-3/x)", "exp(-3/x)+2*exp(3/x)"],
  q3: ["x^2+3", "x^2-x+4", "7*(x^2+3)-12*(x-1)"],
  q4: ["x^4", "x^4+3*(x^2+1)"],
  q5: ["(2*x+1)*ln(2*x+1)", "4*(2*x+1)*ln(2*x+1)-3*(2*x+1)"],
  q6: ["sin(x)*cos(x)", "-sin(x)*cos(x)", "sin(2*x)"],
  q7: ["x*cos(x)", "(x+4)*cos(x)"],
  q8: ["x^2", "x^2+3*ln(x)"],
};

describe("formula parser", () => {
  it.each([
    "x",
    "-x",
    "x^2",
    "1/x",
    "exp(x^2)",
    "e^(x^2)",
    "exp(-3*x)",
    "ln(x)",
    "log(x)",
    "sin(x)",
    "cos(x)",
    "sin(2*x)",
    "sin(4*x)",
    "sqrt(x)",
    "sqrt(x+1)",
    "1/sqrt(x+1)",
    "sqrt(x+1)*exp(-2*x)",
    "(2*x+1)*ln(2*x+1)",
  ])("parses %s", (input) => {
    expect(() => parseFormula(input)).not.toThrow();
  });

  it.each(["", "sin(", "sqrt(", "sqrt)", "x+", "alert(1)", "process.exit()", "x;alert(1)", "constructor(x)"])(
    "rejects malformed or executable-looking input %s",
    (input) => {
      expect(() => parseFormula(input)).toThrow();
    },
  );
});

const familyCases: Array<{
  familyId: FundamentalCompletionFamilyId;
  params: Record<string, number>;
}> = [
  { familyId: "quadratic-linear-exponential", params: { a: 1, b: -3 } },
  { familyId: "reciprocal-exponential", params: { a: 3, b: -3 } },
  { familyId: "polynomial-pair", params: { r: 3, s: -1 } },
  { familyId: "quadratic-quartic", params: { c: 1 } },
  { familyId: "shifted-linear-log", params: { h: -1 } },
  { familyId: "sine", params: { k: 1 } },
  { familyId: "cosine", params: { k: 1 } },
  { familyId: "log-power", params: { m: 2 } },
  { familyId: "sqrt-reciprocal", params: { h: -1 } },
  { familyId: "sqrt-exponential", params: { h: -1, c: 2 } },
];

function generatedQuestion(familyId: FundamentalCompletionFamilyId, params: Record<string, number>) {
  return buildFundamentalCompletionQuestionFromTemplate(familyId, params);
}

describe("fundamental completion verifier", () => {
  it.each(fundamentalCompletionQuestions)("validates authored data for $id", (question) => {
    expect(verifyFundamentalCompletionAnswer(question, question.knownSolutionExpression).state).toBe(
      "solutionButDependent",
    );
    expect(verifyFundamentalCompletionAnswer(question, question.canonicalSecondSolutionExpression).state).toBe(
      "correct",
    );
    expect(
      verifyFundamentalCompletionAnswer(question, `2*(${question.knownSolutionExpression})`).state,
    ).toBe("solutionButDependent");
    expect(verifyFundamentalCompletionAnswer(question, "x").state).toBe("notSolution");
  });

  it.each(fundamentalCompletionQuestions)("accepts noncanonical independent answers for $id", (question) => {
    for (const answer of noncanonicalValidAnswers[question.id]) {
      expect(verifyFundamentalCompletionAnswer(question, answer).state).toBe("correct");
    }
  });

  it("keeps parse errors distinct from mathematical errors", () => {
    expect(verifyFundamentalCompletionAnswer(fundamentalCompletionQuestions[0], "exp(").state).toBe(
      "parseError",
    );
  });
});

describe("template-generated question identities", () => {
  it.each(familyCases)("self-validates $familyId with $params", ({ familyId, params }) => {
    const question = generatedQuestion(familyId, params);
    const machine = parseQuestionMachineData(question);
    const safePoint = question.safeEvaluationPoints[0];

    expect(verifyFundamentalCompletionAnswer(question, question.knownSolutionExpression).state).toBe(
      "solutionButDependent",
    );
    expect(verifyFundamentalCompletionAnswer(question, question.canonicalSecondSolutionExpression).state).toBe(
      "correct",
    );

    expect(Number.isFinite(evaluateExpressionAt(machine.p, safePoint))).toBe(true);
    expect(Number.isFinite(evaluateExpressionAt(machine.q, safePoint))).toBe(true);
    expect(Number.isFinite(evaluateExpressionAt(machine.known, safePoint))).toBe(true);
    expect(Number.isFinite(evaluateExpressionAt(machine.canonical, safePoint))).toBe(true);

    if (question.wronskianExpression) {
      const wronskian = parseFormula(question.wronskianExpression).nerdamer;
      const computed = simplifyExpression(
        `((${machine.known}))*diff((${machine.canonical}),x)-diff((${machine.known}),x)*((${machine.canonical}))`,
      );
      const difference = simplifyExpression(`(${computed.toString()})-(${wronskian})`);
      expect(isSymbolicallyZero(difference) || Math.abs(evaluateExpressionAt(difference.toString(), safePoint)) < 1e-7).toBe(
        true,
      );
      expect(Math.abs(evaluateExpressionAt(wronskian, safePoint))).toBeGreaterThan(1e-7);
    }
  });

  it.each(familyCases)("grades generated noncanonical answers for $familyId", ({ familyId, params }) => {
    const question = generatedQuestion(familyId, params);
    const y1 = question.knownSolutionExpression;
    const y2 = question.canonicalSecondSolutionExpression;

    expect(verifyFundamentalCompletionAnswer(question, y2).state).toBe("correct");
    expect(verifyFundamentalCompletionAnswer(question, `2*(${y2})`).state).toBe("correct");
    expect(verifyFundamentalCompletionAnswer(question, `2*(${y2})+3*(${y1})`).state).toBe("correct");
    expect(verifyFundamentalCompletionAnswer(question, y1).state).toBe("solutionButDependent");
    expect(verifyFundamentalCompletionAnswer(question, `-5*(${y1})`).state).toBe("solutionButDependent");
    expect(verifyFundamentalCompletionAnswer(question, "1").state).toBe("notSolution");
  });
});

describe("family-specific generated regressions", () => {
  it("keeps family 1 noncanonical exponential answers valid", () => {
    const question = generatedQuestion("quadratic-linear-exponential", { a: 1, b: -3 });
    expect(verifyFundamentalCompletionAnswer(question, "exp(-3*x)").state).toBe("correct");
    expect(verifyFundamentalCompletionAnswer(question, "5*exp(-3*x)+7*exp(x^2)").state).toBe("correct");
  });

  it("keeps family 2 reciprocal exponential combinations valid", () => {
    const question = generatedQuestion("reciprocal-exponential", { a: 3, b: -3 });
    expect(verifyFundamentalCompletionAnswer(question, "exp(-3/x)+2*exp(3/x)").state).toBe("correct");
  });

  it("keeps family 3 polynomial representatives valid", () => {
    const question = generatedQuestion("polynomial-pair", { r: 3, s: -1 });
    expect(verifyFundamentalCompletionAnswer(question, "x^2+3").state).toBe("correct");
    expect(verifyFundamentalCompletionAnswer(question, "x^2-x+4").state).toBe("correct");
  });

  it("keeps family 4 corrected q coefficient", () => {
    const question = generatedQuestion("quadratic-quartic", { c: 1 });
    expect(question.qExpression).toBe("8/(x^2+2)");
    expect(question.qExpression).not.toBe("4/(x^2+2)");
  });

  it("accepts family 6 double-angle answers", () => {
    const question = generatedQuestion("sine", { k: 1 });
    expect(verifyFundamentalCompletionAnswer(question, "sin(x)*cos(x)").state).toBe("correct");
    expect(verifyFundamentalCompletionAnswer(question, "sin(2*x)").state).toBe("correct");
  });

  it("accepts family 7 shifted cosine answers", () => {
    const question = generatedQuestion("cosine", { k: 1 });
    expect(verifyFundamentalCompletionAnswer(question, "x*cos(x)").state).toBe("correct");
    expect(verifyFundamentalCompletionAnswer(question, "(x+4)*cos(x)").state).toBe("correct");
  });

  it("accepts family 8 log-power combinations", () => {
    const question = generatedQuestion("log-power", { m: 2 });
    expect(verifyFundamentalCompletionAnswer(question, "x^2+3*ln(x)").state).toBe("correct");
  });

  it("accepts family 9 radical reciprocal combinations", () => {
    const question = generatedQuestion("sqrt-reciprocal", { h: -1 });
    expect(question.knownSolutionExpression).toBe("sqrt(x+1)");
    expect(verifyFundamentalCompletionAnswer(question, "1/sqrt(x+1)").state).toBe("correct");
    expect(verifyFundamentalCompletionAnswer(question, "4/sqrt(x+1)+3*sqrt(x+1)").state).toBe("correct");
  });

  it("accepts family 10 radical exponential combinations", () => {
    const question = generatedQuestion("sqrt-exponential", { h: -1, c: 2 });
    expect(question.knownSolutionExpression).toBe("sqrt(x+1)*exp(2*x)");
    expect(verifyFundamentalCompletionAnswer(question, "sqrt(x+1)*exp(-2*x)").state).toBe("correct");
    expect(
      verifyFundamentalCompletionAnswer(
        question,
        "3*sqrt(x+1)*exp(-2*x)+5*sqrt(x+1)*exp(2*x)",
      ).state,
    ).toBe("correct");
  });
});

describe("deterministic generated question sequence", () => {
  it("uses reproducible signatures for the same seed", () => {
    const first = [0, 1, 2, 3, 4].map((attempt) =>
      generateFundamentalCompletionQuestion({ seed: 12345, attempt }).signature,
    );
    const second = [0, 1, 2, 3, 4].map((attempt) =>
      generateFundamentalCompletionQuestion({ seed: 12345, attempt }).signature,
    );
    expect(second).toEqual(first);
  });

  it("honors recent-signature exclusion", () => {
    const first = generateFundamentalCompletionQuestion({ seed: 444, attempt: 0 });
    const second = generateFundamentalCompletionQuestion({
      seed: 444,
      attempt: 0,
      excludeSignatures: [first.signature ?? first.id],
    });
    expect(second.signature).not.toBe(first.signature);
  });

  it.each(["easy", "medium", "advanced"] as FundamentalCompletionDifficulty[])(
    "selects only requested %s difficulty",
    (difficulty) => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        expect(generateFundamentalCompletionQuestion({ seed: 99, attempt, difficulty }).difficulty).toBe(
          difficulty,
        );
      }
    },
  );

  it("mixed mode produces valid generated questions", () => {
    const questions = [0, 1, 2, 3, 4, 5].map((attempt) =>
      generateFundamentalCompletionQuestion({ seed: 321, attempt, difficulty: "mixed" }),
    );
    expect(new Set(questions.map((question) => question.familyId)).size).toBeGreaterThan(1);
    for (const question of questions) {
      expect(verifyFundamentalCompletionAnswer(question, question.canonicalSecondSolutionExpression).state).toBe(
        "correct",
      );
    }
  });
});
