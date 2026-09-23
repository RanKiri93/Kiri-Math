import katex from "katex";
import { describe, expect, it } from "vitest";
import {
  buildOdeChapterArt,
  buildOdeCoverArt,
  chapter3Families,
  odeChapterArt,
  odeCoverArt,
  odeCoverCardEquations,
  odeCoverEquations,
  odeCoverFigureSlot,
} from "./art";

const PATH_BUDGET = 30_000;
const MARGIN = 4;
const NUMBER = /-?\d+(?:\.\d+)?/g;

function pathPoints(d: string): { x: number; y: number }[] {
  const numbers = d.match(NUMBER)?.map(Number) ?? [];
  const points: { x: number; y: number }[] = [];
  for (let index = 0; index + 1 < numbers.length; index += 2) {
    points.push({ x: numbers[index], y: numbers[index + 1] });
  }
  return points;
}

const pieces = [
  ["cover", odeCoverArt],
  ...Object.entries(odeChapterArt).map(([chapter, piece]) => [`chapter ${chapter}`, piece] as const),
] as const;

describe("ode art", () => {
  it("is deterministic", () => {
    expect(buildOdeCoverArt()).toEqual(buildOdeCoverArt());
    for (let chapter = 1; chapter <= 6; chapter += 1) {
      expect(buildOdeChapterArt(chapter)).toEqual(buildOdeChapterArt(chapter));
    }
  });

  it.each(pieces)("%s stays inside its viewBox and under the path budget", (_name, piece) => {
    expect(piece.strokes.length).toBeGreaterThan(0);
    let pathLength = 0;
    for (const entry of piece.strokes) {
      pathLength += entry.d.length;
      for (const point of pathPoints(entry.d)) {
        expect(Number.isFinite(point.x)).toBe(true);
        expect(Number.isFinite(point.y)).toBe(true);
        expect(point.x).toBeGreaterThanOrEqual(-MARGIN);
        expect(point.x).toBeLessThanOrEqual(piece.width + MARGIN);
        expect(point.y).toBeGreaterThanOrEqual(-MARGIN);
        expect(point.y).toBeLessThanOrEqual(piece.height + MARGIN);
      }
    }
    expect(pathLength).toBeLessThan(PATH_BUDGET);
    for (const dot of piece.dots ?? []) {
      expect(dot.x).toBeGreaterThanOrEqual(-MARGIN);
      expect(dot.x).toBeLessThanOrEqual(piece.width + MARGIN);
      expect(dot.y).toBeGreaterThanOrEqual(-MARGIN);
      expect(dot.y).toBeLessThanOrEqual(piece.height + MARGIN);
    }
  });

  it("has a motif for every chapter", () => {
    expect(Object.keys(odeChapterArt).map(Number).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("keeps the cover's middle and the figure slot clear of vertices", () => {
    const blocked = [
      odeCoverFigureSlot,
      { x: 175, y: 55, width: 110, height: 100 },
    ];
    const vertices = odeCoverArt.strokes.flatMap((entry) => pathPoints(entry.d));
    for (const point of vertices) {
      for (const box of blocked) {
        const inside =
          point.x > box.x && point.x < box.x + box.width && point.y > box.y && point.y < box.y + box.height;
        expect(inside, `${point.x},${point.y}`).toBe(false);
      }
    }
  });

  it("keeps the tall formulas off the course card", () => {
    expect(odeCoverCardEquations.length).toBeGreaterThan(0);
    expect(odeCoverCardEquations.length).toBeLessThan(odeCoverEquations.length);
    for (const item of odeCoverCardEquations) {
      expect(odeCoverEquations).toContain(item);
      expect(item.tex.includes("\\det") || item.tex.includes("W[")).toBe(false);
    }
  });

  it("renders every cover equation", () => {
    expect(odeCoverEquations.length).toBeGreaterThan(0);
    for (const item of odeCoverEquations) {
      const html = katex.renderToString(item.tex, { throwOnError: true });
      expect(html).toContain("katex");
    }
  });

  it("draws orthogonal families in chapter 3", () => {
    let checked = 0;
    for (const c of chapter3Families.parabolaC) {
      for (const k of chapter3Families.ellipseK) {
        const u = (-1 + Math.sqrt(1 + 8 * c * c * k)) / (4 * c * c);
        const x = Math.sqrt(u);
        const y = c * u;
        expect(y).toBeCloseTo(c * x * x, 8);
        expect(x * x + 2 * y * y).toBeCloseTo(k, 8);
        expect((2 * y) / x * (-x / (2 * y))).toBeCloseTo(-1, 8);
        checked += 1;
      }
    }
    expect(checked).toBe(chapter3Families.parabolaC.length * chapter3Families.ellipseK.length);
  });
});
