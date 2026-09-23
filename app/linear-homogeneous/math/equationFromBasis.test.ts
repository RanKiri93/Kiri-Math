import { describe, expect, it } from "vitest";
import { buildHomogeneousEquationFromBasis } from "./equationFromBasis";
import { isProvablyZeroExpression } from "./fundamentalCompletionVerifier";
import { symbolicDeterminant } from "./symbolicDeterminant";

function expectCoefficients(
  result: ReturnType<typeof buildHomogeneousEquationFromBasis>,
  expected: string[],
) {
  expect(result.status).toBe("success");
  if (result.status !== "success") return;
  expect(result.coefficients).toHaveLength(expected.length);
  for (const [index, coefficient] of result.coefficients.entries()) {
    expect(
      isProvablyZeroExpression(`(${coefficient})-(${expected[index]})`),
      `a_${index}: got ${coefficient}, expected ${expected[index]}`,
    ).toBe(true);
  }
}

describe("symbolicDeterminant", () => {
  it("computes 2x2 determinants", () => {
    expect(symbolicDeterminant([
      ["1", "2"],
      ["3", "4"],
    ])).toBe("-2");
  });

  it("computes 3x3 determinants", () => {
    expect(
      symbolicDeterminant([
        ["1", "0", "0"],
        ["0", "1", "0"],
        ["0", "0", "1"],
      ]),
    ).toBe("1");
    expect(
      isProvablyZeroExpression(
        `(${symbolicDeterminant([
          ["1", "2", "3"],
          ["0", "4", "5"],
          ["0", "0", "6"],
        ])})-(24)`,
      ),
    ).toBe(true);
  });

  it("computes 4x4 determinants", () => {
    expect(
      symbolicDeterminant([
        ["1", "0", "0", "0"],
        ["0", "1", "0", "0"],
        ["0", "0", "1", "0"],
        ["0", "0", "0", "1"],
      ]),
    ).toBe("1");
  });

  it("rejects non-square matrices", () => {
    expect(() =>
      symbolicDeterminant([
        ["1", "2"],
        ["3"],
      ]),
    ).toThrow(/square/);
  });
});

