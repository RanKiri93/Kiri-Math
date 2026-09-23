import type { CSSProperties } from "react";
import type { ArtPiece } from "./art/types";

/** Inline SVG for an art piece. Server-compatible: no hooks. `pathLength` is 1 so a later transition can draw the stroke. */
export function ArtSvg({
  piece,
  className,
  animated = false,
}: {
  piece: ArtPiece;
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${piece.width} ${piece.height}`}
      aria-hidden="true"
      focusable="false"
    >
      {piece.strokes.map((entry, index) => (
        <path
          key={index}
          d={entry.d}
          pathLength={1}
          className={`art-stroke tone-${entry.tone} weight-${entry.weight ?? "regular"}${entry.dashed ? " dashed" : ""}`}
          style={
            animated || entry.opacity !== undefined
              ? ({
                  ...(animated ? { "--i": index } : {}),
                  ...(entry.opacity !== undefined ? { strokeOpacity: entry.opacity } : {}),
                } as CSSProperties)
              : undefined
          }
        />
      ))}
      {piece.dots?.map((dot, index) => (
        <circle key={index} className={`art-dot tone-${dot.tone}`} cx={dot.x} cy={dot.y} r={dot.r} />
      ))}
    </svg>
  );
}
