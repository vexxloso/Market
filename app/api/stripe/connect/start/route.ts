import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getVerifiedSessionUser } from "@/lib/auth";
import { getStripeConnectOnboardingUrl } from "@/lib/stripe-connect-onboarding";

export async function POST(request: Request) {
  const session = await getVerifiedSessionUser();
  if (!session || (session.role !== UserRole.HOST && session.role !== UserRole.ADMIN)) {
    return NextResponse.json({ error: "Host login required." }, { status: 403 });
  }

  const result = await getStripeConnectOnboardingUrl(request, session.id, session.role);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ url: result.url });
}

