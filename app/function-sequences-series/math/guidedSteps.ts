/**
 * The guided-step engine shared by the guided activities of this module (the supremum test, the
 * continuity of the limit). Pure TypeScript, no React. A step is a title, a Hebrew prompt and
 * answer parts (slot templates, candidate tables, reason checklists, single choices), checked
 * by `checkStep`; `revealAnswers` gives the answers of "הצג תשובה לשלב". Answers are token ids
 * and option ids, never numbers. Each activity keeps its own example ids, graph state and copy.
 */
import type {
  CandidateFilling,
  CandidateRow,
  CandidateTableSpec,
  CheckResult,
  ChecklistItem,
  ChecklistSpec,
  ChoiceSpec,
  SlotFilling,
  SlotSpec,
  SlotTemplateSpec,
  TemplateSegment,
  TokenId,
} from './supremumTypes';

const SLOT_GENERIC = 'המשבצת המסומנת אינה נכונה.';

// ---------------------------------------------------------------------------------------------
// Step types
// ---------------------------------------------------------------------------------------------

export type Disclosure = { summary: string; body: string };

/** One labelled part of a complete proof. `body` is Hebrew with inline $...$ math; `display` is optional LaTeX shown as a centred equation after the body. */
export type ProofSection = { heading: string; body: string; display?: string };

type PartBase = {
  id: string;
  /** Optional Hebrew line above the part (inline $...$ math allowed). */
  lead?: string;
};

export type SlotsPart = PartBase & { kind: 'slots'; template: SlotTemplateSpec; reveal: SlotFilling };
export type TablePart = PartBase & {
  kind: 'table';
  table: CandidateTableSpec;
  /** Row id -> Hebrew kind caption ("קצה", "נקודה חשודה לקיצון", "גבול באינסוף"). */
  captions: Record<string, string>;
  reveal: CandidateFilling;
};
export type ChecklistPart = PartBase & { kind: 'checklist'; checklist: ChecklistSpec; reveal: string[] };
export type ChoicePart = PartBase & { kind: 'choice'; choice: ChoiceSpec; reveal: string };
export type StepPart = SlotsPart | TablePart | ChecklistPart | ChoicePart;

/** A student's input for one part; which shape depends on the part's kind. */
export type PartAnswer = SlotFilling | CandidateFilling | string[] | string | undefined;
export type StepAnswers = Partial<Record<string, PartAnswer>>;
export type StepCheckResult = CheckResult & { partId?: string };

export type GuidedStep<E extends string, G> = {
  /** e.g. "E1-4b". */
  id: string;
  exampleId: E;
  title: string;
  /** Hebrew, inline math as $...$. */
  prompt: string;
  parts: StepPart[];
  /** Shown one at a time, in order. */
  hints: string[];
  disclosure?: Disclosure;
  /** Hebrew feedback shown when the step is solved (or revealed). */
  solvedNote: string;
  /** The concise, complete argument, shown under the solved note: which facts, in which order. */
  minimalProof?: string;
  /** Graph state once the step is solved. */
  graph: G;
};

// ---------------------------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------------------------

export const L = (latex: string): TemplateSegment => ({ latex });
export const S = (slotId: string): TemplateSegment => ({ slot: slotId });

export function slot(id: string, chips: TokenId[], accepted: TokenId | TokenId[], diagnoses?: Partial<Record<TokenId, string>>): SlotSpec {
  return { id, chips, accepted: Array.isArray(accepted) ? accepted : [accepted], ...(diagnoses ? { diagnoses } : {}) };
}

export function template(id: string, segments: TemplateSegment[], slots: SlotSpec[], unordered?: string[][]): SlotTemplateSpec {
  return { id, segments, slots, ...(unordered ? { unordered } : {}) };
}

export function revealSlots(t: SlotTemplateSpec): SlotFilling {
  return Object.fromEntries(t.slots.map((s) => [s.id, s.accepted[0]]));
}

export function slotsPart(t: SlotTemplateSpec, lead?: string): SlotsPart {
  return { kind: 'slots', id: t.id, template: t, reveal: revealSlots(t), ...(lead ? { lead } : {}) };
}

/** A one-slot row of a candidate table: `lead` [slot]. */
export function row(
  tableId: string,
  id: string,
  lead: string,
  chips: TokenId[],
  accepted: TokenId,
  diagnoses: Partial<Record<TokenId, string>>,
  isMaximum: boolean,
): CandidateRow {
  return {
    id,
    isMaximum,
    template: template(`${tableId}-${id}`, [L(lead), S('v')], [slot('v', chips, accepted, diagnoses)]),
  };
}

export function tablePart(id: string, rows: CandidateRow[], captions: Record<string, string>, wrongMaximumMessage: string, lead?: string): TablePart {
  const filling: CandidateFilling = {
    rows: Object.fromEntries(rows.map((r) => [r.id, revealSlots(r.template)])),
    maximumRowId: rows.find((r) => r.isMaximum)?.id,
  };
  return { kind: 'table', id, table: { id, rows, wrongMaximumMessage }, captions, reveal: filling, ...(lead ? { lead } : {}) };
}

export function checklistPart(id: string, items: ChecklistSpec['items'], lead?: string): ChecklistPart {
  return {
    kind: 'checklist',
    id,
    checklist: { id, items },
    reveal: items.filter((i) => i.required).map((i) => i.id),
    ...(lead ? { lead } : {}),
  };
}

export function choicePart(id: string, prompt: string, options: ChoiceSpec['options'], lead?: string): ChoicePart {
  return {
    kind: 'choice',
    id,
    choice: { id, prompt, options },
    reveal: options.find((o) => o.correct)!.id,
    ...(lead ? { lead } : {}),
  };
}

