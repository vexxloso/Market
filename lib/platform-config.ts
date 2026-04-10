import { prisma } from "@/lib/prisma";
import { decryptOptional, encryptOptional } from "@/lib/platform-config-crypto";

export type StripeKeys = {
  stripeSecretKey: string | null;
  stripePublishableKey: string | null;
  stripeWebhookSecret: string | null;
  encrypted: boolean;
  updatedAt: string | null;
};

let cache:
  | { at: number; value: StripeKeys }
  | null = null;

const CACHE_MS = 10_000;

export async function getStripeKeysFromDb(): Promise<StripeKeys> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.value;

  const row = await prisma.platformConfig.findUnique({
    where: { id: 1 },
    select: {
      stripeSecretKeyEnc: true,
      stripePublishableKey: true,
      stripeWebhookSecretEnc: true,
      encrypted: true,
      updatedAt: true,
    },
  });

  const value: StripeKeys = {
    stripeSecretKey: row?.stripeSecretKeyEnc
      ? decryptOptional(row.stripeSecretKeyEnc, row.encrypted)
      : null,
    stripePublishableKey: row?.stripePublishableKey ?? null,
    stripeWebhookSecret: row?.stripeWebhookSecretEnc
      ? decryptOptional(row.stripeWebhookSecretEnc, row.encrypted)
      : null,
    encrypted: row?.encrypted ?? false,
    updatedAt: row?.updatedAt ? row.updatedAt.toISOString() : null,
  };

  cache = { at: now, value };
  return value;
}

export async function saveStripeKeysToDb(input: Partial<{
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;
}>) {
  const existing = await prisma.platformConfig.findUnique({
    where: { id: 1 },
    select: {
      stripeSecretKeyEnc: true,
      stripePublishableKey: true,
      stripeWebhookSecretEnc: true,
      encrypted: true,
    },
  });

  const next: {
    stripeSecretKeyEnc?: string;
    stripePublishableKey?: string;
    stripeWebhookSecretEnc?: string;
    encrypted?: boolean;
  } = {};

  // NOTE: empty string means "do not change" (no clearing from UI right now).
  if (typeof input.stripePublishableKey === "string" && input.stripePublishableKey.trim()) {
    next.stripePublishableKey = input.stripePublishableKey.trim();
  }

  if (typeof input.stripeSecretKey === "string" && input.stripeSecretKey.trim()) {
    const secret = encryptOptional(input.stripeSecretKey.trim());
    next.stripeSecretKeyEnc = secret.value;
    next.encrypted = secret.encrypted;
  }

  if (typeof input.stripeWebhookSecret === "string" && input.stripeWebhookSecret.trim()) {
    const webhook = encryptOptional(input.stripeWebhookSecret.trim());
    next.stripeWebhookSecretEnc = webhook.value;
    next.encrypted = webhook.encrypted;
  }

  const anyChange =
    typeof next.stripeSecretKeyEnc === "string" ||
    typeof next.stripePublishableKey === "string" ||
    typeof next.stripeWebhookSecretEnc === "string";
  if (!anyChange) return;

  // If we are storing encrypted values, require encryption key to be present for BOTH secrets over time.
  // (Otherwise we'd risk mixing encrypted/plain and breaking decrypt.)
  const willBeEncrypted =
    next.encrypted ??
    existing?.encrypted ??
    false;

  await prisma.platformConfig.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      stripeSecretKeyEnc: next.stripeSecretKeyEnc ?? null,
      stripePublishableKey: next.stripePublishableKey ?? null,
      stripeWebhookSecretEnc: next.stripeWebhookSecretEnc ?? null,
      encrypted: willBeEncrypted,
    },
    update: {
      ...(next.stripeSecretKeyEnc ? { stripeSecretKeyEnc: next.stripeSecretKeyEnc } : {}),
      ...(next.stripePublishableKey ? { stripePublishableKey: next.stripePublishableKey } : {}),
      ...(next.stripeWebhookSecretEnc
        ? { stripeWebhookSecretEnc: next.stripeWebhookSecretEnc }
        : {}),
      ...(typeof next.encrypted === "boolean" ? { encrypted: willBeEncrypted } : {}),
    },
  });

  cache = null;
}

