import { NextResponse } from "next/server";
import { StripeConnectStatus, UserRole } from "@prisma/client";
import { getVerifiedSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncStripeConnectUserFromStripe } from "@/lib/sync-stripe-connect-user";

export async function GET() {
  const session = await getVerifiedSessionUser();
  if (!session || (session.role !== UserRole.HOST && session.role !== UserRole.ADMIN)) {
    return NextResponse.json({ error: "Host login required." }, { status: 403 });
  }

  const me = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, stripeAccountId: true },
  });

  if (!me) return NextResponse.json({ error: "User not found." }, { status: 404 });

  if (!me.stripeAccountId) {
    return NextResponse.json({
      data: {
        stripeConnectStatus: StripeConnectStatus.NOT_CONNECTED,
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
        stripeDetailsSubmitted: false,
        stripeVerifiedAt: null,
      },
    });
  }

  const synced = await syncStripeConnectUserFromStripe(me.id);
  if (!synced) {
    return NextResponse.json({ error: "Sync failed." }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      ...synced,
      stripeVerifiedAt: synced.stripeVerifiedAt?.toISOString() ?? null,
    },
  });
}
