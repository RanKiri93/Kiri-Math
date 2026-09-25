import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { moduleCrumbs, notesPageHref } from "../_site/courseModel";
import { locateNotesTarget } from "../_site/notesNavigation";
import { odeCourse } from "./course";

const repoRoot = join(__dirname, "..", "..");

function routeFileFor(href: string): string {
  return join(repoRoot, "app", ...href.split("/").filter(Boolean), "page.tsx");
}

const allSections = odeCourse.chapters.flatMap((chapter) => chapter.sections);

describe("odeCourse chapters", () => {
  it("are numbered 1…6 in order, matching the notes", () => {
    expect(odeCourse.chapters.map((chapter) => chapter.number)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("have sections numbered under their own chapter", () => {
    for (const chapter of odeCourse.chapters) {
      expect(chapter.sections.length).toBeGreaterThan(0);
      for (const section of chapter.sections) {
        expect(section.number.startsWith(`${chapter.number}.`), section.number).toBe(true);
      }
    }
  });

  it("have printed pages that never go backwards", () => {
    const pages = odeCourse.chapters.flatMap((chapter) => [chapter.page, ...chapter.sections.map((s) => s.page)]);
    expect(pages).toEqual([...pages].sort((a, b) => a - b));
  });

  it("each have a route file", () => {
    for (const chapter of odeCourse.chapters) {
      expect(existsSync(routeFileFor(`${odeCourse.href}/${chapter.number}`)), `chapter ${chapter.number}`).toBe(true);
    }
  });
});

describe("odeCourse modules", () => {
  it("registers the four chapter-one subject modules against the notes sections", () => {
    expect(odeCourse.modules.filter((entry) => entry.chapter === 1).map(({ id, sections }) => [id, sections])).toEqual([
      ["function-sequences", ["1.1"]],
      ["function-series", ["1.2"]],
      ["power-series", ["1.3"]],
      ["taylor-series", ["1.3"]],
    ]);
  });

  it("have unique ids", () => {
    const ids = odeCourse.modules.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(odeCourse.modules.map((entry) => [entry.id, entry] as const))(
    "%s is attached to sections that exist in its own chapter",
    (_id, entry) => {
      expect(entry.sections.length).toBeGreaterThan(0);
      for (const sectionNumber of entry.sections) {
        expect(allSections.some((section) => section.number === sectionNumber), sectionNumber).toBe(true);
        expect(sectionNumber.startsWith(`${entry.chapter}.`), sectionNumber).toBe(true);
      }
    },
  );

  it.each(odeCourse.modules.map((entry) => [entry.id, entry] as const))(
    "%s lives at /ode/<chapter>/<id> and that route exists",
    (_id, entry) => {
      expect(entry.href).toBe(`${odeCourse.href}/${entry.chapter}/${entry.id}`);
      expect(existsSync(routeFileFor(entry.href)), entry.href).toBe(true);
    },
  );

  it("every module section resolves to a printed page in the notes", () => {
    for (const courseModule of odeCourse.modules) {
      for (const sectionNumber of courseModule.sections) {
        const location = locateNotesTarget(odeCourse.chapters, { kind: "section", section: sectionNumber });
        expect(location?.section?.number, sectionNumber).toBe(sectionNumber);
        expect(location?.section?.title.length, sectionNumber).toBeGreaterThan(0);
        expect(location?.printedPage, sectionNumber).toEqual(expect.any(Number));
      }
    }
  });

  it("breadcrumbs end at the module's chapter page", () => {
    const crumbs = moduleCrumbs(odeCourse, "phase-plane");
    expect(crumbs.map((crumb) => crumb.href)).toEqual(["/", "/ode", "/ode/5"]);
    expect(crumbs[2].label).toBe("פרק 5 · מערכות מד״ר");
  });
});

describe("odeCourse notes and resources", () => {
  it("map printed pages to physical PDF pages through the front-matter offset", () => {
    expect(Number.isInteger(odeCourse.notes.pageOffset)).toBe(true);
    expect(odeCourse.notes.pageOffset).toBeGreaterThanOrEqual(0);
    expect(notesPageHref(odeCourse, 1)).toBe(`/courses/ode/notes.pdf#page=${1 + odeCourse.notes.pageOffset}`);
  });

  it("point at files that exist in public/", () => {
    for (const href of [odeCourse.notes.href, ...odeCourse.resources.map((resource) => resource.href)]) {
      expect(existsSync(join(repoRoot, "public", ...href.split("/").filter(Boolean))), href).toBe(true);
    }
  });
});
