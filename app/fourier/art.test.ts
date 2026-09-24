import { describe, expect, it } from "vitest";
import { fourierChapterArt, fourierCoverArt, fourierCoverCardEquations, fourierMaterialsArt } from "./art";

const MARGIN = 4;
const NUMBER = /-?\d+(?:\.\d+)?/g;
const pieces = [
  ["cover", fourierCoverArt],
  ["materials", fourierMaterialsArt],
  ...[1, 2, 3, 4].map((chapter) => [`chapter ${chapter}`, fourierChapterArt(chapter)] as const),
] as const;

function pathPoints(d: string): { x: number; y: number }[] {
  const numbers = d.match(NUMBER)?.map(Number) ?? [];
  const points: { x: number; y: number }[] = [];
  for (let index = 0; index + 1 < numbers.length; index += 2) {
    points.push({ x: numbers[index], y: numbers[index + 1] });
  }
  return points;
}

describe("Fourier art", () => {
  it("is deterministic and provides a motif for each of the four chapters", () => {
    for (let chapter = 1; chapter <= 4; chapter += 1) {
      expect(fourierChapterArt(chapter)).toEqual(fourierChapterArt(chapter));
    }
    expect(() => fourierChapterArt(5)).toThrow("No motif for chapter 5");
    expect(fourierCoverArt).toEqual({ ...fourierCoverArt });
  });

  it.each(pieces)("%s has finite paths within its viewBox", (_name, piece) => {
    expect(piece.strokes.length).toBeGreaterThan(0);
    expect(piece.strokes.reduce((length, stroke) => length + stroke.d.length, 0)).toBeLessThan(30_000);
    for (const stroke of piece.strokes) {
      for (const point of pathPoints(stroke.d)) {
        expect(Number.isFinite(point.x)).toBe(true);
        expect(Number.isFinite(point.y)).toBe(true);
        expect(point.x).toBeGreaterThanOrEqual(-MARGIN);
        expect(point.x).toBeLessThanOrEqual(piece.width + MARGIN);
        expect(point.y).toBeGreaterThanOrEqual(-MARGIN);
        expect(point.y).toBeLessThanOrEqual(piece.height + MARGIN);
      }
    }
  });

  it("keeps the card equation list intentionally empty", () => {
    expect(fourierCoverCardEquations).toEqual([]);
  });
});
