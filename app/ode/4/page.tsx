import { OdeChapterPage, odeChapterMetadata } from "../OdeChapterPage";
import { requireCourse } from "../../_auth/server";

export const metadata = odeChapterMetadata(4);

export default async function OdeChapter4Page() {
  const user = await requireCourse("ode", "/ode/4");
  return <OdeChapterPage chapter={4} user={user} />;
}
