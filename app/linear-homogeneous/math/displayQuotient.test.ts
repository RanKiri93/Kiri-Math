import { describe, expect, it } from "vitest";
import { rewriteInversePowersAsQuotient } from "./displayQuotient";
import { expressionToLatex, homogeneousEquationLatex } from "./equationFormatting";

describe("rewriteInversePowersAsQuotient", () => {
  it("turns inverse-power products into quotients", () => {
    expect(rewriteInversePowersAsQuotient("(1+x)^(-1)*(2*x+3)")).toBe("((2*x+3))/(1+x)");
    expect(rewriteInversePowersAsQuotient("-(1+x)^(-1)*(3*x+4)")).toBe("-(((3*x+4))/(1+x))");
    expect(rewriteInversePowersAsQuotient("-x^(-1)")).toBe("-((1)/(x))");
    expect(rewriteInversePowersAsQuotient("-6*(1+2*x)*(1+x)*(2*x+3)^(-1)")).toBe(
      "-((6*(1+2*x)*(1+x))/(2*x+3))",
    );
  });

  it("rewrites each summand of mixed expressions", () => {
    expect(rewriteInversePowersAsQuotient("(3/4)*(1+x)^(-2)-4")).toBe("((3/4))/((1+x)^(2))-4");
  });

  it("leaves expressions without inverse powers unchanged", () => {
    expect(rewriteInversePowersAsQuotient("(1+x)*e^(3*x)")).toBe("(1+x)*e^(3*x)");
    expect(rewriteInversePowersAsQuotient("2*x+3")).toBe("2*x+3");
  });
});

describe("expressionToLatex fractions", () => {
  it("renders inverse-power coefficients as LaTeX fractions", () => {
    expect(expressionToLatex("(1+x)^(-1)*(2*x+3)")).toContain("\\frac");
    expect(expressionToLatex("(1+x)^(-1)*(2*x+3)")).not.toContain("^{-1}");
    expect(expressionToLatex("-x^(-1)")).toContain("\\frac");
  });

  it("keeps the ODE display free of ^{-1} for the primary regression shape", () => {
    const latex = homogeneousEquationLatex(2, [
      "(1+x)^(-1)*(2*x+3)",
      "-(1+x)^(-1)*(3*x+4)",
    ]);
    expect(latex).toContain("\\frac");
    expect(latex).not.toContain("^{-1}");
    expect(latex).toContain("y''");
    expect(latex).toContain("=0");
  });
});
