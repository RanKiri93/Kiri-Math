import { OdeChapterPage, odeChapterMetadata } from "../OdeChapterPage";
import { requireCourse } from "../../_auth/server";

export const metadata = odeChapterMetadata(3);

export default async function OdeChapter3Page() {
  const user = await requireCourse("ode", "/ode/3");
  return <OdeChapterPage chapter={3} user={user} />;
}
