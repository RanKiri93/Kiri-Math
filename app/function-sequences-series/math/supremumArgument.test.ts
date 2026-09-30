import { describe, expect, it } from "vitest";
import {
  BASE_GRAPH,
  SUP_STEPS,
  SUP_TOKENS,
  checkCandidateTable,
  checkChecklist,
  checkChoice,
  checkPart,
  checkSlots,
  checkStep,
  graphFlagsFor,
  revealAnswers,
  tokenLabel,
  type SlotsPart,
  type Step,
  type TablePart,
} from "./supremumArgument";
import { SUP_EXAMPLES, SUP_EXAMPLE_ORDER, type SupExampleId } from "./supremumExamples";
import type { CandidateFilling, SlotFilling, SlotTemplateSpec } from "./supremumTypes";

const GENERIC = "המשבצת המסומנת אינה נכונה.";
const allSteps: Step[] = SUP_EXAMPLE_ORDER.flatMap((id) => SUP_STEPS[id]);

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out));
  return out;
}

function templatesOf(step: Step): SlotTemplateSpec[] {
  return step.parts.flatMap((p) => (p.kind === "slots" ? [p.template] : p.kind === "table" ? p.table.rows.map((r) => r.template) : []));
}

const correctFilling = (t: SlotTemplateSpec): SlotFilling => Object.fromEntries(t.slots.map((s) => [s.id, s.accepted[0]]));

describe("step data", () => {
  it("has the lecturer's examples with unique step ids", () => {
    expect(Object.keys(SUP_STEPS).sort()).toEqual([...SUP_EXAMPLE_ORDER].sort());
    const stepIds = allSteps.map((s) => s.id);
    expect(new Set(stepIds).size).toBe(stepIds.length);
    for (const id of SUP_EXAMPLE_ORDER) for (const s of SUP_STEPS[id]) expect(s.exampleId).toBe(id);
    const partIds = allSteps.flatMap((s) => s.parts.map((p) => p.id));
    expect(new Set(partIds).size).toBe(partIds.length);
  });

  it("every chip, accepted token and diagnosis key is a registered token", () => {
    for (const step of allSteps) {
      for (const t of templatesOf(step)) {
        for (const s of t.slots) {
          expect(s.accepted.length).toBeGreaterThan(0);
          for (const c of s.chips) expect(SUP_TOKENS[c], `${t.id}: ${c}`).toBeDefined();
          for (const a of s.accepted) expect(s.chips, `${t.id}: ${a}`).toContain(a);
          for (const [k, msg] of Object.entries(s.diagnoses ?? {})) {
            expect(s.chips, `${t.id} diagnosis ${k}`).toContain(k);
            expect(s.accepted).not.toContain(k);
            expect(msg && msg.length).toBeGreaterThan(5);
          }
          expect(new Set(s.chips).size).toBe(s.chips.length);
        }
        const slotIds = t.segments.flatMap((g) => ("slot" in g ? [g.slot] : []));
        expect(slotIds.sort()).toEqual(t.slots.map((s) => s.id).sort());
      }
    }
    expect(() => tokenLabel("nope")).toThrow();
  });

  it("reveals check as correct and empty input is incomplete", () => {
    for (const step of allSteps) {
      expect(checkStep(step, revealAnswers(step)), step.id).toEqual({ status: "correct" });
      const empty = checkStep(step, {});
      expect(empty.status, step.id).toBe("incomplete");
      expect(empty.partId).toBe(step.parts[0].id);
      expect(checkStep(step, undefined).status).toBe("incomplete");
      for (const part of step.parts) expect(checkPart(part, undefined).status, part.id).toBe("incomplete");
    }
  });

  it("checkStep reports the first failing part", () => {
    const step = SUP_STEPS.E1[4 + 1]; // E1-5: slots then Fermat choice
    expect(step.id).toBe("E1-5");
    const answers = { ...revealAnswers(step), "E1-5-fermat": "circular" };
    const res = checkStep(step, answers);
    expect(res).toMatchObject({ status: "wrong", partId: "E1-5-fermat", itemId: "circular" });
    const both = { ...answers, "E1-5-critical": { sign: "gt0", root: "zero" } };
    expect(checkStep(step, both)).toMatchObject({ status: "wrong", partId: "E1-5-critical", slotId: "root" });
  });
});

