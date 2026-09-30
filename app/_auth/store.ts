import { randomUUID } from "node:crypto";
import { isCourseSlug, type CourseSlug, type SqlDatabase } from "./model";

export interface UserRecord {
  id: string;
  username: string;
  normalized_username: string;
  password_hash: string;
  disabled: number;
}

interface SessionRecord {
  user_id: string;
  expires_at: number;
  disabled: number;
}

interface BucketRecord { attempts: number }

export class AuthStore {
  constructor(private readonly db: SqlDatabase) {}

  async findUserByUsername(normalizedUsername: string): Promise<UserRecord | null> {
    return this.db.get<UserRecord>("SELECT id, username, normalized_username, password_hash, disabled FROM users WHERE normalized_username = ?", [normalizedUsername]);
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    return this.db.get<UserRecord>("SELECT id, username, normalized_username, password_hash, disabled FROM users WHERE id = ?", [id]);
  }

  async createUser(username: string, normalizedUsername: string, passwordHash: string): Promise<string> {
    const id = randomUUID();
    await this.db.run("INSERT INTO users (id, username, normalized_username, password_hash, disabled, created_at) VALUES (?, ?, ?, ?, 0, ?)", [id, username, normalizedUsername, passwordHash, Date.now()]);
    return id;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.db.run("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, userId]);
    await this.db.run("DELETE FROM sessions WHERE user_id = ?", [userId]);
  }

  async setDisabled(userId: string, disabled: boolean): Promise<void> {
    await this.db.run("UPDATE users SET disabled = ? WHERE id = ?", [disabled ? 1 : 0, userId]);
    if (disabled) await this.db.run("DELETE FROM sessions WHERE user_id = ?", [userId]);
  }

  async grantCourse(userId: string, course: CourseSlug): Promise<void> {
    if (!isCourseSlug(course)) throw new Error("Unknown course");
    await this.db.run("INSERT INTO course_entitlements (user_id, course_slug, created_at) VALUES (?, ?, ?) ON CONFLICT(user_id, course_slug) DO NOTHING", [userId, course, Date.now()]);
  }

  async revokeCourse(userId: string, course: CourseSlug): Promise<void> {
    if (!isCourseSlug(course)) throw new Error("Unknown course");
    await this.db.run("DELETE FROM course_entitlements WHERE user_id = ? AND course_slug = ?", [userId, course]);
  }

  async getCourses(userId: string): Promise<CourseSlug[]> {
    const rows = await this.db.all<{ course_slug: string }>("SELECT course_slug FROM course_entitlements WHERE user_id = ? ORDER BY course_slug", [userId]);
    return rows.map((row) => row.course_slug).filter(isCourseSlug);
  }

  async createSession(userId: string, tokenHash: string, expiresAt: number, verifiedPasswordHash: string): Promise<boolean> {
    // Verification is deliberately slow. A password reset/disable may have
    // completed meanwhile: never mint a session from those stale credentials.
    const row = await this.db.get<{ user_id: string }>(
      "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) SELECT ?, id, ?, ? FROM users WHERE id = ? AND disabled = 0 AND password_hash = ? RETURNING user_id",
      [tokenHash, expiresAt, Date.now(), userId, verifiedPasswordHash]
    );
    return !!row;
  }

  async findSession(tokenHash: string, now: number): Promise<{ id: string; username: string } | null> {
    const row = await this.db.get<SessionRecord & { id: string; username: string }>("SELECT users.id, users.username, sessions.expires_at, users.disabled FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ?", [tokenHash]);
    if (!row || row.disabled || row.expires_at <= now) return null;
    return { id: row.id, username: row.username };
  }

  async revokeSession(tokenHash: string): Promise<void> {
    await this.db.run("DELETE FROM sessions WHERE token_hash = ?", [tokenHash]);
  }

  async cleanup(now: number): Promise<void> {
    await this.db.run("DELETE FROM sessions WHERE expires_at <= ?", [now]);
    await this.db.run("DELETE FROM login_rate_limits WHERE window_started_at + window_ms <= ?", [now]);
  }

  async reserveLoginAttempt(bucketKey: string, maxAttempts: number, now: number, windowMs: number): Promise<boolean> {
    const row = await this.db.get<BucketRecord>(
      "INSERT INTO login_rate_limits (bucket_key, attempts, window_started_at, window_ms) VALUES (?, 1, ?, ?) ON CONFLICT(bucket_key) DO UPDATE SET attempts = CASE WHEN login_rate_limits.window_started_at + login_rate_limits.window_ms <= ? THEN 1 ELSE login_rate_limits.attempts + 1 END, window_started_at = CASE WHEN login_rate_limits.window_started_at + login_rate_limits.window_ms <= ? THEN ? ELSE login_rate_limits.window_started_at END, window_ms = ? RETURNING attempts",
      [bucketKey, now, windowMs, now, now, now, windowMs]
    );
    return !!row && row.attempts <= maxAttempts;
  }
}
