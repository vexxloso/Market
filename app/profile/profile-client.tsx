"use client";

import { BookingStatus, ListingStatus, StayType, UserRole } from "@prisma/client";
import { withBasePath } from "@/lib/app-origin";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HostAccountShell,
  type AccountTab,
} from "@/components/host-account-shell";
import { HostListingsPanel } from "@/components/host-listings-panel";
import {
  IconBriefcase,
  IconMessages,
  PROMPT_ICONS,
} from "@/components/profile-airbnb-icons";
import {
  PROFILE_GRID_LEFT,
  PROFILE_GRID_RIGHT,
  PROFILE_PROMPTS,
  type ProfilePromptKey,
} from "@/lib/profile-shared";
import ProfileMessagesClient from "@/components/profile-messages-client";
import { BookingAcceptButton } from "@/components/booking-accept-button";
import { FiveStarIcons } from "@/components/star-rating-display";

const REVIEWS_WRITTEN_PREVIEW = 5;

type ListingItem = {
  id: string;
  title: string;
  description: string;
  stayType: StayType;
  location: string;
  country: string;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  imageUrl: string;
  imageUrls: string[];
  status: ListingStatus;
};

type BookingItem = {
  id: string;
  checkIn: string | Date;
  checkOut: string | Date;
  status: BookingStatus;
  totalPrice: number;
  listing: {
    id: string;
    title: string;
    location: string;
    country: string;
    imageUrl: string;
  };
};

type TripBookingItem = BookingItem & {
  host: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
};

type HostIncomingBookingItem = BookingItem & {
  guest: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
};

type ProfilePublic = {
  name: string | null;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  work: string | null;
  role: UserRole;
  profileAnswers: Record<ProfilePromptKey, string>;
};

type ReviewWrittenItem = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    coverImageUrl: string | null;
    host: {
      id: string;
      name: string | null;
      email: string;
      avatarUrl: string | null;
    };
  };
};

function roleLabel(role: UserRole) {
  if (role === UserRole.HOST || role === UserRole.ADMIN) return "Host";
  return "Guest";
}

function hostChipInitial(name: string | null | undefined, email: string) {
  const base = (name?.trim() || email).charAt(0);
  return base ? base.toUpperCase() : "?";
}

function profileInitial(profile: ProfilePublic) {
  const base = (profile.name?.trim() || profile.email).charAt(0);
  return base ? base.toUpperCase() : "?";
}

const BOOKING_STATUS_BADGE: Record<
  BookingStatus,
  { className: string; label: string }
> = {
  PENDING: {
    className: "border-amber-300 bg-amber-100 text-amber-950",
    label: "Pending",
  },
  ACCEPTED: {
    className: "border-sky-300 bg-sky-100 text-sky-950",
    label: "Accepted",
  },
  PAID: {
    className: "border-emerald-300 bg-emerald-100 text-emerald-950",
    label: "Paid",
  },
  CANCELLED: {
    className: "border-red-300 bg-red-50 text-red-800",
    label: "Canceled",
  },
  COMPLETED: {
    className: "border-violet-300 bg-violet-100 text-violet-950",
    label: "Completed",
  },
};

function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const cfg = BOOKING_STATUS_BADGE[status];
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

/** Full card chrome: background + border + ring by booking status */
const BOOKING_CARD_SURFACE: Record<BookingStatus, string> = {
  PENDING:
    "border-amber-200/95 bg-amber-50/95 shadow-sm ring-1 ring-amber-100/80",
  ACCEPTED: "border-sky-200/95 bg-sky-50/95 shadow-sm ring-1 ring-sky-100/80",
  PAID: "border-emerald-200/95 bg-emerald-50/95 shadow-sm ring-1 ring-emerald-100/80",
  CANCELLED:
    "border-red-200/95 bg-red-50/90 shadow-sm ring-1 ring-red-100/70 saturate-75",
  COMPLETED:
    "border-violet-200/95 bg-violet-50/92 shadow-sm ring-1 ring-violet-100/80",
};

