import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowForgotPassword } from "@/lib/forgot-password-rate-limit";
import {
  passwordResetExpiryDate,
  sendPasswordResetEmail,
} from "@/lib/send-password-reset-email";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const emailRaw =
    body && typeof body === "object" && "email" in body
      ? (body as { email?: unknown }).email
      : undefined;
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!allowForgotPassword(email)) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a few minutes." },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, bannedAt: true },
  });

  if (!user || user.bannedAt) {
    return NextResponse.json(
      { error: "No account found for this email address." },
      { status: 404 },
    );
  }

  const token = randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetExpires: passwordResetExpiryDate(),
    },
  });

  const result = await sendPasswordResetEmail({
    request,
    to: user.email,
    name: user.name,
    token,
  });

  if (!result.sent) {
    return NextResponse.json(
      {
        error: result.skipped
          ? "Email is not configured (RESEND_API_KEY / RESEND_FROM)."
          : result.error ?? "Could not send email.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Reset link sent. Check your inbox and spam folder.",
  });
}

