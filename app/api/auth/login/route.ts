import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionUser } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  if (!body.email?.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
      bannedAt: true,
      emailVerifiedAt: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (!user.passwordHash) {
    return NextResponse.json(
      {
        error:
          "This account has no password yet. Sign up again with the same email or run a database migration to set a password.",
      },
      { status: 403 },
    );
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (!user.emailVerifiedAt) {
    return NextResponse.json(
      {
        error:
          "Please confirm your email before signing in. Use the link or 6-digit code we sent, or “Resend confirmation”.",
        code: "EMAIL_NOT_VERIFIED",
      },
      { status: 403 },
    );
  }

  if (user.bannedAt) {
    return NextResponse.json(
      {
        error:
          "This account has been suspended. Contact support if you think this is a mistake.",
      },
      { status: 403 },
    );
  }

  await setSessionUser({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  return NextResponse.json({
    message: "Login successful.",
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}
