import type { Metadata } from "next";
import { CourseMaterialsPanel } from "../_site/CourseMaterialsPanel";
import { CourseShell } from "../_site/CourseShell";
import { odeCoverArt } from "./art";
import { odeCourse } from "./course";

export const metadata: Metadata = { title: odeCourse.title };

export default function OdeCoursePage() {
  return (
    <CourseShell course={odeCourse} active="materials">
      <CourseMaterialsPanel course={odeCourse} art={odeCoverArt} />
    </CourseShell>
  );
}
