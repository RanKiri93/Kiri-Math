import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { INT_EXAMPLES } from "../math/integralExamples";
import { INT_ACTIVITY_ORDER, INT_OPTIONAL, INT_STEPS, INT_SUMMARIES, INT_TOKENS, INTEGRAL_THEOREM } from "../math/integralSteps";
import { checkStep, revealAnswers } from "../math/guidedSteps";
import { canOpenGuidedView, type StepsDone } from "../math/guidedProgress";
import { IntegralActivity } from "./IntegralActivity";
import { MathInlineText } from "./MathInlineText";

const steps = INT_ACTIVITY_ORDER.flatMap((id) => INT_STEPS[id]);

describe("limit-and-integral activity steps", () => {
  it("walks the three examples, the third optional, with unique step ids whose reveals pass their own checks", () => {
    expect(INT_ACTIVITY_ORDER).toEqual(["I1", "I2", "I3"]);
    expect(INT_OPTIONAL).toEqual(["I3"]);
    expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
    for (const step of steps) expect(checkStep(step, revealAnswers(step)), step.id).toEqual({ status: "correct" });
  });

  it("uses only existing tokens, and every choice has exactly one correct option", () => {
    for (const step of steps) for (const part of step.parts) {
      if (part.kind === "slots") for (const s of part.template.slots) for (const chip of s.chips) expect(INT_TOKENS[chip], `${step.id}/${chip}`).toBeDefined();
      if (part.kind === "choice") expect(part.choice.options.filter((o) => o.correct), step.id).toHaveLength(1);
    }
  });

  it("renders every step's text and the theorem without KaTeX errors", () => {
    for (const step of steps) {
      const texts = [step.title, step.prompt, step.solvedNote, ...step.hints,
        ...step.parts.flatMap((p) => p.kind === "choice" ? [p.choice.prompt, ...p.choice.options.flatMap((o) => [o.label, o.diagnosis ?? ""])] : [])];
      for (const text of texts) expect(renderToStaticMarkup(createElement(MathInlineText, { text })), `${step.id}: ${text}`).not.toContain("katex-error");
    }
    for (const text of [INTEGRAL_THEOREM.hypothesis, ...INTEGRAL_THEOREM.conclusions, ...INT_ACTIVITY_ORDER.flatMap((id) => INT_SUMMARIES[id])]) {
      expect(renderToStaticMarkup(createElement(MathInlineText, { text }))).not.toContain("katex-error");
    }
  });

  it("matches the examples' facts: uniform for the first, not for the second, integrals tending to 0", () => {
    expect(INT_EXAMPLES.I1.uniform).toBe(true);
    expect(INT_EXAMPLES.I2.uniform).toBe(false);
    expect(INT_EXAMPLES.I2.sup(20)).toBeCloseTo(0.5, 12);
    expect(INT_EXAMPLES.I1.sup(20)).toBeCloseTo(2 ** (2 / 3) / 60, 12);
    for (const id of ["I1", "I2"] as const) expect(INT_EXAMPLES[id].integral(40), id).toBeLessThan(0.1);
    // cos^n x: the integrals tend to 0 slowly (like a constant over the square root of n).
    expect(INT_EXAMPLES.I3.integral(40)).toBeLessThan(INT_EXAMPLES.I3.integral(10));
    expect(INT_EXAMPLES.I3.uniform).toBe(false);
  });

  it("opens the second example only after the first", () => {
    const first: StepsDone = Object.fromEntries(INT_STEPS.I1.map((s) => [s.id, "revealed" as const]));
    expect(canOpenGuidedView(INT_ACTIVITY_ORDER, INT_STEPS, "I2", {})).toBe(false);
    expect(canOpenGuidedView(INT_ACTIVITY_ORDER, INT_STEPS, "I2", first)).toBe(true);
  });

  it("lets the optional example be skipped: the finish view needs only the first two", () => {
    const required: StepsDone = Object.fromEntries(["I1", "I2"].flatMap((id) => INT_STEPS[id as "I1" | "I2"].map((s) => [s.id, "correct" as const])));
    const options = { optional: INT_OPTIONAL };
    expect(canOpenGuidedView(INT_ACTIVITY_ORDER, INT_STEPS, "complete", required, options)).toBe(true);
    expect(canOpenGuidedView(INT_ACTIVITY_ORDER, INT_STEPS, "I3", required, options)).toBe(true);
    expect(canOpenGuidedView(INT_ACTIVITY_ORDER, INT_STEPS, "complete", {}, options)).toBe(false);
  });
});

describe("limit-and-integral activity rendering", () => {
  it("opens on the intro, the theorem below the divider", () => {
    const html = renderToStaticMarkup(createElement(IntegralActivity));
    expect(html).toContain("integral-intro");
    // The extended theorem: a hypothesis and three numbered conclusions inside the emphasized box.
    const box = html.slice(html.indexOf('class="convergence-definition formal"'));
    expect(box.slice(0, box.indexOf("</section>")).match(/<li>/g)).toHaveLength(3);
    expect(html).toContain("סדרת צוברות השטח");
    expect(html.indexOf('class="convergence-proof"')).toBeLessThan(html.indexOf('class="convergence-definition formal"'));
    expect(html).not.toContain("convergence-workspace");
  });

  it("shows the first example with its shaded area and no integral sequence yet", () => {
    const html = renderToStaticMarkup(createElement(IntegralActivity, { initialView: "I1" }));
    expect(html).not.toContain("katex-error");
    expect(html.match(/class="convergence-progress-step"/g)).toHaveLength(3);
    expect(html).toContain("(רשות)");
    // No progress yet: no restart action and no previous-step action.
    expect(html).not.toContain("התחלת הדוגמה מחדש");
    expect(html).not.toContain("לשלב הקודם");
    expect(html).toContain('class="convergence-progress-list integral-progress-list"');
    expect(html).toMatch(/<h3 class="convergence-part-title" id="integral-example-title">דוגמה 1<\/h3>/);
    expect(html).toContain("integral-plot");
    expect(html).toContain('data-part="area"');
    expect(html).not.toContain("integral-sequence-plot");
  });
});
