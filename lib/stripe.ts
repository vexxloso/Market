const STRIPE_API_BASE = "https://api.stripe.com/v1";

function getStripeKey() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is missing. Add your Stripe secret key from https://dashboard.stripe.com/apikeys",
    );
  }
  if (key.startsWith("pk_")) {
    throw new Error(
      "STRIPE_SECRET_KEY must be a secret key (sk_test_... or sk_live_...), not a publishable key (pk_...). Copy the “Secret key” from https://dashboard.stripe.com/apikeys",
    );
  }
  return key;
}

function toAuthHeader() {
  return `Basic ${Buffer.from(`${getStripeKey()}:`).toString("base64")}`;
}

async function stripePost(path: string, body: URLSearchParams, headers?: Record<string, string>) {
  const res = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: toAuthHeader(),
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
    headers: { Authorization: toAuthHeader() },
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
    metadata?: { bookingId?: string };
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
