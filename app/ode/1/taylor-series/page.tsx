import type { Metadata } from "next";
import { SubjectModule } from "../../../function-sequences-series/SubjectModule";
import { odeModuleMetadata } from "../../OdeChapterPage";

export const metadata: Metadata = odeModuleMetadata("taylor-series");
export default function TaylorSeriesPage() { return <SubjectModule subject="taylor-series" />; }
