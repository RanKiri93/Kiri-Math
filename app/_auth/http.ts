export const SESSION_COOKIE = "kiri_session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

export function privateHeaders(): Headers {
  return new Headers({
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
  });
}

export function sessionToken(request: Request): string | null {
  return parseSessionCookie(request.headers.get("cookie"));
}

export function parseSessionCookie(cookie: string | null): string | null {
  const matches = (cookie ?? "").split(";")
    .map((entry) => entry.trim()).filter((entry) => entry.startsWith(`${SESSION_COOKIE}=`));
  // Reject ambiguous cookies rather than selecting an attacker-controlled one.
  if (matches.length !== 1) return null;
  const token = matches[0].slice(SESSION_COOKIE.length + 1);
  return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}

export function sessionCookie(token: string, request: Request, clear = false): string {
  const secure = new URL(request.url).protocol === "https:" || process.env.NODE_ENV === "production";
  return `${SESSION_COOKIE}=${clear ? "" : token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : SESSION_MAX_AGE}${secure ? "; Secure" : ""}`;
}

export function safeNextPath(value: unknown): string {
  if (typeof value !== "string" || value.length > 512) return "/";
  // Only known, same-site course destinations. No protocol-relative URLs,
  // encoded separators, control characters, fragments, or arbitrary redirects.
  if (value === "/") return value;
  if (/^\/(ode|fourier)(\/[a-zA-Z0-9-]+)*\/?$/.test(value)) return value;
  if (/^\/courses\/(ode|fourier)\/(notes|syllabus|formula-sheet)\.pdf$/.test(value)) return value;
  return "/";
}

export function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  return origin === new URL(request.url).origin && (!site || site === "same-origin" || site === "none");
}

/** Reads a small same-origin JSON body, or null when it is missing, oversized, or malformed. */
export async function readJsonBody(request: Request, maxBytes: number): Promise<Record<string, unknown> | null> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return null;
  if (Number(request.headers.get("content-length")) > maxBytes || !request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maxBytes) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null;
  } catch { return null; }
}

export async function readLoginBody(request: Request): Promise<{ username: string; password: string; next: string } | null> {
  const body = await readJsonBody(request, 4096);
  if (!body) return null;
  const { username, password, next } = body;
  if (typeof username !== "string" || username.length > 40 || typeof password !== "string" || password.length > 128) return null;
  return { username, password, next: safeNextPath(next) };
}
