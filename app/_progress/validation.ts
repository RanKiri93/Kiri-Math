import { isCourseSlug } from "../_auth/model";
import { findActivity } from "../_site/courseModel";
import type { ActivityRef } from "./model";
import { courseDefinitions } from "./registry";

/** Accepts only activities listed in a course registry; everything else is rejected. */
export function parseActivityRef(body: Record<string, unknown> | null): ActivityRef | null {
  if (!body) return null;
  const { course, module: moduleId, activity: activityId } = body;
  if (!isCourseSlug(course) || typeof moduleId !== "string" || typeof activityId !== "string") return null;
  if (!findActivity(courseDefinitions[course], moduleId, activityId)) return null;
  return { course, moduleId, activityId };
}
