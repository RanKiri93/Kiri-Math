import { FourierChapterPage, fourierChapterMetadata } from "../FourierChapterPage";
import { requireCourse } from "../../_auth/server";

export const metadata = fourierChapterMetadata(1);

export default async function FourierChapter1Page() {
  await requireCourse("fourier", "/fourier/1");
  return <FourierChapterPage chapter={1} />;
}
