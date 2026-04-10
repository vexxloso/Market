import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { createStripeCheckoutSession, retrieveStripeCheckoutSession } from "@/lib/stripe";
import { getAppPublicBaseUrl } from "@/lib/app-origin";

type CheckoutPayload = {
  bookingId?: string;
};

function splitAmounts(totalCents: number) {
  const platformFee = Math.round(totalCents * 0.1);
  const hostAmount = totalCents - platformFee;
  return { platformFee, hostAmount };
}

export async function POST(request: Request) {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const body = (await request.json()) as CheckoutPayload;
  if (!body.bookingId) {
    return NextResponse.json(
      { error: "Missing bookingId." },
      { status: 400 },
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: body.bookingId },
    include: {
      listing: {
        include: {
          host: {
            select: {
              id: true,
              stripeAccountId: true,
              stripeConnectStatus: true,
              stripeChargesEnabled: true,
              stripePayoutsEnabled: true,
            },
          },
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  // Guest can only pay their own booking; admins can pay any.
  if (booking.userId !== session.id && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Not your booking." }, { status: 403 });
  }

  if (booking.status !== BookingStatus.ACCEPTED) {
    return NextResponse.json(
      { error: `Booking must be ACCEPTED before payment (current: ${booking.status}).` },
      { status: 400 },
    );
  }

  if (booking.stripeCheckoutSessionId) {
    try {
      const existing = await retrieveStripeCheckoutSession(booking.stripeCheckoutSessionId);
      if (existing.payment_status === "paid") {
        return NextResponse.json(
          { error: "Booking is already paid." },
          { status: 409 },
        );
      }
      const expiresAtMs = existing.expires_at ? existing.expires_at * 1000 : null;
      const expired = expiresAtMs ? Date.now() >= expiresAtMs : false;
      if (!expired && existing.url) {
        return NextResponse.json({ checkoutUrl: existing.url, bookingId: booking.id });
      }
      // If expired or URL missing, fall through to create a new session and overwrite the stored session id.
    } catch {
      // If Stripe retrieval fails, fall through to create a new session.
    }
  }

  const host = booking.listing.host;
  // Guests pay the platform even if the host hasn't finished Connect yet.
  // Payouts are attempted later and will only succeed once the host is fully connected.

  const appUrl = getAppPublicBaseUrl(request);
  const totalCents = booking.totalPrice * 100;
  const { platformFee, hostAmount } = splitAmounts(totalCents);

  const metadata: Record<string, string> = {
    bookingId: booking.id,
    hostId: host.id,
    platformFeeAmount: String(platformFee),
    hostPayoutAmount: String(hostAmount),
  };
  if (host.stripeAccountId) {
    metadata.hostStripeAccountId = host.stripeAccountId;
  }

  try {
    const stripe = await createStripeCheckoutSession({
      amountCents: totalCents,
      title: booking.listing.title,
      description: `${booking.listing.location}, ${booking.listing.country}`,
      successUrl: `${appUrl}/book/success?bookingId=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/profile?tab=bookings`,
      bookingId: booking.id,
      metadata,
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        stripeCheckoutSessionId: stripe.id,
        platformFeeAmount: platformFee,
        hostPayoutAmount: hostAmount,
      },
    });

    return NextResponse.json({ checkoutUrl: stripe.url, bookingId: booking.id });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Stripe checkout could not be created.";
    console.error("[payments/checkout]", err);
    return NextResponse.json(
      {
        error:
          message.includes("Stripe") || message.includes("secret key")
            ? message
            : `Could not start checkout: ${message}`,
      },
      { status: 502 },
    );
  }
}
