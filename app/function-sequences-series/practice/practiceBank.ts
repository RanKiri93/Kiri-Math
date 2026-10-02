/**
 * Drawing exercises for the summary practice: pick a family for the topic filter, generate an
 * instance from a seeded source, and validate it before returning it (AGENTS.md: a generator that
 * can emit an unanswerable question is a bug). Pure TypeScript, no React; seeded and reproducible.
 */
import { SeededRandom, mixSeed } from "../../constant-coefficients-euler/practice/random";
import { checkStep, revealAnswers } from "../math/guidedSteps";
import { PRACTICE_FAMILIES } from "./practiceFamilies";
import { PRACTICE_DIFFICULTIES, type PracticeDifficulty, type PracticeExercise, type PracticeFamily, type PracticeFilter, type PracticeLevel, type PracticeTopic } from "./practiceTypes";

const MAX_ATTEMPTS = 20;

/** The families a topic filter and a level draw from. */
export function familiesFor(filter: PracticeFilter, families: readonly PracticeFamily[] = PRACTICE_FAMILIES, level: PracticeLevel = "all"): PracticeFamily[] {
  return families.filter((family) => (filter === "all" || family.topic === filter) && (level === "all" || family.difficulties.includes(level)));
}

/** Topics with at least one family at the level (the others are offered as "in preparation"). */
export function availableTopics(level: PracticeLevel = "all", families: readonly PracticeFamily[] = PRACTICE_FAMILIES): PracticeTopic[] {
  return [...new Set(familiesFor("all", families, level).map((family) => family.topic))];
}

/** Levels with at least one family in the topic filter. */
export function availableLevels(filter: PracticeFilter, families: readonly PracticeFamily[] = PRACTICE_FAMILIES): PracticeDifficulty[] {
  return PRACTICE_DIFFICULTIES.filter((level) => familiesFor(filter, families, level).length > 0);
}

/** Problems with an exercise; empty when it is answerable as built. */
export function validateExercise(exercise: PracticeExercise): string[] {
  const problems: string[] = [];
  if (exercise.steps.length === 0) problems.push("no steps");
  const ids = exercise.steps.map((step) => step.id);
  if (new Set(ids).size !== ids.length) problems.push("duplicate step ids");
  for (const step of exercise.steps) {
    if (checkStep(step, revealAnswers(step)).status !== "correct") problems.push(`${step.id}: its reveal does not pass its check`);
    for (const part of step.parts) {
      if (part.kind === "slots") for (const s of part.template.slots) for (const chip of s.chips) {
        if (!exercise.tokens[chip]) problems.push(`${step.id}: unknown token ${chip}`);
      }
      if (part.kind === "choice" && part.choice.options.filter((o) => o.correct).length !== 1) {
        problems.push(`${step.id}: a choice needs exactly one correct option`);
      }
    }
  }
  return problems;
}

/**
 * A validated exercise for the topic filter and level, reproducible from `seed`. Avoids
 * `avoidSignature` (the exercise on screen) when another instance exists; returns null only when
 * no family matches or no attempt validates.
 */
export function drawExercise(filter: PracticeFilter, seed: number, avoidSignature?: string,
  families: readonly PracticeFamily[] = PRACTICE_FAMILIES, level: PracticeLevel = "all"): PracticeExercise | null {
  const pool = familiesFor(filter, families, level);
  if (pool.length === 0) return null;
  let fallback: PracticeExercise | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const rng = new SeededRandom(mixSeed(seed, attempt + 1));
    const family = rng.pick(pool);
    const exercise = family.generate(rng, level === "all" ? undefined : level);
    if (validateExercise(exercise).length > 0) continue;
    if (level !== "all" && exercise.difficulty !== level) continue;
    if (exercise.signature === avoidSignature) { fallback ??= exercise; continue; }
    return exercise;
  }
  return fallback;
}
