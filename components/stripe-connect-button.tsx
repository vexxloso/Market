"use client";

import Link from "next/link";
import { withBasePath } from "@/lib/app-origin";

export function StripeConnectButton({
  connected,
}: {
  connected: boolean;
}) {
  if (connected) {
    return (
      <button
        type="button"
        disabled
        className="brand-btn rounded-xl px-4 py-2 text-sm font-semibold text-white opacity-60"
      >
        Stripe connected
      </button>
    );
  }

  return (
    <Link
      href={withBasePath("/host/connect")}
      className="brand-btn inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-white"
    >
      Connect Stripe
    </Link>
  );
}

