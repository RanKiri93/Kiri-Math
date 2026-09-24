import { pathFromMath, plotFrame, sampleCount } from "../_site/art/geometry";
import type { ArtPiece, ArtStroke, FadedEquation } from "../_site/art/types";

function graph(
  frame: ReturnType<typeof plotFrame>,
  values: readonly { x: number; y: number }[],
  tone: ArtStroke["tone"],
  extra: Pick<ArtStroke, "weight" | "opacity" | "dashed"> = {},
): ArtStroke {
  return { d: pathFromMath(frame, values), tone, ...extra };
}

function harmonicCurves(width: number, height: number, left: number, top: number): ArtStroke[] {
  const frame = plotFrame({ left, top, width, height }, -Math.PI, Math.PI, -1.65, 1.65);
  const xs = sampleCount(-Math.PI, Math.PI, 101);
  const partial = xs.map((x) => ({
    x,
    y: (4 / Math.PI) * (Math.sin(x) + Math.sin(3 * x) / 3 + Math.sin(5 * x) / 5),
  }));
  return [
    graph(frame, xs.map((x) => ({ x, y: Math.sin(x) })), "green", { weight: "hair", opacity: 0.75 }),
    graph(frame, xs.map((x) => ({ x, y: Math.sin(x) + Math.sin(3 * x) / 3 })), "gold", { weight: "hair", opacity: 0.8 }),
    graph(frame, partial, "blue", { weight: "bold" }),
  ];
}

function gaussianCurves(width: number, height: number, left: number, top: number): ArtStroke[] {
  const frame = plotFrame({ left, top, width, height }, -4, 4, -0.08, 1.15);
  const xs = sampleCount(-4, 4, 101);
  const curve = (spread: number) => xs.map((x) => ({ x, y: Math.exp(-(x * x) / spread) }));
  return [
    graph(frame, curve(0.7), "rust", { weight: "hair", opacity: 0.72 }),
    graph(frame, curve(2), "blue", { weight: "bold" }),
  ];
}

function decayCurve(width: number, height: number, left: number, top: number): ArtStroke[] {
  const frame = plotFrame({ left, top, width, height }, 0, 5, -1.15, 1.15);
  const xs = sampleCount(0, 5, 81);
  return [
    graph(frame, xs.map((x) => ({ x, y: Math.exp(-0.8 * x) * Math.cos(5 * x) })), "blue", { weight: "bold" }),
    graph(frame, xs.map((x) => ({ x, y: Math.exp(-0.8 * x) })), "muted", { weight: "hair", dashed: true }),
    graph(frame, xs.map((x) => ({ x, y: -Math.exp(-0.8 * x) })), "muted", { weight: "hair", dashed: true }),
  ];
}

function buildCover(): ArtPiece {
  return {
    width: 480,
    height: 300,
    strokes: [
      ...harmonicCurves(202, 132, 18, 150),
      ...gaussianCurves(172, 118, 286, 12),
      ...decayCurve(172, 108, 286, 174),
    ],
  };
}

function buildChapter(number: number): ArtPiece {
  switch (number) {
    case 1:
      return { width: 280, height: 160, strokes: harmonicCurves(250, 134, 15, 13) };
    case 2:
      return { width: 280, height: 160, strokes: harmonicCurves(250, 134, 15, 13) };
    case 3:
      return { width: 280, height: 160, strokes: gaussianCurves(250, 134, 15, 13) };
    case 4:
      return { width: 280, height: 160, strokes: decayCurve(250, 134, 15, 13) };
    default:
      throw new Error(`No motif for chapter ${number}`);
  }
}

export const fourierCoverArt: ArtPiece = buildCover();
export const fourierMaterialsArt: ArtPiece = {
  width: 280,
  height: 160,
  strokes: [...harmonicCurves(250, 134, 15, 13), ...gaussianCurves(250, 134, 15, 13)],
};
export function fourierChapterArt(number: number): ArtPiece {
  return buildChapter(number);
}

export const fourierCoverCardEquations: readonly FadedEquation[] = [];
