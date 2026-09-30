import { getDatabase } from "../_auth/database";
import type { CourseSlug, SessionUser } from "../_auth/model";
import { findActivity } from "../_site/courseModel";
import type { ActivityCompletion } from "./model";
import { courseDefinitions } from "./registry";
import { ProgressStore } from "./store";

export async function getProgressStore(): Promise<ProgressStore> {
  return new ProgressStore(await getDatabase());
}

/**
 * The student's finished activities in one course, limited to activities still in the
 * registry. Progress never blocks a page: any storage failure yields no marks.
 */
export async function getActivityCompletions(user: SessionUser, course: CourseSlug): Promise<ActivityCompletion[]> {
  try {
    const completions = await (await getProgressStore()).listCompleted(user.id, course);
    return completions.filter((entry) => findActivity(courseDefinitions[course], entry.moduleId, entry.activityId));
  } catch {
    return [];
  }
}
