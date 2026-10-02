import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SqlDatabase, SqlValue } from "../_auth/model";
import { ChapterPanel } from "../_site/ChapterPanel";
import { SubjectModule } from "../function-sequences-series/SubjectModule";
import { odeCourse } from "../ode/course";
import { completedCountByModule, completionDateLabel } from "./model";
import { courseDefinitions } from "./registry";
import { ProgressStore } from "./store";
import { parseActivityRef } from "./validation";

class SqliteAdapter implements SqlDatabase {
  constructor(private readonly database: DatabaseSync) {}
  async get<T>(sql: string, params: SqlValue[] = []): Promise<T | null> {
    return (this.database.prepare(sql).get(...params) as T | undefined) ?? null;
  }
  async all<T>(sql: string, params: SqlValue[] = []): Promise<T[]> {
    return this.database.prepare(sql).all(...params) as T[];
  }
  async run(sql: string, params: SqlValue[] = []): Promise<void> {
    this.database.prepare(sql).run(...params);
  }
}

function setup() {
  const sqlite = new DatabaseSync(":memory:");
  for (const file of ["0000_auth.sql", "0001_activity_progress.sql"]) {
    sqlite.exec(readFileSync(new URL(`../../drizzle/${file}`, import.meta.url), "utf8"));
  }
  sqlite.exec("PRAGMA foreign_keys = ON");
  for (const id of ["u1", "u2"]) {
    sqlite.prepare("INSERT INTO users (id, username, normalized_username, password_hash, disabled, created_at) VALUES (?, ?, ?, 'x', 0, 0)").run(id, id, id);
  }
  return { sqlite, store: new ProgressStore(new SqliteAdapter(sqlite)) };
}

const lab = { course: "ode", moduleId: "function-sequences", activityId: "convergence-lab" } as const;
const supremum = { ...lab, activityId: "supremum-test" } as const;

describe("activity completion store", () => {
  it("records a completion once per activity, keeping the first time and counting repeats", async () => {
    const { store, sqlite } = setup();
    await store.markCompleted("u1", lab, 1000);
    await store.markCompleted("u1", lab, 5000);
    await store.markCompleted("u1", supremum, 3000);
    expect(await store.listCompleted("u1", "ode")).toEqual([
      { moduleId: "function-sequences", activityId: "convergence-lab", firstCompletedAt: 1000, lastCompletedAt: 5000, count: 2 },
      { moduleId: "function-sequences", activityId: "supremum-test", firstCompletedAt: 3000, lastCompletedAt: 3000, count: 1 },
    ]);
    sqlite.close();
  });

  it("keeps students and courses apart and deletes marks with the user", async () => {
    const { store, sqlite } = setup();
    await store.markCompleted("u1", lab, 1000);
    expect(await store.listCompleted("u2", "ode")).toEqual([]);
    expect(await store.listCompleted("u1", "fourier")).toEqual([]);
    sqlite.prepare("DELETE FROM users WHERE id = 'u1'").run();
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM activity_completions").get()).toMatchObject({ n: 0 });
    await expect(store.markCompleted("missing", lab, 1000)).rejects.toThrow();
    sqlite.close();
  });
});

describe("activity registry and validation", () => {
  it("accepts only registered activities", () => {
    expect(parseActivityRef({ course: "ode", module: "function-sequences", activity: "convergence-lab" })).toEqual(lab);
    expect(parseActivityRef({ course: "ode", module: "function-sequences", activity: "supremum-test" })).toEqual(supremum);
    for (const body of [
      null,
      {},
      { course: "ode", module: "function-sequences", activity: "unknown" },
      { course: "ode", module: "phase-plane", activity: "convergence-lab" },
      { course: "fourier", module: "function-sequences", activity: "convergence-lab" },
      { course: "calculus", module: "function-sequences", activity: "convergence-lab" },
      { course: "ode", module: ["function-sequences"], activity: "convergence-lab" },
    ]) expect(parseActivityRef(body as Record<string, unknown> | null), JSON.stringify(body)).toBeNull();
  });

  it("gives every activity an id that is unique within its module", () => {
    for (const course of Object.values(courseDefinitions)) for (const entry of course.modules) {
      const ids = (entry.activities ?? []).map((activity) => activity.id);
      expect(new Set(ids).size, `${course.slug}/${entry.id}`).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("counts completions per module and labels dates in Israel time", () => {
    expect(completedCountByModule([
      { moduleId: "a", activityId: "x", firstCompletedAt: 0, lastCompletedAt: 0, count: 1 },
      { moduleId: "a", activityId: "y", firstCompletedAt: 0, lastCompletedAt: 0, count: 3 },
      { moduleId: "b", activityId: "x", firstCompletedAt: 0, lastCompletedAt: 0, count: 1 },
    ])).toEqual({ a: 2, b: 1 });
    // 22:30 UTC on 29 September is already 30 September in Israel.
    expect(completionDateLabel(Date.UTC(2026, 8, 29, 22, 30))).toBe("30.9.2026");
  });
});

describe("progress rendering", () => {
  it("shows a progress counter only on chapter modules that have activities", () => {
    const html = renderToStaticMarkup(createElement(ChapterPanel, { course: odeCourse, chapter: 1, completed: { "function-sequences": 1 } }));
    expect(html.match(/data-module-progress/g)).toHaveLength(1);
    expect(html).toContain("הושלמו 1 מתוך 5 פעילויות");
    const done = renderToStaticMarkup(createElement(ChapterPanel, { course: odeCourse, chapter: 1, completed: { "function-sequences": 5 } }));
    expect(done).toContain("כל הפעילויות הושלמו");
    expect(done).toContain('class="course-module-progress complete"');
    const none = renderToStaticMarkup(createElement(ChapterPanel, { course: odeCourse, chapter: 1 }));
    expect(none).toContain("הושלמו 0 מתוך 5 פעילויות");
  });

  it("marks finished activities on the function-sequences menu, keeping their entry buttons", () => {
    const fresh = renderToStaticMarkup(createElement(SubjectModule, { subject: "function-sequences" }));
    expect(fresh).not.toContain("data-activity-complete");
    const time = Date.UTC(2026, 8, 30, 9);
    const html = renderToStaticMarkup(createElement(SubjectModule, {
      subject: "function-sequences",
      completions: [{ activityId: "supremum-test", lastCompletedAt: time }],
    }));
    expect(html.match(/data-activity-complete/g)).toHaveLength(1);
    expect(html.indexOf("data-activity-complete")).toBeGreaterThan(html.indexOf("2. שימוש במבחן הסופרמום"));
    expect(html).toContain('<bdi dir="ltr">30.9.2026</bdi>');
    expect(html.match(/כניסה לפעילות/g)).toHaveLength(5);
    const activities = odeCourse.modules.find((entry) => entry.id === "function-sequences")?.activities ?? [];
    const both = renderToStaticMarkup(createElement(SubjectModule, {
      subject: "function-sequences",
      completions: activities.map((activity) => ({ activityId: activity.id, lastCompletedAt: time })),
    }));
    expect(both.match(/data-activity-complete/g)).toHaveLength(5);
  });
});
