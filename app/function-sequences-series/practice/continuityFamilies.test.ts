import katex from "katex";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SeededRandom, mixSeed } from "../../constant-coefficients-euler/practice/random";
import { checkSlots, checkStep, revealAnswers } from "../math/guidedSteps";
import type { SlotTemplateSpec } from "../math/supremumTypes";
import { PracticePlot, breakDots } from "../components/PracticePlot";
import { CONTINUITY_FAMILIES, type Built, type FamilySpec } from "./continuityFamilies";
import { availableLevels, availableTopics, drawExercise, validateExercise } from "./practiceBank";
import { PRACTICE_FAMILIES } from "./practiceFamilies";
import { PRACTICE_DIFFICULTIES, type PracticeExercise } from "./practiceTypes";
import { checkModel, nounOf, type Model } from "./uniformFamilies";

/** The exhaustive sweeps run long under the parallel full suite; give them room. */
const SWEEP_TIMEOUT_MS = 60_000;

type AnySpec = FamilySpec<unknown>;
const families = CONTINUITY_FAMILIES.map((family) => ({ family, spec: family.spec as unknown as AnySpec }));

/** Every string of an exercise, with a label for failures. */
function textStrings(ex: PracticeExercise): { text: string; where: string }[] {
  const out: { text: string; where: string }[] = [];
  const add = (text: string | undefined, where: string) => { if (text) out.push({ text, where }); };
  add(ex.statement, "statement");
  add(ex.title, "title");
  for (const step of ex.steps) {
    for (const text of [step.title, step.prompt, step.solvedNote, step.minimalProof, ...step.hints]) add(text, step.id);
    for (const part of step.parts) {
      add(part.lead, step.id);
      if (part.kind === "choice") {
        add(part.choice.prompt, step.id);
        for (const o of part.choice.options) { add(o.label, `${step.id} option`); add(o.diagnosis, `${step.id} diagnosis`); }
      }
      if (part.kind === "checklist") for (const i of part.checklist.items) { add(i.label, `${step.id} item`); add(i.diagnosis, `${step.id} item diagnosis`); add(i.unneeded, `${step.id} unneeded`); }
      const templates = part.kind === "slots" ? [part.template] : part.kind === "table" ? part.table.rows.map((r) => r.template) : [];
      for (const t of templates) for (const s of t.slots) for (const d of Object.values(s.diagnoses ?? {})) add(d, `${step.id} slot diagnosis`);
      if (part.kind === "table") for (const c of Object.values(part.captions)) add(c, `${step.id} caption`);
    }
  }
  return out;
}

function templatesOf(ex: PracticeExercise): SlotTemplateSpec[] {
  return ex.steps.flatMap((step) => step.parts.flatMap((part) => (part.kind === "slots" ? [part.template] : part.kind === "table" ? part.table.rows.map((r) => r.template) : [])));
}

/** Every math fragment of an exercise: $...$ inside the text, plus the formula, tokens and template segments. */
function mathStrings(ex: PracticeExercise): { math: string; where: string }[] {
  const out: { math: string; where: string }[] = [];
  for (const { text, where } of textStrings(ex)) for (const [, math] of text.matchAll(/\$([^$]+)\$/g)) out.push({ math, where });
  out.push({ math: ex.formulaLatex, where: "formulaLatex" });
  for (const [id, label] of Object.entries(ex.tokens)) if ("latex" in label) out.push({ math: label.latex, where: `token ${id}` });
  for (const t of templatesOf(ex)) for (const seg of t.segments) if ("latex" in seg) out.push({ math: seg.latex, where: `template ${t.id}` });
  return out;
}

const same = (a: number[], b: number[]) => a.length === b.length
  && a.every((v, i) => v === b[i] || (Number.isFinite(v) && Number.isFinite(b[i]) && Math.abs(v - b[i]) <= 1e-9 * Math.max(1, Math.abs(v), Math.abs(b[i]))));

