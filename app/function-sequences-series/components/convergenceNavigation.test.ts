import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CONVERGENCE_LESSONS, type ConvergenceLesson } from "../lessonProgress";
import { ConvergenceNavigator } from "./ConvergenceNavigator";
import { convergenceLessonExplanations } from "./ConvergenceLessonExplanations";

const render = (view: ConvergenceLesson | "definitions" | "complete", completed: ConvergenceLesson[]) =>
  renderToStaticMarkup(createElement(ConvergenceNavigator, { view, completed, busy: false, onOpen: () => {} }));

describe("convergence lesson navigation", () => {
  it("renders the initial sequence with only its first lesson available and next disabled", () => {
    const html = render("warmup", []);
    expect(html).toContain("חלק 1 מתוך 4");
    expect(html.match(/class="convergence-progress-step"/g)).toHaveLength(4);
    expect(html.match(/data-state="locked"/g)).toHaveLength(3);
    expect(html).toMatch(/החלק הבא<\/button>/);
    expect(html).toMatch(/<button type="button" class="panel-action" disabled="">החלק הבא/);
    expect(html).toContain('aria-current="step"');
  });

  it("identifies the current completed lesson and enables next only after its completion", () => {
    const html = render("warmup", ["warmup"]);
    expect(html).toContain('data-state="complete"');
    expect(html).toContain("הושלם");
    expect(html).toMatch(/<button type="button" class="panel-action">החלק הבא/);
    expect(html.match(/data-state="locked"/g)).toHaveLength(2);
  });

  it("enables finish after all four lessons and omits next from the completion view", () => {
    const html = render("pair", ["warmup", "power", "oscillation", "pair"]);
    expect(html).toContain("סיום הפעילות");
    expect(html).not.toMatch(/panel-action" disabled="">סיום הפעילות/);
    const complete = render("complete", ["warmup", "power", "oscillation", "pair"]);
    expect(complete).toContain("המסלול הושלם");
    expect(complete).not.toContain("החלק הבא");
    expect(complete).not.toContain("סיום הפעילות");
    expect(complete).toContain("החלק הקודם");
  });

  it("offers return to the last lesson from completion and keeps definitions available", () => {
    const onOpen = vi.fn();
    const html = renderToStaticMarkup(createElement(ConvergenceNavigator, {
      view: "complete", completed: ["warmup", "power", "oscillation", "pair"], busy: false, onOpen,
    }));
    expect(html).toContain("החלק הקודם");
    expect(CONVERGENCE_LESSONS.at(-1)?.id).toBe("pair");
    expect(render("definitions", [])).toContain("מסלול החקירה");
  });

  it("disables navigation while busy and exposes an author slot for every lesson", () => {
    const busyHtml = renderToStaticMarkup(createElement(ConvergenceNavigator, {
      view: "warmup", completed: ["warmup"], busy: true, onOpen: () => {},
    }));
    expect(busyHtml.match(/disabled=""/g)).toHaveLength(6);
    expect(Object.keys(convergenceLessonExplanations)).toEqual(CONVERGENCE_LESSONS.map(({ id }) => id));
    // Authors can fill these slots later without changing the navigation contract.
    const warmupIntro = renderToStaticMarkup(createElement("div", null, convergenceLessonExplanations.warmup));
    expect(warmupIntro).toContain("חקירה חופשית");
    expect(warmupIntro).toContain("ε");
    expect(warmupIntro).not.toContain(String.fromCharCode(11));
    const powerIntro = renderToStaticMarkup(createElement("div", null, convergenceLessonExplanations.power));
    expect(powerIntro).toContain("הרחבת התחום");
    expect(powerIntro).toContain("ε");
    expect(powerIntro).not.toContain(String.fromCharCode(11));
    const oscillationIntro = renderToStaticMarkup(createElement("div", null, convergenceLessonExplanations.oscillation));
    expect(oscillationIntro).toContain("<strong>רק</strong>");
    expect(oscillationIntro).toContain("הצגת המינימום והמקסימום");
    const pairIntro = renderToStaticMarkup(createElement("div", null, convergenceLessonExplanations.pair));
    expect(pairIntro.match(/<li>/g)).toHaveLength(4);
    expect(pairIntro).toContain("<strong>לא מתכנסת במידה שווה</strong><span><span>, אם");
    expect(pairIntro).toContain("ε");
  });
});
