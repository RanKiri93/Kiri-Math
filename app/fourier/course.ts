import { courseAssetHref, type CourseDefinition } from "../_site/courseModel";
import { notesChapters, notesPageOffset } from "./notesToc";

export const fourierCourse: CourseDefinition = {
  slug: "fourier",
  code: "104214",
  title: "טורי פוריה והתמרות אינטגרליות",
  tagline: "מרחבי מכפלה פנימית, טורי פוריה, התמרת פוריה והתמרת לפלס.",
  href: "/fourier",
  notes: {
    href: courseAssetHref("fourier", "notes.pdf"),
    pageOffset: notesPageOffset,
  },
  chapters: notesChapters,
  modules: [],
  resources: [
    {
      id: "notes",
      title: "רשימות הקורס",
      description: "הרשימות המלאות של הקורס, כל ארבעת הפרקים בקובץ אחד.",
      href: courseAssetHref("fourier", "notes.pdf"),
    },
    {
      id: "syllabus",
      title: "סילבוס מורחב",
      description: "תוכנית הקורס המפורטת, לפי הרצאות ותרגולים.",
      href: courseAssetHref("fourier", "syllabus.pdf"),
    },
    {
      id: "formula-sheet",
      title: "דף נוסחאות",
      description: "הנוסחאות המרכזיות של הקורס.",
      href: courseAssetHref("fourier", "formula-sheet.pdf"),
    },
  ],
};
