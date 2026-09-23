import { notesPageHref, type CourseDefinition, type NotesChapter, type NotesSection } from "./courseModel";

export type NotesTarget =
  | { kind: "cover" }
  | { kind: "chapter"; chapter: number }
  | { kind: "section"; section: string };

export type NotesLocation = {
  target: NotesTarget;
  /** Printed page the viewer opens at; null for the cover. */
  printedPage: number | null;
  chapter: NotesChapter | null;
  section: NotesSection | null;
  previous: NotesSection | null;
  next: NotesSection | null;
};

type FlatSection = { chapter: NotesChapter; section: NotesSection };

// Chrome and Edge read view, navpanes and toolbar; Firefox's PDF.js reads zoom and pagemode.
// Each viewer ignores the parameters it does not know.
const viewerParams = "view=FitH&zoom=page-width&navpanes=0&pagemode=none&toolbar=0";

function flattenSections(chapters: readonly NotesChapter[]): FlatSection[] {
  return chapters.flatMap((chapter) => chapter.sections.map((section) => ({ chapter, section })));
}

export function notesCoverLocation(chapters: readonly NotesChapter[]): NotesLocation {
  const first = chapters.find((chapter) => chapter.sections.length > 0)?.sections[0] ?? null;
  return { target: { kind: "cover" }, printedPage: null, chapter: null, section: null, previous: null, next: first };
}

export function locateNotesTarget(chapters: readonly NotesChapter[], target: NotesTarget): NotesLocation | null {
  if (target.kind === "cover") {
    return notesCoverLocation(chapters);
  }

  const flat = flattenSections(chapters);
  const sectionAt = (index: number) => flat[index]?.section ?? null;

  if (target.kind === "section") {
    const index = flat.findIndex((entry) => entry.section.number === target.section);
    if (index < 0) {
      return null;
    }
    const { chapter, section } = flat[index];
    return {
      target,
      printedPage: section.page,
      chapter,
      section,
      previous: sectionAt(index - 1),
      next: sectionAt(index + 1),
    };
  }

  const chapter = chapters.find((entry) => entry.number === target.chapter);
  if (!chapter) {
    return null;
  }
  const first = chapter.sections[0];
  if (first && first.page === chapter.page) {
    return locateNotesTarget(chapters, { kind: "section", section: first.number });
  }
  const before = flat.filter((entry) => entry.chapter.number < chapter.number);
  return {
    target,
    printedPage: chapter.page,
    chapter,
    section: null,
    previous: before.length > 0 ? before[before.length - 1].section : null,
    next: sectionAt(before.length),
  };
}

export function notesTargetFromData(data: Readonly<Record<string, string | undefined>>): NotesTarget | null {
  if (data.notesSection) {
    return { kind: "section", section: data.notesSection };
  }
  if (data.notesChapter) {
    const chapter = Number(data.notesChapter);
    return Number.isInteger(chapter) ? { kind: "chapter", chapter } : null;
  }
  return null;
}

export function notesViewerSrc(course: CourseDefinition, printedPage: number | null): string {
  const physicalPage = printedPage === null ? 1 : printedPage + course.notes.pageOffset;
  return `${course.notes.href}#page=${physicalPage}&${viewerParams}`;
}

export function notesLocationHref(course: CourseDefinition, location: NotesLocation): string {
  return location.printedPage === null ? course.notes.href : notesPageHref(course, location.printedPage);
}
