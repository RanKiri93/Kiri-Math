"use client";

import { MathText } from "./MathText";

/**
 * Hebrew prose with inline `$...$` math. The prose keeps the page direction (RTL); every math
 * segment is an LTR island through `MathText`. Terminal punctuation should stay outside the `$`.
 */
export function MathInlineText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/\$([^$]+)\$/);
  return <span className={className}>
    {parts.map((part, index) => {
      if (index % 2 === 1) return <MathText key={index} math={part} />;
      return part === "" ? null : <span key={index}>{part}</span>;
    })}
  </span>;
}
