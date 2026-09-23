import { NotesDialogHost } from "../_site/NotesDialog";
import { NotesSectionLinks } from "../_site/NotesSectionLinks";
import { findModule } from "../_site/courseModel";
import { odeCourse } from "./course";

/** The notes sections one module covers, opened in the in-site reader on a wide screen. */
export function OdeNotesSections({ moduleId }: { moduleId: string }) {
  const courseModule = findModule(odeCourse, moduleId);
  return (
    <NotesDialogHost course={odeCourse}>
      <aside className="module-notes" aria-label="לקריאה ברשימות">
        <p className="module-notes-heading">לקריאה ברשימות</p>
        <NotesSectionLinks course={odeCourse} sections={courseModule.sections} />
      </aside>
    </NotesDialogHost>
  );
}
