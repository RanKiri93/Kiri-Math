import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SequencePlot } from "./SequencePlot";
import { POSITIVE_RAY, REAL_LINE, UNIT_INTERVAL } from "../math/convergenceActivity";

describe("convergence plot rendering safeguards", () => {
  it("does not reveal the limit or its jump markers before the prediction", () => {
    const html = renderToStaticMarkup(createElement(SequencePlot, {
      id: "power", n: 8, domain: UNIT_INTERVAL, view: { left: 0, right: 2 },
      epsilon: 0.25, showLimit: false, probeX: 1,
    }));
    expect(html).not.toContain("convergence-limit-point");
    expect(html).not.toContain('class="convergence-band"');
    expect(html).not.toContain("|f_8-f|");
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

  it("keeps the off-screen witness readout and names the correct sequence", () => {
    const html = renderToStaticMarkup(createElement(SequencePlot, {
      id: "far", n: 16, domain: POSITIVE_RAY, view: { left: 0, right: 4 },
      epsilon: 0.25, showLimit: true, probeX: 16,
    }));
    expect(html).toContain("הנקודה מחוץ לחלון התצוגה");
    expect(html).toContain("b_16(16)\\approx 0.5");
    expect(html).not.toContain("a_n(x)");
  });

  it("prioritizes an excluded-domain warning over an off-screen warning", () => {
    const html = renderToStaticMarkup(createElement(SequencePlot, {
      id: "near", n: 16, domain: { ...POSITIVE_RAY, left: 0.5 }, view: { left: 1, right: 4 },
      epsilon: 0.25, showLimit: true, probeX: 0,
    }));
    expect(html).toContain("הנקודה מחוץ לתחום");
    expect(html).not.toContain("הנקודה מחוץ לחלון התצוגה");
    expect(html).not.toContain("a_16(0)");
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
});
