import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BASE_GRAPH, SUP_STEPS, type GraphFlags } from "../math/supremumArgument";
import { SUP_EXAMPLES, SUP_EXAMPLE_ORDER } from "../math/supremumExamples";
import { SUP_VIEWS, clampProbe, defaultViewIndex, probeSliderBounds } from "../math/supremumViews";
import { MathInlineText } from "./MathInlineText";
import { SupSequencePlot, epsilonReadoutText } from "./SupSequencePlot";
import { SupremumIntro } from "./SupremumIntro";
import { SupremumActivity } from "./SupremumActivity";
import { SolvedNote } from "./GuidedStepParts";
import { FullProofContent, SupremumProofDialog } from "./SupremumProofDialog";
import { SUP_FULL_PROOFS } from "../math/supremumProofs";
import { SupremumPlot } from "./SupremumPlot";
import { SliderPanel } from "./ConvergenceUI";

const { E1, E1p, E2, E3, E3p } = SUP_EXAMPLES;
const FULL: GraphFlags = {
  ...BASE_GRAPH, limitLine: true, tangent: true, signStrip: true, maxMarker: "argmax", supLine: true, fadedOutsideDomain: true,
};

const plot = (ex: typeof E1, flags: GraphFlags, n = 5, probeX = ex.defaultProbe, viewIdx = 0) =>
  renderToStaticMarkup(createElement(SupremumPlot, { example: ex, n, view: SUP_VIEWS[ex.id][viewIdx], flags, probeX }));

