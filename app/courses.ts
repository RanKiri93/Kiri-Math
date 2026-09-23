import { summarizeCourse, type CourseSummary } from "./_site/courseModel";
import { odeCourse } from "./ode/course";
import { odeCoverArt, odeCoverCardEquations } from "./ode/art";

export const courses: readonly CourseSummary[] = [
  {
    ...summarizeCourse(odeCourse),
    art: { cover: odeCoverArt, equations: odeCoverCardEquations },
  },
];
