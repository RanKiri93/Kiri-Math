import { describe, expect, it } from "vitest";
import { parseToc, syncOptions } from "../../scripts/sync-course-notes";

describe("course notes sync options", () => {
  it("preserves the legacy ODE default and accepts explicit ODE and Fourier sources", () => {
    expect(syncOptions([])).toMatchObject({ course: "ode" });
    expect(syncOptions(["--course", "ode"])).toEqual(syncOptions([]));
    const legacy = syncOptions(["/tmp/ode-source"]);
    expect(legacy.course).toBe("ode");
    expect(legacy.notesRoot).toBe("/tmp/ode-source");
    expect(legacy.copies.map(({ source }) => source)).toEqual(["main.pdf", "ExtendedSyllabus_winter2026.pdf", "FormulaSheet.pdf"]);
    expect(syncOptions(["--course", "ode", "/tmp/ode-source"])).toMatchObject({ course: "ode", notesRoot: "/tmp/ode-source" });
    const fourier = syncOptions(["--course", "fourier", "/tmp/fourier-source"]);
    expect(fourier).toMatchObject({ course: "fourier", notesRoot: "/tmp/fourier-source", publicDir: expect.stringMatching(/public\/courses\/fourier$/), tocOutput: expect.stringMatching(/app\/fourier\/notesToc\.ts$/) });
    expect(fourier.copies.map(({ source, target }) => [source, target])).toEqual([
      ["main.pdf", "notes.pdf"], ["ElaborateSyllabus.pdf", "syllabus.pdf"], ["formula_sheet.pdf", "formula-sheet.pdf"],
    ]);
    expect(fourier.titleAliases).toEqual({
      [String.raw`תכונות של התמרת פוריה ב-$\ensuremath {\mathcal {G}}\qty (\ensuremath {\mathbb {R}})$`]: "תכונות התמרת פוריה עבור פונקציות רציפות למקוטעין ואינטגרביליות בהחלט",
      [String.raw`נוסחאות היפוך והתמרת פוריה ב-$\ensuremath {\mathcal {G}}^2\qty (\ensuremath {\mathbb {R}})$`]: "נוסחאות היפוך והתמרת פוריה עבור פונקציות רציפות למקוטעין וריבוע־אינטגרביליות",
      [String.raw`קונבולוציה ב-$\ensuremath {\mathcal {G}}\qty (\ensuremath {\mathbb {R}})$`]: "קונבולוציה של פונקציות רציפות למקוטעין ואינטגרביליות בהחלט",
    });
    expect(fourier.publicDir).not.toBe(legacy.publicDir);
    expect(fourier.tocOutput).not.toBe(legacy.tocOutput);
  });

  it.each([
    ["--course", "fourier"], ["--course", "invalid", "/tmp/source"], ["--course"],
    ["--course", "ode", "/tmp/source", "extra"], ["--course", "fourier", "/tmp/source", "extra"],
    ["--course", "fourier", "--oops"], ["/tmp/source", "extra"],
  ].map((args) => ({ args })))("rejects invalid or missing CLI arguments $args", ({ args }) => {
    expect(() => syncOptions(args)).toThrow(/Usage:/);
  });
});

describe("notes TOC parsing", () => {
  it("handles nested braces and maps the exact Fourier title aliases", () => {
    const aliases = syncOptions(["--course", "fourier", "/fixture"]).titleAliases;
    const fixtureAliases = {
      ...aliases,
      "Chapter {with {nested} braces}": "Nested title",
      "Plain {nested title}": "Plain nested title",
    };
    const parsed = parseToc([
      String.raw`\contentsline {chapter}{Chapter {with {nested} braces}}{1}{chapter.1}`,
      String.raw`\contentsline {section}{\numberline {1.1}Plain {nested title}}{2}{section.1.1}`,
      String.raw`\contentsline {chapter}{Transform}{3}{chapter.2}`,
      String.raw`\contentsline {section}{\numberline {2.1}תכונות של התמרת פוריה ב-$\ensuremath {\mathcal {G}}\qty (\ensuremath {\mathbb {R}})$}{3}{section.2.1}`,
      String.raw`\contentsline {section}{\numberline {2.2}נוסחאות היפוך והתמרת פוריה ב-$\ensuremath {\mathcal {G}}^2\qty (\ensuremath {\mathbb {R}})$}{4}{section.2.2}`,
      String.raw`\contentsline {section}{\numberline {2.3}קונבולוציה ב-$\ensuremath {\mathcal {G}}\qty (\ensuremath {\mathbb {R}})$}{5}{section.2.3}`,
    ].join("\n"), fixtureAliases);
    expect(parsed[0].title).toBe("Nested title");
    expect(parsed[0].sections[0].title).toBe("Plain nested title");
    expect(parsed[1].sections.map(({ title }) => title)).toEqual([
      "תכונות התמרת פוריה עבור פונקציות רציפות למקוטעין ואינטגרביליות בהחלט",
      "נוסחאות היפוך והתמרת פוריה עבור פונקציות רציפות למקוטעין וריבוע־אינטגרביליות",
      "קונבולוציה של פונקציות רציפות למקוטעין ואינטגרביליות בהחלט",
    ]);
  });

  it("rejects titles with unrecognized LaTeX", () => {
    expect(() => parseToc(String.raw`\contentsline {chapter}{Unknown $\alpha$}{1}{chapter.1}`)).toThrow(/still contains LaTeX/);
  });
});
