import {
  chevronFromMath,
  clipPolylineToDisk,
  equalScaleFrame,
  mapPoint,
  pathFromMath,
  pathFromPoints,
  plotFrame,
  round1,
  sampleCount,
  sampleGraph,
  type Frame,
  type Point,
} from "../_site/art/geometry";
import type { ArtPiece, ArtStroke, ArtTone, FadedEquation } from "../_site/art/types";

const DEG = Math.PI / 180;

/**
 * Empty corner of the cover, in viewBox units, reserved for the hand-drawn figure.
 * Nothing is generated there. When the SVG arrives it is inlined into this slot.
 */
export const odeCoverFigureSlot = { x: 292, y: 162, width: 176, height: 126 };

export const chapter3Families = {
  parabolaC: [-1.2, -0.45, 0.35, 0.8, 1.4],
  ellipseK: [0.8, 1.6, 2.8, 4.2],
} as const;

function stroke(d: string, tone: ArtTone, extra: Omit<ArtStroke, "d" | "tone"> = {}): ArtStroke | null {
  return d.includes("L") ? { d, tone, ...extra } : null;
}

function keep(strokes: readonly (ArtStroke | null)[]): ArtStroke[] {
  return strokes.filter((entry): entry is ArtStroke => entry !== null);
}

function graphStrokes(
  frame: Frame,
  runs: readonly (readonly Point[])[],
  tone: ArtTone,
  extra: Omit<ArtStroke, "d" | "tone"> = {},
): ArtStroke[] {
  return keep(runs.map((run) => stroke(pathFromMath(frame, run), tone, extra)));
}

