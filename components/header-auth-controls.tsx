"use client";

import { withBasePath } from "@/lib/app-origin";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { useAuthModal } from "@/components/auth-modals";

function MessagesNavLinkWithUnread() {
  const [count, setCount] = useState(0);
  const refresh = useCallback(async () => {
    const res = await fetch(withBasePath("/api/messages/unread-count"));
    if (!res.ok) return;
    const j = (await res.json()) as { count?: number };
    setCount(typeof j.count === "number" ? j.count : 0);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const t = setInterval(() => void refresh(), 12000);
    const on = () => void refresh();
    window.addEventListener("stayly-unread-refresh", on);
    return () => {
      clearInterval(t);
      window.removeEventListener("stayly-unread-refresh", on);
    };
  }, [refresh]);

  return (
    <Link
      href="/profile?tab=messages"
      className="relative inline-flex items-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium hover:border-neutral-700"
    >
      Messages
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}

function HeaderProfileAvatar({ session }: { session: SessionUser }) {
  const initial = (session.name?.trim()?.[0] ?? session.email[0] ?? "?").toUpperCase();
  return (
    <Link
      href="/profile?tab=profile"
      className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--border)] bg-neutral-100 text-sm font-semibold ring-2 ring-white transition hover:opacity-90"
      title="Profile"
    >
      {session.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={session.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center">{initial}</span>
      )}
    </Link>
  );
}

export function HeaderAuthControls({ session }: { session: SessionUser | null }) {
  const router = useRouter();
  const { openLogin } = useAuthModal();

  async function logout() {
    await fetch(withBasePath("/api/auth/logout"), { method: "POST" });
    router.refresh();
  }

  if (!session) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={openLogin}
          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium"
        >
          Sign in
        </button>
      </div>
    );
  }

  if (session.role === "GUEST") {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <MessagesNavLinkWithUnread />
        <Link
          href="/become-host"
          className="rounded-full border border-[var(--brand-soft-border)] bg-[var(--brand-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft-hover)]"
        >
          Become a host
        </Link>
        <HeaderProfileAvatar session={session} />
        <button
          type="button"
          onClick={logout}
          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <MessagesNavLinkWithUnread />
      <Link
        href="/profile?tab=listings"
        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium"
      >
        Host
      </Link>
      {session.role === "ADMIN" && (
        <Link
          href="/admin"
          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium"
        >
          Admin
        </Link>
      )}
      <HeaderProfileAvatar session={session} />
      <button
        type="button"
        onClick={logout}
        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium"
      >
        Log out
      </button>
    </div>
  );
}
