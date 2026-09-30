import { redirect } from "next/navigation";
import { odeModuleMetadata } from "../../OdeChapterPage";
import { requireCourse } from "../../../_auth/server";

export const metadata = odeModuleMetadata("function-sequences");

export default async function OdeFunctionSequencesSeriesPage() {
  await requireCourse("ode", "/ode/1/function-sequences-series");
  redirect("/ode/1/function-sequences");
}
