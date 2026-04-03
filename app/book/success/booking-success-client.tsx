"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function BookingSuccessClient() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const sessionId = searchParams.get("session_id");
  const [state, setState] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("Confirming your payment...");

  useEffect(() => {
    async function confirm() {
      if (!bookingId || !sessionId) {
        setMessage("Missing payment confirmation details.");
        setState("failed");
        return;
      }

      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, sessionId }),
      });
      const data = (await res.json()) as { paid?: boolean; error?: string };

      if (!res.ok || !data.paid) {
        setMessage(data.error ?? "Payment not confirmed yet.");
        setState("failed");
        return;
      }
      setMessage("Payment confirmed. Your booking is now confirmed.");
      setState("success");
    }
    void confirm();
  }, [bookingId, sessionId]);

  return (
    <main className="container py-10">
      <div className="mx-auto max-w-xl rounded-2xl border border-[var(--border)] bg-white p-6">
        <h1 className="text-2xl font-semibold">Checkout status</h1>
        <p className="muted mt-2 text-sm">{message}</p>
        <div className="mt-5 flex gap-2">
          {state === "success" ? (
            <Link className="brand-btn rounded-xl px-4 py-2 text-sm text-white" href="/host">
              Go to host dashboard
            </Link>
          ) : (
            <Link className="rounded-xl border px-4 py-2 text-sm" href="/">
              Back to homepage
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
