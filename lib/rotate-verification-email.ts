import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { generateEmailVerificationOtp } from "@/lib/email-verification-otp";
import {
  sendSignupVerificationEmail,
  verificationExpiryDate,
} from "@/lib/send-verification-email";

/** New token + expiry, then send the confirmation email (user must still be unverified). */
export async function rotateVerificationTokenAndSend(
  userId: string,
  request: Request,
): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, emailVerifiedAt: true },
  });

  if (!user || user.emailVerifiedAt) {
    return { sent: false, error: "invalid_state" };
  }

  const token = randomBytes(32).toString("hex");
  const otp = generateEmailVerificationOtp();
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken: token,
      emailVerificationExpires: verificationExpiryDate(),
      emailVerificationCode: otp,
    },
  });

  return sendSignupVerificationEmail({
    request,
    to: user.email,
    name: user.name,
    token,
    otp,
  });
}