/** Ticked items that are true but not needed, each with its explanation; empty for a reveal. */
export function unneededChoices(step: Pick<GuidedStep<string, unknown>, 'parts'>, answers: StepAnswers | undefined): ChecklistItem[] {
  return step.parts.flatMap((part) => {
    if (part.kind !== 'checklist') return [];
    const chosen = new Set((answers?.[part.id] as string[] | undefined) ?? []);
    return part.checklist.items.filter((item) => item.optional && item.unneeded && chosen.has(item.id));
  });
}

// ---------------------------------------------------------------------------------------------
// Checkers
// ---------------------------------------------------------------------------------------------

const MSG_FILL_ALL = 'השלימו את כל המשבצות.';

export function checkSlots(t: SlotTemplateSpec, filling: SlotFilling | undefined): CheckResult {
  const f = filling ?? {};
  if (t.slots.some((s) => !f[s.id])) return { status: 'incomplete', message: MSG_FILL_ALL };
  const groups = t.unordered ?? [];
  for (const s of t.slots) {
    const chosen = f[s.id]!;
    const group = groups.find((g) => g.includes(s.id));
    // In an unordered group a token may be accepted by any slot of the group.
    const allowed = group ? t.slots.filter((o) => group.includes(o.id)).flatMap((o) => o.accepted) : s.accepted;
    if (!allowed.includes(chosen)) {
      return { status: 'wrong', slotId: s.id, message: s.diagnoses?.[chosen] ?? SLOT_GENERIC };
    }
  }
  // Within a group every token may appear once only.
  for (const group of groups) {
    const first = new Map<string, string>();
    for (const id of group) {
      const chosen = f[id]!;
      const other = first.get(chosen);
      if (other !== undefined) {
        // Point at the slot whose chip is not its own accepted token (else at the later one).
        const earlier = t.slots.find((o) => o.id === other)!;
        const blame = earlier.accepted.includes(chosen) ? t.slots.find((o) => o.id === id)! : earlier;
        return { status: 'wrong', slotId: blame.id, message: blame.diagnoses?.[chosen] ?? SLOT_GENERIC };
      }
      first.set(chosen, id);
    }
  }
  return { status: 'correct' };
}

export function checkCandidateTable(table: CandidateTableSpec, filling: CandidateFilling | undefined): CheckResult {
  const f = filling ?? { rows: {} };
  for (const r of table.rows) {
    const rowFilling = f.rows[r.id] ?? {};
    if (r.template.slots.some((s) => !rowFilling[s.id])) {
      return { status: 'incomplete', message: 'חשבו את הערך בכל אחד מהמועמדים.'};
    }
  }
  for (const r of table.rows) {
    const res = checkSlots(r.template, f.rows[r.id]);
    if (res.status === 'wrong') return { ...res, rowId: r.id };
  }
  if (!f.maximumRowId) return { status: 'incomplete', message: 'סמנו איזה מועמד נותן את המקסימום.' };
  const chosen = table.rows.find((r) => r.id === f.maximumRowId);
  if (!chosen || !chosen.isMaximum) {
    return { status: 'wrong', rowId: f.maximumRowId, message: table.wrongMaximumMessage ?? 'זה אינו המועמד שנותן את המקסימום.' };
  }
  return { status: 'correct' };
}

export function checkChecklist(spec: ChecklistSpec, selected: string[] | undefined): CheckResult {
  const chosen = new Set(selected ?? []);
  if (chosen.size === 0) return { status: 'incomplete', message: 'סמנו את הנימוקים הנכונים.' };
  for (const item of spec.items) {
    if (chosen.has(item.id) && !item.required && !item.optional) {
      return { status: 'wrong', itemId: item.id, message: item.diagnosis ?? 'אחד מהנימוקים שסימנתם אינו נכון.' };
    }
  }
  for (const item of spec.items) {
    if (item.required && !chosen.has(item.id)) {
      return { status: 'wrong', itemId: item.id, message: item.diagnosis ?? 'חסר נימוק נדרש.' };
    }
  }
  return { status: 'correct' };
}

export function checkChoice(spec: ChoiceSpec, optionId: string | undefined): CheckResult {
  if (!optionId) return { status: 'incomplete', message: 'בחרו תשובה.' };
  const option = spec.options.find((o) => o.id === optionId);
  if (!option) return { status: 'wrong', message: 'הבחירה אינה מוכרת.' };
  if (option.correct) return { status: 'correct' };
  return { status: 'wrong', itemId: option.id, message: option.diagnosis ?? 'זו אינה התשובה הנכונה.' };
}

export function checkPart(part: StepPart, answer: PartAnswer): CheckResult {
  switch (part.kind) {
    case 'slots':
      return checkSlots(part.template, answer as SlotFilling | undefined);
    case 'table':
      return checkCandidateTable(part.table, answer as CandidateFilling | undefined);
    case 'checklist':
      return checkChecklist(part.checklist, answer as string[] | undefined);
    case 'choice':
      return checkChoice(part.choice, answer as string | undefined);
  }
}

/** Checks every part and reports the first one that is not correct (in part order). */
export function checkStep(step: Pick<GuidedStep<string, unknown>, 'parts'>, answers: StepAnswers | undefined): StepCheckResult {
  for (const part of step.parts) {
    const res = checkPart(part, answers?.[part.id]);
    if (res.status !== 'correct') return { ...res, partId: part.id };
  }
  return { status: 'correct' };
}

/** The reveal answers of a step ("הצג תשובה לשלב"), in the same shape `checkStep` accepts. */
export function revealAnswers(step: Pick<GuidedStep<string, unknown>, 'parts'>): StepAnswers {
  return Object.fromEntries(step.parts.map((p) => [p.id, p.reveal]));
}
