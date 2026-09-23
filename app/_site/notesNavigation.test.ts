import { describe, expect, it } from "vitest";
import { odeCourse } from "../ode/course";
import { notesPageHref, type NotesChapter } from "./courseModel";
import {
  locateNotesTarget,
  notesCoverLocation,
  notesLocationHref,
  notesTargetFromData,
  notesViewerSrc,
  type NotesLocation,
} from "./notesNavigation";

const chapters: readonly NotesChapter[] = [
  {
    number: 1,
    title: "first",
    page: 1,
    sections: [
      { number: "1.1", title: "a", page: 1 },
      { number: "1.2", title: "b", page: 5 },
    ],
  },
  { number: 2, title: "intro page", page: 9, sections: [{ number: "2.1", title: "c", page: 10 }] },
  { number: 3, title: "no sections", page: 12, sections: [] },
  { number: 4, title: "last", page: 14, sections: [{ number: "4.1", title: "d", page: 14 }] },
];

function locate(target: Parameters<typeof locateNotesTarget>[1]): NotesLocation {
  const location = locateNotesTarget(chapters, target);
  if (!location) {
    throw new Error(`Target ${JSON.stringify(target)} did not resolve`);
  }
  return location;
}

describe("locateNotesTarget", () => {
  it("opens the cover with the first section as next", () => {
    const cover = notesCoverLocation(chapters);
    expect(cover.printedPage).toBeNull();
    expect(cover.previous).toBeNull();
    expect(cover.next?.number).toBe("1.1");
    expect(locate({ kind: "cover" })).toEqual(cover);
  });

  it("steps between sections, across chapter boundaries", () => {
    const section = locate({ kind: "section", section: "1.2" });
    expect(section.printedPage).toBe(5);
    expect(section.chapter?.number).toBe(1);
    expect(section.previous?.number).toBe("1.1");
    expect(section.next?.number).toBe("2.1");
    expect(locate({ kind: "section", section: "2.1" }).previous?.number).toBe("1.2");
  });

  it("has no previous before the first section and no next after the last", () => {
    expect(locate({ kind: "section", section: "1.1" }).previous).toBeNull();
    expect(locate({ kind: "section", section: "4.1" }).next).toBeNull();
  });

  it("opens a chapter at its own page when it starts before its first section", () => {
    const chapter = locate({ kind: "chapter", chapter: 2 });
    expect(chapter.target).toEqual({ kind: "chapter", chapter: 2 });
    expect(chapter.printedPage).toBe(9);
    expect(chapter.section).toBeNull();
    expect(chapter.previous?.number).toBe("1.2");
    expect(chapter.next?.number).toBe("2.1");
  });

  it("treats a chapter that starts on its first section's page as that section", () => {
    expect(locate({ kind: "chapter", chapter: 1 })).toEqual(locate({ kind: "section", section: "1.1" }));
    expect(locate({ kind: "chapter", chapter: 4 }).section?.number).toBe("4.1");
  });

  it("handles a chapter without sections", () => {
    const chapter = locate({ kind: "chapter", chapter: 3 });
    expect(chapter.printedPage).toBe(12);
    expect(chapter.previous?.number).toBe("2.1");
    expect(chapter.next?.number).toBe("4.1");
  });

  it("rejects targets that are not in the notes", () => {
    expect(locateNotesTarget(chapters, { kind: "section", section: "9.9" })).toBeNull();
    expect(locateNotesTarget(chapters, { kind: "chapter", chapter: 9 })).toBeNull();
  });

  it("walks every section of the course notes once, in order, from the cover", () => {
    const expected = odeCourse.chapters.flatMap((chapter) => chapter.sections.map((section) => section.number));
    const visited: string[] = [];
    let location: NotesLocation | null = notesCoverLocation(odeCourse.chapters);
    while (location?.next) {
      visited.push(location.next.number);
      location = locateNotesTarget(odeCourse.chapters, { kind: "section", section: location.next.number });
    }
    expect(visited).toEqual(expected);
  });
});

describe("notesTargetFromData", () => {
  it("reads section and chapter data attributes", () => {
    expect(notesTargetFromData({ notesSection: "4.4" })).toEqual({ kind: "section", section: "4.4" });
    expect(notesTargetFromData({ notesChapter: "2" })).toEqual({ kind: "chapter", chapter: 2 });
  });

  it("ignores links without usable data", () => {
    expect(notesTargetFromData({})).toBeNull();
    expect(notesTargetFromData({ notesChapter: "two" })).toBeNull();
  });
});

describe("viewer and new-tab addresses", () => {
  it("opens the viewer at the same physical page as the new-tab link", () => {
    const section = odeCourse.chapters[3].sections[3];
    const src = notesViewerSrc(odeCourse, section.page);
    expect(src.startsWith(`${notesPageHref(odeCourse, section.page)}&`)).toBe(true);
    expect(src).toContain("toolbar=0");
  });

  it("opens the cover at physical page 1 and links the whole file for it", () => {
    const cover = notesCoverLocation(odeCourse.chapters);
    expect(notesViewerSrc(odeCourse, null)).toMatch(/#page=1&/);
    expect(notesLocationHref(odeCourse, cover)).toBe(odeCourse.notes.href);
  });
});
