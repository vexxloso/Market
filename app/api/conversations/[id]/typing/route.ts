import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { emitTypingToConversationPeers } from "@/lib/realtime";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { id: conversationId } = await params;
  const body = (await request.json().catch(() => ({}))) as { typing?: unknown };
  const typing = body.typing === true;

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

  void emitTypingToConversationPeers(conversationId, session.id, typing);
  return NextResponse.json({ ok: true });
}
