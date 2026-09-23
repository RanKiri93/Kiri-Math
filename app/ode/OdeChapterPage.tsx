import type { Metadata } from "next";
import { ChapterPanel } from "../_site/ChapterPanel";
import { CourseShell } from "../_site/CourseShell";
import { chapterLabel, findChapter, findModule } from "../_site/courseModel";
import { odeCourse } from "./course";

export function OdeChapterPage({ chapter }: { chapter: number }) {
  return (
    <CourseShell course={odeCourse} active={chapter}>
      <ChapterPanel course={odeCourse} chapter={chapter} />
    </CourseShell>
  );
}

export function odeChapterMetadata(chapter: number): Metadata {
  const entry = findChapter(odeCourse, chapter);
  return { title: entry ? chapterLabel(entry) : `פרק ${chapter}` };
}

export function odeModuleMetadata(moduleId: string): Metadata {
  return { title: findModule(odeCourse, moduleId).title };
}
