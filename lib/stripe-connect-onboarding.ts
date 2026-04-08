import { StripeConnectStatus, UserRole } from "@prisma/client";
import { getAppPublicBaseUrl } from "@/lib/app-origin";
import { prisma } from "@/lib/prisma";
import { createStripeAccountLink, createStripeConnectAccount } from "@/lib/stripe";

export type StripeConnectOnboardingResult =
  | { ok: true; url: string }
  | { ok: false; status: number; error: string };

/**
 * Creates or reuses a Connect account and returns a Stripe Account Link URL for onboarding.
 */
export async function getStripeConnectOnboardingUrl(
  request: Request,
  userId: string,
  role: UserRole,
): Promise<StripeConnectOnboardingResult> {
  if (role !== UserRole.HOST && role !== UserRole.ADMIN) {
    return { ok: false, status: 403, error: "Host login required." };
  }

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, stripeAccountId: true },
  });
  if (!me) {
    return { ok: false, status: 404, error: "User not found." };
  }

  const appUrl = getAppPublicBaseUrl(request);
  const refreshUrl = `${appUrl}/host?stripe=refresh`;
  const returnUrl = `${appUrl}/host?stripe=return`;

  try {
    let accountId = me.stripeAccountId;
    if (!accountId) {
      const created = await createStripeConnectAccount({ email: me.email });
      accountId = created.id;
      await prisma.user.update({
        where: { id: me.id },
        data: {
          stripeAccountId: accountId,
          stripeConnectStatus: StripeConnectStatus.PENDING,
        },
      });
    }

    const link = await createStripeAccountLink({
      accountId,
      refreshUrl,
      returnUrl,
    });
    return { ok: true, url: link.url };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not start Stripe Connect.";
    return { ok: false, status: 500, error: message };
  }
}
