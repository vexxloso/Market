import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getVerifiedSessionUser } from "@/lib/auth";
import { sendPlatformMessageToUser } from "@/lib/admin-messaging";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getVerifiedSessionUser();
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const { id: targetUserId } = await params;
  const body = (await request.json()) as { body?: string };
  const text = typeof body.body === "string" ? body.body.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "Message body is required." }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  try {
    const msg = await sendPlatformMessageToUser({
      adminUserId: session.id,
      targetUserId,
      body: text,
    });
    return NextResponse.json({
      data: {
        id: msg.id,
        createdAt: msg.createdAt.toISOString(),
      },
    });
  } catch (e) {
    if ((e as Error).message === "NO_ADMIN_USER") {
      return NextResponse.json(
        { error: "No admin user available to attach support threads." },
        { status: 500 },
      );
    }
    throw e;
  }
}
