import { LinearHomogeneousModule } from "../../../linear-homogeneous/LinearHomogeneousModule";
import { odeModuleMetadata } from "../../OdeChapterPage";

export const metadata = odeModuleMetadata("linear-homogeneous");

export default function OdeLinearHomogeneousPage() {
  return <LinearHomogeneousModule />;
}
