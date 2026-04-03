import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEYLEN = 64;

export const PASSWORD_MIN_LENGTH = 8;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, KEYLEN);
  return `${salt}:${key.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, keyHex] = stored.split(":");
  if (!salt || !keyHex) return false;
  try {
    const key = scryptSync(password, salt, KEYLEN);
    const expected = Buffer.from(keyHex, "hex");
    if (key.length !== expected.length) return false;
    return timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}
