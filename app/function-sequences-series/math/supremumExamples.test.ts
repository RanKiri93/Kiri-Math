import { describe, expect, it } from "vitest";
import {
  SUP_EXAMPLES,
  SUP_EXAMPLE_ORDER,
  SUP_MAX_N,
  assertSupN,
  inSupDomain,
  type SupExample,
  type SupExampleId,
} from "./supremumExamples";

const NS = [1, 2, 3, 5, 17, 64];
const ids = SUP_EXAMPLE_ORDER;
const ex = (id: SupExampleId): SupExample => SUP_EXAMPLES[id];

/** Test-only numeric meaning of the value tokens used by candidates and limits. */
const TOKEN_VALUE: Record<string, (n: number) => number> = {
  zero: () => 0,
  "inv-e": () => 1 / Math.E,
  quarter: () => 0.25,
  "four-over-n-e2": (n) => 4 / (n * Math.E ** 2),
  "n-e-neg-n": (n) => n * Math.exp(-n),
  "sup-e3p": (n) => 2 ** -n * (1 - 2 ** -n),
};

function denseMax(e: SupExample, n: number): number {
  const left = e.domain.left;
  const right = Math.min(e.domain.right, 30);
  const steps = 200000;
  let best = -Infinity;
  for (let i = 0; i <= steps; i += 1) {
    best = Math.max(best, e.value(n, left + ((right - left) * i) / steps));
  }
  return best;
}

