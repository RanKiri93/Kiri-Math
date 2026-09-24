import type { Metadata } from "next";
import { CourseMaterialsPanel } from "../_site/CourseMaterialsPanel";
import { CourseShell } from "../_site/CourseShell";
import { fourierMaterialsArt } from "./art";
import { fourierCourse } from "./course";

export const metadata: Metadata = { title: fourierCourse.title };

export default function FourierCoursePage() {
  return (
    <CourseShell course={fourierCourse} active="materials">
      <CourseMaterialsPanel course={fourierCourse} art={fourierMaterialsArt} />
    </CourseShell>
  );
}
