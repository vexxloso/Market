import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { withBasePath } from "@/lib/app-origin";
import { ConfirmEmailForm } from "./confirm-email-form";

type Search = Promise<{ verified?: string; error?: string }>;

export default async function ConfirmEmailPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const verified = sp.verified === "1";
  const err = sp.error;

  let title = "Confirm your email";
  let body: ReactNode = null;

  if (verified) {
    title = "Email confirmed";
    body = (
      <p className="muted mt-3 text-sm leading-relaxed">
        Your address is confirmed. Sign in with the password you used when you registered.
      </p>
    );
  } else if (err === "missing") {
    title = "Link incomplete";
    body = (
      <p className="muted mt-3 text-sm leading-relaxed">
        That confirmation link is incomplete. Enter your email and the 6-digit code below, or use
        <strong className="font-medium text-neutral-800"> Resend confirmation email</strong>.
      </p>
    );
  } else if (err === "invalid") {
    title = "Link expired or invalid";
    body = (
      <p className="muted mt-3 text-sm leading-relaxed">
        That link may have expired or was already used. Enter a fresh code below or tap{" "}
        <strong className="font-medium text-neutral-800">Resend confirmation email</strong>.
      </p>
    );
  } else {
    body = (
      <p className="muted mt-3 text-sm leading-relaxed">
        You should have received an email with a <strong className="text-neutral-800">6-digit code</strong>{" "}
        and a confirmation link. Enter the code here, or use Resend if you need a new message.
      </p>
    );
  }

  return (
    <main className="container max-w-lg py-16">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        Finish registration
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>
      {body}
      {!verified && (
        <Suspense fallback={<p className="muted mt-8 text-sm">Loading…</p>}>
          <ConfirmEmailForm />
        </Suspense>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        {verified && (
          <Link
            href={withBasePath("/?auth=login")}
            className="inline-flex rounded-xl bg-[var(--brand-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--brand)] hover:opacity-90"
          >
            Log in
          </Link>
        )}
        <Link
          href={withBasePath("/")}
          className="inline-flex rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
        >
          Home
        </Link>
        {verified && (
          <Link
            href={withBasePath("/profile")}
            className="inline-flex rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
          >
            Profile
          </Link>
        )}
      </div>
    </main>
  );
}
