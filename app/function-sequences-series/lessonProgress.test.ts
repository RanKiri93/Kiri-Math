import { describe, expect, it } from "vitest";
import {
  canOpenConvergenceView,
  completeConvergenceLesson,
  CONVERGENCE_LESSONS,
  type ConvergenceLesson,
} from "./lessonProgress";

const ids = CONVERGENCE_LESSONS.map(({ id }) => id);

describe("convergence lesson progression", () => {
  it("defines four ordered lessons; only the first and definitions are initially available", () => {
    expect(ids).toEqual(["warmup", "power", "oscillation", "pair"]);
    expect(canOpenConvergenceView("definitions", [])).toBe(true);
    expect(canOpenConvergenceView("warmup", [])).toBe(true);
    for (const id of ids.slice(1)) expect(canOpenConvergenceView(id, [])).toBe(false);
    expect(canOpenConvergenceView("complete", [])).toBe(false);
  });

  it("opens exactly the next lesson for each completed prefix", () => {
    ids.forEach((id, index) => {
      const prefix = ids.slice(0, index) as ConvergenceLesson[];
      expect(canOpenConvergenceView(id, prefix), `lesson ${id} after ${prefix}`).toBe(true);
      for (const later of ids.slice(index + 1)) {
        expect(canOpenConvergenceView(later, prefix), `lesson ${later} after ${prefix}`).toBe(false);
      }
      expect(canOpenConvergenceView("complete", prefix)).toBe(false);
    });
    expect(canOpenConvergenceView("complete", ids as ConvergenceLesson[])).toBe(true);
  });

  it("completes sequentially, preserves caller data, and refuses out-of-order completion", () => {
    const original: ConvergenceLesson[] = [];
    const afterOutOfOrder = completeConvergenceLesson(original, "power");
    expect(afterOutOfOrder).toBe(original);
    expect(original).toEqual([]);

    let completed: readonly ConvergenceLesson[] = original;
    ids.forEach((id, index) => {
      const prior = completed;
      completed = completeConvergenceLesson(completed, id);
      expect(completed).toEqual(ids.slice(0, index + 1));
      expect(completed).not.toBe(prior);
      expect(prior).toEqual(ids.slice(0, index));
    });
    expect(original).toEqual([]);
  });

  it("makes duplicate completion idempotent and never relocks completed lessons", () => {
    let completed: readonly ConvergenceLesson[] = [];
    for (const id of ids) completed = completeConvergenceLesson(completed, id);
    const done = completed;
    for (const id of ids) {
      expect(completeConvergenceLesson(completed, id)).toBe(done);
      expect(canOpenConvergenceView(id, completed)).toBe(true);
    }
    expect(canOpenConvergenceView("complete", completed)).toBe(true);
  });

  it("always allows definitions regardless of lesson progress", () => {
    for (const prefix of [[], ids.slice(0, 1), ids.slice(0, 2), ids.slice(0, 3), ids] as ConvergenceLesson[][]) {
      expect(canOpenConvergenceView("definitions", prefix)).toBe(true);
    }
  });
});
