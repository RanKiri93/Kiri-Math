import type { CourseSlug } from "../_auth/model";

/** One finished activity of the signed-in student. Times are epoch milliseconds. */
export interface ActivityCompletion {
  moduleId: string;
  activityId: string;
  firstCompletedAt: number;
  lastCompletedAt: number;
  count: number;
}

export interface ActivityRef {
  course: CourseSlug;
  moduleId: string;
  activityId: string;
}

/** Number of finished activities per module id. */
export function completedCountByModule(completions: readonly ActivityCompletion[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of completions) counts[entry.moduleId] = (counts[entry.moduleId] ?? 0) + 1;
  return counts;
}

const dateFormat = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", year: "numeric" });

/** Fixed time zone, so the server and the browser render the same date and hydration agrees. */
export function completionDateLabel(time: number): string {
  return dateFormat.format(new Date(time));
}
