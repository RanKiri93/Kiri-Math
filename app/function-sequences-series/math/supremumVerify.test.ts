/**
 * Independent verification of the supremum-test activity (verifier pass).
 * `it.fails` marks a CONFIRMED defect: the assertion states the correct behaviour, and the test
 * passes only while the defect exists. When the defect is fixed, vitest flags the test; change
 * it to a plain `it`.
 */
import { describe, expect, it } from "vitest";
import {
  SUP_STEPS,
  checkChecklist,
  checkChoice,
  checkSlots,
  checkStep,
  revealAnswers,
  type SlotsPart,
  type Step,
} from "./supremumArgument";
import { SUP_EXAMPLES, SUP_EXAMPLE_ORDER, SUP_MAX_N, type SupExampleId } from "./supremumExamples";
import { SUP_MN_MAX_N, epsilonReadout, signStripIntervals } from "./supremumPlot";
import { SUP_VIEWS } from "./supremumViews";
import { orderChecklist, orderChoice, orderTemplate } from "./supremumOrder";

const ns = Array.from({ length: SUP_MAX_N }, (_, i) => i + 1);

describe("verify: M_n is the true supremum for every n", () => {
  it.each(SUP_EXAMPLE_ORDER)("%s: dense grid never exceeds M_n, and reaches it at argmax", (id) => {
    const ex = SUP_EXAMPLES[id];
    for (const n of ns) {
      const right = Math.min(ex.domain.right, ex.domain.left + 40);
      let best = 0;
      for (let i = 0; i <= 4000; i += 1) {
        const x = ex.domain.left + ((right - ex.domain.left) * i) / 4000;
        best = Math.max(best, ex.value(n, x));
      }
      // fine grid around 0..3/n and near 1 for E3
      for (let i = 0; i <= 4000; i += 1) {
        const x = id.startsWith("E3") ? Math.min(ex.domain.right, 0.9 + 0.1 * i / 4000) : ex.domain.left + (6 / n) * i / 4000;
        if (x >= ex.domain.left && x <= ex.domain.right) best = Math.max(best, ex.value(n, x));
      }
      expect(best, `${id} n=${n}`).toBeLessThanOrEqual(ex.supValue(n) + 1e-12);
      expect(ex.value(n, ex.argmax(n))).toBeCloseTo(ex.supValue(n), 12);
    }
  });
});

describe("verify: step formulas hold numerically", () => {
  it("E1 4a/4b, E2 3, E3 4: the accepted coefficient reproduces the derivative", () => {
    for (const n of [1, 2, 7, 30]) for (const x of [0.03, 0.2, 0.9, 1.5]) {
      const e1 = SUP_EXAMPLES.E1.derivative(n, x);
      expect(n * Math.exp(-n * x) - n * n * x * Math.exp(-n * x)).toBeCloseTo(e1, 12);
      expect(n * Math.exp(-n * x) * (1 - n * x)).toBeCloseTo(e1, 12);
      expect(n * x * Math.exp(-n * x) * (2 - n * x)).toBeCloseTo(SUP_EXAMPLES.E2.derivative(n, x), 12);
    }
    for (const n of [1, 2, 7, 30]) for (const x of [0.1, 0.4, 0.7, 0.95]) {
      expect(n * x ** (n - 1) * (1 - 2 * x ** n)).toBeCloseTo(SUP_EXAMPLES.E3.derivative(n, x), 12);
    }
  });

  it("E3 candidate value: f_n(2^{-1/n}) = 1/4; E2: 4/(n e^2); E3p, E1p at the accepted endpoint", () => {
    for (const n of ns) {
      expect(SUP_EXAMPLES.E3.value(n, 2 ** (-1 / n))).toBeCloseTo(0.25, 12);
      expect(SUP_EXAMPLES.E2.value(n, 2 / n)).toBeCloseTo(4 / (n * Math.E ** 2), 12);
      expect(SUP_EXAMPLES.E1p.value(n, 1)).toBeCloseTo(n * Math.exp(-n), 15);
      expect(SUP_EXAMPLES.E3p.value(n, 0.5)).toBeCloseTo(2 ** -n * (1 - 2 ** -n), 15);
    }
  });
});

