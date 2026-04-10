"use client";

import { withBasePath } from "@/lib/app-origin";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { UserRole } from "@prisma/client";
import { UpdateUserRole } from "./admin-actions";

const TAB_IDS = ["overview", "users", "bookings", "payments", "stripe-keys", "listings", "reviews"] as const;
type TabId = (typeof TAB_IDS)[number];

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "bookings", label: "Bookings" },
  { id: "payments", label: "Payments" },
  { id: "stripe-keys", label: "Stripe keys" },
  { id: "listings", label: "Listings" },
  { id: "reviews", label: "Reviews" },
];

function parseTab(raw: string | null): TabId {
  if (raw && TAB_IDS.includes(raw as TabId)) return raw as TabId;
  return "overview";
}

const navLinkClass = (active: boolean) =>
  `cursor-pointer text-sm font-medium transition-colors ${
    active
      ? "border-b-2 border-neutral-900 pb-3 text-neutral-900"
      : "border-b-2 border-transparent pb-3 text-neutral-600 hover:text-neutral-900"
  }`;

type PaginationState = { up: number; bp: number; lp: number; rp: number };

function buildAdminHref(tab: TabId, pages: PaginationState): string {
  const qs = new URLSearchParams();
  if (tab !== "overview") qs.set("tab", tab);
  if (pages.up > 1) qs.set("up", String(pages.up));
  if (pages.bp > 1) qs.set("bp", String(pages.bp));
  if (pages.lp > 1) qs.set("lp", String(pages.lp));
  if (pages.rp > 1) qs.set("rp", String(pages.rp));
  const q = qs.toString();
  return q ? `/admin?${q}` : "/admin";
}

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  bannedAt: string | null;
  avatarUrl: string | null;
  stripeAccountId: string | null;
  stripeConnectStatus: string;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
  stripeDetailsSubmitted: boolean;
  stripeVerifiedAt: string | null;
};

type BookingRow = {
  id: string;
  status: string;
  guests: number;
  totalPrice: number;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  platformFeeAmount: number | null;
  hostPayoutAmount: number | null;
  payoutStatus: string;
  payoutEligibleAt: string | null;
  lastPayout: { id: string; status: string; stripeTransferId: string | null; error: string | null } | null;
  checkIn: string;
  checkOut: string;
  user: { id: string; email: string; name: string | null; avatarUrl: string | null };
  listing: {
    id: string;
    title: string;
    hostId: string;
    host: { id: string; email: string; name: string | null; avatarUrl: string | null };
  };
};

type ListingRow = {
  id: string;
  title: string;
  status: string;
  pricePerNight: number;
  coverImageUrl: string;
  hostId: string;
  host: { id: string; email: string; name: string | null; avatarUrl: string | null };
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string;
  listing: {
    id: string;
    title: string;
    coverImageUrl: string;
    host: { id: string; email: string; name: string | null; avatarUrl: string | null };
  };
  guest: { id: string; email: string; name: string | null; avatarUrl: string | null };
};

