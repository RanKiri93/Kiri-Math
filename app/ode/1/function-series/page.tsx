import type { Metadata } from "next";
import { SubjectModule } from "../../../function-sequences-series/SubjectModule";
import { odeModuleMetadata } from "../../OdeChapterPage";
import { requireCourse } from "../../../_auth/server";

export const metadata: Metadata = odeModuleMetadata("function-series");
export default async function FunctionSeriesPage() { await requireCourse("ode", "/ode/1/function-series"); return <SubjectModule subject="function-series" />; }
