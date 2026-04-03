import { prisma } from "@/lib/prisma";
import { ensureAdminSupportConversation } from "@/lib/conversation-utils";
import { emitToBookingThread } from "@/lib/realtime";

export async function sendPlatformMessageToUser(params: {
  adminUserId: string;
  targetUserId: string;
  body: string;
}) {
  const conv = await ensureAdminSupportConversation(params.targetUserId);
  if (!conv) {
    throw new Error("NO_ADMIN_USER");
  }

  const text = params.body.trim();
  if (!text) throw new Error("EMPTY_BODY");

  const created = await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId: params.adminUserId,
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
    where: { id: conv.id },
    data: { updatedAt: new Date() },
  });

  const dto = {
    id: created.id,
    senderId: created.senderId,
    body: created.body,
    createdAt: created.createdAt.toISOString(),
    readAt: created.readAt?.toISOString() ?? null,
  };

  void emitToBookingThread(conv.guestId, conv.hostId, "message:new", {
    conversationId: conv.id,
    message: dto,
  });
  void emitToBookingThread(conv.guestId, conv.hostId, "unread:refresh", {
    conversationId: conv.id,
  });

  return created;
}
