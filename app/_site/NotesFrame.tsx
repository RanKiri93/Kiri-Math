import { chapterLabel, type CourseDefinition, type NotesSection } from "./courseModel";
import { notesLocationHref, notesViewerSrc, type NotesLocation, type NotesTarget } from "./notesNavigation";

type NotesFrameProps = {
  course: CourseDefinition;
  location: NotesLocation;
  /** Changing it remounts the viewer, so a repeated jump to the same section still lands there. */
  loadKey: number;
  viewerMounted: boolean;
  titleId: string;
  onNavigate: (target: NotesTarget) => void;
  tocToggle?: { expanded: boolean; controls: string; onToggle: () => void };
  onClose?: () => void;
};

function locationKicker({ chapter, section, printedPage }: NotesLocation): string {
  if (!chapter || printedPage === null) {
    return "עמוד השער";
  }
  const chapterPart = section ? chapterLabel(chapter) : `פרק ${chapter.number}`;
  return `${chapterPart} · עמ׳ ${printedPage}`;
}

function stepTitle(label: string, section: NotesSection | null): string | undefined {
  return section ? `${label}: ${section.number} ${section.title}` : undefined;
}

export function NotesFrame({
  course,
  location,
  loadKey,
  viewerMounted,
  titleId,
  onNavigate,
  tocToggle,
  onClose,
}: NotesFrameProps) {
  const { chapter, section, previous, next, printedPage } = location;

  return (
    <div className="notes-frame">
      <div className="notes-frame-bar">
        <p className="notes-frame-location" id={titleId}>
          <small>{locationKicker(location)}</small>
          <strong>
            {section ? (
              <bdi className="notes-frame-number" dir="ltr">
                {section.number}
              </bdi>
            ) : null}
            <span>{section?.title ?? chapter?.title ?? "רשימות הקורס"}</span>
          </strong>
        </p>

        <div className="notes-frame-actions">
          <button
            type="button"
            className="notes-frame-button icon"
            aria-label="הסעיף הקודם"
            title={stepTitle("הסעיף הקודם", previous)}
            disabled={!previous}
            onClick={() => previous && onNavigate({ kind: "section", section: previous.number })}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>
          <button
            type="button"
            className="notes-frame-button icon"
            aria-label="הסעיף הבא"
            title={stepTitle("הסעיף הבא", next)}
            disabled={!next}
            onClick={() => next && onNavigate({ kind: "section", section: next.number })}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M10 3L5 8l5 5" />
            </svg>
          </button>
          {tocToggle ? (
            <button
              type="button"
              className="notes-frame-button"
              aria-expanded={tocToggle.expanded}
              aria-controls={tocToggle.controls}
              onClick={tocToggle.onToggle}
            >
              תוכן העניינים
            </button>
          ) : null}
          <a
            className="notes-frame-button"
            href={notesLocationHref(course, location)}
            target="_blank"
            rel="noopener noreferrer"
          >
            פתיחה בלשונית חדשה
          </a>
          <a className="notes-frame-button" href={course.notes.href} download={`${course.code}-notes.pdf`}>
            הורדה
          </a>
          {onClose ? (
            <button type="button" className="icon-button" aria-label="סגירה" onClick={onClose}>
              ×
            </button>
          ) : null}
        </div>
      </div>

      <div className="notes-frame-viewer">
        {viewerMounted ? (
          <iframe
            key={loadKey}
            className="notes-frame-iframe"
            src={notesViewerSrc(course, printedPage)}
            title="רשימות הקורס"
            loading="lazy"
          />
        ) : null}
      </div>
    </div>
  );
}
