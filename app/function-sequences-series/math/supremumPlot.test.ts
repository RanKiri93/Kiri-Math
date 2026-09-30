import { describe, expect, it } from "vitest";
import { PLOT_HEIGHT, PLOT_MARGIN, PLOT_WIDTH } from "./sequencePlot";
import { SUP_EXAMPLES, SUP_EXAMPLE_ORDER, inSupDomain } from "./supremumExamples";
import {
  SUP_MN_MAX_N,
  criticalPointOnCurve,
  epsilonBand,
  epsilonReadout,
  maximumPoint,
  mnDots,
  signStripIntervals,
  supCurveSegments,
  supSampleXs,
  supVisibleCurve,
  tangentGeometry,
} from "./supremumPlot";

const NS = [1, 2, 5, 17, 64];
const { E1, E1p, E2, E3, E3p } = SUP_EXAMPLES;

describe("sampling", () => {
  it.each(SUP_EXAMPLE_ORDER)("%s: always includes x_n, the argmax and the window ends", (id) => {
    const e = SUP_EXAMPLES[id];
    for (const n of NS) {
      const xs = supSampleXs(e, n, e.defaultView.left, e.defaultView.right);
      expect(xs[0]).toBe(e.defaultView.left);
      expect(xs[xs.length - 1]).toBe(e.defaultView.right);
      const x = e.criticalPoint(n);
      if (x >= e.defaultView.left && x <= e.defaultView.right) expect(xs).toContain(x);
      expect(xs).toContain(e.argmax(n));
      for (let i = 1; i < xs.length; i += 1) expect(xs[i]).toBeGreaterThan(xs[i - 1]);
    }
  });

  it("resolves the narrow peaks: 1/n, 2/n and near 1 for E3", () => {
    const near = (xs: number[], a: number, b: number) => xs.filter((x) => x >= a && x <= b).length;
    expect(near(supSampleXs(E1, 64, 0, 6), 0, 4 / 64)).toBeGreaterThan(40);
    expect(near(supSampleXs(E2, 64, 0, 6), 0, 6 / 64)).toBeGreaterThan(40);
    expect(near(supSampleXs(E3, 64, 0, 1), 0.95, 1)).toBeGreaterThan(30);
  });

  it.each(SUP_EXAMPLE_ORDER)("%s: the sampled curve reaches M_n exactly", (id) => {
    const e = SUP_EXAMPLES[id];
    for (const n of NS) {
      const { main } = supCurveSegments(e, n, e.defaultView);
      const best = Math.max(...main.flat().map((p) => p.y));
      expect(best).toBeCloseTo(e.supValue(n), 12);
    }
  });

  it("splits the curve into domain and faded context", () => {
    for (const n of [1, 5, 64]) {
      const a = supCurveSegments(E1, n, E1.defaultView);
      expect(a.context).toHaveLength(0);
      const b = supCurveSegments(E1p, n, E1p.defaultView);
      expect(b.main.flat().every((p) => p.x >= 1)).toBe(true);
      expect(b.context.flat().every((p) => p.x <= 1)).toBe(true);
      expect(b.context.flat().some((p) => p.x === 1 / n) || n === 1).toBe(true);
      const c = supCurveSegments(E3p, n, E3p.defaultView);
      expect(c.main.flat().every((p) => p.x <= 0.5)).toBe(true);
      expect(c.context.flat().every((p) => p.x >= 0.5)).toBe(true);
      expect(c.context.flat().some((p) => p.x === E3p.criticalPoint(n))).toBe(true);
    }
  });

  it("clipping keeps every point inside the fixed y range", () => {
    for (const id of SUP_EXAMPLE_ORDER) {
      const e = SUP_EXAMPLES[id];
      const { main, context } = supVisibleCurve(e, 1, e.defaultView);
      for (const p of [...main, ...context].flat()) {
        expect(p.y).toBeGreaterThanOrEqual(e.yRange[0]);
        expect(p.y).toBeLessThanOrEqual(e.yRange[1]);
      }
    }
  });
});

