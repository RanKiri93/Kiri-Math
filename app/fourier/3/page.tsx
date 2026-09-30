import { FourierChapterPage, fourierChapterMetadata } from "../FourierChapterPage";
import { requireCourse } from "../../_auth/server";

export const metadata = fourierChapterMetadata(3);

export default async function FourierChapter3Page() {
  await requireCourse("fourier", "/fourier/3");
  return <FourierChapterPage chapter={3} />;
}
