import { getAuthService } from "../../../_auth/server";
import { isSameOriginMutation, privateHeaders, readJsonBody, sessionToken } from "../../../_auth/http";
import { parseActivityRef } from "../../../_progress/validation";
import { getProgressStore } from "../../../_progress/server";

export async function POST(request: Request): Promise<Response> {
  const headers = privateHeaders();
  if (!isSameOriginMutation(request)) return Response.json({ error: "request" }, { status: 403, headers });
  try {
    const ref = parseActivityRef(await readJsonBody(request, 512));
    if (!ref) return Response.json({ error: "request" }, { status: 400, headers });
    const user = await (await getAuthService()).getUser(sessionToken(request));
    if (!user) return Response.json({ error: "session" }, { status: 401, headers });
    if (!user.courses.includes(ref.course)) return Response.json({ error: "course" }, { status: 403, headers });
    await (await getProgressStore()).markCompleted(user.id, ref, Date.now());
    return new Response(null, { status: 204, headers });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503, headers });
  }
}
