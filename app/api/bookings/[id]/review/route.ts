import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { notifyBookingCompleted } from "@/lib/booking-admin-notify";
import { markBookingPayoutEligible, processBookingPayout } from "@/lib/payouts";

type ReviewPayload = {
  rating?: number;
  comment?: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { id: bookingId } = await params;
  const body = (await request.json()) as ReviewPayload;

  const rating = typeof body.rating === "number" ? body.rating : NaN;
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be an integer from 1 to 5." }, { status: 400 });
  }
  if (!comment) {
    return NextResponse.json({ error: "Comment is required." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, userId: true, listingId: true, checkOut: true, status: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (booking.userId !== session.id) {
    return NextResponse.json({ error: "Not your booking." }, { status: 403 });
  }

  if (booking.status !== BookingStatus.PAID) {
    return NextResponse.json(
      { error: `Booking must be PAID before review (current: ${booking.status}).` },
      { status: 400 },
    );
  }

  if (booking.checkOut > new Date()) {
    return NextResponse.json(
      { error: "You can only review after the stay is completed." },
      { status: 400 },
    );
  }

  const existing = await prisma.review.findFirst({
    where: { userId: session.id, listingId: booking.listingId },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You already reviewed this stay." },
      { status: 409 },
    );
  }

  const created = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        userId: session.id,
        listingId: booking.listingId,
        rating,
        comment,
      },
    });

    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.COMPLETED },
    });

    return { review, booking: updatedBooking };
  });

  await markBookingPayoutEligible(bookingId);
  void processBookingPayout(bookingId);
  void notifyBookingCompleted(bookingId);

  return NextResponse.json({ data: created });
}

