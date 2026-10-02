import { describe, expect, it } from "vitest";
import {
  INT_BASE_GRAPH, INT_EXAMPLES, INT_EXAMPLE_ORDER, INT_MAX_N, i3SupBeyond, type IntExample,
} from "./integralExamples";

const { I1, I2, I3 } = INT_EXAMPLES;

/** Fine composite Simpson reference, independent of the production rule. */
function reference(ex: IntExample, n: number, panels = 200000): number {
  const h = 1 / panels;
  let s = ex.value(n, 0) + ex.value(n, 1);
  for (let i = 1; i < panels; i += 1) s += (i % 2 ? 4 : 2) * ex.value(n, i * h);
  return (s * h) / 3;
}

describe("integral examples", () => {
  it("exposes ids, flags and defaults", () => {
    expect([...INT_EXAMPLE_ORDER]).toEqual(["I1", "I2", "I3"]);
    expect(Object.values(INT_BASE_GRAPH).every((v) => v === false)).toBe(true);
    expect(Object.keys(INT_BASE_GRAPH).sort()).toEqual(["area", "band", "integrals", "limit", "supremum"]);
    expect(INT_MAX_N).toBeGreaterThanOrEqual(30);
    expect(I1.uniform).toBe(true);
    expect(I2.uniform).toBe(false);
    expect(I3.uniform).toBe(false);
  });

  it("validates n and x", () => {
    for (const ex of [I1, I2, I3]) {
      expect(() => ex.value(0, 0.5)).toThrow(RangeError);
      expect(() => ex.value(1.5, 0.5)).toThrow(RangeError);
      expect(() => ex.value(INT_MAX_N + 1, 0.5)).toThrow(RangeError);
      expect(() => ex.value(3, -0.1)).toThrow(RangeError);
      expect(() => ex.value(3, 1.1)).toThrow(RangeError);
      expect(() => ex.value(3, Number.NaN)).toThrow(RangeError);
      expect(() => ex.limit(2)).toThrow(RangeError);
      expect(() => ex.integral(0)).toThrow(RangeError);
      expect(() => ex.sup(0.5)).toThrow(RangeError);
    }
    expect(() => i3SupBeyond(3, 0)).toThrow(RangeError);
  });

  it("f_n tends to f pointwise for large n", () => {
    for (const ex of [I1, I2]) {
      for (const x of [0, 0.5, 1]) expect(Math.abs(ex.value(INT_MAX_N, x) - ex.limit(x))).toBeLessThan(0.06);
    }
    expect(I3.limit(0)).toBe(1);
    expect(I3.value(40, 0)).toBe(1);
    for (const x of [0.5, 1]) {
      expect(I3.limit(x)).toBe(0);
      expect(I3.value(40, x)).toBeLessThan(0.04);
    }
    expect(I3.value(40, 1)).toBeLessThan(1e-10);
  });

  it("sup formulas match a fine grid maximum", () => {
    for (const ex of [I1, I2]) {
      for (const n of [1, 2, 7, 25, 40]) {
        let max = 0;
        for (let i = 0; i <= 200000; i += 1) max = Math.max(max, Math.abs(ex.value(n, i / 200000) - ex.limit(i / 200000)));
        expect(ex.sup(n)).toBeGreaterThanOrEqual(max - 1e-12);
        expect(ex.sup(n)).toBeCloseTo(max, 6);
      }
    }
    expect(I1.sup(1)).toBeCloseTo(0.529133, 5);
    expect(I1.value(5, 1 / (Math.cbrt(2) * 5))).toBeCloseTo(I1.sup(5), 12);
    expect(I2.value(9, 1 / 9)).toBeCloseTo(0.5, 12);
    expect(I2.sup(9)).toBe(0.5);
  });

  it("I3: sup is 1, approached but not attained; on [a,1] it is cos^n(a)", () => {
    for (const n of [1, 10, 40]) {
      let max = 0;
      for (let i = 1; i <= 100000; i += 1) max = Math.max(max, Math.abs(I3.value(n, i * 1e-7)));
      expect(max).toBeLessThanOrEqual(1);
      expect(max).toBeGreaterThan(1 - 1e-4);
      expect(I3.sup(n)).toBe(1);
    }
    expect(i3SupBeyond(10, 0.5)).toBeCloseTo(Math.cos(0.5) ** 10, 14);
    expect(i3SupBeyond(40, 0.5)).toBeLessThan(i3SupBeyond(10, 0.5));
    expect(i3SupBeyond(INT_MAX_N, 1)).toBeLessThan(1e-10);
  });

  it("I2 has the closed-form integral and I_n tends to 0 anyway", () => {
    for (const n of [1, 2, 10, 40]) {
      expect(I2.integral(n)).toBeCloseTo(Math.log(1 + n * n) / (2 * n), 14);
      expect(I2.integral(n)).toBeCloseTo(reference(I2, n), 9);
    }
    expect(I2.integral(1)).toBeCloseTo(Math.LN2 / 2, 14);
    expect(I2.integral(40)).toBeLessThan(0.1);
    expect(I2.integral(40)).toBeLessThan(I2.integral(10));
  });

  it("numeric integrals agree with a fine reference", () => {
    for (const n of [1, 3, 12, 40]) {
      expect(I1.integral(n)).toBeCloseTo(reference(I1, n), 9);
      expect(I3.integral(n)).toBeCloseTo(reference(I3, n), 9);
    }
    expect(I3.integral(1)).toBeCloseTo(Math.sin(1), 10);
    expect(I3.integral(2)).toBeCloseTo(0.5 + Math.sin(2) / 4, 10); // integral of cos^2 on [0,1]
  });

  it("integrals tend to the integral of the limit (0)", () => {
    for (const ex of [I1, I2, I3]) {
      expect(ex.limitIntegral).toBe(0);
      expect(ex.integral(INT_MAX_N)).toBeLessThan(ex.integral(1));
      expect(ex.integral(INT_MAX_N)).toBeGreaterThan(0);
      expect(ex.integral(INT_MAX_N)).toBeLessThan(0.2);
    }
    for (const n of [1, 5, 40]) expect(I1.integral(n)).toBeLessThanOrEqual(I1.sup(n));
  });

  it("uniform flag agrees with M_n tending to 0", () => {
    for (const ex of [I1, I2, I3]) expect(ex.sup(INT_MAX_N) < 0.05).toBe(ex.uniform);
  });

  it("views contain the graphs", () => {
    for (const ex of [I1, I2, I3]) {
      for (const n of [1, 40]) {
        for (let i = 0; i <= 200; i += 1) {
          const y = ex.value(n, i / 200);
          expect(y).toBeLessThanOrEqual(ex.view.yMax);
          expect(y).toBeGreaterThanOrEqual(ex.view.yMin);
        }
      }
    }
  });
});
