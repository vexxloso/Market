import { NextResponse } from "next/server";
import { getVerifiedSessionUser } from "@/lib/auth";
import { saveStripeKeysToDb, getStripeKeysFromDb } from "@/lib/platform-config";

function mask(v: string | null): string {
  if (!v) return "—";
  const s = v.trim();
  if (s.length <= 12) return "********";
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

export async function GET() {
  const session = await getVerifiedSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const keys = await getStripeKeysFromDb();
  const mode = keys.stripeSecretKey?.startsWith("sk_test_")
    ? "test"
    : keys.stripeSecretKey?.startsWith("sk_live_")
      ? "live"
      : null;

  return NextResponse.json({
    data: {
      mode,
      encrypted: keys.encrypted,
      updatedAt: keys.updatedAt,
      stripeSecretKeyMasked: mask(keys.stripeSecretKey),
      stripePublishableKeyMasked: mask(keys.stripePublishableKey),
      stripeWebhookSecretMasked: mask(keys.stripeWebhookSecret),
      configured: Boolean(keys.stripeSecretKey && keys.stripeWebhookSecret),
    },
  });
}

export async function PUT(request: Request) {
  const session = await getVerifiedSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Partial<{
    stripeSecretKey: string;
    stripePublishableKey: string;
    stripeWebhookSecret: string;
  }>;

  const stripeSecretKey = body.stripeSecretKey?.trim();
  const stripePublishableKey = body.stripePublishableKey?.trim();
  const stripeWebhookSecret = body.stripeWebhookSecret?.trim();

  if (stripeSecretKey && !stripeSecretKey.startsWith("sk_")) {
    return NextResponse.json(
      { error: "Stripe secret key must start with sk_test_ or sk_live_." },
      { status: 400 },
    );
  }
  if (stripePublishableKey && !stripePublishableKey.startsWith("pk_")) {
    return NextResponse.json(
      { error: "Stripe publishable key must start with pk_test_ or pk_live_." },
      { status: 400 },
    );
  }
  if (stripeWebhookSecret && !stripeWebhookSecret.startsWith("whsec_")) {
    return NextResponse.json(
      { error: "Stripe webhook secret must start with whsec_." },
      { status: 400 },
    );
  }

  if (!stripeSecretKey && !stripePublishableKey && !stripeWebhookSecret) {
    return NextResponse.json(
      { error: "Provide at least one key to save." },
      { status: 400 },
    );
  }

  await saveStripeKeysToDb({
    ...(stripeSecretKey ? { stripeSecretKey } : {}),
    ...(stripePublishableKey ? { stripePublishableKey } : {}),
    ...(stripeWebhookSecret ? { stripeWebhookSecret } : {}),
  });

  return NextResponse.json({ ok: true });
}

