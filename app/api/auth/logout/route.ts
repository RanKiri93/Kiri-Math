import { getAuthService } from "../../../_auth/server";
import { isSameOriginMutation, privateHeaders, sessionCookie, sessionToken } from "../../../_auth/http";

export async function POST(request: Request): Promise<Response> {
  const headers = privateHeaders();
  if (!isSameOriginMutation(request)) return Response.json({ error: "request" }, { status: 403, headers });
  try {
    await (await getAuthService()).logout(sessionToken(request));
    headers.set("Set-Cookie", sessionCookie("", request, true));
    headers.set("Clear-Site-Data", '"cache"');
    headers.set("Location", "/");
    return new Response(null, { status: 303, headers });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503, headers });
  }
}
