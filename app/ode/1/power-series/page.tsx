import type { Metadata } from "next";
import { SubjectModule } from "../../../function-sequences-series/SubjectModule";
import { odeModuleMetadata } from "../../OdeChapterPage";

export const metadata: Metadata = odeModuleMetadata("power-series");
export default function PowerSeriesPage() { return <SubjectModule subject="power-series" />; }
