import { OdeChapterPage, odeChapterMetadata } from "../OdeChapterPage";
import { requireCourse } from "../../_auth/server";

export const metadata = odeChapterMetadata(2);

export default async function OdeChapter2Page() {
  const user = await requireCourse("ode", "/ode/2");
  return <OdeChapterPage chapter={2} user={user} />;
}
