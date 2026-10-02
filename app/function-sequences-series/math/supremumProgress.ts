import { SUP_STEPS } from "./supremumArgument";
import { SUP_EXAMPLE_ORDER, type SupExampleId } from "./supremumExamples";

/** Views of the supremum activity: the goal page, one view per example, and the finish view. */
export type SupremumView = "intro" | SupExampleId | "complete";

/** Step ids mapped to how each was finished; a revealed step counts as finished. */
export type StepsDone = Readonly<Record<string, "correct" | "revealed">>;

/** An example is finished once every one of its steps was solved or revealed. */
export function isExampleComplete(id: SupExampleId, done: StepsDone): boolean {
  return SUP_STEPS[id].every((step) => done[step.id] !== undefined);
}

/** Finished examples; `finishedBefore` keeps examples the student finished and then restarted. */
export function completedExamples(done: StepsDone, finishedBefore: readonly SupExampleId[] = []): SupExampleId[] {
  return SUP_EXAMPLE_ORDER.filter((id) => finishedBefore.includes(id) || isExampleComplete(id, done));
}

/** Examples open in order: each one, and the finish view, needs every earlier example finished. */
export function canOpenSupremumView(view: SupremumView, done: StepsDone, finishedBefore: readonly SupExampleId[] = []): boolean {
  if (view === "intro") return true;
  const index = view === "complete" ? SUP_EXAMPLE_ORDER.length : SUP_EXAMPLE_ORDER.indexOf(view);
  return index >= 0 && SUP_EXAMPLE_ORDER.slice(0, index).every((id) => finishedBefore.includes(id) || isExampleComplete(id, done));
}
