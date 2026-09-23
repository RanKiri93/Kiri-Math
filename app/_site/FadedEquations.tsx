import type { CSSProperties } from "react";
import katex from "katex";
import type { FadedEquation } from "./art/types";

export type { FadedEquation };

/** Decorative equations. The parent must be positioned. Invisible to assistive technology. */
export function FadedEquations({ items }: { items: readonly FadedEquation[] }) {
  return (
    <span className="faded-equations" aria-hidden="true">
      {items.map((item) => (
        <span
          key={item.tex}
          className={`faded-equation size-${item.size ?? "md"}`}
          dir="ltr"
          style={
            {
              "--x": item.x,
              "--y": item.y,
              "--rotate": `${item.rotate ?? 0}deg`,
            } as CSSProperties
          }
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(item.tex, { throwOnError: true, output: "html" }),
          }}
        />
      ))}
    </span>
  );
}
