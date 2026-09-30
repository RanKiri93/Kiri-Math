import type { Metadata } from "next";
import { CourseMaterialsPanel } from "../_site/CourseMaterialsPanel";
import { CourseShell } from "../_site/CourseShell";
import { fourierMaterialsArt } from "./art";
import { fourierCourse } from "./course";
import { requireCourse } from "../_auth/server";

export const metadata: Metadata = { title: fourierCourse.title };

export default async function FourierCoursePage() {
  await requireCourse("fourier", "/fourier");
  return (
    <CourseShell course={fourierCourse} active="materials">
      <CourseMaterialsPanel course={fourierCourse} art={fourierMaterialsArt} />
    </CourseShell>
  );
}
