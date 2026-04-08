import type { StripeConnectStatus, UserRole } from "@prisma/client";

export type HostStripePayoutFields = {
  stripeAccountId: string | null;
  stripeConnectStatus: StripeConnectStatus;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
};

export function isHostStripePayoutReady(host: HostStripePayoutFields): boolean {
  return (
    host.stripeConnectStatus === "CONNECTED" &&
    host.stripeChargesEnabled &&
    host.stripePayoutsEnabled &&
    Boolean(host.stripeAccountId)
  );
}

/** Platform admin can publish listings without Connect (moderation / demo). Hosts cannot until verified. */
export function hostCanPublishListings(role: UserRole, host: HostStripePayoutFields): boolean {
  if (role === "ADMIN") return true;
  return isHostStripePayoutReady(host);
}

export const STRIPE_CONNECT_REQUIRED_MESSAGE =
  "Connect and verify Stripe payouts before publishing. You can still save your listing as a draft.";

export const STRIPE_CONNECT_REQUIRED_CODE = "STRIPE_CONNECT_REQUIRED" as const;
