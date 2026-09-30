import { describe, expect, it } from "vitest";
import { SUP_STEPS } from "./supremumArgument";
import { SUP_EXAMPLE_ORDER, type SupExampleId } from "./supremumExamples";
import { canOpenSupremumView, completedExamples, isExampleComplete, type StepsDone } from "./supremumProgress";

const finish = (ids: readonly SupExampleId[], how: "correct" | "revealed" = "correct"): StepsDone =>
  Object.fromEntries(ids.flatMap((id) => SUP_STEPS[id].map((step) => [step.id, how])));

describe("supremum example progression", () => {
  it("uses step ids that are unique across all examples", () => {
    const ids = SUP_EXAMPLE_ORDER.flatMap((id) => SUP_STEPS[id].map((step) => step.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("opens only the goal page and the first example at the start", () => {
    expect(canOpenSupremumView("intro", {})).toBe(true);
    expect(canOpenSupremumView("E1", {})).toBe(true);
    for (const id of SUP_EXAMPLE_ORDER.slice(1)) expect(canOpenSupremumView(id, {})).toBe(false);
    expect(canOpenSupremumView("complete", {})).toBe(false);
  });

  it("counts an example only when every step is finished, revealed steps included", () => {
    const [first] = SUP_EXAMPLE_ORDER;
    const partial = Object.fromEntries(SUP_STEPS[first].slice(0, -1).map((step) => [step.id, "correct" as const]));
    expect(isExampleComplete(first, partial)).toBe(false);
    expect(canOpenSupremumView(SUP_EXAMPLE_ORDER[1], partial)).toBe(false);
    expect(isExampleComplete(first, finish([first], "revealed"))).toBe(true);
  });

  it("opens exactly the next example for each finished prefix, and the finish view after all five", () => {
    SUP_EXAMPLE_ORDER.forEach((id, index) => {
      const done = finish(SUP_EXAMPLE_ORDER.slice(0, index));
      expect(completedExamples(done)).toEqual(SUP_EXAMPLE_ORDER.slice(0, index));
      expect(canOpenSupremumView(id, done), id).toBe(true);
      for (const later of SUP_EXAMPLE_ORDER.slice(index + 1)) expect(canOpenSupremumView(later, done), later).toBe(false);
      expect(canOpenSupremumView("complete", done)).toBe(false);
    });
    expect(canOpenSupremumView("complete", finish(SUP_EXAMPLE_ORDER))).toBe(true);
  });
});
