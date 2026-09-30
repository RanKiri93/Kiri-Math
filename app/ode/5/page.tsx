import { OdeChapterPage, odeChapterMetadata } from "../OdeChapterPage";
import { requireCourse } from "../../_auth/server";

export const metadata = odeChapterMetadata(5);

export default async function OdeChapter5Page() {
  const user = await requireCourse("ode", "/ode/5");
  return <OdeChapterPage chapter={5} user={user} />;
}
