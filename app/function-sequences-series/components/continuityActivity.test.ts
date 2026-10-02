import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CONT_EXAMPLE_ORDER } from "../math/continuityExamples";
import { CONT_STEPS, CONT_SUMMARIES, CONT_TOKENS, CONTINUITY_THEOREM } from "../math/continuitySteps";
import { GuidedProofDialog, SummaryContent } from "./GuidedProofDialog";
import { checkStep, revealAnswers } from "../math/guidedSteps";
import { canOpenGuidedView, finishedExamples, type StepsDone } from "../math/guidedProgress";
import { ContinuityActivity } from "./ContinuityActivity";
import { ContinuityIntro } from "./ContinuityIntro";
import { MathInlineText } from "./MathInlineText";

const finish = (ids: readonly (typeof CONT_EXAMPLE_ORDER)[number][]): StepsDone =>
  Object.fromEntries(ids.flatMap((id) => CONT_STEPS[id].map((step) => [step.id, "correct" as const])));

describe("continuity activity steps", () => {
  it("has unique step ids, and every reveal passes its own check", () => {
    const steps = CONT_EXAMPLE_ORDER.flatMap((id) => CONT_STEPS[id]);
    expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
    for (const step of steps) expect(checkStep(step, revealAnswers(step)), step.id).toEqual({ status: "correct" });
  });

  it("uses only tokens that exist, and every choice has exactly one correct option", () => {
    for (const id of CONT_EXAMPLE_ORDER) for (const step of CONT_STEPS[id]) for (const part of step.parts) {
      if (part.kind === "slots") for (const s of part.template.slots) for (const chip of s.chips) expect(CONT_TOKENS[chip], `${step.id}/${chip}`).toBeDefined();
      if (part.kind === "choice") expect(part.choice.options.filter((o) => o.correct), step.id).toHaveLength(1);
    }
  });

  it("renders every step's text without KaTeX errors", () => {
    for (const id of CONT_EXAMPLE_ORDER) for (const step of CONT_STEPS[id]) {
      const texts = [step.title, step.prompt, step.solvedNote, ...step.hints, step.disclosure?.body ?? "",
        ...step.parts.flatMap((p) => p.kind === "choice" ? [p.choice.prompt, ...p.choice.options.flatMap((o) => [o.label, o.diagnosis ?? ""])] : [])];
      for (const text of texts) expect(renderToStaticMarkup(createElement(MathInlineText, { text })), `${step.id}: ${text}`).not.toContain("katex-error");
    }
  });

  it("opens the examples in order", () => {
    expect(canOpenGuidedView(CONT_EXAMPLE_ORDER, CONT_STEPS, "C1", {})).toBe(true);
    expect(canOpenGuidedView(CONT_EXAMPLE_ORDER, CONT_STEPS, "C2", {})).toBe(false);
    expect(canOpenGuidedView(CONT_EXAMPLE_ORDER, CONT_STEPS, "C2", finish(["C1"]))).toBe(true);
    expect(canOpenGuidedView(CONT_EXAMPLE_ORDER, CONT_STEPS, "complete", finish(["C1", "C2"]))).toBe(false);
    expect(finishedExamples(CONT_EXAMPLE_ORDER, CONT_STEPS, finish(CONT_EXAMPLE_ORDER))).toEqual([...CONT_EXAMPLE_ORDER]);
    expect(canOpenGuidedView(CONT_EXAMPLE_ORDER, CONT_STEPS, "complete", finish(CONT_EXAMPLE_ORDER))).toBe(true);
  });
});

describe("continuity activity rendering", () => {
  it("opens on the intro with the theorem in an emphasized box", () => {
    const html = renderToStaticMarkup(createElement(ContinuityActivity));
    expect(html).toContain("continuity-intro");
    expect(html).toContain('class="convergence-definition formal"');
    // The explanation above the divider; the formal theorem below it, as in the other intros.
    expect(html).toContain('<details class="convergence-proof" open="">');
    expect(html.indexOf('class="convergence-proof"')).toBeLessThan(html.indexOf('class="convergence-definition formal"'));
    expect(html).toContain("ניתן להיעזר במשפט זה כדי לשלול התכנסות במידה שווה");
    expect(html.indexOf("ניתן להיעזר במשפט זה")).toBeLessThan(html.indexOf('class="convergence-proof"'));
    expect(html).not.toContain("convergence-workspace");
    expect(renderToStaticMarkup(createElement(MathInlineText, { text: CONTINUITY_THEOREM }))).not.toContain("katex-error");
    expect(renderToStaticMarkup(createElement(ContinuityIntro, { returning: true, onStart: () => {} }))).toContain("חזרה לפעילות");
  });

  it("presents the first example as a stage with its formula, step card and graph", () => {
    const html = renderToStaticMarkup(createElement(ContinuityActivity, { initialView: "C1" }));
    expect(html).not.toContain("katex-error");
    expect(html.match(/class="convergence-progress-step"/g)).toHaveLength(3);
    expect(html.match(/data-state="locked"/g)).toHaveLength(2);
    expect(html).toContain('class="convergence-progress-list continuity-progress-list"');
    expect(html).toMatch(/<h3 class="convergence-part-title" id="continuity-example-title">דוגמה 1<\/h3>/);
    expect(html).toMatch(/<div class="supremum-example-formula" id="continuity-example-formula" dir="ltr">/);
    expect(html).toMatch(/<span class="convergence-step-label">שלב 1 מתוך \d+<\/span>/);
    expect(html).toContain("continuity-plot");
    expect(html).not.toContain("supremum-proof-open");
  });
});

describe("continuity summary pop-up", () => {
  it("has a summary for every example that renders without KaTeX errors", () => {
    for (const id of CONT_EXAMPLE_ORDER) {
      expect(CONT_SUMMARIES[id].length, id).toBeGreaterThanOrEqual(3);
      const html = renderToStaticMarkup(createElement(SummaryContent, { formulaLatex: "f_n(x)", paragraphs: CONT_SUMMARIES[id] }));
      expect(html, id).not.toContain("katex-error");
      expect(html.match(/<p>/g)).toHaveLength(CONT_SUMMARIES[id].length);
    }
    // The removable discontinuity of the first example's limit is at x=1.
    expect(CONT_SUMMARIES.C1[0]).toContain("$x=1$");
  });

  it("shows the summary title and continue action when open", () => {
    const html = renderToStaticMarkup(createElement(GuidedProofDialog, {
      kicker: "דוגמה 1", title: "סיכום הדוגמה", open: true, nextLabel: "לדוגמה הבאה", onNext: () => {}, onClose: () => {},
    }, createElement(SummaryContent, { formulaLatex: "f_n(x)", paragraphs: CONT_SUMMARIES.C1 })));
    expect(html).toContain("סיכום הדוגמה");
    expect(html).toContain('class="guided-summary"');
    expect(html).not.toContain("supremum-proof-lead");
  });
});
