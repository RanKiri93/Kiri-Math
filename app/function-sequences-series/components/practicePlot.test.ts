import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PracticePlotSpec } from "../practice/practiceTypes";
import { BREAK_DOT_MAX, PracticePlot, breakDots, practiceSampleXs, splitSamples } from "./PracticePlot";

const bump: PracticePlotSpec = {
  value: (n, x) => n * x * Math.exp(-n * x),
  limit: () => 0,
  domain: { left: 0, right: Infinity, leftClosed: true, rightClosed: false },
  view: { xMin: 0, xMax: 4, yMin: -0.2, yMax: 1.2 },
  maxN: 40,
  marker: (n) => 1 / n,
  markerLabel: "הנקודה החשודה לקיצון",
};
const closed13: PracticePlotSpec = {
  value: (n, x) => x ** n / (1 + x ** n),
  limit: null,
  domain: { left: 1, right: 3, leftClosed: true, rightClosed: false },
  view: { xMin: 0, xMax: 4, yMin: 0, yMax: 1.2 },
  maxN: 20,
};
const clipped: PracticePlotSpec = {
  value: (n, x) => n * x,
  limit: (x) => x,
  domain: { left: 0, right: 1, leftClosed: true, rightClosed: true },
  view: { xMin: -0.5, xMax: 1.5, yMin: -0.5, yMax: 2 },
  maxN: 40,
};

const render = (spec: PracticePlotSpec, n = 5, showBand = true, epsilon = 0.2) =>
  renderToStaticMarkup(createElement(PracticePlot, { spec, n, epsilon, showBand }));
const count = (html: string, part: string) => (html.match(new RegExp(`data-part="${part}"`, "g")) ?? []).length;

function curveYs(html: string): number[] {
  const d = /data-part="curve" d="([^"]+)"/.exec(html)?.[1] ?? "";
  return [...d.matchAll(/[ML][\d.-]+,([\d.-]+)/g)].map((m) => Number(m[1]));
}

describe("PracticePlot", () => {
  it("is an LTR island with no readout and no KaTeX errors", () => {
    for (const spec of [bump, closed13, clipped]) {
      const html = render(spec);
      expect(html).toMatch(/<figure class="convergence-plot practice-plot" dir="ltr">/);
      expect(html).toMatch(/<svg class="convergence-svg practice-svg"[^>]* dir="ltr"/);
      expect(html).not.toContain("katex-error");
      expect(html).not.toContain("convergence-readout");
      expect(html).toContain("convergence-legend");
    }
  });

  it("toggles band, limit and marker", () => {
    expect(count(render(bump, 5, true), "band")).toBe(1);
    expect(count(render(bump, 5, false), "band")).toBe(0);
    expect(count(render(bump), "limit")).toBe(1);
    expect(count(render(closed13), "limit")).toBe(0);
    expect(count(render(closed13), "band")).toBe(0);
    expect(count(render(bump), "marker")).toBe(1);
    expect(render(bump)).toContain("הנקודה החשודה לקיצון");
    expect(count(render(closed13), "marker")).toBe(0);
    expect(count(render({ ...bump, marker: () => 9 }), "marker")).toBe(0);
  });

  it("clips values above the window and labels the true maximum", () => {
    const html = render(clipped, 30);
    expect(count(html, "peak")).toBe(1);
    expect(html).toContain(">30<");
    expect(count(render(clipped, 1), "peak")).toBe(0);
  });

  it("draws a narrow peak near zero to within 2% of its height", () => {
    const html = render(bump, 40);
    const top = Math.min(...curveYs(html));
    const inner = 260 - 12 - 30;
    const perUnit = inner / 1.4;
    const y0 = 12 + 1.2 * perUnit; // pixel row of y = 0
    const height = (y0 - top) / perUnit;
    expect(Math.abs(height - 1 / Math.E) / (1 / Math.E)).toBeLessThan(0.02);
  });

  it("draws endpoint dots and boundaries only for endpoints inside the view", () => {
    const a = render(closed13);
    expect(count(a, "dot")).toBe(2);
    expect(count(a, "boundary")).toBe(2);
    expect(count(a, "outside")).toBe(2);
    expect(a).toContain("convergence-endpoint-closed");
    expect(a).toContain("convergence-endpoint-open");
    const b = render({ ...closed13, domain: { left: 1, right: Infinity, leftClosed: true, rightClosed: false } });
    expect(count(b, "dot")).toBe(1);
    expect(count(b, "boundary")).toBe(1);
    expect(count(b, "outside")).toBe(1);
  });

  it("samples end exactly at the right end and stay inside", () => {
    const xs = practiceSampleXs(0.1, 0.7);
    expect(xs[0]).toBe(0.1);
    expect(xs[xs.length - 1]).toBe(0.7);
    expect(xs.every((x, i) => x <= 0.7 && (i === 0 || x > xs[i - 1]))).toBe(true);
    expect(practiceSampleXs(1, 1)).toEqual([]);
  });

  it("never throws over n = 1..40", () => {
    const strict: PracticePlotSpec = {
      ...closed13,
      value: (n, x) => {
        if (x < 1 || x > 3) throw new Error("outside domain");
        return Math.sin(n * x);
      },
    };
    for (const spec of [bump, closed13, clipped, strict]) {
      for (let n = 1; n <= 40; n += 1) expect(() => render(spec, n)).not.toThrow();
    }
  });
});

