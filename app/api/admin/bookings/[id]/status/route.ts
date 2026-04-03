import { NextResponse } from "next/server";
import { BookingStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getVerifiedSessionUser();
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { status?: BookingStatus };
  if (!body.status || !Object.values(BookingStatus).includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const existing = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: { status: body.status },
  });

  return NextResponse.json({
    data: booking,
    audit: {
      actorId: session.id,
      action: "BOOKING_STATUS_UPDATED",
      bookingId: booking.id,
      previousStatus: existing.status,
      newStatus: booking.status,
    },
  });
}