function bookingCardClass(status: BookingStatus) {
  return `overflow-hidden rounded-2xl ${BOOKING_CARD_SURFACE[status]}`;
}

function BookingProfileLinkChip({
  userId,
  name,
  email,
  avatarUrl,
  subtitle,
}: {
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  subtitle: string;
}) {
  const label = name?.trim() || email;
  const initial = (name?.trim()?.[0] ?? email[0] ?? "?").toUpperCase();
  return (
    <Link
      href={`/profile/${userId}`}
      className="flex min-w-0 max-w-full items-center gap-2 rounded-xl py-1 pr-2 transition hover:bg-neutral-100/90"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="h-10 w-10 shrink-0 rounded-full border border-[var(--border)] object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand)]">
          {initial}
        </div>
      )}
      <div className="min-w-0 text-left">
        <p className="text-xs font-medium text-[var(--muted)]">{subtitle}</p>
        <p className="truncate text-sm font-semibold text-neutral-900">{label}</p>
      </div>
    </Link>
  );
}

function BookingCoverLink({
  listingId,
  imageUrl,
  title,
}: {
  listingId: string;
  imageUrl: string;
  title: string;
}) {
  return (
    <Link
      href={`/listing/${listingId}`}
      className="relative block h-40 w-full shrink-0 overflow-hidden rounded-xl bg-neutral-200 sm:h-36 sm:w-44"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        className="h-full w-full object-cover transition duration-300 hover:scale-105"
      />
      <span className="sr-only">{title} cover</span>
    </Link>
  );
}

function ReviewStarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-pressed={n <= value}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          className="rounded p-0.5 text-amber-400 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
        >
          <svg
            className={`h-8 w-8 ${n <= value ? "text-amber-400" : "text-neutral-200"}`}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>
      ))}
      <span className="ml-2 text-sm font-semibold tabular-nums text-amber-700">
        {value}/5
      </span>
    </div>
  );
}

function PromptRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[#EBEBEB] py-5 first:pt-0">
      <span className="mt-0.5 text-neutral-800">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[#717171]">{label}</p>
        <p className="mt-1 truncate text-sm text-neutral-900">{value.trim()}</p>
      </div>
    </div>
  );
}

