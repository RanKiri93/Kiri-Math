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

  it("shows one available activity and three specifically described planned activities", () => {
    const html = renderToStaticMarkup(createElement(SubjectModule, { subject: "function-sequences" }));
    expect(html).toContain("פתיחת המעבדה");
    expect(html).toContain("רציפות פונקציית הגבול");
    expect(html).toContain("גבול ואינטגרל");
    expect(html).toContain("גבול ונגזרת");
    expect(html).toContain("מתי רציפות של איברי הסדרה");
    expect(html).toContain("להחליף בין גבול הסדרה לבין אינטגרציה");
    expect(html).toContain("מאפשרים לגזור את פונקציית הגבול");
    expect(html.match(/פעילות מתוכננת/g)).toHaveLength(3);
    expect(html.match(/בבנייה/g)).toHaveLength(3);
  });
});
