export type HintStep = {
  title: string;
  latex?: string;
  text?: string;
};

export type FundamentalCompletionQuestion = {
  id: string;
  familyId?: string;
  difficulty?: "easy" | "medium" | "advanced";
  signature?: string;
  parameters?: Record<string, number>;
  interval: string;
  pExpression: string;
  qExpression: string;
  knownSolutionExpression: string;
  canonicalSecondSolutionExpression: string;
  wronskianExpression?: string;
  residualClearFactorExpression?: string;
  equationLatex: string;
  knownSolutionLatex: string;
  intervalLatex: string;
  safeEvaluationPoints: number[];
  hints: {
    abel: HintStep[];
    reduction: HintStep[];
  };
};

/**
 * Legacy authored fixtures kept for regression coverage.
 * Runtime questions come from fundamentalCompletionGenerator.ts.
 */
export const fundamentalCompletionQuestions: FundamentalCompletionQuestion[] = [
  {
    id: "q1",
    interval: "x > -3/2",
    pExpression: "(7-4*x^2)/(2*x+3)",
    qExpression: "-6*(2*x+1)*(x+1)/(2*x+3)",
    knownSolutionExpression: "exp(x^2)",
    canonicalSecondSolutionExpression: "exp(-3*x)",
    equationLatex:
      "y''+\\frac{7-4x^2}{2x+3}y'-\\frac{6(2x+1)(x+1)}{2x+3}y=0",
    knownSolutionLatex: "y_1=e^{x^2}",
    intervalLatex: "I=\\left(-\\frac{3}{2},\\infty\\right)",
    safeEvaluationPoints: [-1, 0, 1, 2],
    hints: {
      abel: [
        { title: "זהו את המקדם", latex: "p(x)=\\frac{7-4x^2}{2x+3}" },
        {
          title: "נציג נוח של נוסחת אבל",
          latex: "e^{-\\int p(x)\\,dx}=(2x+3)e^{x^2-3x}",
        },
        {
          title: "משוואת הוורונסקיאן",
          latex: "e^{x^2}y'-2xe^{x^2}y=(2x+3)e^{x^2-3x}",
        },
      ],
      reduction: [
        { title: "הציבו", latex: "y=v e^{x^2}" },
        {
          title: "המשוואה עבור v",
          latex: "v''+\\frac{4x^2+12x+7}{2x+3}v'=0",
        },
        { title: "שלב ראשון", latex: "v'=(2x+3)e^{-x^2-3x}" },
      ],
    },
  },
  {
    id: "q2",
    interval: "x > 0",
    pExpression: "2/x",
    qExpression: "-9/x^4",
    knownSolutionExpression: "exp(3/x)",
    canonicalSecondSolutionExpression: "exp(-3/x)",
    equationLatex: "y''+\\frac{2}{x}y'-\\frac{9}{x^4}y=0",
    knownSolutionLatex: "y_1=e^{3/x}",
    intervalLatex: "I=\\left(0,\\infty\\right)",
    safeEvaluationPoints: [0.5, 1, 2, 4],
    hints: {
      abel: [
        { title: "זהו את המקדם", latex: "p(x)=\\frac{2}{x}" },
        { title: "נוסחת אבל", latex: "e^{-\\int p(x)\\,dx}=\\frac{1}{x^2}" },
        { title: "משוואת הוורונסקיאן", latex: "e^{3/x}y'-\\left(e^{3/x}\\right)'y=\\frac{1}{x^2}" },
      ],
      reduction: [
        { title: "הציבו", latex: "y=v e^{3/x}" },
        { title: "המשוואה עבור v", latex: "v''+\\frac{2(x-3)}{x^2}v'=0" },
        { title: "שלב ראשון", latex: "v'=\\frac{e^{-6/x}}{x^2}" },
      ],
    },
  },
  {
    id: "q3",
    interval: "x > 3",
    pExpression: "-2*(x-1)/((x-3)*(x+1))",
    qExpression: "2/((x-3)*(x+1))",
    knownSolutionExpression: "x-1",
    canonicalSecondSolutionExpression: "x^2+3",
    equationLatex:
      "y''-\\frac{2(x-1)}{(x-3)(x+1)}y'+\\frac{2}{(x-3)(x+1)}y=0",
    knownSolutionLatex: "y_1=x-1",
    intervalLatex: "I=\\left(3,\\infty\\right)",
    safeEvaluationPoints: [4, 5, 7, 10],
    hints: {
      abel: [
        { title: "זהו את המקדם", latex: "p(x)=-\\frac{2(x-1)}{(x-3)(x+1)}" },
        { title: "נוסחת אבל", latex: "e^{-\\int p(x)\\,dx}=(x-3)(x+1)" },
        { title: "משוואת הוורונסקיאן", latex: "(x-1)y'-y=(x-3)(x+1)" },
      ],
      reduction: [
        { title: "הציבו", latex: "y=v(x-1)" },
        {
          title: "המשוואה עבור v",
          latex: "v''-\\frac{8}{(x-3)(x-1)(x+1)}v'=0",
        },
        { title: "שלב ראשון", latex: "v'=\\frac{(x-3)(x+1)}{(x-1)^2}" },
      ],
    },
  },
  {
    id: "q4",
    interval: "x > 0",
    pExpression: "-(5*x^2+6)/(x*(x^2+2))",
    qExpression: "8/(x^2+2)",
    knownSolutionExpression: "x^2+1",
    canonicalSecondSolutionExpression: "x^4",
    equationLatex: "y''-\\frac{5x^2+6}{x(x^2+2)}y'+\\frac{8}{x^2+2}y=0",
    knownSolutionLatex: "y_1=x^2+1",
    intervalLatex: "I=\\left(0,\\infty\\right)",
    safeEvaluationPoints: [0.5, 1, 2, 4],
    hints: {
      abel: [
        { title: "זהו את המקדם", latex: "p(x)=-\\frac{5x^2+6}{x(x^2+2)}" },
        { title: "נוסחת אבל", latex: "e^{-\\int p(x)\\,dx}=x^3(x^2+2)" },
        { title: "משוואת הוורונסקיאן", latex: "(x^2+1)y'-2xy=x^3(x^2+2)" },
      ],
      reduction: [
        { title: "הציבו", latex: "y=v(x^2+1)" },
        {
          title: "המשוואה עבור v",
          latex: "v''-\\frac{x^4+3x^2+6}{x(x^2+1)(x^2+2)}v'=0",
        },
        { title: "שלב ראשון", latex: "v'=\\frac{x^3(x^2+2)}{(x^2+1)^2}" },
      ],
    },
  },
  {
    id: "q5",
    interval: "x > -1/2",
    pExpression: "-2/(2*x+1)",
    qExpression: "4/(2*x+1)^2",
    knownSolutionExpression: "2*x+1",
    canonicalSecondSolutionExpression: "(2*x+1)*ln(2*x+1)",
    equationLatex: "y''-\\frac{2}{2x+1}y'+\\frac{4}{(2x+1)^2}y=0",
    knownSolutionLatex: "y_1=2x+1",
    intervalLatex: "I=\\left(-\\frac{1}{2},\\infty\\right)",
    safeEvaluationPoints: [0, 0.5, 1, 2],
    hints: {
      abel: [
        { title: "זהו את המקדם", latex: "p(x)=-\\frac{2}{2x+1}" },
        { title: "נוסחת אבל", latex: "e^{-\\int p(x)\\,dx}=2x+1" },
        { title: "משוואת הוורונסקיאן", latex: "(2x+1)y'-2y=2x+1" },
      ],
      reduction: [
        { title: "הציבו", latex: "y=v(2x+1)" },
        { title: "המשוואה עבור v", latex: "v''+\\frac{2}{2x+1}v'=0" },
        { title: "שלב ראשון", latex: "v'=\\frac{1}{2x+1}" },
      ],
    },
  },
  {
    id: "q6",
    interval: "0 < x < pi",
    pExpression: "-3*cot(x)",
    qExpression: "1+3*cot(x)^2",
    knownSolutionExpression: "sin(x)",
    canonicalSecondSolutionExpression: "sin(x)*cos(x)",
    equationLatex: "y''-3\\cot(x)y'+\\left(1+3\\cot^2(x)\\right)y=0",
    knownSolutionLatex: "y_1=\\sin(x)",
    intervalLatex: "I=\\left(0,\\pi\\right)",
    safeEvaluationPoints: [0.6, 1, 1.4, 2],
    hints: {
      abel: [
        { title: "זהו את המקדם", latex: "p(x)=-3\\cot(x)" },
        { title: "נוסחת אבל", latex: "e^{-\\int p(x)\\,dx}=\\sin^3(x)" },
        { title: "משוואת הוורונסקיאן", latex: "\\sin(x)y'-\\cos(x)y=\\sin^3(x)" },
      ],
      reduction: [
        { title: "הציבו", latex: "y=v\\sin(x)" },
        { title: "המשוואה עבור v", latex: "v''-\\cot(x)v'=0" },
        { title: "שלב ראשון", latex: "v'=\\sin(x)" },
      ],
    },
  },
  {
    id: "q7",
    interval: "-pi/2 < x < pi/2",
    pExpression: "2*tan(x)",
    qExpression: "1+2*tan(x)^2",
    knownSolutionExpression: "cos(x)",
    canonicalSecondSolutionExpression: "x*cos(x)",
    equationLatex: "y''+2\\tan(x)y'+\\left(1+2\\tan^2(x)\\right)y=0",
    knownSolutionLatex: "y_1=\\cos(x)",
    intervalLatex: "I=\\left(-\\frac{\\pi}{2},\\frac{\\pi}{2}\\right)",
    safeEvaluationPoints: [-1, -0.4, 0.3, 1],
    hints: {
      abel: [
        { title: "זהו את המקדם", latex: "p(x)=2\\tan(x)" },
        { title: "נוסחת אבל", latex: "e^{-\\int p(x)\\,dx}=\\cos^2(x)" },
        { title: "משוואת הוורונסקיאן", latex: "\\cos(x)y'+\\sin(x)y=\\cos^2(x)" },
      ],
      reduction: [
        { title: "הציבו", latex: "y=v\\cos(x)" },
        { title: "המשוואה עבור v", latex: "v''=0" },
        { title: "שלב ראשון", latex: "v'=\\text{constant}" },
      ],
    },
  },
  {
    id: "q8",
    interval: "x > sqrt(e)",
    pExpression: "-(2*ln(x)+1)/(x*(2*ln(x)-1))",
    qExpression: "4/(x^2*(2*ln(x)-1))",
    knownSolutionExpression: "ln(x)",
    canonicalSecondSolutionExpression: "x^2",
    residualClearFactorExpression: "x^2*(2*ln(x)-1)",
    equationLatex:
      "y''-\\frac{2\\ln(x)+1}{x(2\\ln(x)-1)}y'+\\frac{4}{x^2(2\\ln(x)-1)}y=0",
    knownSolutionLatex: "y_1=\\ln(x)",
    intervalLatex: "I=\\left(\\sqrt e,\\infty\\right)",
    safeEvaluationPoints: [2, 3, 5, 8],
    hints: {
      abel: [
        { title: "זהו את המקדם", latex: "p(x)=-\\frac{2\\ln(x)+1}{x(2\\ln(x)-1)}" },
        { title: "נוסחת אבל", latex: "e^{-\\int p(x)\\,dx}=x(2\\ln(x)-1)" },
        { title: "משוואת הוורונסקיאן", latex: "\\ln(x)y'-\\frac{1}{x}y=x(2\\ln(x)-1)" },
      ],
      reduction: [
        { title: "הציבו", latex: "y=v\\ln(x)" },
        {
          title: "המשוואה עבור v",
          latex:
            "v''-\\frac{2\\ln^2(x)-3\\ln(x)+2}{x(2\\ln(x)-1)\\ln(x)}v'=0",
        },
        { title: "שלב ראשון", latex: "v'=\\frac{x(2\\ln(x)-1)}{\\ln^2(x)}" },
      ],
    },
  },
];
