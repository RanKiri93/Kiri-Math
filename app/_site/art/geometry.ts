export type Point = { readonly x: number; readonly y: number };

/** Math rectangle drawn into a viewBox rectangle. Y is flipped. */
export type Frame = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  left: number;
  top: number;
  width: number;
  height: number;
};

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function plotFrame(
  view: { left: number; top: number; width: number; height: number },
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
): Frame {
  return { xMin, xMax, yMin, yMax, ...view };
}

/** A frame whose math units have the same scale on both axes, origin centered. */
export function equalScaleFrame(
  view: { left: number; top: number; width: number; height: number },
  radius: number,
  pad = 1.08,
): Frame {
  const mathHeight = 2 * radius * pad;
  const mathWidth = mathHeight * (view.width / view.height);
  return plotFrame(view, -mathWidth / 2, mathWidth / 2, -mathHeight / 2, mathHeight / 2);
}

export function mapPoint(frame: Frame, x: number, y: number): Point {
  const sx = frame.width / (frame.xMax - frame.xMin);
  const sy = frame.height / (frame.yMax - frame.yMin);
  return {
    x: frame.left + (x - frame.xMin) * sx,
    y: frame.top + frame.height - (y - frame.yMin) * sy,
  };
}

export function pathFromPoints(points: readonly Point[]): string {
  if (points.length === 0) {
    return "";
  }
  const fmt = (point: Point) => `${round1(point.x)} ${round1(point.y)}`;
  const [first, ...rest] = points;
  return [`M ${fmt(first)}`, ...rest.map((point) => `L ${fmt(point)}`)].join(" ");
}

export function pathFromMath(frame: Frame, points: readonly Point[]): string {
  return pathFromPoints(points.map((point) => mapPoint(frame, point.x, point.y)));
}

/** ViewBox angle: 0 points right, and y grows downward. */
export function directionAngle(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/** Two segments at ±25° from the reversed direction. Not an SVG marker. */
export function chevronPath(tip: Point, direction: number, length: number): string {
  const wing = (25 * Math.PI) / 180;
  const reversed = direction + Math.PI;
  const end = (angle: number): Point => ({
    x: tip.x + length * Math.cos(angle),
    y: tip.y + length * Math.sin(angle),
  });
  return pathFromPoints([end(reversed + wing), tip, end(reversed - wing)]);
}

export function chevronFromMath(frame: Frame, from: Point, to: Point, length: number): string {
  const start = mapPoint(frame, from.x, from.y);
  const tip = mapPoint(frame, to.x, to.y);
  return chevronPath(tip, directionAngle(start, tip), length);
}

function segmentDiskHits(a: Point, b: Point, center: Point, radius: number): Point[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const fx = a.x - center.x;
  const fy = a.y - center.y;
  const aa = dx * dx + dy * dy;
  if (aa === 0) {
    return [];
  }
  const bb = 2 * (fx * dx + fy * dy);
  const cc = fx * fx + fy * fy - radius * radius;
  const disc = bb * bb - 4 * aa * cc;
  if (disc < 0) {
    return [];
  }
  const root = Math.sqrt(disc);
  const hits: { t: number; point: Point }[] = [];
  for (const t of [(-bb - root) / (2 * aa), (-bb + root) / (2 * aa)]) {
    if (t >= -1e-9 && t <= 1 + 1e-9) {
      const clamped = Math.min(1, Math.max(0, t));
      hits.push({
        t: clamped,
        point: { x: a.x + clamped * dx, y: a.y + clamped * dy },
      });
    }
  }
  hits.sort((left, right) => left.t - right.t);
  return hits.map((hit) => hit.point);
}

function insideDisk(point: Point, center: Point, radius: number): boolean {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return dx * dx + dy * dy <= radius * radius + 1e-8;
}

export function clipPolylineToDisk(points: readonly Point[], center: Point, radius: number): Point[][] {
  const runs: Point[][] = [];
  let current: Point[] = [];
  const push = (point: Point) => {
    const last = current[current.length - 1];
    if (!last || last.x !== point.x || last.y !== point.y) {
      current.push(point);
    }
  };
  const flush = () => {
    if (current.length >= 2) {
      runs.push(current);
    }
    current = [];
  };

  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index];
    const b = points[index + 1];
    const aIn = insideDisk(a, center, radius);
    const bIn = insideDisk(b, center, radius);
    const hits = segmentDiskHits(a, b, center, radius);
    if (aIn && bIn) {
      push(a);
      push(b);
    } else if (aIn && !bIn) {
      push(a);
      if (hits.length > 0) {
        push(hits[hits.length - 1]);
      }
      flush();
    } else if (!aIn && bIn) {
      flush();
      if (hits.length > 0) {
        push(hits[0]);
      }
      push(b);
    } else if (hits.length >= 2) {
      flush();
      push(hits[0]);
      push(hits[1]);
      flush();
    }
  }
  flush();
  return runs;
}

/** Drops non-finite samples and splits a run when the graph jumps (a pole). */
export function sampleGraph(
  xs: readonly number[],
  f: (x: number) => number,
  yMin: number,
  yMax: number,
): Point[][] {
  const span = yMax - yMin;
  const runs: Point[][] = [];
  let run: Point[] = [];
  const flush = () => {
    if (run.length >= 2) {
      runs.push(run);
    }
    run = [];
  };
  for (const x of xs) {
    const y = f(x);
    const last = run[run.length - 1];
    const jumped = last !== undefined && Number.isFinite(y) && Math.abs(y - last.y) > span * 0.5;
    if (!Number.isFinite(y) || y < yMin || y > yMax || jumped) {
      flush();
      continue;
    }
    run.push({ x, y });
  }
  flush();
  return runs;
}

export function sampleCount(min: number, max: number, count: number): number[] {
  if (count < 2) {
    return [min];
  }
  return Array.from({ length: count }, (_, index) => min + ((max - min) * index) / (count - 1));
}
