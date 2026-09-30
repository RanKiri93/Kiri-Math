import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { courses } from "../courses";
import { CourseCard } from "./CourseCard";

describe("course entry card rendering", () => {
  it.each([
    ["available", (course: (typeof courses)[number]) => course.href, true],
    ["guest", (course: (typeof courses)[number]) => `/login?next=${encodeURIComponent(course.href)}`, false],
    ["locked", (course: (typeof courses)[number]) => `/access-required?course=${encodeURIComponent(course.slug)}`, false],
  ] as const)("%s access keeps the expected href and annotates only available courses", (access, hrefFor, participates) => {
    const course = courses[0];
    const markup = renderToStaticMarkup(createElement(CourseCard, { course, access }));
    expect(markup).toContain(`href="${hrefFor(course)}"`);
    expect(markup.includes("data-course-entry=")).toBe(participates);
    expect(markup).not.toContain("stroke-dasharray");
    expect(markup).not.toContain("stroke-dashoffset");
  });
});
