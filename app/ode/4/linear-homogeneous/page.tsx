import { LinearHomogeneousModule } from "../../../linear-homogeneous/LinearHomogeneousModule";
import { odeModuleMetadata } from "../../OdeChapterPage";
import { requireCourse } from "../../../_auth/server";

export const metadata = odeModuleMetadata("linear-homogeneous");

export default async function OdeLinearHomogeneousPage() {
  await requireCourse("ode", "/ode/4/linear-homogeneous");
  return <LinearHomogeneousModule />;
}
