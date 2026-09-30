import { randomBytes, scrypt as scryptCallback, createHash, timingSafeEqual } from "node:crypto";
const N = 32768;
const R = 8;
const P = 3;
const KEY_LENGTH = 32;
const MAXMEM = 64 * 1024 * 1024;
const HASH_FORMAT = /^scrypt\$1\$32768\$8\$3\$([A-Za-z0-9_-]{22})\$([A-Za-z0-9_-]{43})$/;

function deriveKey(password: string, salt: Uint8Array): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, KEY_LENGTH, { N, r: R, p: P, maxmem: MAXMEM }, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export function validatePassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128;
}

export async function hashPassword(password: string): Promise<string> {
  if (!validatePassword(password)) throw new Error("Password must contain 8 to 128 characters");
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt);
  return `scrypt$1$${N}$${R}$${P}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const match = HASH_FORMAT.exec(encoded);
  if (!match || !validatePassword(password)) return false;
  try {
    const salt = Buffer.from(match[1], "base64url");
    const expected = Buffer.from(match[2], "base64url");
    if (salt.length !== 16 || expected.length !== KEY_LENGTH) return false;
    const actual = await deriveKey(password, salt);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function dummyPasswordVerify(password: string): Promise<void> {
  const salt = Buffer.alloc(16);
  await deriveKey(password, salt);
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function hashRateLimitKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}
