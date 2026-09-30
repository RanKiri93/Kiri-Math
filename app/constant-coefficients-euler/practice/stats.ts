import type {
  EulerTransformationExerciseState,
  FullSolutionExerciseState,
  QuizSessionStats,
  ReconstructionExerciseState,
} from "../types";

type SessionEngagement = {
  completed: boolean;
  hasEngaged: boolean;
  hadCorrectStage: boolean;
};

export function createInitialExerciseState(): FullSolutionExerciseState {
  return {
    polynomialStatus: "unanswered",
    rootsStatus: "locked",
    basisStatus: "locked",
    initialConditionsStatus: "locked",
    stabilityStatus: "locked",
    rootsEverUnlocked: false,
    basisEverUnlocked: false,
    initialConditionsEverUnlocked: false,
    stabilityEverUnlocked: false,
    usedReveal: false,
    hasEngaged: false,
    hadCorrectStage: false,
    completed: false,
    completionKind: "none",
  };
}

export function createInitialEulerExerciseState(): EulerTransformationExerciseState {
  return {
    polynomialStatus: "unanswered",
    transformedEquationStatus: "locked",
    rootsStatus: "locked",
    uBasisStatus: "locked",
    yBasisStatus: "locked",
    stabilityStatus: "locked",
    transformedEquationEverUnlocked: false,
    rootsEverUnlocked: false,
    uBasisEverUnlocked: false,
    yBasisEverUnlocked: false,
    stabilityEverUnlocked: false,
    usedReveal: false,
    hasEngaged: false,
    hadCorrectStage: false,
    completed: false,
    completionKind: "none",
  };
}

export function createInitialReconstructionExerciseState(): ReconstructionExerciseState {
  return {
    feasibilityStatus: "unanswered",
    infeasibilityReasonStatus: "locked",
    forcedRootsStatus: "locked",
    outcomeStatus: "locked",
    conclusionStatus: "locked",
    infeasibilityReasonEverUnlocked: false,
    forcedRootsEverUnlocked: false,
    outcomeEverUnlocked: false,
    conclusionEverUnlocked: false,
    usedReveal: false,
    hasEngaged: false,
    hadCorrectStage: false,
    completed: false,
    completionKind: "none",
  };
}

export function recordIndependentCompletion(stats: QuizSessionStats): QuizSessionStats {
  const currentStreak = stats.currentStreak + 1;
  return {
    answered: stats.answered + 1,
    correct: stats.correct + 1,
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
  };
}

export function recordAssistedCompletion(stats: QuizSessionStats): QuizSessionStats {
  return {
    ...stats,
    answered: stats.answered + 1,
    currentStreak: 0,
  };
}

export function recordAbandonedQuestion(stats: QuizSessionStats): QuizSessionStats {
  return {
    ...stats,
    currentStreak: 0,
  };
}

export function recordAnsweredMiss(stats: QuizSessionStats): QuizSessionStats {
  return {
    ...stats,
    answered: stats.answered + 1,
    currentStreak: 0,
  };
}

export function recordQuestionAbandon(
  stats: QuizSessionStats,
  exercise: SessionEngagement,
  abandonIncomplete: boolean,
): QuizSessionStats {
  if (!abandonIncomplete || exercise.completed) {
    return stats;
  }
  if (exercise.hadCorrectStage) {
    return recordAnsweredMiss(stats);
  }
  if (exercise.hasEngaged) {
    return recordAbandonedQuestion(stats);
  }
  return stats;
}
