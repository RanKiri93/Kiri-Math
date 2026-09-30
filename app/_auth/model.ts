export const COURSE_SLUGS = ["ode", "fourier"] as const;
export type CourseSlug = (typeof COURSE_SLUGS)[number];

export function isCourseSlug(value: unknown): value is CourseSlug {
  return typeof value === "string" && COURSE_SLUGS.some((slug) => slug === value);
}

export interface SessionUser {
  id: string;
  username: string;
  courses: CourseSlug[];
}

export type SqlValue = string | number | null;

export interface SqlDatabase {
  get<T>(sql: string, params?: SqlValue[]): Promise<T | null>;
  all<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  run(sql: string, params?: SqlValue[]): Promise<void>;
}
