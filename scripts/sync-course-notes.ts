/**
 * Syncs a course's lecture notes into the site.
 *
 *   npx tsx scripts/sync-course-notes.ts [notes-folder]
 *   npx tsx scripts/sync-course-notes.ts --course fourier <notes-folder>
 *
 * notes-folder defaults to the course folder two levels above the repository. Run it after
 * every recompile of main.tex: it copies the PDFs into public/courses/<course>/ and regenerates
 * app/<course>/notesToc.ts from main.toc. The default course remains ODE; Fourier requires
 * an explicit source folder. Source files are never modified.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";

type Section = { number: string; title: string; page: number };
type Chapter = { number: number; title: string; page: number; sections: Section[] };

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// The shared navigation uses plain-text titles. Expand these exact source formulas
// into words rather than leaking LaTeX (or unisolated math) into RTL navigation.
const fourierTitleAliases: Readonly<Record<string, string>> = {
  [String.raw`תכונות של התמרת פוריה ב-$\ensuremath {\mathcal {G}}\qty (\ensuremath {\mathbb {R}})$`]:
    "תכונות התמרת פוריה עבור פונקציות רציפות למקוטעין ואינטגרביליות בהחלט",
  [String.raw`נוסחאות היפוך והתמרת פוריה ב-$\ensuremath {\mathcal {G}}^2\qty (\ensuremath {\mathbb {R}})$`]:
    "נוסחאות היפוך והתמרת פוריה עבור פונקציות רציפות למקוטעין וריבוע־אינטגרביליות",
  [String.raw`קונבולוציה ב-$\ensuremath {\mathcal {G}}\qty (\ensuremath {\mathbb {R}})$`]:
    "קונבולוציה של פונקציות רציפות למקוטעין ואינטגרביליות בהחלט",
};

export function syncOptions(args: string[]) {
  const explicitCourse = args[0] === "--course";
  const course = explicitCourse ? args[1] : "ode";
  const folder = args[explicitCourse ? 2 : 0];
  if (
    (course !== "ode" && course !== "fourier") ||
    args.length > (explicitCourse ? 3 : 1) ||
    folder?.startsWith("--") ||
    (course === "fourier" && !folder)
  ) {
    throw new Error("Usage: sync-course-notes.ts [--course ode|fourier] [notes-folder]; Fourier requires notes-folder");
  }
  return {
    course,
    notesRoot: resolve(folder ?? join(repoRoot, "..", "..")),
    publicDir: join(repoRoot, "public", "courses", course),
    tocOutput: join(repoRoot, "app", course, "notesToc.ts"),
    titleAliases: course === "fourier" ? fourierTitleAliases : {},
    copies: [
      { source: "main.pdf", target: "notes.pdf" },
      { source: course === "fourier" ? "ElaborateSyllabus.pdf" : "ExtendedSyllabus_winter2026.pdf", target: "syllabus.pdf" },
      { source: course === "fourier" ? "formula_sheet.pdf" : "FormulaSheet.pdf", target: "formula-sheet.pdf" },
    ],
  };
}

function readGroup(text: string, start: number): { content: string; end: number } {
  if (text[start] !== "{") {
    throw new Error(`Expected "{" at offset ${start} in: ${text}`);
  }
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === "{") depth += 1;
    if (text[index] === "}") depth -= 1;
    if (depth === 0) {
      return { content: text.slice(start + 1, index), end: index + 1 };
    }
  }
  throw new Error(`Unbalanced braces in: ${text}`);
}

const hebrewLetter = "\\u05D0-\\u05EA";

function normalizeTitle(raw: string): string {
  const title = raw
    .replace(new RegExp(`([${hebrewLetter}])"([${hebrewLetter}])`, "g"), "$1״$2")
    .replace(new RegExp(`([${hebrewLetter}])'`, "g"), "$1׳")
    .replace(/ - /g, " – ")
    .replace(new RegExp(`([${hebrewLetter}])-([${hebrewLetter}])`, "g"), "$1־$2")
    .replace(/\s+/g, " ")
    .trim();
  if (/[\\{}$]/.test(title)) {
    throw new Error(`TOC title still contains LaTeX, extend normalizeTitle: ${title}`);
  }
  return title;
}

export function parseToc(tocText: string, titleAliases: Readonly<Record<string, string>> = {}): Chapter[] {
  const titleFor = (raw: string) => normalizeTitle(titleAliases[raw] ?? raw);
  const chapters: Chapter[] = [];
  for (const line of tocText.split(/\r?\n/)) {
    const match = line.match(/^\\contentsline \{(chapter|section)\}/);
    if (!match) continue;

    const titleGroup = readGroup(line, match[0].length);
    const pageGroup = readGroup(line, titleGroup.end);
    const page = Number(pageGroup.content);
    if (!Number.isInteger(page) || page < 1) {
      throw new Error(`Printed page is not an arabic page number: ${line}`);
    }

    if (match[1] === "chapter") {
      chapters.push({
        number: chapters.length + 1,
        title: titleFor(titleGroup.content),
        page,
        sections: [],
      });
      continue;
    }

    const numbered = titleGroup.content.match(/^\\numberline \{([0-9.]+)\}(.*)$/);
    if (!numbered) {
      throw new Error(`Section without \\numberline: ${line}`);
    }
    const chapter = chapters[chapters.length - 1];
    if (!chapter || !numbered[1].startsWith(`${chapter.number}.`)) {
      throw new Error(`Section ${numbered[1]} does not belong to chapter ${chapter?.number}`);
    }
    chapter.sections.push({ number: numbered[1], title: titleFor(numbered[2]), page });
  }

  if (chapters.length === 0) {
    throw new Error("No chapters found in main.toc");
  }
  let previousPage = 0;
  for (const chapter of chapters) {
    for (const entry of [chapter, ...chapter.sections]) {
      if (entry.page < previousPage) {
        throw new Error(`Pages go backwards at "${entry.title}" (${entry.page} < ${previousPage})`);
      }
      previousPage = entry.page;
    }
  }
  return chapters;
}

/**
 * Reads /PageLabels from the PDF: the physical index where decimal numbering starts, so that
 * printed page N is physical page N + offset. Streams are Flate-compressed object streams.
 */
