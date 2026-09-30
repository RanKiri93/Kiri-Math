import { describe, expect, it } from 'vitest';
import {
  checkEscape, isPersistentWitness, REPAIR_CHOICES, repairedDomain, trackingPoint,
  type PairId, type RepairDomain, type TrackingRule,
} from './convergenceActivity';
import { classifyConvergence, inInterval, intervalLatex, sequenceValue, supremumError } from './convergence';

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

  it('offers concrete domain choices whose classification matches an escaping witness or a vanishing supremum', () => {
    expect(REPAIR_CHOICES.near.map(intervalLatex)).toEqual(['[0,1]', String.raw`(0,\infty)`, String.raw`[1,\infty)`, '(0,1)', String.raw`[0,\infty)`, '(0,10]']);
    expect(REPAIR_CHOICES.far.map(intervalLatex)).toEqual(['[0,1]', String.raw`(0,\infty)`, String.raw`[1,\infty)`, String.raw`(1,\infty)`, String.raw`[0,\infty)`, String.raw`[10,\infty)`]);
    const expected: Record<PairId, ReturnType<typeof classifyConvergence>[]> = {
      near: ['pointwise', 'pointwise', 'uniform', 'pointwise', 'pointwise', 'pointwise'],
      far: ['uniform', 'pointwise', 'pointwise', 'pointwise', 'pointwise', 'pointwise'],
    };
    // Exactly one correct answer per sequence, at the index the reveal button selects.
    const revealed: Record<PairId, number> = { near: 2, far: 0 };
    for (const id of ids) {
      const correct = REPAIR_CHOICES[id].flatMap((domain, index) => classifyConvergence(id, domain) === 'uniform' ? [index] : []);
      expect(correct, `${id} correct answers`).toEqual([revealed[id]]);
    }
    for (const id of ids) REPAIR_CHOICES[id].forEach((domain, index) => {
      const kind = classifyConvergence(id, domain);
      expect(kind, `${id} on ${intervalLatex(domain)}`).toBe(expected[id][index]);
      if (kind === 'uniform') {
        expect(supremumError(id, 256, domain)!, `${id} sup on ${intervalLatex(domain)}`).toBeLessThan(0.01);
      } else {
        // Non-uniform: the moving witness stays in the domain with height 1/2 for every large n.
        for (const n of ALL_N.slice(9)) {
          const x = id === 'near' ? 1 / n : n;
          expect(inInterval(x, domain), `${id} witness at n=${n}`).toBe(true);
          expect(sequenceValue(id, n, x)).toBeCloseTo(0.5, 12);
        }
      }
    });
  });
});