describe("slot templates", () => {
  it("accepted filling is correct; every listed distractor returns its own diagnosis", () => {
    for (const step of allSteps) {
      for (const t of templatesOf(step)) {
        expect(checkSlots(t, correctFilling(t)), t.id).toEqual({ status: "correct" });
        expect(checkSlots(t, {}).status, t.id).toBe("incomplete");
        for (const s of t.slots) {
          const partial = correctFilling(t);
          delete partial[s.id];
          expect(checkSlots(t, partial).status).toBe("incomplete");
          for (const chip of s.chips.filter((c) => !s.accepted.includes(c))) {
            const res = checkSlots(t, { ...correctFilling(t), [s.id]: chip });
            expect(res.status, `${t.id}/${s.id}/${chip}`).toBe("wrong");
            if (res.status === "wrong") {
              expect(res.slotId).toBe(s.id);
              expect(res.message).toBe(s.diagnoses?.[chip] ?? GENERIC);
            }
          }
        }
      }
    }
  });

  it("names the first wrong slot", () => {
    const step = SUP_STEPS.E2.find((s) => s.id === "E2-3")!;
    const t = (step.parts[0] as SlotsPart).template;
    expect(checkSlots(t, { a: "one", b: "n2" })).toMatchObject({ status: "wrong", slotId: "a" });
    expect(checkSlots(t, { a: "two", b: "n2" })).toMatchObject({ status: "wrong", slotId: "b" });
  });

  it("mentions the specific mistakes from the plan", () => {
    const e1_4a = (SUP_STEPS.E1.find((s) => s.id === "E1-4a")!.parts[0] as SlotsPart).template;
    const res = checkSlots(e1_4a, { c: "n" });
    expect(res.status === "wrong" && res.message).toContain("משרשרת");
    const e1_5 = (SUP_STEPS.E1.find((s) => s.id === "E1-5")!.parts[0] as SlotsPart).template;
    const zero = checkSlots(e1_5, { sign: "gt0", root: "zero" });
    expect(zero.status === "wrong" && zero.message).toContain("קצה");
  });
});

describe("candidate tables", () => {
  const tables = allSteps.flatMap((s) => s.parts.filter((p): p is TablePart => p.kind === "table").map((p) => ({ step: s, part: p })));

  it("has a table in every example", () => {
    expect(new Set(tables.map((t) => t.step.exampleId))).toEqual(new Set(SUP_EXAMPLE_ORDER));
  });

  it("rows, accepted values and the maximum row agree with the example data", () => {
    for (const { step, part } of tables) {
      const ex = SUP_EXAMPLES[step.exampleId];
      expect(part.table.rows.map((r) => r.id).sort(), step.id).toEqual(ex.candidates.map((c) => c.id).sort());
      for (const row of part.table.rows) {
        const cand = ex.candidates.find((c) => c.id === row.id)!;
        expect(row.template.slots[0].accepted, `${step.id}/${row.id}`).toEqual([cand.valueToken]);
        expect(row.isMaximum).toBe(cand.isMaximum);
        expect(part.captions[row.id]).toBeTruthy();
      }
      expect(part.table.rows.filter((r) => r.isMaximum)).toHaveLength(1);
    }
  });

  it("accepts the reveal, and diagnoses each wrong maximum and each incomplete state", () => {
    for (const { part } of tables) {
      expect(checkCandidateTable(part.table, part.reveal)).toEqual({ status: "correct" });
      expect(checkCandidateTable(part.table, undefined).status).toBe("incomplete");
      const noMax: CandidateFilling = { rows: part.reveal.rows };
      expect(checkCandidateTable(part.table, noMax).status).toBe("incomplete");
      for (const row of part.table.rows.filter((r) => !r.isMaximum)) {
        const res = checkCandidateTable(part.table, { ...part.reveal, maximumRowId: row.id });
        expect(res).toMatchObject({ status: "wrong", rowId: row.id, message: part.table.wrongMaximumMessage });
      }
      // A wrong value in a row is reported for that row before the maximum choice.
      for (const row of part.table.rows) {
        const slot = row.template.slots[0];
        for (const chip of slot.chips.filter((c) => !slot.accepted.includes(c))) {
          const rows = { ...part.reveal.rows, [row.id]: { v: chip } };
          const res = checkCandidateTable(part.table, { rows, maximumRowId: part.reveal.maximumRowId });
          expect(res).toMatchObject({ status: "wrong", rowId: row.id, slotId: "v" });
          if (res.status === "wrong") expect(res.message).toBe(slot.diagnoses?.[chip] ?? GENERIC);
        }
        const rows = { ...part.reveal.rows, [row.id]: {} };
        expect(checkCandidateTable(part.table, { rows, maximumRowId: part.reveal.maximumRowId }).status).toBe("incomplete");
      }
    }
  });
});

