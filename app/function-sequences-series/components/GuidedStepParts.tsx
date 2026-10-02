"use client";

import {
  unneededChoices,
  type GuidedStep,
  type PartAnswer,
  type StepAnswers,
  type StepPart,
} from "../math/guidedSteps";
import type { CandidateFilling, SlotFilling, Token, TokenId } from "../math/supremumTypes";
import { orderChecklist, orderChoice, orderTable, orderTemplate } from "../math/supremumOrder";
import { CandidateTable } from "./CandidateTable";
import { MathInlineText } from "./MathInlineText";
import { ReasonChecklist } from "./ReasonChecklist";
import { SlotTemplate } from "./SlotTemplate";
import { SpecChoice } from "./SpecChoice";

/** Where a wrong answer sits, so the input can mark it. */
export type WrongLocation = { partId?: string; slotId?: string; rowId?: string; itemId?: string };

/** A token palette as the slot inputs expect it: id → token. */
export function tokenMap(labels: Record<TokenId, Token["label"]>): Record<TokenId, Token> {
  return Object.fromEntries(Object.entries(labels).map(([id, label]) => [id, { id, label }]));
}

/**
 * Feedback of a solved (or revealed) step: the note, the minimal proof, and why each ticked
 * reason that is true but not needed is not part of it.
 */
export function SolvedNote({ step, answers }: { step: GuidedStep<string, unknown>; answers: StepAnswers | undefined }) {
  const unneeded = unneededChoices(step, answers);
  return <>
    <MathInlineText text={step.solvedNote} />
    {step.minimalProof && <div className="supremum-minimal-proof">
      <strong>הוכחה מינימלית</strong>
      <p><MathInlineText text={step.minimalProof} /></p>
    </div>}
    {unneeded.map((item) => <p className="supremum-unneeded" key={item.id}>
      <strong>נימוק מיותר:</strong> <MathInlineText text={`${item.label}, ${item.unneeded}`} />
    </p>)}
  </>;
}

export function PartView({ part, tokens, answer, wrong, solved, onChange }: {
  part: StepPart; tokens: Record<TokenId, Token>; answer: PartAnswer; wrong: WrongLocation | undefined; solved: boolean; onChange: (next: PartAnswer) => void;
}) {
  const lead = part.lead && <p className="supremum-part-lead"><MathInlineText text={part.lead} /></p>;
  switch (part.kind) {
    case "slots":
      return <div className="supremum-part">{lead}
        <SlotTemplate spec={orderTemplate(part.template)} tokens={tokens} filling={(answer as SlotFilling | undefined) ?? {}}
          wrongSlotId={wrong?.slotId} disabled={solved} onChange={onChange} />
      </div>;
    case "table":
      return <div className="supremum-part">{lead}
        <CandidateTable spec={orderTable(part.table)} tokens={tokens} captions={part.captions}
          filling={(answer as CandidateFilling | undefined) ?? { rows: {} }}
          wrongRowId={wrong?.rowId} wrongSlotId={wrong?.slotId} disabled={solved} onChange={onChange} />
      </div>;
    case "checklist":
      return <div className="supremum-part">{lead}
        <ReasonChecklist spec={orderChecklist(part.checklist)} selected={(answer as string[] | undefined) ?? []}
          wrongItemId={wrong?.itemId} disabled={solved} onChange={onChange} />
      </div>;
    case "choice":
      return <div className="supremum-part">{lead}
        <SpecChoice spec={orderChoice(part.choice)} value={(answer as string | undefined) ?? ""}
          wrongOptionId={wrong?.itemId} disabled={solved} onChange={onChange} />
      </div>;
  }
}
