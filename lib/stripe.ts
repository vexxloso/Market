const STRIPE_API_BASE = "https://api.stripe.com/v1";

import { getStripeKeysFromDb } from "@/lib/platform-config";

async function getStripeSecretKey(): Promise<string> {
  const envKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (envKey) return envKey;
  const keys = await getStripeKeysFromDb();
  const dbKey = keys.stripeSecretKey?.trim() ?? "";
  if (!dbKey) throw new Error("Stripe secret key is missing. Configure it in Admin → Stripe keys.");
  return dbKey;
}

async function toAuthHeader() {
  const key = await getStripeSecretKey();
  if (key.startsWith("pk_")) {
    throw new Error("Stripe secret key must be sk_test_... or sk_live_..., not pk_...");
  }
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

async function stripePost(path: string, body: URLSearchParams, headers?: Record<string, string>) {
  const res = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: await toAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
      ...(headers ?? {}),
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stripe POST ${path} failed: ${text}`);
  }
  return (await res.json()) as unknown;
}

async function stripeGet(path: string) {
  const res = await fetch(`${STRIPE_API_BASE}${path}`, {
    headers: { Authorization: await toAuthHeader() },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stripe GET ${path} failed: ${text}`);
  }
  return (await res.json()) as unknown;
}

export async function listChargesForPaymentIntent(paymentIntentId: string) {
  const query = new URLSearchParams();
  query.set("payment_intent", paymentIntentId);
  query.set("limit", "10");
  return (await stripeGet(`/charges?${query.toString()}`)) as {
    data: Array<{
      id: string;
      receipt_url?: string | null;
      created: number;
    }>;
  };
}

export async function createStripeCheckoutSession(input: {
  amountCents: number;
  title: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  bookingId: string;
  metadata?: Record<string, string>;
}) {
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", input.successUrl);
  body.set("cancel_url", input.cancelUrl);
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", "usd");
  body.set("line_items[0][price_data][unit_amount]", String(input.amountCents));
  body.set("line_items[0][price_data][product_data][name]", input.title);
  body.set("line_items[0][price_data][product_data][description]", input.description);
  body.set("metadata[bookingId]", input.bookingId);
  for (const [k, v] of Object.entries(input.metadata ?? {})) {
    body.set(`metadata[${k}]`, v);
  }

  return (await stripePost("/checkout/sessions", body)) as { id: string; url: string };
}

export async function retrieveStripeCheckoutSession(sessionId: string) {
  return (await stripeGet(`/checkout/sessions/${sessionId}`)) as {
    id: string;
    payment_status: "paid" | "unpaid" | "no_payment_required";
    /** Present when the session was created with a hosted URL and is still usable. */
    url?: string | null;
    expires_at?: number | null;
    payment_intent?: string | null;
    metadata?: {
      bookingId?: string;
      platformFeeAmount?: string;
      hostPayoutAmount?: string;
      hostId?: string;
      hostStripeAccountId?: string;
      [k: string]: string | undefined;
    };
  };
}

export async function createStripeConnectAccount(input: { email?: string | null }) {
  const body = new URLSearchParams();
  body.set("type", "express");
  if (input.email) body.set("email", input.email);
  // Helps Stripe understand platform context; safe defaults.
  body.set("capabilities[card_payments][requested]", "true");
  body.set("capabilities[transfers][requested]", "true");
  return (await stripePost("/accounts", body)) as { id: string };
}

export async function createStripeAccountLink(input: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}) {
  const body = new URLSearchParams();
  body.set("account", input.accountId);
  body.set("refresh_url", input.refreshUrl);
  body.set("return_url", input.returnUrl);
  body.set("type", "account_onboarding");
  return (await stripePost("/account_links", body)) as { url: string };
}

export async function retrieveStripeAccount(accountId: string) {
  return (await stripeGet(`/accounts/${accountId}`)) as {
    id: string;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
  };
}

export async function createStripeTransfer(input: {
  amountCents: number;
  destinationAccountId: string;
  transferGroup?: string;
  metadata?: Record<string, string>;
}) {
  const body = new URLSearchParams();
  body.set("amount", String(input.amountCents));
  body.set("currency", "usd");
  body.set("destination", input.destinationAccountId);
  if (input.transferGroup) body.set("transfer_group", input.transferGroup);
  for (const [k, v] of Object.entries(input.metadata ?? {})) {
    body.set(`metadata[${k}]`, v);
  }
  return (await stripePost("/transfers", body)) as { id: string };
}
