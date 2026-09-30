import { FourierChapterPage, fourierChapterMetadata } from "../FourierChapterPage";
import { requireCourse } from "../../_auth/server";

export const metadata = fourierChapterMetadata(2);

export default async function FourierChapter2Page() {
  await requireCourse("fourier", "/fourier/2");
  return <FourierChapterPage chapter={2} />;
}
