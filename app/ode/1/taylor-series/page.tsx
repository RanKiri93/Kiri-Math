import type { Metadata } from "next";
import { SubjectModule } from "../../../function-sequences-series/SubjectModule";
import { odeModuleMetadata } from "../../OdeChapterPage";
import { requireCourse } from "../../../_auth/server";

export const metadata: Metadata = odeModuleMetadata("taylor-series");
export default async function TaylorSeriesPage() { await requireCourse("ode", "/ode/1/taylor-series"); return <SubjectModule subject="taylor-series" />; }
