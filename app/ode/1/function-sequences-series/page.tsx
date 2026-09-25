import { redirect } from "next/navigation";
import { odeModuleMetadata } from "../../OdeChapterPage";

export const metadata = odeModuleMetadata("function-sequences");

export default function OdeFunctionSequencesSeriesPage() {
  redirect("/ode/1/function-sequences");
}
