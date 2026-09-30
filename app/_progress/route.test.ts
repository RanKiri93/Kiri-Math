import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), markCompleted: vi.fn() }));

vi.mock("../_auth/server", () => ({ getAuthService: async () => ({ getUser: mocks.getUser }) }));
vi.mock("./server", () => ({ getProgressStore: async () => ({ markCompleted: mocks.markCompleted }) }));

import { POST } from "../api/progress/complete/route";

const origin = "https://example.test";
const token = "a".repeat(43);
const valid = JSON.stringify({ course: "ode", module: "function-sequences", activity: "convergence-lab" });
const post = (body: string, extra: Record<string, string> = {}) => POST(new Request(`${origin}/api/progress/complete`, {
  method: "POST",
  headers: { origin, "content-type": "application/json", cookie: `kiri_session=${token}`, ...extra },
  body,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ id: "u1", username: "student", courses: ["ode"] });
  mocks.markCompleted.mockResolvedValue(undefined);
});

describe("activity completion HTTP handler", () => {
  it("records a registered activity for the signed-in, entitled student", async () => {
    const response = await post(valid);
    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(mocks.getUser).toHaveBeenCalledWith(token);
    expect(mocks.markCompleted).toHaveBeenCalledWith("u1", { course: "ode", moduleId: "function-sequences", activityId: "convergence-lab" }, expect.any(Number));
  });

  it("rejects cross-site requests before reading the session", async () => {
    const response = await post(valid, { origin: "https://evil.test" });
    expect(response.status).toBe(403);
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.markCompleted).not.toHaveBeenCalled();
  });

  it.each([
    ["malformed JSON", "{"],
    ["an unregistered activity", JSON.stringify({ course: "ode", module: "function-sequences", activity: "other" })],
    ["an oversized body", JSON.stringify({ course: "ode", module: "function-sequences", activity: "x".repeat(600) })],
  ])("rejects %s", async (_label, body) => {
    const response = await post(body);
    expect(response.status).toBe(400);
    expect(mocks.markCompleted).not.toHaveBeenCalled();
  });

  it("requires a session and a grant for the activity's course", async () => {
    mocks.getUser.mockResolvedValueOnce(null);
    expect((await post(valid)).status).toBe(401);
    mocks.getUser.mockResolvedValueOnce({ id: "u1", username: "student", courses: ["fourier"] });
    expect((await post(valid)).status).toBe(403);
    expect(mocks.markCompleted).not.toHaveBeenCalled();
  });

  it("reports storage failure without detail", async () => {
    mocks.markCompleted.mockRejectedValueOnce(new Error("no such table: activity_completions"));
    const response = await post(valid);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("activity_completions");
  });
});
