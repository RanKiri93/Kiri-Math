import { describe, expect, it } from "vitest";
import {
  displayScore,
  expressionComplexity,
  factorSharedExponential,
  preferSimpler,
  readableQuotient,
  readableSimplify,
} from "./symbolicSimplify";
import { isProvablyZeroExpression } from "./fundamentalCompletionVerifier";

describe("readableSimplify / readableQuotient", () => {
  it("factors shared exponentials without expanding polynomials", () => {
    const factored = factorSharedExponential("e^(3*x)+e^(3*x)*x");
    expect(isProvablyZeroExpression(`(${factored})-((x+1)*e^(3*x))`)).toBe(true);
    expect(factored).not.toMatch(/e\^\(6/);
  });

  it("cancels shared exponentials in quotients", () => {
    expect(isProvablyZeroExpression(`(${readableQuotient("exp(5*x)", "exp(2*x)")})-(exp(3*x))`)).toBe(
      true,
    );
    expect(readableSimplify("exp(18*x)/exp(18*x)")).toBe("1");
  });

  it("cancels polynomial powers structurally", () => {
    const cancelled = readableQuotient("(3*x+4)*(x+1)^5", "(x+1)^6");
    expect(isProvablyZeroExpression(`(${cancelled})-((3*x+4)/(x+1))`)).toBe(true);
    expect(cancelled).not.toMatch(/x\^5|x\^6/);
  });

  it("does not prefer corrupted expand of negative powers", () => {
    const original = "(-7+4*x^2)/(-2*x-3)";
    const readable = readableSimplify(original);
    expect(isProvablyZeroExpression(`(${readable})-(-(-7+4*x^2)*(2*x+3)^(-1))`)).toBe(true);
    expect(readable).not.toMatch(/\^\(4\)|\^4(?!\*)/);
  });

  it("prefers compact rationals over partial-fraction splits", () => {
    const compact = "(1+x)^(-1)*(2*x+3)";
    const split = "(1+x)^(-1)+2";
    expect(displayScore(compact)).toBeLessThan(displayScore(split));
    expect(preferSimpler(compact, split)).toBe(compact);
  });

  it("uses complexity to reject inflate-then-simplify blow-up", () => {
    const compact = "(1+x)*e^(3*x)";
    const inflated =
      "e^(18*x)+6*e^(18*x)*x+15*e^(18*x)*x^2+20*e^(18*x)*x^3+15*e^(18*x)*x^4+6*e^(18*x)*x^5+e^(18*x)*x^6";
    expect(expressionComplexity(compact)).toBeLessThan(expressionComplexity(inflated) / 2);
    expect(preferSimpler(compact, inflated)).toBe(compact);
  });
});
