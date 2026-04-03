"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  calculateStayTotalPrice,
  countStayNightsLocal,
  parseLocalYmd,
} from "@/lib/pricing";

export function ListingBookingForm({
  listingId,
  maxGuests = 16,
  weekdayPrice,
  weekendPrice,
  isLoggedIn,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}: {
  listingId: string;
  maxGuests?: number;
  weekdayPrice: number;
  weekendPrice: number;
  isLoggedIn: boolean;
  /** Prefill from search (URL); user can still change. */
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}) {
  const router = useRouter();
  const capInitial = Math.max(1, maxGuests);
  const [checkIn, setCheckIn] = useState(initialCheckIn ?? "");
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? "");
  const [guests, setGuests] = useState(() => {
    const g = initialGuests ?? 1;
    return Math.min(Math.max(1, Math.trunc(g)), capInitial);
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const stay = useMemo(() => {
    const start = parseLocalYmd(checkIn);
    const end = parseLocalYmd(checkOut);
    if (!start || !end || end <= start) {
      return { nights: 0, total: null as number | null };
    }
    const nights = countStayNightsLocal(start, end);
    const total = calculateStayTotalPrice(start, end, weekdayPrice, weekendPrice);
    return { nights, total };
  }, [checkIn, checkOut, weekdayPrice, weekendPrice]);

  const { nights, total } = stay;

  async function submitBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!isLoggedIn) {
      setError("Please sign in to request a booking.");
      return;
    }
    if (!checkIn || !checkOut) {
      setError("Please select check-in and check-out dates.");
      return;
    }
    if (nights <= 0) {
      setError("Check-out date must be after check-in date.");
      return;
    }
    const guestsNum = Math.trunc(Number(guests));
    if (!Number.isFinite(guestsNum) || guestsNum <= 0) {
      setError("Guests must be at least 1.");
      return;
    }
    if (guestsNum > maxGuests) {
      setError(`This place hosts up to ${maxGuests} guests.`);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        checkIn,
        checkOut,
        guests: guestsNum,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      const msg = data.error ?? "Failed to create booking";
      if (res.status === 401) {
        setError(`${msg} Use Sign in below.`);
      } else {
        setError(msg);
      }
      return;
    }
    router.push("/profile?tab=bookings");
    router.refresh();
  }

  const cap = Math.max(1, maxGuests);

  return (
    <div className="mt-5 border-t border-[var(--border)] pt-5">
      <h2 className="text-lg font-semibold">Confirm your reservation</h2>
      <p className="muted mt-1 text-sm">
        Your booking request will be sent to the host. Payment happens after acceptance.
      </p>
      {!isLoggedIn ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <Link href="/?auth=login" className="font-semibold underline">
            Sign in
          </Link>{" "}
          to request a booking — totals below update as you pick dates.
        </p>
      ) : null}
      <form className="mt-4 space-y-3" onSubmit={submitBooking}>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            required
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            aria-label="Check-in"
          />
          <input
            type="date"
            required
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            aria-label="Check-out"
          />
        </div>
        <input
          type="number"
          min={1}
          max={cap}
          value={guests}
          onChange={(e) => {
            const v = Number(e.target.value);
            setGuests(Number.isFinite(v) ? v : 1);
          }}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
          aria-label="Guests"
        />
        <p className="text-xs text-[var(--muted)]">Up to {cap} guests</p>
        <div className="rounded-xl bg-neutral-50 p-3 text-sm">
          <p>
            <span className="text-[var(--muted)]">Nights:</span>{" "}
            <span className="font-medium text-neutral-900">{nights}</span>
          </p>
          {total != null && nights > 0 ? (
            <p className="mt-2 text-base font-semibold text-neutral-900">
              Total (before taxes): ${total}
            </p>
          ) : (
            <p className="muted mt-2 text-xs">
              Select check-in and check-out to see your stay total (weekday ${weekdayPrice} ·
              weekend ${weekendPrice}).
            </p>
          )}
          <p className="muted mt-2 text-xs">
            Priced per night (weekday vs weekend). Final amount is confirmed when you pay after the
            host accepts.
          </p>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="brand-btn w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white disabled:opacity-60"
          disabled={loading || !isLoggedIn}
        >
          {loading ? "Submitting..." : "Request booking"}
        </button>
        <p className="muted text-xs">
          Final availability is rechecked when you submit your request.
        </p>
      </form>
    </div>
  );
}
