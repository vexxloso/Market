"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdateUserRole({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Failed to update role.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="cursor-pointer rounded-md border px-2 py-1 text-xs"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="GUEST">GUEST</option>
        <option value="HOST">HOST</option>
        <option value="ADMIN">ADMIN</option>
      </select>
      <button
        type="button"
        className="cursor-pointer rounded-md border px-2 py-1 text-xs"
        onClick={submit}
      >
        {loading ? "Saving..." : "Save"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export function UpdateBookingStatus({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    setLoading(true);
    const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Failed to update booking status.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="cursor-pointer rounded-md border px-2 py-1 text-xs"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="PENDING">PENDING</option>
        <option value="ACCEPTED">ACCEPTED</option>
        <option value="PAID">PAID</option>
        <option value="CANCELLED">CANCELLED</option>
        <option value="COMPLETED">COMPLETED</option>
      </select>
      <button
        type="button"
        className="cursor-pointer rounded-md border px-2 py-1 text-xs"
        onClick={submit}
      >
        {loading ? "Saving..." : "Save"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
