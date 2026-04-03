"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BecomeHostClient() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onStart() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/become-host", { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Could not enable hosting.");
      return;
    }
    router.refresh();
    router.push("/host/new");
  }

  return (
    <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6">
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <button
        type="button"
        disabled={loading}
        onClick={onStart}
        className="brand-btn w-full rounded-xl py-3 text-sm font-semibold text-white"
      >
        {loading ? "Setting up..." : "Start hosting — list my place"}
      </button>
    </div>
  );
}