describe("buildHomogeneousEquationFromBasis", () => {
  it("rejects invalid orders", () => {
    expect(buildHomogeneousEquationFromBasis(["1"]).status).toBe("invalidOrder");
    expect(buildHomogeneousEquationFromBasis(["1", "x", "x^2", "x^3", "x^4"]).status).toBe(
      "invalidOrder",
    );
  });

  it("reports parse errors per input", () => {
    const result = buildHomogeneousEquationFromBasis(["exp(x)", "sin("]);
    expect(result.status).toBe("parseError");
    if (result.status === "parseError") {
      expect(result.index).toBe(1);
    }
  });

  it("builds y''-2y'+y=0 from exp(x), x*exp(x)", () => {
    const result = buildHomogeneousEquationFromBasis(["exp(x)", "x*exp(x)"]);
    expectCoefficients(result, ["1", "-2"]);
    if (result.status === "success") {
      expect(result.equationLatex).toBe("y''-2y'+y=0");
      expect(result.generalSolutionLatex).toContain("e^{");
      expect(isProvablyZeroExpression(`(${result.wronskianExpression})-(e^(2*x))`)).toBe(true);
    }
  });

  it("accepts Wronskians with isolated zeros: 1, x^2", () => {
    const result = buildHomogeneousEquationFromBasis(["1", "x^2"]);
    expectCoefficients(result, ["0", "-1/x"]);
    if (result.status === "success") {
      expect(result.equationLatex).toContain("y''");
      expect(result.equationLatex).not.toContain("y=");
      expect(isProvablyZeroExpression(`(${result.wronskianExpression})-(2*x)`)).toBe(true);
    }
  });

  it("detects identically vanishing Wronskian", () => {
    for (const basis of [
      ["exp(x)", "2*exp(x)"],
      ["x", "x"],
      ["1", "2"],
    ]) {
      const result = buildHomogeneousEquationFromBasis(basis);
      expect(result.status).toBe("degenerateWronskian");
    }
  });

  it("is invariant under change of basis for order 2", () => {
    const basisA = buildHomogeneousEquationFromBasis(["exp(x)", "x*exp(x)"]);
    const basisB = buildHomogeneousEquationFromBasis([
      "3*exp(x)+2*x*exp(x)",
      "exp(x)-x*exp(x)",
    ]);
    expect(basisA.status).toBe("success");
    expect(basisB.status).toBe("success");
    if (basisA.status === "success" && basisB.status === "success") {
      expectCoefficients(basisA, ["1", "-2"]);
      expectCoefficients(basisB, ["1", "-2"]);
    }
  });

  it("builds the order-3 equation y'''-y'=0", () => {
    expectCoefficients(buildHomogeneousEquationFromBasis(["1", "exp(x)", "exp(-x)"]), [
      "0",
      "-1",
      "0",
    ]);
  });

  it("builds the order-4 equation y^(4)-y''=0", () => {
    expectCoefficients(buildHomogeneousEquationFromBasis(["1", "x", "exp(x)", "exp(-x)"]), [
      "0",
      "0",
      "-1",
      "0",
    ]);
  });

  it("builds y^(4)=0 from the monomial basis", () => {
    expectCoefficients(buildHomogeneousEquationFromBasis(["1", "x", "x^2", "x^3"]), [
      "0",
      "0",
      "0",
      "0",
    ]);
  });

  it("handles sqrt/exp bases from the free-input language", () => {
    const result = buildHomogeneousEquationFromBasis([
      "sqrt(x+1)*exp(2*x)",
      "sqrt(x+1)*exp(-2*x)",
    ]);
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expectCoefficients(result, ["3/(4*(x+1)^2)-4", "-1/(x+1)"]);
      expect(result.generalSolutionLatex).toContain("\\sqrt{");
    }
  });

  it("keeps exp(x), x*exp(2*x) readable (no degree-6 / exp(18x) swell)", () => {
    const result = buildHomogeneousEquationFromBasis(["exp(x)", "x*exp(2*x)"]);
    expect(result.status).toBe("success");
    if (result.status !== "success") return;

    expect(isProvablyZeroExpression(`(${result.wronskianExpression})-((x+1)*exp(3*x))`)).toBe(
      true,
    );
    expectCoefficients(result, ["(2*x+3)/(x+1)", "-(3*x+4)/(x+1)"]);

    const joined = [result.wronskianExpression, ...result.coefficients, result.equationLatex].join(
      "|",
    );
    expect(joined).not.toMatch(/x\^6/);
    expect(joined).not.toMatch(/e\^\(18/);
    expect(joined).not.toMatch(/exp\(18/);
    expect(joined).not.toMatch(/\d{8,}/);
    // Prefer compact rational product over partial-fraction split.
    expect(result.coefficients[0]).not.toMatch(/\^\(-1\)\s*\+/);
    expect(result.coefficients[1]).not.toMatch(/\^\(-1\)\s*-/);
  });

  it("keeps exp(3*x), x*exp(2*x) exact — no rationalized Euler base", () => {
    const result = buildHomogeneousEquationFromBasis(["exp(3*x)", "x*exp(2*x)"]);
    expect(result.status).toBe("success");
    if (result.status !== "success") return;

    expect(
      isProvablyZeroExpression(`(${result.wronskianExpression})-((1-x)*exp(5*x))`),
    ).toBe(true);

    const joined = [result.wronskianExpression, result.wronskianLatex, ...result.coefficients].join(
      "|",
    );
    expect(joined).not.toMatch(/119696244|325368125/);
    expect(joined).not.toMatch(/\d{8,}/);
    expect(joined).toMatch(/exp\(|e\^/);
  });

  it("keeps classic and polynomial bases compact", () => {
    const classic = buildHomogeneousEquationFromBasis(["exp(x)", "x*exp(x)"]);
    expectCoefficients(classic, ["1", "-2"]);
    if (classic.status === "success") {
      expect(isProvablyZeroExpression(`(${classic.wronskianExpression})-(exp(2*x))`)).toBe(true);
    }

    const poly = buildHomogeneousEquationFromBasis(["1", "x^2"]);
    expectCoefficients(poly, ["0", "-1/x"]);
    if (poly.status === "success") {
      expect(isProvablyZeroExpression(`(${poly.wronskianExpression})-(2*x)`)).toBe(true);
    }
  });

  it("keeps exp(x^2), exp(-3*x) coefficients compact", () => {
    const result = buildHomogeneousEquationFromBasis(["exp(x^2)", "exp(-3*x)"]);
    expect(result.status).toBe("success");
    if (result.status !== "success") return;

    expectCoefficients(result, [
      "-6*(2*x+1)*(x+1)/(2*x+3)",
      "(7-4*x^2)/(2*x+3)",
    ]);
    const joined = result.coefficients.join("|");
    expect(joined).not.toMatch(/e\^/);
    expect(joined).not.toMatch(/exp\(/);
  });

  it("is invariant under an invertible constant mix for order 3", () => {
    const basisA = buildHomogeneousEquationFromBasis(["1", "exp(x)", "exp(-x)"]);
    const basisB = buildHomogeneousEquationFromBasis([
      "1+2*exp(x)",
      "exp(x)-exp(-x)",
      "3*exp(-x)",
    ]);
    expect(basisA.status).toBe("success");
    expect(basisB.status).toBe("success");
    if (basisA.status === "success" && basisB.status === "success") {
      for (const [index, coefficient] of basisA.coefficients.entries()) {
        expect(
          isProvablyZeroExpression(`(${coefficient})-(${basisB.coefficients[index]})`),
        ).toBe(true);
      }
    }
  });
});
