import type { Server as SocketIOServer } from "socket.io";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type GlobalWithIo = typeof globalThis & {
  __STAYLY_IO__?: SocketIOServer;
};

export function getIo(): SocketIOServer | null {
  return (globalThis as GlobalWithIo).__STAYLY_IO__ ?? null;
}

export function setIo(io: SocketIOServer) {
  (globalThis as GlobalWithIo).__STAYLY_IO__ = io;
}

export function emitToUsers(
  userIds: string[],
  event: string,
  payload: unknown,
) {
  const io = getIo();
  if (!io) return;
  for (const uid of userIds) {
    if (uid) io.to(`user:${uid}`).emit(event, payload);
  }
}

/** Guest + host + all admins (moderation / admin inbox). */
export async function emitToBookingThread(
  guestId: string,
  hostId: string,
  event: string,
  payload: unknown,
) {
  let adminIds: string[] = [];
  try {
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });
    adminIds = admins.map((a) => a.id);
  } catch {
    // DB down or flaky — still notify guest + host so chat updates when possible.
  }
  const ids = [...new Set([guestId, hostId, ...adminIds])];
  emitToUsers(ids, event, payload);
}

/** Typing indicator: notify everyone in the thread except the person typing (no admin fan-out). */
export async function emitTypingToConversationPeers(
  conversationId: string,
  fromUserId: string,
  typing: boolean,
) {
  let conv: { guestId: string; hostId: string } | null = null;
  try {
    conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { guestId: true, hostId: true },
    });
  } catch {
    return;
  }
  if (!conv) return;
  const targets = [conv.guestId, conv.hostId].filter((id) => id !== fromUserId);
  emitToUsers(targets, "conversation:typing", {
    conversationId,
    userId: fromUserId,
    typing,
  });
}
