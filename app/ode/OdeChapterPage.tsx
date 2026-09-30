import type { Metadata } from "next";
import type { SessionUser } from "../_auth/model";
import { completedCountByModule } from "../_progress/model";
import { getActivityCompletions } from "../_progress/server";
import { ChapterPanel } from "../_site/ChapterPanel";
import { CourseShell } from "../_site/CourseShell";
import { chapterLabel, findChapter, findModule } from "../_site/courseModel";
import { odeChapterArt } from "./art";
import { odeCourse } from "./course";

export async function OdeChapterPage({ chapter, user }: { chapter: number; user: SessionUser }) {
  const completed = completedCountByModule(await getActivityCompletions(user, "ode"));
  return (
    <CourseShell course={odeCourse} active={chapter}>
      <ChapterPanel course={odeCourse} chapter={chapter} art={odeChapterArt[chapter]} completed={completed} />
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
