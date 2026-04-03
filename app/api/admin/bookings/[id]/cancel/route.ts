import { NextResponse } from "next/server";
import { BookingStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { ensureBookingConversation } from "@/lib/conversation-utils";
import { emitToBookingThread } from "@/lib/realtime";
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

  const origin = getAppPublicBaseUrl(request);
  const listingUrl = `${origin}/listing/${booking.listing.id}`;
  const tripsUrl = `${origin}/profile?tab=bookings`;

  const notice =
    `[Stayly — booking cancelled by platform]\n` +
    `Listing: ${booking.listing.title}\n` +
    `Dates: ${formatBookingDates(booking.checkIn, booking.checkOut)}\n` +
    `Reason: ${reason}\n\n` +
    `Links (tap or copy into your browser):\n` +
    `• Listing page: ${listingUrl}\n` +
    `• Your bookings: ${tripsUrl}`;

  const conv = await ensureBookingConversation(booking.id);
  if (!conv) {
    return NextResponse.json({ error: "Could not open booking thread." }, { status: 500 });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId: session.id,
      body: notice,
    },
    select: {
      id: true,
      senderId: true,
      body: true,
      createdAt: true,
      readAt: true,
    },
  });

  await prisma.conversation.update({
    where: { id: conv.id },
    data: { updatedAt: new Date() },
  });

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: BookingStatus.CANCELLED },
  });

  const dto = {
    id: message.id,
    senderId: message.senderId,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    readAt: message.readAt?.toISOString() ?? null,
  };

  void emitToBookingThread(conv.guestId, conv.hostId, "message:new", {
    conversationId: conv.id,
    message: dto,
  });
  void emitToBookingThread(conv.guestId, conv.hostId, "unread:refresh", {
    conversationId: conv.id,
  });

  try {
    await sendPlatformMessageToUser({
      adminUserId: session.id,
      targetUserId: booking.userId,
      body: `${notice}\n\n(Sent to you as the guest.)`,
    });
    if (booking.listing.hostId !== booking.userId) {
      await sendPlatformMessageToUser({
        adminUserId: session.id,
        targetUserId: booking.listing.hostId,
        body: `${notice}\n\n(Sent to you as the host.)`,
      });
    }
  } catch {
    // Booking is already cancelled; support copy is optional if threads fail.
  }

  return NextResponse.json({
    data: { booking: updated, messageId: message.id },
  });
}
