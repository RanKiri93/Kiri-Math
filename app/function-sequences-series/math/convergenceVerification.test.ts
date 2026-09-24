import { describe, expect, it } from 'vitest';
import katex from 'katex';
import {
  classifyConvergence, intervalLatex, limitLatex, pointwiseLimit,
  sequenceLatex, sequenceValue, supremumError, type Interval, type SequenceId,
} from './convergence';

const I = (left: number, right: number, leftClosed = true, rightClosed = true): Interval =>
  ({ left, right, leftClosed, rightClosed });
const ids: SequenceId[] = ['linear', 'power', 'oscillation', 'near', 'far', 'shifted-oscillation'];

describe('convergence model independent mathematical audit', () => {
  it('matches the stated pointwise limits at every fixed test point for n=1..256', () => {
    const points: Record<SequenceId, number[]> = {
      linear: [-7, 0, 0.25, 3], power: [0, 0.25, 0.9, 1],
      oscillation: [-7, -0.4, 0, 0.25, 3], near: [0, 0.1, 0.25, 3],
      far: [0, 0.1, 0.25, 3], 'shifted-oscillation': [-7, -0.4, 0, 0.25, 3],
    };
    for (const id of ids) for (const x of points[id]) {
      const expected = id === 'shifted-oscillation' ? x : id === 'power' && x === 1 ? 1 : 0;
      expect(pointwiseLimit(id, x), `${id}, x=${x}`).toBe(expected);
      for (let n = 1; n <= 256; n++) {
        const value = sequenceValue(id, n, x);
        expect(Number.isFinite(value), `${id}, n=${n}, x=${x}`).toBe(true);
        if (id !== 'power' || x <= 1) {
          const error = Math.abs(value - expected);
          expect(Number.isFinite(error), `${id} error n=${n}, x=${x}`).toBe(true);
          if (id === 'oscillation' || id === 'shifted-oscillation') {
            expect(error).toBeLessThanOrEqual(1 / n + 1e-12);
          }
        }
      }
    }
  });

  it('classifies all families correctly on bounded, open, and unbounded domains', () => {
    const cases: [SequenceId, Interval, ReturnType<typeof classifyConvergence>][] = [
      ['linear', I(-2, 3), 'uniform'], ['linear', I(-Infinity, 3, false, false), 'pointwise'],
      ['linear', I(0, Infinity, true, false), 'pointwise'],
      ['power', I(0, 0.999), 'uniform'], ['power', I(0, 1, true, false), 'pointwise'],
      ['power', I(0.2, 1), 'pointwise'], ['power', I(0, 1.001), 'fails-pointwise'],
      ['oscillation', I(-Infinity, Infinity, false, false), 'uniform'],
      ['near', I(0, 2), 'pointwise'], ['near', I(0, 2, false, true), 'pointwise'],
      ['near', I(0.0001, Infinity, false, false), 'uniform'],
      ['far', I(0, 100), 'uniform'], ['far', I(0, Infinity, true, false), 'pointwise'],
      ['shifted-oscillation', I(-Infinity, Infinity, false, false), 'uniform'],
    ];
    for (const [id, domain, expected] of cases)
      expect(classifyConvergence(id, domain), `${id} on ${JSON.stringify(domain)}`).toBe(expected);
  });

  it('returns the exact supremum-error formulas including unattained endpoint/critical-point suprema', () => {
    const domains = [I(0, 1), I(0, 1, true, false), I(0.25, 1, false, false), I(0, 3, false, false), I(0, Infinity, true, false), I(-Infinity, Infinity, false, false)];
    for (let n = 1; n <= 256; n++) {
      expect(supremumError('linear', n, I(-3, 5, false, false))).toBe(5 / n);
      expect(supremumError('linear', n, I(-Infinity, 5, false, false))).toBe(Infinity);
      expect(supremumError('power', n, I(0, 0.75))).toBe(0.75 ** n);
      expect(supremumError('power', n, I(0, 1, true, false))).toBe(1);
      expect(supremumError('near', n, I(0, Infinity, true, false))).toBe(0.5);
      expect(supremumError('far', n, I(0, Infinity, true, false))).toBe(1);
      expect(supremumError('far', n, I(0, 4, true, false))).toBe(16 / (n * n + 16));
      expect(supremumError('oscillation', n, I(-Infinity, Infinity, false, false))).toBe(1 / n);
      expect(supremumError('shifted-oscillation', n, I(-Infinity, Infinity, false, false))).toBe(1 / n);
      for (const d of domains) {
        for (const id of ['oscillation', 'shifted-oscillation'] as const) {
          const sup = supremumError(id, n, d)!;
          expect(sup).toBeGreaterThanOrEqual(0);
          expect(sup).toBeLessThanOrEqual(1 / n + 1e-12);
        }
      }
      // The critical point of n*x/(1+n²x²) is a supremum even when it is an excluded endpoint.
      expect(supremumError('near', n, I(1 / n, 2 / n, false, false))).toBeCloseTo(0.5, 14);
      expect(supremumError('near', n, I(1 / n + 0.01, Infinity, false, false))).toBeCloseTo(n * (1 / n + 0.01) / (1 + n * n * (1 / n + 0.01) ** 2), 12);
    }
    expect(supremumError('power', 8, I(0, 1.01))).toBeNull();
  });

  it('keeps display strings mathematically renderable by KaTeX', () => {
    for (const id of ids) expect(() => katex.renderToString(sequenceLatex(id), { throwOnError: true }), id).not.toThrow();
    for (const domain of [I(0, 1), I(0, 1, true, false), I(0, Infinity, true, false)]) {
      expect(() => katex.renderToString(intervalLatex(domain), { throwOnError: true })).not.toThrow();
      expect(() => katex.renderToString(limitLatex('power', domain), { throwOnError: true })).not.toThrow();
    }
  });
});