describe("supremum examples: data", () => {
  it("lists the lecturer's order and the n cap", () => {
    expect(ids).toEqual(["E1", "E1p", "E2", "E3", "E3p"]);
    expect(SUP_MAX_N).toBe(64);
    expect(() => assertSupN(65)).toThrow(RangeError);
    expect(() => assertSupN(0)).toThrow(RangeError);
    expect(() => assertSupN(2.5)).toThrow(RangeError);
    expect(() => assertSupN(64)).not.toThrow();
  });

  it.each(ids)("%s: derivative matches central finite differences", (id) => {
    const e = ex(id);
    for (const n of NS) {
      const points = id.startsWith("E3")
        ? [0.1, 0.4, 0.5, 0.8, 0.95]
        : [0.3 / n, 1 / n, 1.7 / n, 2 / n, 3.5 / n, 1, 2];
      for (const x of points) {
        const h = 1e-6;
        const numeric = (e.value(n, x + h) - e.value(n, x - h)) / (2 * h);
        const exact = e.derivative(n, x);
        expect(Math.abs(numeric - exact)).toBeLessThan(1e-4 * (1 + Math.abs(exact)));
      }
    }
  });

  it.each(ids)("%s: derivative changes sign at an interior critical point, and only there", (id) => {
    const e = ex(id);
    for (const n of NS) {
      const xn = e.criticalPoint(n);
      expect(Math.abs(e.derivative(n, xn))).toBeLessThan(1e-9);
      if (e.criticalInterior(n)) {
        expect(inSupDomain(e, xn)).toBe(true);
        expect(xn).toBeGreaterThan(e.domain.left);
        expect(xn).toBeLessThan(e.domain.right);
        const d = 0.02 / n;
        expect(e.derivative(n, xn - d)).toBeGreaterThan(0);
        expect(e.derivative(n, xn + d)).toBeLessThan(0);
      } else {
        // x_n outside the interior of the domain: f_n' keeps one sign on the whole domain.
        const sign = id === "E1p" ? -1 : 1;
        const right = Math.min(e.domain.right, 30);
        for (let i = 1; i <= 200; i += 1) {
          const x = e.domain.left + (i / 200) * (right - e.domain.left);
          if (i === 200 && id === "E3p") continue;
          expect(sign * e.derivative(n, x)).toBeGreaterThanOrEqual(-1e-12);
        }
        // x_n is not strictly inside the domain: outside it, or (only for n = 1) at its endpoint.
        const inside = xn > e.domain.left && xn < e.domain.right;
        expect(inside).toBe(false);
      }
    }
  });

  it.each(ids)("%s: supValue equals the best candidate and dominates dense samples", (id) => {
    const e = ex(id);
    for (const n of NS) {
      const values = e.candidates.map((c) => c.value(n));
      expect(e.supValue(n)).toBeCloseTo(Math.max(...values), 12);
      const max = e.candidates.filter((c) => c.isMaximum);
      expect(max).toHaveLength(1);
      expect(max[0].value(n)).toBeCloseTo(e.supValue(n), 12);
      if (max[0].kind !== "limit-at-infinity") expect(max[0].x(n)).toBeCloseTo(e.argmax(n), 12);
      const dense = denseMax(e, n);
      expect(e.supValue(n)).toBeGreaterThanOrEqual(dense - 1e-12);
      expect(e.supValue(n) - dense).toBeLessThan(1e-4);
      expect(e.value(n, e.argmax(n))).toBeCloseTo(e.supValue(n), 12);
    }
  });

  it.each(ids)("%s: candidate value tokens match their float values", (id) => {
    const e = ex(id);
    for (const n of NS) {
      for (const c of e.candidates) {
        expect(TOKEN_VALUE[c.valueToken]).toBeDefined();
        expect(TOKEN_VALUE[c.valueToken](n)).toBeCloseTo(c.value(n), 12);
        if (c.kind === "endpoint") expect(e.value(n, c.x(n))).toBeCloseTo(c.value(n), 12);
        if (c.kind === "interior-critical") expect(e.value(n, c.x(n))).toBeCloseTo(c.value(n), 12);
        if (c.kind === "limit-at-infinity") expect(e.value(n, 1e6 / n)).toBeCloseTo(c.value(n), 9);
      }
    }
    expect(e.candidates.some((c) => c.kind === "interior-critical")).toBe(e.criticalInterior(1));
  });

  it.each(ids)("%s: limit token and verdict agree with the trend of M_n", (id) => {
    const e = ex(id);
    expect(TOKEN_VALUE[e.limitToken](1)).toBeCloseTo(e.limitValue, 12);
    if (e.limitValue === 0) {
      for (let n = 1; n < SUP_MAX_N; n += 1) expect(e.supValue(n + 1)).toBeLessThan(e.supValue(n));
      expect(e.supValue(SUP_MAX_N)).toBeLessThan(0.01);
      expect(e.verdict).toBe("uniform");
    } else {
      for (const n of NS) expect(e.supValue(n)).toBeCloseTo(e.limitValue, 12);
      expect(e.verdict).toBe("not-uniform");
    }
  });

  it("n = 1 coincidences between a domain and its repaired version", () => {
    expect(ex("E1").supValue(1)).toBeCloseTo(ex("E1p").supValue(1), 12);
    expect(ex("E1").criticalPoint(1)).toBe(1);
    expect(ex("E1p").derivative(1, 1)).toBeCloseTo(0, 12);
    expect(ex("E3").supValue(1)).toBeCloseTo(ex("E3p").supValue(1), 12);
    expect(ex("E3").criticalPoint(1)).toBe(0.5);
    expect(ex("E3p").derivative(1, 0.5)).toBeCloseTo(0, 12);
    // For n >= 2 the critical point leaves the repaired domain and the maximum sits at the endpoint.
    for (const n of [2, 3, 17, 64]) {
      expect(ex("E1p").criticalPoint(n)).toBeLessThan(1);
      expect(ex("E3p").criticalPoint(n)).toBeGreaterThan(0.5);
      expect(ex("E1p").supValue(n)).toBeLessThan(ex("E1").supValue(n));
      expect(ex("E3p").supValue(n)).toBeLessThan(ex("E3").supValue(n));
    }
    // E2: x_1 = 2, and M_1 = 4/e^2.
    expect(ex("E2").criticalPoint(1)).toBe(2);
    expect(ex("E2").supValue(1)).toBeCloseTo(4 / Math.E ** 2, 12);
  });

  it.each(ids)("%s: fixed y range holds every curve, and the default window shows the peak", (id) => {
    const e = ex(id);
    const [yMin, yMax] = e.yRange;
    expect(yMin).toBeLessThan(0);
    for (const n of NS) {
      expect(e.supValue(n)).toBeLessThan(yMax);
      expect(denseMax(e, n)).toBeLessThan(yMax);
      if (id !== "E1p" && id !== "E3p") {
        expect(e.argmax(n)).toBeGreaterThanOrEqual(e.defaultView.left);
        expect(e.argmax(n)).toBeLessThanOrEqual(e.defaultView.right);
      }
    }
    expect(e.defaultView.right).toBeGreaterThan(e.defaultView.left);
    expect(inSupDomain(e, e.defaultProbe)).toBe(true);
  });

  it("E2 window reaches x >= 2 for small n", () => {
    expect(ex("E2").defaultView.right).toBeGreaterThanOrEqual(2);
    expect(ex("E2").criticalPoint(1)).toBeLessThanOrEqual(ex("E2").defaultView.right);
  });

  it("domain membership", () => {
    expect(inSupDomain(ex("E1"), 0)).toBe(true);
    expect(inSupDomain(ex("E1p"), 0.99)).toBe(false);
    expect(inSupDomain(ex("E1p"), 1)).toBe(true);
    expect(inSupDomain(ex("E3"), 1)).toBe(true);
    expect(inSupDomain(ex("E3p"), 0.51)).toBe(false);
    expect(inSupDomain(ex("E3p"), 0.5)).toBe(true);
  });

  it("carries no decimal approximation of e in its LaTeX or labels", () => {
    // limitValue and friends are floats for tests and plots; labels and LaTeX are strings.
    const text = JSON.stringify(SUP_EXAMPLES, (_key, value) => (typeof value === "number" ? undefined : value));
    expect(text).not.toMatch(/2\.71|0\.36|0\.54/);
  });
});
