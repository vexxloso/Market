import { NextResponse } from "next/server";
import { BookingStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { notifyBookingPaid } from "@/lib/booking-admin-notify";

type Params = { params: Promise<{ id: string }> };

/** Marks booking as PAID without Stripe (demo / local workflow). */
export async function POST(_request: Request, { params }: Params) {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (booking.userId !== session.id && session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Not your booking." }, { status: 403 });
  }

  if (booking.status !== BookingStatus.ACCEPTED) {
    return NextResponse.json(
      { error: "Booking must be accepted before payment." },
      { status: 400 },
    );
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: BookingStatus.PAID },
  });

  void notifyBookingPaid(id);

  return NextResponse.json({ data: updated });
}