/** A Heaviside-type ramp: 0 up to a = 0.5, a linear rise over [a, a + 1/n], then 1; f(a) = 0 and f jumps there. */
const ramp: PracticePlotSpec = {
  value: (n, x) => Math.min(1, Math.max(0, n * (x - 0.5))),
  limit: (x) => (x > 0.5 ? 1 : 0),
  domain: { left: 0, right: 1, leftClosed: true, rightClosed: true },
  view: { xMin: -0.1, xMax: 1.1, yMin: -0.1, yMax: 1.2 },
  maxN: 40,
  limitBreaks: [0.5],
};
/** An indicator: 1 on [0, 1/n], 0 elsewhere; f_n jumps at 1/n. */
const indicator: PracticePlotSpec = {
  value: (n, x) => (x <= 1 / n ? 1 : 0),
  limit: (x) => (x === 0 ? 1 : 0),
  domain: { left: 0, right: 1, leftClosed: true, rightClosed: true },
  view: { xMin: -0.1, xMax: 1.1, yMin: -0.1, yMax: 1.2 },
  maxN: 40,
  breaks: (n) => [1 / n],
  limitBreaks: [],
};
const pieces = (html: string, part: string) => {
  const d = new RegExp(`data-part="${part}" d="([^"]+)"`).exec(html)?.[1] ?? "";
  return d.split("M").filter(Boolean).length;
};

