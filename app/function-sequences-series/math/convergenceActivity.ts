import { inInterval, sequenceValue, type Interval } from "./convergence";

export type TrackingRule = "fixed" | "reciprocal" | "index";
export type RepairDomain = "full" | "away" | "bounded" | "open";
export type PairId = "near" | "far";

export const MAX_DISPLAY_N = 256;
export const UNIT_INTERVAL: Interval = { left: 0, right: 1, leftClosed: true, rightClosed: true };
export const POSITIVE_RAY: Interval = { left: 0, right: Infinity, leftClosed: true, rightClosed: false };
export const REAL_LINE: Interval = { left: -Infinity, right: Infinity, leftClosed: false, rightClosed: false };

export function trackingPoint(rule: TrackingRule, n: number, fixed: number): number {
  return rule === "reciprocal" ? 1 / n : rule === "index" ? n : fixed;
}

export function repairedDomain(kind: RepairDomain, delta: number, bound: number): Interval {
  if (!(delta > 0) || !Number.isFinite(delta) || !(bound > 0) || !Number.isFinite(bound)) {
    throw new RangeError("Domain parameters must be positive and finite.");
  }
  switch (kind) {
    case "full": return POSITIVE_RAY;
    case "away": return { ...POSITIVE_RAY, left: delta };
    case "bounded": return { ...UNIT_INTERVAL, right: bound };
    case "open": return { ...POSITIVE_RAY, leftClosed: false };
  }
}

/** This checks one observed escape, never a convergence claim or an infinite tail. */
export function checkEscape(id: PairId, n: number, x: number, domain: Interval, epsilon: number) {
  if (!Number.isFinite(epsilon) || epsilon <= 0) throw new RangeError("Invalid epsilon.");
  if (!inInterval(x, domain)) return "outside-domain" as const;
  return sequenceValue(id, n, x) >= epsilon ? "escape" as const : "inside-band" as const;
}

/** Exact family identities, not agreement at finitely many displayed indices. */
export function isPersistentWitness(id: PairId, rule: TrackingRule): boolean {
  return rule === (id === "near" ? "reciprocal" : "index");
}
