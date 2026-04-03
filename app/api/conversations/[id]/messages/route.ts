import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { emitToBookingThread } from "@/lib/realtime";

type SendMessagePayload = { body?: string };

async function getConversationForAccess(conversationId: string) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, guestId: true, hostId: true },
  });
}

function canAccess(
  session: { id: string; role: UserRole },
  conv: { guestId: string; hostId: string },
) {
  if (session.role === UserRole.ADMIN) return true;
  return conv.guestId === session.id || conv.hostId === session.id;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { id: conversationId } = await params;
  const conversation = await getConversationForAccess(conversationId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  if (!canAccess(session, conversation)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      senderId: true,
      body: true,
      createdAt: true,
      readAt: true,
    },
  });

  return NextResponse.json({
    data: messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { id: conversationId } = await params;
  const body = (await request.json()) as SendMessagePayload;
  const text = typeof body.body === "string" ? body.body.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "Message body is required." }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  const conversation = await getConversationForAccess(conversationId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  if (!canAccess(session, conversation)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const created = await prisma.message.create({
    data: {
      conversationId,
      senderId: session.id,
      body: text,
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
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  const dto = {
    id: created.id,
    senderId: created.senderId,
    body: created.body,
    createdAt: created.createdAt.toISOString(),
    readAt: created.readAt?.toISOString() ?? null,
  };

  void emitToBookingThread(conversation.guestId, conversation.hostId, "message:new", {
    conversationId,
    message: dto,
  });
  void emitToBookingThread(conversation.guestId, conversation.hostId, "unread:refresh", {
    conversationId,
  });

  return NextResponse.json({ data: dto });
}
