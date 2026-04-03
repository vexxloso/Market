import { NextResponse } from "next/server";
import {
  BookingStatus,
  ConversationKind,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { ensureAdminSupportConversation } from "@/lib/conversation-utils";

const PLACEHOLDER_LISTING = {
  id: "admin-support",
  title: "Admin support",
  imageUrl:
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=400&q=80",
  location: "Platform",
  country: "Support",
};

export async function GET() {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  if (session.role !== UserRole.ADMIN) {
    await ensureAdminSupportConversation(session.id);
  }

  const relevantStatuses: BookingStatus[] = [
    BookingStatus.PENDING,
    BookingStatus.ACCEPTED,
    BookingStatus.PAID,
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
  ];

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: relevantStatuses },
      ...(session.role === UserRole.ADMIN
        ? {}
        : {
            OR: [
              { userId: session.id },
              { listing: { hostId: session.id } },
            ],
          }),
    },
    include: {
      listing: {
        select: {
          id: true,
          hostId: true,
        },
      },
    },
  });

  const bookingIds = bookings.map((b) => b.id);
  const guestByBookingId = new Map(bookings.map((b) => [b.id, b.userId]));
  const hostByBookingId = new Map(
    bookings.map((b) => [b.id, b.listing.hostId]),
  );

  if (bookingIds.length > 0) {
    const existing = await prisma.conversation.findMany({
      where: {
        kind: ConversationKind.BOOKING,
        bookingId: { in: bookingIds },
      },
      select: { bookingId: true },
    });
    const existingSet = new Set(
      existing.map((c) => c.bookingId).filter(Boolean) as string[],
    );
    const missing = bookings.filter((b) => !existingSet.has(b.id));

    if (missing.length > 0) {
      await prisma.conversation.createMany({
        data: missing.map((b) => ({
          kind: ConversationKind.BOOKING,
          bookingId: b.id,
          listingId: b.listingId,
          guestId: guestByBookingId.get(b.id)!,
          hostId: hostByBookingId.get(b.id)!,
        })),
      });
    }
  }

  const conversations = await prisma.conversation.findMany({
    where:
      session.role === UserRole.ADMIN
        ? {}
        : {
            OR: [{ guestId: session.id }, { hostId: session.id }],
          },
    orderBy: { updatedAt: "desc" },
    include: {
      listing: {
        select: { id: true, title: true, imageUrl: true, location: true, country: true },
      },
      guest: { select: { id: true, name: true, email: true, avatarUrl: true } },
      host: { select: { id: true, name: true, email: true, avatarUrl: true } },
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, senderId: true, body: true, createdAt: true },
      },
    },
  });

  const data = conversations.map((c) => {
    const last = c.messages[0] ?? null;
    const other =
      c.guestId === session.id ? c.host : c.guest;
    return {
      id: c.id,
      kind: c.kind,
      bookingId: c.bookingId,
      listing: c.listing ?? PLACEHOLDER_LISTING,
      other,
      lastMessage: last,
      updatedAt: c.updatedAt,
    };
  });

  return NextResponse.json({ data });
}
