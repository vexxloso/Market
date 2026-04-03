import { Suspense } from "react";
import BookingSuccessClient from "./booking-success-client";

function SuccessFallback() {
  return (
    <main className="container py-10">
      <div className="mx-auto max-w-xl rounded-2xl border border-[var(--border)] bg-white p-6">
        <h1 className="text-2xl font-semibold">Checkout status</h1>
        <p className="muted mt-2 text-sm">Loading…</p>
      </div>
    </main>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <BookingSuccessClient />
    </Suspense>
  );
}
