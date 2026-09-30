import { describe, expect, it } from "vitest";
import { isSameOriginMutation, readLoginBody, safeNextPath, sessionCookie, sessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "./http";

describe("auth HTTP boundaries", () => {
  it.each([
    ["/", "/"], ["/ode/4/phase-plane", "/ode/4/phase-plane"],
    ["/courses/fourier/notes.pdf", "/courses/fourier/notes.pdf"],
    ["https://evil.example/", "/"], ["//evil.example", "/"], ["/\\evil.example", "/"],
    ["/ode/%2f%2fevil.example", "/"], ["/ode?next=https://evil.example", "/"],
    ["/ode#fragment", "/"], ["/login", "/"], ["/courses/ode/other.pdf", "/"],
    ["x".repeat(513), "/"], [null, "/"],
  ])("safeNextPath(%j) = %j", (value, expected) => expect(safeNextPath(value)).toBe(expected));

  it("requires an exact same-origin Origin and rejects cross-site fetch metadata", () => {
    const request = (headers: Record<string, string>) => new Request("https://kiri.example/api/auth/login", { method: "POST", headers });
    expect(isSameOriginMutation(request({ origin: "https://kiri.example" }))).toBe(true);
    expect(isSameOriginMutation(request({}))).toBe(false);
    expect(isSameOriginMutation(request({ origin: "https://evil.example" }))).toBe(false);
    expect(isSameOriginMutation(request({ origin: "https://kiri.example", "sec-fetch-site": "cross-site" }))).toBe(false);
    expect(isSameOriginMutation(request({ origin: "null" }))).toBe(false);
  });

  it("parses only bounded JSON login bodies and sanitizes the redirect", async () => {
    const body = (text: string, headers: Record<string, string> = { "content-type": "application/json" }) =>
      readLoginBody(new Request("https://kiri.example/api/auth/login", { method: "POST", headers, body: text }));
    await expect(body('{"username":"alice","password":"12345678","next":"//evil.test"}'))
      .resolves.toEqual({ username: "alice", password: "12345678", next: "/" });
    await expect(body("{" )).resolves.toBeNull();
    await expect(body("[]")).resolves.toBeNull();
    await expect(body('{"username":2,"password":"12345678"}')).resolves.toBeNull();
    await expect(body('{"username":"alice","password":"12345678"}', { "content-type": "text/plain" })).resolves.toBeNull();
    await expect(body('{"username":"alice","password":"12345678"}', { "content-type": "application/json", "content-length": "4097" })).resolves.toBeNull();
    await expect(body(JSON.stringify({ username: "alice", password: "x".repeat(4090) }))).resolves.toBeNull();
  });

  it("sets hardened session cookie attributes and rejects duplicate/malformed cookies", () => {
    const token = "a".repeat(43);
    const https = new Request("https://kiri.example/");
    const cookie = sessionCookie(token, https);
    expect(cookie).toContain(`${SESSION_COOKIE}=${token}`);
    expect(cookie).toContain("HttpOnly"); expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/"); expect(cookie).toContain(`Max-Age=${SESSION_MAX_AGE}`); expect(cookie).toContain("Secure");
    expect(sessionCookie(token, https, true)).toContain("Max-Age=0");
    expect(sessionToken(new Request("https://kiri.example/", { headers: { cookie: `${SESSION_COOKIE}=${token}` } }))).toBe(token);
    for (const value of [`${SESSION_COOKIE}=${token}; ${SESSION_COOKIE}=${token}`, `${SESSION_COOKIE}=bad`]) {
      expect(sessionToken(new Request("https://kiri.example/", { headers: { cookie: value } }))).toBeNull();
    }
  });
});
