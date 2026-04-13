import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, PASSWORD_MIN_LENGTH } from "@/lib/password";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rec =
    body && typeof body === "object"
      ? (body as { token?: unknown; newPassword?: unknown })
      : {};

  const token = typeof rec.token === "string" ? rec.token.trim() : "";
  const newPassword = typeof rec.newPassword === "string" ? rec.newPassword : "";

  if (!token) {
    return NextResponse.json({ error: "Token is required." }, { status: 400 });
  }
  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const userAny = await prisma.user.findFirst({
    where: { passwordResetToken: token },
    select: {
      id: true,
      bannedAt: true,
      emailVerifiedAt: true,
      passwordResetExpires: true,
    },
  });

  if (!userAny) {
    return NextResponse.json(
      {
        error:
          "Invalid reset link. If you requested multiple emails, use the most recent link or request a new one.",
      },
      { status: 400 },
    );
  }
  if (userAny.bannedAt) {
    return NextResponse.json({ error: "Account is suspended." }, { status: 403 });
  }
  if (!userAny.passwordResetExpires || userAny.passwordResetExpires <= new Date()) {
    return NextResponse.json(
      {
        error:
          "This reset link has expired. Request a new password reset email and use the newest link.",
      },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: userAny.id },
    data: {
      passwordHash: hashPassword(newPassword),
      passwordResetToken: null,
      passwordResetExpires: null,
      // If they can reset via email, we can treat the email as verified.
      emailVerifiedAt: userAny.emailVerifiedAt ?? new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}

