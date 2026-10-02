import katex from "katex";
import { describe, expect, it } from "vitest";
import { SeededRandom, mixSeed } from "../../constant-coefficients-euler/practice/random";
import { checkSlots, checkStep, revealAnswers } from "../math/guidedSteps";
import type { SlotTemplateSpec } from "../math/supremumTypes";
import { availableLevels, availableTopics, drawExercise, validateExercise } from "./practiceBank";
import { PRACTICE_FAMILIES } from "./practiceFamilies";
import { PRACTICE_DIFFICULTIES, type PracticeExercise } from "./practiceTypes";
import { UNIFORM_FAMILIES, checkModel, nounOf, type Built, type FamilySpec, type Model } from "./uniformFamilies";

/** The exhaustive sweeps run long under the parallel full suite; give them room. */
const SWEEP_TIMEOUT_MS = 60_000;

type AnySpec = FamilySpec<unknown>;
const families = UNIFORM_FAMILIES.map((family) => ({ family, spec: family.spec as unknown as AnySpec }));

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

function checkExercise(v: unknown, spec: AnySpec, seed: number): { built: Built; sig: string } {
  const sig = spec.signature(v);
  const built = spec.build(v, new SeededRandom(mixSeed(seed, 5)));
  const ex = built.exercise;
  expect(checkModel(built.model), sig).toEqual([]);
  expect(validateExercise(ex), sig).toEqual([]);
  expect(ex.signature).toBe(sig);
  expect(ex.familyId).toBe(spec.id);
  expect(ex.topic).toBe("pointwise");
  expect(ex.difficulty, sig).toBe(spec.difficulty(v));
  expect(ex.steps.length, sig).toBeGreaterThanOrEqual(3);
  expect(ex.steps.length, sig).toBeLessThanOrEqual(5);

  // Every math fragment is valid KaTeX; displayed constants are exact; no TeX leaks into the Hebrew prose.
  for (const { math, where } of mathStrings(ex)) {
    expect(() => katex.renderToString(math, { throwOnError: true, strict: "error" }), `${sig} ${where}: ${math}`).not.toThrow();
    expect(math, `${sig} ${where}`).not.toMatch(/\d\.\d/);
    expect(math, `${sig} ${where}`).not.toContain("\\\\");
  }
  for (const { text, where } of textStrings(ex)) {
    const prose = text.replace(/\$[^$]+\$/g, "");
    expect(prose, `${sig} ${where}: stray backslash or dollar outside math`).not.toMatch(/[\\$]/);
    expect(text.split("$").length % 2, `${sig} ${where}: unbalanced $`).toBe(1);
  }

  // Notation of the chips and template lines.
  const chips: string[] = [];
  for (const [, label] of Object.entries(ex.tokens)) if ("latex" in label) chips.push(label.latex);
  const lines: string[] = [];
  for (const t of templatesOf(ex)) for (const seg of t.segments) if ("latex" in seg) lines.push(seg.latex);
  const notation = [...chips, ...lines];
  for (const latex of notation) {
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

  // The plot: finite window showing the interesting region, sane numbers, no clipping for small and large n.
  const plot = ex.plot!;
  expect(plot.maxN).toBe(40);
  const { view } = plot;
  for (const value of Object.values(view)) expect(Number.isFinite(value), sig).toBe(true);
  expect(view.xMin).toBeLessThan(view.xMax);
  expect(view.yMin).toBeLessThan(view.yMax);
  const lo = Math.max(view.xMin, dom.left);
  const hi = Math.min(view.xMax, dom.right);
  expect(lo, `${sig}: the window must meet the domain`).toBeLessThan(hi);
  // Dense scan without one assertion per point: collect the first offence of each kind.
  const offences: string[] = [];
  for (const n of [1, 2, 5, 10, 40]) for (let i = 0; i <= 2000; i += 1) {
    const x = lo + ((hi - lo) * i) / 2000;
    const y = plot.value(n, x);
    if (!Number.isFinite(y)) { offences.push(`f_${n}(${x}) is not finite`); break; }
    if (n !== 10 && (y > view.yMax + 1e-9 || y < view.yMin - 1e-9)) { offences.push(`f_${n}(${x})=${y} is clipped by the window`); break; }
    if (plot.limit && !Number.isFinite(plot.limit(x))) { offences.push(`limit(${x}) is not finite`); break; }
  }
  expect(offences, sig).toEqual([]);
  for (let n = 1; n <= 40; n += 1) {
    const marker = plot.marker?.(n);
    if (marker !== undefined && marker !== null) expect(Number.isFinite(marker), sig).toBe(true);
  }
  if (plot.marker) expect(plot.markerLabel, sig).toBeTruthy();
  return { built, sig };
}

const grids = families.map(({ spec }) => spec.grid());
/** Sizes of the grids, family by family (see docs/question-families/uniform-practice.md). */
const GRID_SIZES: Record<string, number> = {
  "unif-ln-power": 15, "unif-ratio-power": 11, "unif-cos-power": 12, "unif-sin-root": 24, "unif-diff-quotient": 15, "unif-one-minus-cos": 7,
  "unif-poly-quotient": 10, "unif-arctan": 6, "unif-exp-decay": 7, "unif-sqrt-smoothing": 10, "unif-peak-power": 8,
};
const TOTAL_INSTANCES = Object.values(GRID_SIZES).reduce((a, b) => a + b, 0);

describe("uniform families: the whole grid of every family", () => {
  it("registers eleven families of the topic in the practice bank", () => {
    expect(UNIFORM_FAMILIES.length).toBe(11);
    for (const family of UNIFORM_FAMILIES) expect(PRACTICE_FAMILIES).toContain(family);
    expect(new Set(UNIFORM_FAMILIES.map((f) => f.id)).size).toBe(11);
    expect(availableTopics()).toContain("pointwise");
    expect(availableLevels("pointwise")).toEqual(["easy", "medium", "advanced"]);
  });

  families.forEach(({ family, spec }, index) => {
    it(`${family.id}: every instance passes the numeric self-check, validation, KaTeX and distractor checks`, () => {
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

  it("covers the required families and the course owner's mix: logs, trigonometric functions, powers, derivative quotients", () => {
    expect(UNIFORM_FAMILIES.map((f) => f.id)).toEqual([
      "unif-ln-power", "unif-ratio-power", "unif-cos-power", "unif-sin-root", "unif-diff-quotient", "unif-one-minus-cos",
      "unif-poly-quotient", "unif-arctan", "unif-exp-decay", "unif-sqrt-smoothing", "unif-peak-power",
    ]);
    families.forEach(({ family }, i) => expect(grids[i].length, family.id).toBe(GRID_SIZES[family.id]));
    const total = grids.reduce((sum, g) => sum + g.length, 0);
    expect(total).toBe(TOTAL_INSTANCES);
  });
});

describe("uniform families: draws honour the level and stay valid", () => {
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

  it("drawExercise('pointwise') serves every family, both verdicts and every level, reproducibly", () => {
    const seen = new Set<string>();
    const verdicts = new Set<string>();
    for (let seed = 1; seed <= 800; seed += 1) {
      const ex = drawExercise("pointwise", mixSeed(seed, 41))!;
      expect(ex).not.toBeNull();
      expect(ex.topic).toBe("pointwise");
      seen.add(ex.familyId);
      const last = ex.steps[ex.steps.length - 1].parts[0];
      if (ex.familyId.startsWith("unif-") && last.kind === "choice") verdicts.add(last.choice.options.find((o) => o.correct)!.id);
    }
    // The topic also holds the supremum families (one topic since the course owner merged them).
    for (const family of UNIFORM_FAMILIES) expect(seen.has(family.id), family.id).toBe(true);
    expect(verdicts).toEqual(new Set(["uniform", "not-uniform"]));
    for (const level of PRACTICE_DIFFICULTIES) for (let seed = 1; seed <= 30; seed += 1) {
      expect(drawExercise("pointwise", mixSeed(seed, 43), undefined, undefined, level)?.difficulty).toBe(level);
    }
    // The graph spec holds functions, so compare everything else.
    const strip = (ex: ReturnType<typeof drawExercise>) => ex && { ...ex, plot: undefined };
    expect(strip(drawExercise("pointwise", 12345))).toEqual(strip(drawExercise("pointwise", 12345)));
    // The exercise on screen is avoided when another instance exists.
    const first = drawExercise("pointwise", 7)!;
    for (let seed = 1; seed <= 30; seed += 1) expect(drawExercise("pointwise", seed, first.signature)?.signature).not.toBe(first.signature);
  }, SWEEP_TIMEOUT_MS);
});

describe("uniform families: the numeric self-check really detects wrong claims", () => {
  const model = (id: string, signaturePart: string): Model => {
    const { spec } = families.find(({ family }) => family.id === id)!;
    const v = spec.grid().find((g) => spec.signature(g).includes(signaturePart))!;
    return spec.build(v, new SeededRandom(1)).model;
  };

  it("accepts the true models and rejects a wrong supremum, a wrong verdict and a wrong limit", () => {
    const sub = model("unif-ln-power", "c=1;sub;a=1/2");
    expect(checkModel(sub)).toEqual([]);
    expect(checkModel({ ...sub, sup: (n) => 1.01 * sub.sup!(n) }).length).toBeGreaterThan(0);
    expect(checkModel({ ...sub, uniform: false, gap: 0.5 }).length).toBeGreaterThan(0);
    expect(checkModel({ ...sub, limit: () => 0.25 }).length).toBeGreaterThan(0);
    const jump = model("unif-ln-power", "c=1;closed1");
    expect(checkModel(jump)).toEqual([]);
    expect(checkModel({ ...jump, uniform: true }).length).toBeGreaterThan(0);
    expect(checkModel({ ...jump, gap: 5 }).length).toBeGreaterThan(0);
    const bumped = model("unif-one-minus-cos", "full");
    expect(checkModel(bumped)).toEqual([]);
    expect(checkModel({ ...bumped, witness: { x: () => 0.1, diff: () => 2 } }).length).toBeGreaterThan(0);
    const bounded = model("unif-diff-quotient", "sin;k=1");
    expect(checkModel(bounded)).toEqual([]);
    expect(checkModel({ ...bounded, bound: (n: number) => 0.1 / n }).length).toBeGreaterThan(0);
  });

  it("checks the claimed values of the headline examples", () => {
    // ln(1+x^n) on [0,1]: the supremum ln 2 is approached, never attained; on [0,a] it is ln(1+a^n).
    const ln = model("unif-ln-power", "c=1;closed1");
    expect(ln.sup!(7)).toBeCloseTo(Math.LN2, 12);
    expect(ln.limit(0.5)).toBe(0);
    expect(ln.limit(1)).toBeCloseTo(Math.LN2, 12);
    // x^n/(1+x^{2n}) peaks at 1/2 on [0,inf); the moving point 2^{1/n} gives 2/5.
    const ratio = model("unif-ratio-power", "full");
    expect(ratio.value(9, 2 ** (1 / 9))).toBeCloseTo(0.4, 12);
    expect(ratio.limit(1)).toBe(0.5);
    // 1 - cos(x/n) reaches 2 at x = n pi.
    const cosine = model("unif-one-minus-cos", "full");
    expect(cosine.value(6, 6 * Math.PI)).toBeCloseTo(2, 12);
    // n x^n (1-x): the peak height tends to 1/e.
    const peak = model("unif-peak-power", "n-times;full");
    expect(peak.sup!(10_000)).toBeCloseTo(1 / Math.E, 3);
  });
});

describe("uniform families: displayed fractions are reduced", () => {
  const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
  it("no \\frac{p}{q} with integers p, q has a common factor, and no integer over (integer * n^k) is reducible", () => {
    for (const [index, { spec }] of families.entries()) for (const v of grids[index]) {
      const built = spec.build(v, new SeededRandom(3));
      const sig = spec.signature(v);
      const all = [...textStrings(built.exercise).flatMap(({ text }) => [...text.matchAll(/\$([^$]+)\$/g)].map((m) => m[1])), ...mathStrings(built.exercise).map((m) => m.math)];
      for (const math of all) {
        // \frac{p}{q}, \tfrac{p}{q}, \dfrac{p}{q} with integer p and q
        for (const [, p, q] of math.matchAll(/\\[dt]?frac\{(\d+)\}\{(\d+)\}/g)) {
          expect(gcd(Number(p), Number(q)), `${sig}: ${math}`).toBe(1);
        }
        // \frac{p}{q n^k}: an integer numerator over an integer-times-power-of-n denominator
        for (const [, p, q] of math.matchAll(/\\[dt]?frac\{(\d+)\}\{(\d+)n(?:\^\{?\d+\}?)?\}/g)) {
          expect(gcd(Number(p), Number(q)), `${sig}: ${math}`).toBe(1);
        }
        // a fraction with 1 in the denominator, and an unreduced "n over 1"
        expect(math, sig).not.toMatch(/\\[dt]?frac\{[^{}]*\}\{1\}/);
      }
    }
  });

  it("the reducing helper itself", () => {
    expect(gcd(16, 2)).toBe(2);
  });
});
