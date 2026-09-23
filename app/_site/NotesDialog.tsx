"use client";

import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import type { CourseDefinition } from "./courseModel";
import { NotesFrame } from "./NotesFrame";
import { locateNotesTarget, type NotesLocation, type NotesTarget } from "./notesNavigation";
import { notesTargetFromClick, useNotesReaderAvailable } from "./useNotesReader";

/** Opens notes links inside `children` in a modal reader instead of a new tab, on screens wide enough for it. */
export function NotesDialogHost({ course, children }: { course: CourseDefinition; children: ReactNode }) {
  const available = useNotesReaderAvailable();
  const [location, setLocation] = useState<NotesLocation | null>(null);
  const [loadKey, setLoadKey] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const isOpen = location !== null && available;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  function navigate(target: NotesTarget): boolean {
    const next = locateNotesTarget(course.chapters, target);
    if (!next) {
      return false;
    }
    setLocation(next);
    setLoadKey((key) => key + 1);
    return true;
  }

  function handleLinkClick(event: MouseEvent<HTMLDivElement>) {
    if (!available) {
      return;
    }
    const target = notesTargetFromClick(event);
    if (target && navigate(target)) {
      event.preventDefault();
    }
  }

  // Close the element first and clear state in onClose: unmounting the focused content before
  // close() would stop the browser from returning focus to the link that opened the dialog.
  function closeDialog() {
    dialogRef.current?.close();
  }

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      closeDialog();
    }
  }

  return (
    <>
      <div className="notes-dialog-host" onClick={handleLinkClick}>
        {children}
      </div>
      <dialog
        ref={dialogRef}
        className="notes-dialog"
        aria-labelledby={titleId}
        onClose={() => setLocation(null)}
        onClick={handleDialogClick}
      >
        {location ? (
          <NotesFrame
            course={course}
            location={location}
            loadKey={loadKey}
            viewerMounted={isOpen}
            titleId={titleId}
            onNavigate={navigate}
            onClose={closeDialog}
          />
        ) : null}
      </dialog>
    </>
  );
}
