/**
 * Progress through the examples of a guided activity: an example is finished once every one of
 * its steps was solved or revealed (or it was finished before a restart), and the examples (and
 * the finish view) open in order. Optional examples never block anything. Pure TypeScript, shared
 * by guided activities whose steps follow guidedSteps.ts.
 */

/** Views of a guided activity: the goal page, one view per example, and the finish view. */
export type GuidedView<E extends string> = "intro" | E | "complete";

/** Step ids mapped to how each was finished; a revealed step counts as finished. */
export type StepsDone = Readonly<Record<string, "correct" | "revealed">>;

type StepIds = readonly { id: string }[];

export type ProgressOptions<E extends string> = {
  /** Examples finished at some point, kept when the student restarts them. */
  finishedBefore?: readonly E[];
  /** Examples the student may skip: they open with the next required stage and block nothing. */
  optional?: readonly E[];
};

export function areStepsDone(steps: StepIds, done: StepsDone): boolean {
  return steps.every((step) => done[step.id] !== undefined);
}

function isFinished<E extends string>(id: E, steps: Record<E, StepIds>, done: StepsDone, options: ProgressOptions<E>): boolean {
  return (options.finishedBefore ?? []).includes(id) || areStepsDone(steps[id], done);
}

export function finishedExamples<E extends string>(order: readonly E[], steps: Record<E, StepIds>, done: StepsDone, options: ProgressOptions<E> = {}): E[] {
  return order.filter((id) => isFinished(id, steps, done, options));
}

export function canOpenGuidedView<E extends string>(order: readonly E[], steps: Record<E, StepIds>, view: GuidedView<E>, done: StepsDone, options: ProgressOptions<E> = {}): boolean {
  if (view === "intro") return true;
  const index = view === "complete" ? order.length : order.indexOf(view);
  const optional = options.optional ?? [];
  return index >= 0 && order.slice(0, index).every((id) => optional.includes(id) || isFinished(id, steps, done, options));
}
