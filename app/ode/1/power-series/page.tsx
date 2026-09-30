import type { Metadata } from "next";
import { SubjectModule } from "../../../function-sequences-series/SubjectModule";
import { odeModuleMetadata } from "../../OdeChapterPage";
import { requireCourse } from "../../../_auth/server";

export const metadata: Metadata = odeModuleMetadata("power-series");
export default async function PowerSeriesPage() { await requireCourse("ode", "/ode/1/power-series"); return <SubjectModule subject="power-series" />; }
