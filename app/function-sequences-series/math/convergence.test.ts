import { describe, expect, it } from 'vitest';
import {
  classifyConvergence,
  inInterval,
  intervalLatex,
  limitLatex,
  pointwiseLimit,
  sequenceLatex,
  sequenceValue,
  supremumError,
  witnessX,
  type Interval,
} from './convergence';

const interval = (
  left: number,
  right: number,
  leftClosed = true,
  rightClosed = true,
): Interval => ({ left, right, leftClosed, rightClosed });

describe('curated sequence convergence', () => {
  it('evaluates every curated sequence and its finite pointwise limit', () => {
    expect(sequenceValue('linear', 4, 2)).toBe(0.5);
    expect(sequenceValue('power', 3, 2)).toBe(8);
    expect(sequenceValue('oscillation', 2, Math.PI / 4)).toBeCloseTo(0.5);
    expect(sequenceValue('near', 2, 0.5)).toBeCloseTo(0.5);
    expect(sequenceValue('far', 2, 2)).toBe(0.5);
    expect(sequenceValue('shifted-oscillation', 2, Math.PI / 4)).toBeCloseTo(Math.PI / 4 + 0.5);
    for (const id of ['linear', 'power', 'oscillation', 'near', 'far'] as const) {
      expect(pointwiseLimit(id, 0.4)).toBe(0);
    }
    expect(pointwiseLimit('shifted-oscillation', -3)).toBe(-3);
    expect(pointwiseLimit('power', 1)).toBe(1);
    expect(pointwiseLimit('power', 1.1)).toBeNull();
  });

  it('classifies power sequences at the endpoint and beyond', () => {
    expect(classifyConvergence('power', interval(0, 0.9))).toBe('uniform');
    expect(classifyConvergence('power', interval(0, 1))).toBe('pointwise');
    expect(classifyConvergence('power', interval(0, 1, true, false))).toBe('pointwise');
    expect(classifyConvergence('power', interval(0, 1.2))).toBe('fails-pointwise');
    expect(supremumError('power', 4, interval(0, 0.5))).toBe(0.5 ** 4);
    expect(supremumError('power', 7, interval(0, 1))).toBe(1);
    expect(supremumError('power', 7, interval(0, 1, true, false))).toBe(1);
    expect(supremumError('power', 4, interval(0, 2))).toBeNull();
    expect(limitLatex('power', interval(0, 1))).toContain('x=1');
    expect(limitLatex('power', interval(0, 1, true, false))).toBe('f(x)=0');
  });

  it('distinguishes uniform and pointwise convergence for near and far', () => {
    expect(classifyConvergence('near', interval(0, 2))).toBe('pointwise');
    expect(classifyConvergence('near', interval(0, 2, false, true))).toBe('pointwise');
    expect(classifyConvergence('near', interval(0.2, 2))).toBe('uniform');
    expect(supremumError('near', 4, interval(0, Infinity, true, false))).toBe(0.5);
    expect(supremumError('near', 4, interval(1, Infinity, true, false))).toBeCloseTo(4 / 17);
    expect(classifyConvergence('far', interval(0, Infinity, true, false))).toBe('pointwise');
    expect(classifyConvergence('far', interval(0, 3))).toBe('uniform');
    expect(supremumError('far', 2, interval(0, Infinity, true, false))).toBe(1);
    expect(supremumError('far', 2, interval(0, 3))).toBe(9 / 13);
  });

  it('computes linear and oscillatory suprema on bounded and unbounded intervals', () => {
    expect(supremumError('linear', 2, interval(-3, 4))).toBe(2);
    expect(supremumError('linear', 2, interval(-Infinity, 4, false, true))).toBe(Infinity);
    expect(classifyConvergence('linear', interval(-Infinity, Infinity, false, false))).toBe('pointwise');
    expect(classifyConvergence('linear', interval(0, Infinity, true, false))).toBe('pointwise');
    expect(supremumError('linear', 2, interval(-Infinity, Infinity, false, false))).toBe(Infinity);
    expect(supremumError('linear', 2, interval(0, Infinity, true, false))).toBe(Infinity);
    expect(supremumError('oscillation', 2, interval(0, Math.PI))).toBe(0.5);
    expect(supremumError('oscillation', 2, interval(0, 0.1))).toBeCloseTo(Math.sin(0.2) / 2);
    expect(supremumError('oscillation', 3, interval(-Infinity, Infinity, false, false))).toBe(1 / 3);
    expect(supremumError('shifted-oscillation', 3, interval(-1, 1))).toBe(1 / 3);
    expect(classifyConvergence('linear', interval(-Infinity, Infinity, false, false))).toBe('pointwise');
    expect(classifyConvergence('shifted-oscillation', interval(-Infinity, Infinity, false, false))).toBe('uniform');
  });

  it('provides exact witness locations and display strings', () => {
    expect(witnessX('power', 2)).toBe(2 ** -0.5);
    expect(witnessX('near', 4)).toBe(0.25);
    expect(witnessX('far', 4)).toBe(4);
    expect(witnessX('linear', 4)).toBe(4);
    expect(witnessX('oscillation', 4)).toBeNull();
    expect(sequenceLatex('shifted-oscillation')).toBe('x+\\frac{\\sin(nx)}{n}');
    expect(intervalLatex(interval(0, Infinity, true, false))).toBe('[0,\\infty)');
    expect(limitLatex('power', interval(0.5, 1))).toBe('f(x)=\\begin{cases}0,&x<1\\\\1,&x=1\\end{cases}');
    expect(limitLatex('power', interval(0, 1.5))).toBe('\\nexists f:D\\to\\mathbb{R}');
  });

  it('respects interval endpoint membership and validates unsupported inputs', () => {
    expect(inInterval(0, interval(0, 1, true, false))).toBe(true);
    expect(inInterval(1, interval(0, 1, true, false))).toBe(false);
    expect(inInterval(0, interval(0, 1, false, true))).toBe(false);
    expect(() => sequenceValue('power', 0, 0.5)).toThrow(RangeError);
    expect(() => sequenceValue('linear', 1.5, 0.5)).toThrow(RangeError);
    expect(() => sequenceValue('near', 1, -0.5)).toThrow(RangeError);
    expect(() => pointwiseLimit('far', -1)).toThrow(RangeError);
    expect(() => classifyConvergence('power', interval(-1, 0.5))).toThrow(RangeError);
    expect(() => classifyConvergence('linear', interval(1, 1))).toThrow(RangeError);
    expect(() => inInterval(0, interval(0, Infinity, true, true))).toThrow(RangeError);
    expect(() => inInterval(0, { ...interval(0, 1), left: '0' as unknown as number })).toThrow(RangeError);
  });
});
