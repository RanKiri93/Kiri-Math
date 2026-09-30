import type { Metadata } from "next";
import { CourseMaterialsPanel } from "../_site/CourseMaterialsPanel";
import { CourseShell } from "../_site/CourseShell";
import { odeCoverArt } from "./art";
import { odeCourse } from "./course";
import { requireCourse } from "../_auth/server";

export const metadata: Metadata = { title: odeCourse.title };

export default async function OdeCoursePage() {
  await requireCourse("ode", "/ode");
  return (
    <CourseShell course={odeCourse} active="materials">
      <CourseMaterialsPanel course={odeCourse} art={odeCoverArt} />
    </CourseShell>
  );
}
