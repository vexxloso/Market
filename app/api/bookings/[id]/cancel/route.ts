import { NextResponse } from "next/server";
import { BookingStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { notifyBookingCancelled } from "@/lib/booking-admin-notify";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { listing: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const isOwner = booking.userId === session.id;
  const isAdmin = session.role === UserRole.ADMIN;
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not your booking." }, { status: 403 });
  }

  if (
    booking.status !== BookingStatus.PENDING &&
    booking.status !== BookingStatus.ACCEPTED
  ) {
    return NextResponse.json(
      { error: `Cannot cancel booking from status ${booking.status}.` },
      { status: 400 },
    );
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: BookingStatus.CANCELLED },
  });

  void notifyBookingCancelled(id);

  return NextResponse.json({ data: updated });
}

