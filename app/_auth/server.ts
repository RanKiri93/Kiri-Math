import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDatabase } from "./database";
import { parseSessionCookie } from "./http";
import type { CourseSlug, SessionUser } from "./model";
import { AuthService } from "./service";
import { AuthStore } from "./store";

export async function getAuthService(): Promise<AuthService> {
  return new AuthService(new AuthStore(await getDatabase()));
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = parseSessionCookie((await headers()).get("cookie"));
  if (!token) return null;
  return (await getAuthService()).getUser(token);
}

export async function requireCourse(course: CourseSlug, next: string = `/${course}`): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!user.courses.includes(course)) redirect(`/access-required?course=${course}`);
  return user;
}
