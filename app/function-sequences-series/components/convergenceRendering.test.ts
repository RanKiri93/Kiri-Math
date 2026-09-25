import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SequencePlot } from "./SequencePlot";
import { POSITIVE_RAY, REAL_LINE, UNIT_INTERVAL } from "../math/convergenceActivity";
import { plotX, plotY, PLOT_Y_MAX } from "../math/sequencePlot";
import { ConvergenceLab } from "./ConvergenceLab";
import { IndexControl } from "./ConvergenceUI";

describe("convergence plot rendering safeguards", () => {
  it("opens with boxed definitions and one activity entry action", () => {
    const html = renderToStaticMarkup(createElement(ConvergenceLab));
    expect(html.match(/class="convergence-definition"/g)).toHaveLength(2);
    expect(html).toContain("\\lim_{n\\to\\infty}f_n(x)=f(x)");
    expect(html.match(/<button\b/g)).toHaveLength(1);
    expect(html).toContain("להתחלת הפעילות");
    expect(html).not.toContain("katex-error");
  });

  it("pairs the bounded integer index slider with an exact numeric input", () => {
    const html = renderToStaticMarkup(createElement(IndexControl, { n: 18, onChange: () => {} }));
    expect(html).toMatch(/type="range"[^>]*dir="ltr"[^>]*min="1"[^>]*max="256"[^>]*step="1"[^>]*value="18"/);
    expect(html).toMatch(/type="number"[^>]*value="18"/);
  });
  it("does not reveal the limit or its jump markers before the prediction", () => {
    const html = renderToStaticMarkup(createElement(SequencePlot, {
      id: "power", n: 8, domain: UNIT_INTERVAL, view: { left: 0, right: 2 },
      epsilon: 0.25, showLimit: false, probeX: 1,
    }));
    expect(html).not.toContain("convergence-limit-point");
    expect(html).not.toContain('class="convergence-band"');
    expect(html).not.toContain("|f_{8}-f|");
    expect(html).toMatch(/<svg[^>]*dir="ltr"/);
    expect(html).not.toContain("katex-error");
  });

  it("distinguishes the open power endpoint from the included jump value", () => {
    const props = {
      id: "power" as const, n: 256, view: { left: 0, right: 2 },
      epsilon: 0.25, showLimit: true, probeX: null,
    };
    const closed = renderToStaticMarkup(createElement(SequencePlot, { ...props, domain: UNIT_INTERVAL }));
    const open = renderToStaticMarkup(createElement(SequencePlot, { ...props, domain: { ...UNIT_INTERVAL, rightClosed: false } }));
    expect(closed).toContain('class="convergence-endpoint-closed convergence-limit-point"');
    expect(open).not.toContain("convergence-endpoint-closed");
    expect(open).toContain('class="convergence-endpoint-open convergence-limit-point"');
  });

  it("draws power context only outside the selected domain without replacing the domain curve", () => {
    const html = renderToStaticMarkup(createElement(SequencePlot, {
      id: "power", n: 3,
      domain: { left: 0, right: 0.5, leftClosed: true, rightClosed: true },
      view: { left: 0, right: 2 }, epsilon: 0.25, showLimit: true,
      probeX: 0.25, powerContext: true,
    }));

    // Context and actual-domain paths have separate classes and are both present.
    expect(html).toContain('class="convergence-curve convergence-context-curve"');
    expect(html).toContain('class="convergence-curve"');
    expect(html).toContain('class="convergence-band"');
    expect(html).toContain('class="convergence-domain-boundary"');
    expect(html).toContain('class="convergence-probe"');
    expect(html).toContain('class="convergence-curve convergence-limit"');
    // The limit and band remain visible while the selected-domain witness remains active.
    expect(html).toContain("f(0.25)");
  });

  it("preserves the open right endpoint safeguard with power context", () => {
    const html = renderToStaticMarkup(createElement(SequencePlot, {
      id: "power", n: 8,
      domain: { left: 0, right: 0.5, leftClosed: true, rightClosed: false },
      view: { left: 0, right: 2 }, epsilon: 0.25, showLimit: true,
      probeX: 0.5, powerContext: true,
    }));

    expect(html).toContain('class="convergence-curve convergence-context-curve"');
    expect(html).not.toContain('class="convergence-endpoint-closed convergence-limit-point"');
    expect(html).toContain('class="convergence-endpoint-open"');
    expect(html).toContain("הנקודה מחוץ לתחום");
  });

  it("moves the domain boundary and clips the context curve at the frame", () => {
    const view = { left: 0, right: 2 };
    for (const right of [0.25, 0.75, 1]) {
      const html = renderToStaticMarkup(createElement(SequencePlot, {
        id: "power", n: 256, domain: { ...UNIT_INTERVAL, right }, view,
        epsilon: 0.25, showLimit: true, probeX: 1.5, powerContext: true,
      }));
      expect(html).toContain(`class="convergence-domain-boundary" x1="${plotX(right, view)}"`);
      const path = html.match(/class="convergence-curve convergence-context-curve" d="([^"]+)"/)![1];
      const coordinates = [...path.matchAll(/[ML]([^, ]+),([^ ]+)/g)].map(m => [Number(m[1]), Number(m[2])]);
      expect(coordinates.every(([x]) => x >= plotX(right, view))).toBe(true);
      expect(coordinates.at(-1)![1]).toBeCloseTo(plotY(PLOT_Y_MAX));
      expect(html).not.toContain('class="convergence-probe"');
      expect(path).not.toMatch(/NaN|Infinity/);
    }
  });

  it("keeps the off-screen witness readout and names the correct sequence", () => {
    const html = renderToStaticMarkup(createElement(SequencePlot, {
      id: "far", n: 16, domain: POSITIVE_RAY, view: { left: 0, right: 4 },
      epsilon: 0.25, showLimit: true, probeX: 16,
    }));
    expect(html).toContain("הנקודה מחוץ לחלון התצוגה");
    expect(html).toContain("g_{16}(16)\\approx 0.5");
    expect(html).toContain("g(16)\\approx 0");
    expect(html).toContain("|g_{16}-g|");
    expect(html).not.toContain("a_n(x)");
  });

  it("prioritizes an excluded-domain warning over an off-screen warning", () => {
    const html = renderToStaticMarkup(createElement(SequencePlot, {
      id: "near", n: 16, domain: { ...POSITIVE_RAY, left: 0.5 }, view: { left: 1, right: 4 },
      epsilon: 0.25, showLimit: true, probeX: 0,
    }));
    expect(html).toContain("הנקודה מחוץ לתחום");
    expect(html).not.toContain("הנקודה מחוץ לחלון התצוגה");
    expect(html).not.toContain("f_{16}(0)");
  });

  it("uses the visible envelope class instead of an aliased high-frequency curve", () => {
    const html = renderToStaticMarkup(createElement(SequencePlot, {
      id: "oscillation", n: 256, domain: REAL_LINE, view: { left: -4, right: 4 },
      epsilon: 0.25, showLimit: true, probeX: null,
    }));
    expect(html.match(/class="convergence-envelope"/g)).toHaveLength(2);
    expect(html).not.toContain('class="convergence-curve"');
    expect(html).toContain("מוצגת מעטפת התנודות");
  });

  it("groups multi-digit indices and places the legend directly after the graph", () => {
    for (const n of [1, 18, 256]) {
      const html = renderToStaticMarkup(createElement(SequencePlot, {
        id: "shifted-oscillation", n, domain: { ...UNIT_INTERVAL, left: -0.5, right: 0.5 },
        view: { left: -0.5, right: 0.5 }, epsilon: 0.25, showLimit: true, probeX: 0.25,
      }));
      expect(html).toContain(`f_{${n}}(0.25)`);
      expect(html).toContain(`|f_{${n}}-f|`);
      expect(html).toContain('</svg><div class="convergence-legend"');
      expect(html).not.toContain("katex-error");
    }
  });

  it("omits the vertical clipping disclaimer while still clipping large powers", () => {
    const html = renderToStaticMarkup(createElement(SequencePlot, {
      id: "power", n: 256, domain: { ...UNIT_INTERVAL, right: 2 },
      view: { left: 0, right: 2 }, epsilon: null, showLimit: false, probeX: null,
    }));
    expect(html).not.toContain("נחתכים בגרף");
    expect(html).toContain('class="convergence-curve"');
  });
});
