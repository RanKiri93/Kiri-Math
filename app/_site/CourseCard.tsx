import Link from "next/link";
import type { CourseSummary } from "./courseModel";

export function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <Link className="course-card" href={course.href}>
      <span className="course-card-code" dir="ltr">
        {course.code}
      </span>
      <h2>{course.title}</h2>
      <p>{course.tagline}</p>
      <span className="course-card-meta">
        {course.chapterCount} פרקים · {course.moduleCount} מודולים אינטראקטיביים
      </span>
      <span className="course-card-cta">כניסה לקורס</span>
    </Link>
  );
}