describe("verify: epsilon readout against the definition", () => {
  it.each(SUP_EXAMPLE_ORDER)("%s: N is the smallest index with M_n < eps for all n > N; reasons follow the limit", (id) => {
    const ex = SUP_EXAMPLES[id];
    for (let k = 1; k <= 50; k += 1) {
      const eps = k / 100;
      const r = epsilonReadout(ex, eps);
      const bad = ns.filter((n) => n <= SUP_MN_MAX_N && !(ex.supValue(n) < eps));
      const lastBad = bad.length ? Math.max(...bad) : 0;
      if (lastBad < SUP_MN_MAX_N) expect(r, `${id} eps=${eps}`).toEqual({ N: lastBad });
      else expect(r.reason, `${id} eps=${eps}`).toBe(ex.limitValue >= eps ? "not-tending" : "beyond-range");
      // 'not-tending' exactly when lim M_n > 0 and eps <= lim
      expect(r.reason === "not-tending").toBe(ex.limitValue > 0 && eps <= ex.limitValue);
    }
  });
});

describe("verify: sign strip at large n", () => {
  // CONFIRMED DEFECT: signStripIntervals classifies |f_n'(midpoint)| < 1e-14 as sign 0, but the
  // derivative underflows for large n (E1p n>=12 on [1,6]; E1 n=64 on [1/64,6]; E3 n=64 on
  // [0, x_n]). The strip then shows a neutral, unlabelled cell instead of "+"/"-".
  it("never reports sign 0 for the interval between break points (E1, E1p, E2, E3, E3p; n=1..64)", () => {
    for (const id of SUP_EXAMPLE_ORDER) for (const n of ns) for (const view of SUP_VIEWS[id]) {
      const ex = SUP_EXAMPLES[id];
      for (const s of signStripIntervals(ex, n, view)) {
        expect(s.sign, `${id} n=${n} view=[${view.left},${view.right}]`).not.toBe(0);
      }
    }
  });

  it("small n is fine (regression guard for the fix)", () => {
    expect(signStripIntervals(SUP_EXAMPLES.E1p, 5, SUP_EXAMPLES.E1p.defaultView)).toEqual([{ left: 1, right: 6, sign: -1 }]);
  });
});

describe("verify: alternative correct answers", () => {
  const stepById = (id: SupExampleId, stepId: string): Step => SUP_STEPS[id].find((s) => s.id === stepId)!;

  // CONFIRMED DEFECT (moderate): {2/n, 0} is the same set as {0, 2/n} but is rejected.
  it("E2-4: the zero set {2/n, 0} is accepted", () => {
    const part = stepById("E2", "E2-4").parts[0] as SlotsPart;
    expect(checkSlots(part.template, { r0: "two-over-n", r1: "zero" }).status).toBe("correct");
  });
  it("E3-5: the zero set {2^{-1/n}, 0} is accepted", () => {
    const part = stepById("E3", "E3-5").parts[0] as SlotsPart;
    expect(checkSlots(part.template, { r0: "root-two", r1: "zero" }).status).toBe("correct");
  });

  // CONFIRMED DEFECT (moderate): f_n(0)=0 is not needed for existence of the maximum (continuity,
  // a point with f_n>0 and lim_{x->inf} f_n = 0 suffice, exactly as in the step's own disclosure),
  // yet the checklist requires it and the prompt asks for "all the facts that are needed".
  it("E1-3: continuity + positive point + limit at infinity is accepted as a complete argument", () => {
    const step = stepById("E1", "E1-3");
    expect(checkStep(step, { "E1-3-exists": ["cont", "limit-inf", "positive"] }).status).toBe("correct");
  });

  it("every step's reveal is accepted (sanity)", () => {
    for (const id of SUP_EXAMPLE_ORDER) for (const step of SUP_STEPS[id]) {
      expect(checkStep(step, revealAnswers(step)).status, step.id).toBe("correct");
    }
  });
});

