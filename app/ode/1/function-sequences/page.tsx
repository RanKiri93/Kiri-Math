import type { Metadata } from "next";
import { SubjectModule } from "../../../function-sequences-series/SubjectModule";
import { odeModuleMetadata } from "../../OdeChapterPage";
import { requireCourse } from "../../../_auth/server";
import { getActivityCompletions } from "../../../_progress/server";

export const metadata: Metadata = odeModuleMetadata("function-sequences");
export default async function FunctionSequencesPage() {
  const user = await requireCourse("ode", "/ode/1/function-sequences");
  const completions = (await getActivityCompletions(user, "ode"))
    .filter((entry) => entry.moduleId === "function-sequences")
    .map(({ activityId, lastCompletedAt }) => ({ activityId, lastCompletedAt }));
  return <SubjectModule subject="function-sequences" completions={completions} />;
}
