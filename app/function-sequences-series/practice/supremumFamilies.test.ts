import katex from "katex";
import { describe, expect, it } from "vitest";
import { SeededRandom, mixSeed } from "../../constant-coefficients-euler/practice/random";
import { checkStep, revealAnswers } from "../math/guidedSteps";
import { drawExercise, validateExercise } from "./practiceBank";
import { PRACTICE_FAMILIES } from "./practiceFamilies";
import type { PracticeExercise } from "./practiceTypes";
import {
  POWER_EXPONENTIAL,
  POWER_RATIONAL,
  R,
  SUPREMUM_FAMILIES,
  analyze,
  buildSupremumExercise,
  exerciseGrid,
  selfCheck,
  signatureOf,
  type Domain,
  type FamilyKind,
  type Params,
} from "./supremumFamilies";

const KINDS: FamilyKind[] = ["A", "B"];
const FAMILY_ID: Record<FamilyKind, string> = { A: POWER_EXPONENTIAL.id, B: POWER_RATIONAL.id };

/** Every string of an exercise that contains math, with a label for failures. */
function mathStrings(ex: PracticeExercise): { math: string; where: string }[] {
  const out: { math: string; where: string }[] = [];
  const inline = (text: string | undefined, where: string) => {
    if (!text) return;
    for (const [, math] of text.matchAll(/\$([^$]+)\$/g)) out.push({ math, where });
  };
  inline(ex.statement, "statement");
  out.push({ math: ex.formulaLatex, where: "formulaLatex" });
  for (const [id, label] of Object.entries(ex.tokens)) if ("latex" in label) out.push({ math: label.latex, where: `token ${id}` });
  for (const step of ex.steps) {
    for (const text of [step.title, step.prompt, step.solvedNote, step.minimalProof, ...step.hints]) inline(text, step.id);
    for (const part of step.parts) {
      inline(part.lead, step.id);
      if (part.kind === "choice") {
        inline(part.choice.prompt, step.id);
        for (const o of part.choice.options) { inline(o.label, `${step.id} option`); inline(o.diagnosis, `${step.id} diagnosis`); }
      }
      if (part.kind === "slots") {
        for (const seg of part.template.segments) if ("latex" in seg) out.push({ math: seg.latex, where: `${step.id} template` });
        for (const s of part.template.slots) for (const d of Object.values(s.diagnoses ?? {})) inline(d, `${step.id} slot diagnosis`);
      }
    }
  }
  return out;
}

const grids = Object.fromEntries(KINDS.map((k) => [k, exerciseGrid(k)])) as Record<FamilyKind, ReturnType<typeof exerciseGrid>>;

