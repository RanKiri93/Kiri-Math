"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import type { SlotFilling, SlotTemplateSpec, Token, TokenId, TokenLabel } from "../math/supremumTypes";
import { MathText } from "./MathText";

/** A chip label: LaTeX through `MathText` (LTR island), Hebrew text as RTL prose. */
export function TokenLabelView({ label }: { label: TokenLabel }) {
  if ("latex" in label) return <MathText math={label.latex} />;
  return <span dir="rtl">{label.text}</span>;
}

/**
 * A formula line with answer slots, an LTR island. Each slot is a button (like the limit slot of
 * `LimitPrediction`); the active slot's chip palette sits under the line as a radio group.
 * Choosing a chip fills the slot and moves focus to the next empty slot. Controlled: no checking.
 */
export function SlotTemplate({ spec, tokens, filling, onChange, wrongSlotId, disabled = false }: {
  spec: SlotTemplateSpec;
  tokens: Record<TokenId, Token>;
  filling: SlotFilling;
  onChange: (next: SlotFilling) => void;
  wrongSlotId?: string;
  disabled?: boolean;
}) {
  const slotRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const order = spec.segments.flatMap((segment) => ("slot" in segment ? [segment.slot] : []));
  const firstEmpty = order.find((id) => !filling[id]);
  const [activeState, setActiveState] = useState<string | undefined>(undefined);
  const [seenWrong, setSeenWrong] = useState<string | undefined>(undefined);
  let active = activeState;
  if (wrongSlotId !== seenWrong) {
    // A newly reported wrong slot becomes the active one, so its palette is at hand for the retry.
    setSeenWrong(wrongSlotId);
    if (wrongSlotId && order.includes(wrongSlotId)) { setActiveState(wrongSlotId); active = wrongSlotId; }
  }
  const activeId = active && order.includes(active) ? active : firstEmpty ?? order[0];
  const activeSpec = spec.slots.find((slot) => slot.id === activeId);
  const activeIndex = activeId ? order.indexOf(activeId) : -1;

  const choose = (slotId: string, tokenId: TokenId) => {
    const next: SlotFilling = { ...filling, [slotId]: tokenId };
    onChange(next);
    const from = order.indexOf(slotId);
    const following = [...order.slice(from + 1), ...order.slice(0, from)].find((id) => !next[id]);
    if (following) {
      setActiveState(following);
      slotRefs.current[following]?.focus();
    } else {
      setActiveState(slotId);
    }
  };

  const onChipKey = (event: KeyboardEvent<HTMLButtonElement>, chips: TokenId[], index: number) => {
    const move = (to: number) => {
      event.preventDefault();
      chipRefs.current[chips[(to + chips.length) % chips.length]]?.focus();
    };
    // The palette flows right-to-left, so the physical left arrow is "next".
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") move(index + 1);
    else if (event.key === "ArrowRight" || event.key === "ArrowUp") move(index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(chips.length - 1);
  };

  return <div className="supremum-template">
    <div className="supremum-formula" dir="ltr">
      {spec.segments.map((segment, index) => {
        if ("latex" in segment) return <MathText key={index} math={segment.latex} />;
        const slotId = segment.slot;
        const chosen = filling[slotId];
        const token = chosen ? tokens[chosen] : undefined;
        const number = order.indexOf(slotId) + 1;
        const wrong = wrongSlotId === slotId;
        const classes = ["supremum-slot", chosen ? "is-filled" : "", slotId === activeId ? "is-active" : "", wrong ? "is-wrong" : ""];
        return <button key={index} type="button" ref={(node) => { slotRefs.current[slotId] = node; }}
          className={classes.filter(Boolean).join(" ")} disabled={disabled}
          aria-label={`משבצת ${number} מתוך ${order.length}, ${chosen ? "מלאה" : "ריקה"}${wrong ? ", לא נכונה" : ""}`}
          aria-current={slotId === activeId ? "true" : undefined}
          onClick={() => setActiveState(slotId)}>
          {chosen ? (token ? <TokenLabelView label={token.label} /> : chosen) : "?"}
        </button>;
      })}
    </div>
    {activeSpec && !disabled && <div role="radiogroup" className="supremum-palette" aria-label={`בחירת ערך למשבצת ${activeIndex + 1}`}>
      {activeSpec.chips.map((tokenId, index, chips) => {
        const token = tokens[tokenId];
        const checked = filling[activeSpec.id] === tokenId;
        const tabbable = checked || (!filling[activeSpec.id] && index === 0);
        return <button key={`${activeSpec.id}-${tokenId}`} type="button" role="radio" aria-checked={checked}
          ref={(node) => { chipRefs.current[tokenId] = node; }}
          tabIndex={tabbable ? 0 : -1} className={`supremum-chip${checked ? " is-selected" : ""}`}
          onKeyDown={(event) => onChipKey(event, chips, index)}
          onClick={() => choose(activeSpec.id, tokenId)}>
          {token ? <TokenLabelView label={token.label} /> : <span dir="ltr">{tokenId}</span>}
        </button>;
      })}
    </div>}
  </div>;
}
