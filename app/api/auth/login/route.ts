import { getAuthService } from "../../../_auth/server";
import { getRuntime } from "../../../_auth/runtime";
import { isSameOriginMutation, privateHeaders, readLoginBody, sessionCookie, sessionToken } from "../../../_auth/http";

export async function POST(request: Request): Promise<Response> {
  const headers = privateHeaders();
  if (!isSameOriginMutation(request)) return Response.json({ error: "request" }, { status: 403, headers });
  try {
    const body = await readLoginBody(request);
    if (!body) return Response.json({ error: "request" }, { status: 400, headers });
    const auth = await getAuthService();
    const runtime = await getRuntime();
    // CF supplies this header at its edge. Node never trusts forwarded IP headers.
    const clientKey = runtime.kind === "cloudflare" ? request.headers.get("cf-connecting-ip") ?? "unknown-edge" : "node-origin";
    const result = await auth.login(body.username, body.password, clientKey);
    if (result.status !== "ok") {
      if (result.status === "limited") headers.set("Retry-After", "900");
      return Response.json({ error: result.status }, { status: result.status === "limited" ? 429 : 401, headers });
    }
    await auth.logout(sessionToken(request));
    headers.set("Set-Cookie", sessionCookie(result.token, request));
    return Response.json({ redirect: body.next }, { headers });
  } catch {
    // Never return/log passwords, hashes, tokens, request bodies, or DB errors.
    return Response.json({ error: "unavailable" }, { status: 503, headers });
  }
}
