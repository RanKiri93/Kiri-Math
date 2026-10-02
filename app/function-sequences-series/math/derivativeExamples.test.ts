import { describe, expect, it } from "vitest";
import { DER_BASE_GRAPH, DER_EXAMPLES, DER_EXAMPLE_ORDER, DER_MAX_N } from "./derivativeExamples";

const { D1, D2, D3 } = DER_EXAMPLES;
const ALL = [D1, D2, D3];

function maxOver(f: (x: number) => number, panels = 20000): number {
  let m = -Infinity;
  for (let i = 0; i <= panels; i += 1) m = Math.max(m, f(i === panels ? 1 : i / panels));
  return m;
}

describe("derivative examples", () => {
  it("exposes ids, flags and defaults", () => {
    expect([...DER_EXAMPLE_ORDER]).toEqual(["D1", "D2", "D3"]);
    expect(Object.values(DER_BASE_GRAPH).every((v) => v === false)).toBe(true);
    expect(Object.keys(DER_BASE_GRAPH).sort()).toEqual(["band", "derivBand", "derivLimit", "derivative", "limit"]);
    expect(DER_MAX_N).toBeGreaterThanOrEqual(30);
    for (const ex of ALL) expect(ex.derivativeLatex).toContain("f_n'");
  });

  it("validates n and x", () => {
    for (const ex of ALL) {
      expect(() => ex.value(0, 0.5)).toThrow(RangeError);
      expect(() => ex.value(1.5, 0.5)).toThrow(RangeError);
      expect(() => ex.derivative(DER_MAX_N + 1, 0.5)).toThrow(RangeError);
      expect(() => ex.value(3, -0.1)).toThrow(RangeError);
      expect(() => ex.derivative(3, 1.1)).toThrow(RangeError);
      expect(() => ex.value(3, Number.NaN)).toThrow(RangeError);
      expect(() => ex.derivativeLimit(2)).toThrow(RangeError);
      expect(() => ex.sup(0)).toThrow(RangeError);
      expect(() => ex.derivativeSup(0.5)).toThrow(RangeError);
    }
    expect(() => D1.limit!(2)).toThrow(RangeError);
  });

  it("derivative formulas match difference quotients", () => {
    for (const ex of ALL) {
      for (const n of [1, 2, 5, 17, 40]) {
        for (const x of [0.1, 0.35, 0.6, 0.9]) {
          const h = 1e-6;
          const q = (ex.value(n, x + h) - ex.value(n, x - h)) / (2 * h);
          expect(ex.derivative(n, x)).toBeCloseTo(q, 5);
        }
      }
    }
    expect(D2.derivative(1, 0)).toBe(1);
    expect(D1.value(7, 0)).toBe(0);
    expect(D2.value(7, 0)).toBe(0);
  });

  it("limits at sample points, including x=1 for D2", () => {
    for (const x of [0, 0.3, 0.99, 1]) {
      expect(D1.limit!(x)).toBe(0);
      expect(D2.limit!(x)).toBe(0);
      expect(D1.derivativeLimit(x)).toBe(0);
      expect(D3.derivativeLimit(x)).toBe(0);
    }
    expect(D2.derivativeLimit(0.99)).toBe(0);
    expect(D2.derivativeLimit(1)).toBe(0.5);
    expect(D2.derivative(DER_MAX_N, 1)).toBe(0.5);
    expect(D3.limit).toBeNull();
    expect(D3.sup(5)).toBeNull();
    expect(D3.value(9, 0.4)).toBe(9);
  });

  it("sup values agree with a numeric maximum", () => {
    for (const ex of [D1, D2]) {
      for (const n of [1, 2, 3, 10, 40]) {
        const numeric = maxOver((x) => Math.abs(ex.value(n, x) - ex.limit!(x)));
        expect(numeric).toBeLessThanOrEqual(ex.sup(n)! + 1e-12);
        expect(numeric).toBeCloseTo(ex.sup(n)!, 6);
        const dn = maxOver((x) => Math.abs(ex.derivative(n, x) - ex.derivativeLimit(x)));
        expect(dn).toBeLessThanOrEqual(ex.derivativeSup(n) + 1e-12);
        expect(dn).toBeCloseTo(ex.derivativeSup(n), 5);
      }
    }
    expect(D3.derivativeSup(8)).toBe(0);
  });

  it("D1: derivatives converge uniformly, D2: they do not", () => {
    expect(D1.derivativeSup(40)).toBeLessThan(D1.derivativeSup(10));
    expect(D1.derivativeSup(DER_MAX_N)).toBeCloseTo(1 / Math.sqrt(DER_MAX_N), 12);
    expect(D2.sup(40)!).toBeLessThan(D2.sup(10)!);
    expect(D2.sup(40)!).toBeLessThanOrEqual(Math.PI / 160 + 1e-15);
    for (const n of [2, 10, 40]) expect(D2.derivativeSup(n)).toBeGreaterThanOrEqual(0.5);
    expect(D2.derivativeSup(1)).toBe(1);
  });

  it("views contain the data they are meant to show", () => {
    for (const ex of [D1, D2]) {
      for (let n = 1; n <= DER_MAX_N; n += 1) {
        expect(maxOver((x) => ex.value(n, x), 400)).toBeLessThanOrEqual(ex.view.yMax);
        expect(maxOver((x) => ex.derivative(n, x), 400)).toBeLessThanOrEqual(ex.derivativeView.yMax);
      }
    }
  });
});
