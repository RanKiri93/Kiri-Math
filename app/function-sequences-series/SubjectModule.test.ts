import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SubjectModule } from "./SubjectModule";

describe("subject module landing pages", () => {
  it.each([
    ["function-sequences", "התכנסות נקודתית ובמידה שווה"],
    ["function-series", "טורי פונקציות"],
    ["power-series", "טורי חזקות"],
    ["taylor-series", "טורי טיילור"],
  ] as const)("renders the %s introduction and notes links", (subject, title) => {
    const html = renderToStaticMarkup(createElement(SubjectModule, { subject }));
    expect(html).toContain(title);
    expect(html).toContain("לקריאה ברשימות");
    expect(html).toContain('class="module-notes-list"');
  });

  it("shows all five activities and no planned activity", () => {
    const html = renderToStaticMarkup(createElement(SubjectModule, { subject: "function-sequences" }));
    expect(html.match(/כניסה לפעילות/g)).toHaveLength(5);
    expect(html).toContain("5. גבול ונגזרת");
    expect(html).toContain("6. תרגול מסכם");
    expect(html.match(/כניסה לתרגול/g)).toHaveLength(1);
    expect(html).toContain("4. גבול ואינטגרל");
    expect(html).toContain("3. רציפות פונקציית הגבול");
    expect(html).toContain("גבול ואינטגרל");
    expect(html).toContain("גבול ונגזרת");
    expect(html).toContain("מתי רציפות של איברי הסדרה");
    expect(html).toContain("להחליף בין גבול הסדרה לבין אינטגרציה");
    expect(html).toContain("מאפשרים לגזור את פונקציית הגבול");
    expect(html).not.toContain("פעילות מתוכננת");
    expect(html).not.toContain("בבנייה");
  });
});

describe("function-sequences activity menu", () => {
  it("offers the supremum-test activity after the lab", () => {
    const html = renderToStaticMarkup(createElement(SubjectModule, { subject: "function-sequences" }));
    expect(html).toContain("1. התכנסות נקודתית ובמידה שווה");
    expect(html).toContain("2. שימוש במבחן הסופרמום");
    expect(html).toContain("למציאת הסופרמום במפורש");
    expect(html.indexOf("2. שימוש במבחן הסופרמום")).toBeGreaterThan(html.indexOf("כניסה לפעילות"));
    expect(html).not.toContain("פעילות זמינה");
    expect(html).not.toContain("נקודה קריטית");
  });
});
