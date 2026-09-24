import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { courses } from "../courses";
import { notesPageHref } from "../_site/courseModel";
import { locateNotesTarget } from "../_site/notesNavigation";
import { readPageOffset } from "../../scripts/sync-course-notes";
import { fourierCourse } from "./course";

const root = join(__dirname, "..", "..");
const routeFile = (href: string) => join(root, "app", ...href.split("/").filter(Boolean), "page.tsx");

describe("Fourier course registration and assets", () => {
  it("is registered on the dashboard alongside ODE, with four chapters and no modules", () => {
    expect(courses.map(({ slug }) => slug)).toEqual(["ode", "fourier"]);
    expect(courses.find(({ slug }) => slug === "fourier")).toMatchObject({ href: "/fourier", chapterCount: 4, moduleCount: 0 });
    expect(fourierCourse.chapters).toHaveLength(4);
    expect(fourierCourse.chapters.reduce((count, chapter) => count + chapter.sections.length, 0)).toBe(18);
    expect(fourierCourse.modules).toEqual([]);
  });

  it("preserves ordered chapters, section numbers and printed pages from the notes", () => {
    expect(fourierCourse.chapters.map(({ number, page }) => [number, page])).toEqual([
      [1, 1], [2, 27], [3, 55], [4, 84],
    ]);
    for (const chapter of fourierCourse.chapters) {
      expect(chapter.sections.map(({ number }) => number)).toEqual(
        chapter.sections.map((_, index) => `${chapter.number}.${index + 1}`),
      );
      for (const entry of [chapter, ...chapter.sections]) {
        expect(entry.title).not.toMatch(/[\\{}$]/);
      }
    }
    const pages = fourierCourse.chapters.flatMap((chapter) => [chapter.page, ...chapter.sections.map(({ page }) => page)]);
    expect(pages).toEqual([...pages].sort((a, b) => a - b));
  });

  it("has course and chapter routes and course-isolated PDF resources", () => {
    expect(existsSync(routeFile(fourierCourse.href))).toBe(true);
    for (const chapter of fourierCourse.chapters) {
      expect(existsSync(routeFile(`${fourierCourse.href}/${chapter.number}`)), `chapter ${chapter.number}`).toBe(true);
    }
    expect(fourierCourse.resources.map(({ href }) => href)).toEqual([
      "/courses/fourier/notes.pdf", "/courses/fourier/syllabus.pdf", "/courses/fourier/formula-sheet.pdf",
    ]);
    for (const resource of fourierCourse.resources) {
      const path = join(root, "public", ...resource.href.split("/").filter(Boolean));
      const bytes = readFileSync(path);
      expect(bytes.subarray(0, 5).toString(), resource.href).toBe("%PDF-");
    }
    for (const href of ["/courses/ode/notes.pdf", "/courses/ode/syllabus.pdf", "/courses/ode/formula-sheet.pdf"]) {
      expect(fourierCourse.resources.some((resource) => resource.href === href)).toBe(false);
    }
  });

  it("navigates all sections across chapter boundaries and opens chapter 2 before its first section", () => {
    const sections = fourierCourse.chapters.flatMap((chapter) => chapter.sections);
    for (let index = 0; index < sections.length; index += 1) {
      const current = sections[index];
      const location = locateNotesTarget(fourierCourse.chapters, { kind: "section", section: current.number });
      expect(location?.section).toEqual(current);
      expect(location?.previous).toEqual(index > 0 ? sections[index - 1] : null);
      expect(location?.next).toEqual(sections[index + 1] ?? null);
    }
    const chapterTwo = locateNotesTarget(fourierCourse.chapters, { kind: "chapter", chapter: 2 });
    expect(chapterTwo).toMatchObject({ printedPage: 27, section: null, next: sections.find(({ number }) => number === "2.1") });
  });

  it("maps printed pages using the physical PDF page-label offset", () => {
    const pdf = readFileSync(join(root, "public/courses/fourier/notes.pdf"));
    expect(fourierCourse.notes.pageOffset).toBe(2);
    expect(readPageOffset(pdf)).toBe(fourierCourse.notes.pageOffset);
    expect(notesPageHref(fourierCourse, 1)).toBe("/courses/fourier/notes.pdf#page=3");
  });
});
