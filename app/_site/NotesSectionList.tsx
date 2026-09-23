import Link from "next/link";
import { modulesForSection, notesPageHref, type CourseDefinition, type NotesChapter } from "./courseModel";

type NotesSectionListProps = {
  course: CourseDefinition;
  chapter: NotesChapter;
  currentSection?: string;
};

export function NotesSectionList({ course, chapter, currentSection }: NotesSectionListProps) {
  return (
    <ol className="notes-sections">
      {chapter.sections.map((section) => {
        const modules = modulesForSection(course, section.number);
        return (
          <li className="notes-section" key={section.number}>
            <a
              className="notes-section-link"
              href={notesPageHref(course, section.page)}
              target="_blank"
              rel="noopener noreferrer"
              data-notes-section={section.number}
              aria-current={currentSection === section.number ? "location" : undefined}
            >
              <span className="notes-section-number" dir="ltr">
                {section.number}
              </span>
              <span className="notes-section-title">{section.title}</span>
            </a>
            <span className="notes-section-tags">
              {modules.map((courseModule) => (
                <Link
                  key={courseModule.id}
                  className={`module-tag ${courseModule.status}`}
                  href={courseModule.href}
                >
                  {courseModule.title}
                </Link>
              ))}
            </span>
            <span className="notes-section-page">עמ׳ {section.page}</span>
          </li>
        );
      })}
    </ol>
  );
}
