import Link from "next/link";
import {
  chapterHref,
  chapterLabel,
  findChapter,
  modulesForChapter,
  notesPageHref,
  sectionRangeLabel,
  type CourseDefinition,
} from "./courseModel";
import { NotesDialogHost } from "./NotesDialog";
import { NotesSectionList } from "./NotesSectionList";

const statusLabels = {
  active: "מודול פעיל",
  construction: "מודול בבנייה",
} as const;

export function ChapterPanel({ course, chapter: chapterNumber }: { course: CourseDefinition; chapter: number }) {
  const chapter = findChapter(course, chapterNumber);
  if (!chapter) {
    throw new Error(`Chapter ${chapterNumber} is not in the notes of "${course.slug}"`);
  }
  const modules = modulesForChapter(course, chapter.number);
  const previous = findChapter(course, chapter.number - 1);
  const next = findChapter(course, chapter.number + 1);

  return (
    <NotesDialogHost course={course}>
      <section className="course-panel chapter-panel">
        <header className="chapter-panel-header">
          <span className="chapter-panel-number" dir="ltr" aria-hidden="true">
            {chapter.number}
          </span>
          <div className="course-panel-header">
            <p className="course-panel-kicker">פרק {chapter.number}</p>
            <h1>{chapter.title}</h1>
            <a
              className="chapter-panel-notes-link"
              href={notesPageHref(course, chapter.page)}
              target="_blank"
              rel="noopener noreferrer"
              data-notes-chapter={chapter.number}
            >
              פתיחת הפרק ברשימות · עמ׳ {chapter.page}
            </a>
          </div>
        </header>

        <section aria-labelledby="chapter-modules-heading">
          <h2 className="course-panel-heading" id="chapter-modules-heading">
            מודולים אינטראקטיביים
          </h2>
          {modules.length > 0 ? (
            <div className="course-module-grid">
              {modules.map((courseModule) => (
                <Link
                  key={courseModule.id}
                  className={`course-module-card ${courseModule.status}`}
                  href={courseModule.href}
                >
                  <span>{statusLabels[courseModule.status]}</span>
                  <h3>{courseModule.title}</h3>
                  <p>{courseModule.description}</p>
                  <small className="course-module-sections">
                    {courseModule.sections.length === 1 ? "סעיף" : "סעיפים"}{" "}
                    <bdi dir="ltr">{sectionRangeLabel(courseModule.sections)}</bdi> ברשימות
                  </small>
                </Link>
              ))}
            </div>
          ) : (
            <p className="course-panel-note">לפרק זה עדיין אין מודולים אינטראקטיביים. הסעיפים שלו ברשימות מופיעים למטה.</p>
          )}
        </section>

        <section aria-labelledby="chapter-sections-heading">
          <h2 className="course-panel-heading" id="chapter-sections-heading">
            הפרק ברשימות
          </h2>
          <NotesSectionList course={course} chapter={chapter} />
        </section>

        <nav className="chapter-pager" aria-label="מעבר בין פרקים">
          {previous ? (
            <Link className="previous" href={chapterHref(course, previous.number)}>
              <small>הפרק הקודם</small>
              <strong>{chapterLabel(previous)}</strong>
            </Link>
          ) : null}
          {next ? (
            <Link className="next" href={chapterHref(course, next.number)}>
              <small>הפרק הבא</small>
              <strong>{chapterLabel(next)}</strong>
            </Link>
          ) : null}
        </nav>
      </section>
    </NotesDialogHost>
  );
}
