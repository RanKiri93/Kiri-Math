import { FourierChapterPage, fourierChapterMetadata } from "../FourierChapterPage";
import { requireCourse } from "../../_auth/server";

export const metadata = fourierChapterMetadata(4);

export default async function FourierChapter4Page() {
  await requireCourse("fourier", "/fourier/4");
  return <FourierChapterPage chapter={4} />;
}
