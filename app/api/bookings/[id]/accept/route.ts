import { NextResponse } from "next/server";
import { BookingStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { notifyBookingAccepted } from "@/lib/booking-admin-notify";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  if (session.role !== UserRole.HOST && session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Host only." }, { status: 403 });
  }

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { listing: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const isHostOwner = booking.listing.hostId === session.id;
  if (session.role !== UserRole.ADMIN && !isHostOwner) {
    return NextResponse.json({ error: "Not your booking." }, { status: 403 });
  }

  if (booking.status !== BookingStatus.PENDING) {
    return NextResponse.json(
      { error: `Cannot accept booking from status ${booking.status}.` },
      { status: 400 },
    );
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: BookingStatus.ACCEPTED },
  });

  void notifyBookingAccepted(id);

  return NextResponse.json({ data: updated });
}