describe("PracticePlot: breaks", () => {
  it("keeps the old drawing when no break is given", () => {
    for (const spec of [bump, closed13, clipped]) {
      const html = render(spec);
      expect(pieces(html, "curve")).toBe(1);
      expect(count(html, "break-dot")).toBe(0);
      expect(count(html, "limit-dot")).toBe(0);
    }
  });

  it("splits the samples at interior breaks and never samples a break itself", () => {
    const xs = practiceSampleXs(0, 1);
    expect(splitSamples(xs, [], 0, 1)).toEqual([xs]);
    expect(splitSamples(xs, [7, -1, Number.NaN], 0, 1)).toEqual([xs]);
    // a break at an end only trims that end: the isolated value there is drawn as a dot
    const trimmed = splitSamples(xs, [0], 0, 1);
    expect(trimmed.length).toBe(1);
    expect(trimmed[0][0]).toBeGreaterThan(0);
    expect(trimmed[0][trimmed[0].length - 1]).toBe(1);
    const both = splitSamples(xs, [0, 1], 0, 1);
    expect(both[0][0]).toBeGreaterThan(0);
    expect(both[0][both[0].length - 1]).toBeLessThan(1);
    const parts = splitSamples(xs, [0.5], 0, 1);
    expect(parts.length).toBe(2);
    expect(parts[0][0]).toBe(0);
    expect(parts[1][parts[1].length - 1]).toBe(1);
    for (const part of parts) for (let i = 1; i < part.length; i += 1) expect(part[i]).toBeGreaterThan(part[i - 1]);
    expect(parts[0][parts[0].length - 1]).toBeLessThan(0.5);
    expect(parts[1][0]).toBeGreaterThan(0.5);
    expect(splitSamples(xs, [0.25, 0.5, 0.5], 0, 1).length).toBe(3);
  });

  it("draws one piece per side of a jump, so nothing is connected across it", () => {
    const html = render(indicator, 4);
    expect(pieces(html, "curve")).toBe(2);
    const ys = curveYs(html);
    // The two levels only: the polyline never passes through intermediate heights.
    expect(new Set(ys.map((y) => Math.round(y))).size).toBe(2);
    expect(pieces(render(ramp, 5), "limit")).toBe(2);
  });

  it("marks one-sided limits with closed and open dots, and none at a continuous point", () => {
    const dots = breakDots((x) => (x <= 0.25 ? 1 : 0), [0.25], 0, 1);
    expect(dots.map((d) => [d.x, Math.round(d.y), d.closed])).toEqual([[0.25, 1, true], [0.25, 0, false]]);
    expect(breakDots((x) => x, [0.5], 0, 1)).toEqual([]);
    // an isolated value: both limits are open, the value itself is a closed dot
    const isolated = breakDots((x) => (x === 0.5 ? 3 : 0), [0.5], 0, 1);
    expect(isolated.length).toBe(2);
    expect(isolated.some((d) => d.closed && d.y === 3)).toBe(true);
    expect(breakDots((x) => (x < 0.5 ? 0 : 1), [0, 1], 0, 1)).toEqual([]);
    // an isolated value at an end: the limit from inside is an open dot, the value a closed one
    const atEnd = breakDots((x) => (x === 0 ? 5 : 1), [0], 0, 1);
    expect(atEnd.map((d) => [d.x, Math.round(d.y), d.closed])).toEqual([[0, 1, false], [0, 5, true]]);
    const atRightEnd = breakDots((x) => (x === 1 ? 5 : 1), [1], 0, 1);
    expect(atRightEnd.map((d) => [d.x, Math.round(d.y), d.closed])).toEqual([[1, 1, false], [1, 5, true]]);
    expect(breakDots((x) => (x === 0 ? 1 : 1), [0], 0, 1)).toEqual([]);
    const html = render(indicator, 4);
    expect(count(html, "break-dot")).toBe(2);
    expect(html).toContain("convergence-endpoint-open");
    expect(count(render(ramp, 5), "limit-dot")).toBe(2);
    expect(count(render(ramp, 5), "break-dot")).toBe(0);
  });

  it("splits the epsilon band at a jump of the limit and survives n = 1..40", () => {
    const html = render(ramp, 5, true, 0.1);
    expect(/data-part="band" d="([^"]+)"/.exec(html)?.[1].split("M").filter(Boolean).length).toBe(2);
    for (const spec of [ramp, indicator]) for (let n = 1; n <= 40; n += 1) expect(() => render(spec, n)).not.toThrow();
  });
});

describe("PracticePlot: a fine staircase", () => {
  const stairs: PracticePlotSpec = {
    value: (n, x) => Math.floor(n * x) / n,
    limit: (x) => x,
    domain: { left: 0, right: 1, leftClosed: true, rightClosed: true },
    view: { xMin: -0.1, xMax: 1.1, yMin: -0.1, yMax: 1.2 },
    maxN: 40,
    breaks: (n) => Array.from({ length: n - 1 }, (_, k) => (k + 1) / n),
  };
  it("splits at every jump, with dots only up to the dot limit", () => {
    const few = render(stairs, 5);
    expect(pieces(few, "curve")).toBe(5);
    expect(count(few, "break-dot")).toBe(8);
    const many = render(stairs, 40);
    expect(pieces(many, "curve")).toBe(40);
    expect(count(many, "break-dot")).toBe(0);
    expect(BREAK_DOT_MAX).toBe(24);
  });
});
