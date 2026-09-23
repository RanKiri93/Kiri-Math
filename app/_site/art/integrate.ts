import type { Point } from "./geometry";

export type Bounds = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export type VectorField = (point: Point) => Point;

function inside(point: Point, bounds: Bounds): boolean {
  return point.x >= bounds.xMin && point.x <= bounds.xMax && point.y >= bounds.yMin && point.y <= bounds.yMax;
}

function finite(point: Point): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

/**
 * Fixed-step RK4. Stops when the next point would leave `bounds` or a stage is non-finite.
 * Integrate backward with a negative `h`.
 */
export function integrate(f: VectorField, start: Point, h: number, maxSteps: number, bounds: Bounds): Point[] {
  const points: Point[] = [start];
  let point = start;
  for (let step = 0; step < maxSteps; step += 1) {
    const k1 = f(point);
    if (!finite(k1)) {
      break;
    }
    const k2 = f({ x: point.x + (h * k1.x) / 2, y: point.y + (h * k1.y) / 2 });
    const k3 = f({ x: point.x + (h * k2.x) / 2, y: point.y + (h * k2.y) / 2 });
    const k4 = f({ x: point.x + h * k3.x, y: point.y + h * k3.y });
    if (!finite(k2) || !finite(k3) || !finite(k4)) {
      break;
    }
    const next = {
      x: point.x + (h / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
      y: point.y + (h / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    };
    if (!finite(next) || !inside(next, bounds)) {
      break;
    }
    points.push(next);
    point = next;
  }
  return points;
}
