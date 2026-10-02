"use client";

import { DER_EXAMPLES, DER_EXAMPLE_ORDER, DER_MAX_N, type DerExampleId, type DerGraphFlags } from "../math/derivativeExamples";
import { DER_STEPS, DER_TOKENS, derGraphFlagsFor } from "../math/derivativeSteps";
import { DerivativeIntro } from "./DerivativeIntro";
import { DerivativePlot } from "./DerivativePlot";
import { GuidedExampleActivity, type GuidedActivityConfig } from "./GuidedExampleActivity";
import { tokenMap } from "./GuidedStepParts";

/** The example's sequence and domain for a navigation label, e.g. "$\frac{\ln(1+nx^2)}{n}$ ב־$[0,1]$". */
export function derivativeCaption(id: DerExampleId): string {
  return `$${DER_EXAMPLES[id].shortLatex}$ ב־$${DER_EXAMPLES[id].domainLatex}$`;
}

const CONFIG: GuidedActivityConfig<DerExampleId, DerGraphFlags> = {
  className: "derivative-activity",
  idPrefix: "derivative",
  listClassName: "derivative-progress-list",
  title: "גבול ונגזרת",
  subtitle: "מתי מותר לגזור איבר־איבר, ומה קורה כשאחד מתנאי משפט הגזירה אינו מתקיים.",
  order: DER_EXAMPLE_ORDER,
  steps: DER_STEPS,
  tokens: tokenMap(DER_TOKENS),
  formula: (id) => `${DER_EXAMPLES[id].fnLatex},\\quad x\\in ${DER_EXAMPLES[id].domainLatex}`,
  caption: derivativeCaption,
  graphFlagsFor: derGraphFlagsFor,
  exploreFlags: { limit: true, band: true, derivative: true, derivLimit: true, derivBand: true },
  epsilonEnabled: (flags) => flags.band || flags.derivBand,
  nMax: DER_MAX_N,
  renderPlots: ({ id, n, epsilon, flags }) => <DerivativePlot example={DER_EXAMPLES[id]} n={n} flags={flags} epsilon={epsilon} />,
  Intro: DerivativeIntro,
  finishTitle: "סיימתם את שלוש הדוגמאות",
  finishBody: <p>ראיתם דוגמה שבה כל תנאי משפט הגזירה מתקיימים, דוגמה שבה הנגזרות אינן מתכנסות במידה שווה והנגזרת של הגבול שונה מגבול הנגזרות, ודוגמה שבה הסדרה אינה מתכנסת באף נקודה.</p>,
};

/**
 * "גבול ונגזרת": guided examples of the term-by-term differentiation theorem, on the shared
 * guided-example shell (`GuidedExampleActivity`).
 */
export function DerivativeActivity({ onExit, onFinish, initialView = "intro" }: {
  onExit?: () => void; onFinish?: () => void;
  /** Opening view; only the goal page or the first example make sense (later ones start locked). */
  initialView?: "intro" | "D1";
}) {
  return <GuidedExampleActivity config={CONFIG} onExit={onExit} onFinish={onFinish} initialView={initialView} />;
}
