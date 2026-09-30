import { ArtSvg } from "./ArtSvg";
import type { CourseSummary } from "./courseModel";
import { FadedEquations } from "./FadedEquations";

export type CourseAccess = "available" | "locked" | "guest";

export function CourseCard({ course, access = "locked" }: { course: CourseSummary; access?: CourseAccess }) {
  const destination = access === "available"
    ? course.href
    : access === "guest"
      ? `/login?next=${encodeURIComponent(course.href)}`
      : `/access-required?course=${encodeURIComponent(course.slug)}`;
  const body = (
      <span className="course-card-body">
        <span className="course-card-code" dir="ltr">{course.code}</span>
        <h2>{course.title}</h2>
        <p>{course.tagline}</p>
        <span className="course-card-meta">{course.chapterCount} פרקים · {course.moduleCount} מודולים אינטראקטיביים</span>
        <span className={`course-card-cta ${access === "locked" ? "is-locked" : ""}`}>
          {access === "available" ? "כניסה לקורס" : access === "guest" ? "התחברות לכניסה" : "עדיין לא זמין לכם"}
        </span>
      </span>
  );
  if (access !== "available") {
    return <a href={destination} className={`course-card course-card-${access}`}>
      <span className="course-card-art" aria-hidden="true"><ArtSvg piece={course.art.cover} /><FadedEquations items={course.art.equations} /></span>
      {body}
    </a>;
  }
  return (
    <a
      href={destination}
      className="course-card"
      data-course-entry=""
    >
      <span className="course-card-art" aria-hidden="true"><ArtSvg piece={course.art.cover} /><FadedEquations items={course.art.equations} /></span>
      {body}
    </a>
  );
}