describe("supremum families: the whole parameter grid", () => {
  it("has a rich grid, with both verdicts and every domain kind", () => {
    for (const kind of KINDS) {
      const grid = grids[kind];
      expect(grid.length).toBeGreaterThan(300);
      expect(new Set(grid.map((g) => signatureOf(g.params, g.domain))).size).toBe(grid.length);
      const verdicts = new Set(grid.map((g) => analyze(g.params, g.domain).verdict));
      expect(verdicts).toEqual(new Set(["zero", "constant", "infinite"]));
      expect(new Set(grid.map((g) => g.domain.kind))).toEqual(new Set(["half", "short", "tail", "mixed"]));
      // Fractional exponents occur.
      expect(grid.some((g) => g.params.b.d > 1 || g.params.c.d > 1 || g.params.a.d > 1)).toBe(true);
      // The exponent of M_n takes negative, zero and positive values on the half-line.
      const ks = grid.filter((g) => g.domain.kind === "half").map((g) => Math.sign(analyze(g.params, g.domain).k.n));
      expect(new Set(ks)).toEqual(new Set([-1, 0, 1]));
    }
  });

  for (const kind of KINDS) {
    it(`family ${kind}: every instance passes self-check, validation, KaTeX and distractor checks`, () => {
      let count = 0;
      for (const { params, domain } of grids[kind]) {
        const sig = signatureOf(params, domain);
        expect(selfCheck(params, domain), sig).toEqual([]);
        const ex = buildSupremumExercise(FAMILY_ID[kind], params, domain, new SeededRandom(mixSeed(count + 1, 5)));
        count += 1;
        expect(validateExercise(ex), sig).toEqual([]);
        expect(ex.signature).toBe(sig);
        expect(ex.topic).toBe("pointwise");
        expect(ex.steps.length).toBeGreaterThanOrEqual(4);
        expect(ex.steps.length).toBeLessThanOrEqual(6);
        for (const { math, where } of mathStrings(ex)) {
          expect(() => katex.renderToString(math, { throwOnError: true, strict: "error" }), `${sig} ${where}: ${math}`).not.toThrow();
          // Exact constants only: no floating-point literal in displayed math.
          expect(math, `${sig} ${where}`).not.toMatch(/\d\.\d/);
        }
        // Distractors: distinct chips, the right token is the one accepted, the reveal passes.
        for (const step of ex.steps) {
          expect(checkStep(step, revealAnswers(step)).status).toBe("correct");
          for (const part of step.parts) {
            if (part.kind === "slots") for (const s of part.template.slots) {
              const labels = s.chips.map((c) => JSON.stringify(ex.tokens[c]));
              expect(new Set(labels).size, `${sig} ${step.id}`).toBe(labels.length);
              expect(s.accepted.length).toBe(1);
              const wrongChips = s.chips.filter((c) => !s.accepted.includes(c));
              expect(wrongChips.length).toBeGreaterThanOrEqual(2);
              // A wrong chip never passes the checker.
              for (const wrong of wrongChips) {
                const filling = Object.fromEntries(part.template.slots.map((o) => [o.id, o.accepted[0]]));
                filling[s.id] = wrong;
                expect(checkStep(step, { ...revealAnswers(step), [part.id]: filling }).status, `${sig} ${step.id}`).toBe("wrong");
              }
            }
            if (part.kind === "choice") {
              const ids = part.choice.options.map((o) => o.id);
              expect(new Set(ids).size).toBe(ids.length);
              expect(new Set(part.choice.options.map((o) => o.label)).size).toBe(ids.length);
              for (const o of part.choice.options) if (!o.correct) expect(o.diagnosis, `${sig} ${o.id}`).toBeTruthy();
            }
          }
        }
        // The verdict step accepts exactly the right reason.
        const verdict = analyze(params, domain).verdict;
        const last = ex.steps[ex.steps.length - 1].parts[0];
        if (last.kind !== "choice") throw new Error("last step is a choice");
        const correctId = last.choice.options.find((o) => o.correct)!.id;
        expect(correctId).toBe(verdict === "zero" ? "uniform" : verdict === "constant" ? "const" : "inf");
      }
      expect(count).toBe(grids[kind].length);
    }, 120_000);
  }

  it("agrees with an independent brute-force supremum on a sample of the grid", () => {
    const sample = KINDS.flatMap((k) => grids[k].filter((_, i) => i % 23 === 0));
    expect(sample.length).toBeGreaterThan(30);
    for (const { params, domain } of sample) {
      const an = analyze(params, domain);
      const num = (r: { n: number; d: number }) => r.n / r.d;
      const f = (n: number, x: number) => {
        const lead = Math.pow(n, num(params.a)) * Math.pow(x, num(params.b));
        const t = Math.pow(n, num(params.c)) * Math.pow(x, num(params.d));
        return params.kind === "A" ? lead * Math.exp(-t) : lead / (1 + t);
      };
      const n = 400;
      const xn = an.xnConst.value * Math.pow(n, num(an.xnK));
      const lo = num(domain.lo);
      const hi = domain.hi ? num(domain.hi) : 50;
      // Dense linear grid around the peak plus the endpoints.
      let best = f(n, lo);
      for (let i = 0; i <= 40_000; i += 1) {
        const x = lo + ((hi - lo) * i) / 40_000;
        if (x > 0) best = Math.max(best, f(n, x));
      }
      for (let i = -2000; i <= 2000; i += 1) {
        const x = xn * (1 + i / 4000);
        if (x >= lo && x <= hi) best = Math.max(best, f(n, x));
      }
      const claimed = an.interior ? an.mnConst.value * Math.pow(n, num(an.k)) : f(n, lo);
      expect(Math.abs(best - claimed), signatureOf(params, domain)).toBeLessThanOrEqual(1e-6 * claimed + 1e-300);
    }
  });

  it("reproduces the classical examples", () => {
    const half: Domain = { kind: "half", lo: R(0), hi: null };
    // n x / (1 + n^2 x^2): M_n = 1/2 for all n, not uniform.
    const classic: Params = { kind: "B", a: R(1), b: R(1), c: R(2), d: R(2) };
    const an = analyze(classic, half);
    expect(an.verdict).toBe("constant");
    expect(an.mnConst.value).toBeCloseTo(0.5, 12);
    expect(an.k).toEqual(R(0));
    // x / (1 + n^3 x^3): M_n ~ n^{-1}, uniform on [0,inf).
    const cubic: Params = { kind: "B", a: R(0), b: R(1), c: R(3), d: R(3) };
    expect(analyze(cubic, half).verdict).toBe("zero");
    // n x e^{-n x}: M_n = 1/e, not uniform; on [1,inf) it is uniform.
    const ne: Params = { kind: "A", a: R(1), b: R(1), c: R(1), d: R(1) };
    expect(analyze(ne, half).mnConst.value).toBeCloseTo(1 / Math.E, 12);
    expect(analyze(ne, { kind: "tail", lo: R(1), hi: null }).verdict).toBe("zero");
  });

  it("registers in the bank and drawExercise('pointwise') serves the supremum families", () => {
    for (const family of SUPREMUM_FAMILIES) expect(PRACTICE_FAMILIES).toContain(family);
    expect(PRACTICE_FAMILIES.map((f) => f.id)).toEqual(expect.arrayContaining(["power-on-subinterval", "jumping-limit"]));
    const seen = new Set<string>();
    const verdicts = new Set<string>();
    const kinds = new Set<string>();
    for (let seed = 1; seed <= 300; seed += 1) {
      const ex = drawExercise("pointwise", mixSeed(seed, 41))!;
      expect(ex).not.toBeNull();
      expect(validateExercise(ex)).toEqual([]);
      seen.add(ex.familyId);
      const last = ex.steps[ex.steps.length - 1].parts[0];
      if (ex.familyId.startsWith("sup-") && last.kind === "choice") {
        verdicts.add(last.choice.options.find((o) => o.correct)!.id);
        kinds.add(ex.steps.length === 6 ? "six" : "other");
      }
    }
    expect(seen.has(POWER_EXPONENTIAL.id)).toBe(true);
    expect(seen.has(POWER_RATIONAL.id)).toBe(true);
    expect(verdicts).toEqual(new Set(["uniform", "const", "inf"]));
    // Reproducible from the seed.
    // (The graph spec holds functions, so compare everything else.)
    const strip = (ex: ReturnType<typeof drawExercise>) => ex && { ...ex, plot: undefined };
    expect(strip(drawExercise("pointwise", 12345))).toEqual(strip(drawExercise("pointwise", 12345)));
  });

  it("the generators never fall back: random draws always pass the self-check", () => {
    for (const family of SUPREMUM_FAMILIES) for (let seed = 1; seed <= 150; seed += 1) {
      const ex = family.generate(new SeededRandom(mixSeed(seed, 77)));
      expect(validateExercise(ex)).toEqual([]);
      expect(ex.familyId).toBe(family.id);
    }
  });

describe("supremum families: notation of the chips", () => {
  it("writes constants before the variables: no n or x followed by a numeric factor", () => {
    // e.g. "n\,2\,e^{-4n^3}" (a reported typo) must read "2n\,e^{-4n^3}".
    const variableThenConstant = /[nx](\^E|\^\{[^{}]*(\{[^{}]*\}[^{}]*)*\})?(\\,)?(\d|\\tfrac|\\frac|\\sqrt)/;
    for (const kind of ["A", "B"] as const) {
      for (const { params, domain } of exerciseGrid(kind)) {
        const exercise = buildSupremumExercise(kind === "A" ? "sup-power-exponential" : "sup-power-rational", params, domain, new SeededRandom(7));
        for (const label of Object.values(exercise.tokens)) {
          if (!("latex" in label)) continue;
          // Only look outside exponents: strip ^{...} groups first.
          let flat = label.latex;
          for (let i = 0; i < 4; i++) flat = flat.replace(/\^\{[^{}]*\}/g, "^E");
          expect(flat, `${exercise.signature}: ${label.latex}`).not.toMatch(variableThenConstant);
        }
      }
    }
  }, 60_000);
});

});
