import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { sendPlatformMessageToUser } from "@/lib/admin-messaging";
import { hashPassword } from "@/lib/password";
import { getAppOrigin } from "@/lib/app-origin";

const DEFAULT_ADMIN_RESET_PASSWORD = "password123";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getVerifiedSessionUser();
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.id) {
    return NextResponse.json({ error: "Cannot reset your own password here." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (target.role === UserRole.ADMIN) {
    return NextResponse.json(
      { error: "Reset another admin’s password only from the database or their own flow." },
      { status: 400 },
    );
  }

  const password = DEFAULT_ADMIN_RESET_PASSWORD;
  const passwordHash = hashPassword(password);
  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });

  const origin = getAppOrigin(request);
  const notice =
    `[Stayly — password reset by platform admin]\n\n` +
    `Your sign-in password was set to the temporary default below. Please log in and change it as soon as you can.\n\n` +
    `Email: ${target.email}\n` +
    `Temporary password: ${password}\n\n` +
    `Sign in: ${origin}/?auth=login`;

  try {
    await sendPlatformMessageToUser({
      adminUserId: session.id,
      targetUserId: id,
      body: notice,
    });
  } catch (e) {
    if ((e as Error).message === "NO_ADMIN_USER") {
      return NextResponse.json(
        { error: "Password updated but support message failed (no admin for threads)." },
        { status: 500 },
      );
    }
    throw e;
  }

  return NextResponse.json({
    data: { ok: true, message: "Password reset and user notified in support chat." },
  });
}
