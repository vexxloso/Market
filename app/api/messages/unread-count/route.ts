import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";

export async function GET() {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const convs = await prisma.conversation.findMany({
    where:
      session.role === UserRole.ADMIN
        ? {}
        : {
            OR: [{ guestId: session.id }, { hostId: session.id }],
          },
    select: { id: true },
  });

  const ids = convs.map((c) => c.id);
  if (ids.length === 0) {
    return NextResponse.json({ count: 0 });
  }

  const count = await prisma.message.count({
    where: {
      conversationId: { in: ids },
      senderId: { not: session.id },
      readAt: null,
      deletedAt: null,
    },
  });

  return NextResponse.json({ count });
}
