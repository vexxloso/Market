import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionUser } from "@/lib/auth";
import { normalizeOtpInput, otpEqualsStored } from "@/lib/email-verification-otp";
import { allowVerifyEmailCodeAttempt } from "@/lib/verify-email-code-rate-limit";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rec =
    body && typeof body === "object"
      ? (body as { email?: unknown; code?: unknown })
      : {};
  const email =
    typeof rec.email === "string" ? rec.email.trim().toLowerCase() : "";
  const codeNorm =
    typeof rec.code === "string" ? normalizeOtpInput(rec.code) : null;

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (!codeNorm) {
    return NextResponse.json(
      { error: "Enter the 6-digit code from your email." },
      { status: 400 },
    );
  }

  if (!allowVerifyEmailCodeAttempt(email)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      bannedAt: true,
      emailVerifiedAt: true,
      emailVerificationCode: true,
      emailVerificationExpires: true,
    },
  });

  if (!user || user.emailVerifiedAt) {
    return NextResponse.json(
      { error: "Invalid code or this address is already confirmed." },
      { status: 400 },
    );
  }

  if (user.bannedAt) {
    return NextResponse.json(
      { error: "This account has been suspended. Contact support." },
      { status: 403 },
    );
  }

  if (!user.emailVerificationExpires || user.emailVerificationExpires <= new Date()) {
    return NextResponse.json(
      { error: "This code has expired. Resend a new confirmation email." },
      { status: 400 },
    );
  }

  if (!otpEqualsStored(codeNorm, user.emailVerificationCode)) {
    return NextResponse.json({ error: "Invalid code." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpires: null,
      emailVerificationCode: null,
    },
  });

  await setSessionUser({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  return NextResponse.json({ ok: true });
}

