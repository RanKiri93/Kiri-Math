import { describe, expect, it } from 'vitest';
import {
  checkEscape, isPersistentWitness, repairedDomain, trackingPoint,
  type PairId, type RepairDomain, type TrackingRule,
} from './convergenceActivity';
import { classifyConvergence, sequenceValue } from './convergence';

const ALL_N = Array.from({ length: 256 }, (_, i) => i + 1);
const ids: PairId[] = ['near', 'far'];
const rules: TrackingRule[] = ['fixed', 'reciprocal', 'index'];

describe('paired convergence activity mathematical checks', () => {
  it('tracks points according to all three rules without confusing a one-index coincidence with persistence', () => {
    for (const n of ALL_N) {
      expect(trackingPoint('fixed', n, 2.5)).toBe(2.5);
      expect(trackingPoint('reciprocal', n, 2.5)).toBe(1 / n);
      expect(trackingPoint('index', n, 2.5)).toBe(n);
    }
    // At n=1, all displayed coordinates coincide; only family identities determine persistence.
    for (const id of ids) for (const rule of rules) {
      expect(isPersistentWitness(id, rule), `${id} with ${rule}`).toBe(
        (id === 'near' && rule === 'reciprocal') || (id === 'far' && rule === 'index'),
      );
    }
    for (const n of ALL_N) {
      const a = sequenceValue('near', n, trackingPoint('reciprocal', n, 0));
      const b = sequenceValue('far', n, trackingPoint('index', n, 0));
      expect(a, `near n=${n} at x=1/n`).toBeCloseTo(0.5, 14);
      expect(b, `far n=${n} at x=n`).toBe(0.5);
      expect(Number.isFinite(a) && Number.isFinite(b)).toBe(true);
    }
  });

  it('uses an inclusive epsilon escape threshold and rejects points outside the domain', () => {
    const domain = { left: 0, right: Infinity, leftClosed: true, rightClosed: false };
    expect(checkEscape('near', 4, 0.25, domain, 0.5)).toBe('escape');
    expect(checkEscape('far', 4, 4, domain, 0.5)).toBe('escape');
    expect(checkEscape('near', 4, 0.2, domain, 0.5)).toBe('inside-band');
    expect(checkEscape('far', 4, 0.2, domain, 0.5)).toBe('inside-band');
    expect(checkEscape('near', 4, 0, { ...domain, leftClosed: false }, 0.1)).toBe('outside-domain');
    expect(checkEscape('near', 4, 0.5, { ...domain, right: 0.5, rightClosed: false }, 0.1)).toBe('outside-domain');
    expect(() => checkEscape('near', 4, 1, domain, 0)).toThrow(RangeError);
  });

  it('constructs all four repair domains and classifies the actual resulting sets', () => {
    const cases: [RepairDomain, number, number, number, number, boolean, boolean, ReturnType<typeof classifyConvergence>, ReturnType<typeof classifyConvergence>][] = [
      ['full', 0.5, 4, 0, Infinity, true, false, 'pointwise', 'pointwise'],
      ['away', 0.5, 4, 0.5, Infinity, true, false, 'uniform', 'pointwise'],
      ['bounded', 0.5, 4, 0, 4, true, true, 'pointwise', 'uniform'],
      ['open', 0.5, 4, 0, Infinity, false, false, 'pointwise', 'pointwise'],
    ];
    for (const [kind, delta, bound, left, right, leftClosed, rightClosed, nearKind, farKind] of cases) {
      const domain = repairedDomain(kind, delta, bound);
      expect(domain, `${kind} repaired interval`).toEqual({ left, right, leftClosed, rightClosed });
      expect(classifyConvergence('near', domain), `${kind}: near`).toBe(nearKind);
      expect(classifyConvergence('far', domain), `${kind}: far`).toBe(farKind);
    }
    expect(() => repairedDomain('away', 0, 4)).toThrow(RangeError);
    expect(() => repairedDomain('bounded', 0.5, Infinity)).toThrow(RangeError);
  });
});
