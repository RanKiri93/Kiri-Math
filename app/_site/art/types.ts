export type FadedEquation = {
  tex: string;
  x: string;
  y: string;
  rotate?: number;
  size?: "sm" | "md" | "lg";
};

export type ArtTone = "ink" | "muted" | "blue" | "rust" | "gold" | "green";

export type ArtStroke = {
  /** SVG path data in viewBox units, numbers rounded to 1 decimal. */
  d: string;
  tone: ArtTone;
  weight?: "hair" | "regular" | "bold";
  /** Envelopes, equilibria, asymptotes. */
  dashed?: boolean;
  /** Multiplies the token stroke. Lighter than a new color. */
  opacity?: number;
};

export type ArtPiece = {
  /** viewBox is `0 0 width height`. */
  width: number;
  height: number;
  strokes: readonly ArtStroke[];
  dots?: readonly { x: number; y: number; r: number; tone: ArtTone }[];
};
