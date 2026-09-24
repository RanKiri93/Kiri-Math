import type { Metadata } from "next";
import { ChapterPanel } from "../_site/ChapterPanel";
import { CourseShell } from "../_site/CourseShell";
import { chapterLabel, findChapter } from "../_site/courseModel";
import { fourierChapterArt } from "./art";
import { fourierCourse } from "./course";

export function FourierChapterPage({ chapter }: { chapter: number }) {
  return (
    <CourseShell course={fourierCourse} active={chapter}>
      <ChapterPanel course={fourierCourse} chapter={chapter} art={fourierChapterArt(chapter)} />
    </CourseShell>
  );
}

export function fourierChapterMetadata(chapter: number): Metadata {
  const entry = findChapter(fourierCourse, chapter);
  return { title: entry ? chapterLabel(entry) : `פרק ${chapter}` };
}
