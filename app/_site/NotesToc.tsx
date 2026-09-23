import Link from "next/link";
import { chapterHref, notesPageHref, type CourseDefinition } from "./courseModel";
import type { NotesLocation } from "./notesNavigation";
import { NotesSectionList } from "./NotesSectionList";

export function NotesToc({ course, current }: { course: CourseDefinition; current?: NotesLocation }) {
  const currentChapter = current && !current.section ? current.chapter?.number : undefined;

  return (
    <section className="notes-toc" aria-labelledby="notes-toc-heading">
      <h2 className="course-panel-heading" id="notes-toc-heading">
        תוכן העניינים
      </h2>
      {course.chapters.map((chapter) => (
        <section className="notes-toc-chapter" key={chapter.number}>
          <header className="notes-toc-chapter-header">
            <Link href={chapterHref(course, chapter.number)}>
              <span className="notes-toc-chapter-number" dir="ltr">
                {chapter.number}
              </span>
              {chapter.title}
            </Link>
            <a
              href={notesPageHref(course, chapter.page)}
              target="_blank"
              rel="noopener noreferrer"
              data-notes-chapter={chapter.number}
              aria-current={currentChapter === chapter.number ? "location" : undefined}
            >
              עמ׳ {chapter.page}
            </a>
          </header>
          <NotesSectionList course={course} chapter={chapter} currentSection={current?.section?.number} />
        </section>
      ))}
    </section>
  );
}
