"use client";

import { INT_EXAMPLES, INT_MAX_N, type IntExampleId, type IntGraphFlags } from "../math/integralExamples";
import { INT_ACTIVITY_ORDER, INT_OPTIONAL, INT_STEPS, INT_SUMMARIES, INT_TOKENS, intGraphFlagsFor } from "../math/integralSteps";
import { GuidedExampleActivity, type GuidedActivityConfig } from "./GuidedExampleActivity";
import { tokenMap } from "./GuidedStepParts";
import { IntegralIntro } from "./IntegralIntro";
import { IntegralPlot } from "./IntegralPlot";
import { IntegralSequencePlot } from "./IntegralSequencePlot";

/** The example's sequence and domain for a navigation label, e.g. "$\frac{x}{1+n^3x^3}$ ב־$[0,1]$". */
export function integralCaption(id: IntExampleId): string {
  return `$${INT_EXAMPLES[id].shortLatex}$ ב־$${INT_EXAMPLES[id].domainLatex}$`;
}

const CONFIG: GuidedActivityConfig<IntExampleId, IntGraphFlags> = {
  className: "integral-activity",
  idPrefix: "integral",
  listClassName: "integral-progress-list",
  title: "גבול ואינטגרל",
  subtitle: "מתי מותר להחליף בין הגבול לבין האינטגרל, ומה קורה כשההתכנסות אינה במידה שווה.",
  order: INT_ACTIVITY_ORDER,
  optional: INT_OPTIONAL,
  steps: INT_STEPS,
  tokens: tokenMap(INT_TOKENS),
  formula: (id) => `${INT_EXAMPLES[id].fnLatex},\\quad x\\in ${INT_EXAMPLES[id].domainLatex}`,
  caption: integralCaption,
  graphFlagsFor: intGraphFlagsFor,
  exploreFlags: { limit: true, area: true, band: true, integrals: true, supremum: true, split: true },
  epsilonEnabled: (flags) => flags.band,
  splitEnabled: (id, flags) => id === "I3" && flags.split === true,
  nMax: INT_MAX_N,
  renderPlots: ({ id, n, epsilon, flags, split }) => <>
    <IntegralPlot example={INT_EXAMPLES[id]} n={n} flags={flags} epsilon={epsilon} split={split} />
    {flags.integrals && <IntegralSequencePlot example={INT_EXAMPLES[id]} n={n} flags={flags} />}
  </>,
  Intro: IntegralIntro,
  summary: (id) => INT_SUMMARIES[id],
  finishTitle: "סיימתם את הדוגמאות",
  finishBody: <p>ראיתם דוגמה שבה התכנסות במידה שווה מאפשרת לחשב את גבול האינטגרלים בלי לחשב אותם, ודוגמה שבה ההחלפה בין הגבול לאינטגרל מתקיימת אף שההתכנסות אינה במידה שווה. דוגמת הרשות מראה איך מוכיחים זאת בפיצול האינטגרל.</p>,
};

/**
 * "גבול ואינטגרל": guided examples of the theorem that uniform convergence lets the limit and the
 * integral be exchanged, on the shared guided-example shell (`GuidedExampleActivity`).
 */
export function IntegralActivity({ onExit, onFinish, initialView = "intro" }: {
  onExit?: () => void; onFinish?: () => void;
  /** Opening view; only the goal page or the first example make sense (later ones start locked). */
  initialView?: "intro" | "I1";
}) {
  return <GuidedExampleActivity config={CONFIG} onExit={onExit} onFinish={onFinish} initialView={initialView} />;
}