describe("checklists and choices", () => {
  const checklists = allSteps.flatMap((s) => s.parts.flatMap((p) => (p.kind === "checklist" ? [p] : [])));
  const choices = allSteps.flatMap((s) => s.parts.flatMap((p) => (p.kind === "choice" ? [p] : [])));

  it("checklist: reveal correct, extras and missing items diagnosed by name, empty incomplete", () => {
    expect(checklists.length).toBeGreaterThan(0);
    for (const part of checklists) {
      const spec = part.checklist;
      expect(checkChecklist(spec, part.reveal)).toEqual({ status: "correct" });
      expect(checkChecklist(spec, []).status).toBe("incomplete");
      expect(checkChecklist(spec, undefined).status).toBe("incomplete");
      for (const item of spec.items.filter((i) => !i.required && !i.optional)) {
        expect(item.diagnosis).toBeTruthy();
        const res = checkChecklist(spec, [...part.reveal, item.id]);
        expect(res).toMatchObject({ status: "wrong", itemId: item.id, message: item.diagnosis });
      }
      for (const item of spec.items.filter((i) => i.required)) {
        expect(item.diagnosis).toBeTruthy();
        const others = part.reveal.filter((id) => id !== item.id);
        const res = checkChecklist(spec, others);
        expect(res).toMatchObject({ status: "wrong", itemId: item.id, message: item.diagnosis });
      }
    }
  });

  it("the existence checklist rejects Weierstrass on the unbounded domain", () => {
    const part = checklists[0];
    const res = checkChecklist(part.checklist, [...part.reveal, "weierstrass-closed"]);
    expect(res.status === "wrong" && res.message).toContain("חסום");
  });

  it("choices: exactly one correct option, every wrong option has its own diagnosis", () => {
    for (const part of choices) {
      const spec = part.choice;
      expect(spec.options.filter((o) => o.correct)).toHaveLength(1);
      expect(checkChoice(spec, part.reveal)).toEqual({ status: "correct" });
      expect(checkChoice(spec, undefined).status).toBe("incomplete");
      expect(checkChoice(spec, "no-such-option").status).toBe("wrong");
      const seen = new Set<string>();
      for (const o of spec.options.filter((x) => !x.correct)) {
        expect(o.diagnosis, `${spec.id}/${o.id}`).toBeTruthy();
        expect(seen.has(o.diagnosis!)).toBe(false);
        seen.add(o.diagnosis!);
        expect(checkChoice(spec, o.id)).toMatchObject({ status: "wrong", itemId: o.id, message: o.diagnosis });
      }
    }
  });
});

