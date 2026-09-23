import type { ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { ChapterRail, type CoursePanelId } from "./ChapterRail";
import { courseCrumbs, type CourseDefinition } from "./courseModel";

type CourseShellProps = {
  course: CourseDefinition;
  active: CoursePanelId;
  children: ReactNode;
};

export function CourseShell({ course, active, children }: CourseShellProps) {
  return (
    <main className="app-shell course-shell" dir="rtl">
      <header className="course-shell-header">
        <Breadcrumbs items={courseCrumbs(course, active === "materials" ? undefined : active)} />
      </header>
      <div className="course-shell-body">
        <ChapterRail course={course} active={active} />
        <div className="course-shell-panel">{children}</div>
      </div>
    </main>
  );
}
