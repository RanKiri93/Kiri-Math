import { describe, expect, it } from "vitest";
import { differentiate } from "./differentiate";
import { parseFormula, toLatex, toNerdamer } from "./formulaParser";
import { isProvablyZeroExpression } from "./fundamentalCompletionVerifier";
import {
  ensureSymbolicNerdamerMode,
  looksLikeRationalizedConstant,
  safeEvaluate,
} from "./nerdamerConfig";
import { readableSimplify } from "./symbolicSimplify";
import nerdamer from "nerdamer";
import "nerdamer/Algebra.js";

describe("exact symbolic exponentials and constants", () => {
  it("simplifies exp products and quotients without rationalizing e", () => {
    const product = readableSimplify("exp(3*x)*exp(2*x)");
    const quotient = readableSimplify("exp(7*x)/exp(2*x)");
    const cancel = readableSimplify("exp(18*x)/exp(18*x)");
    const unit = readableSimplify("exp(x)*exp(-x)");

    expect(isProvablyZeroExpression(`(${product})-(exp(5*x))`)).toBe(true);
    expect(isProvablyZeroExpression(`(${quotient})-(exp(5*x))`)).toBe(true);
    expect(cancel).toBe("1");
    expect(isProvablyZeroExpression(`(${unit})-(1)`)).toBe(true);

    for (const expression of [product, quotient, cancel, unit]) {
      expect(looksLikeRationalizedConstant(expression)).toBe(false);
      expect(expression).not.toMatch(/119696244|325368125/);
    }
  });

  it("differentiates exp(3*x) to 3*exp(3*x)", () => {
    const derivative = toNerdamer(differentiate(parseFormula("exp(3*x)").ast));
    expect(isProvablyZeroExpression(`(${derivative})-(3*exp(3*x))`)).toBe(true);
    expect(looksLikeRationalizedConstant(derivative)).toBe(false);
  });

  it("parses e^(3*x) as an exact Exp node, not Math.E", () => {
    const parsed = parseFormula("e^(3*x)");
    expect(parsed.ast).toEqual({
      type: "function",
      name: "exp",
      argument: {
        type: "binary",
        op: "*",
        left: { type: "number", value: "3" },
        right: { type: "variable", name: "x" },
      },
    });
    expect(parsed.nerdamer).toBe("exp((3*x))");
    expect(toLatex(parsed.ast)).toContain("e^{");
  });

  it("keeps pi symbolic in sin(pi*x)", () => {
    const parsed = parseFormula("sin(pi*x)");
    expect(parsed.nerdamer).toContain("pi");
    expect(parsed.nerdamer).not.toMatch(/\d{8,}/);
    expect(toLatex(parsed.ast)).toContain("\\pi");

    const simplified = readableSimplify(parsed.nerdamer);
    expect(simplified).not.toMatch(/\d{8,}/);
    expect(looksLikeRationalizedConstant(simplified)).toBe(false);
  });

  it("restores symbolic mode after a throwing numerical evaluation", () => {
    ensureSymbolicNerdamerMode();
    try {
      safeEvaluate(nerdamer("1/(x-1)") as never, { x: "1" });
    } catch {
      // expected division by zero
    }
    ensureSymbolicNerdamerMode();
    const restored = nerdamer("exp(5*x)").toString();
    expect(restored).toMatch(/exp\(|e\^/);
    expect(restored).not.toMatch(/119696244|325368125/);
  });
});
