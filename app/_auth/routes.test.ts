import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  login: vi.fn(), logout: vi.fn(), getUser: vi.fn(), runtime: vi.fn(), storageGet: vi.fn(),
}));

vi.mock("./server", () => ({ getAuthService: async () => ({ login: mocks.login, logout: mocks.logout, getUser: mocks.getUser }) }));
vi.mock("./runtime", () => ({ getRuntime: mocks.runtime }));

import { POST as login } from "../api/auth/login/route";
import { POST as logout } from "../api/auth/logout/route";
import { GET, HEAD } from "../courses/[course]/[file]/route";

const origin = "https://example.test";
const token = "a".repeat(43);
const headers = { origin, "content-type": "application/json" };
const request = (path: string, init: RequestInit = {}) => new Request(`${origin}${path}`, init);
const loginRequest = (body: string, extra: Record<string, string> = {}) => request("/api/auth/login", { method: "POST", headers: { ...headers, ...extra }, body });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.runtime.mockResolvedValue({ kind: "node" });
  mocks.login.mockResolvedValue({ status: "invalid" });
  mocks.logout.mockResolvedValue(undefined);
  mocks.getUser.mockResolvedValue(null);
  mocks.storageGet.mockResolvedValue({ body: new ReadableStream({ start(c) { c.enqueue(new Uint8Array([1, 2, 3, 4])); c.close(); } }), size: 4 });
  mocks.runtime.mockImplementation(async () => ({ kind: "cloudflare", env: { COURSE_FILES: { get: mocks.storageGet } } }));
});

describe("login and logout HTTP handlers", () => {
  it.each([
    ["foreign origin", { origin: "https://evil.test" }],
    ["missing origin", { origin: undefined }],
    ["cross-site fetch", { "sec-fetch-site": "cross-site" }],
  ])("rejects %s before authentication", async (_label, extra) => {
    const h: Record<string, string | undefined> = { ...headers, ...extra };
    if ("origin" in extra && extra.origin === undefined) delete h.origin;
    const cleanHeaders = Object.fromEntries(Object.entries(h).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
    const response = await login(request("/api/auth/login", { method: "POST", headers: cleanHeaders, body: '{"username":"student","password":"12345678"}' }));
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it.each([["invalid", 401], ["limited", 429]] as const)("maps %s login status", async (status, code) => {
    mocks.login.mockResolvedValue({ status });
    const response = await login(loginRequest('{"username":"student","password":"12345678"}'));
    expect(response.status).toBe(code);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("retry-after")).toBe(status === "limited" ? "900" : null);
  });

  it("sets a secure HttpOnly session cookie and revokes the previous token on success", async () => {
    mocks.login.mockResolvedValue({ status: "ok", token, user: {} });
    const response = await login(loginRequest('{"username":"student","password":"12345678","next":"/ode/1"}', { cookie: `kiri_session=${"b".repeat(43)}` }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ redirect: "/ode/1" });
    expect(response.headers.get("set-cookie")).toContain(`kiri_session=${token}`);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(mocks.logout).toHaveBeenCalledWith("b".repeat(43));
  });

  it.each([
    ["malformed JSON", "{"], ["oversized declared body", JSON.stringify({ username: "student", password: "x" }), { "content-length": "4097" }],
  ] as const)("rejects %s body", async (_label, body, extra: Record<string, string> = {}) => {
    const response = await login(loginRequest(body, extra));
    expect(response.status).toBe(400);
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it("logs out the presented token and clears the cookie", async () => {
    const response = await logout(request("/api/auth/logout", { method: "POST", headers: { origin, cookie: `kiri_session=${token}` } }));
    expect(response.status).toBe(303);
    expect(mocks.logout).toHaveBeenCalledWith(token);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});

describe("private course PDF HTTP handler", () => {
  const params = Promise.resolve({ course: "ode", file: "notes.pdf" });
  const fileRequest = (method = "GET", extra: Record<string, string> = {}) => request("/courses/ode/notes.pdf", { method, headers: extra });

  it("redirects unauthenticated requests and denies unentitled users before storage", async () => {
    const denied = await GET(fileRequest(), { params });
    expect(denied.status).toBe(302);
    expect(mocks.storageGet).not.toHaveBeenCalled();
    mocks.getUser.mockResolvedValue({ id: "1", username: "x", courses: [] });
    const forbidden = await GET(fileRequest(), { params });
    expect(forbidden.status).toBe(403);
    expect(forbidden.headers.get("cache-control")).toContain("no-store");
    expect(mocks.storageGet).not.toHaveBeenCalled();
  });

  it("serves authorized byte ranges and HEAD, rejecting unsatisfiable ranges", async () => {
    mocks.getUser.mockResolvedValue({ id: "1", username: "x", courses: ["ode"] });
    const range = await GET(fileRequest("GET", { range: "bytes=1-2", cookie: `kiri_session=${token}` }), { params });
    expect(range.status).toBe(206);
    expect(range.headers.get("content-range")).toBe("bytes 1-2/4");
    expect([...new Uint8Array(await range.arrayBuffer())]).toEqual([2, 3]);
    const head = await HEAD(fileRequest("HEAD", { cookie: `kiri_session=${token}` }), { params });
    expect(head.status).toBe(200);
    expect(await head.text()).toBe("");
    const invalid = await HEAD(fileRequest("HEAD", { range: "bytes=9-", cookie: `kiri_session=${token}` }), { params });
    expect(invalid.status).toBe(416);
    expect(invalid.headers.get("cache-control")).toContain("no-store");
  });

  it("fails closed when authentication or storage fails", async () => {
    mocks.getUser.mockRejectedValue(new Error("db"));
    await expect(GET(fileRequest(), { params })).rejects.toThrow("db");
    mocks.getUser.mockResolvedValue({ id: "1", username: "x", courses: ["ode"] });
    mocks.storageGet.mockRejectedValue(new Error("bucket"));
    await expect(GET(fileRequest("GET", { cookie: `kiri_session=${token}` }), { params })).rejects.toThrow("bucket");
  });
});
