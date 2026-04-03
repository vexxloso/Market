const STRIPE_API_BASE = "https://api.stripe.com/v1";

function getStripeKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is missing.");
  return key;
}

function toAuthHeader() {
  return `Basic ${Buffer.from(`${getStripeKey()}:`).toString("base64")}`;
}

export async function createStripeCheckoutSession(input: {
  amountCents: number;
  title: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  bookingId: string;
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

  const res = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: toAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stripe checkout session failed: ${text}`);
  }

  return (await res.json()) as { id: string; url: string };
}

export async function retrieveStripeCheckoutSession(sessionId: string) {
  const res = await fetch(`${STRIPE_API_BASE}/checkout/sessions/${sessionId}`, {
    headers: {
      Authorization: toAuthHeader(),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stripe session retrieval failed: ${text}`);
  }

  return (await res.json()) as {
    id: string;
    payment_status: "paid" | "unpaid" | "no_payment_required";
    metadata?: { bookingId?: string };
  };
}
