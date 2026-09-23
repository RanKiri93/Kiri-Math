export type NotesSection = {
  number: string;
  title: string;
  page: number;
};

export type NotesChapter = {
  number: number;
  title: string;
  page: number;
  sections: readonly NotesSection[];
};

export type CourseModuleStatus = "active" | "construction";

export type CourseModule = {
  id: string;
  chapter: number;
  sections: readonly string[];
  title: string;
  description: string;
  status: CourseModuleStatus;
  href: string;
};

export type CourseResource = {
  id: string;
  title: string;
  description: string;
  href: string;
};

export type CourseDefinition = {
  slug: string;
  code: string;
  title: string;
  tagline: string;
  href: string;
  notes: {
    href: string;
    /** Physical PDF page index of printed page 1, minus one. */
    pageOffset: number;
  };
  chapters: readonly NotesChapter[];
  modules: readonly CourseModule[];
  resources: readonly CourseResource[];
};

export type CourseSummary = Pick<CourseDefinition, "slug" | "code" | "title" | "tagline" | "href"> & {
  chapterCount: number;
  moduleCount: number;
};

export type Crumb = {
  label: string;
  href?: string;
};

export const siteName = "Kiri Math";

export function courseAssetHref(courseSlug: string, fileName: string): string {
  return `/courses/${courseSlug}/${fileName}`;
}

export function chapterHref(course: CourseDefinition, chapter: number): string {
  return `${course.href}/${chapter}`;
}

export function notesPageHref(course: CourseDefinition, printedPage: number): string {
  return `${course.notes.href}#page=${printedPage + course.notes.pageOffset}`;
}

export function findChapter(course: CourseDefinition, chapter: number): NotesChapter | undefined {
  return course.chapters.find((entry) => entry.number === chapter);
}

export function modulesForChapter(course: CourseDefinition, chapter: number): CourseModule[] {
  return course.modules.filter((entry) => entry.chapter === chapter);
}

export function modulesForSection(course: CourseDefinition, sectionNumber: string): CourseModule[] {
  return course.modules.filter((entry) => entry.sections.includes(sectionNumber));
}

export function sectionRangeLabel(sections: readonly string[]): string {
  if (sections.length === 0) {
    return "";
  }
  if (sections.length === 1) {
    return sections[0];
  }
  return `${sections[0]}–${sections[sections.length - 1]}`;
}

export function chapterLabel(chapter: NotesChapter): string {
  return `פרק ${chapter.number} · ${chapter.title}`;
}

export function findModule(course: CourseDefinition, moduleId: string): CourseModule {
  const courseModule = course.modules.find((entry) => entry.id === moduleId);
  if (!courseModule) {
    throw new Error(`Unknown module "${moduleId}" in course "${course.slug}"`);
  }
  return courseModule;
}

export function courseCrumbs(course: CourseDefinition, chapter?: number): Crumb[] {
  const home: Crumb = { label: siteName, href: "/" };
  if (chapter === undefined) {
    return [home, { label: course.title }];
  }
  return [home, { label: course.title, href: course.href }, { label: `פרק ${chapter}` }];
}

export function moduleCrumbs(course: CourseDefinition, moduleId: string): Crumb[] {
  const courseModule = findModule(course, moduleId);
  const chapter = findChapter(course, courseModule.chapter);
  return [
    { label: siteName, href: "/" },
    { label: course.title, href: course.href },
    {
      label: chapter ? chapterLabel(chapter) : `פרק ${courseModule.chapter}`,
      href: chapterHref(course, courseModule.chapter),
    },
  ];
}

export function summarizeCourse(course: CourseDefinition): CourseSummary {
  return {
    slug: course.slug,
    code: course.code,
    title: course.title,
    tagline: course.tagline,
    href: course.href,
    chapterCount: course.chapters.length,
    moduleCount: course.modules.length,
  };
}