describe("supremum activity rendering", () => {
  it("opens on the intro, with the workspace hidden and no return action yet", () => {
    const html = renderToStaticMarkup(createElement(SupremumActivity));
    expect(html).toMatch(/<section class="module-intro-card convergence-entry supremum-intro">/);
    expect(html).toContain("להתחלת הפעילות");
    expect(html).not.toContain("מטרת הפעילות");
  });

  it("renders the intro statement in math islands without KaTeX errors", () => {
    const html = renderToStaticMarkup(createElement(SupremumIntro, { returning: false, onStart: () => {} }));
    expect(html).not.toContain("katex-error");
    expect(html).toContain("מבחן הסופרמום: הוכחת/הפרכת התכנסות במידה שווה");
    expect(html).toContain("ארסנל היכולות שלנו");
    // The theorem is emphasized like the convergence definitions of the first activity.
    expect(html.match(/class="convergence-definition formal"/g)).toHaveLength(1);
    expect(html).toContain("convergence-definition");
    expect(html).toContain(String.raw`M_n=\sup_{x\in D}|f_n(x)-f(x)|`);
    expect(html).toContain("<ol>");
    expect(renderToStaticMarkup(createElement(SupremumIntro, { returning: true, onStart: () => {} }))).toContain("חזרה לפעילות");
  });

  it("keeps the workspace and the example track out of the intro", () => {
    const html = renderToStaticMarkup(createElement(SupremumActivity));
    expect(html).not.toContain("convergence-sequence-nav");
    expect(html).not.toContain("convergence-workspace");
  });

  it("presents the examples as a stage track with the first example open and the rest locked", () => {
    const html = renderToStaticMarkup(createElement(SupremumActivity, { initialView: "E1" }));
    expect(html).toContain('aria-label="דוגמאות הפעילות"');
    expect(html).toContain("דוגמה 1 מתוך 5");
    expect(html.match(/class="convergence-progress-step"/g)).toHaveLength(5);
    expect(html).toContain('class="convergence-progress-list supremum-progress-list"');
    expect(html.match(/data-state="locked"/g)).toHaveLength(4);
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toContain("נעולה");
    expect(html).toContain('id="supremum-example-title"');
    expect(html).toContain('data-example-explanation="E1"');
    expect(html).toContain("הדוגמה הקודמת");
    expect(html).toContain("מטרת הפעילות");
    expect(html).not.toContain("supremum-example-chips");
  });

  it("renders the first step in LTR islands without KaTeX errors", () => {
    const html = renderToStaticMarkup(createElement(SupremumActivity, { initialView: "E1" }));
    expect(html).not.toContain("katex-error");
    // The example's sequence and domain sit in the example header, not in the step card.
    expect(html).toMatch(/<div class="supremum-example-formula" id="supremum-example-formula" dir="ltr">/);
    expect(html).toContain(String.raw`f_n(x)=nxe^{-nx},\quad x\in [0,\infty)`);
    expect(html).toMatch(/<h3 class="convergence-part-title" id="supremum-example-title">דוגמה 1<\/h3>/);
    expect(html).not.toContain("convergence-formula-card");
    expect(html).toMatch(/<figure class="convergence-plot supremum-plot" dir="ltr">/);
    expect(html).toMatch(/<svg class="convergence-svg supremum-svg"[^>]*dir="ltr"/);
    expect(html).toMatch(/<span class="convergence-step-label">שלב 1 מתוך \d+<\/span>/);
    expect(html).toContain("בדיקה");
    expect(html).toContain("הצג תשובה לשלב");
    expect(html).not.toContain("נקודה קריטית");
  });

  it("shows nothing before its step: no sup line, marker, sign strip or tangent at the start", () => {
    const html = renderToStaticMarkup(createElement(SupremumActivity, { initialView: "E1" }));
    for (const cls of ["supremum-sup-line", "supremum-max-marker", "supremum-sign-strip", "supremum-tangent", "supremum-mn-plot"]) {
      expect(html).not.toContain(cls);
    }
    expect(html).toMatch(/type="number"[^>]*value="1"/);
    expect(html).toMatch(/<fieldset class="convergence-slider-epsilon" disabled=""/);
    expect(html).toContain('max="64"');
  });

  it("renders every step's Hebrew text without KaTeX errors", () => {
    for (const id of SUP_EXAMPLE_ORDER) {
      for (const step of SUP_STEPS[id]) {
        const texts = [step.title, step.prompt, step.solvedNote, step.minimalProof ?? "", ...step.hints, step.disclosure?.body ?? "", ...step.parts.map((p) => p.lead ?? ""),
          ...step.parts.flatMap((p) => p.kind === "checklist" ? p.checklist.items.map((i) => `${i.label}, ${i.unneeded ?? ""}`) : [])];
        for (const text of texts) {
          const html = renderToStaticMarkup(createElement(MathInlineText, { text }));
          expect(html, `${step.id}: ${text}`).not.toContain("katex-error");
        }
      }
    }
  });
});

describe("solved-step feedback", () => {
  it("shows the minimal proof, then one note per ticked unneeded reason", () => {
    const step = SUP_STEPS.E1.find((s) => s.id === "E1-3")!;
    const part = step.parts[0];
    const revealed = renderToStaticMarkup(createElement(SolvedNote, { step, answers: { [part.id]: part.reveal as string[] } }));
    expect(revealed).toContain('class="supremum-minimal-proof"');
    expect(revealed).toContain("הוכחה מינימלית");
    expect(revealed).not.toContain("נימוק מיותר");
    const ticked = renderToStaticMarkup(createElement(SolvedNote, { step, answers: { [part.id]: [...(part.reveal as string[]), "zero-left"] } }));
    expect(ticked.match(/class="supremum-unneeded"/g)).toHaveLength(1);
    expect(ticked.indexOf("נימוק מיותר")).toBeGreaterThan(ticked.indexOf("הוכחה מינימלית"));
    expect(ticked).toContain("זה טוב לדעת שהוא לא מתקבל בנקודה זו");
    expect(ticked).not.toContain("katex-error");
  });

  it("shows only the note for steps without a minimal proof", () => {
    const step = SUP_STEPS.E1[0];
    const html = renderToStaticMarkup(createElement(SolvedNote, { step, answers: undefined }));
    expect(html).not.toContain("supremum-minimal-proof");
  });
});

