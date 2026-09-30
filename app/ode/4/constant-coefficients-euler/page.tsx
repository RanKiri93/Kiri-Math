import { ConstantCoefficientsEulerModule } from "../../../constant-coefficients-euler/ConstantCoefficientsEulerModule";
import { odeModuleMetadata } from "../../OdeChapterPage";
import { requireCourse } from "../../../_auth/server";

export const metadata = odeModuleMetadata("constant-coefficients-euler");

export default async function OdeConstantCoefficientsEulerPage() {
  await requireCourse("ode", "/ode/4/constant-coefficients-euler");
  return <ConstantCoefficientsEulerModule />;
}
