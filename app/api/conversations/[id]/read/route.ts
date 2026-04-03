import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { emitToBookingThread } from "@/lib/realtime";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { id: conversationId } = await params;
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, guestId: true, hostId: true },
  });

  if (!conv) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const allowed =
    session.role === UserRole.ADMIN ||
    conv.guestId === session.id ||
    conv.hostId === session.id;

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const now = new Date();
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: session.id },
      readAt: null,
      deletedAt: null,
    },
    data: { readAt: now },
  });

  void emitToBookingThread(conv.guestId, conv.hostId, "messages:read", {
    conversationId,
  });
  void emitToBookingThread(conv.guestId, conv.hostId, "unread:refresh", {
    conversationId,
  });

  return NextResponse.json({ ok: true });
}
