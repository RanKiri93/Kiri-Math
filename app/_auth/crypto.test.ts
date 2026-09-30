import { describe, expect, it } from "vitest";
import { hashPassword, hashToken, verifyPassword } from "./crypto";

describe("auth cryptography", () => {
  it("stores a versioned scrypt hash and verifies it without accepting malformed formats", async () => {
    const hash = await hashPassword("12345678");
    expect(hash).toMatch(/^scrypt\$1\$32768\$8\$3\$/);
    expect(await verifyPassword("12345678", hash)).toBe(true);
    expect(await verifyPassword("87654321", hash)).toBe(false);
    expect(await verifyPassword("12345678", "scrypt$999$broken")).toBe(false);
    await expect(hashPassword("short")).rejects.toThrow();
  }, 30_000);

  it("hashes tokens deterministically without retaining the token itself", () => {
    expect(hashToken("secret-token")).toBe(hashToken("secret-token"));
    expect(hashToken("secret-token")).not.toBe("secret-token");
  });
});
