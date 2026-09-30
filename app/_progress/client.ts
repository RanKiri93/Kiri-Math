import type { CourseSlug } from "../_auth/model";

/** Fire-and-forget: a failed write keeps the activity running and the mark for this visit only. */
export function reportActivityCompletion(course: CourseSlug, moduleId: string, activityId: string): void {
  void fetch("/api/progress/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ course, module: moduleId, activity: activityId }),
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => undefined);
}
