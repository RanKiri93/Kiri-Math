import { ConstantCoefficientsEulerModule } from "../../../constant-coefficients-euler/ConstantCoefficientsEulerModule";
import { odeModuleMetadata } from "../../OdeChapterPage";

export const metadata = odeModuleMetadata("constant-coefficients-euler");

export default function OdeConstantCoefficientsEulerPage() {
  return <ConstantCoefficientsEulerModule />;
}
