import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { listChargesForPaymentIntent, retrieveStripeCheckoutSession } from "@/lib/stripe";
import { notifyBookingPaid } from "@/lib/booking-admin-notify";

function parseIntOrNull(v: unknown): number | null {
  if (typeof v !== "string") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

export async function POST(request: Request) {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const body = (await request.json()) as { bookingId?: string; sessionId?: string };
  if (!body.bookingId || !body.sessionId) {
    return NextResponse.json(
      { error: "bookingId and sessionId are required." },
      { status: 400 },
    );
  }

  const booking = await prisma.booking.findUnique({ where: { id: body.bookingId } });
  if (!booking || booking.userId !== session.id) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (booking.stripeCheckoutSessionId && booking.stripeCheckoutSessionId !== body.sessionId) {
    return NextResponse.json({ error: "Session does not match booking." }, { status: 400 });
  }

  const stripeSession = await retrieveStripeCheckoutSession(body.sessionId);
  if (
    stripeSession.metadata?.bookingId !== booking.id &&
    stripeSession.metadata?.bookingId !== undefined
  ) {
    return NextResponse.json({ error: "Session does not match booking." }, { status: 400 });
  }

  if (stripeSession.payment_status === "paid") {
    if (booking.status === BookingStatus.PAID) {
      return NextResponse.json({ data: booking, paid: true });
    }

    const platformFeeAmount =
      booking.platformFeeAmount ??
      parseIntOrNull(stripeSession.metadata?.platformFeeAmount) ??
      null;
    const hostPayoutAmount =
      booking.hostPayoutAmount ??
      parseIntOrNull(stripeSession.metadata?.hostPayoutAmount) ??
      null;

    const paymentIntentId =
      booking.stripePaymentIntentId ??
      (typeof stripeSession.payment_intent === "string"
        ? stripeSession.payment_intent
        : null);

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.PAID,
        stripeCheckoutSessionId: booking.stripeCheckoutSessionId ?? stripeSession.id,
        stripePaymentIntentId:
          paymentIntentId,
        platformFeeAmount,
        hostPayoutAmount,
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

    void notifyBookingPaid(booking.id, { receiptUrl });
    return NextResponse.json({ data: updated, paid: true });
  }

  return NextResponse.json({ paid: false, status: stripeSession.payment_status });
}
