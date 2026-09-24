import { summarizeCourse, type CourseSummary } from "./_site/courseModel";
import { odeCourse } from "./ode/course";
import { odeCoverArt, odeCoverCardEquations } from "./ode/art";
import { fourierCourse } from "./fourier/course";
import { fourierCoverArt, fourierCoverCardEquations } from "./fourier/art";

export const courses: readonly CourseSummary[] = [
  {
    ...summarizeCourse(odeCourse),
    art: { cover: odeCoverArt, equations: odeCoverCardEquations },
  },
  {
    ...summarizeCourse(fourierCourse),
    art: { cover: fourierCoverArt, equations: fourierCoverCardEquations },
  },
];
