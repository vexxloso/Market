import { randomInt, timingSafeEqual } from "crypto";

/** Six-digit string, leading zeros preserved. */
export function generateEmailVerificationOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Digits only, exactly 6 characters, or null. */
export function normalizeOtpInput(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 6) return null;
  return d;
}

export function otpEqualsStored(input: string, stored: string | null): boolean {
  if (!stored || stored.length !== 6 || input.length !== 6) return false;
  try {
    return timingSafeEqual(Buffer.from(input, "utf8"), Buffer.from(stored, "utf8"));
  } catch {
    return false;
  }
}
