import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CONT_EXAMPLES, CONT_EXAMPLE_ORDER, CONT_MAX_N } from "../math/continuityExamples";
import { CONT_STEPS, contGraphFlagsFor } from "../math/continuitySteps";
import { INT_EXAMPLES, INT_MAX_N } from "../math/integralExamples";
import { INT_ACTIVITY_ORDER, INT_STEPS, intGraphFlagsFor } from "../math/integralSteps";
import { ContinuityPlot } from "./ContinuityPlot";
import { IntegralPlot } from "./IntegralPlot";
import { IntegralSequencePlot } from "./IntegralSequencePlot";

/** Exhaustive sweeps run long under the parallel full suite; give them room. */
const SWEEP_TIMEOUT_MS = 30_000;

/** Every split point the a slider offers: 0.02, 0.03, …, 0.90 (as the range input produces them). */
const SPLITS = Array.from({ length: 89 }, (_, i) => Number((0.02 + i * 0.01).toFixed(2)));
const NS = (max: number) => Array.from({ length: max }, (_, i) => i + 1);

describe("guided activity plots render at every step, index and split point", () => {
  it("limit and integral: every example, step state and n, and every a of the split slider", () => {
    for (const id of INT_ACTIVITY_ORDER) {
      const steps = INT_STEPS[id];
      for (let i = 0; i < steps.length; i++) for (const solved of [false, true]) {
        const flags = intGraphFlagsFor(steps, i, solved);
        for (const n of NS(INT_MAX_N)) {
          // Every split point for a few indices, and a few split points for every index.
          const splits = !flags.split ? [undefined] : [1, 2, 10, INT_MAX_N].includes(n) ? SPLITS : [0.02, 0.2, 0.7, 0.9];
          for (const split of splits) {
            expect(() => renderToStaticMarkup(createElement(IntegralPlot, { example: INT_EXAMPLES[id], n, flags, epsilon: 0.1, split })),
              `${id} step ${i + 1} solved=${solved} n=${n} a=${split}`).not.toThrow();
          }
          if (flags.integrals) expect(() => renderToStaticMarkup(createElement(IntegralSequencePlot, { example: INT_EXAMPLES[id], n, flags }))).not.toThrow();
        }
      }
    }
  }, SWEEP_TIMEOUT_MS);

  it("continuity: every example, step state and n", () => {
    for (const id of CONT_EXAMPLE_ORDER) {
      const steps = CONT_STEPS[id];
      for (let i = 0; i < steps.length; i++) for (const solved of [false, true]) for (const n of NS(CONT_MAX_N)) {
        const flags = contGraphFlagsFor(steps, i, solved);
        expect(() => renderToStaticMarkup(createElement(ContinuityPlot, { example: CONT_EXAMPLES[id], n, flags, epsilon: 0.1 })),
          `${id} step ${i + 1} n=${n}`).not.toThrow();
      }
    }
  }, SWEEP_TIMEOUT_MS);
});
