import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = join(process.cwd(), "app");

function pageFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return pageFiles(path);
    return entry.name === "page.tsx" ? [path] : [];
  });
}

describe("course page authorization guards", () => {
  it("guards every course page at its exact route before rendering or redirecting", () => {
    for (const course of ["ode", "fourier"] as const) {
      for (const file of pageFiles(join(appRoot, course))) {
        const segments = relative(join(appRoot, course), file).split(sep).slice(0, -1);
        const route = `/${[course, ...segments].join("/")}`;
        const source = readFileSync(file, "utf8");
        expect(source, file).toMatch(/import\s*\{\s*requireCourse\s*\}\s*from/);
        expect(source, file).toMatch(/export\s+default\s+async\s+function/);
        expect(source, file).toContain(`await requireCourse("${course}", "${route}")`);
      }
    }
  });
});
