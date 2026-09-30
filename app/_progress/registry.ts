import type { CourseSlug } from "../_auth/model";
import type { CourseDefinition } from "../_site/courseModel";
import { fourierCourse } from "../fourier/course";
import { odeCourse } from "../ode/course";

export const courseDefinitions: Record<CourseSlug, CourseDefinition> = {
  ode: odeCourse,
  fourier: fourierCourse,
};
