import { notesPageHref, type CourseDefinition } from "./courseModel";
import { locateNotesTarget } from "./notesNavigation";

export function NotesSectionLinks({
  course,
  sections,
}: {
  course: CourseDefinition;
  sections: readonly string[];
}) {
  return (
    <ul className="module-notes-list">
      {sections.map((number) => {
        const location = locateNotesTarget(course.chapters, { kind: "section", section: number });
        if (!location?.section || location.printedPage === null) {
          throw new Error(`Section ${number} is not in the notes of "${course.slug}"`);
        }
        return (
          <li key={number}>
            <a
              href={notesPageHref(course, location.printedPage)}
              target="_blank"
              rel="noopener noreferrer"
              data-notes-section={number}
            >
              <bdi className="module-notes-number" dir="ltr">
                {number}
              </bdi>{" "}
              {location.section.title} <small>עמ׳ {location.printedPage}</small>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
