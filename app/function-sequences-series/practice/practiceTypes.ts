/**
 * Contract of the summary practice activity: a bank of parametric exercise families drawn at
 * random. Pure TypeScript, no React. Every exercise is one card whose steps use the shared
 * guided-step engine (math/guidedSteps.ts); nothing is stored or recorded as completed.
 */
import type { GuidedStep } from "../math/guidedSteps";
import type { TokenId, TokenLabel } from "../math/supremumTypes";
import type { SeededRandom } from "../../constant-coefficients-euler/practice/random";

/**
 * The topics a student can focus on, in the order of the module's activities. Uniform convergence
 * and the supremum test are one topic: almost every uniform-convergence exercise computes M_n.
 */
export const PRACTICE_TOPICS = ["pointwise", "continuity", "integral", "derivative"] as const;
export type PracticeTopic = (typeof PRACTICE_TOPICS)[number];
/** A topic filter: one topic, or every topic mixed. */
export type PracticeFilter = PracticeTopic | "all";

export const PRACTICE_TOPIC_LABELS: Record<PracticeFilter, string> = {
  all: "כל הנושאים",
  pointwise: "התכנסות נקודתית ובמידה שווה",
  continuity: "רציפות הגבול",
  integral: "גבול ואינטגרל",
  derivative: "גבול ונגזרת",
};

export type PracticeDifficulty = "easy" | "medium" | "advanced";
/** A difficulty filter: one level, or every level mixed. */
export type PracticeLevel = PracticeDifficulty | "all";
export const PRACTICE_DIFFICULTIES: readonly PracticeDifficulty[] = ["easy", "medium", "advanced"];
export const PRACTICE_LEVEL_LABELS: Record<PracticeLevel, string> = { all: "כל הרמות", easy: "קל", medium: "בינוני", advanced: "מתקדם" };

/** A step of a practice exercise: the shared guided step, without an example id or graph state. */
export type PracticeStep = GuidedStep<string, null>;

/**
 * The graph of a drawn exercise: f_n against x for an index n chosen with a slider. Numbers only
 * (no LaTeX); the card draws f_n on the domain, the pointwise limit, an optional epsilon-band and
 * an optional marker per n (e.g. the critical point x_n).
 */
export type PracticePlotSpec = {
  value: (n: number, x: number) => number;
  /** The pointwise limit f, or null when there is none. */
  limit: ((x: number) => number) | null;
  /** The exercise's domain; `right` may be Infinity. */
  domain: { left: number; right: number; leftClosed: boolean; rightClosed: boolean };
  /** The plotting window (finite). Values above `yMax` are clipped and marked. */
  view: { xMin: number; xMax: number; yMin: number; yMax: number };
  /** Largest index offered by the n slider. */
  maxN: number;
  /** A point to mark on the curve for index n (e.g. the critical point x_n), or null. */
  marker?: (n: number) => number | null;
  /** Hebrew legend label of the marker, e.g. "הנקודה החשודה לקיצון". */
  markerLabel?: string;
  /**
   * Interior points where f_n jumps (or takes an isolated value), for index n. The curve is split
   * there (nothing is connected across a jump) and open/closed dots mark the one-sided limits and
   * the value taken. Absent: f_n is drawn as one polyline.
   */
  breaks?: (n: number) => number[];
  /** The same for the limit f: interior points where f jumps or takes an isolated value. */
  limitBreaks?: number[];
};

/** One drawn exercise: shown as a single card, its steps opening one below the other. */
export type PracticeExercise = {
  familyId: string;
  /** The concrete parameter values, e.g. "b=2/3"; used to avoid drawing the same exercise twice in a row. */
  signature: string;
  topic: PracticeTopic;
  difficulty: PracticeDifficulty;
  /** Short Hebrew title of the exercise. */
  title: string;
  /** The task, Hebrew with inline $...$ math. */
  statement: string;
  /** Display LaTeX of the sequence and its domain. */
  formulaLatex: string;
  steps: PracticeStep[];
  /** The chip palette of this exercise's slots: token id → LaTeX or text label. */
  tokens: Record<TokenId, TokenLabel>;
  /** The graph shown on the card, if the family provides one. */
  plot?: PracticePlotSpec;
};

/** A parametric family: draws its parameters from enumerated sets and builds an exercise. */
export type PracticeFamily = {
  id: string;
  topic: PracticeTopic;
  /** The levels this family can produce (a family may span several, e.g. by integer or fractional exponents). */
  difficulties: readonly PracticeDifficulty[];
  /** Builds one exercise from the random source, of `difficulty` when given (one of `difficulties`);
   * the bank validates it before showing it. */
  generate: (rng: SeededRandom, difficulty?: PracticeDifficulty) => PracticeExercise;
};
