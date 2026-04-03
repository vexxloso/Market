import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { calculateStayTotalPrice, parseLocalYmd } from "@/lib/pricing";
import { notifyBookingCreated } from "@/lib/booking-admin-notify";

type BookingPayload = {
  listingId?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};

export async function POST(request: Request) {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json(
      {
        error:
          "Please sign in again. Your session may be from an old login or a different database.",
      },
      { status: 401 },
    );
  }

  const body = (await request.json()) as BookingPayload;

  if (
    !body.listingId ||
    !body.checkIn ||
    !body.checkOut ||
    body.guests === undefined ||
    body.guests === null
  ) {
    return NextResponse.json(
      { error: "Missing booking fields." },
      { status: 400 },
    );
  }

  const guestsNum = Math.trunc(Number(body.guests));
  if (!Number.isFinite(guestsNum) || guestsNum <= 0) {
    return NextResponse.json(
      { error: "Guests must be a positive number." },
      { status: 400 },
    );
  }

  const checkInDate = parseLocalYmd(body.checkIn);
  const checkOutDate = parseLocalYmd(body.checkOut);
  if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
    return NextResponse.json(
      { error: "Check-out must be after check-in." },
      { status: 400 },
    );
  }

  const listing = await prisma.listing.findUnique({ where: { id: body.listingId } });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  if (guestsNum > listing.maxGuests) {
    return NextResponse.json(
      { error: `This listing supports up to ${listing.maxGuests} guests.` },
      { status: 400 },
    );
  }

  const overlap = await prisma.booking.findFirst({
    where: {
      listingId: listing.id,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.PAID],
      },
      AND: [{ checkIn: { lt: checkOutDate } }, { checkOut: { gt: checkInDate } }],
    },
    select: { id: true },
  });

  if (overlap) {
    return NextResponse.json(
      { error: "Selected dates are no longer available." },
      { status: 409 },
    );
  }

  const booking = await prisma.booking.create({
    data: {
      listingId: body.listingId,
      userId: session.id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: guestsNum,
      totalPrice: calculateStayTotalPrice(
        checkInDate,
        checkOutDate,
        listing.weekdayPrice,
        listing.weekendPrice,
      ),
      status: BookingStatus.PENDING,
    },
  });

  void notifyBookingCreated(booking.id);

  return NextResponse.json(
    {
      message: "Booking created.",
      data: booking,
    },
    { status: 201 },
  );
}
