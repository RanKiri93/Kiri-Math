"use client";

import { useId } from "react";
import type { ChoiceSpec } from "../math/supremumTypes";
import { MathInlineText } from "./MathInlineText";

/** A single-answer choice driven by `ChoiceSpec`; the prompt is the legend. Controlled. */
export function SpecChoice({ spec, value, onChange, wrongOptionId, disabled = false }: {
  spec: ChoiceSpec;
  /** Chosen option id, or "" for none. */
  value: string;
  onChange: (optionId: string) => void;
  wrongOptionId?: string;
  disabled?: boolean;
}) {
  const name = useId();
  return <fieldset className="convergence-fieldset" disabled={disabled}>
    <legend><MathInlineText text={spec.prompt} /></legend>
    <div className="convergence-choices">
      {spec.options.map((option) => {
        const wrong = wrongOptionId === option.id;
        return <label key={option.id} className={`convergence-choice${value === option.id ? " is-selected" : ""}${wrong ? " is-wrong" : ""}`}>
          <input type="radio" name={name} value={option.id} checked={value === option.id}
            onChange={() => onChange(option.id)} />
          <MathInlineText text={option.label} />
        </label>;
      })}
    </div>
  </fieldset>;
}