describe("fixes: optional checklist item, unordered slots, number format", () => {
  const stepById = (id: SupExampleId, stepId: string): Step => SUP_STEPS[id].find((s) => s.id === stepId)!;
  it("E1-3: ticking the optional f_n(0)=0 is accepted, with or without it", () => {
    const step = stepById("E1", "E1-3");
    expect(checkStep(step, { "E1-3-exists": ["cont", "zero-left", "limit-inf", "positive"] }).status).toBe("correct");
  });
  it("unordered zero sets still reject a repeated or wrong zero, blaming a wrong chip", () => {
    const part = stepById("E2", "E2-4").parts[0] as SlotsPart;
    expect(checkSlots(part.template, { r0: "zero", r1: "zero" })).toMatchObject({ status: "wrong", slotId: "r1" });
    expect(checkSlots(part.template, { r0: "two-over-n", r1: "two-over-n" })).toMatchObject({ status: "wrong", slotId: "r0" });
    expect(checkSlots(part.template, { r0: "inv-n", r1: "zero" })).toMatchObject({ status: "wrong", slotId: "r0" });
  });
  it("formatSupNumber never emits exponent notation", async () => {
    const { formatSupNumber, supApproximationLatex } = await import("./supremumPlot");
    expect(formatSupNumber(1e-7)).toBe("1\\cdot10^{-7}");
    expect(supApproximationLatex(64 * Math.exp(-64))).not.toMatch(/\de-/);
    expect(formatSupNumber(0.3678794)).toBe("0.3679");
  });
});

describe("verify: shuffled display order still checks by id", () => {
  const allParts = SUP_EXAMPLE_ORDER.flatMap((id) => SUP_STEPS[id].flatMap((s) => s.parts.map((p) => ({ step: s.id, part: p }))));

  it("every choice: exactly one correct option; after the shuffle the correct id is accepted and each distractor returns its own diagnosis", () => {
    for (const { step, part } of allParts) {
      if (part.kind !== "choice") continue;
      const ordered = orderChoice(part.choice);
      expect(ordered.options.filter((o) => o.correct), `${step}/${part.id}`).toHaveLength(1);
      for (const o of ordered.options) {
        const res = checkChoice(ordered, o.id);
        if (o.correct) expect(res.status, `${part.id}/${o.id}`).toBe("correct");
        else {
          expect(res.status, `${part.id}/${o.id}`).toBe("wrong");
          expect(o.diagnosis, `${part.id}/${o.id} has a specific diagnosis`).toBeTruthy();
          expect(res, `${part.id}/${o.id}`).toMatchObject({ message: o.diagnosis });
        }
      }
    }
  });

  it("every checklist: the required ids are accepted after the shuffle; each wrong item returns its diagnosis; each required item is reported when missing", () => {
    for (const { part } of allParts) {
      if (part.kind !== "checklist") continue;
      const ordered = orderChecklist(part.checklist);
      const required = ordered.items.filter((i) => i.required).map((i) => i.id);
      expect(checkChecklist(ordered, required).status).toBe("correct");
      for (const item of ordered.items) {
        if (!item.required && !item.optional) {
          expect(item.diagnosis, item.id).toBeTruthy();
          const res = checkChecklist(ordered, [...required, item.id]);
          expect(res).toMatchObject({ status: "wrong", itemId: item.id, message: item.diagnosis });
        }
        if (item.required) {
          const res = checkChecklist(ordered, required.filter((r) => r !== item.id));
          expect(res).toMatchObject({ status: "wrong", itemId: item.id });
        }
      }
    }
  });

  it("slot chips: the shuffled template still accepts the reveal filling", () => {
    for (const { part } of allParts) {
      if (part.kind === "slots") expect(checkSlots(orderTemplate(part.template), part.reveal).status).toBe("correct");
    }
  });

  // Regression (E3-3): on the closed bounded [0,1], "differentiable everywhere ⇒ has a maximum" is a
  // TRUE implication (differentiable ⇒ continuous ⇒ Weierstrass), so it must not be a distractor.
  // The distractor is now "bounded ⇒ has a maximum", which is genuinely false (bounded gives a sup).
  it("E3-3: no distractor is a valid implication on [0,1]", () => {
    const part = SUP_STEPS.E3.find((s) => s.id === "E3-3")!.parts[0];
    if (part.kind !== "choice") throw new Error("expected choice");
    for (const option of part.choice.options.filter((o) => !o.correct)) {
      expect(option.label).not.toContain("גזירה");
    }
    expect(part.choice.options.some((o) => o.id === "bounded" && !o.correct)).toBe(true);
  });
});
