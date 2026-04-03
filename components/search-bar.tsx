"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [where, setWhere] = useState(searchParams.get("where") ?? "");
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") ?? "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") ?? "");
  const [guests, setGuests] = useState(searchParams.get("guests") ?? "1");

  const label = useMemo(() => {
    const whereLabel = where || "Where";
    const whenLabel =
      checkIn && checkOut ? `${checkIn.slice(5)}-${checkOut.slice(5)}` : "When";
    const whoLabel = guests ? `${guests} guest${guests === "1" ? "" : "s"}` : "Who";
    return { whereLabel, whenLabel, whoLabel };
  }, [where, checkIn, checkOut, guests]);

  function applySearch() {
    const params = new URLSearchParams();
    if (where.trim()) params.set("where", where.trim());
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests && guests !== "0") params.set("guests", guests);
    const qs = params.toString();
    router.push(`/listings${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="hidden md:flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-2 shadow-sm">
      <input
        value={where}
        onChange={(e) => setWhere(e.target.value)}
        placeholder={label.whereLabel}
        className="w-28 bg-transparent px-2 text-sm outline-none"
      />
      <input
        type="date"
        value={checkIn}
        onChange={(e) => setCheckIn(e.target.value)}
        className="border-l border-[var(--border)] pl-2 text-sm outline-none"
      />
      <input
        type="date"
        value={checkOut}
        onChange={(e) => setCheckOut(e.target.value)}
        className="text-sm outline-none"
      />
      <input
        type="number"
        min={1}
        value={guests}
        onChange={(e) => setGuests(e.target.value)}
        className="w-16 border-l border-[var(--border)] pl-2 text-sm outline-none"
      />
      <button
        type="button"
        onClick={applySearch}
        className="brand-btn rounded-full px-3 py-1.5 text-sm font-semibold text-white"
      >
        Search
      </button>
    </div>
  );
}
