import { OdeChapterPage, odeChapterMetadata } from "../OdeChapterPage";
import { requireCourse } from "../../_auth/server";

export const metadata = odeChapterMetadata(6);

export default async function OdeChapter6Page() {
  const user = await requireCourse("ode", "/ode/6");
  return <OdeChapterPage chapter={6} user={user} />;
}