/** "n" or "x" followed by a numeric factor ("n\,2", "x\tfrac12"): constants must come first. */
const VARIABLE_THEN_CONSTANT = /(?<![A-Za-z])[nx](\^E|\^\{[^{}]*(\{[^{}]*\}[^{}]*)*\})?(\\,)?(\d|\\tfrac|\\frac|\\sqrt)/;
/** A vanishing or unit coefficient: "0n", "0x", "1n", "1x", "+0", "-0". */
const VANISHING = /(^|[^\d.])[01][nx](?![a-z])|[+-]0(?![\d.,])/;

/** The unbounded-limit exercises are meant to grow out of the window; every other plot must fit it. */
const isUnboundedFull = (ex: PracticeExercise, model: Model) => ex.familyId === "cont-unbounded" && !model.uniform;

function checkPlot(ex: PracticeExercise, model: Model, sig: string) {
  const plot = ex.plot!;
  const dom = plot.domain;
  expect(plot.maxN).toBe(40);
  const { view } = plot;
  for (const value of Object.values(view)) expect(Number.isFinite(value), sig).toBe(true);
  expect(view.xMin).toBeLessThan(view.xMax);
  expect(view.yMin).toBeLessThan(view.yMax);
  const lo = Math.max(view.xMin, dom.left);
  const hi = Math.min(view.xMax, dom.right);
  expect(lo, `${sig}: the window must meet the domain`).toBeLessThan(hi);
  const unbounded = isUnboundedFull(ex, model);
  const height = view.yMax - view.yMin;
  const offences: string[] = [];
  for (const n of [1, 2, 5, 10, 40]) {
    const breaks = plot.breaks?.(n) ?? [];
    for (const b of breaks) {
      if (!Number.isFinite(b)) offences.push(`break ${b} is not finite`);
      else if (!(b >= dom.left && b <= dom.right)) offences.push(`break ${b} of n=${n} is outside the domain`);
      else {
        // A break must be a real discontinuity: the dots show a jump or an isolated value.
        if (b > lo && b < hi && breakDots((x) => plot.value(n, x), [b], lo, hi).length === 0) offences.push(`break ${b} of n=${n} is not a discontinuity`);
      }
    }
    let prev: { x: number; y: number } | null = null;
    for (let i = 0; i <= 2000; i += 1) {
      const x = lo + ((hi - lo) * i) / 2000;
      const y = plot.value(n, x);
      if (!Number.isFinite(y)) { offences.push(`f_${n}(${x}) is not finite`); break; }
      if (!unbounded && n !== 10 && (y > view.yMax + 1e-9 || y < view.yMin - 1e-9)) { offences.push(`f_${n}(${x})=${y} is clipped by the window`); break; }
      if (unbounded && n === 1 && (y > view.yMax + 1e-9 || y < view.yMin - 1e-9)) { offences.push(`f_1(${x})=${y} is clipped by the window`); break; }
      // No big jump without a break between the two samples (the very steep, continuous ramps of the unbounded limits aside).
      if (!(unbounded && n > 5) && prev && y <= view.yMax && y >= view.yMin && prev.y <= view.yMax && prev.y >= view.yMin && Math.abs(y - prev.y) > 0.2 * height) {
        if (!breaks.some((b) => b >= prev!.x && b <= x)) offences.push(`f_${n} jumps between ${prev.x} and ${x} without a break`);
      }
      prev = { x, y };
    }
  }
  // The limit: finite (but for an unbounded one at the open end), and its jumps are listed.
  if (plot.limit) {
    let prev: { x: number; y: number } | null = null;
    for (let i = 0; i <= 2000; i += 1) {
      const x = lo + ((hi - lo) * i) / 2000;
      if (i === 0 && !dom.leftClosed && dom.left === lo) continue;
      const y = plot.limit(x);
      if (!Number.isFinite(y)) { offences.push(`limit(${x}) is not finite`); break; }
      if (prev && y <= view.yMax && y >= view.yMin && prev.y <= view.yMax && prev.y >= view.yMin && Math.abs(y - prev.y) > 0.2 * height) {
        if (!(plot.limitBreaks ?? []).some((b) => b >= prev!.x && b <= x)) offences.push(`the limit jumps between ${prev.x} and ${x} without a limit break`);
      }
      prev = { x, y };
    }
  }
  for (const b of plot.limitBreaks ?? []) {
    expect(Number.isFinite(b), sig).toBe(true);
    if (b >= lo && b <= hi && breakDots(plot.limit!, [b], lo, hi).length === 0) offences.push(`limit break ${b} is not a discontinuity`);
  }
  expect(offences, sig).toEqual([]);
  if (unbounded) {
    // The growth shows: for large n the curve leaves the window (the clipped-peak marker takes over).
    let top = 0;
    for (let i = 0; i <= 2000; i += 1) top = Math.max(top, plot.value(40, lo + ((hi - lo) * i) / 2000));
    expect(top, `${sig}: f_40 should leave the window`).toBeGreaterThan(view.yMax);
  }
  for (let n = 1; n <= 40; n += 1) {
    const marker = plot.marker?.(n);
    if (marker !== undefined && marker !== null) expect(Number.isFinite(marker), sig).toBe(true);
    for (const b of plot.breaks?.(n) ?? []) expect(Number.isFinite(b), sig).toBe(true);
  }
  if (plot.marker) expect(plot.markerLabel, sig).toBeTruthy();
  // The card renders it, at the extreme indices too.
  for (const n of [1, 7, 40]) {
    const html = renderToStaticMarkup(createElement(PracticePlot, { spec: plot, n, epsilon: 0.2, showBand: true }));
    expect(html, sig).not.toContain("katex-error");
  }
}

