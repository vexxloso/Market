import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { createStripeCheckoutSession } from "@/lib/stripe";

type CheckoutPayload = {
  bookingId?: string;
};

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
    include: { listing: true },
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const stripe = await createStripeCheckoutSession({
    amountCents: booking.totalPrice * 100,
    title: booking.listing.title,
    description: `${booking.listing.location}, ${booking.listing.country}`,
    successUrl: `${appUrl}/book/success?bookingId=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appUrl}/profile?tab=bookings`,
    bookingId: booking.id,
  });

  return NextResponse.json({ checkoutUrl: stripe.url, bookingId: booking.id });
}
