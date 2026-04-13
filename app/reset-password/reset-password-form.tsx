"use client";

import { withBasePath } from "@/lib/app-origin";
import { PASSWORD_MIN_LENGTH } from "@/lib/password";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit() {
    setError(null);
    setOk(false);
    if (!token) {
      setError("Missing token. Open the link from your email again.");
      return;
    }
    if (pw1.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    if (pw1 !== pw2) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(withBasePath("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: pw1 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof (data as { error?: string }).error === "string"
            ? (data as { error: string }).error
            : "Could not reset password.",
        );
        return;
      }
      setOk(true);
      setPw1("");
      setPw2("");
      router.replace(withBasePath("/?auth=login"));
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 space-y-4 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <input
        type="password"
        autoComplete="new-password"
        value={pw1}
        onChange={(e) => setPw1(e.target.value)}
        placeholder={`New password (min. ${PASSWORD_MIN_LENGTH} characters)`}
        className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
      />
      <input
        type="password"
        autoComplete="new-password"
        value={pw2}
        onChange={(e) => setPw2(e.target.value)}
        placeholder="Confirm new password"
        className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
      />
      {error ? (
        <p className="text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="text-sm font-medium text-green-700" role="status">
          Password updated. Redirecting to log in…
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="brand-btn w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Updating…" : "Update password"}
      </button>
    </div>
  );
}

