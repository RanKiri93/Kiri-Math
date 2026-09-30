import { dummyPasswordVerify, hashPassword, hashRateLimitKey, hashToken, createSessionToken, validatePassword, verifyPassword } from "./crypto";
import type { CourseSlug, SessionUser } from "./model";
import { AuthStore } from "./store";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const USERNAME_LIMIT = 8;
const CLIENT_LIMIT = 40;
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,40}$/;

export type LoginResult = { status: "ok"; token: string; user: SessionUser } | { status: "invalid" | "limited" };

export function normalizeUsername(username: string): string | null {
  return USERNAME_PATTERN.test(username) ? username.toLowerCase() : null;
}

export class AuthService {
  constructor(private readonly store: AuthStore, private readonly now: () => number = Date.now) {}

  async createUser(username: string, password: string): Promise<string> {
    const normalized = normalizeUsername(username);
    if (!normalized) throw new Error("Username must be 3 to 40 ASCII letters, digits, or underscores");
    if (!validatePassword(password)) throw new Error("Password must contain 8 to 128 characters");
    return this.store.createUser(username, normalized, await hashPassword(password));
  }

  async resetPassword(userId: string, password: string): Promise<void> {
    if (!validatePassword(password)) throw new Error("Password must contain 8 to 128 characters");
    await this.store.updatePassword(userId, await hashPassword(password));
  }

  grantCourse(userId: string, course: CourseSlug): Promise<void> { return this.store.grantCourse(userId, course); }
  revokeCourse(userId: string, course: CourseSlug): Promise<void> { return this.store.revokeCourse(userId, course); }
  disableUser(userId: string): Promise<void> { return this.store.setDisabled(userId, true); }
  enableUser(userId: string): Promise<void> { return this.store.setDisabled(userId, false); }

  async login(username: string, password: string, clientKey: string): Promise<LoginResult> {
    const now = this.now();
    await this.store.cleanup(now);
    const normalized = normalizeUsername(username) ?? `invalid:${hashRateLimitKey(username)}`;
    const usernameAllowed = await this.store.reserveLoginAttempt(`u:${hashRateLimitKey(normalized)}`, USERNAME_LIMIT, now, RATE_WINDOW_MS);
    const clientAllowed = await this.store.reserveLoginAttempt(`c:${hashRateLimitKey(clientKey)}`, CLIENT_LIMIT, now, RATE_WINDOW_MS);
    if (!usernameAllowed || !clientAllowed) return { status: "limited" };
    if (!validatePassword(password)) return { status: "invalid" };

    const user = normalizeUsername(username) ? await this.store.findUserByUsername(normalized) : null;
    const passwordOk = user
      ? await verifyPassword(password, user.password_hash)
      : (await dummyPasswordVerify(password), false);
    if (!user || user.disabled || !passwordOk) return { status: "invalid" };

    const token = createSessionToken();
    const created = await this.store.createSession(user.id, hashToken(token), now + SESSION_TTL_MS, user.password_hash);
    if (!created) return { status: "invalid" };
    return { status: "ok", token, user: { id: user.id, username: user.username, courses: await this.store.getCourses(user.id) } };
  }

  async getUser(token: string | null): Promise<SessionUser | null> {
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
    const now = this.now();
    await this.store.cleanup(now);
    const session = await this.store.findSession(hashToken(token), now);
    if (!session) return null;
    return { ...session, courses: await this.store.getCourses(session.id) };
  }

  async logout(token: string | null): Promise<void> {
    if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) await this.store.revokeSession(hashToken(token));
  }
}
