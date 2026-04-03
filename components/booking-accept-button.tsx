"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookingStatus } from "@prisma/client";

export function BookingAcceptButton({
  bookingId,
  status,
}: {
  bookingId: string;
  status: BookingStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (status !== BookingStatus.PENDING) return null;

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch(`/api/bookings/${bookingId}/accept`, {
            method: "POST",
          });
          if (!res.ok) return;
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      className="brand-btn rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
    >
      {busy ? "Accepting…" : "Accept"}
    </button>
  );
}

