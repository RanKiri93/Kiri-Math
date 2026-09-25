import type { Metadata } from "next";
import { SubjectModule } from "../../../function-sequences-series/SubjectModule";
import { odeModuleMetadata } from "../../OdeChapterPage";

export const metadata: Metadata = odeModuleMetadata("function-series");
export default function FunctionSeriesPage() { return <SubjectModule subject="function-series" />; }
