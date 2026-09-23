import PhasePlaneModule from "../../../phase-plane-module";
import { odeModuleMetadata } from "../../OdeChapterPage";

export const metadata = odeModuleMetadata("phase-plane");

export default function OdePhasePlanePage() {
  return <PhasePlaneModule />;
}
