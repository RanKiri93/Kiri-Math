"use client";

import { CONT_EXAMPLES, CONT_EXAMPLE_ORDER, CONT_MAX_N, type ContExampleId, type ContGraphFlags } from "../math/continuityExamples";
import { CONT_STEPS, CONT_SUMMARIES, CONT_TOKENS, contGraphFlagsFor } from "../math/continuitySteps";
import { ContinuityIntro } from "./ContinuityIntro";
import { ContinuityPlot } from "./ContinuityPlot";
import { GuidedExampleActivity, type GuidedActivityConfig } from "./GuidedExampleActivity";
import { tokenMap } from "./GuidedStepParts";

/** The example's sequence and domain for a navigation label, e.g. "$\frac{x^n}{1+x^{2n}}$ ב־$[0,2]$". */
export function continuityCaption(id: ContExampleId): string {
  return `$${CONT_EXAMPLES[id].shortLatex}$ ב־$${CONT_EXAMPLES[id].domainLatex}$`;
}

const CONFIG: GuidedActivityConfig<ContExampleId, ContGraphFlags> = {
  className: "continuity-activity",
  idPrefix: "continuity",
  listClassName: "continuity-progress-list",
  title: "רציפות פונקציית הגבול",
  subtitle: "מתי התכנסות במידה שווה שומרת על רציפות, ומה אפשר להסיק כשהגבול אינו רציף.",
  order: CONT_EXAMPLE_ORDER,
  steps: CONT_STEPS,
  tokens: tokenMap(CONT_TOKENS),
  formula: (id) => `${CONT_EXAMPLES[id].fnLatex},\\quad x\\in ${CONT_EXAMPLES[id].domainLatex}`,
  caption: continuityCaption,
  graphFlagsFor: contGraphFlagsFor,
  exploreFlags: { limit: true, band: true, jumps: true },
  epsilonEnabled: (flags) => flags.band,
  nMax: CONT_MAX_N,
  renderPlots: ({ id, n, epsilon, flags }) => <ContinuityPlot example={CONT_EXAMPLES[id]} n={n} flags={flags} epsilon={epsilon} />,
  Intro: ContinuityIntro,
  summary: (id) => CONT_SUMMARIES[id],
  finishTitle: "סיימתם את שלוש הדוגמאות",
  finishBody: <p>ראיתם שתי דוגמאות שבהן הגבול אינו רציף ולכן ההתכנסות אינה במידה שווה, ודוגמה שבה הפונקציות אינן רציפות והגבול כן, אף שההתכנסות במידה שווה.</p>,
};

/**
 * "רציפות פונקציית הגבול": three guided examples of the theorem that a uniform limit of continuous
 * functions is continuous, on the shared guided-example shell (`GuidedExampleActivity`).
 */
export function ContinuityActivity({ onExit, onFinish, initialView = "intro" }: {
  onExit?: () => void; onFinish?: () => void;
  /** Opening view; only the goal page or the first example make sense (later ones start locked). */
  initialView?: "intro" | "C1";
}) {
  return <GuidedExampleActivity config={CONFIG} onExit={onExit} onFinish={onFinish} initialView={initialView} />;
}
