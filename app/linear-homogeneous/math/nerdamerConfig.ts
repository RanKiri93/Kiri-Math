import nerdamer from "nerdamer";
import "nerdamer/Algebra.js";

/**
 * Nerdamer configuration and evaluation safety for exact symbolic constants.
 *
 * Policy:
 * - Euler's number and pi remain SYMBOLIC during algebra / display.
 * - Ordinary numeric literals may still be rationalized (e.g. 0.5 -> 1/2).
 * - Numerical evaluation is allowed, but must not permanently mutate nerdamer's
 *   symbolic mode.
 *
 * Library workaround:
 * nerdamer's internal `block('PARSE2NUMBER', ...)` does not use try/finally.
 * If `.evaluate()` throws (e.g. division by zero at a sample point),
 * Settings.PARSE2NUMBER can remain true. Subsequent parses then substitute
 * e -> Math.E and pi -> Math.PI, which Fraction.convert rationalizes into huge
 * integer ratios such as 325368125/119696244.
 *
 * Do NOT enable Settings.E_TO_EXP: nerdamer's expand() mis-handles differences
 * of equal exp(...) terms under that flag (e.g. W(y, c*y) becomes nonzero).
 */

const nerdamerSettings = nerdamer as typeof nerdamer & {
  set: (key: string, value: unknown) => void;
  get: (key: string) => unknown;
};

/** Call once (and after any evaluate that may throw) to keep e/pi exact. */
export function ensureSymbolicNerdamerMode(): void {
  if (nerdamerSettings.get("PARSE2NUMBER") === true) {
    nerdamerSettings.set("PARSE2NUMBER", false);
  }
}

ensureSymbolicNerdamerMode();

type Evaluable = {
  evaluate: (substitutions?: Record<string, string>) => { text: () => string };
};

/**
 * Numerically evaluate without leaving nerdamer stuck in PARSE2NUMBER mode.
 * Use this instead of raw `.evaluate()` anywhere sample-point checks can throw.
 */
export function safeEvaluate(
  expression: Evaluable,
  substitutions?: Record<string, string>,
): string {
  ensureSymbolicNerdamerMode();
  try {
    return expression.evaluate(substitutions).text();
  } finally {
    // Restore even when evaluate throws (nerdamer's block() does not).
    ensureSymbolicNerdamerMode();
  }
}

/** True if a string looks like a rationalized approximation of e or pi. */
export function looksLikeRationalizedConstant(expression: string): boolean {
  // Huge integer bases / coefficients produced by Fraction.convert(Math.E/PI).
  return /\d{8,}/.test(expression.replace(/\s+/g, ""));
}