describe("consistency with the examples", () => {
  it("every limit slot accepts exactly the example's limit token", () => {
    for (const step of allSteps) {
      const part = step.parts.find((p) => p.id === `${step.id}-limit`) as SlotsPart | undefined;
      if (!part) continue;
      expect(part.template.slots[0].accepted).toEqual([SUP_EXAMPLES[step.exampleId].limitToken]);
    }
    // Each example has exactly one limit step.
    for (const id of SUP_EXAMPLE_ORDER) {
      expect(SUP_STEPS[id].filter((s) => s.parts.some((p) => p.id === `${s.id}-limit`))).toHaveLength(1);
    }
  });

  it("the verdict sentence agrees with the example's verdict", () => {
    for (const id of SUP_EXAMPLE_ORDER) {
      const step = SUP_STEPS[id].find((s) => s.parts.some((p) => p.id === `${s.id}-verdict`))!;
      const part = step.parts.find((p) => p.id === `${step.id}-verdict`)!;
      if (part.kind !== "choice") throw new Error("verdict must be a choice");
      const right = part.choice.options.find((o) => o.correct)!.label;
      if (SUP_EXAMPLES[id].verdict === "not-uniform") expect(right).toContain("אינה במידה שווה");
      else {
        expect(right).toContain("במידה שווה");
        expect(right).not.toContain("אינה");
      }
    }
  });

  it("every example makes the Calculus 1 arguments explicit", () => {
    const hasText = (id: SupExampleId, needle: string) => strings(SUP_STEPS[id]).some((s) => s.includes(needle));
    for (const id of SUP_EXAMPLE_ORDER) {
      // Fermat applies only at interior points where f_n is differentiable; endpoints are candidates.
      const table = SUP_STEPS[id].flatMap((s) => s.parts).find((p) => p.kind === "table") as TablePart;
      expect(Object.values(table.captions).some((c) => c.includes("קצה"))).toBe(true);
      expect(hasText(id, "נקודה חשודה לקיצון")).toBe(true);
    }
    // Existence of the maximum.
    for (const id of ["E1", "E2"] as const) expect(SUP_STEPS[id].some((s) => s.parts.some((p) => p.kind === "checklist"))).toBe(true);
    expect(hasText("E3", "ויירשטראס")).toBe(true);
    // Fermat's conditions.
    expect(SUP_STEPS.E1.some((s) => s.parts.some((p) => p.id === "E1-5-fermat"))).toBe(true);
    expect(hasText("E1", "פנימית")).toBe(true);
    expect(hasText("E2", "אינו חל עליו")).toBe(true);
    expect(hasText("E3", "שני הקצוות")).toBe(true);
    // The endpoint candidate and monotonicity when the critical point leaves the domain.
    for (const id of ["E1p", "E3p"] as const) {
      expect(SUP_STEPS[id].some((s) => s.parts.some((p) => p.kind === "choice" && p.id.endsWith("-location")))).toBe(true);
      expect(SUP_STEPS[id].some((s) => s.parts.some((p) => p.kind === "choice" && p.id.endsWith("-monotone")))).toBe(true);
    }
    // The limit at infinity for the unbounded domains.
    for (const id of ["E1", "E1p", "E2"] as const) {
      const table = SUP_STEPS[id].flatMap((s) => s.parts).find((p) => p.kind === "table") as TablePart;
      expect(table.table.rows.some((r) => r.id === "infinity")).toBe(true);
    }
  });

  it("closing reflection about M_n >= f_n(x_n) is present", () => {
    expect(SUP_STEPS.E1.some((s) => s.disclosure?.body.includes("M_n\\ge f_n(x_n)"))).toBe(true);
  });
});

