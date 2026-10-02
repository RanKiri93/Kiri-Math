import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { INT_BASE_GRAPH, INT_EXAMPLES, INT_MAX_N, type IntExample, type IntGraphFlags } from "../math/integralExamples";
import { IntegralPlot, integralSamples } from "./IntegralPlot";
import { IntegralSequencePlot, integralSequenceRange, integralSequenceX } from "./IntegralSequencePlot";

const { I1, I2, I3 } = INT_EXAMPLES;
const ALL: IntGraphFlags = { limit: true, area: true, band: true, integrals: true, supremum: true };

const render = (ex: IntExample, flags: IntGraphFlags, n = 5, epsilon = 0.1, split?: number) =>
  renderToStaticMarkup(createElement(IntegralPlot, { example: ex, n, flags, epsilon, split }));
const renderSeq = (ex: IntExample, flags: IntGraphFlags, n = 5) =>
  renderToStaticMarkup(createElement(IntegralSequencePlot, { example: ex, n, flags }));
const count = (html: string, part: string) => (html.match(new RegExp(`data-part="${part}"`, "g")) ?? []).length;

describe("IntegralPlot", () => {
  it("is an LTR island with a legend, no readout and no KaTeX errors", () => {
    for (const ex of [I1, I2, I3]) {
      const html = render(ex, ALL);
      expect(html).toMatch(/<figure class="convergence-plot integral-plot" dir="ltr">/);
      expect(html).toMatch(/<svg class="convergence-svg integral-svg"[^>]* dir="ltr"/);
      expect(html).not.toContain("katex-error");
      expect(html).not.toContain("convergence-readout");
      expect(html).toContain("convergence-legend");
    }
  });

  it("toggles the limit, band and area elements with the flags", () => {
    const base = render(I1, INT_BASE_GRAPH);
    for (const part of ["limit", "band", "area", "area-left", "area-right", "split-line", "limit-point"]) expect(count(base, part)).toBe(0);
    expect(count(base, "curve")).toBe(1);
    expect(count(render(I1, { ...INT_BASE_GRAPH, limit: true }), "limit")).toBe(1);
    expect(count(render(I1, { ...INT_BASE_GRAPH, limit: true }), "limit-point")).toBe(0);
    expect(count(render(I1, { ...INT_BASE_GRAPH, band: true }), "band")).toBe(1);
    expect(count(render(I1, { ...INT_BASE_GRAPH, area: true }), "area")).toBe(1);
    expect(count(render(I1, { ...INT_BASE_GRAPH, band: true }, 5, 0), "band")).toBe(0);
  });

  it("I3 draws the limit as an isolated point at x=0 and a band that includes it", () => {
    const html = render(I3, { ...INT_BASE_GRAPH, limit: true, band: true });
    expect(count(html, "limit-point")).toBe(1);
    expect(count(html, "limit-open")).toBe(1);
    expect(count(html, "band")).toBe(2);
  });

  it("split draws two area styles and the labelled a-line", () => {
    const html = render(I3, { ...INT_BASE_GRAPH, area: true }, 5, 0.1, 0.4);
    expect(count(html, "area-left")).toBe(1);
    expect(count(html, "area-right")).toBe(1);
    expect(count(html, "area")).toBe(0);
    expect(count(html, "split-line")).toBe(1);
    expect(html).toMatch(/data-part="split-label"[^>]*>a</);
    expect(count(render(I3, ALL, 5, 0.1, undefined), "split-line")).toBe(0);
  });

  it("samples reach the narrow peak of f_n at n = 40", () => {
    for (const ex of [I1, I2]) {
      const top = Math.max(...integralSamples(ex, INT_MAX_N).map((p) => p.y));
      expect(top).toBeGreaterThan(0.9 * ex.sup(INT_MAX_N));
    }
  });
});

describe("IntegralSequencePlot", () => {
  it("is an LTR island with a legend, no readout and no KaTeX errors", () => {
    for (const ex of [I1, I2, I3]) {
      const html = renderSeq(ex, ALL);
      expect(html).toMatch(/<figure class="convergence-plot integral-sequence-plot" dir="ltr">/);
      expect(html).toMatch(/<svg class="convergence-svg integral-sequence-svg"[^>]* dir="ltr"/);
      expect(html).not.toContain("katex-error");
      expect(html).not.toContain("convergence-readout");
      expect(html).toContain("convergence-legend");
      expect(html).toContain("סדרת האינטגרלים");
    }
  });

  it("draws one dot per n, a reference line, and M_n dots only with the supremum flag", () => {
    const base = renderSeq(I2, INT_BASE_GRAPH);
    expect(count(base, "integral-dot")).toBe(INT_MAX_N);
    expect(count(base, "reference")).toBe(1);
    expect(count(base, "reference-label")).toBe(1);
    expect(count(base, "sup-dot")).toBe(0);
    const withSup = renderSeq(I2, { ...INT_BASE_GRAPH, supremum: true });
    expect(count(withSup, "sup-dot")).toBe(INT_MAX_N);
    expect(withSup.match(/is-current/g)).toHaveLength(2);
    expect(base.match(/is-current/g)).toHaveLength(1);
  });

  it("keeps every point inside the plot area", () => {
    for (const ex of [I1, I2, I3]) {
      const { yMin, yMax } = integralSequenceRange(ex);
      for (let n = 1; n <= INT_MAX_N; n += 1) {
        for (const y of [ex.integral(n), ex.sup(n)]) {
          expect(y).toBeGreaterThanOrEqual(yMin);
          expect(y).toBeLessThanOrEqual(yMax);
        }
      }
    }
    expect(integralSequenceX(1)).toBeLessThan(integralSequenceX(INT_MAX_N));
  });
});
