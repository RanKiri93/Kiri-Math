/** Lesson order and in-memory completion policy; independent of React and mathematics. */
export const CONVERGENCE_LESSONS = [
  { id: "warmup", label: "היכרות קצרה" },
  { id: "power", label: "אותה סדרה, תחום אחר" },
  { id: "oscillation", label: "תנודות מתכווצות" },
  { id: "pair", label: "איפה מסתתרת השגיאה?" },
] as const;

export type ConvergenceLesson = (typeof CONVERGENCE_LESSONS)[number]["id"];
export type ConvergenceView = ConvergenceLesson | "definitions" | "complete";

export function canOpenConvergenceView(view: ConvergenceView, completed: readonly ConvergenceLesson[]): boolean {
  if (view === "definitions") return true;
  const index = view === "complete" ? CONVERGENCE_LESSONS.length : CONVERGENCE_LESSONS.findIndex((lesson) => lesson.id === view);
  return index >= 0 && CONVERGENCE_LESSONS.slice(0, index).every((lesson) => completed.includes(lesson.id));
}

/** Existing activity callbacks include both correct answers and answer reveals. */
export function completeConvergenceLesson(completed: readonly ConvergenceLesson[], lesson: ConvergenceLesson): readonly ConvergenceLesson[] {
  if (completed.includes(lesson) || !canOpenConvergenceView(lesson, completed)) return completed;
  return CONVERGENCE_LESSONS.filter((item) => item.id === lesson || completed.includes(item.id)).map((item) => item.id);
}
