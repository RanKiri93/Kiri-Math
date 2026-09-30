import type { ReactNode } from "react";
import type { SupExampleId } from "../math/supremumExamples";

/** Author-supplied introductions, one per example. Add JSX to a slot when its copy is ready;
 * the example header reserves space below its title and shows no placeholder copy.
 */
export const supremumExampleExplanations: Record<SupExampleId, ReactNode> = {
  E1: null,
  E1p: null,
  E2: null,
  E3: null,
  E3p: null,
};
