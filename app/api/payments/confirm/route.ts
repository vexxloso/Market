import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { retrieveStripeCheckoutSession } from "@/lib/stripe";
import { notifyBookingPaid } from "@/lib/booking-admin-notify";

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

  const stripeSession = await retrieveStripeCheckoutSession(body.sessionId);
  if (
    stripeSession.metadata?.bookingId !== booking.id &&
    stripeSession.metadata?.bookingId !== undefined
  ) {
    return NextResponse.json({ error: "Session does not match booking." }, { status: 400 });
  }

  if (stripeSession.payment_status === "paid") {
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.PAID },
    });
    void notifyBookingPaid(booking.id);
    return NextResponse.json({ data: updated, paid: true });
  }

  return NextResponse.json({ paid: false, status: stripeSession.payment_status });
}
