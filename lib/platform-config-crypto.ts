import crypto from "node:crypto";

function getEncryptionKey(): Buffer | null {
  const raw = process.env.APP_CONFIG_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  // Accept base64 or hex (common formats)
  try {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
    const b = Buffer.from(raw, "base64");
    if (b.length === 32) return b;
  } catch {
    // fall through
  }
  return null;
}

export function encryptOptional(plain: string): { value: string; encrypted: boolean } {
  const key = getEncryptionKey();
  if (!key) {
    return { value: plain, encrypted: false };
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // payload = iv.tag.ciphertext (base64)
  const payload = Buffer.concat([iv, tag, ciphertext]).toString("base64");
  return { value: payload, encrypted: true };
}

export function decryptOptional(stored: string, encrypted: boolean): string {
  if (!encrypted) return stored;
  const key = getEncryptionKey();
  if (!key) {
    throw new Error(
      "Stored config is encrypted but APP_CONFIG_ENCRYPTION_KEY is not set.",
    );
  }
  const buf = Buffer.from(stored, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  return plain;
}

