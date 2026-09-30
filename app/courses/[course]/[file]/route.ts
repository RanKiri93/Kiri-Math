import { getAuthService } from "../../../_auth/server";
import { privateHeaders, sessionToken } from "../../../_auth/http";
import { getRuntime } from "../../../_auth/runtime";
import { isAllowedCourseFile, pdfResponse } from "../../../_auth/courseFiles";

type Params = { course: string; file: string };

async function serve(request: Request, { params }: { params: Promise<Params> }): Promise<Response> {
  const { course, file } = await params;
  if (!isAllowedCourseFile(course, file)) return new Response("לא נמצא", { status: 404 });

  const auth = await getAuthService();
  const user = await auth.getUser(sessionToken(request));
  const headers = privateHeaders();
  if (!user) {
    const path = new URL(request.url).pathname;
    headers.set("Location", `/login?next=${encodeURIComponent(path)}`);
    return new Response(null, { status: 302, headers });
  }
  if (!user.courses.includes(course)) {
    headers.set("Content-Type", "text/plain; charset=utf-8");
    return new Response("הקובץ אינו זמין בחשבונכם.", { status: 403, headers });
  }

  const key = `courses/${course}/${file}`;
  const runtime = await getRuntime();
  if (runtime.kind === "cloudflare") {
    const object = await runtime.env.COURSE_FILES?.get(key);
    if (!object) return new Response("לא נמצא", { status: 404, headers });
    return pdfResponse(object.body, object.size, request, headers);
  }

  // Keep Node built-ins out of the Workers bundle; this path executes only in Node runtime.
  const { readFile } = await import(/* webpackIgnore: true */ /* vite-ignore */ "node:fs/promises");
  const { resolve } = await import(/* webpackIgnore: true */ /* vite-ignore */ "node:path");
  let bytes: Uint8Array;
  try {
    bytes = await readFile(resolve(process.cwd(), "private", key));
  } catch {
    return new Response("לא נמצא", { status: 404, headers });
  }
  const body = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(bytes); controller.close(); },
  });
  return pdfResponse(body, bytes.byteLength, request, headers);
}

export const GET = serve;
export const HEAD = serve;