function checkExercise(v: unknown, spec: AnySpec, seed: number): { built: Built; sig: string } {
  const sig = spec.signature(v);
  const built = spec.build(v, new SeededRandom(mixSeed(seed, 5)));
  const ex = built.exercise;
  expect(checkModel(built.model), sig).toEqual([]);
  expect(validateExercise(ex), sig).toEqual([]);
  expect(ex.signature).toBe(sig);
  expect(ex.familyId).toBe(spec.id);
  expect(ex.topic).toBe("continuity");
  expect(ex.difficulty, sig).toBe(spec.difficulty(v));
  expect(ex.steps.length, sig).toBeGreaterThanOrEqual(3);
  expect(ex.steps.length, sig).toBeLessThanOrEqual(5);

  // Every math fragment is valid KaTeX; displayed constants are exact; no TeX leaks into the Hebrew prose.
  for (const { math, where } of mathStrings(ex)) {
    expect(() => katex.renderToString(math, { throwOnError: true, strict: "error" }), `${sig} ${where}: ${math}`).not.toThrow();
    expect(math, `${sig} ${where}`).not.toMatch(/\d\.\d/);
    // Only the display formula (a `cases` environment) has line breaks.
    if (where !== "formulaLatex") expect(math, `${sig} ${where}`).not.toContain("\\\\");
  }
  for (const { text, where } of textStrings(ex)) {
    const prose = text.replace(/\$[^$]+\$/g, "");
    expect(prose, `${sig} ${where}: stray backslash or dollar outside math`).not.toMatch(/[\\$]/);
    expect(text.split("$").length % 2, `${sig} ${where}: unbalanced $`).toBe(1);
    expect(text, `${sig} ${where}`).not.toContain("נקודה קריטית");
    // «ל־משפט», «מ־משפט»: the preposition attaches to the noun without a maqaf.
    expect(text, `${sig} ${where}`).not.toMatch(/[לבמ]־משפט/);
  }

  // Notation of the chips and template lines.
  const chips: string[] = [];
  for (const [, label] of Object.entries(ex.tokens)) if ("latex" in label) chips.push(label.latex);
  const lines: string[] = [];
  for (const t of templatesOf(ex)) for (const seg of t.segments) if ("latex" in seg) lines.push(seg.latex);
  for (const latex of [...chips, ...lines]) {
    let flat = latex;
    for (let i = 0; i < 4; i += 1) flat = flat.replace(/\^\{[^{}]*\}/g, "^E");
    expect(flat, `${sig}: ${latex}`).not.toMatch(VARIABLE_THEN_CONSTANT);
    expect(latex, `${sig}: ${latex}`).not.toMatch(VANISHING);
    // Readability gate: one chip is a single short expression (a template line may be a little longer).
    expect(latex.length, `${sig}: ${latex}`).toBeLessThanOrEqual(chips.includes(latex) ? 100 : 130);
  }

  // The noun of the domain: «קטע» for bounded, «קרן» for rays, «ישר» for the whole line, with agreement.
  const dom = ex.plot!.domain;
  const noun = nounOf(dom);
  expect(ex.statement, sig).toContain(`ב${noun} `);
  const everything = textStrings(ex).map((t) => t.text).join(" ");
  if (noun === "קטע") expect(everything, sig).not.toContain("קרן");
  if (noun === "קרן") expect(everything, sig).not.toContain("קטע");
  if (noun === "ישר") expect(everything, sig).not.toMatch(/קרן|קטע/);

  // Slots: one accepted chip, at least two distinct wrong ones that never pass the checker.
  for (const step of ex.steps) {
    expect(checkStep(step, revealAnswers(step)).status, `${sig} ${step.id}`).toBe("correct");
    expect(step.hints.length, `${sig} ${step.id}`).toBeGreaterThanOrEqual(1);
  }
  for (const t of templatesOf(ex)) {
    const reveal = Object.fromEntries(t.slots.map((o) => [o.id, o.accepted[0]]));
    for (const s of t.slots) {
      expect(s.accepted.length).toBe(1);
      const labels = s.chips.map((c) => JSON.stringify(ex.tokens[c]));
      expect(new Set(labels).size, `${sig} ${s.id}`).toBe(labels.length);
      const wrongChips = s.chips.filter((c) => !s.accepted.includes(c));
      expect(wrongChips.length, `${sig} ${s.id}`).toBeGreaterThanOrEqual(2);
      expect(s.chips.length, `${sig} ${s.id}`).toBeLessThanOrEqual(4);
      for (const w of wrongChips) {
        expect(checkSlots(t, { ...reveal, [s.id]: w }).status, `${sig} ${s.id}`).toBe("wrong");
        expect(s.diagnoses?.[w], `${sig} ${s.id} ${w}: a wrong chip needs a diagnosis`).toBeTruthy();
      }
    }
  }
  // Numeric fingerprints: chips of a slot differ numerically, the accepted chip is the correct one,
  // and a bound slot's wrong chips are false somewhere while its correct chip holds everywhere.
  for (const [slotId, records] of Object.entries(built.book.slots)) {
    expect(records.filter((r) => r.correct).length, `${sig} ${slotId}`).toBe(1);
    for (let i = 0; i < records.length; i += 1) for (let j = i + 1; j < records.length; j += 1) {
      expect(same(records[i].sig, records[j].sig), `${sig} ${slotId}: ${records[i].latex} vs ${records[j].latex}`).toBe(false);
      expect(records[i].latex, `${sig} ${slotId}`).not.toBe(records[j].latex);
    }
    const bound = built.book.bounds[slotId];
    if (bound) for (const r of records) {
      const holds = r.sig.every((val, k) => val >= bound[k] - 1e-12);
      expect(holds, `${sig} ${slotId}: ${r.latex} should ${r.correct ? "hold" : "fail"} as a bound`).toBe(r.correct);
    }
  }
  // Choices and checklists.
  for (const step of ex.steps) for (const part of step.parts) {
    if (part.kind === "choice") {
      const ids = part.choice.options.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(part.choice.options.map((o) => o.label)).size, sig).toBe(ids.length);
      expect(part.choice.options.length, sig).toBeGreaterThanOrEqual(3);
      for (const o of part.choice.options) if (!o.correct) expect(o.diagnosis, `${sig} ${o.id}`).toBeTruthy();
    }
    if (part.kind === "checklist") {
      const items = part.checklist.items;
      expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
      expect(items.filter((i) => i.required).length, sig).toBeGreaterThanOrEqual(2);
      expect(items.filter((i) => !i.required && !i.optional).length, sig).toBeGreaterThanOrEqual(2);
      for (const i of items) {
        if (!i.required && !i.optional) expect(i.diagnosis, `${sig} ${i.id}`).toBeTruthy();
        if (i.optional) {
          expect(i.unneeded, `${sig} ${i.id}`).toBeTruthy();
          expect(i.label, `${sig} ${i.id}: an optional label is followed by a comma`).not.toMatch(/[.,]$/);
        }
      }
    }
  }
  // The concluding step carries a minimal proof and its correct option agrees with the model's verdict.
  const last = ex.steps[ex.steps.length - 1];
  expect(last.minimalProof, sig).toBeTruthy();
  const lastPart = last.parts[0];
  if (lastPart.kind !== "choice") throw new Error("the last step is a choice");
  expect(lastPart.choice.options.find((o) => o.correct)!.id, sig).toBe(built.model.uniform ? "uniform" : "not-uniform");

  checkPlot(ex, built.model, sig);
  return { built, sig };
}