describe("tangent, markers and sign strip", () => {
  it("the tangent at x_n is horizontal and touches the curve at the peak", () => {
    for (const n of NS) {
      const t = tangentGeometry(E1, n, 1 / n, E1.defaultView);
      expect(Math.abs(t.slope)).toBeLessThan(1e-9);
      expect(t.point.y).toBeCloseTo(1 / Math.E, 12);
      expect(t.segments).toHaveLength(1);
      expect(t.segments[0].every((p) => Math.abs(p.y - t.point.y) < 1e-8)).toBe(true);
    }
  });

  it("the tangent has the derivative as slope and stays in the y range", () => {
    const t = tangentGeometry(E1, 5, 0.1, E1.defaultView);
    expect(t.slope).toBeCloseTo(E1.derivative(5, 0.1), 12);
    for (const s of t.segments) for (const p of s) {
      expect(p.y).toBeGreaterThanOrEqual(E1.yRange[0] - 1e-12);
      expect(p.y).toBeLessThanOrEqual(E1.yRange[1] + 1e-12);
    }
    expect(() => tangentGeometry(E1p, 5, 0.5, E1p.defaultView)).toThrow(RangeError);
  });

  it("sign strip follows the sign of the derivative", () => {
    const s1 = signStripIntervals(E1, 5, E1.defaultView);
    expect(s1).toEqual([{ left: 0, right: 0.2, sign: 1 }, { left: 0.2, right: 6, sign: -1 }]);
    expect(signStripIntervals(E1p, 5, E1p.defaultView)).toEqual([{ left: 1, right: 6, sign: -1 }]);
    const s2 = signStripIntervals(E2, 3, E2.defaultView);
    expect(s2.map((s) => s.sign)).toEqual([1, -1]);
    expect(s2[0].right).toBeCloseTo(2 / 3, 12);
    const s3 = signStripIntervals(E3, 4, E3.defaultView);
    expect(s3.map((s) => s.sign)).toEqual([1, -1]);
    expect(s3[0].right).toBeCloseTo(2 ** -0.25, 12);
    expect(signStripIntervals(E3p, 4, E3p.defaultView)).toEqual([{ left: 0, right: 0.5, sign: 1 }]);
    // n = 1: the critical points coincide with an endpoint, so one sign remains.
    expect(signStripIntervals(E1p, 1, E1p.defaultView).map((s) => s.sign)).toEqual([-1]);
    expect(signStripIntervals(E3p, 1, E3p.defaultView).map((s) => s.sign)).toEqual([1]);
  });

  it("markers", () => {
    for (const n of NS) {
      for (const id of SUP_EXAMPLE_ORDER) {
        const e = SUP_EXAMPLES[id];
        const m = maximumPoint(e, n);
        expect(inSupDomain(e, m.x)).toBe(true);
        expect(m.y).toBeCloseTo(e.value(n, m.x), 12);
        const c = criticalPointOnCurve(e, n);
        expect(c.interior).toBe(e.criticalInterior(n));
        expect(c.y).toBeCloseTo(e.value(n, c.x), 12);
      }
    }
    expect(maximumPoint(E1p, 8).x).toBe(1);
    expect(maximumPoint(E3p, 8).x).toBe(0.5);
    expect(criticalPointOnCurve(E1p, 4).x).toBe(0.25);
  });
});

describe("M_n versus n", () => {
  it("dots are laid out inside the plot", () => {
    for (const id of SUP_EXAMPLE_ORDER) {
      const e = SUP_EXAMPLES[id];
      const dots = mnDots(e);
      expect(dots).toHaveLength(SUP_MN_MAX_N);
      for (let i = 0; i < dots.length; i += 1) {
        expect(dots[i].n).toBe(i + 1);
        expect(dots[i].x).toBeGreaterThan(PLOT_MARGIN.left);
        expect(dots[i].x).toBeLessThan(PLOT_WIDTH - PLOT_MARGIN.right);
        expect(dots[i].y).toBeGreaterThan(PLOT_MARGIN.top);
        expect(dots[i].y).toBeLessThan(PLOT_HEIGHT - PLOT_MARGIN.bottom);
        if (i > 0) expect(dots[i].x).toBeGreaterThan(dots[i - 1].x);
      }
    }
    const flat = mnDots(E1);
    expect(new Set(flat.map((d) => d.y.toFixed(9))).size).toBe(1);
    const falling = mnDots(E2);
    expect(falling[39].y).toBeGreaterThan(falling[0].y);
  });

  it("epsilon band is symmetric about zero and clamped", () => {
    const b = epsilonBand(E2, 0.1);
    expect(b.lower).toBe(-0.1);
    expect(b.upper).toBe(0.1);
    expect(b.yUpper).toBeLessThan(b.yLower);
    const huge = epsilonBand(E2, 5);
    expect(huge.yUpper).toBe(PLOT_MARGIN.top);
    expect(huge.yLower).toBe(PLOT_HEIGHT - PLOT_MARGIN.bottom);
  });

  it("N readout", () => {
    // E1: M_n = 1/e for all n, so no band below 1/e ever catches the dots.
    expect(epsilonReadout(E1, 0.2)).toEqual({ N: null, reason: "not-tending" });
    expect(epsilonReadout(E1, 1 / Math.E)).toEqual({ N: null, reason: "not-tending" });
    expect(epsilonReadout(E1, 0.5)).toEqual({ N: 0 });
    expect(epsilonReadout(E3, 0.25)).toEqual({ N: null, reason: "not-tending" });
    expect(epsilonReadout(E3, 0.1)).toEqual({ N: null, reason: "not-tending" });
    expect(epsilonReadout(E3, 0.3)).toEqual({ N: 0 });
    // E2: M_n = 4/(n e^2) < 0.05 iff n >= 11.
    expect(epsilonReadout(E2, 0.05)).toEqual({ N: 10 });
    expect(epsilonReadout(E2, 0.001)).toEqual({ N: null, reason: "beyond-range" });
    expect(epsilonReadout(E1p, 0.1)).toEqual({ N: 3 });
    expect(epsilonReadout(E3p, 0.1)).toEqual({ N: 3 });
    expect(epsilonReadout(E3p, 0.3)).toEqual({ N: 0 });
  });
});

describe("guards", () => {
  it("rejects n beyond the activity cap", () => {
    expect(() => supSampleXs(E1, 65, 0, 1)).toThrow(RangeError);
    expect(() => supCurveSegments(E1, 0, E1.defaultView)).toThrow(RangeError);
  });
});
