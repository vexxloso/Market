import { NextResponse } from "next/server";
import { getVerifiedSessionUser } from "@/lib/auth";
import { getAppPublicBaseUrl } from "@/lib/app-origin";
import { getStripeConnectOnboardingUrl } from "@/lib/stripe-connect-onboarding";

/**
 * Full-page navigation to Stripe Connect onboarding (skips the host dashboard).
 * Use this for “Connect payouts” links; POST /api/stripe/connect/start remains for fetch/XHR flows.
 */
export async function GET(request: Request) {
  const session = await getVerifiedSessionUser();
  const appBase = getAppPublicBaseUrl(request);
  if (!session) {
    return NextResponse.redirect(`${appBase}/?auth=login`);
  }

  const result = await getStripeConnectOnboardingUrl(request, session.id, session.role);
  if (!result.ok) {
    if (result.status === 403 || result.status === 404) {
      return NextResponse.redirect(`${appBase}/?auth=login`);
    }
    return NextResponse.redirect(`${appBase}/host?stripe_error=1`);
  }

  return NextResponse.redirect(result.url);
}
