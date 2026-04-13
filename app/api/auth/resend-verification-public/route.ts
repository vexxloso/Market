import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowPublicVerificationResend } from "@/lib/resend-verification-rate-limit";
import { rotateVerificationTokenAndSend } from "@/lib/rotate-verification-email";

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
  const email =
    typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!allowPublicVerificationResend(email)) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a few minutes." },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerifiedAt: true },
  });

  if (!user || user.emailVerifiedAt) {
    return NextResponse.json({
      ok: true,
      message:
        "If an unconfirmed account exists for this email, we sent a new link and 6-digit code.",
    });
  }

  const result = await rotateVerificationTokenAndSend(user.id, request);

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
    message: "Check your inbox for a new confirmation link and 6-digit code.",
  });
}
