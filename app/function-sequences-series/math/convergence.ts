export type SequenceId =
  | 'linear'
  | 'power'
  | 'oscillation'
  | 'near'
  | 'far'
  | 'shifted-oscillation';

export type Interval = {
  left: number;
  right: number;
  leftClosed: boolean;
  rightClosed: boolean;
};

export type ConvergenceKind = 'uniform' | 'pointwise' | 'fails-pointwise';

const sequenceIds: SequenceId[] = [
  'linear', 'power', 'oscillation', 'near', 'far', 'shifted-oscillation',
];

function assertSequenceId(id: SequenceId): void {
  if (!sequenceIds.includes(id)) throw new RangeError(`Unsupported sequence: ${id}`);
}

function assertInterval(domain: Interval): void {
  if (!domain || typeof domain.left !== 'number' || typeof domain.right !== 'number'
    || Number.isNaN(domain.left) || Number.isNaN(domain.right)
    || domain.left === Infinity || domain.right === -Infinity
    || domain.left >= domain.right
    || typeof domain.leftClosed !== 'boolean'
    || typeof domain.rightClosed !== 'boolean'
    || (domain.left === -Infinity && domain.leftClosed)
    || (domain.right === Infinity && domain.rightClosed)) {
    throw new RangeError('Expected a nonempty interval with ordered, valid endpoints.');
  }
}

function assertN(n: number): void {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n must be a positive integer.');
}

function assertNonnegativeDomain(id: SequenceId, domain: Interval): void {
  if ((id === 'power' || id === 'near' || id === 'far') && domain.left < 0) {
    throw new RangeError(`${id} is only defined on nonnegative domains.`);
  }
}

export function inInterval(x: number, domain: Interval): boolean {
  assertInterval(domain);
  if (!Number.isFinite(x)) return false;
  return (x > domain.left || (x === domain.left && domain.leftClosed))
    && (x < domain.right || (x === domain.right && domain.rightClosed));
}

export function sequenceValue(id: SequenceId, n: number, x: number): number {
  assertSequenceId(id);
  assertN(n);
  if (!Number.isFinite(x)) throw new RangeError('x must be finite.');
  if ((id === 'power' || id === 'near' || id === 'far') && x < 0) {
    throw new RangeError(`${id} is only defined for x >= 0.`);
  }
  switch (id) {
    case 'linear': return x / n;
    case 'power': return x ** n;
    case 'oscillation': return Math.sin(n * x) / n;
    case 'near': return (n * x) / (1 + n * n * x * x);
    case 'far': return (x * x) / (n * n + x * x);
    case 'shifted-oscillation': return x + Math.sin(n * x) / n;
  }
}

export function pointwiseLimit(id: SequenceId, x: number): number | null {
  assertSequenceId(id);
  if (!Number.isFinite(x)) throw new RangeError('x must be finite.');
  if ((id === 'power' || id === 'near' || id === 'far') && x < 0) {
    throw new RangeError(`${id} is only defined for x >= 0.`);
  }
  if (id === 'power') {
    if (x > 1) return null;
    if (x === 1) return 1;
    return 0;
  }
  switch (id) {
    case 'linear': case 'oscillation': case 'near': case 'far': return 0;
    case 'shifted-oscillation': return x;
  }
}

export function intervalLatex(domain: Interval): string {
  assertInterval(domain);
  const left = domain.left === -Infinity ? '-\\infty' : String(domain.left);
  const right = domain.right === Infinity ? '\\infty' : String(domain.right);
  return `${domain.leftClosed ? '[' : '('}${left},${right}${domain.rightClosed ? ']' : ')'}`;
}

export function classifyConvergence(id: SequenceId, domain: Interval): ConvergenceKind {
  assertSequenceId(id);
  assertInterval(domain);
  assertNonnegativeDomain(id, domain);
  if (id === 'power') {
    if (domain.right < 1) return 'uniform';
    if (domain.right === 1) return 'pointwise';
    return 'fails-pointwise';
  }
  if (id === 'near') return domain.left > 0 ? 'uniform' : 'pointwise';
  if (id === 'far') return domain.right !== Infinity ? 'uniform' : 'pointwise';
  if (id === 'linear') {
    return Number.isFinite(domain.left) && Number.isFinite(domain.right) ? 'uniform' : 'pointwise';
  }
  return 'uniform';
}

function endpointAbs(domain: Interval, value: (x: number) => number): number {
  return Math.max(
    Number.isFinite(domain.left) ? Math.abs(value(domain.left)) : 0,
    Number.isFinite(domain.right) ? Math.abs(value(domain.right)) : 0,
  );
}

function oscillationSup(n: number, domain: Interval): number {
  if (!Number.isFinite(domain.left) || !Number.isFinite(domain.right)) return 1 / n;
  const firstPeak = Math.ceil((n * domain.left - Math.PI / 2) / Math.PI);
  const peak = (Math.PI / 2 + firstPeak * Math.PI) / n;
  if (domain.left < peak && peak < domain.right) return 1 / n;
  return endpointAbs(domain, (x) => Math.sin(n * x) / n);
}

export function supremumError(id: SequenceId, n: number, domain: Interval): number | null {
  assertSequenceId(id);
  assertN(n);
  assertInterval(domain);
  assertNonnegativeDomain(id, domain);
  if (classifyConvergence(id, domain) === 'fails-pointwise') return null;
  switch (id) {
    case 'linear':
      if (!Number.isFinite(domain.left) || !Number.isFinite(domain.right)) return Infinity;
      return endpointAbs(domain, (x) => x / n);
    case 'power': return domain.right ** n;
    case 'oscillation': case 'shifted-oscillation': return oscillationSup(n, domain);
    case 'near': {
      const f = (x: number) => (n * x) / (1 + n * n * x * x);
      let result = endpointAbs(domain, f);
      if (domain.left < 1 / n && 1 / n < domain.right) result = 1 / 2;
      return result;
    }
    case 'far': {
      if (domain.right === Infinity) return 1;
      const x = domain.right;
      return (x * x) / (n * n + x * x);
    }
  }
}

export function witnessX(id: SequenceId, n: number): number | null {
  assertSequenceId(id);
  assertN(n);
  switch (id) {
    case 'power': return 2 ** (-1 / n);
    case 'near': return 1 / n;
    case 'far': case 'linear': return n;
    case 'oscillation': case 'shifted-oscillation': return null;
  }
}

export function sequenceLatex(id: SequenceId): string {
  assertSequenceId(id);
  switch (id) {
    case 'linear': return '\\frac{x}{n}';
    case 'power': return 'x^n';
    case 'oscillation': return '\\frac{\\sin(nx)}{n}';
    case 'near': return '\\frac{nx}{1+n^2x^2}';
    case 'far': return '\\frac{x^2}{n^2+x^2}';
    case 'shifted-oscillation': return 'x+\\frac{\\sin(nx)}{n}';
  }
}

export function limitLatex(id: SequenceId, domain: Interval): string {
  assertSequenceId(id);
  assertInterval(domain);
  assertNonnegativeDomain(id, domain);
  if (id === 'power' && domain.right > 1) return '\\nexists f:D\\to\\mathbb{R}';
  if (id === 'power' && domain.right === 1 && domain.rightClosed) {
    return 'f(x)=\\begin{cases}0,&x<1\\\\1,&x=1\\end{cases}';
  }
  return id === 'shifted-oscillation' ? 'f(x)=x' : 'f(x)=0';
}
