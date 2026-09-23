"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import type { CourseDefinition } from "./courseModel";
import { NotesFrame } from "./NotesFrame";
import { locateNotesTarget, notesCoverLocation, type NotesLocation, type NotesTarget } from "./notesNavigation";
import { NotesToc } from "./NotesToc";
import { notesTargetFromClick, useNotesReaderAvailable } from "./useNotesReader";

export function NotesReader({ course }: { course: CourseDefinition }) {
  const available = useNotesReaderAvailable();
  const [location, setLocation] = useState<NotesLocation>(() => notesCoverLocation(course.chapters));
  const [loadKey, setLoadKey] = useState(0);
  const [tocOpen, setTocOpen] = useState(true);
  const tocRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const tocId = useId();
  const titleId = useId();

  useEffect(() => {
    tocRef.current?.querySelector('[aria-current="location"]')?.scrollIntoView({ block: "nearest" });
  }, [location]);

  function navigate(target: NotesTarget): boolean {
    const next = locateNotesTarget(course.chapters, target);
    if (!next) {
      return false;
    }
    setLocation(next);
    setLoadKey((key) => key + 1);
    return true;
  }

  function handleTocClick(event: MouseEvent<HTMLDivElement>) {
    if (!available) {
      return;
    }
    const target = notesTargetFromClick(event);
    if (target && navigate(target)) {
      event.preventDefault();
      frameRef.current?.scrollIntoView({ block: "nearest" });
    }
  }

  return (
    <div className={tocOpen ? "notes-reader" : "notes-reader toc-hidden"}>
      <div
        className="notes-reader-toc"
        id={tocId}
        ref={tocRef}
        hidden={available && !tocOpen}
        onClick={handleTocClick}
      >
        <NotesToc course={course} current={available ? location : undefined} />
      </div>
      <div className="notes-reader-frame" ref={frameRef}>
        <NotesFrame
          course={course}
          location={location}
          loadKey={loadKey}
          viewerMounted={available}
          titleId={titleId}
          onNavigate={navigate}
          tocToggle={{ expanded: tocOpen, controls: tocId, onToggle: () => setTocOpen((open) => !open) }}
        />
      </div>
    </div>
  );
}