function unit(angle: number): Point {
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

function scale(point: Point, factor: number): Point {
  return { x: point.x * factor, y: point.y * factor };
}

function buildCoverArt(): ArtPiece {
  const width = 480;
  const height = 300;
  return {
    width,
    height,
    strokes: [...directionFieldStrokes(), ...saddleStrokes(), ...springStrokes()],
    dots: [{ x: 146, y: 94, r: 14, tone: "blue" }],
  };
}

function saddleStrokes(): ArtStroke[] {
  const frame = equalScaleFrame({ left: 292, top: 8, width: 176, height: 142 }, 1.55);
  const center = { x: 0, y: 0 };
  const radius = 1.55;
  const unstable = unit(60 * DEG);
  const stable = unit(-20 * DEG);
  const amplitudes = [-0.8, -0.4, -0.15, 0.15, 0.4, 0.8];
  const times = sampleCount(-2.4, 2.4, 33);
  const strokes: ArtStroke[] = [];

  for (const a of amplitudes) {
    for (const b of amplitudes) {
      const samples = times.map((t) => add(scale(unstable, a * Math.exp(t)), scale(stable, b * Math.exp(-t))));
      for (const run of clipPolylineToDisk(samples, center, radius)) {
        const drawn = stroke(pathFromMath(frame, run), "rust");
        if (drawn) {
          strokes.push(drawn);
        }
      }
      const before = add(scale(unstable, a * Math.exp(-0.08)), scale(stable, b * Math.exp(0.08)));
      const after = add(scale(unstable, a * Math.exp(0.08)), scale(stable, b * Math.exp(-0.08)));
      strokes.push(stroke(chevronFromMath(frame, before, after, 6.5), "rust")!);
    }
  }

  strokes.push(...eigenLine(frame, unstable, radius, "out"));
  strokes.push(...eigenLine(frame, stable, radius, "in"));
  return strokes;
}

function eigenLine(frame: Frame, direction: Point, radius: number, sense: "out" | "in"): ArtStroke[] {
  const far = 0.98 * radius;
  const mark = 0.62 * radius;
  const line = stroke(pathFromMath(frame, [scale(direction, -far), scale(direction, far)]), "blue");
  const outward = (sign: number) => {
    const tip = scale(direction, sign * mark);
    const tail = scale(direction, sign * mark - (sense === "out" ? sign : -sign) * 0.18);
    return stroke(chevronFromMath(frame, tail, tip, 7), "blue");
  };
  return keep([line, outward(1), outward(-1)]);
}

function directionFieldStrokes(): ArtStroke[] {
  const frame = plotFrame({ left: 8, top: 168, width: 186, height: 124 }, -2.35, 2.35, -1.56, 1.56);
  const strokes: (ArtStroke | null)[] = [];
  const step = 0.48;
  const arrow = 0.34;
  for (let x = -1.7; x <= 1.7 + step / 2; x += step) {
    for (let y = -1.25; y <= 1.25 + step / 2; y += step) {
      if (x * x + y * y > 1.85 * 1.85) {
        continue;
      }
      const slope = x * x - 1;
      const norm = Math.hypot(1, slope);
      const dx = arrow / norm;
      const dy = (arrow * slope) / norm;
      strokes.push(
        stroke(
          pathFromMath(frame, [
            { x: x - dx / 2, y: y - dy / 2 },
            { x: x + dx / 2, y: y + dy / 2 },
          ]),
          "blue",
          { weight: "hair", opacity: 0.55 },
        ),
      );
    }
  }
  const cubic = sampleCount(-2.15, 2.15, 57).map((x) => ({ x, y: x ** 3 / 3 - x }));
  for (const run of clipPolylineToDisk(cubic, { x: 0, y: 0 }, 2.05)) {
    strokes.push(stroke(pathFromMath(frame, run), "rust", { weight: "bold" }));
  }
  return keep(strokes);
}

function springStrokes(): ArtStroke[] {
  const coil = sampleCount(0, 1, 73).map((t) => ({
    x: 36 + t * 96,
    y: 94 + 13 * Math.sin(t * 5.5 * 2 * Math.PI),
  }));
  return keep([
    stroke(pathFromPoints([{ x: 16, y: 108 }, { x: 168, y: 108 }]), "muted", { weight: "hair" }),
    stroke(
      pathFromPoints([
        { x: 16, y: 40 },
        { x: 32, y: 40 },
        { x: 32, y: 108 },
        { x: 16, y: 108 },
        { x: 16, y: 40 },
      ]),
      "gold",
    ),
    stroke(pathFromPoints(coil), "ink"),
  ]);
}

function buildChapter1(): ArtPiece {
  const width = 240;
  const height = 200;
  const frame = plotFrame({ left: 16, top: 12, width: 208, height: 172 }, -0.06, 1.14, -0.12, 1.18);
  const xs = sampleCount(0, 1, 41);
  const ns = [1, 2, 3, 5, 8, 13, 21];
  const strokes = graphStrokes(
    frame,
    ns.map((n) => xs.map((x) => ({ x, y: x ** n }))),
    "blue",
  );
  strokes.push(stroke(pathFromMath(frame, [{ x: 0, y: 0 }, { x: 0.97, y: 0 }]), "rust", { weight: "bold" })!);
  const limit = mapPoint(frame, 1, 1);
  return {
    width,
    height,
    strokes,
    dots: [{ x: round1(limit.x), y: round1(limit.y), r: 3.4, tone: "rust" }],
  };
}

function buildChapter2(): ArtPiece {
  const width = 280;
  const height = 160;
  const frame = plotFrame({ left: 12, top: 10, width: 256, height: 140 }, -3.2, 5.2, -0.55, 1.7);
  const xs = sampleCount(-3.2, 5.2, 97);
  const constants = [0.25, 1, 4, 12, -0.2, -0.55, -2, -8];
  const strokes = graphStrokes(
    frame,
    constants.flatMap((c) => sampleGraph(xs, (x) => 1 / (1 + c * Math.exp(-x)), frame.yMin, frame.yMax)),
    "blue",
  );
  strokes.push(
    stroke(pathFromMath(frame, [{ x: frame.xMin, y: 0 }, { x: frame.xMax, y: 0 }]), "muted", { dashed: true, weight: "hair" })!,
    stroke(pathFromMath(frame, [{ x: frame.xMin, y: 1 }, { x: frame.xMax, y: 1 }]), "muted", { dashed: true, weight: "hair" })!,
  );
  return { width, height, strokes };
}

function buildChapter3(): ArtPiece {
  const width = 240;
  const height = 200;
  const frame = equalScaleFrame({ left: 10, top: 10, width: 220, height: 180 }, 2.05);
  const xs = sampleCount(frame.xMin, frame.xMax, 61);
  const parabolas = graphStrokes(
    frame,
    chapter3Families.parabolaC.flatMap((c) =>
      sampleGraph(xs, (x) => c * x * x, frame.yMin, frame.yMax),
    ),
    "blue",
  );
  const ellipses: ArtStroke[] = [];
  for (const k of chapter3Families.ellipseK) {
    const reach = Math.sqrt(k);
    const ellipseX = sampleCount(-reach, reach, 81);
    for (const sign of [1, -1]) {
      const run = ellipseX.map((x) => ({ x, y: sign * Math.sqrt(Math.max(0, (k - x * x) / 2)) }));
      const drawn = stroke(pathFromMath(frame, run), "rust");
      if (drawn) {
        ellipses.push(drawn);
      }
    }
  }
  return { width, height, strokes: [...parabolas, ...ellipses] };
}

function buildChapter4(): ArtPiece {
  const width = 280;
  const height = 160;
  const frame = plotFrame({ left: 12, top: 12, width: 256, height: 136 }, -0.3, 15.5, -1.2, 1.2);
  const times = sampleCount(0, 15.2, 121);
  const oscillation = times.map((t) => ({ x: t, y: Math.exp(-0.2 * t) * Math.cos(2.2 * t) }));
  const envelope = (sign: number) => times.map((t) => ({ x: t, y: sign * Math.exp(-0.2 * t) }));
  return {
    width,
    height,
    strokes: keep([
      stroke(pathFromMath(frame, envelope(1)), "muted", { dashed: true, weight: "hair" }),
      stroke(pathFromMath(frame, envelope(-1)), "muted", { dashed: true, weight: "hair" }),
      stroke(pathFromMath(frame, oscillation), "blue"),
    ]),
  };
}

function buildChapter5(): ArtPiece {
  const width = 240;
  const height = 200;
  const frame = equalScaleFrame({ left: 14, top: 12, width: 212, height: 176 }, 1.15);
  const rotation = 18 * DEG;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const rotate = (point: Point): Point => ({
    x: cos * point.x - sin * point.y,
    y: sin * point.x + cos * point.y,
  });
  const times = sampleCount(0, 13, 97);
  const spiral = times.map((t) => {
    const radius = Math.exp(-0.18 * t);
    return rotate({ x: radius * Math.cos(t), y: radius * Math.sin(t) });
  });
  const strokes: ArtStroke[] = keep([stroke(pathFromMath(frame, spiral), "blue")]);
  for (const t of [1.1, 3.4, 6.2]) {
    const at = (time: number) => {
      const radius = Math.exp(-0.18 * time);
      return rotate({ x: radius * Math.cos(time), y: radius * Math.sin(time) });
    };
    strokes.push(stroke(chevronFromMath(frame, at(t - 0.25), at(t), 7), "blue")!);
  }
  for (const angle of [22 * DEG, 112 * DEG]) {
    const direction = unit(angle);
    strokes.push(
      stroke(pathFromMath(frame, [scale(direction, -1.05), scale(direction, 1.05)]), "muted", {
        weight: "hair",
        opacity: 0.55,
      })!,
    );
  }
  return { width, height, strokes };
}

function buildChapter6(): ArtPiece {
  const width = 280;
  const height = 160;
  const frame = plotFrame({ left: 16, top: 12, width: 248, height: 136 }, -0.04, 1.04, -1.25, 1.25);
  const tones: ArtTone[] = ["blue", "rust", "gold", "muted"];
  const xs = sampleCount(0, 1, 49);
  const strokes = tones.flatMap((tone, index) => {
    const n = index + 1;
    return graphStrokes(
      frame,
      [xs.map((x) => ({ x, y: Math.sin(n * Math.PI * x) }))],
      tone,
    );
  });
  strokes.push(stroke(pathFromMath(frame, [{ x: 0, y: 0 }, { x: 1, y: 0 }]), "muted", { weight: "hair" })!);
  return { width, height, strokes };
}

export function buildOdeCoverArt(): ArtPiece {
  return buildCoverArt();
}

export function buildOdeChapterArt(chapter: number): ArtPiece {
  switch (chapter) {
    case 1:
      return buildChapter1();
    case 2:
      return buildChapter2();
    case 3:
      return buildChapter3();
    case 4:
      return buildChapter4();
    case 5:
      return buildChapter5();
    case 6:
      return buildChapter6();
    default:
      throw new Error(`No motif for chapter ${chapter}`);
  }
}

export const odeCoverArt = buildOdeCoverArt();

export const odeChapterArt: Readonly<Record<number, ArtPiece>> = {
  1: buildOdeChapterArt(1),
  2: buildOdeChapterArt(2),
  3: buildOdeChapterArt(3),
  4: buildOdeChapterArt(4),
  5: buildOdeChapterArt(5),
  6: buildOdeChapterArt(6),
};

/** Positions stay out of the cover's empty middle, where a title can sit. */
export const odeCoverEquations: readonly FadedEquation[] = [
  { tex: String.raw`\ddot x=-kx`, x: "7%", y: "3%", rotate: -8, size: "sm" },
  { tex: String.raw`z=\frac{y}{x}`, x: "40%", y: "5%", rotate: 6, size: "sm" },
  { tex: String.raw`z=y^{1-n}`, x: "72%", y: "46%", rotate: -7, size: "sm" },
  {
    tex: String.raw`\frac{d}{dx}\Big(p(x)\frac{dy}{dx}\Big)+q(x)\,y=-\lambda\, r(x)\,y`,
    x: "3%",
    y: "41%",
    rotate: -3,
    size: "sm",
  },
  {
    tex: String.raw`\frac{d}{dx}W[y_1,\dots,y_n]=-a_{n-1}(x)\,W[y_1,\dots,y_n]`,
    x: "8%",
    y: "90%",
    rotate: -2,
    size: "sm",
  },
  {
    tex: String.raw`W[y_1,\dots,y_n](x)=\det\begin{pmatrix}y_1&\cdots&y_n\\\vdots&\ddots&\vdots\\y_1^{(n-1)}&\cdots&y_n^{(n-1)}\end{pmatrix}`,
    x: "34%",
    y: "62%",
    size: "sm",
  },
];

/** The shorter cover equations. The determinant and the long Wronskian stay off the small card. */
export const odeCoverCardEquations: readonly FadedEquation[] = odeCoverEquations.filter(
  (item) => !item.tex.includes("\\det") && !item.tex.includes("W["),
);