describe("full-proof pop-up", () => {
  it("renders every example's complete proof without KaTeX errors, ending in the example's verdict", () => {
    for (const id of SUP_EXAMPLE_ORDER) {
      const html = renderToStaticMarkup(createElement(FullProofContent, { id }));
      expect(html, id).not.toContain("katex-error");
      expect(html).toMatch(/<div class="supremum-proof-formula" dir="ltr">/);
      expect(html.match(/<li>/g)?.length ?? 0, id).toBeGreaterThanOrEqual(4);
      const sections = SUP_FULL_PROOFS[id].sections;
      const conclusion = sections[sections.length - 1].body;
      expect(conclusion, id).toContain("מבחן הסופרמום");
      expect(conclusion.includes("אינה במידה שווה"), id).toBe(SUP_EXAMPLES[id].verdict === "not-uniform");
    }
  });

  it("stays closed and empty until an example is finished", () => {
    const closed = renderToStaticMarkup(createElement(SupremumProofDialog, {
      id: "E1", position: 1, open: false, nextLabel: "לדוגמה הבאה", onNext: () => {}, onClose: () => {},
    }));
    expect(closed).toMatch(/^<dialog class="supremum-proof-dialog" aria-labelledby="supremum-proof-title"><\/dialog>$/);
    const shown = renderToStaticMarkup(createElement(SupremumProofDialog, {
      id: "E1", position: 1, open: true, nextLabel: "לדוגמה הבאה", onNext: () => {}, onClose: () => {},
    }));
    expect(shown).toContain("סיכום דוגמה 1");
    expect(shown).toContain("הוכחה מלאה ותמציתית");
    expect(shown).toContain("חזרה לדוגמה");
    expect(shown).toContain("לדוגמה הבאה");
  });

  it("offers no reopen action on an unfinished example", () => {
    const html = renderToStaticMarkup(createElement(SupremumActivity, { initialView: "E1" }));
    expect(html).not.toContain("supremum-proof-open");
    expect(html).not.toContain("supremum-proof-panel");
  });
});