const grids = families.map(({ spec }) => spec.grid());
/** Sizes of the grids, family by family (see docs/question-families/continuity-practice.md). */
const GRID_SIZES: Record<string, number> = {
  "cont-unbounded": 29, "cont-ramp": 39, "cont-moving-peak": 30, "cont-floor": 14, "cont-indicator": 24,
};
const TOTAL_INSTANCES = Object.values(GRID_SIZES).reduce((a, b) => a + b, 0);

describe("continuity families: the whole grid of every family", () => {
  it("registers five families of the topic in the practice bank, next to the demo family", () => {
    expect(CONTINUITY_FAMILIES.length).toBe(5);
    for (const family of CONTINUITY_FAMILIES) expect(PRACTICE_FAMILIES).toContain(family);
    expect(new Set(CONTINUITY_FAMILIES.map((f) => f.id)).size).toBe(5);
    expect(PRACTICE_FAMILIES.some((f) => f.id === "jumping-limit" && f.topic === "continuity")).toBe(true);
    expect(availableTopics()).toContain("continuity");
    expect(availableLevels("continuity")).toEqual(["easy", "medium", "advanced"]);
  });

  families.forEach(({ family, spec }, index) => {
    it(`${family.id}: every instance passes the numeric self-check, validation, KaTeX, distractor and plot checks`, () => {
      const grid = grids[index];
      const sigs = new Set(grid.map((v) => spec.signature(v)));
      expect(sigs.size).toBe(grid.length);
      expect(grid.length).toBeGreaterThanOrEqual(4);
      const verdicts = new Set<boolean>();
      const levels = new Set<string>();
      let count = 0;
      for (const v of grid) {
        const { built } = checkExercise(v, spec, count + 1);
        verdicts.add(built.model.uniform);
        levels.add(spec.difficulty(v));
        count += 1;
      }
      // Both verdicts occur in every family.
      expect(verdicts, family.id).toEqual(new Set([true, false]));
      expect([...levels].sort(), family.id).toEqual([...family.difficulties].sort());
      expect(count).toBe(grid.length);
    }, SWEEP_TIMEOUT_MS);
  });

  it("covers the required families and the course owner's mix", () => {
    expect(CONTINUITY_FAMILIES.map((f) => f.id)).toEqual(["cont-unbounded", "cont-ramp", "cont-moving-peak", "cont-floor", "cont-indicator"]);
    families.forEach(({ family }, i) => expect(grids[i].length, family.id).toBe(GRID_SIZES[family.id]));
    const total = grids.reduce((sum, g) => sum + g.length, 0);
    expect(total).toBe(TOTAL_INSTANCES);
  });

  it("only about two small families have discontinuous f_n", () => {
    const discontinuous = CONTINUITY_FAMILIES.filter((f) => ["cont-floor", "cont-indicator"].includes(f.id));
    expect(discontinuous.length).toBe(2);
    const smallest = Math.max(...discontinuous.map((f) => (f.spec as unknown as AnySpec).grid().length));
    expect(smallest).toBeLessThanOrEqual(30);
  });
});

