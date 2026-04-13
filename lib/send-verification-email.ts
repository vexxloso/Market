import { Resend } from "resend";
import { getAppPublicBaseUrl } from "@/lib/app-origin";

const VERIFY_TTL_HOURS = 48;

export function verificationExpiryDate(): Date {
  return new Date(Date.now() + VERIFY_TTL_HOURS * 60 * 60 * 1000);
}

export async function sendSignupVerificationEmail(opts: {
  request: Request;
  to: string;
  name: string | null;
  token: string;
  otp: string;
}): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    "";

  const base = getAppPublicBaseUrl(opts.request).replace(/\/$/, "");
  const verifyUrl = `${base}/api/auth/verify-email?token=${encodeURIComponent(opts.token)}`;
  const confirmPageUrl = `${base}/confirm-email?email=${encodeURIComponent(opts.to)}`;

  const displayName = opts.name?.trim() || "there";
  const otpHtml = escapeHtml(opts.otp);
  const subject = "Confirm your email — Noire Haven";
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #171717;">
  <p>Hi ${escapeHtml(displayName)},</p>
  <p>Thanks for registering. Please confirm this email address to activate your account. Until you confirm, you cannot sign in.</p>
  <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.25em; font-family: ui-monospace, monospace;">${otpHtml}</p>
  <p style="font-size: 14px; color: #525252;">Enter this code on the confirmation page, or tap one of the links below.</p>
  <p><a href="${confirmPageUrl}" style="color: #2563eb;">Open confirmation page</a> · <a href="${verifyUrl}" style="color: #2563eb;">Confirm in one click</a></p>
  <p style="font-size: 14px; color: #525252;">After confirming, sign in with the <strong>password you chose</strong> when you registered. We never send your password by email.</p>
  <p style="font-size: 14px; color: #525252;">The code and link expire in ${VERIFY_TTL_HOURS} hours. If you didn’t create an account, you can ignore this message.</p>
</body>
</html>`.trim();

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[email] RESEND_API_KEY or RESEND_FROM/EMAIL_FROM missing; dev-only confirmation:",
        { verifyUrl, confirmPageUrl, otp: opts.otp },
      );
    }
    return { sent: false, skipped: true };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: opts.to,
    subject,
    html,
  });

  if (error) {
    console.error("[email] Resend:", error);
    return { sent: false, error: error.message };
  }

  return { sent: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
