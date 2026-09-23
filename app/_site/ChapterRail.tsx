import Link from "next/link";
import { chapterHref, modulesForChapter, type CourseDefinition } from "./courseModel";

export type CoursePanelId = "materials" | number;

function moduleCountLabel(count: number): string | null {
  if (count === 0) {
    return null;
  }
  return count === 1 ? "מודול אחד" : `${count} מודולים`;
}

export function ChapterRail({ course, active }: { course: CourseDefinition; active: CoursePanelId }) {
  return (
    <nav className="chapter-rail" aria-label="פרקי הקורס">
      <div className="chapter-rail-heading">
        <span className="chapter-rail-code" dir="ltr">
          {course.code}
        </span>
        <Link className="chapter-rail-title" href={course.href}>
          {course.title}
        </Link>
      </div>
      <ol>
        <li>
          <Link
            className="chapter-rail-item materials"
            href={course.href}
            aria-current={active === "materials" ? "page" : undefined}
          >
            <span className="chapter-rail-number" aria-hidden="true">
              <svg viewBox="0 0 20 20" focusable="false">
                <path d="M5 2.5h7l3.5 3.5v11.5H5z M12 2.5V6h3.5 M7.5 10h5 M7.5 13h5" />
              </svg>
            </span>
            <span className="chapter-rail-label">
              <strong>חומר הקורס</strong>
              <small>הרשימות המלאות וחומר נלווה</small>
            </span>
          </Link>
        </li>
        {course.chapters.map((chapter) => {
          const modules = moduleCountLabel(modulesForChapter(course, chapter.number).length);
          return (
            <li key={chapter.number}>
              <Link
                className="chapter-rail-item"
                href={chapterHref(course, chapter.number)}
                aria-current={active === chapter.number ? "page" : undefined}
                title={chapter.title}
              >
                <span className="chapter-rail-number" dir="ltr">
                  {chapter.number}
                </span>
                <span className="chapter-rail-label">
                  <strong>{chapter.title}</strong>
                  {modules ? <small>{modules}</small> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
