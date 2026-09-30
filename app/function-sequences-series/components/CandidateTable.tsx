"use client";

import { useId } from "react";
import type { CandidateFilling, CandidateTableSpec, Token, TokenId } from "../math/supremumTypes";
import { SlotTemplate } from "./SlotTemplate";

/**
 * Candidate values for the maximum: one compact row per candidate — its kind (caption), a small
 * slot template, and one shared radio "זה המקסימום". On narrow screens a row stacks. Controlled.
 */
export function CandidateTable({ spec, tokens, filling, onChange, wrongRowId, wrongSlotId, disabled = false, captions }: {
  spec: CandidateTableSpec;
  tokens: Record<TokenId, Token>;
  filling: CandidateFilling;
  onChange: (next: CandidateFilling) => void;
  wrongRowId?: string;
  wrongSlotId?: string;
  disabled?: boolean;
  /** Row id → Hebrew kind of candidate (e.g. "קצה התחום"), shown at the start of the row. */
  captions?: Partial<Record<string, string>>;
}) {
  const name = useId();
  return <fieldset className="supremum-table" disabled={disabled}>
    <legend className="supremum-visually-hidden">ערכים מועמדים למקסימום</legend>
    {spec.rows.map((row) => {
      const wrongRow = wrongRowId === row.id;
      const isMax = filling.maximumRowId === row.id;
      return <div key={row.id} className={`supremum-row${wrongRow ? " is-wrong" : ""}${isMax ? " is-max" : ""}`}>
        {captions?.[row.id] && <span className="supremum-row-caption">{captions[row.id]}</span>}
        <SlotTemplate spec={row.template} tokens={tokens} filling={filling.rows[row.id] ?? {}} disabled={disabled}
          wrongSlotId={wrongRow ? wrongSlotId : undefined}
          onChange={(next) => onChange({ ...filling, rows: { ...filling.rows, [row.id]: next } })} />
        <label className={`convergence-choice supremum-max${isMax ? " is-selected" : ""}${wrongRow && !wrongSlotId ? " is-wrong" : ""}`}>
          <input type="radio" name={name} value={row.id} checked={isMax} disabled={disabled}
            onChange={() => onChange({ ...filling, maximumRowId: row.id })} />
          <span>זה המקסימום</span>
        </label>
      </div>;
    })}
  </fieldset>;
}
