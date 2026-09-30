import { describe, expect, it } from "vitest";
import { SUP_EXAMPLE_ORDER } from "./supremumExamples";
import { SUP_STEPS } from "./supremumArgument";
import { orderChecklist, orderChoice, orderTable, orderTemplate, shuffleById } from "./supremumOrder";
import type { SlotTemplateSpec } from "./supremumTypes";

const parts = SUP_EXAMPLE_ORDER.flatMap((id) => SUP_STEPS[id].flatMap((step) => step.parts));
const choices = parts.flatMap((p) => (p.kind === "choice" ? [p.choice] : []));
const templates: SlotTemplateSpec[] = parts.flatMap((p) =>
  p.kind === "slots" ? [p.template] : p.kind === "table" ? p.table.rows.map((r) => r.template) : []);

function spread(positions: number[]) {
  const counts = new Map<number, number>();
  for (const p of positions) counts.set(p, (counts.get(p) ?? 0) + 1);
  return { distinct: counts.size, maxShare: Math.max(...counts.values()) / positions.length, counts };
}

describe("supremum display order", () => {
  it("is deterministic and a permutation", () => {
    expect(shuffleById([1, 2, 3, 4, 5], "x")).toEqual(shuffleById([1, 2, 3, 4, 5], "x"));
    for (const choice of choices) {
      const a = orderChoice(choice);
      expect(a).toEqual(orderChoice(choice));
      expect(a.options.map((o) => o.id).sort()).toEqual(choice.options.map((o) => o.id).sort());
    }
    for (const part of parts) {
      if (part.kind === "checklist") {
        expect(orderChecklist(part.checklist).items.map((i) => i.id).sort()).toEqual(part.checklist.items.map((i) => i.id).sort());
      }
      if (part.kind === "table") {
        const ordered = orderTable(part.table);
        expect(ordered.rows.map((r) => r.id)).toEqual(part.table.rows.map((r) => r.id));
      }
    }
    for (const template of templates) {
      const ordered = orderTemplate(template);
      ordered.slots.forEach((slot, i) => {
        expect([...slot.chips].sort()).toEqual([...template.slots[i].chips].sort());
        expect(slot.accepted).toEqual(template.slots[i].accepted);
      });
    }
  });

  it("spreads the correct option's position across choice parts", () => {
    const positions = choices.map((c) => orderChoice(c).options.findIndex((o) => o.correct));
    const { distinct, maxShare, counts } = spread(positions);
    console.log("choice correct positions", Object.fromEntries(counts), "n =", positions.length);
    expect(distinct).toBeGreaterThanOrEqual(3);
    expect(maxShare).toBeLessThanOrEqual(0.5);
  });

  it("spreads the accepted chip's position for slots with three or more chips", () => {
    const positions = templates.flatMap((t) => orderTemplate(t).slots
      .filter((s) => s.chips.length >= 3).map((s) => s.chips.indexOf(s.accepted[0])));
    const { distinct, maxShare, counts } = spread(positions);
    console.log("slot accepted positions", Object.fromEntries(counts), "n =", positions.length);
    expect(distinct).toBeGreaterThanOrEqual(3);
    expect(maxShare).toBeLessThanOrEqual(0.5);
  });
});