export function readPageOffset(pdf: Buffer): number {
  let text = pdf.toString("latin1");
  const raw = text;
  const streamStart = /stream\r?\n/g;
  let match: RegExpExecArray | null;
  while ((match = streamStart.exec(raw))) {
    const start = match.index + match[0].length;
    const end = raw.indexOf("endstream", start);
    if (end < 0) break;
    try {
      text += `\n${inflateSync(pdf.subarray(start, end)).toString("latin1")}`;
    } catch {
      // Non-Flate streams (e.g. JPEG images) cannot hold /PageLabels.
    }
  }

  for (const nums of text.matchAll(/\/Nums\s*\[([^\]]*)\]/g)) {
    for (const entry of nums[1].matchAll(/(\d+)\s*<<([^>]*)>>/g)) {
      if (/\/S\s*\/D/.test(entry[2])) {
        const start = Number(entry[1]);
        const firstLabel = Number(entry[2].match(/\/St\s+(\d+)/)?.[1] ?? 1);
        return start - (firstLabel - 1);
      }
    }
  }
  throw new Error("No decimal /PageLabels range in main.pdf; cannot map printed pages to PDF pages");
}

function renderTocModule(chapters: Chapter[], pageOffset: number): string {
  const body = chapters
    .map((chapter) => {
      const sections = chapter.sections
        .map(
          (section) =>
            `      { number: ${JSON.stringify(section.number)}, title: ${JSON.stringify(section.title)}, page: ${section.page} },`,
        )
        .join("\n");
      return [
        "  {",
        `    number: ${chapter.number},`,
        `    title: ${JSON.stringify(chapter.title)},`,
        `    page: ${chapter.page},`,
        "    sections: [",
        sections,
        "    ],",
        "  },",
      ].join("\n");
    })
    .join("\n");

  return [
    "// Generated by scripts/sync-course-notes.ts from main.toc and main.pdf. Do not edit by hand.",
    'import type { NotesChapter } from "../_site/courseModel";',
    "",
    `export const notesPageOffset = ${pageOffset};`,
    "",
    "export const notesChapters: readonly NotesChapter[] = [",
    body,
    "];",
    "",
  ].join("\n");
}

function main() {
  const { notesRoot, publicDir, tocOutput, titleAliases, copies } = syncOptions(process.argv.slice(2));
  const tocPath = join(notesRoot, "main.toc");
  const pdfPath = join(notesRoot, "main.pdf");
  for (const path of [tocPath, pdfPath, ...copies.map((copy) => join(notesRoot, copy.source))]) {
    if (!existsSync(path)) {
      throw new Error(`Missing ${path}`);
    }
  }

  const chapters = parseToc(readFileSync(tocPath, "utf8"), titleAliases);
  const pageOffset = readPageOffset(readFileSync(pdfPath));

  mkdirSync(publicDir, { recursive: true });
  for (const copy of copies) {
    copyFileSync(join(notesRoot, copy.source), join(publicDir, copy.target));
  }
  writeFileSync(tocOutput, renderTocModule(chapters, pageOffset), "utf8");

  const sectionCount = chapters.reduce((total, chapter) => total + chapter.sections.length, 0);
  console.log(`notes: ${notesRoot}`);
  console.log(`${chapters.length} chapters, ${sectionCount} sections, page offset ${pageOffset}`);
  console.log(`wrote ${tocOutput}`);
  console.log(`copied ${copies.map((copy) => copy.target).join(", ")} → ${publicDir}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