describe("continuity families: draws honour the level and stay valid", () => {
  it("every family produces each level it declares, validated, with several distinct instances", () => {
    for (const { family, spec } of families) for (const level of family.difficulties) {
      const sigs = new Set<string>();
      for (let seed = 1; seed <= 24; seed += 1) {
        const ex = family.generate(new SeededRandom(mixSeed(seed, 61)), level);
        expect(validateExercise(ex), `${family.id} ${ex.signature}`).toEqual([]);
        expect(ex.difficulty, `${family.id} ${ex.signature}`).toBe(level);
        expect(ex.familyId).toBe(family.id);
        sigs.add(ex.signature);
      }
      const available = spec.grid().filter((v) => spec.difficulty(v) === level).length;
      expect(sigs.size, `${family.id} ${level}`).toBeGreaterThanOrEqual(Math.min(2, available));
    }
  }, SWEEP_TIMEOUT_MS);

  it("every level of every family has at least two distinct instances, so the exercise on screen can always be avoided", () => {
    for (const { family, spec } of families) for (const level of family.difficulties) {
      const count = spec.grid().filter((v) => spec.difficulty(v) === level).length;
      expect(count, `${family.id} ${level}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("random draws without a level pass the self-check and never need the fallback", () => {
    for (const { family, spec } of families) for (let seed = 1; seed <= 40; seed += 1) {
      const rng = new SeededRandom(mixSeed(seed, 77));
      const ex = family.generate(rng);
      expect(validateExercise(ex), `${family.id} ${ex.signature}`).toEqual([]);
      expect(spec.grid().map((v) => spec.signature(v))).toContain(ex.signature);
    }
  }, SWEEP_TIMEOUT_MS);

  it("drawExercise('continuity') serves every family, both verdicts and every level, reproducibly", () => {
    const seen = new Set<string>();
    const verdicts = new Set<string>();
    for (let seed = 1; seed <= 800; seed += 1) {
      const ex = drawExercise("continuity", mixSeed(seed, 41))!;
      expect(ex).not.toBeNull();
      expect(ex.topic).toBe("continuity");
      seen.add(ex.familyId);
      const last = ex.steps[ex.steps.length - 1].parts[0];
      if (ex.familyId.startsWith("cont-") && last.kind === "choice") verdicts.add(last.choice.options.find((o) => o.correct)!.id);
    }
    for (const family of CONTINUITY_FAMILIES) expect(seen.has(family.id), family.id).toBe(true);
    expect(seen.has("jumping-limit")).toBe(true);
    expect(verdicts).toEqual(new Set(["uniform", "not-uniform"]));
    for (const level of PRACTICE_DIFFICULTIES) for (let seed = 1; seed <= 30; seed += 1) {
      expect(drawExercise("continuity", mixSeed(seed, 43), undefined, undefined, level)?.difficulty).toBe(level);
    }
    // The graph spec holds functions, so compare everything else.
    const strip = (ex: ReturnType<typeof drawExercise>) => ex && { ...ex, plot: undefined };
    expect(strip(drawExercise("continuity", 12345))).toEqual(strip(drawExercise("continuity", 12345)));
    // The exercise on screen is avoided when another instance exists.
    const first = drawExercise("continuity", 7)!;
    for (let seed = 1; seed <= 30; seed += 1) expect(drawExercise("continuity", seed, first.signature)?.signature).not.toBe(first.signature);
  }, SWEEP_TIMEOUT_MS);
});

describe("continuity families: the numeric self-check really detects wrong claims", () => {
  const model = (id: string, signaturePart: string): Model => {
    const { spec } = families.find(({ family }) => family.id === id)!;
    const v = spec.grid().find((g) => spec.signature(g).includes(signaturePart))!;
    return spec.build(v, new SeededRandom(1)).model;
  };

  it("accepts the true models and rejects a wrong verdict, supremum, gap, limit or witness", () => {
    const ramp = model("cont-ramp", "one;through;h=2;a=0;I=-1..1");
    expect(checkModel(ramp)).toEqual([]);
    expect(checkModel({ ...ramp, uniform: true }).length).toBeGreaterThan(0);
    expect(checkModel({ ...ramp, sup: () => 1 }).length).toBeGreaterThan(0);
    expect(checkModel({ ...ramp, gap: 5 }).length).toBeGreaterThan(0);
    expect(checkModel({ ...ramp, limit: () => 0 }).length).toBeGreaterThan(0);
    const far = model("cont-ramp", "one;far;h=1;a=0;I=1/2..2");
    expect(checkModel(far)).toEqual([]);
    expect(checkModel({ ...far, uniform: false, gap: 0.5 }).length).toBeGreaterThan(0);
    const unbounded = model("cont-unbounded", "cap;inv;C1");
    expect(checkModel(unbounded)).toEqual([]);
    expect(checkModel({ ...unbounded, uniform: true }).length).toBeGreaterThan(0);
    expect(checkModel({ ...unbounded, witness: { x: (n: number) => 1 / n, diff: (n: number) => n } }).length).toBeGreaterThan(0);
    const peak = model("cont-moving-peak", "tent;g=one;h=3;I1");
    expect(checkModel(peak)).toEqual([]);
    expect(checkModel({ ...peak, sup: (n: number) => 2 / n }).length).toBeGreaterThan(0);
    expect(checkModel({ ...peak, uniform: true }).length).toBeGreaterThan(0);
    const floor = model("cont-floor", "lin;c=2;half");
    expect(checkModel(floor)).toEqual([]);
    expect(checkModel({ ...floor, sup: (n: number) => 1.05 * floor.sup!(n) }).length).toBeGreaterThan(0);
    const spike = model("cont-indicator", "point;g=one;h=2;closed2");
    expect(checkModel(spike)).toEqual([]);
    expect(checkModel({ ...spike, uniform: true }).length).toBeGreaterThan(0);
    expect(checkModel({ ...spike, witness: { x: (n: number) => 1 / (2 * n), diff: () => 2 } }).length).toBeGreaterThan(0);
  });

  it("checks the claimed values of the headline examples", () => {
    // (n+1)^2 x on [0,1/(n+1)], 1/x after it: continuous at the joint, height n+1, the limit 1/x.
    const guided = model("cont-unbounded", "ramp;p=1;s=1;I1");
    const n = 6;
    expect(guided.value(n, 1 / (n + 1))).toBeCloseTo(n + 1, 12);
    expect(guided.value(n, 1 / (n + 1) - 1e-9)).toBeCloseTo(n + 1, 6);
    expect(guided.value(n, 1 / (n + 1) + 1e-9)).toBeCloseTo(n + 1, 6);
    expect(guided.limit(0)).toBe(0);
    expect(guided.limit(0.25)).toBe(4);
    // min{n, ln(1/x)}: the joint e^{-n}; at x_n = e^{-2n} the difference is n.
    const ln = model("cont-unbounded", "cap;ln;C1");
    expect(ln.value(5, Math.exp(-5))).toBeCloseTo(5, 12);
    expect(ln.limit(Math.exp(-10)) - ln.value(5, Math.exp(-10))).toBeCloseTo(5, 10);
    // The ramp: the middle of the ramp is at half height, the gap h/2.
    const ramp = model("cont-ramp", "one;through;h=3;a=1/2;I=0..1");
    expect(ramp.value(8, 0.5 + 1 / 16)).toBeCloseTo(1.5, 12);
    expect(ramp.limit(0.75)).toBe(3);
    expect(ramp.limit(0.5)).toBe(0);
    // The two-sided ramp passes through 0 at 0 and stays between -h and h.
    const two = model("cont-ramp", "two;through;h=2");
    expect(two.value(4, 0)).toBe(0);
    expect(two.value(4, -0.3)).toBe(-2);
    expect(two.limit(-0.5)).toBe(-2);
    // The tent: height h at 1/n, zero at 2/n; the bump 2nx/(1+n^2x^2) peaks at 1/n with height 1.
    const tent = model("cont-moving-peak", "tent;g=one;h=2;I1");
    expect(tent.value(10, 0.1)).toBeCloseTo(2, 12);
    expect(tent.value(10, 0.2)).toBeCloseTo(0, 12);
    const bump = model("cont-moving-peak", "bump;g=one;h=1;I1");
    expect(bump.value(7, 1 / 7)).toBeCloseTo(1, 12);
    const decay = model("cont-moving-peak", "bump;g=invsqrt;h=2;I1");
    expect(decay.sup!(100)).toBeCloseTo(0.2, 12);
    const away = model("cont-moving-peak", "bump;g=one;h=3;farHalf");
    expect(away.sup!(10)).toBeCloseTo((4 * 3 * 10) / (4 + 100), 12);
    // c floor(nx)/n: at most c/n below c x; and c floor(nx)/n^2 reaches c at x = n.
    const lin = model("cont-floor", "lin;c=1;closed");
    expect(lin.value(5, 0.39)).toBeCloseTo(0.2, 12);
    expect(lin.limit(0.39)).toBeCloseTo(0.39, 12);
    const quad = model("cont-floor", "quad;c=2;ray");
    expect(quad.value(9, 9)).toBeCloseTo(2, 12);
    // Indicators.
    const ind = model("cont-indicator", "interval;g=one;h=2;closed1");
    expect(ind.value(4, 0.25)).toBe(2);
    expect(ind.value(4, 0.26)).toBe(0);
    expect(ind.limit(0)).toBe(2);
    expect(ind.limit(0.1)).toBe(0);
    const point = model("cont-indicator", "point;g=invn;h=2;closed1");
    expect(point.value(4, 0.25)).toBe(0.5);
    expect(point.value(4, 0.5)).toBe(0);
  });
});

describe("continuity families: displayed fractions are reduced", () => {
  const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
  it("no \\frac{p}{q} with integers p, q has a common factor, and no integer over (integer * n^k) is reducible", () => {
    for (const [index, { spec }] of families.entries()) for (const v of grids[index]) {
      const built = spec.build(v, new SeededRandom(3));
      const sig = spec.signature(v);
      const all = [...textStrings(built.exercise).flatMap(({ text }) => [...text.matchAll(/\$([^$]+)\$/g)].map((m) => m[1])), ...mathStrings(built.exercise).map((m) => m.math)];
      for (const math of all) {
        for (const [, p, q] of math.matchAll(/\\[dt]?frac\{(\d+)\}\{(\d+)\}/g)) expect(gcd(Number(p), Number(q)), `${sig}: ${math}`).toBe(1);
        for (const [, p, q] of math.matchAll(/\\[dt]?frac\{(\d+)\}\{(\d+)n(?:\^\{?\d+\}?)?\}/g)) expect(gcd(Number(p), Number(q)), `${sig}: ${math}`).toBe(1);
        expect(math, sig).not.toMatch(/\\[dt]?frac\{[^{}]*\}\{1\}/);
      }
    }
  });
});

describe("continuity families: the Hebrew copy keeps to the glossary", () => {
  it("names the theorems «משפט הרציפות» and «משפט לגרנז'», and uses plural imperatives", () => {
    const corpus = new Set<string>();
    for (const [index, { spec }] of families.entries()) for (const v of grids[index]) {
      const built = spec.build(v, new SeededRandom(3));
      for (const { text } of textStrings(built.exercise)) corpus.add(text);
    }
    const all = [...corpus].join("\n");
    expect(all).toContain("משפט הרציפות");
    expect(all).toContain("משפט לגרנז'");
    // Singular imperatives («בדוק», «חשב», «סמן») never appear.
    expect(all).not.toMatch(/(^|[\s"(])(בדוק|חשב|סמן|מצא|כתוב)(?![א-ת])/);
    expect(all).not.toContain("מתכנסת במידה שווה לא");
  }, SWEEP_TIMEOUT_MS);
});
