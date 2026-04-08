import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import { notifyBookingPaid } from "@/lib/booking-admin-notify";
import { listChargesForPaymentIntent } from "@/lib/stripe";

function stripeSecret(): string {
  const s = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!s) throw new Error("STRIPE_WEBHOOK_SECRET is missing.");
  return s;
}

function verifyStripeSignature(rawBody: string, signatureHeader: string) {
  // Stripe-Signature: t=...,v1=...,v0=...
  const parts = signatureHeader.split(",").map((p) => p.trim());
  const tPart = parts.find((p) => p.startsWith("t="));
  const v1Part = parts.find((p) => p.startsWith("v1="));
  if (!tPart || !v1Part) throw new Error("Missing Stripe signature parts.");

  const timestamp = tPart.slice(2);
  const signature = v1Part.slice(3);
  if (!timestamp || !signature) throw new Error("Invalid Stripe signature.");

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", stripeSecret())
    .update(signedPayload, "utf8")
    .digest("hex");

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error("Invalid Stripe signature.");
  }
}

export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature") ?? "";
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature." }, { status: 400 });

  const rawBody = await request.text();

  try {
    verifyStripeSignature(rawBody, sig);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as {
    type?: string;
    data?: { object?: unknown };
  };

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data?.object as
    | {
        id?: string;
        payment_status?: string;
        payment_intent?: string | null;
        metadata?: Record<string, string | undefined>;
      }
    | undefined;

  const bookingId = session?.metadata?.bookingId;
  if (!bookingId) return NextResponse.json({ received: true });

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return NextResponse.json({ received: true });

  if (session?.payment_status === "paid" && booking.status !== BookingStatus.PAID) {
    const platformFeeAmount =
      booking.platformFeeAmount ??
      (session.metadata?.platformFeeAmount
        ? parseInt(session.metadata.platformFeeAmount, 10)
        : null);
    const hostPayoutAmount =
      booking.hostPayoutAmount ??
      (session.metadata?.hostPayoutAmount
        ? parseInt(session.metadata.hostPayoutAmount, 10)
        : null);

    const paymentIntentId =
      booking.stripePaymentIntentId ??
      (typeof session.payment_intent === "string" ? session.payment_intent : null);

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.PAID,
        stripeCheckoutSessionId: booking.stripeCheckoutSessionId ?? session.id ?? null,
        stripePaymentIntentId:
          paymentIntentId,
        platformFeeAmount: Number.isFinite(platformFeeAmount as number) ? (platformFeeAmount as number) : null,
        hostPayoutAmount: Number.isFinite(hostPayoutAmount as number) ? (hostPayoutAmount as number) : null,
      },
    });

    let receiptUrl: string | null = null;
    if (paymentIntentId) {
      try {
        const charges = await listChargesForPaymentIntent(paymentIntentId);
        receiptUrl = charges.data?.[0]?.receipt_url ?? null;
      } catch {
        receiptUrl = null;
      }
    }
    void notifyBookingPaid(bookingId, { receiptUrl });
  }

  return NextResponse.json({ received: true });
}

