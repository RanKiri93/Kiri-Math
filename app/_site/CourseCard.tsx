import { ArtSvg } from "./ArtSvg";
import { CourseEntry } from "./CourseEntry";
import type { CourseSummary } from "./courseModel";
import { FadedEquations } from "./FadedEquations";

export function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <CourseEntry
      href={course.href}
      title={course.title}
      className="course-card"
      cover={
        <span className="course-card-art" aria-hidden="true">
          <ArtSvg piece={course.art.cover} animated />
          <FadedEquations items={course.art.equations} />
        </span>
      }
    >
      <span className="course-card-body">
        <span className="course-card-code" dir="ltr">
          {course.code}
        </span>
        <h2>{course.title}</h2>
        <p>{course.tagline}</p>
        <span className="course-card-meta">
          {course.chapterCount} פרקים · {course.moduleCount} מודולים אינטראקטיביים
        </span>
        <span className="course-card-cta">כניסה לקורס</span>
      </span>
    </CourseEntry>
  );
}
