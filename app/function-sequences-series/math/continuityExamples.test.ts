import { describe, expect, it } from "vitest";
import { CONT_BASE_GRAPH, CONT_EXAMPLES, CONT_EXAMPLE_ORDER, CONT_MAX_N, floorNx, inContDomain } from "./continuityExamples";

const { C1, C2, C3 } = CONT_EXAMPLES;

describe("continuity examples", () => {
  it("exposes the three fixed ids in order", () => {
    expect([...CONT_EXAMPLE_ORDER]).toEqual(["C1", "C2", "C3"]);
    expect(Object.values(CONT_BASE_GRAPH).every((v) => v === false)).toBe(true);
    expect(CONT_MAX_N).toBeGreaterThan(10);
    expect(C3.uniform).toBe(true);
    expect(C1.uniform || C2.uniform).toBe(false);
  });

  it("validates n and x", () => {
    expect(() => C1.value(0, 1)).toThrow(RangeError);
    expect(() => C1.value(1.5, 1)).toThrow(RangeError);
    expect(() => C1.value(CONT_MAX_N + 1, 1)).toThrow(RangeError);
    expect(() => C1.value(3, 2.5)).toThrow(RangeError);
    expect(() => C3.value(3, 1)).toThrow(RangeError);
    expect(() => C2.value(3, Number.NaN)).toThrow(RangeError);
    expect(() => C3.pieces(0)).toThrow(RangeError);
  });

  it("pieces agree with value() and are continuous at joins (C1, C2, C3 at n=1)", () => {
    for (const [ex, n] of [[C1, 7], [C2, 5], [C2, 40], [C3, 1]] as const) {
      const pieces = ex.pieces(n);
      for (const p of pieces) {
        for (let i = 0; i <= 50; i += 1) {
          const x = p.left + (p.right - p.left) * i / 50;
          if (!inContDomain(ex.domain, x)) continue;
          expect(p.value(x)).toBeCloseTo(ex.value(n, x), 9);
        }
      }
      for (let i = 0; i + 1 < pieces.length; i += 1) {
        expect(pieces[i].right).toBe(pieces[i + 1].left);
        expect(pieces[i].value(pieces[i].right)).toBeCloseTo(pieces[i + 1].value(pieces[i + 1].left), 9);
      }
    }
  });

  it("C2 is bounded by n+1 and peaks there", () => {
    for (const n of [1, 5, 40]) {
      let max = 0;
      for (let i = 0; i <= 4000; i += 1) max = Math.max(max, C2.value(n, i / 4000));
      expect(max).toBeLessThanOrEqual(n + 1 + 1e-9);
      expect(C2.value(n, 1 / (n + 1))).toBeCloseTo(n + 1, 9);
    }
  });

  it("C3 floor guard reads n*(k/n) as k", () => {
    for (let n = 1; n <= CONT_MAX_N; n += 1) {
      for (let k = 0; k < n; k += 1) {
        expect(floorNx(n, k / n)).toBe(k);
        expect(C3.value(n, k / n)).toBeCloseTo(k / n, 12);
      }
    }
  });

  it("C3 has jumps for n>=2 and 0 <= x - f_n(x) < 1/n", () => {
    expect(C3.pieces(1)).toHaveLength(1);
    for (const n of [2, 3, 10, 40]) {
      const pieces = C3.pieces(n);
      expect(pieces).toHaveLength(n);
      for (let i = 0; i + 1 < pieces.length; i += 1) {
        expect(pieces[i + 1].value(0) - pieces[i].value(0)).toBeCloseTo(1 / n, 12);
      }
      for (let i = 0; i < 2000; i += 1) {
        const x = i / 2000;
        const gap = x - C3.value(n, x);
        expect(gap).toBeGreaterThanOrEqual(-1e-12);
        expect(gap).toBeLessThan(1 / n);
      }
    }
  });

  it("pointwise limits agree numerically for large n", () => {
    const big = CONT_MAX_N;
    for (const x of [0, 0.3, 0.9, 1.1, 2]) expect(Math.abs(C1.value(big, x) - C1.limit(x))).toBeLessThan(0.05);
    expect(C1.value(big, 1)).toBe(C1.limit(1));
    expect(C2.value(big, 0)).toBe(C2.limit(0));
    for (const x of [0.1, 0.5, 1]) expect(C2.value(big, x)).toBeCloseTo(C2.limit(x), 9);
    for (const x of [0, 0.25, 0.77]) expect(Math.abs(C3.value(big, x) - C3.limit(x))).toBeLessThan(1 / big);
    // limitPieces describe the same function as limit().
    for (const ex of [C1, C2, C3]) {
      for (const x of [0, 0.5, 1]) {
        if (!inContDomain(ex.domain, x)) continue;
        const p = ex.limitPieces.find((q) => (x > q.left || (x === q.left && q.leftClosed)) && (x < q.right || (x === q.right && q.rightClosed)));
        expect(p).toBeDefined();
        expect(p!.value(x)).toBeCloseTo(ex.limit(x), 12);
      }
    }
  });

  it("sup |f_n - f| stays near 1/2 for C1 and is unbounded for C2", () => {
    for (const n of [10, 40]) {
      let sup = 0;
      for (let i = 0; i <= 20000; i += 1) {
        const x = 2 * i / 20000;
        sup = Math.max(sup, Math.abs(C1.value(n, x) - C1.limit(x)));
      }
      expect(sup).toBeGreaterThan(0.45);
      expect(sup).toBeLessThanOrEqual(0.5 + 1e-9);
    }
    for (const n of [1, 5, 40]) {
      for (const k of [3, 5, 8]) {
        const x = 10 ** -k;
        const diff = Math.abs(C2.value(n, x) - C2.limit(x));
        expect(diff).toBeGreaterThan(0.9 / x);
      }
    }
  });
});
