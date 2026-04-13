import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { hashPassword, PASSWORD_MIN_LENGTH, verifyPassword } from "@/lib/password";

export async function POST(request: Request) {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rec =
    body && typeof body === "object"
      ? (body as {
          currentPassword?: unknown;
          newPassword?: unknown;
        })
      : {};

  const currentPassword =
    typeof rec.currentPassword === "string" ? rec.currentPassword : "";
  const newPassword = typeof rec.newPassword === "string" ? rec.newPassword : "";

  if (!currentPassword) {
    return NextResponse.json({ error: "Current password is required." }, { status: 400 });
  }
  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return NextResponse.json(
      { error: `New password must be at least ${PASSWORD_MIN_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      passwordHash: true,
      bannedAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (user.bannedAt) {
    return NextResponse.json({ error: "Account is suspended." }, { status: 403 });
  }
  if (!user.passwordHash) {
    return NextResponse.json(
      { error: "This account has no password yet." },
      { status: 400 },
    );
  }
  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword) },
  });

  return NextResponse.json({ ok: true });
}

