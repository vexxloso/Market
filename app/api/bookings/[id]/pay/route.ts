import { NextResponse } from "next/server";

/**
 * Disabled: previously allowed marking a booking PAID without Stripe (demo shortcut).
 * Real payments must go through Stripe Checkout: `POST /api/payments/checkout`.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Payment must be processed via Stripe Checkout." },
    { status: 410 },
  );
}