function BookingReviewForm({
  bookingId,
  onSubmitted,
}: {
  bookingId: string;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-3 space-y-3 rounded-xl border border-[var(--border)] bg-neutral-50 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        if (!comment.trim()) {
          setError("Please write a short comment.");
          return;
        }
        setBusy(true);
        try {
          const res = await fetch(withBasePath(`/api/bookings/${bookingId}/review`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rating, comment }),
          });
          if (!res.ok) {
            const data = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            setError(data.error ?? "Failed to submit review.");
            return;
          }
          onSubmitted();
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="block text-sm font-semibold text-neutral-900">
        Your rating
      </label>
      <ReviewStarPicker value={rating} onChange={setRating} />

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="What was your stay like?"
        className="min-h-[90px] w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="brand-btn w-full rounded-xl py-2 font-semibold text-white"
      >
        {busy ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}

export function ProfileClient({
  session,
  profile,
  reviewsWritten = [],
  listings = [],
  tripBookings = [],
  hostIncomingBookings = [],
  hostPayoutStatus = null,
  initialTab,
  initialMessageBookingId,
}: {
  session: {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
    canManageListings: boolean;
  };
  profile: ProfilePublic | null;
  reviewsWritten?: ReviewWrittenItem[];
  listings?: ListingItem[];
  tripBookings?: TripBookingItem[];
  hostIncomingBookings?: HostIncomingBookingItem[];
  /** Stripe Connect / payout verification (hosts & admins who list). */
  hostPayoutStatus?: {
    verified: boolean;
    canPublishListings: boolean;
    stripeConnectStatus: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    hasStripeAccount: boolean;
  } | null;
  initialTab: AccountTab;
  initialMessageBookingId?: string;
}) {
  const router = useRouter();
  const [showAllWrittenReviews, setShowAllWrittenReviews] = useState(false);
  const [stripeStatusBusy, setStripeStatusBusy] = useState(false);
  const formatDate = (value: string | Date) =>
    new Date(value).toISOString().slice(0, 10);

  const reviewsWrittenVisible =
    showAllWrittenReviews || reviewsWritten.length <= REVIEWS_WRITTEN_PREVIEW
      ? reviewsWritten
      : reviewsWritten.slice(0, REVIEWS_WRITTEN_PREVIEW);
  const hasMoreWrittenReviews =
    reviewsWritten.length > REVIEWS_WRITTEN_PREVIEW;

  return (
    <HostAccountShell activeTab={initialTab}>
      <div className="w-full py-8 px-6 sm:px-10">
        {initialTab === "profile" && !profile && (
          <section className="w-full max-w-none rounded-2xl border border-[var(--border)] bg-white p-8 text-sm text-[var(--muted)]">
            Profile could not be loaded.
          </section>
        )}

        {initialTab === "profile" && profile && (
          <section className="w-full max-w-none bg-white px-0 py-2 sm:px-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                About me
              </h1>
              <Link
                href="/profile/edit"
                className="rounded-full bg-[#F0F0F0] px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-[#E4E4E4]"
              >
                Edit
              </Link>
            </div>

            <div className="mt-10 flex flex-col gap-10 sm:flex-row sm:items-start sm:gap-14">
              <div className="flex justify-center sm:justify-start">
                <div className="w-full max-w-[280px] rounded-[24px] bg-white px-10 py-9 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt=""
                      className="mx-auto h-28 w-28 rounded-full border border-[#EBEBEB] object-cover"
                    />
                  ) : (
                    <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-[var(--brand-soft-border-light)] bg-[var(--brand-soft)] text-3xl font-semibold text-[var(--brand)]">
                      {profileInitial(profile)}
                    </div>
                  )}
                  <p className="mt-5 text-xl font-semibold text-black">
                    {profile.name?.trim() || profile.email.split("@")[0]}
                  </p>
                  <p className="mt-1 text-sm text-[#717171]">{roleLabel(profile.role)}</p>
                  {session.canManageListings && hostPayoutStatus ? (
                    <div className="mt-4 rounded-xl border border-[#EBEBEB] bg-neutral-50 px-4 py-3 text-left text-sm">
                      <p className="font-semibold text-neutral-900">Payout verification</p>
                      <p className="mt-1 text-[#717171]">
                        {hostPayoutStatus.verified ? (
                          <span className="font-medium text-emerald-700">
                            Verified — you can publish listings.
                          </span>
                        ) : hostPayoutStatus.canPublishListings ? (
                          <span>
                            Stripe not fully connected — you can still publish (admin). Connect when you want
                            payouts.
                          </span>
                        ) : (
                          <span>
                            Not verified — connect Stripe to publish. You can still create drafts.
                          </span>
                        )}
                      </p>
                      <ul className="mt-2 space-y-0.5 text-xs text-[#717171]">
                        <li>Stripe: {hostPayoutStatus.stripeConnectStatus}</li>
                        <li>
                          Charges {hostPayoutStatus.chargesEnabled ? "on" : "off"} · Payouts{" "}
                          {hostPayoutStatus.payoutsEnabled ? "on" : "off"}
                          {hostPayoutStatus.detailsSubmitted ? "" : " · Details incomplete"}
                        </li>
                      </ul>
                      {!hostPayoutStatus.verified ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link
                            href="/host/connect"
                            className="inline-flex rounded-lg bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
                          >
                            {hostPayoutStatus.canPublishListings
                              ? "Connect Stripe (payouts)"
                              : "Connect payouts"}
                          </Link>
                          {hostPayoutStatus.hasStripeAccount ? (
                            <button
                              type="button"
                              disabled={stripeStatusBusy}
                              onClick={() => {
                                setStripeStatusBusy(true);
                                void fetch(withBasePath("/api/stripe/connect/status"))
                                  .finally(() => {
                                    setStripeStatusBusy(false);
                                    router.refresh();
                                  });
                              }}
                              className="inline-flex rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
                            >
                              {stripeStatusBusy ? "Refreshing…" : "Refresh status"}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-6 pt-1">
                <div className="flex items-start gap-3 text-base text-neutral-900">
                  <IconBriefcase className="mt-0.5 h-5 w-5 shrink-0 text-neutral-800" />
                  <p>
                    <span className="font-medium">My work: </span>
                    <span className={profile.work?.trim() ? "" : "text-[#717171]"}>
                      {profile.work?.trim() || "Add what you do"}
                    </span>
                  </p>
                </div>
                {profile.bio?.trim() ? (
                  <p className="max-w-xl text-[15px] leading-relaxed text-neutral-800">
                    {profile.bio.trim()}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-10 grid gap-0 md:grid-cols-2 md:gap-x-12">
              <div>
                {PROFILE_GRID_LEFT.filter((key) =>
                  (profile.profileAnswers[key] ?? "").trim(),
                ).map((key) => (
                  <PromptRow
                    key={key}
                    icon={PROMPT_ICONS[key]({ className: "h-5 w-5" })}
                    label={PROFILE_PROMPTS[key]}
                    value={profile.profileAnswers[key] ?? ""}
                  />
                ))}
              </div>
              <div>
                {PROFILE_GRID_RIGHT.filter((key) =>
                  (profile.profileAnswers[key] ?? "").trim(),
                ).map((key) => (
                  <PromptRow
                    key={key}
                    icon={PROMPT_ICONS[key]({ className: "h-5 w-5" })}
                    label={PROFILE_PROMPTS[key]}
                    value={profile.profileAnswers[key] ?? ""}
                  />
                ))}
              </div>
            </div>

            <hr className="my-12 border-[#EBEBEB]" />

            <div>
              <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                <IconMessages className="h-6 w-6 text-neutral-800" />
                Reviews I&apos;ve written
              </div>
              {reviewsWritten.length === 0 ? (
                <p className="mt-4 text-sm text-[#717171]">You haven&apos;t written any reviews yet.</p>
              ) : (
                <div className="mt-6 space-y-4">
                  <ul className="space-y-4">
                    {reviewsWrittenVisible.map((r) => (
                      <li
                        key={r.id}
                        className="flex gap-3 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] p-4 sm:gap-4 sm:p-5"
                      >
                        <Link
                          href={`/listing/${r.listing.id}`}
                          className="relative shrink-0 overflow-hidden rounded-xl border border-[#EBEBEB] bg-neutral-100"
                          aria-label={`${r.listing.title} — view listing`}
                        >
                          {r.listing.coverImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={r.listing.coverImageUrl}
                              alt=""
                              className="h-20 w-28 object-cover sm:h-[5.5rem] sm:w-32"
                            />
                          ) : (
                            <div className="flex h-20 w-28 items-center justify-center sm:h-[5.5rem] sm:w-32">
                              <span className="px-2 text-center text-xs text-neutral-500">
                                No cover
                              </span>
                            </div>
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-neutral-900">
                            <Link
                              href={`/listing/${r.listing.id}`}
                              className="hover:underline"
                            >
                              {r.listing.title}
                            </Link>
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#717171]">
                            <FiveStarIcons rating={r.rating} sizeClass="h-4 w-4" />
                            <span className="font-semibold tabular-nums text-amber-700">
                              {r.rating}/5
                            </span>
                            <span>· {r.createdAt.slice(0, 10)}</span>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                            {r.comment}
                          </p>
                        </div>
                        <Link
                          href={`/profile/${r.listing.host.id}`}
                          className="flex shrink-0 flex-col items-center gap-1.5 self-start pt-0.5 text-center"
                          aria-label={`Host: ${r.listing.host.name ?? r.listing.host.email}`}
                        >
                          {r.listing.host.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={r.listing.host.avatarUrl}
                              alt=""
                              className="h-12 w-12 rounded-full border border-[#EBEBEB] object-cover sm:h-14 sm:w-14"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--brand-soft-border-light)] bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand)] sm:h-14 sm:w-14 sm:text-base">
                              {hostChipInitial(
                                r.listing.host.name,
                                r.listing.host.email,
                              )}
                            </div>
                          )}
                          <span className="max-w-[5.5rem] text-xs font-medium leading-tight text-neutral-900 sm:max-w-[6.5rem]">
                            <span className="line-clamp-2">
                              {r.listing.host.name?.trim() ||
                                r.listing.host.email.split("@")[0]}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {hasMoreWrittenReviews ? (
                    <button
                      type="button"
                      onClick={() =>
                        setShowAllWrittenReviews((open) => !open)
                      }
                      className="w-full rounded-xl border border-[var(--brand-soft-border)] bg-[var(--brand-soft)] py-2.5 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft-hover)]"
                    >
                      {showAllWrittenReviews
                        ? "Show less"
                        : `Show all ${reviewsWritten.length} reviews`}
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            {session.role === "GUEST" && (
              <div className="mt-10">
                <Link
                  href="/become-host"
                  className="inline-block rounded-lg border border-[var(--brand-soft-border)] bg-[var(--brand-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft-hover)]"
                >
                  Become a host
                </Link>
              </div>
            )}
          </section>
        )}

        {initialTab === "bookings" && (
          <section className="w-full max-w-none space-y-10">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Bookings
            </h1>

            {session.canManageListings ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-amber-950">
                    Incoming reservations
                  </h2>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                    Hosting
                  </span>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  Guests who requested stays at your listings appear here.
                </p>
                {hostIncomingBookings.length === 0 ? (
                  <div className="rounded-2xl border border-amber-200/90 bg-amber-50/60 p-8 text-sm text-amber-950/80">
                    No incoming reservations yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {hostIncomingBookings.map((booking) => (
                      <article
                        key={booking.id}
                        className={bookingCardClass(booking.status)}
                      >
                        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-5">
                          <BookingCoverLink
                            listingId={booking.listing.id}
                            imageUrl={booking.listing.imageUrl}
                            title={booking.listing.title}
                          />
                          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <BookingStatusBadge status={booking.status} />
                                <span className="text-xs font-medium text-neutral-800">
                                  ${booking.totalPrice} total
                                </span>
                              </div>
                              <p className="mt-2 font-semibold text-neutral-900">
                                {booking.listing.title}
                              </p>
                              <p className="mt-1 text-sm text-[var(--muted)]">
                                {booking.listing.location}, {booking.listing.country}
                              </p>
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <BookingProfileLinkChip
                                userId={booking.guest.id}
                                name={booking.guest.name}
                                email={booking.guest.email}
                                avatarUrl={booking.guest.avatarUrl}
                                subtitle="Guest"
                              />
                              {booking.status !== BookingStatus.CANCELLED ? (
                                <Link
                                  href={`/profile?tab=messages&booking=${booking.id}`}
                                  className="inline-flex items-center rounded-lg border border-amber-800/30 bg-white px-3 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100/80"
                                >
                                  Send message
                                </Link>
                              ) : null}
                            </div>
                              <p className="mt-2 text-sm text-neutral-900">
                                {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
                              </p>
                              <Link
                                href={`/listing/${booking.listing.id}`}
                                className="mt-3 inline-flex text-sm font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950"
                              >
                                View listing
                              </Link>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                              <BookingAcceptButton
                                bookingId={booking.id}
                                status={booking.status}
                              />
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-sky-950">
                  Your trips
                </h2>
                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-900">
                  Guest
                </span>
              </div>
              <p className="text-sm text-[var(--muted)]">
                Places you&apos;ve booked as a guest.
              </p>
              {tripBookings.length === 0 ? (
                <div className="rounded-2xl border border-sky-200/90 bg-sky-50/50 p-8 text-sm text-sky-950/80">
                  No trips yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {tripBookings.map((booking) => (
                    <article
                      key={booking.id}
                      className={bookingCardClass(booking.status)}
                    >
                      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-5">
                        <BookingCoverLink
                          listingId={booking.listing.id}
                          imageUrl={booking.listing.imageUrl}
                          title={booking.listing.title}
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <BookingStatusBadge status={booking.status} />
                              <span className="text-xs font-medium text-neutral-800">
                                ${booking.totalPrice} total
                              </span>
                            </div>
                            <p className="mt-2 font-semibold text-neutral-900">
                              {booking.listing.title}
                            </p>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                              {booking.listing.location}, {booking.listing.country}
                            </p>
                            <p className="mt-2 text-sm text-neutral-900">
                              {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
                            </p>
                            <Link
                              href={`/listing/${booking.listing.id}`}
                              className="mt-3 inline-flex text-sm font-semibold text-sky-800 underline underline-offset-2 hover:text-sky-950"
                            >
                              View details
                            </Link>
                            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-4">
                              <BookingProfileLinkChip
                                userId={booking.host.id}
                                name={booking.host.name}
                                email={booking.host.email}
                                avatarUrl={booking.host.avatarUrl}
                                subtitle="Host"
                              />
                              {booking.status !== BookingStatus.CANCELLED ? (
                                <Link
                                  href={`/profile?tab=messages&booking=${booking.id}`}
                                  className="inline-flex items-center rounded-lg border border-sky-400/60 bg-white px-3 py-2 text-xs font-semibold text-sky-950 hover:bg-sky-100/80"
                                >
                                  Message host
                                </Link>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 sm:justify-end">
                            {booking.status === BookingStatus.PENDING ||
                            booking.status === BookingStatus.ACCEPTED ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  await fetch(withBasePath(`/api/bookings/${booking.id}/cancel`), {
                                    method: "POST",
                                  });
                                  router.refresh();
                                }}
                                className="rounded-lg border border-sky-300 bg-white px-4 py-2 text-xs font-semibold text-sky-950 hover:bg-sky-50"
                              >
                                Cancel
                              </button>
                            ) : null}

                            {booking.status === BookingStatus.ACCEPTED ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  const res = await fetch(withBasePath("/api/payments/checkout"), {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ bookingId: booking.id }),
                                  });
                                  const data = (await res.json().catch(() => ({}))) as {
                                    checkoutUrl?: string;
                                    error?: string;
                                  };
                                  if (!res.ok || !data.checkoutUrl) {
                                    alert(data.error ?? "Could not start checkout.");
                                    return;
                                  }
                                  const tab = window.open(data.checkoutUrl, "_blank", "noopener,noreferrer");
                                  if (!tab) {
                                    alert(
                                      "Popup blocked. Please allow popups for this site, then click Pay again.",
                                    );
                                    return;
                                  }
                                  // Keep the profile page visible. Refresh when the user returns.
                                  const onReturn = () => {
                                    window.removeEventListener("focus", onReturn);
                                    document.removeEventListener("visibilitychange", onVis);
                                    router.refresh();
                                  };
                                  const onVis = () => {
                                    if (document.visibilityState === "visible") onReturn();
                                  };
                                  window.addEventListener("focus", onReturn);
                                  document.addEventListener("visibilitychange", onVis);
                                }}
                                className="rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800"
                              >
                                Pay
                              </button>
                            ) : null}
                          </div>

                          {booking.status === BookingStatus.PAID &&
                          new Date(booking.checkOut) <= new Date() ? (
                            <BookingReviewForm
                              bookingId={booking.id}
                              onSubmitted={() => router.refresh()}
                            />
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {initialTab === "listings" && (
          <section className="w-full max-w-none px-0">
            <HostListingsPanel
              listings={listings}
              canManageListings={session.canManageListings}
              canPublishListings={hostPayoutStatus?.canPublishListings ?? false}
            />
          </section>
        )}

        {initialTab === "messages" && (
          <section className="w-full max-w-none p-0">
            <ProfileMessagesClient
              session={{ id: session.id, role: session.role }}
              initialBookingId={initialMessageBookingId}
            />
          </section>
        )}
      </div>
    </HostAccountShell>
  );
}
