import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, PASSWORD_MIN_LENGTH } from "@/lib/password";
import { generateEmailVerificationOtp } from "@/lib/email-verification-otp";
import {
  sendSignupVerificationEmail,
  verificationExpiryDate,
} from "@/lib/send-verification-email";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    name?: string;
    password?: string;
  };
  if (!body.email?.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const email = body.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.emailVerifiedAt) {
    return NextResponse.json({ error: "Email already exists." }, { status: 409 });
  }

  const passwordHash = hashPassword(password);
  const emailVerificationToken = randomBytes(32).toString("hex");
  const emailVerificationExpires = verificationExpiryDate();
  const emailVerificationCode = generateEmailVerificationOtp();
  const name = body.name?.trim() || null;

  if (existing && !existing.emailVerifiedAt) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name,
        passwordHash,
        emailVerificationToken,
        emailVerificationExpires,
        emailVerificationCode,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: UserRole.GUEST,
        emailVerificationToken,
        emailVerificationExpires,
        emailVerificationCode,
      },
    });
  }

  const emailResult = await sendSignupVerificationEmail({
    request,
    to: email,
    name,
    token: emailVerificationToken,
    otp: emailVerificationCode,
  });

  return NextResponse.json({
    message:
      "Registration started. Confirm using the code or link we emailed you, then sign in with your password.",
    verificationEmailSent: emailResult.sent,
    verificationEmailSkipped: emailResult.skipped === true,
    resumedUnverifiedSignup: Boolean(existing && !existing.emailVerifiedAt),
  });
}
