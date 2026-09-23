import { describe, expect, it } from "vitest";
import {
  chevronPath,
  clipPolylineToDisk,
  directionAngle,
  equalScaleFrame,
  mapPoint,
  pathFromPoints,
  round1,
} from "./geometry";
import { integrate } from "./integrate";

describe("frame mapping", () => {
  const frame = {
    xMin: 0,
    xMax: 2,
    yMin: 0,
    yMax: 4,
    left: 10,
    top: 20,
    width: 100,
    height: 50,
  };

  it("flips y so the top of the math box is the top of the frame", () => {
    expect(mapPoint(frame, 0, 4)).toEqual({ x: 10, y: 20 });
    expect(mapPoint(frame, 2, 0)).toEqual({ x: 110, y: 70 });
  });

  it("keeps equal scale when the frame is built for a disk", () => {
    const disk = equalScaleFrame({ left: 0, top: 0, width: 200, height: 100 }, 2);
    const origin = mapPoint(disk, 0, 0);
    const right = mapPoint(disk, 1, 0);
    const up = mapPoint(disk, 0, 1);
    expect(right.x - origin.x).toBeCloseTo(origin.y - up.y, 8);
  });
});

describe("paths", () => {
  it("rounds coordinates to one decimal", () => {
    expect(pathFromPoints([{ x: 1.26, y: -2.24 }, { x: 3, y: 0.05 }])).toBe("M 1.3 -2.2 L 3 0.1");
    expect(round1(1.25)).toBe(1.3);
  });

  it("builds a chevron at ±25° from the reversed direction", () => {
    const tip = { x: 100, y: 80 };
    const direction = 0.4;
    const d = chevronPath(tip, direction, 10);
    const numbers = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    const wings = [
      { x: numbers[0], y: numbers[1] },
      { x: numbers[4], y: numbers[5] },
    ];
    const reversed = direction + Math.PI;
    for (const wing of wings) {
      const angle = directionAngle(tip, wing);
      const delta = Math.atan2(Math.sin(angle - reversed), Math.cos(angle - reversed));
      expect(Math.abs(delta)).toBeCloseTo((25 * Math.PI) / 180, 2);
    }
  });
});

describe("clipping", () => {
  it("keeps the chord of a line through a disk", () => {
    const runs = clipPolylineToDisk(
      [
        { x: -2, y: 0 },
        { x: 2, y: 0 },
      ],
      { x: 0, y: 0 },
      1,
    );
    expect(runs).toHaveLength(1);
    expect(runs[0][0].x).toBeCloseTo(-1, 6);
    expect(runs[0][runs[0].length - 1].x).toBeCloseTo(1, 6);
  });
});

describe("RK4", () => {
  const bounds = { xMin: -1, xMax: 1.2, yMin: -1, yMax: 4 };

  it("reaches e at x = 1 for y' = y", () => {
    const points = integrate((point) => ({ x: 1, y: point.y }), { x: 0, y: 1 }, 0.01, 200, bounds);
    const atOne = points.reduce((best, point) => (Math.abs(point.x - 1) < Math.abs(best.x - 1) ? point : best));
    expect(atOne.x).toBeCloseTo(1, 6);
    expect(atOne.y).toBeCloseTo(Math.E, 6);
  });

  it("stops when the next point would leave the bounds", () => {
    const points = integrate(() => ({ x: 1, y: 0 }), { x: 0, y: 0 }, 1, 10, {
      xMin: 0,
      xMax: 2.5,
      yMin: -1,
      yMax: 1,
    });
    expect(points.map((point) => point.x)).toEqual([0, 1, 2]);
  });

  it("stops on a non-finite stage", () => {
    const points = integrate(() => ({ x: Number.NaN, y: 1 }), { x: 0, y: 0 }, 0.1, 5, bounds);
    expect(points).toEqual([{ x: 0, y: 0 }]);
  });
});
