import katex from "katex";
import { describe, expect, it } from "vitest";
import { SeededRandom, mixSeed } from "../../constant-coefficients-euler/practice/random";
import { availableLevels, availableTopics, drawExercise, familiesFor, validateExercise } from "./practiceBank";
import { PRACTICE_FAMILIES } from "./practiceFamilies";
import { PRACTICE_TOPICS, type PracticeFamily } from "./practiceTypes";

/** Exhaustive sweeps run long under the parallel full suite; give them room. */
const SWEEP_TIMEOUT_MS = 30_000;

const SEEDS = Array.from({ length: 200 }, (_, i) => mixSeed(i + 1, 97));

describe("practice bank", () => {
  it("every family validates on a large sample of seeds, with readable KaTeX", () => {
    for (const family of PRACTICE_FAMILIES) for (const seed of SEEDS) {
      const exercise = family.generate(new SeededRandom(seed));
      expect(validateExercise(exercise), `${family.id} ${exercise.signature}`).toEqual([]);
      expect(exercise.familyId).toBe(family.id);
      expect(PRACTICE_TOPICS).toContain(exercise.topic);
      const texts = [exercise.statement, ...exercise.steps.flatMap((step) => [step.title, step.prompt, step.solvedNote, ...step.hints])];
      // Every inline $...$ segment renders (the practice layer stays free of React).
      for (const text of texts) for (const [, math] of text.matchAll(/\$([^$]+)\$/g)) {
        expect(() => katex.renderToString(math, { throwOnError: true }), math).not.toThrow();
      }
    }
  }, SWEEP_TIMEOUT_MS);

  it("draws reproducibly from a seed and respects the topic filter", () => {
    for (const seed of SEEDS.slice(0, 20)) {
      // The graph spec holds functions; compare everything else.
      const strip = (ex: ReturnType<typeof drawExercise>) => ex && { ...ex, plot: undefined };
      expect(strip(drawExercise("all", seed))).toEqual(strip(drawExercise("all", seed)));
      for (const topic of availableTopics()) expect(drawExercise(topic, seed)?.topic).toBe(topic);
    }
    for (const topic of PRACTICE_TOPICS) {
      if (familiesFor(topic).length === 0) expect(drawExercise(topic, 1)).toBeNull();
    }
  });

  it("avoids repeating the exercise on screen when another instance exists", () => {
    const first = drawExercise("pointwise", 7)!;
    for (const seed of SEEDS.slice(0, 30)) expect(drawExercise("pointwise", seed, first.signature)?.signature).not.toBe(first.signature);
  });

  it("offers no chip with a vanishing coefficient, such as (1/2 + 0 T)", () => {
    for (const seed of Array.from({ length: 400 }, (_, i) => mixSeed(i + 1, 131))) {
      const exercise = drawExercise("pointwise", seed)!;
      for (const label of Object.values(exercise.tokens)) {
        if ("latex" in label) expect(label.latex, exercise.signature).not.toMatch(/[+-]0\\,/);
      }
    }
  });

  it("draws exercises of the chosen level only: integer exponents easy, fractional medium or advanced", () => {
    expect(availableLevels("pointwise")).toEqual(["easy", "medium", "advanced"]);
    for (const level of ["easy", "medium", "advanced"] as const) {
      for (const seed of SEEDS.slice(0, 40)) {
        const exercise = drawExercise("pointwise", seed, undefined, undefined, level);
        expect(exercise?.difficulty, `${level} ${seed}`).toBe(level);
      }
    }
    // The demo x^n family is among the easy ones.
    const easy = new Set(SEEDS.map((seed) => drawExercise("pointwise", seed, undefined, undefined, "easy")!.familyId));
    expect(easy.has("power-on-subinterval")).toBe(true);
    // A topic without families yields nothing, at any level.
    expect(drawExercise("integral", 1, undefined, undefined, "advanced")).toBeNull();
    expect(drawExercise("continuity", 1, undefined, undefined, "advanced")?.difficulty).toBe("advanced");
  });

  it("calls an unbounded domain a ray and a bounded one an interval", () => {
    for (const seed of SEEDS) {
      const exercise = drawExercise("pointwise", seed)!;
      // The supremum families name every domain a ray or an interval (the others may also say «ישר»).
      if (!exercise.familyId.startsWith("sup-")) continue;
      const ray = exercise.formulaLatex.includes("\\infty");
      expect(exercise.statement.includes("בקרן"), exercise.signature).toBe(ray);
      expect(exercise.statement.includes("בקטע"), exercise.signature).toBe(!ray);
    }
  });

  it("never returns an invalid exercise: a broken family yields null", () => {
    const broken: PracticeFamily = {
      id: "broken", topic: "integral", difficulties: ["easy"],
      generate: () => ({ ...PRACTICE_FAMILIES[0].generate(new SeededRandom(1)), familyId: "broken", topic: "integral", steps: [] }),
    };
    expect(drawExercise("integral", 1, undefined, [broken])).toBeNull();
  });
});
