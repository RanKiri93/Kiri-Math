import { describe, expect, it } from "vitest";
import { canOpenGuidedView, finishedExamples, type StepsDone } from "./guidedProgress";
import { canOpenSupremumView, completedExamples } from "./supremumProgress";

type Id = "A" | "B" | "C";
const order: readonly Id[] = ["A", "B", "C"];
const steps: Record<Id, { id: string }[]> = { A: [{ id: "a1" }, { id: "a2" }], B: [{ id: "b1" }], C: [{ id: "c1" }] };
const all = (ids: readonly Id[]): StepsDone => Object.fromEntries(ids.flatMap((id) => steps[id].map((s) => [s.id, "correct" as const])));

describe("guided progression", () => {
  it("opens examples in order, counting revealed steps", () => {
    expect(canOpenGuidedView(order, steps, "A", {})).toBe(true);
    expect(canOpenGuidedView(order, steps, "B", { a1: "revealed" })).toBe(false);
    expect(canOpenGuidedView(order, steps, "B", { a1: "revealed", a2: "correct" })).toBe(true);
    expect(canOpenGuidedView(order, steps, "complete", all(["A", "B"]))).toBe(false);
    expect(canOpenGuidedView(order, steps, "complete", all(order))).toBe(true);
  });

  it("keeps a restarted example finished: its answers are cleared, its later stages stay open", () => {
    // After a restart the steps of A are no longer done, but A was finished before.
    const afterRestart = all(["B"]);
    expect(canOpenGuidedView(order, steps, "B", afterRestart)).toBe(false);
    expect(canOpenGuidedView(order, steps, "B", afterRestart, { finishedBefore: ["A"] })).toBe(true);
    expect(finishedExamples(order, steps, afterRestart, { finishedBefore: ["A"] })).toEqual(["A", "B"]);
  });

  it("lets an optional example be skipped: the finish view needs only the required ones", () => {
    const options = { optional: ["C"] as const };
    expect(canOpenGuidedView(order, steps, "complete", all(["A", "B"]), options)).toBe(true);
    expect(canOpenGuidedView(order, steps, "C", all(["A", "B"]), options)).toBe(true);
    expect(canOpenGuidedView(order, steps, "C", all(["A"]), options)).toBe(false);
    expect(finishedExamples(order, steps, all(["A", "B"]), options)).toEqual(["A", "B"]);
  });

  it("keeps a restarted supremum example finished too", () => {
    expect(canOpenSupremumView("E1p", {})).toBe(false);
    expect(canOpenSupremumView("E1p", {}, ["E1"])).toBe(true);
    expect(completedExamples({}, ["E1"])).toEqual(["E1"]);
  });
});
