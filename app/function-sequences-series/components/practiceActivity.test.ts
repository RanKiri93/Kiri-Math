import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { odeCourse } from "../../ode/course";
import { SubjectModule } from "../SubjectModule";
import { mixSeed } from "../../constant-coefficients-euler/practice/random";
import { availableTopics, drawExercise } from "../practice/practiceBank";
import { PRACTICE_TOPICS } from "../practice/practiceTypes";
import { PracticeActivity } from "./PracticeActivity";
import { PracticePlot } from "./PracticePlot";

/** Exhaustive sweeps run long under the parallel full suite; give them room. */
const SWEEP_TIMEOUT_MS = 30_000;

describe("summary practice activity", () => {
  it("shows the topic filter, a redraw action and one exercise card with only its first step open", () => {
    const html = renderToStaticMarkup(createElement(PracticeActivity));
    expect(html).not.toContain("katex-error");
    expect(html).toContain("כל הנושאים");
    expect(html).toContain("תרגיל חדש");
    expect(html.match(/class="module-intro-card practice-exercise-card"/g)).toHaveLength(1);
    expect(html.match(/data-practice-step=/g)).toHaveLength(1);
    expect(html).toContain("שלב 1");
    expect(html).toContain('<div class="supremum-proof-formula" dir="ltr">');
    // The card's graph with its n and epsilon sliders, and the level filter.
    expect(html).toContain("practice-plot-panel");
    // The aid sits in a side column of the card body, with a fold toggle.
    expect(html).toContain('class="practice-exercise-body has-aid"');
    expect(html).toMatch(/<aside class="practice-plot-panel" aria-label="עזר חזותי">/);
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain("הסתרת הגרף");
    expect(html).toContain("practice-plot");
    expect(html).toContain("כל הרמות");
  });

  it("gives every drawn exercise a graph that renders for every index of its slider", () => {
    for (const level of ["easy", "medium", "advanced"] as const) {
      for (let i = 1; i <= 25; i++) {
        const exercise = drawExercise("all", mixSeed(i, 211), undefined, undefined, level);
        if (!exercise) continue;
        expect(exercise.plot, exercise.signature).toBeDefined();
        for (const n of [1, 2, 7, exercise.plot!.maxN]) {
          const html = renderToStaticMarkup(createElement(PracticePlot, { spec: exercise.plot!, n, epsilon: 0.1, showBand: true }));
          expect(html, `${exercise.signature} n=${n}`).toContain('data-part="curve"');
          expect(html).not.toContain("katex-error");
        }
      }
    }
  }, SWEEP_TIMEOUT_MS);

  it("disables topics that have no exercises yet", () => {
    const html = renderToStaticMarkup(createElement(PracticeActivity));
    const missing = PRACTICE_TOPICS.filter((topic) => !availableTopics().includes(topic)).length;
    const group = html.slice(html.indexOf('aria-label="נושא התרגילים"'));
    expect(group.slice(0, group.indexOf("</div>")).match(/disabled=""/g)?.length ?? 0).toBe(missing);
  });

  it("is not a tracked activity: no registry id and no completion mark in the menu", () => {
    const activities = odeCourse.modules.find((entry) => entry.id === "function-sequences")?.activities ?? [];
    expect(activities.map((activity) => activity.id)).not.toContain("practice");
    expect(activities).toHaveLength(5);
    const html = renderToStaticMarkup(createElement(SubjectModule, { subject: "function-sequences" }));
    const card = html.slice(html.indexOf("6. תרגול מסכם"));
    expect(card.slice(0, card.indexOf("</article>"))).not.toContain("data-activity-complete");
  });
});
