import Link from "next/link";
import { withBasePath } from "@/lib/app-origin";
import { ResetPasswordForm } from "./reset-password-form";

type Search = Promise<{ token?: string }>;

export default async function ResetPasswordPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";

  return (
    <main className="container max-w-lg py-16">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        Account
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">
        Reset password
      </h1>
      <p className="muted mt-3 text-sm leading-relaxed">
        Set a new password for your account. This link can only be used once.
      </p>
      <ResetPasswordForm token={token} />
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={withBasePath("/?auth=login")}
          className="inline-flex rounded-xl bg-[var(--brand-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--brand)] hover:opacity-90"
        >
          Back to log in
        </Link>
        <Link
          href={withBasePath("/")}
          className="inline-flex rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
        >
          Home
        </Link>
      </div>
    </main>
  );
}