describe("G1: the function graph", () => {
  it("draws only what the flags allow", () => {
    const bare = plot(E1, BASE_GRAPH);
    for (const cls of ["supremum-sup-line", "supremum-max-marker", "supremum-sign-strip", "supremum-tangent", "supremum-limit-line", "convergence-context-curve"]) {
      expect(bare).not.toContain(cls);
    }
    expect(bare).toContain("convergence-probe");
    const full = plot(E1, FULL);
    for (const cls of ["supremum-sup-line", "supremum-max-marker", "supremum-sign-strip", "supremum-tangent", "supremum-limit-line"]) {
      expect(full).toContain(cls);
    }
    expect(full).toContain('data-marker="argmax"');
    expect(plot(E1, { ...BASE_GRAPH, maxMarker: "origin" })).toContain('data-marker="origin"');
    expect(plot(E1, { ...BASE_GRAPH, tangent: true })).toContain("supremum-tangent");
    // No numeric readout panel under the graph.
    expect(full).not.toContain("supremum-readout");
    expect(full).not.toContain("convergence-readout");
    expect(plot(E1, { ...BASE_GRAPH, signStrip: true })).not.toContain("supremum-sup-line");
  });

  it("stays an LTR island", () => {
    const html = plot(E2, FULL);
    expect(html).toMatch(/^<figure class="convergence-plot supremum-plot" dir="ltr">/);
    expect(html).toMatch(/<svg[^>]*dir="ltr"/);
  });

  it("draws the faded context outside [1,inf) and [0,1/2] only when flagged", () => {
    for (const ex of [E1p, E3p]) {
      expect(plot(ex, { ...BASE_GRAPH, fadedOutsideDomain: true })).toContain("convergence-context-curve");
      expect(plot(ex, BASE_GRAPH)).not.toContain("convergence-context-curve");
    }
    expect(plot(E1, { ...BASE_GRAPH, fadedOutsideDomain: true })).not.toContain("convergence-context-curve");
  });

  it("fades the suspected point when it is not an interior point of the domain", () => {
    const critical = { ...BASE_GRAPH, maxMarker: "critical" as const };
    expect(plot(E1, critical, 3)).not.toContain("is-faded");
    expect(plot(E1p, critical, 3)).toContain("supremum-max-marker is-faded");
    expect(plot(E3p, critical, 3, 0.4, 0)).toContain("supremum-max-marker is-faded");
  });

  it("offers the view chips and keeps the probe inside the domain and the window", () => {
    const html = plot(E3, FULL, 5, 0.8, 0);
    expect(html).not.toContain("supremum-view-chip");
    const withChips = renderToStaticMarkup(createElement(SupremumPlot, {
      example: E3, n: 5, view: SUP_VIEWS.E3[0], flags: FULL, probeX: 0.8, viewIndex: 0, onViewChange: () => {},
    }));
    expect(withChips.match(/class="supremum-view-chip[ "]/g)).toHaveLength(SUP_VIEWS.E3.length);
    expect(clampProbe(E1p, SUP_VIEWS.E1p[0], 0.2)).toBe(1);
    expect(clampProbe(E3p, SUP_VIEWS.E3p[0], 0.9)).toBe(0.5);
    expect(clampProbe(E1, SUP_VIEWS.E1[2], 3)).toBe(0.5);
    expect(probeSliderBounds(E3, SUP_VIEWS.E3[3])).toEqual({ min: 0.98, max: 1 });
    for (const id of SUP_EXAMPLE_ORDER) {
      const dv = SUP_EXAMPLES[id].defaultView;
      expect(SUP_VIEWS[id][defaultViewIndex(id)]).toEqual(dv);
    }
  });
});

describe("G2: the M_n graph", () => {
  it("says the dots never all enter the band when M_n does not tend to 0", () => {
    for (const ex of [E1, E3]) {
      const html = renderToStaticMarkup(createElement(SupSequencePlot, { example: ex, n: 3, epsilon: 0.1 }));
      expect(html).toContain('data-readout="not-tending"');
      expect(html).not.toContain("katex-error");
    }
  });

  it("gives N for a sequence that tends to 0", () => {
    const html = renderToStaticMarkup(createElement(SupSequencePlot, { example: E1p, n: 3, epsilon: 0.1 }));
    expect(html).toContain('data-readout="N"');
    expect(epsilonReadoutText(E1p, 0.1).text).toContain("$n>3$");
    expect(epsilonReadoutText(E2, 0.1).text).toContain("$n>5$");
    expect(epsilonReadoutText(E2, 0.005).kind).toBe("beyond-range");
  });

  it("renders 64 dots inside an LTR island", () => {
    const html = renderToStaticMarkup(createElement(SupSequencePlot, { example: E2, n: 4, epsilon: 0.2 }));
    expect(html.match(/supremum-mn-dot/g)).toHaveLength(64);
    expect(html).toMatch(/^<figure class="convergence-plot supremum-plot supremum-mn-plot" dir="ltr">/);
    expect(html).not.toContain("נקודה קריטית");
  });
});

describe("SliderPanel index cap", () => {
  it("honours nMax and defaults to the lab limit", () => {
    const props = { n: 64, onN: () => {}, epsilon: 0.1, onEpsilon: () => {}, epsilonEnabled: false };
    const capped = renderToStaticMarkup(createElement(SliderPanel, { ...props, nMax: 64 }));
    expect(capped).toMatch(/type="range"[^>]*max="64"/);
    expect(capped).toContain("זהו גבול התצוגה");
    const lab = renderToStaticMarkup(createElement(SliderPanel, props));
    expect(lab).toMatch(/type="range"[^>]*max="256"/);
    expect(lab).not.toContain("זהו גבול התצוגה");
  });
});
