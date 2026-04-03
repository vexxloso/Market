import { ConversationKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPrimaryAdminUserId } from "@/lib/admin-user";

export async function ensureBookingConversation(bookingId: string) {
  const existing = await prisma.conversation.findUnique({
    where: { bookingId },
  });
  if (existing) return existing;

  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: { select: { hostId: true } } },
  });
  if (!b) return null;

  return prisma.conversation.create({
    data: {
      kind: ConversationKind.BOOKING,
      bookingId: b.id,
      listingId: b.listingId,
      guestId: b.userId,
      hostId: b.listing.hostId,
    },
  });
}

export async function ensureAdminSupportConversation(userId: string) {
  const existing = await prisma.conversation.findFirst({
    where: {
      kind: ConversationKind.ADMIN_SUPPORT,
      adminThreadForUserId: userId,
    },
  });
  if (existing) return existing;

  const adminId = await getPrimaryAdminUserId();
  if (!adminId) return null;

  return prisma.conversation.create({
    data: {
      kind: ConversationKind.ADMIN_SUPPORT,
      guestId: userId,
      hostId: adminId,
      adminThreadForUserId: userId,
    },
  });
}
