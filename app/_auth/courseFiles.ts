import type { CourseSlug } from "./model";

export const COURSE_FILES = ["notes.pdf", "syllabus.pdf", "formula-sheet.pdf"] as const;
export type CourseFile = (typeof COURSE_FILES)[number];
export interface BucketLike {
  get(key: string): Promise<{ body: ReadableStream<Uint8Array>; size: number } | null>;
}

export function parseByteRange(value: string | null, size: number): { start: number; end: number } | null | "invalid" {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2]) || size <= 0) return "invalid";
  let start: number;
  let end: number;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!suffix) return "invalid";
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (start >= size || end < start) return "invalid";
    end = Math.min(end, size - 1);
  }
  return { start, end };
}

export function isAllowedCourseFile(course: string, file: string): course is CourseSlug {
  return (course === "ode" || course === "fourier") && COURSE_FILES.some((allowed) => file === allowed);
}

export function pdfResponse(body: ReadableStream<Uint8Array> | null, size: number, request: Request, headers: Headers): Response {
  headers.set("Content-Type", "application/pdf");
  headers.set("Content-Disposition", "inline");
  headers.set("Accept-Ranges", "bytes");
  const range = parseByteRange(request.headers.get("range"), size);
  if (range === "invalid") {
    headers.set("Content-Range", `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }
  if (!body) return new Response(null, { status: 200, headers });
  if (!range) {
    headers.set("Content-Length", String(size));
    return new Response(request.method === "HEAD" ? null : body, { headers });
  }
  const { start, end } = range;
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(request.method === "HEAD" ? null : sliceStream(body, start, end), { status: 206, headers });
}

function sliceStream(source: ReadableStream<Uint8Array>, start: number, end: number): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  let offset = 0;
  return new ReadableStream({
    async pull(controller) {
      while (offset <= end) {
        const { done, value } = await reader.read();
        if (done) { controller.close(); return; }
        const chunkStart = offset;
        const chunkEnd = offset + value.length - 1;
        offset += value.length;
        if (chunkEnd < start) continue;
        const from = Math.max(0, start - chunkStart);
        const to = Math.min(value.length, end - chunkStart + 1);
        controller.enqueue(value.subarray(from, to));
      }
      controller.close();
      await reader.cancel();
    },
    cancel() { return reader.cancel(); },
  });
}
