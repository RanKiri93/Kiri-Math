import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DER_EXAMPLES, DER_EXAMPLE_ORDER, DER_MAX_N } from "../math/derivativeExamples";
import { DER_STEPS, DER_TOKENS, DERIVATIVE_THEOREM, derGraphFlagsFor } from "../math/derivativeSteps";
import { checkStep, revealAnswers } from "../math/guidedSteps";
import { canOpenGuidedView, type StepsDone } from "../math/guidedProgress";
import { DerivativeActivity } from "./DerivativeActivity";
import { DerivativePlot } from "./DerivativePlot";
import { MathInlineText } from "./MathInlineText";

/** Exhaustive sweeps run long under the parallel full suite; give them room. */
const SWEEP_TIMEOUT_MS = 30_000;

const steps = DER_EXAMPLE_ORDER.flatMap((id) => DER_STEPS[id]);

describe("limit-and-derivative activity steps", () => {
  it("walks the three examples, with unique step ids whose reveals pass their own checks", () => {
    expect(DER_EXAMPLE_ORDER).toEqual(["D1", "D2", "D3"]);
    expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
    for (const step of steps) expect(checkStep(step, revealAnswers(step)), step.id).toEqual({ status: "correct" });
  });

  it("uses only existing tokens, and every choice has exactly one correct option", () => {
    for (const step of steps) for (const part of step.parts) {
      if (part.kind === "slots") for (const s of part.template.slots) for (const chip of s.chips) expect(DER_TOKENS[chip], `${step.id}/${chip}`).toBeDefined();
      if (part.kind === "choice") expect(part.choice.options.filter((o) => o.correct), step.id).toHaveLength(1);
    }
  });

  it("renders every step's text and the theorem without KaTeX errors", () => {
    for (const step of steps) {
      const texts = [step.title, step.prompt, step.solvedNote, ...step.hints,
        ...step.parts.flatMap((p) => p.kind === "choice" ? [p.choice.prompt, ...p.choice.options.flatMap((o) => [o.label, o.diagnosis ?? ""])] : [])];
      for (const text of texts) expect(renderToStaticMarkup(createElement(MathInlineText, { text })), `${step.id}: ${text}`).not.toContain("katex-error");
    }
    for (const text of [...DERIVATIVE_THEOREM.hypotheses, DERIVATIVE_THEOREM.conclusion]) {
      expect(renderToStaticMarkup(createElement(MathInlineText, { text }))).not.toContain("katex-error");
    }
  });

  it("matches the examples' facts", () => {
    // D1: derivatives bounded by 1/sqrt(n); D2: the derivatives' limit jumps at 1; D3: no pointwise limit.
    expect(DER_EXAMPLES.D1.derivativeSup(16)).toBeCloseTo(0.25, 9);
    expect(DER_EXAMPLES.D2.derivativeLimit(1)).toBeCloseTo(0.5, 12);
    expect(DER_EXAMPLES.D2.derivativeLimit(0.5)).toBe(0);
    expect(DER_EXAMPLES.D3.limit).toBeNull();
    expect(DER_EXAMPLES.D2.value(10, 1)).toBeCloseTo(Math.PI / 40, 12);
  });

  it("opens the examples in order", () => {
    const first: StepsDone = Object.fromEntries(DER_STEPS.D1.map((s) => [s.id, "revealed" as const]));
    expect(canOpenGuidedView(DER_EXAMPLE_ORDER, DER_STEPS, "D2", {})).toBe(false);
    expect(canOpenGuidedView(DER_EXAMPLE_ORDER, DER_STEPS, "D2", first)).toBe(true);
  });
});

describe("limit-and-derivative activity rendering", () => {
  it("opens on the intro, the theorem with its three hypotheses below the divider", () => {
    const html = renderToStaticMarkup(createElement(DerivativeActivity));
    expect(html).toContain("derivative-intro");
    const box = html.slice(html.indexOf('class="convergence-definition formal"'));
    expect(box.slice(0, box.indexOf("</section>")).match(/<li>/g)).toHaveLength(3);
    expect(html.indexOf('class="convergence-proof"')).toBeLessThan(html.indexOf('class="convergence-definition formal"'));
    expect(html).not.toContain("convergence-workspace");
  });

  it("shows the first example as a stage with its plot", () => {
    const html = renderToStaticMarkup(createElement(DerivativeActivity, { initialView: "D1" }));
    expect(html).not.toContain("katex-error");
    expect(html.match(/class="convergence-progress-step"/g)).toHaveLength(3);
    expect(html).toContain('class="convergence-progress-list derivative-progress-list"');
    expect(html).toMatch(/<h3 class="convergence-part-title" id="derivative-example-title">דוגמה 1<\/h3>/);
    expect(html).toContain("derivative-plot");
  });

  it("renders the plots at every step state and index without throwing", () => {
    for (const id of DER_EXAMPLE_ORDER) {
      const exampleSteps = DER_STEPS[id];
      for (let i = 0; i < exampleSteps.length; i++) for (const solved of [false, true]) for (let n = 1; n <= DER_MAX_N; n++) {
        const flags = derGraphFlagsFor(exampleSteps, i, solved);
        expect(() => renderToStaticMarkup(createElement(DerivativePlot, { example: DER_EXAMPLES[id], n, flags, epsilon: 0.1 })),
          `${id} step ${i + 1} solved=${solved} n=${n}`).not.toThrow();
      }
    }
  }, SWEEP_TIMEOUT_MS);
});
