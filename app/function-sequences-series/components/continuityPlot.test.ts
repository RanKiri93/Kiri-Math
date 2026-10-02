import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CONT_BASE_GRAPH, CONT_EXAMPLES, type ContGraphFlags } from "../math/continuityExamples";
import { ContinuityPlot, endpointDots } from "./ContinuityPlot";

const { C1, C2, C3 } = CONT_EXAMPLES;
const ALL: ContGraphFlags = { limit: true, band: true, jumps: true };

const render = (ex: typeof C1, flags: ContGraphFlags, n = 5, epsilon = 0.2) =>
  renderToStaticMarkup(createElement(ContinuityPlot, { example: ex, n, flags, epsilon }));
const count = (html: string, part: string) => (html.match(new RegExp(`data-part="${part}"`, "g")) ?? []).length;

describe("ContinuityPlot", () => {
  it("is an LTR island with no readout and no KaTeX errors", () => {
    for (const ex of [C1, C2, C3]) {
      const html = render(ex, ALL);
      expect(html).toMatch(/<figure class="convergence-plot continuity-plot" dir="ltr">/);
      expect(html).toMatch(/<svg class="convergence-svg continuity-svg"[^>]* dir="ltr"/);
      expect(html).not.toContain("katex-error");
      expect(html).not.toContain("convergence-readout");
      expect(html).toContain("convergence-legend");
    }
  });

  it("toggles the limit, band and jump elements with the flags", () => {
    const base = render(C1, CONT_BASE_GRAPH);
    expect(count(base, "limit")).toBe(0);
    expect(count(base, "band")).toBe(0);
    expect(count(base, "dot")).toBe(0);
    expect(count(base, "discontinuity")).toBe(0);
    expect(count(base, "curve")).toBe(1);

    expect(count(render(C1, { ...CONT_BASE_GRAPH, limit: true }), "limit")).toBe(3);
    expect(count(render(C1, { ...CONT_BASE_GRAPH, limit: true, band: true }), "band")).toBeGreaterThan(0);
    expect(count(render(C1, { ...CONT_BASE_GRAPH, band: true }), "band")).toBeGreaterThan(0);
    expect(count(render(C1, { ...CONT_BASE_GRAPH, band: true }), "limit")).toBe(0);

    const jumps = render(C1, { ...CONT_BASE_GRAPH, limit: true, jumps: true });
    expect(count(jumps, "discontinuity")).toBe(1);
    expect(count(jumps, "dot")).toBeGreaterThan(2);
    expect(count(render(C3, { ...CONT_BASE_GRAPH, limit: true, jumps: true }, 4), "discontinuity")).toBe(0);
  });

  it("draws one path per piece and never joins across a jump", () => {
    expect(count(render(C3, CONT_BASE_GRAPH, 6), "curve")).toBe(6);
    expect(count(render(C3, CONT_BASE_GRAPH, 1), "curve")).toBe(1);
    expect(count(render(C2, CONT_BASE_GRAPH, 6), "curve")).toBe(2);
  });

  it("omits endpoint dots when there are too many pieces", () => {
    expect(count(render(C3, { ...CONT_BASE_GRAPH, jumps: true }, 12), "dot")).toBeGreaterThan(0);
    expect(count(render(C3, { ...CONT_BASE_GRAPH, jumps: true }, 30), "dot")).toBe(0);
  });

  it("marks a clipped C2 peak with its true value", () => {
    const html = render(C2, CONT_BASE_GRAPH, 30);
    expect(count(html, "peak")).toBe(1);
    expect(html).toContain(">31<");
    expect(count(render(C2, CONT_BASE_GRAPH, 5), "peak")).toBe(0);
  });

  it("endpointDots: continuous joins get no dot, jumps get open and closed dots", () => {
    expect(endpointDots(C2.pieces(5), C2.domain).filter((d) => d.x > 0 && d.x < 1)).toHaveLength(0);
    const dots = endpointDots(C3.pieces(3), C3.domain);
    expect(dots.filter((d) => Math.abs(d.x - 1 / 3) < 1e-9).map((d) => d.closed).sort()).toEqual([false, true]);
    expect(dots.find((d) => d.x === 1)?.closed).toBe(false);
  });
});
