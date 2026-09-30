/**
 * Deterministic display order for the supremum activity's options, checklist items and slot chips.
 * The order depends only on ids (a stable string hash mixed with a fixed base seed), so it is the same
 * on server and client and stable across re-renders. Checking uses ids, never positions.
 */
import { SeededRandom, mixSeed } from "../../constant-coefficients-euler/practice/random";
import type {
  CandidateTableSpec, ChecklistSpec, ChoiceSpec, SlotSpec, SlotTemplateSpec,
} from "./supremumTypes";

export const SUP_ORDER_BASE_SEED = 0x51ed27;

/** FNV-1a, 32 bit. */
export function stableHash(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Fisher-Yates permutation of a copy of `items`, seeded by `id`. */
export function shuffleById<T>(items: readonly T[], id: string): T[] {
  const result = [...items];
  const rng = new SeededRandom(mixSeed(SUP_ORDER_BASE_SEED, stableHash(id)));
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = rng.integer(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const orderChoice = (spec: ChoiceSpec): ChoiceSpec =>
  ({ ...spec, options: shuffleById(spec.options, `choice:${spec.id}`) });

export const orderChecklist = (spec: ChecklistSpec): ChecklistSpec =>
  ({ ...spec, items: shuffleById(spec.items, `checklist:${spec.id}`) });

export const orderSlot = (templateId: string, slot: SlotSpec): SlotSpec =>
  ({ ...slot, chips: shuffleById(slot.chips, `slot:${templateId}/${slot.id}`) });

export const orderTemplate = (spec: SlotTemplateSpec): SlotTemplateSpec =>
  ({ ...spec, slots: spec.slots.map((slot) => orderSlot(spec.id, slot)) });

/** Chips inside every row are reordered; the row order itself is kept. */
export const orderTable = (spec: CandidateTableSpec): CandidateTableSpec =>
  ({ ...spec, rows: spec.rows.map((row) => ({ ...row, template: orderTemplate(row.template) })) });
