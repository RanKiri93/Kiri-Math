import type { CourseSlug, SqlDatabase } from "../_auth/model";
import type { ActivityCompletion, ActivityRef } from "./model";

interface CompletionRow {
  module_id: string;
  activity_id: string;
  first_completed_at: number;
  last_completed_at: number;
  completion_count: number;
}

export class ProgressStore {
  constructor(private readonly db: SqlDatabase) {}

  /** Idempotent: a repeated completion updates the last time and the count. */
  async markCompleted(userId: string, ref: ActivityRef, now: number): Promise<void> {
    await this.db.run(
      "INSERT INTO activity_completions (user_id, course_slug, module_id, activity_id, first_completed_at, last_completed_at, completion_count) VALUES (?, ?, ?, ?, ?, ?, 1) ON CONFLICT(user_id, course_slug, module_id, activity_id) DO UPDATE SET last_completed_at = excluded.last_completed_at, completion_count = activity_completions.completion_count + 1",
      [userId, ref.course, ref.moduleId, ref.activityId, now, now],
    );
  }

  async listCompleted(userId: string, course: CourseSlug): Promise<ActivityCompletion[]> {
    const rows = await this.db.all<CompletionRow>(
      "SELECT module_id, activity_id, first_completed_at, last_completed_at, completion_count FROM activity_completions WHERE user_id = ? AND course_slug = ? ORDER BY module_id, activity_id",
      [userId, course],
    );
    return rows.map((row) => ({
      moduleId: row.module_id,
      activityId: row.activity_id,
      firstCompletedAt: Number(row.first_completed_at),
      lastCompletedAt: Number(row.last_completed_at),
      count: Number(row.completion_count),
    }));
  }
}
