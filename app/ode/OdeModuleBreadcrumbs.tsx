import { Breadcrumbs } from "../_site/Breadcrumbs";
import { moduleCrumbs } from "../_site/courseModel";
import { odeCourse } from "./course";

export function OdeModuleBreadcrumbs({ moduleId }: { moduleId: string }) {
  return <Breadcrumbs items={moduleCrumbs(odeCourse, moduleId)} />;
}
