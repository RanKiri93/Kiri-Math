import { describe, expect, it } from "vitest";
import {
  approximationLatex,
  clipPlotSegments,
  epsilonPlotSegments,
  limitPlotSegments,
  oscillationResolutionExceeded,
  plotX,
  pointerToPlotX,
  sequencePlotSegments,
} from "./sequencePlot";
import type { Interval } from "./convergence";

const domain = (left: number, right: number, leftClosed = true, rightClosed = true): Interval => ({
  left,
  right,
  leftClosed,
  rightClosed,
});

describe("sequence plot geometry", () => {
  it("clips giant powers without drawing a false horizontal segment at the frame", () => {
    const visible = clipPlotSegments(sequencePlotSegments("power", 256, domain(0, 2), { left: 0, right: 2 }));
    expect(visible).toHaveLength(1);
    expect(visible[0].some((point) => point.x === 1 && point.y === 1)).toBe(true);
    expect(visible[0].at(-1)!.y).toBe(1.2);
    expect(visible[0].at(-1)!.x).toBeLessThan(1.01);
    expect(visible.flat().every((point) => Number.isFinite(point.y) && Math.abs(point.y) <= 1.2)).toBe(true);
    expect(clipPlotSegments([[{ x: 0, y: 3 }, { x: 1, y: 4 }]])).toEqual([]);
    expect(clipPlotSegments([[{ x: 0, y: -2 }, { x: 4, y: 2 }]], -1, 1)).toEqual([[{ x: 1, y: -1 }, { x: 3, y: 1 }]]);
  });
  it("renders power sequence values beyond one while stopping its limit at the jump", () => {
    const sequence = sequencePlotSegments("power", 4, domain(0, 2), { left: 0, right: 2 })[0];
    expect(sequence.at(-1)).toEqual({ x: 2, y: 16 });
    expect(limitPlotSegments("power", domain(0, 2), { left: 0, right: 2 })).toEqual([
      [{ x: 0, y: 0 }, { x: 1, y: 0 }],
      [{ x: 1, y: 1 }],
    ]);
    expect(limitPlotSegments("power", domain(1, 2, false, true), { left: 0, right: 2 })).toEqual([]);
  });

  it("clips samples to the visible domain, including unbounded domains", () => {
    const segments = sequencePlotSegments("linear", 2, domain(1, 4, false, true), { left: 0, right: 3 });
    expect(segments).toHaveLength(1);
    expect(segments[0][0].x).toBe(1);
    expect(segments[0].at(-1)?.x).toBe(3);
    expect(sequencePlotSegments("near", 2, domain(0.2, Infinity, false, false), { left: 0, right: 1 })[0][0].x).toBe(0.2);
  });

  it("samples the near-family peak densely even in a much wider view", () => {
    const points = sequencePlotSegments("near", 256, domain(0, 100), { left: 0, right: 100 })[0];
    expect(points.some((point) => point.x === 1 / 256)).toBe(true);
    expect(Math.max(...points.map((point) => point.y))).toBeCloseTo(0.5);
    expect(points.filter((point) => point.x <= 10 / 256).length).toBeGreaterThanOrEqual(200);
  });

  it("resolves high-frequency sine curves below the warning threshold and warns above budget", () => {
    const view = { left: 0, right: 1 };
    const sine = sequencePlotSegments("oscillation", 128, domain(0, 1), view)[0];
    expect(sine.length).toBeGreaterThan(500);
    expect(Math.max(...sine.map((point) => point.y))).toBeGreaterThan(0.99 / 128);
    expect(Math.min(...sine.map((point) => point.y))).toBeLessThan(-0.99 / 128);
    expect(oscillationResolutionExceeded("oscillation", 128, view)).toBe(false);
    expect(oscillationResolutionExceeded("oscillation", 256, { left: 0, right: 100 })).toBe(true);
    expect(oscillationResolutionExceeded("linear", 256, { left: 0, right: 100 })).toBe(false);
  });

  it("includes moving critical points and power boundary-layer scales", () => {
    const near = sequencePlotSegments("near", 256, domain(0, 1), { left: 0, right: 1 })[0];
    expect(near.some((point) => point.x === 1 / 256)).toBe(true);
    const linear = sequencePlotSegments("linear", 256, domain(0, 512), { left: 0, right: 512 })[0];
    expect(linear.some((point) => point.x === 256)).toBe(true);
    const power = sequencePlotSegments("power", 256, domain(0, 2), { left: 0, right: 2 })[0];
    expect(power.some((point) => point.x === 1 - 1 / 256)).toBe(true);
    expect(power.at(-1)?.x).toBe(2);
  });

  it("places epsilon sleeves around each limit segment, including power's isolated endpoint", () => {
    expect(epsilonPlotSegments("shifted-oscillation", domain(-1, 1), { left: -1, right: 1 }, 0.1)).toEqual([
      [{ x: -1, y: -1.1 }, { x: 1, y: 0.9 }, { x: 1, y: 1.1 }, { x: -1, y: -0.9 }],
    ]);
    expect(epsilonPlotSegments("power", domain(0, 2), { left: 0, right: 2 }, 0.1)).toEqual([
      [{ x: 0, y: -0.1 }, { x: 1, y: -0.1 }, { x: 1, y: 0.1 }, { x: 0, y: 0.1 }],
      [{ x: 1, y: 0.9 }, { x: 1, y: 1.1 }],
    ]);
  });

  it("maps pointer coordinates using a nonzero-left view and emits a real LaTeX approximation command", () => {
    const view = { left: 5, right: 15 };
    expect(pointerToPlotX(150, { left: 100, width: 200 }, view)).toBe(7.5);
    expect(plotX(10, view)).toBeGreaterThan(0);
    expect(approximationLatex(0.125)).toBe("\\approx 0.125");
  });
});
