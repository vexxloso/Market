import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { sendPlatformMessageToUser } from "@/lib/admin-messaging";
import { getAppPublicBaseUrl } from "@/lib/app-origin";

type Params = { params: Promise<{ id: string }> };

function formatBookingDates(checkIn: Date, checkOut: Date) {
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "2-digit",
  };
  return `${checkIn.toLocaleDateString("en-US", opts)} – ${checkOut.toLocaleDateString("en-US", opts)}`;
}

export async function POST(request: Request, { params }: Params) {
  const session = await getVerifiedSessionUser();
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { reason?: string };
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason) {
    return NextResponse.json({ error: "Reason is required." }, { status: 400 });
  }
  if (reason.length > 2000) {
    return NextResponse.json({ error: "Reason is too long." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      listing: { select: { id: true, title: true, hostId: true } },
      user: { select: { id: true, email: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const guestId = booking.userId;
  const hostId = booking.listing.hostId;
  const origin = getAppPublicBaseUrl(request);
  const listingUrl = `${origin}/listing/${booking.listing.id}`;
  const tripsUrl = `${origin}/profile?tab=bookings`;

  const baseText =
    `[Noire Haven — booking removed by platform]\n` +
    `Listing: ${booking.listing.title}\n` +
    `Dates: ${formatBookingDates(booking.checkIn, booking.checkOut)}\n` +
    `Reason: ${reason}\n\n` +
    `Links:\n• Listing: ${listingUrl}\n• Bookings tab: ${tripsUrl}`;

  const guestNote = `${baseText}\n\n(This message was sent to you as the guest.)`;
  const hostNote = `${baseText}\n\n(This message was sent to you as the host.)`;

  try {
    await sendPlatformMessageToUser({
      adminUserId: session.id,
      targetUserId: guestId,
      body: guestNote,
    });
    if (hostId !== guestId) {
      await sendPlatformMessageToUser({
        adminUserId: session.id,
        targetUserId: hostId,
        body: hostNote,
      });
    }
  } catch (e) {
    if ((e as Error).message === "NO_ADMIN_USER") {
      return NextResponse.json(
        { error: "No admin user available for support messaging." },
        { status: 500 },
      );
    }
    throw e;
  }

  await prisma.booking.delete({ where: { id } });

  return NextResponse.json({ data: { removed: true } });
}
