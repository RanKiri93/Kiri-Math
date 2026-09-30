import { OdeChapterPage, odeChapterMetadata } from "../OdeChapterPage";
import { requireCourse } from "../../_auth/server";

export const metadata = odeChapterMetadata(1);

export default async function OdeChapter1Page() {
  const user = await requireCourse("ode", "/ode/1");
  return <OdeChapterPage chapter={1} user={user} />;
}
