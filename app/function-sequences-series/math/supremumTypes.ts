/**
 * Shared contract for the supremum-test activity (docs/plans/supremum-test-activity.md).
 * Pure types only: the math/argument layer (supremumArgument.ts) produces these, and the input
 * components (SlotTemplate, CandidateTable, ReasonChecklist) render them.
 *
 * Answers are tokens, never numbers: `e` and other constants live only inside LaTeX strings.
 */

/** Identifier of an answer chip, e.g. "inv-e", "four-over-n-e2", "decreasing". */
export type TokenId = string;

/** A chip label: LaTeX (rendered LTR by MathText) or plain Hebrew text (rendered RTL). */
export type TokenLabel = { latex: string } | { text: string };

export type Token = { id: TokenId; label: TokenLabel };

/** One piece of a formula line: fixed LaTeX, or a whole-term slot the student fills. */
export type TemplateSegment = { latex: string } | { slot: string };

export type SlotSpec = {
  /** Unique within its template. */
  id: string;
  /** Chip palette offered for this slot, in display order. */
  chips: TokenId[];
  /** Tokens counted as correct (usually exactly one). */
  accepted: TokenId[];
  /** Known mistakes: chip → one-sentence Hebrew diagnosis. */
  diagnoses?: Partial<Record<TokenId, string>>;
};

/**
 * A formula line with slots, rendered as an LTR island. Slots sit at the top level of the
 * formula only (never inside an exponent or a fraction), so each LaTeX segment renders on its own.
 */
export type SlotTemplateSpec = {
  id: string;
  segments: TemplateSegment[];
  slots: SlotSpec[];
  /**
   * Groups of slot ids whose fillings form a set: the order inside a group does not matter
   * (e.g. the zero set {0, 2/n}). A group is correct when its slots hold the group's accepted
   * tokens, each used once, in any order.
   */
  unordered?: string[][];
};

/** Current filling of a template: slot id → chosen token (absent = empty). */
export type SlotFilling = Partial<Record<string, TokenId>>;

export type CheckResult =
  | { status: "correct" }
  | { status: "incomplete"; message: string }
  /** `slotId`/`rowId`/`itemId` locate the first wrong part; `message` is a Hebrew sentence. */
  | { status: "wrong"; message: string; slotId?: string; rowId?: string; itemId?: string };

/** A candidate row: a small template such as f_n(0)=[ ], plus whether it is the maximum. */
export type CandidateRow = {
  id: string;
  template: SlotTemplateSpec;
  /** True for the row(s) that attain (or give) the supremum. */
  isMaximum: boolean;
};

export type CandidateTableSpec = {
  id: string;
  rows: CandidateRow[];
  /** Hebrew diagnosis when the wrong row is marked as the maximum. */
  wrongMaximumMessage?: string;
};

/** Filling of a candidate table: each row's slots plus the row marked as the maximum. */
export type CandidateFilling = { rows: Partial<Record<string, SlotFilling>>; maximumRowId?: string };

/** "Select all that apply" reasons. Labels are Hebrew text that may contain inline $...$ math. */
export type ChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  /** True but not needed for the argument: accepted whether ticked or not (`required` is false). */
  optional?: boolean;
  diagnosis?: string;
};

export type ChecklistSpec = { id: string; items: ChecklistItem[] };

/** Single-answer choice (reasons, conclusion sentences). Labels may contain inline $...$ math. */
export type ChoiceOption = { id: string; label: string; correct: boolean; diagnosis?: string };

export type ChoiceSpec = { id: string; prompt: string; options: ChoiceOption[] };
