import { prisma } from "@/lib/prisma";
import { PayoutStatus } from "@prisma/client";
import { createStripeTransfer } from "@/lib/stripe";

export function computeSplit(totalCents: number) {
  const platformFeeAmount = Math.round(totalCents * 0.1);
  const hostPayoutAmount = totalCents - platformFeeAmount;
  return { platformFeeAmount, hostPayoutAmount };
}

export async function markBookingPayoutEligible(bookingId: string) {
  return await prisma.booking.update({
    where: { id: bookingId },
    data: {
      payoutStatus: PayoutStatus.ELIGIBLE,
      payoutEligibleAt: new Date(),
    },
  });
}

export async function processBookingPayout(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        include: {
          host: {
            select: {
              id: true,
              stripeAccountId: true,
              stripeChargesEnabled: true,
              stripePayoutsEnabled: true,
              stripeConnectStatus: true,
            },
          },
        },
      },
      payouts: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!booking) return { ok: false as const, reason: "BOOKING_NOT_FOUND" };
  if (booking.payoutStatus !== PayoutStatus.ELIGIBLE) {
    return { ok: false as const, reason: "NOT_ELIGIBLE" };
  }

  const last = booking.payouts[0] ?? null;
  if (last?.status === PayoutStatus.TRANSFERRED || last?.status === PayoutStatus.PAID_OUT) {
    return { ok: true as const, transferId: last.stripeTransferId ?? null, skipped: true as const };
  }

  const host = booking.listing.host;
  const canPayHost =
    host.stripeConnectStatus === "CONNECTED" &&
    host.stripeChargesEnabled &&
    host.stripePayoutsEnabled &&
    Boolean(host.stripeAccountId);

  if (!canPayHost) {
    return { ok: false as const, reason: "HOST_NOT_CONNECTED" };
  }

  const amountCents = booking.hostPayoutAmount;
  if (!amountCents || amountCents <= 0) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { payoutStatus: PayoutStatus.FAILED },
    });
    return { ok: false as const, reason: "MISSING_AMOUNT" };
  }

  try {
    const transfer = await createStripeTransfer({
      amountCents,
      destinationAccountId: host.stripeAccountId!,
      transferGroup: `booking:${booking.id}`,
      metadata: { bookingId: booking.id, hostId: host.id },
    });

    await prisma.$transaction(async (tx) => {
      await tx.payout.create({
        data: {
          bookingId: booking.id,
          stripeTransferId: transfer.id,
          amount: amountCents,
          status: PayoutStatus.TRANSFERRED,
        },
      });
      await tx.booking.update({
        where: { id: booking.id },
        data: { payoutStatus: PayoutStatus.TRANSFERRED },
      });
    });

    return { ok: true as const, transferId: transfer.id };
  } catch (e) {
    const msg = (e as Error).message || "Stripe transfer failed";
    await prisma.$transaction(async (tx) => {
      await tx.payout.create({
        data: {
          bookingId: booking.id,
          amount: amountCents,
          status: PayoutStatus.FAILED,
          error: msg.slice(0, 2000),
        },
      });
      await tx.booking.update({
        where: { id: booking.id },
        data: { payoutStatus: PayoutStatus.FAILED },
      });
    });
    return { ok: false as const, reason: "TRANSFER_FAILED", error: msg };
  }
}

export async function processEligiblePayouts(limit = 25) {
  const eligible = await prisma.booking.findMany({
    where: { payoutStatus: PayoutStatus.ELIGIBLE },
    orderBy: { payoutEligibleAt: "asc" },
    take: limit,
    select: { id: true },
  });

  const results = [];
  for (const b of eligible) {
    // Sequential to avoid spiky Stripe + DB usage.
    // eslint-disable-next-line no-await-in-loop
    results.push(await processBookingPayout(b.id));
  }
  return results;
}

