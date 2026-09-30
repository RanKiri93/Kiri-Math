import PhasePlaneModule from "../../../phase-plane-module";
import { odeModuleMetadata } from "../../OdeChapterPage";
import { requireCourse } from "../../../_auth/server";

export const metadata = odeModuleMetadata("phase-plane");

export default async function OdePhasePlanePage() {
  await requireCourse("ode", "/ode/5/phase-plane");
  return <PhasePlaneModule />;
}
