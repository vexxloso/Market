import { StripeConnectStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { retrieveStripeAccount } from "@/lib/stripe";

export type SyncedStripeConnectFields = {
  stripeConnectStatus: StripeConnectStatus;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
  stripeDetailsSubmitted: boolean;
  stripeVerifiedAt: Date | null;
};

/**
 * Pulls Connect account state from Stripe and updates the user row.
 * Call after onboarding return or when the UI may be stale (no Connect webhooks yet).
 */
export async function syncStripeConnectUserFromStripe(
  userId: string,
): Promise<SyncedStripeConnectFields | null> {
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, stripeAccountId: true },
  });
  if (!me?.stripeAccountId) return null;

  const acct = await retrieveStripeAccount(me.stripeAccountId);
  const connected = acct.charges_enabled && acct.payouts_enabled;
  const status = connected ? StripeConnectStatus.CONNECTED : StripeConnectStatus.PENDING;
  const verifiedAt = connected ? new Date() : null;

  await prisma.user.update({
    where: { id: me.id },
    data: {
      stripeConnectStatus: status,
      stripeChargesEnabled: acct.charges_enabled,
      stripePayoutsEnabled: acct.payouts_enabled,
      stripeDetailsSubmitted: acct.details_submitted,
      stripeVerifiedAt: verifiedAt,
    },
  });

  return {
    stripeConnectStatus: status,
    stripeChargesEnabled: acct.charges_enabled,
    stripePayoutsEnabled: acct.payouts_enabled,
    stripeDetailsSubmitted: acct.details_submitted,
    stripeVerifiedAt: verifiedAt,
  };
}
