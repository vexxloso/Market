import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { emitToBookingThread } from "@/lib/realtime";

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; messageId: string }> },
) {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { id: conversationId, messageId } = await params;

  const message = await prisma.message.findFirst({
    where: { id: messageId, conversationId },
    include: {
      conversation: { select: { guestId: true, hostId: true } },
    },
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  const conv = message.conversation;
  const allowed =
    message.senderId === session.id || session.role === UserRole.ADMIN;

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
  });

  void emitToBookingThread(conv.guestId, conv.hostId, "message:deleted", {
    conversationId,
    messageId,
  });
  void emitToBookingThread(conv.guestId, conv.hostId, "unread:refresh", {
    conversationId,
  });

  return NextResponse.json({ ok: true });
}
