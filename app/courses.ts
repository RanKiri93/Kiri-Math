import { summarizeCourse, type CourseSummary } from "./_site/courseModel";
import { odeCourse } from "./ode/course";

export const courses: readonly CourseSummary[] = [summarizeCourse(odeCourse)];
