import type { ReactNode } from "react";
import { canOpenConvergenceView, CONVERGENCE_LESSONS, type ConvergenceLesson, type ConvergenceView } from "../lessonProgress";

/** One stage of a guided activity: a lesson of the convergence lab, an example of the supremum activity. */
export type Stage = { id: string; label: ReactNode };

/** Hebrew copy of a stage track; the grammatical gender follows the stage noun (חלק, דוגמה). */
export type StageCopy = {
  navLabel: string;
  progress: (position: number, total: number) => string;
  finished: string;
  previous: string;
  next: string;
  finish: string;
  lockedTitle: string;
  status: { done: string; current: string; available: string; locked: string };
};

type StageProps = {
  stages: readonly Stage[];
  /** A stage id, or "complete" for the finish view. */
  current: string;
  completed: readonly string[];
  canOpen: (id: string) => boolean;
  busy: boolean;
  copy: StageCopy;
  onOpen: (id: string) => void;
};

export function StagePaging({ stages, current, canOpen, busy, copy, onOpen }: Omit<StageProps, "completed">) {
  const index = current === "complete" ? stages.length : stages.findIndex((stage) => stage.id === current);
  const previous = index > 0 ? stages[index - 1].id : undefined;
  const next = index + 1 < stages.length ? stages[index + 1].id : "complete";
  return <div className="convergence-sequence-actions">
    <button type="button" className="panel-action secondary" disabled={busy || !previous} onClick={() => previous && onOpen(previous)}>{copy.previous}</button>
    {current !== "complete" && <button type="button" className="panel-action" disabled={busy || !canOpen(next)} onClick={() => onOpen(next)}>
      {next === "complete" ? copy.finish : copy.next}
    </button>}
  </div>;
}

export function StageNavigator({ stages, current, completed, canOpen, busy, copy, onOpen, listClassName }: StageProps & { listClassName?: string }) {
  const index = stages.findIndex((stage) => stage.id === current);
  return <nav className="convergence-sequence-nav" aria-label={copy.navLabel}>
    <div className="convergence-sequence-toolbar">
      <span className="convergence-sequence-progress" aria-live="polite" aria-atomic="true">
        {current === "complete" ? copy.finished : copy.progress(index + 1, stages.length)}
      </span>
      <StagePaging stages={stages} current={current} canOpen={canOpen} busy={busy} copy={copy} onOpen={onOpen} />
    </div>
    <ol className={`convergence-progress-list${listClassName ? ` ${listClassName}` : ""}`}>
      {stages.map((stage, step) => {
        const unlocked = canOpen(stage.id);
        const done = completed.includes(stage.id);
        const here = current === stage.id;
        return <li key={stage.id}>
          <button className="convergence-progress-step" type="button" data-state={!unlocked ? "locked" : done ? "complete" : "available"}
            aria-current={here ? "step" : undefined} disabled={busy || !unlocked}
            title={!unlocked ? copy.lockedTitle : undefined} onClick={() => onOpen(stage.id)}>
            <span className="convergence-progress-number" aria-hidden="true">{done ? "✓" : step + 1}</span>
            <span className="convergence-progress-label">{stage.label}<small className="convergence-progress-status">{done ? copy.status.done : here ? copy.status.current : unlocked ? copy.status.available : copy.status.locked}</small></span>
          </button>
        </li>;
      })}
    </ol>
  </nav>;
}

const LESSON_COPY: StageCopy = {
  navLabel: "מסלול החקירה",
  progress: (position, total) => `חלק ${position} מתוך ${total}`,
  finished: "המסלול הושלם",
  previous: "החלק הקודם",
  next: "החלק הבא",
  finish: "סיום הפעילות",
  lockedTitle: "ייפתח לאחר השלמת החלק הקודם",
  status: { done: "הושלם", current: "החלק הנוכחי", available: "זמין", locked: "נעול" },
};

type NavigationProps = {
  view: ConvergenceView;
  completed: readonly ConvergenceLesson[];
  busy: boolean;
  onOpen: (view: ConvergenceView) => void;
};

const lessonStages: readonly Stage[] = CONVERGENCE_LESSONS;
const canOpenLesson = (completed: readonly ConvergenceLesson[]) => (id: string) => canOpenConvergenceView(id as ConvergenceView, completed);

export function ConvergencePaging({ view, completed, busy, onOpen }: NavigationProps) {
  return <StagePaging stages={lessonStages} current={view} canOpen={canOpenLesson(completed)} busy={busy} copy={LESSON_COPY}
    onOpen={(id) => onOpen(id as ConvergenceView)} />;
}

export function ConvergenceNavigator({ view, completed, busy, onOpen }: NavigationProps) {
  return <StageNavigator stages={lessonStages} current={view} completed={completed} canOpen={canOpenLesson(completed)} busy={busy}
    copy={LESSON_COPY} onOpen={(id) => onOpen(id as ConvergenceView)} />;
}