describe("graph flags", () => {
  it("only the repaired domains fade the outside", () => {
    for (const id of SUP_EXAMPLE_ORDER) {
      for (const s of SUP_STEPS[id]) {
        expect(s.graph.fadedOutsideDomain, s.id).toBe(id === "E1p" || id === "E3p");
      }
    }
  });

  it("each example ends with the M_n graph and the epsilon control", () => {
    for (const id of SUP_EXAMPLE_ORDER) {
      const last = SUP_STEPS[id][SUP_STEPS[id].length - 1];
      expect(last.graph.mnGraph, id).toBe(true);
      expect(last.graph.epsilonControl, id).toBe(true);
      expect(last.graph.supLine, id).toBe(true);
      expect(last.graph.maxMarker, id).toBe("argmax");
    }
  });

  it("flags never turn off once on (except the marker moving) and start empty", () => {
    for (const id of SUP_EXAMPLE_ORDER) {
      const steps = SUP_STEPS[id];
      expect(graphFlagsFor(steps, 0, false)).toEqual({ ...BASE_GRAPH, fadedOutsideDomain: steps[0].graph.fadedOutsideDomain });
      for (let i = 1; i < steps.length; i += 1) {
        const before = steps[i - 1].graph;
        const after = steps[i].graph;
        for (const k of ["limitLine", "tangent", "signStrip", "supLine", "mnGraph", "epsilonControl"] as const) {
          if (before[k]) expect(after[k], `${steps[i].id}.${k}`).toBe(true);
        }
        expect(graphFlagsFor(steps, i, false)).toBe(before);
        expect(graphFlagsFor(steps, i, true)).toBe(after);
      }
    }
  });

  it("the sup line and the true maximum appear at the table step", () => {
    for (const id of SUP_EXAMPLE_ORDER) {
      const tableStep = SUP_STEPS[id].find((s) => s.parts.some((p) => p.kind === "table"))!;
      expect(tableStep.graph.supLine, tableStep.id).toBe(true);
      expect(tableStep.graph.maxMarker, tableStep.id).toBe("argmax");
    }
  });
});

describe("copy hygiene", () => {
  it("no decimal approximation of e anywhere", () => {
    const text = JSON.stringify({ SUP_TOKENS, SUP_STEPS });
    expect(text).not.toMatch(/2\.71|0\.36|0\.54/);
    expect(text).not.toMatch(/\\approx/);
  });

  it("uses the lecturer's term for f' = 0 points, never the phase-plane term", () => {
    const text = strings(SUP_STEPS).join("\n");
    expect(text).toContain("נקודה חשודה לקיצון");
    expect(text).not.toContain("נקודה קריטית");
  });

  it("every step has a title, a prompt, a hint and a solved note; math delimiters balance", () => {
    for (const step of allSteps) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.prompt.length).toBeGreaterThan(0);
      expect(step.hints.length).toBeGreaterThan(0);
      expect(step.solvedNote.length).toBeGreaterThan(0);
      for (const s of strings({ ...step, graph: undefined })) {
        expect((s.match(/\$/g) ?? []).length % 2, `${step.id}: ${s}`).toBe(0);
        expect(s).not.toMatch(/undefined|\[object|\*\*/);
      }
    }
  });
});

describe("choice option balance", () => {
  // Inline math ($...$) counts as 2 characters, so a formula does not make an option look long.
  const visibleLength = (label: string) => label.replace(/\$[^$]*\$/g, "MM").length;
  const questions = allSteps.flatMap((step) =>
    step.parts.flatMap((p) =>
      p.kind === "choice"
        ? [{ id: p.id, options: p.choice.options.map((o) => ({ id: o.id, correct: o.correct, length: visibleLength(o.label) })) }]
        : [],
    ),
  );

  it("finds the choice questions", () => {
    expect(questions.length).toBeGreaterThanOrEqual(15);
  });

  it("keeps every option within 0.6-1.5 of the question's mean length", () => {
    for (const q of questions) {
      const mean = q.options.reduce((sum, o) => sum + o.length, 0) / q.options.length;
      for (const o of q.options) {
        expect(o.length, `${q.id}/${o.id} (mean ${mean.toFixed(1)})`).toBeGreaterThanOrEqual(0.6 * mean);
        expect(o.length, `${q.id}/${o.id} (mean ${mean.toFixed(1)})`).toBeLessThanOrEqual(1.5 * mean);
      }
    }
  });

  it("makes the correct option the strictly longest in at most a third of the questions", () => {
    const longest = questions.filter((q) => {
      const correct = q.options.find((o) => o.correct)!;
      return q.options.every((o) => o === correct || o.length < correct.length);
    });
    expect(longest.map((q) => q.id).length).toBeLessThanOrEqual(questions.length / 3);
  });
});
