import { NextResponse } from "next/server";
import { BookingStatus, PayoutStatus, UserRole } from "@prisma/client";
import { getVerifiedSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processEligiblePayouts } from "@/lib/payouts";

function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const got = request.headers.get("x-cron-secret")?.trim();
  return Boolean(got && got === secret);
}

export async function POST(request: Request) {
  const session = await getVerifiedSessionUser();
  const isAdmin = Boolean(session && session.role === UserRole.ADMIN);
  if (!isAdmin && !cronAuthorized(request)) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const now = new Date();

  // Mark stays as completed when they naturally expire (no review submitted).
  const completed = await prisma.booking.updateMany({
    where: {
      status: BookingStatus.PAID,
      checkOut: { lte: now },
    },
    data: {
      status: BookingStatus.COMPLETED,
      payoutStatus: PayoutStatus.ELIGIBLE,
      payoutEligibleAt: now,
    },
  });

  const results = await processEligiblePayouts(25);

  return NextResponse.json({
    data: {
      completedBookingsUpdated: completed.count,
      payoutsProcessed: results.length,
      results,
    },
  });
}

