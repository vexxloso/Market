import { Resend } from "resend";
import { getAppPublicBaseUrl } from "@/lib/app-origin";

const RESET_TTL_HOURS = 2;

export function passwordResetExpiryDate(): Date {
  return new Date(Date.now() + RESET_TTL_HOURS * 60 * 60 * 1000);
}

export async function sendPasswordResetEmail(opts: {
  request: Request;
  to: string;
  name: string | null;
  token: string;
}): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    "";

  const base = getAppPublicBaseUrl(opts.request).replace(/\/$/, "");
  const resetUrl = `${base}/reset-password?token=${encodeURIComponent(opts.token)}`;

  const displayName = opts.name?.trim() || "there";
  const subject = "Reset your password — Noire Haven";
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #171717;">
  <p>Hi ${escapeHtml(displayName)},</p>
  <p>We received a request to reset your password.</p>
  <p><a href="${resetUrl}" style="color: #2563eb;">Reset password</a></p>
  <p style="font-size: 14px; color: #525252;">This link expires in ${RESET_TTL_HOURS} hours. If you didn’t request this, you can ignore this message.</p>
</body>
</html>`.trim();

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[email] Password reset (dev only):", { resetUrl });
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

