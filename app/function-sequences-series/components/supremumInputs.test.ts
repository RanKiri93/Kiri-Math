import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CandidateTableSpec, ChecklistSpec, ChoiceSpec, SlotTemplateSpec, Token } from "../math/supremumTypes";
import { CandidateTable } from "./CandidateTable";
import { MathInlineText } from "./MathInlineText";
import { ReasonChecklist } from "./ReasonChecklist";
import { SlotTemplate } from "./SlotTemplate";
import { SpecChoice } from "./SpecChoice";

const tokens: Record<string, Token> = {
  zero: { id: "zero", label: { latex: "0" } },
  inv: { id: "inv", label: { latex: "\\frac1e" } },
  n: { id: "n", label: { latex: "n" } },
  dec: { id: "dec", label: { text: "יורדת" } },
};

const template: SlotTemplateSpec = {
  id: "t",
  segments: [{ latex: "f_n'(x)=ne^{-nx}(1-" }, { slot: "a" }, { latex: "x)\\ \\text{ו־}\\ " }, { slot: "b" }],
  slots: [
    { id: "a", chips: ["n", "zero", "inv"], accepted: ["n"] },
    { id: "b", chips: ["dec", "zero"], accepted: ["dec"] },
  ],
};

const table: CandidateTableSpec = {
  id: "c",
  rows: [
    { id: "r0", isMaximum: false, template: { id: "r0t", segments: [{ latex: "f_n(0)=" }, { slot: "v" }], slots: [{ id: "v", chips: ["zero", "inv"], accepted: ["zero"] }] } },
    { id: "r1", isMaximum: true, template: { id: "r1t", segments: [{ latex: "f_n(1/n)=" }, { slot: "v" }], slots: [{ id: "v", chips: ["zero", "inv"], accepted: ["inv"] }] } },
  ],
};

const checklist: ChecklistSpec = {
  id: "k",
  items: [
    { id: "cont", label: "הפונקציה $f_n$ רציפה בקטע.", required: true },
    { id: "lim", label: "מתקיים $\\lim_{x\\to\\infty}f_n(x)=0$.", required: true },
  ],
};

const choice: ChoiceSpec = {
  id: "ch",
  prompt: "מדוע $M_n\\not\\to 0$?",
  options: [
    { id: "a", label: "כי $M_n=\\frac1e$ לכל $n$.", correct: true },
    { id: "b", label: "כי $f_n(x)\\to0$.", correct: false },
  ],
};

const noop = () => {};

describe("supremum input components", () => {
  it("renders the slot template formula line as an LTR island with empty slots as ?", () => {
    const html = renderToStaticMarkup(createElement(SlotTemplate, { spec: template, tokens, filling: {}, onChange: noop }));
    expect(html).toMatch(/class="supremum-formula" dir="ltr"/);
    expect(html.match(/class="supremum-slot[^"]*"[^>]*>\?<\/button>/g)).toHaveLength(2);
    expect(html).not.toContain("katex-error");
  });

  it("shows the chosen chip in a filled slot and flags the wrong slot", () => {
    const html = renderToStaticMarkup(createElement(SlotTemplate, {
      spec: template, tokens, filling: { a: "inv", b: "dec" }, wrongSlotId: "a", onChange: noop,
    }));
    expect(html).toMatch(/class="supremum-slot is-filled[^"]*is-wrong"/);
    expect(html.match(/is-wrong/g)).toHaveLength(1);
    expect(html).toContain("יורדת");
    expect(html).not.toMatch(/>\?<\/button>/);
    expect(html).not.toContain("katex-error");
  });

  it("offers the active slot's chips as a radio group with an accessible name", () => {
    const html = renderToStaticMarkup(createElement(SlotTemplate, { spec: template, tokens, filling: { a: "n" }, onChange: noop }));
    expect(html).toMatch(/role="radiogroup"[^>]*aria-label="בחירת ערך למשבצת 2"/);
    expect(html.match(/role="radio"/g)).toHaveLength(2);
    expect(html).toContain('aria-checked="false"');
  });

  it("hides the palette when disabled", () => {
    const html = renderToStaticMarkup(createElement(SlotTemplate, { spec: template, tokens, filling: {}, onChange: noop, disabled: true }));
    expect(html).not.toContain("radiogroup");
  });

  it("renders candidate rows as LTR islands with one shared maximum radio group", () => {
    const html = renderToStaticMarkup(createElement(CandidateTable, {
      spec: table, tokens, filling: { rows: { r0: { v: "zero" } }, maximumRowId: "r1" }, wrongRowId: "r1", wrongSlotId: "v", onChange: noop,
    }));
    expect(html.match(/class="supremum-formula" dir="ltr"/g)).toHaveLength(2);
    const radios = html.match(/<input type="radio"[^>]*>/g) ?? [];
    expect(radios).toHaveLength(2);
    const names = radios.map((tag) => /name="([^"]*)"/.exec(tag)?.[1]);
    expect(new Set(names).size).toBe(1);
    expect(html.match(/זה המקסימום/g)).toHaveLength(2);
    expect(html).toContain("supremum-row is-wrong is-max");
    expect(html).toMatch(/class="supremum-slot[^"]*is-wrong"/);
    expect(html).not.toContain("katex-error");
  });

  it("renders checklist labels with inline math and marks the wrong item", () => {
    const html = renderToStaticMarkup(createElement(ReasonChecklist, { spec: checklist, selected: ["cont"], wrongItemId: "lim", onChange: noop }));
    expect(html.match(/type="checkbox"/g)).toHaveLength(2);
    expect(html).toContain('class="katex"');
    expect(html).toContain("הפונקציה");
    expect(html).toContain("convergence-choice is-wrong");
    expect(html).not.toContain("katex-error");
  });

  it("renders spec choice prompt and options with inline math", () => {
    const html = renderToStaticMarkup(createElement(SpecChoice, { spec: choice, value: "a", wrongOptionId: "b", onChange: noop }));
    expect(html.match(/type="radio"/g)).toHaveLength(2);
    expect(html).toContain("convergence-choice is-selected");
    expect(html).toContain("convergence-choice is-wrong");
    expect(html.match(/class="katex"/g)!.length).toBeGreaterThanOrEqual(4);
    expect(html).not.toContain("katex-error");
  });

  it("keeps Hebrew outside math and wraps each $...$ segment as an LTR island", () => {
    const html = renderToStaticMarkup(createElement(MathInlineText, { text: "אז $x_n=\\frac1n$ בקטע." }));
    expect(html).toContain("<span>אז </span>");
    expect(html).toContain("<span> בקטע.</span>");
    expect(html).toMatch(/dir="ltr"/);
    expect(html).not.toContain("katex-error");
  });
});
