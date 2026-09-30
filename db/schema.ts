import { integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  normalizedUsername: text("normalized_username").notNull(),
  passwordHash: text("password_hash").notNull(),
  disabled: integer("disabled", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
}, (table) => [uniqueIndex("users_normalized_username_uq").on(table.normalizedUsername)]);

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const courseEntitlements = sqliteTable("course_entitlements", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseSlug: text("course_slug").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [uniqueIndex("course_entitlements_user_course_uq").on(table.userId, table.courseSlug)]);

export const loginRateLimits = sqliteTable("login_rate_limits", {
  bucketKey: text("bucket_key").primaryKey(),
  attempts: integer("attempts").notNull(),
  windowStartedAt: integer("window_started_at").notNull(),
  windowMs: integer("window_ms").notNull(),
});

/** Completion marks only (drizzle/0001_activity_progress.sql); see docs/plans/activity-progress.md. */
export const activityCompletions = sqliteTable("activity_completions", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseSlug: text("course_slug").notNull(),
  moduleId: text("module_id").notNull(),
  activityId: text("activity_id").notNull(),
  firstCompletedAt: integer("first_completed_at").notNull(),
  lastCompletedAt: integer("last_completed_at").notNull(),
  completionCount: integer("completion_count").notNull().default(1),
}, (table) => [primaryKey({ columns: [table.userId, table.courseSlug, table.moduleId, table.activityId] })]);
