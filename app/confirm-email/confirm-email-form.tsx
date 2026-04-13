"use client";

import { withBasePath } from "@/lib/app-origin";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function ConfirmEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendNote, setResendNote] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams.get("email")?.trim();
    if (q) setEmail(q);
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(withBasePath("/api/auth/verify-email-code"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), code }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.replace(withBasePath("/confirm-email?verified=1"));
    router.refresh();
  }

  async function resend() {
    setResendNote(null);
    setError("");
    const em = email.trim();
    if (!em) {
      setResendNote("Enter your email address first, then tap Resend.");
      return;
    }
    setResendBusy(true);
    const res = await fetch(withBasePath("/api/auth/resend-verification-public"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: em }),
    });
    setResendBusy(false);
    const data = (await res.json()) as { error?: string; message?: string };
    if (!res.ok) {
      setResendNote(data.error ?? "Could not resend.");
      return;
    }
    setResendNote(
      data.message ??
        "If this account is still unconfirmed, we sent a new link and 6-digit code.",
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <form
        className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm"
        onSubmit={(e) => void onSubmit(e)}
      >
        <p className="text-sm font-semibold text-neutral-900">Enter your code</p>
        <p className="muted text-xs leading-relaxed">
          Use the 6-digit code from your email, or open the confirmation link in that same message.
        </p>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
        />
        <input
          type="text"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={12}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="6-digit code"
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2 font-mono text-lg tracking-widest"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="brand-btn w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Checking…" : "Confirm email"}
        </button>
      </form>

      <div className="rounded-2xl border border-[var(--border)] bg-neutral-50 p-5">
        <p className="text-sm font-semibold text-neutral-900">Didn’t get the email?</p>
        <p className="muted mt-1 text-xs leading-relaxed">
          We can send a new confirmation link and code to the address above (same limits as when you
          signed up).
        </p>
        <button
          type="button"
          disabled={resendBusy}
          onClick={() => void resend()}
          className="mt-3 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
        >
          {resendBusy ? "Sending…" : "Resend confirmation email"}
        </button>
        {resendNote && (
          <p className="mt-2 text-xs text-neutral-700" role="status">
            {resendNote}
          </p>
        )}
      </div>

      <p className="text-center text-xs text-neutral-600">
        Wrong address?{" "}
        <Link href={withBasePath("/?auth=signup")} className="font-semibold text-[var(--brand)] underline">
          Sign up again
        </Link>{" "}
        — if your account isn’t confirmed yet, you can use the same email with a new password.
      </p>
    </div>
  );
}
