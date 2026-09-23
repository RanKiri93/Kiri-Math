import { useSyncExternalStore, type MouseEvent } from "react";
import { isPlainLeftClick } from "./clicks";
import { notesTargetFromData, type NotesTarget } from "./notesNavigation";

// Complement of the ≤820px breakpoint in globals.css, below which the reader is hidden and
// mobile browsers could not render an inline PDF anyway.
const readerQuery = "(min-width: 821px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(readerQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function useNotesReaderAvailable(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(readerQuery).matches,
    () => false,
  );
}

/** The notes target of a plain left click on a notes link; modifier clicks keep their browser meaning. */
export function notesTargetFromClick(event: MouseEvent<HTMLElement>): NotesTarget | null {
  if (!isPlainLeftClick(event)) {
    return null;
  }
  if (!(event.target instanceof Element)) {
    return null;
  }
  const link = event.target.closest<HTMLAnchorElement>("a[data-notes-section], a[data-notes-chapter]");
  if (!link || !event.currentTarget.contains(link)) {
    return null;
  }
  return notesTargetFromData(link.dataset);
}
