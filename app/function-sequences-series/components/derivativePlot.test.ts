import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DER_BASE_GRAPH, DER_EXAMPLES, DER_MAX_N, type DerExample, type DerGraphFlags } from "../math/derivativeExamples";
import { DerivativePlot, derivativeSamples } from "./DerivativePlot";

/** Exhaustive sweeps run long under the parallel full suite; give them room. */
const SWEEP_TIMEOUT_MS = 30_000;

const { D1, D2, D3 } = DER_EXAMPLES;
const ALL: DerGraphFlags = { limit: true, band: true, derivative: true, derivLimit: true, derivBand: true };

const render = (ex: DerExample, flags: DerGraphFlags, n = 5, epsilon = 0.1) =>
  renderToStaticMarkup(createElement(DerivativePlot, { example: ex, n, flags, epsilon }));
const count = (html: string, part: string) => (html.match(new RegExp(`data-part="${part}"`, "g")) ?? []).length;

describe("DerivativePlot", () => {
  it("is an LTR island with a legend, no readout and no KaTeX errors", () => {
    for (const ex of [D1, D2, D3]) {
      const html = render(ex, ALL);
      expect(html.match(/<figure class="convergence-plot derivative-plot( derivative-prime-plot)?" dir="ltr">/g)).toHaveLength(2);
      expect(html.match(/<svg class="convergence-svg derivative-svg[^"]*"[^>]* dir="ltr"/g)).toHaveLength(2);
      expect(html).not.toContain("katex-error");
      expect(html).not.toContain("convergence-readout");
      expect(html.match(/convergence-legend/g)).toHaveLength(2);
    }
  });

  it("base flags draw one figure with only the curve", () => {
    const html = render(D1, DER_BASE_GRAPH);
    expect(html.match(/<figure/g)).toHaveLength(1);
    expect(html).not.toContain("derivative-prime-plot");
    for (const part of ["limit", "band", "peak", "limit-open", "limit-point", "deriv-curve"]) expect(count(html, part)).toBe(0);
    expect(count(html, "curve")).toBe(1);
  });

  it("toggles f, its band, the second panel, g and the g band", () => {
    expect(count(render(D1, { ...DER_BASE_GRAPH, limit: true }), "limit")).toBe(1);
    expect(count(render(D1, { ...DER_BASE_GRAPH, band: true }), "band")).toBe(1);
    expect(count(render(D1, { ...DER_BASE_GRAPH, band: true }, 5, 0), "band")).toBe(0);
    const second = render(D1, { ...DER_BASE_GRAPH, derivative: true });
    expect(second).toContain("derivative-prime-plot");
    expect(count(second, "deriv-curve")).toBe(1);
    expect(count(second, "deriv-limit")).toBe(0);
    expect(count(render(D1, { ...DER_BASE_GRAPH, derivative: true, derivLimit: true }), "deriv-limit")).toBe(1);
    expect(count(render(D1, { ...DER_BASE_GRAPH, derivative: true, derivBand: true }), "deriv-band")).toBe(1);
    // Flags of the second panel do nothing while the panel is hidden.
    expect(render(D1, { ...DER_BASE_GRAPH, derivLimit: true, derivBand: true })).not.toContain("derivative-prime-plot");
  });

  it("D2 draws g with an open and a closed dot at x=1, and a band that includes it", () => {
    const html = render(D2, { ...DER_BASE_GRAPH, derivative: true, derivLimit: true, derivBand: true });
    expect(count(html, "deriv-limit-open")).toBe(1);
    expect(count(html, "deriv-limit-point")).toBe(1);
    expect(count(html, "deriv-band")).toBe(2);
    expect(html).toContain('data-kind="closed-dot"');
    const d1 = render(D1, { ...DER_BASE_GRAPH, derivative: true, derivLimit: true });
    expect(count(d1, "deriv-limit-open")).toBe(0);
    expect(d1).not.toContain('data-kind="closed-dot"');
  });

  it("D3 has no limit f, so no limit line or band, and marks the clipped value", () => {
    const html = render(D3, ALL, 20);
    expect(count(html, "limit")).toBe(0);
    expect(count(html, "band")).toBe(0);
    expect(count(html, "peak")).toBe(1);
    expect(html).toMatch(/derivative-peak-label[^>]*>20</);
    expect(html).toContain('data-kind="peak"');
    expect(count(html, "deriv-limit")).toBe(1);
    expect(count(render(D3, ALL, 3), "peak")).toBe(0);
  });

  it("samples end exactly at x = 1", () => {
    for (const ex of [D1, D2]) {
      const pts = derivativeSamples((x) => ex.value(DER_MAX_N, x));
      expect(pts[0].x).toBe(0);
      expect(pts[pts.length - 1].x).toBe(1);
    }
  });

  it("never throws for any n and flag combination", () => {
    const bools = [false, true];
    for (const ex of [D1, D2, D3]) {
      for (let n = 1; n <= DER_MAX_N; n += 1) {
        for (const limit of bools) for (const band of bools) for (const derivative of bools)
          for (const derivLimit of bools) for (const derivBand of bools) {
            const html = render(ex, { limit, band, derivative, derivLimit, derivBand }, n, 0.15);
            expect(html).not.toContain("NaN");
          }
      }
    }
  }, SWEEP_TIMEOUT_MS);
});
