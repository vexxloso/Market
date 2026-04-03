import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPrimaryAdminUserId } from "@/lib/admin-user";
import { emitToBookingThread } from "@/lib/realtime";
import { ensureBookingConversation } from "@/lib/conversation-utils";

function guestLabel(u: Pick<User, "email" | "name">) {
  return (u.name?.trim() || u.email) ?? "Guest";
}

export async function postAdminNoticeForBooking(
  bookingId: string,
  body: string,
) {
  const adminId = await getPrimaryAdminUserId();
  if (!adminId) return null;

  await ensureBookingConversation(bookingId);
  const conv = await prisma.conversation.findUnique({
    where: { bookingId },
    select: { id: true, guestId: true, hostId: true },
  });
  if (!conv) return null;

  const msg = await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId: adminId,
      body,
    },
  });

  await prisma.conversation.update({
    where: { id: conv.id },
    data: { updatedAt: new Date() },
  });

  const payload = {
    conversationId: conv.id,
    message: {
      id: msg.id,
      senderId: msg.senderId,
      body: msg.body,
      createdAt: msg.createdAt.toISOString(),
      readAt: null as string | null,
    },
  };

  void emitToBookingThread(conv.guestId, conv.hostId, "message:new", payload);
  void emitToBookingThread(conv.guestId, conv.hostId, "unread:refresh", {
    conversationId: conv.id,
  });

  return msg;
}

export async function notifyBookingCreated(bookingId: string) {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: { include: { host: { select: { name: true, email: true } } } },
      user: { select: { name: true, email: true } },
    },
  });
  if (!b) return;

  const checkIn = b.checkIn.toISOString().slice(0, 10);
  const checkOut = b.checkOut.toISOString().slice(0, 10);
  const body = [
    "📌 New booking request (Admin)",
    `Listing: ${b.listing.title}`,
    `Guest: ${guestLabel(b.user)} (${b.user.email})`,
    `Guests: ${b.guests} · $${b.totalPrice}`,
    `Dates: ${checkIn} → ${checkOut}`,
    `Host: ${b.listing.host.name?.trim() || b.listing.host.email}`,
  ].join("\n");

  await postAdminNoticeForBooking(bookingId, body);
}

export async function notifyBookingAccepted(bookingId: string) {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: true,
      user: { select: { name: true, email: true } },
    },
  });
  if (!b) return;

  const body = [
    "✅ Booking accepted (Admin)",
    `${b.listing.title}`,
    `Guest: ${guestLabel(b.user)} — you can complete payment when ready.`,
    `Dates: ${b.checkIn.toISOString().slice(0, 10)} → ${b.checkOut.toISOString().slice(0, 10)} · $${b.totalPrice}`,
  ].join("\n");

  await postAdminNoticeForBooking(bookingId, body);
}

export async function notifyBookingPaid(bookingId: string) {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: true,
      user: { select: { name: true, email: true } },
    },
  });
  if (!b) return;

  const body = [
    "💳 Payment received (Admin)",
    `${b.listing.title}`,
    `Guest: ${guestLabel(b.user)}`,
    `Total: $${b.totalPrice}`,
    `Stay: ${b.checkIn.toISOString().slice(0, 10)} → ${b.checkOut.toISOString().slice(0, 10)}`,
  ].join("\n");

  await postAdminNoticeForBooking(bookingId, body);
}

export async function notifyBookingCancelled(bookingId: string) {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: true,
      user: { select: { name: true, email: true } },
    },
  });
  if (!b) return;

  const body = [
    "⛔ Booking canceled (Admin)",
    `${b.listing.title}`,
    `Guest: ${guestLabel(b.user)}`,
    `This reservation is no longer active.`,
  ].join("\n");

  await postAdminNoticeForBooking(bookingId, body);
}

export async function notifyBookingCompleted(bookingId: string) {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: true,
      user: { select: { name: true, email: true } },
    },
  });
  if (!b) return;

  const body = [
    "🎉 Stay completed (Admin)",
    `${b.listing.title}`,
    `Thank you, ${guestLabel(b.user)} — we hope you enjoyed your stay.`,
    `Hosts: thank you for hosting.`,
  ].join("\n");

  await postAdminNoticeForBooking(bookingId, body);
}
