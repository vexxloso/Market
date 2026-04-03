"use client";

import { withBasePath } from "@/lib/app-origin";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { useAuthModal } from "@/components/auth-modals";

export function HomeAuthBar({ session }: { session: SessionUser | null }) {
  const router = useRouter();
  const { openLogin, openSignup } = useAuthModal();

  async function logout() {
    await fetch(withBasePath("/api/auth/logout"), { method: "POST" });
    router.refresh();
  }

  return (
    <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">
          {session ? `Hello, ${session.email}` : "Guest mode"}
        </p>
        <p className="muted text-xs">
          {session ? `Role: ${session.role}` : "Log in to book and host."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {!session ? (
          <>
            <Link
              className="rounded-lg border border-[var(--brand-soft-border)] bg-[var(--brand-soft)] px-3 py-1.5 font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft-hover)]"
              href="/become-host"
            >
              Become a host
            </Link>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 font-medium"
              onClick={openLogin}
            >
              Log in
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 font-medium"
              onClick={openSignup}
            >
              Sign up
            </button>
          </>
        ) : session.role === "GUEST" ? (
          <>
            <Link
              className="rounded-lg border border-[var(--brand-soft-border)] bg-[var(--brand-soft)] px-3 py-1.5 font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft-hover)]"
              href="/become-host"
            >
              Become a host
            </Link>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 font-medium"
              onClick={logout}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 font-medium"
              href="/host"
            >
              Host dashboard
            </Link>
            {session.role === "ADMIN" && (
              <Link
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 font-medium"
                href="/admin"
              >
                Admin
              </Link>
            )}
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 font-medium"
              onClick={logout}
            >
              Log out
            </button>
          </>
        )}
      </div>
    </section>
  );
}
