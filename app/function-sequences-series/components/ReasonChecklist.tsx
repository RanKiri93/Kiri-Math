"use client";

import type { ChecklistSpec } from "../math/supremumTypes";
import { MathInlineText } from "./MathInlineText";

/** "Select all that apply" reasons: the checkbox variant of `Choice`. Controlled. */
export function ReasonChecklist({ spec, selected, onChange, wrongItemId, disabled = false, label = "בחרו את כל הנימוקים הנכונים" }: {
  spec: ChecklistSpec;
  selected: string[];
  onChange: (next: string[]) => void;
  wrongItemId?: string;
  disabled?: boolean;
  /** Group legend (Hebrew). */
  label?: string;
}) {
  return <fieldset className="convergence-fieldset supremum-checklist" disabled={disabled}>
    <legend>{label}</legend>
    <div className="convergence-choices">
      {spec.items.map((item) => {
        const checked = selected.includes(item.id);
        const wrong = wrongItemId === item.id;
        return <label key={item.id} className={`convergence-choice${checked ? " is-selected" : ""}${wrong ? " is-wrong" : ""}`}>
          <input type="checkbox" value={item.id} checked={checked}
            onChange={() => onChange(checked ? selected.filter((id) => id !== item.id) : [...selected, item.id])} />
          <MathInlineText text={item.label} />
        </label>;
      })}
    </div>
  </fieldset>;
}