function AdminAvatar({
  avatarUrl,
  label,
  size = "md",
}: {
  avatarUrl: string | null;
  label: string;
  size?: "sm" | "md";
}) {
  const initial = (label.trim()[0] ?? "?").toUpperCase();
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt=""
      className={`${dim} shrink-0 rounded-full border border-[var(--border)] object-cover`}
    />
  ) : (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--brand-soft)] font-semibold text-[var(--brand)]`}
    >
      {initial}
    </div>
  );
}

function FiveStars({ rating }: { rating: number }) {
  const r = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <span
      className="inline-flex gap-0.5 text-amber-500"
      role="img"
      aria-label={`${r} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="text-base leading-none">
          {i <= r ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

function PaginationFooter({
  tab,
  pageKey,
  page,
  total,
  pageSize,
  pages,
}: {
  tab: TabId;
  pageKey: keyof PaginationState;
  page: number;
  total: number;
  pageSize: number;
  pages: PaginationState;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) return null;

  const prev = Math.max(1, page - 1);
  const next = Math.min(pageCount, page + 1);

  const hrefFor = (p: number) => {
    const nextPages = { ...pages, [pageKey]: p } as PaginationState;
    return buildAdminHref(tab, nextPages);
  };

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-4 text-sm">
      <p className="text-[var(--muted)]">
        Page {page} of {pageCount} · {total} total
      </p>
      <div className="flex gap-2">
        <Link
          href={hrefFor(prev)}
          scroll={false}
          className={`cursor-pointer rounded-lg border border-[var(--border)] px-3 py-1.5 font-semibold text-neutral-800 hover:border-neutral-700 ${
            page <= 1 ? "pointer-events-none opacity-40" : ""
          }`}
        >
          Previous
        </Link>
        <Link
          href={hrefFor(next)}
          scroll={false}
          className={`cursor-pointer rounded-lg border border-[var(--border)] px-3 py-1.5 font-semibold text-neutral-800 hover:border-neutral-700 ${
            page >= pageCount ? "pointer-events-none opacity-40" : ""
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 id="admin-modal-title" className="text-base font-semibold text-neutral-900">
            {title}
          </h3>
          <button
            type="button"
            className="cursor-pointer shrink-0 rounded-lg px-2 py-1 text-sm text-[var(--muted)] hover:bg-neutral-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function useRefresh() {
  const router = useRouter();
  return useCallback(() => router.refresh(), [router]);
}

export function AdminDashboardClient({
  users,
  bookings,
  listings,
  currentAdminId,
  stripeMode,
  usersCount,
  listingsCount,
  bookingsCount,
  reviewsCount,
  pageSize,
  pagination,
  adminEmail,
  seededAdmin,
  recentReviews,
}: {
  users: UserRow[];
  bookings: BookingRow[];
  listings: ListingRow[];
  currentAdminId: string;
  stripeMode: "test" | "live" | null;
  usersCount: number;
  listingsCount: number;
  bookingsCount: number;
  reviewsCount: number;
  pageSize: number;
  pagination: PaginationState;
  adminEmail: string | null;
  seededAdmin: { email: string; role: UserRole } | null;
  recentReviews: ReviewRow[];
}) {
  const searchParams = useSearchParams();
  const tab = useMemo(
    () => parseTab(searchParams.get("tab")),
    [searchParams],
  );

  const refresh = useRefresh();
  const [messageUserId, setMessageUserId] = useState<string | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [messageBusy, setMessageBusy] = useState(false);
  const [messageErr, setMessageErr] = useState("");

  const [reasonModal, setReasonModal] = useState<
    | null
    | {
        title: string;
        submitLabel: string;
        onSubmit: (reason: string) => Promise<void>;
      }
  >(null);
  const [reasonText, setReasonText] = useState("");
  const [reasonBusy, setReasonBusy] = useState(false);
  const [reasonErr, setReasonErr] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [resetBusyId, setResetBusyId] = useState<string | null>(null);

  const [stripeKeysBusy, setStripeKeysBusy] = useState(false);
  const [stripeKeysErr, setStripeKeysErr] = useState("");
  const [stripeKeysStatus, setStripeKeysStatus] = useState<{
    configured: boolean;
    mode: "test" | "live" | null;
    encrypted: boolean;
    updatedAt: string | null;
    stripeSecretKeyMasked: string;
    stripePublishableKeyMasked: string;
    stripeWebhookSecretMasked: string;
  } | null>(null);
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");

  useEffect(() => {
    if (tab !== "stripe-keys") return;
    setStripeKeysErr("");
    setStripeKeysBusy(true);
    void fetch(withBasePath("/api/admin/stripe-keys"))
      .then(async (r) => {
        const d = (await r.json().catch(() => ({}))) as { data?: unknown; error?: string };
        if (!r.ok) throw new Error(d.error ?? "Failed to load keys.");
        setStripeKeysStatus(d.data as typeof stripeKeysStatus);
      })
      .catch((e) => setStripeKeysErr(e instanceof Error ? e.message : "Failed to load keys."))
      .finally(() => setStripeKeysBusy(false));
  }, [tab]);

  function flashNotice(text: string) {
    setActionNotice(text);
    window.setTimeout(() => setActionNotice(null), 12_000);
  }

  async function submitMessage() {
    if (!messageUserId) return;
    setMessageErr("");
    setMessageBusy(true);
    const res = await fetch(withBasePath(`/api/admin/users/${messageUserId}/message`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: messageBody }),
    });
    setMessageBusy(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setMessageErr(data.error ?? "Failed to send.");
      return;
    }
    setMessageUserId(null);
    setMessageBody("");
    flashNotice("Message sent.");
    refresh();
  }

  async function toggleBan(userId: string, banned: boolean) {
    const res = await fetch(withBasePath(`/api/admin/users/${userId}/ban`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banned }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      alert(data.error ?? "Failed to update ban.");
      return;
    }
    flashNotice(banned ? "User suspended." : "User unbanned.");
    refresh();
  }

  async function resetPassword(userId: string) {
    setResetBusyId(userId);
    try {
      const res = await fetch(withBasePath(`/api/admin/users/${userId}/reset-password`), {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string; data?: { message?: string } };
      if (!res.ok) {
        alert(data.error ?? "Reset failed.");
        return;
      }
      flashNotice(data.data?.message ?? "Password set to password123 and user notified in support chat.");
      refresh();
    } finally {
      setResetBusyId(null);
    }
  }

  function openReasonModal(
    title: string,
    submitLabel: string,
    onSubmit: (reason: string) => Promise<void>,
  ) {
    setReasonText("");
    setReasonErr("");
    setReasonModal({ title, submitLabel, onSubmit });
  }

  async function submitReason() {
    if (!reasonModal) return;
    const r = reasonText.trim();
    if (!r) {
      setReasonErr("Reason is required.");
      return;
    }
    setReasonErr("");
    setReasonBusy(true);
    try {
      await reasonModal.onSubmit(r);
      setReasonModal(null);
      flashNotice(
        "Change saved on the server. If the page then shows a database error, PostgreSQL likely disconnected — restart it and reload; the booking update may already be done.",
      );
      refresh();
    } catch (e) {
      setReasonErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setReasonBusy(false);
    }
  }

  const formatMoney = (n: number) => `$${n}`;
  const formatShortDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const formatStripeAcct = (id: string | null) => (id ? `${id.slice(0, 8)}…${id.slice(-4)}` : "—");

  return (
    <div className="bg-[var(--background)]">
      <div className="border-b border-[var(--border)] bg-white">
        <div className="container flex h-16 items-center justify-center">
          <nav
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 sm:gap-x-10"
            role="tablist"
            aria-label="Admin sections"
          >
            {TABS.map(({ id, label }) => {
              const active = tab === id;
              return (
                <Link
                  key={id}
                  href={buildAdminHref(id, pagination)}
                  scroll={false}
                  role="tab"
                  aria-selected={active}
                  id={`admin-tab-${id}`}
                  aria-controls={`admin-panel-${id}`}
                  className={navLinkClass(active)}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="container py-8 px-4 sm:px-6">
        {tab === "overview" ? (
          <header className="mb-7">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Admin dashboard</h1>
            <p className="muted mt-1 text-sm">
              User, booking, and listing moderation — messages use the same inbox as on your profile.
            </p>
          </header>
        ) : null}

        {actionNotice ? (
          <div
            className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
            role="status"
          >
            <p className="min-w-0 leading-snug">{actionNotice}</p>
            <button
              type="button"
              className="cursor-pointer shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100/80"
              onClick={() => setActionNotice(null)}
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="space-y-7">
          {tab === "overview" ? (
            <div
              id="admin-panel-overview"
              role="tabpanel"
              aria-labelledby="admin-tab-overview"
              className="space-y-7"
            >
              <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="muted text-xs">Users</p>
                  <p className="mt-1 text-2xl font-semibold">{usersCount}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="muted text-xs">Listings</p>
                  <p className="mt-1 text-2xl font-semibold">{listingsCount}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="muted text-xs">Bookings</p>
                  <p className="mt-1 text-2xl font-semibold">{bookingsCount}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="muted text-xs">Reviews</p>
                  <p className="mt-1 text-2xl font-semibold">{reviewsCount}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <h2 className="text-base font-semibold">Admin access check</h2>
                {!adminEmail ? (
                  <p className="muted mt-1 text-sm">
                    Set <code>ADMIN_EMAIL</code> in your <code>.env</code> to identify the intended admin account.
                  </p>
                ) : seededAdmin?.role === UserRole.ADMIN ? (
                  <p className="mt-1 text-sm text-green-700">Admin account found: {seededAdmin.email}</p>
                ) : (
                  <p className="mt-1 text-sm text-amber-700">
                    <code>ADMIN_EMAIL</code> is set, but that user is missing or not assigned <code>ADMIN</code> role.
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-[var(--border)] bg-[var(--brand-soft)] p-4">
                <h2 className="text-base font-semibold text-neutral-900">Messages</h2>
                <p className="muted mt-1 text-sm">
                  Use the same inbox as guests and hosts: platform threads, booking chats, and support.
                </p>
                <Link
                  href="/profile?tab=messages"
                  className="mt-3 inline-flex cursor-pointer rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:border-neutral-700"
                >
                  Open messages
                </Link>
              </section>
            </div>
          ) : null}

          {tab === "users" ? (
            <section
              id="admin-panel-users"
              role="tabpanel"
              aria-labelledby="admin-tab-users"
              className="rounded-2xl border border-[var(--border)] bg-white p-4"
            >
              <h2 className="mb-3 text-base font-semibold">User management</h2>
              <p className="muted mb-3 text-sm">
                Reset password sets <strong className="font-semibold text-neutral-800">password123</strong> and sends
                the user a support message with sign-in steps. You can also message, suspend, or change role.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                      <th className="py-2 pr-2">User</th>
                      <th className="py-2 pr-2">Role</th>
                      <th className="py-2 pr-2">Status</th>
                      <th className="py-2 pr-2">Stripe</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const label = u.name?.trim() || u.email;
                      return (
                        <tr key={u.id} className="border-b border-[var(--border)]">
                          <td className="py-2 pr-2">
                            <div className="flex min-w-0 items-center gap-3">
                              <Link
                                href={`/profile/${u.id}`}
                                className="shrink-0 cursor-pointer"
                                title="Open profile"
                              >
                                <AdminAvatar avatarUrl={u.avatarUrl} label={label} />
                              </Link>
                              <div className="min-w-0">
                                <Link
                                  href={`/profile/${u.id}`}
                                  className="block cursor-pointer truncate font-medium text-neutral-900 hover:underline"
                                >
                                  {u.email}
                                </Link>
                                {u.name ? <div className="text-xs text-[var(--muted)]">{u.name}</div> : null}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 pr-2 align-top">
                            <UpdateUserRole userId={u.id} currentRole={u.role} />
                          </td>
                          <td className="py-2 pr-2 align-top">
                            {u.bannedAt ? (
                              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                                Banned
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-600">Active</span>
                            )}
                          </td>
                          <td className="py-2 pr-2 align-top">
                            <div className="space-y-0.5">
                              <div className="text-xs font-medium text-neutral-900">
                                {u.stripeConnectStatus === "CONNECTED"
                                  ? "Connected"
                                  : u.stripeConnectStatus === "PENDING"
                                    ? "Pending"
                                    : "Not connected"}
                              </div>
                              <div className="text-[11px] text-[var(--muted)]">
                                Acct: {formatStripeAcct(u.stripeAccountId)}
                              </div>
                              <div className="text-[11px] text-[var(--muted)]">
                                Charges: {u.stripeChargesEnabled ? "on" : "off"} · Payouts:{" "}
                                {u.stripePayoutsEnabled ? "on" : "off"}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 align-top text-right">
                            <div className="flex flex-wrap justify-end gap-1">
                              <button
                                type="button"
                                className="cursor-pointer rounded-lg border border-[var(--border)] px-2 py-1 text-xs font-semibold hover:border-neutral-700"
                                onClick={() => {
                                  setMessageUserId(u.id);
                                  setMessageBody("");
                                  setMessageErr("");
                                }}
                              >
                                Message
                              </button>
                              {u.id !== currentAdminId && u.role !== UserRole.ADMIN ? (
                                <button
                                  type="button"
                                  disabled={resetBusyId === u.id}
                                  className="cursor-pointer rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 disabled:opacity-50"
                                  onClick={() => void resetPassword(u.id)}
                                >
                                  {resetBusyId === u.id ? "Reset…" : "Reset password"}
                                </button>
                              ) : null}
                              {u.id !== currentAdminId && u.role !== UserRole.ADMIN ? (
                                u.bannedAt ? (
                                  <button
                                    type="button"
                                    className="cursor-pointer rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800"
                                    onClick={() => void toggleBan(u.id, false)}
                                  >
                                    Unban
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-800"
                                    onClick={() => void toggleBan(u.id, true)}
                                  >
                                    Ban
                                  </button>
                                )
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <PaginationFooter
                tab="users"
                pageKey="up"
                page={pagination.up}
                total={usersCount}
                pageSize={pageSize}
                pages={pagination}
              />
            </section>
          ) : null}

          {tab === "bookings" ? (
            <section
              id="admin-panel-bookings"
              role="tabpanel"
              aria-labelledby="admin-tab-bookings"
              className="rounded-2xl border border-[var(--border)] bg-white p-4"
            >
              <h2 className="mb-3 text-base font-semibold">Booking management</h2>
              <p className="muted mb-3 text-sm">
                Cancel marks the booking cancelled, posts in the booking thread, and notifies guest and host with listing
                and bookings-tab links. Remove deletes after similar notices.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                      <th className="py-2 pr-2">Listing</th>
                      <th className="py-2 pr-2">Guest</th>
                      <th className="py-2 pr-2">Host</th>
                      <th className="py-2 pr-2">Stay</th>
                      <th className="py-2 pr-2">Status</th>
                      <th className="py-2 pr-2">Payment</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-b border-[var(--border)]">
                        <td className="max-w-[200px] py-2 pr-2">
                          <Link
                            href={`/listing/${b.listing.id}`}
                            className="block cursor-pointer truncate font-medium text-neutral-900 hover:underline"
                          >
                            {b.listing.title}
                          </Link>
                          <div className="text-xs text-[var(--muted)]">
                            {formatMoney(b.totalPrice)} · {b.guests} guests
                          </div>
                        </td>
                        <td className="py-2 pr-2 align-top">
                          <div className="flex min-w-0 items-center gap-2">
                            <Link href={`/profile/${b.user.id}`} className="shrink-0 cursor-pointer">
                              <AdminAvatar
                                avatarUrl={b.user.avatarUrl}
                                label={b.user.name?.trim() || b.user.email}
                                size="sm"
                              />
                            </Link>
                            <div className="min-w-0">
                              <Link
                                href={`/profile/${b.user.id}`}
                                className="block cursor-pointer truncate text-xs font-medium hover:underline"
                              >
                                {b.user.email}
                              </Link>
                              <button
                                type="button"
                                className="mt-0.5 cursor-pointer text-left text-xs font-semibold text-[var(--brand)] hover:underline"
                                onClick={() => {
                                  setMessageUserId(b.user.id);
                                  setMessageBody("");
                                  setMessageErr("");
                                }}
                              >
                                Message guest
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 pr-2 align-top">
                          <div className="flex min-w-0 items-center gap-2">
                            <Link href={`/profile/${b.listing.hostId}`} className="shrink-0 cursor-pointer">
                              <AdminAvatar
                                avatarUrl={b.listing.host.avatarUrl}
                                label={b.listing.host.name?.trim() || b.listing.host.email}
                                size="sm"
                              />
                            </Link>
                            <div className="min-w-0">
                              <Link
                                href={`/profile/${b.listing.hostId}`}
                                className="block cursor-pointer truncate text-xs font-medium hover:underline"
                              >
                                {b.listing.host.email}
                              </Link>
                              <button
                                type="button"
                                className="mt-0.5 cursor-pointer text-left text-xs font-semibold text-[var(--brand)] hover:underline"
                                onClick={() => {
                                  setMessageUserId(b.listing.hostId);
                                  setMessageBody("");
                                  setMessageErr("");
                                }}
                              >
                                Message host
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 pr-2 align-top text-xs whitespace-nowrap">
                          {formatShortDate(b.checkIn)} → {formatShortDate(b.checkOut)}
                        </td>
                        <td className="py-2 pr-2 align-top text-xs">{b.status}</td>
                        <td className="py-2 pr-2 align-top">
                          <div className="space-y-0.5 text-xs">
                            <div className="text-neutral-900">
                              Payout: <span className="font-semibold">{b.payoutStatus}</span>
                            </div>
                            <div className="text-[11px] text-[var(--muted)]">
                              Fee:{" "}
                              {typeof b.platformFeeAmount === "number"
                                ? `$${(b.platformFeeAmount / 100).toFixed(2)}`
                                : "—"}{" "}
                              · Host:{" "}
                              {typeof b.hostPayoutAmount === "number"
                                ? `$${(b.hostPayoutAmount / 100).toFixed(2)}`
                                : "—"}
                            </div>
                            <div className="text-[11px] text-[var(--muted)]">
                              Checkout:{" "}
                              {b.stripeCheckoutSessionId
                                ? `${b.stripeCheckoutSessionId.slice(0, 10)}…`
                                : "—"}
                            </div>
                            {b.lastPayout ? (
                              <div className="text-[11px] text-[var(--muted)]">
                                Last transfer:{" "}
                                {b.lastPayout.stripeTransferId
                                  ? `${b.lastPayout.stripeTransferId.slice(0, 10)}…`
                                  : "—"}{" "}
                                ({b.lastPayout.status})
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-2 align-top text-right">
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              className="cursor-pointer rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900"
                              onClick={() =>
                                openReasonModal(
                                  "Cancel booking (reason required)",
                                  "Cancel booking",
                                  async (reason) => {
                                    const res = await fetch(
                                      withBasePath(`/api/admin/bookings/${b.id}/cancel`),
                                      {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ reason }),
                                      },
                                    );
                                    if (!res.ok) {
                                      const d = (await res.json()) as { error?: string };
                                      throw new Error(d.error ?? "Cancel failed.");
                                    }
                                  },
                                )
                              }
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-800"
                              onClick={() =>
                                openReasonModal(
                                  "Remove booking — notifies guest & host, then deletes record",
                                  "Remove booking",
                                  async (reason) => {
                                    const res = await fetch(
                                      withBasePath(`/api/admin/bookings/${b.id}/remove`),
                                      {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ reason }),
                                      },
                                    );
                                    if (!res.ok) {
                                      const d = (await res.json()) as { error?: string };
                                      throw new Error(d.error ?? "Remove failed.");
                                    }
                                  },
                                )
                              }
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationFooter
                tab="bookings"
                pageKey="bp"
                page={pagination.bp}
                total={bookingsCount}
                pageSize={pageSize}
                pages={pagination}
              />
            </section>
          ) : null}

          {tab === "payments" ? (
            <section
              id="admin-panel-payments"
              role="tabpanel"
              aria-labelledby="admin-tab-payments"
              className="rounded-2xl border border-[var(--border)] bg-white p-4"
            >
              <h2 className="mb-3 text-base font-semibold">Payment processing</h2>
              <p className="muted mb-3 text-sm">
                Stripe Checkout + payout tracking for each booking.
              </p>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 font-semibold text-emerald-800">
                  Pay-in (guest → platform)
                </span>
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 font-semibold text-indigo-800">
                  Pay-out (platform → host)
                </span>
                <span className="ml-auto">
                  Stripe mode:{" "}
                  <span className="font-semibold text-neutral-900">{stripeMode ?? "unknown"}</span>
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                      <th className="py-2 pr-2">Type</th>
                      <th className="py-2 pr-2">Booking</th>
                      <th className="py-2 pr-2">Guest</th>
                      <th className="py-2 pr-2">Host</th>
                      <th className="py-2 pr-2">Booking status</th>
                      <th className="py-2 pr-2">Total</th>
                      <th className="py-2 pr-2">Stripe</th>
                      <th className="py-2 pr-2">Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const dash =
                        stripeMode === "test"
                          ? "https://dashboard.stripe.com/test"
                          : stripeMode === "live"
                            ? "https://dashboard.stripe.com"
                            : null;

                      const events = bookings.flatMap((b) => {
                        const payIn =
                          b.stripeCheckoutSessionId || b.stripePaymentIntentId
                            ? [
                                {
                                  key: `${b.id}:payin`,
                                  type: "PAYIN" as const,
                                  booking: b,
                                },
                              ]
                            : [];
                        const payOut = b.lastPayout?.stripeTransferId
                          ? [
                              {
                                key: `${b.id}:payout`,
                                type: "PAYOUT" as const,
                                booking: b,
                              },
                            ]
                          : [];
                        return [...payIn, ...payOut];
                      });

                      return events.map(({ key, type, booking: b }) => {
                        const badge =
                          type === "PAYIN" ? (
                            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800">
                              PAY-IN
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-800">
                              PAY-OUT
                            </span>
                          );

                        const stripeLink =
                          type === "PAYIN"
                            ? b.stripePaymentIntentId && dash
                              ? `${dash}/payments/${b.stripePaymentIntentId}`
                              : b.stripeCheckoutSessionId && dash
                                ? `${dash}/checkout/sessions/${b.stripeCheckoutSessionId}`
                                : null
                            : b.lastPayout?.stripeTransferId && dash
                              ? `${dash}/transfers/${b.lastPayout.stripeTransferId}`
                              : null;

                        return (
                          <tr key={key} className="border-b border-[var(--border)] align-top">
                            <td className="py-2 pr-2">{badge}</td>
                            <td className="py-2 pr-2">
                              <div className="space-y-0.5">
                                <p className="font-medium text-neutral-900">{b.listing.title}</p>
                                <p className="text-xs text-[var(--muted)]">
                                  {b.id.slice(0, 10)}… · {formatShortDate(b.checkIn)} →{" "}
                                  {formatShortDate(b.checkOut)}
                                </p>
                              </div>
                            </td>
                            <td className="py-2 pr-2 text-xs">
                              <Link href={`/profile/${b.user.id}`} className="hover:underline">
                                {b.user.email}
                              </Link>
                            </td>
                            <td className="py-2 pr-2 text-xs">
                              <Link href={`/profile/${b.listing.hostId}`} className="hover:underline">
                                {b.listing.host.email}
                              </Link>
                            </td>
                            <td className="py-2 pr-2 text-xs whitespace-nowrap">{b.status}</td>
                            <td className="py-2 pr-2 text-xs whitespace-nowrap">${b.totalPrice}</td>
                            <td className="py-2 pr-2">
                              <div className="space-y-0.5 text-xs">
                                {type === "PAYIN" ? (
                                  <>
                                    <div className="text-[11px] text-[var(--muted)]">
                                      Checkout:{" "}
                                      {b.stripeCheckoutSessionId
                                        ? `${b.stripeCheckoutSessionId.slice(0, 10)}…`
                                        : "—"}
                                    </div>
                                    <div className="text-[11px] text-[var(--muted)]">
                                      Intent:{" "}
                                      {b.stripePaymentIntentId
                                        ? `${b.stripePaymentIntentId.slice(0, 10)}…`
                                        : "—"}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-[11px] text-[var(--muted)]">
                                    Transfer:{" "}
                                    {b.lastPayout?.stripeTransferId
                                      ? `${b.lastPayout.stripeTransferId.slice(0, 10)}…`
                                      : "—"}{" "}
                                    {b.lastPayout?.status ? `(${b.lastPayout.status})` : ""}
                                  </div>
                                )}
                                {stripeLink ? (
                                  <a
                                    href={stripeLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex text-[11px] font-semibold text-[var(--brand)] hover:underline"
                                  >
                                    Open in Stripe
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-[var(--muted)]">Stripe link unavailable</span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 pr-2">
                              <div className="space-y-0.5 text-xs">
                                <div className="text-[11px] text-[var(--muted)]">
                                  Fee:{" "}
                                  {typeof b.platformFeeAmount === "number"
                                    ? `$${(b.platformFeeAmount / 100).toFixed(2)}`
                                    : "—"}{" "}
                                  · Host:{" "}
                                  {typeof b.hostPayoutAmount === "number"
                                    ? `$${(b.hostPayoutAmount / 100).toFixed(2)}`
                                    : "—"}
                                </div>
                                <div className="text-[11px] text-[var(--muted)]">
                                  Payout status: <span className="font-semibold">{b.payoutStatus}</span>
                                  {b.payoutEligibleAt ? (
                                    <span> · eligible {formatShortDate(b.payoutEligibleAt)}</span>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                    {bookings.length === 0 ? (
                      <tr>
                        <td className="py-3 text-sm muted" colSpan={8}>
                          No bookings yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <PaginationFooter
                tab="payments"
                pageKey="bp"
                page={pagination.bp}
                total={bookingsCount}
                pageSize={pageSize}
                pages={pagination}
              />
            </section>
          ) : null}

          {tab === "stripe-keys" ? (
            <section
              id="admin-panel-stripe-keys"
              role="tabpanel"
              aria-labelledby="admin-tab-stripe-keys"
              className="rounded-2xl border border-[var(--border)] bg-white p-4"
            >
              <h2 className="mb-2 text-base font-semibold">Stripe keys</h2>
              <p className="muted mb-4 text-sm">
                Admin can set Stripe keys here. The server will use these values for Stripe API
                calls and webhook verification.
              </p>

              {stripeKeysErr ? (
                <p className="mb-3 text-sm text-red-600">{stripeKeysErr}</p>
              ) : null}

              <div className="mb-5 grid gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-semibold">Security warning</p>
                <p className="muted">
                  Storing secret keys in the database increases risk. If possible, prefer server
                  environment secrets. If you must store keys here, consider setting{" "}
                  <code className="rounded bg-white/60 px-1">APP_CONFIG_ENCRYPTION_KEY</code> on
                  the server to encrypt values at rest.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                  <p className="text-sm font-semibold text-neutral-900">Current status</p>
                  {stripeKeysBusy ? (
                    <p className="muted mt-2 text-sm">Loading…</p>
                  ) : stripeKeysStatus ? (
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="muted">
                        Configured:{" "}
                        <span className="font-semibold text-neutral-900">
                          {stripeKeysStatus.configured ? "Yes" : "No"}
                        </span>
                      </p>
                      <p className="muted">
                        Mode:{" "}
                        <span className="font-semibold text-neutral-900">
                          {stripeKeysStatus.mode ?? "—"}
                        </span>
                      </p>
                      <p className="muted">
                        Encrypted at rest:{" "}
                        <span className="font-semibold text-neutral-900">
                          {stripeKeysStatus.encrypted ? "Yes" : "No"}
                        </span>
                      </p>
                      <p className="muted">
                        Updated:{" "}
                        <span className="font-semibold text-neutral-900">
                          {stripeKeysStatus.updatedAt ?? "—"}
                        </span>
                      </p>
                      <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs">
                        <p className="muted">Secret key: {stripeKeysStatus.stripeSecretKeyMasked}</p>
                        <p className="muted">
                          Publishable key: {stripeKeysStatus.stripePublishableKeyMasked}
                        </p>
                        <p className="muted">
                          Webhook secret: {stripeKeysStatus.stripeWebhookSecretMasked}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="mt-2 inline-flex rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-50"
                        onClick={() => refresh()}
                      >
                        Refresh admin page
                      </button>
                    </div>
                  ) : (
                    <p className="muted mt-2 text-sm">No data.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                  <p className="text-sm font-semibold text-neutral-900">Update keys</p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-900">
                        STRIPE_SECRET_KEY (sk_…)
                      </label>
                      <input
                        value={stripeSecretKey}
                        onChange={(e) => setStripeSecretKey(e.target.value)}
                        placeholder="sk_test_... or sk_live_..."
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-900">
                        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_…) (optional)
                      </label>
                      <input
                        value={stripePublishableKey}
                        onChange={(e) => setStripePublishableKey(e.target.value)}
                        placeholder="pk_test_... or pk_live_..."
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-900">
                        STRIPE_WEBHOOK_SECRET (whsec_…)
                      </label>
                      <input
                        value={stripeWebhookSecret}
                        onChange={(e) => setStripeWebhookSecret(e.target.value)}
                        placeholder="whsec_..."
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={stripeKeysBusy}
                      className="brand-btn inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                      onClick={() => {
                        setStripeKeysErr("");
                        setStripeKeysBusy(true);
                        const payload: Record<string, string> = {};
                        if (stripeSecretKey.trim()) payload.stripeSecretKey = stripeSecretKey.trim();
                        if (stripePublishableKey.trim())
                          payload.stripePublishableKey = stripePublishableKey.trim();
                        if (stripeWebhookSecret.trim())
                          payload.stripeWebhookSecret = stripeWebhookSecret.trim();
                        if (Object.keys(payload).length === 0) {
                          setStripeKeysErr("Enter at least one key to save.");
                          setStripeKeysBusy(false);
                          return;
                        }
                        void fetch(withBasePath("/api/admin/stripe-keys"), {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(payload),
                        })
                          .then(async (r) => {
                            const d = (await r.json().catch(() => ({}))) as { error?: string };
                            if (!r.ok) throw new Error(d.error ?? "Save failed.");
                            setStripeSecretKey("");
                            setStripePublishableKey("");
                            setStripeWebhookSecret("");
                            flashNotice("Stripe keys saved.");
                            // Reload status
                            const res = await fetch(withBasePath("/api/admin/stripe-keys"));
                            const dd = (await res.json().catch(() => ({}))) as { data?: unknown; error?: string };
                            if (res.ok) setStripeKeysStatus(dd.data as typeof stripeKeysStatus);
                          })
                          .catch((e) =>
                            setStripeKeysErr(e instanceof Error ? e.message : "Save failed."),
                          )
                          .finally(() => setStripeKeysBusy(false));
                      }}
                    >
                      {stripeKeysBusy ? "Saving…" : "Save keys"}
                    </button>
                    <p className="muted text-xs">
                      After saving, restart the server process in production to ensure all workers
                      pick up the new configuration.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {tab === "listings" ? (
            <section
              id="admin-panel-listings"
              role="tabpanel"
              aria-labelledby="admin-tab-listings"
              className="rounded-2xl border border-[var(--border)] bg-white p-4"
            >
              <h2 className="mb-3 text-base font-semibold">Listing management</h2>
              <p className="muted mb-3 text-sm">
                Unpublish notifies the host with listing, profile, and listings-tab links. Cover and host link through
                to the public listing and profile.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                      <th className="py-2 pr-2">Listing</th>
                      <th className="py-2 pr-2">Host</th>
                      <th className="py-2 pr-2">Status</th>
                      <th className="py-2 pr-2">Price</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((l) => (
                      <tr key={l.id} className="border-b border-[var(--border)]">
                        <td className="max-w-[260px] py-2 pr-2">
                          <div className="flex min-w-0 items-center gap-3">
                            <Link href={`/listing/${l.id}`} className="relative h-12 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-[var(--border)]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={l.coverImageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </Link>
                            <div className="min-w-0">
                              <Link
                                href={`/listing/${l.id}`}
                                className="block cursor-pointer truncate font-medium text-neutral-900 hover:underline"
                              >
                                {l.title}
                              </Link>
                              <Link
                                href={`/profile/${l.hostId}`}
                                className="text-xs text-[var(--muted)] hover:underline"
                              >
                                Host profile
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 pr-2 align-top">
                          <div className="flex min-w-0 items-center gap-2">
                            <Link href={`/profile/${l.host.id}`} className="shrink-0 cursor-pointer">
                              <AdminAvatar
                                avatarUrl={l.host.avatarUrl}
                                label={l.host.name?.trim() || l.host.email}
                                size="sm"
                              />
                            </Link>
                            <div className="min-w-0">
                              <Link
                                href={`/profile/${l.host.id}`}
                                className="block cursor-pointer truncate text-xs hover:underline"
                              >
                                {l.host.email}
                              </Link>
                              <button
                                type="button"
                                className="mt-0.5 cursor-pointer text-left text-xs font-semibold text-[var(--brand)] hover:underline"
                                onClick={() => {
                                  setMessageUserId(l.host.id);
                                  setMessageBody("");
                                  setMessageErr("");
                                }}
                              >
                                Message host
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 pr-2 text-xs">{l.status}</td>
                        <td className="py-2 pr-2 text-xs">{formatMoney(l.pricePerNight)}/night</td>
                        <td className="py-2 align-top text-right">
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              className="cursor-pointer rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 disabled:opacity-50"
                              disabled={l.status === "UNPUBLISHED"}
                              onClick={() =>
                                openReasonModal("Unpublish listing", "Unpublish", async (reason) => {
                                  const res = await fetch(
                                    withBasePath(`/api/admin/listings/${l.id}/unpublish`),
                                    {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ reason }),
                                    },
                                  );
                                  if (!res.ok) {
                                    const d = (await res.json()) as { error?: string };
                                    throw new Error(d.error ?? "Unpublish failed.");
                                  }
                                })
                              }
                            >
                              Unpublish
                            </button>
                            <button
                              type="button"
                              className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-800"
                              onClick={() =>
                                openReasonModal("Remove listing", "Remove listing", async (reason) => {
                                  const res = await fetch(
                                    withBasePath(`/api/admin/listings/${l.id}/remove`),
                                    {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ reason }),
                                    },
                                  );
                                  if (!res.ok) {
                                    const d = (await res.json()) as { error?: string };
                                    throw new Error(d.error ?? "Remove failed.");
                                  }
                                })
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationFooter
                tab="listings"
                pageKey="lp"
                page={pagination.lp}
                total={listingsCount}
                pageSize={pageSize}
                pages={pagination}
              />
            </section>
          ) : null}

          {tab === "reviews" ? (
            <section
              id="admin-panel-reviews"
              role="tabpanel"
              aria-labelledby="admin-tab-reviews"
              className="rounded-2xl border border-[var(--border)] bg-white p-4"
            >
              <h2 className="mb-3 text-base font-semibold">Reviews</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                      <th className="py-2 pr-2">Listing</th>
                      <th className="py-2 pr-2">Guest</th>
                      <th className="py-2 pr-2">Host</th>
                      <th className="py-2 pr-2">Rating</th>
                      <th className="py-2">Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReviews.map((review) => (
                      <tr key={review.id} className="border-b border-[var(--border)]">
                        <td className="py-2 pr-2 align-top">
                          <div className="flex min-w-0 items-center gap-2">
                            <Link
                              href={`/listing/${review.listing.id}`}
                              className="relative h-12 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-[var(--border)]"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={review.listing.coverImageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </Link>
                            <Link
                              href={`/listing/${review.listing.id}`}
                              className="min-w-0 cursor-pointer truncate font-medium hover:underline"
                            >
                              {review.listing.title}
                            </Link>
                          </div>
                        </td>
                        <td className="py-2 pr-2 align-top">
                          <div className="flex items-center gap-2">
                            <Link href={`/profile/${review.guest.id}`} className="shrink-0 cursor-pointer">
                              <AdminAvatar
                                avatarUrl={review.guest.avatarUrl}
                                label={review.guest.name?.trim() || review.guest.email}
                                size="sm"
                              />
                            </Link>
                            <Link
                              href={`/profile/${review.guest.id}`}
                              className="min-w-0 cursor-pointer truncate text-xs hover:underline"
                            >
                              {review.guest.email}
                            </Link>
                          </div>
                        </td>
                        <td className="py-2 pr-2 align-top">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/profile/${review.listing.host.id}`}
                              className="shrink-0 cursor-pointer"
                            >
                              <AdminAvatar
                                avatarUrl={review.listing.host.avatarUrl}
                                label={review.listing.host.name?.trim() || review.listing.host.email}
                                size="sm"
                              />
                            </Link>
                            <Link
                              href={`/profile/${review.listing.host.id}`}
                              className="min-w-0 cursor-pointer truncate text-xs hover:underline"
                            >
                              {review.listing.host.email}
                            </Link>
                          </div>
                        </td>
                        <td className="py-2 pr-2 align-top whitespace-nowrap">
                          <FiveStars rating={review.rating} />
                          <span className="ml-1 text-xs text-[var(--muted)]">{review.rating}/5</span>
                        </td>
                        <td className="py-2 align-top text-neutral-800">{review.comment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationFooter
                tab="reviews"
                pageKey="rp"
                page={pagination.rp}
                total={reviewsCount}
                pageSize={pageSize}
                pages={pagination}
              />
            </section>
          ) : null}
        </div>
      </div>

      {messageUserId ? (
        <Modal
          title="Send platform message"
          onClose={() => {
            setMessageUserId(null);
            setMessageBody("");
            setMessageErr("");
          }}
        >
          <p className="muted text-xs">
            Delivered in this user’s Admin support thread (same as regular support chat).
          </p>
          <textarea
            className="mt-2 w-full rounded-xl border border-[var(--border)] p-3 text-sm outline-none focus:border-neutral-500"
            rows={5}
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Write your message…"
          />
          {messageErr ? <p className="mt-2 text-xs text-red-600">{messageErr}</p> : null}
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              className="cursor-pointer rounded-lg border px-3 py-1.5 text-sm"
              onClick={() => {
                setMessageUserId(null);
                setMessageBody("");
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={messageBusy || !messageBody.trim()}
              className="cursor-pointer rounded-lg bg-[var(--brand)] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              onClick={() => void submitMessage()}
            >
              {messageBusy ? "Sending…" : "Send"}
            </button>
          </div>
        </Modal>
      ) : null}

      {reasonModal ? (
        <Modal
          title={reasonModal.title}
          onClose={() => {
            setReasonModal(null);
            setReasonErr("");
          }}
        >
          <textarea
            className="w-full rounded-xl border border-[var(--border)] p-3 text-sm outline-none focus:border-neutral-500"
            rows={4}
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Reason shown to users (and may be included in automatic notices)…"
          />
          {reasonErr ? <p className="mt-2 text-xs text-red-600">{reasonErr}</p> : null}
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              className="cursor-pointer rounded-lg border px-3 py-1.5 text-sm"
              onClick={() => setReasonModal(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={reasonBusy}
              className="cursor-pointer rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              onClick={() => void submitReason()}
            >
              {reasonBusy ? "Working…" : reasonModal.submitLabel}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
