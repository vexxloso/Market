"use client";

import { withBasePath } from "@/lib/app-origin";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ListingStatus, StayType } from "@prisma/client";
import { STRIPE_CONNECT_REQUIRED_CODE } from "@/lib/host-stripe-payout";

export type HostListingCard = {
  id: string;
  title: string;
  stayType: StayType;
  location: string;
  country: string;
  imageUrl: string;
  imageUrls?: string[];
  status: ListingStatus;
};

function stayTypePhrase(stayType: StayType): string {
  switch (stayType) {
    case "HOTEL_ROOM":
      return "Hotel room";
    case "BNB_ROOM":
      return "B&B room";
    case "RENTAL_ROOM":
      return "Rental room";
    default:
      return "Home";
  }
}

function badgeForStatus(status: ListingStatus): {
  label: string;
  dotClass: string;
} | null {
  switch (status) {
    case "INCOMPLETE":
      return { label: "In progress", dotClass: "bg-orange-500" };
    case "UNPUBLISHED":
      return { label: "Action required", dotClass: "bg-red-500" };
    case "PUBLISHED":
      return { label: "Listed", dotClass: "bg-emerald-600" };
    default:
      return null;
  }
}

function cardHref(listing: HostListingCard): string {
  if (listing.status === "PUBLISHED") {
    return `/listing/${listing.id}`;
  }
  return `/host/new?draftId=${listing.id}`;
}

function coverImageUrl(listing: HostListingCard): string | null {
  const fromArray = (listing.imageUrls ?? []).find((u) => u?.trim());
  if (fromArray) return fromArray;
  if (listing.imageUrl?.trim()) return listing.imageUrl;
  return null;
}

export function HostListingsPanel({
  listings = [],
  canManageListings,
  canPublishListings = false,
}: {
  listings?: HostListingCard[];
  canManageListings: boolean;
  /** False for hosts until Stripe Connect is ready; admins are true without Connect. */
  canPublishListings?: boolean;
}) {
  const router = useRouter();
  const [denseGrid, setDenseGrid] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(
    null,
  );

  function redirectToStripeConnect() {
    window.location.href = withBasePath("/host/connect");
  }

  async function patchListingStatus(listingId: string, status: ListingStatus) {
    setActionError(null);
    setBusyId(listingId);
    try {
      if (status === ListingStatus.PUBLISHED && !canPublishListings) {
        redirectToStripeConnect();
        return;
      }
      const res = await fetch(withBasePath(`/api/listings/${listingId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await res.json()) as { error?: string; code?: string };
      if (!res.ok) {
        if (
          res.status === 403 &&
          payload.code === STRIPE_CONNECT_REQUIRED_CODE
        ) {
          redirectToStripeConnect();
          return;
        }
        setActionError({ id: listingId, message: payload.error ?? "Something went wrong." });
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  function onUnpublish(listingId: string) {
    if (
      !confirm(
        "Unpublish this listing? Guests will no longer find it in search until you publish again.",
      )
    ) {
      return;
    }
    void patchListingStatus(listingId, ListingStatus.UNPUBLISHED);
  }

  if (!canManageListings) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-white p-6">
        <p className="text-sm text-[var(--muted)]">
          Become a host to create and manage listings.
        </p>
        <Link
          href="/become-host"
          className="mt-4 inline-block rounded-lg border border-[var(--brand-soft-border)] bg-[var(--brand-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft-hover)]"
        >
          Become a host
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">Your listings</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDenseGrid((g) => !g)}
            className={`grid h-10 w-10 place-items-center rounded-full border bg-white text-neutral-800 transition ${
              denseGrid ? "border-[var(--brand)]" : "border-neutral-300"
            }`}
            aria-label={denseGrid ? "Switch to list view" : "Switch to grid view"}
            title={denseGrid ? "List view" : "Grid view"}
          >
            {denseGrid ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            )}
          </button>
          <Link
            href="/host/new"
            className="grid h-10 w-10 place-items-center rounded-full border border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand-soft-hover)]"
            aria-label="Create listing"
            title="Create listing"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
      </div>

      {listings.length === 0 ? (
        <p className="mt-10 text-sm text-[var(--muted)]">No listings yet. Create your first one.</p>
      ) : (
        <ul
          className={
            denseGrid
              ? "mt-8 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3"
              : "mt-8 flex list-none flex-col gap-4"
          }
        >
          {listings.map((listing) => {
            const src = coverImageUrl(listing);
            const badge = badgeForStatus(listing.status);
            const subtitle = `${stayTypePhrase(listing.stayType)} in ${listing.location}, ${listing.country}`;

            return (
              <li key={listing.id}>
                <div
                  className={`overflow-hidden rounded-2xl bg-white ${
                    denseGrid
                      ? "border border-transparent transition hover:border-[var(--border)] hover:shadow-sm"
                      : "flex flex-col gap-0 border border-[var(--border)] p-3 shadow-sm sm:flex-row"
                  }`}
                >
                  <Link
                    href={cardHref(listing)}
                    className={`group block min-w-0 flex-1 ${
                      denseGrid ? "" : "flex gap-4 sm:items-stretch"
                    }`}
                  >
                    <div
                      className={`relative w-full overflow-hidden bg-neutral-200 ${
                        denseGrid ? "aspect-[4/3]" : "h-36 w-full shrink-0 rounded-xl sm:h-36 sm:w-48"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {src ? (
                        <img
                          src={src}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover transition group-hover:opacity-95"
                        />
                      ) : null}
                      {badge && (
                        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-neutral-900 shadow-sm">
                          <span
                            className={`h-2 w-2 rounded-full ${badge.dotClass}`}
                            aria-hidden
                          />
                          {badge.label}
                        </div>
                      )}
                    </div>
                    <div className={denseGrid ? "mt-3 px-0.5" : "min-w-0 flex-1 py-1"}>
                      <p className="font-semibold text-neutral-900 group-hover:underline">
                        {listing.title}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
                    </div>
                  </Link>
                  <div
                    className={
                      denseGrid
                        ? "mt-3 flex flex-wrap gap-2 px-0.5 pb-1"
                        : "mt-3 flex flex-shrink-0 flex-wrap gap-2 sm:mt-0 sm:flex-col sm:justify-center sm:pl-2"
                    }
                  >
                    {listing.status === ListingStatus.PUBLISHED ? (
                      <button
                        type="button"
                        disabled={busyId === listing.id}
                        onClick={() => onUnpublish(listing.id)}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
                      >
                        {busyId === listing.id ? "…" : "Unpublish"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === listing.id}
                        onClick={() => void patchListingStatus(listing.id, ListingStatus.PUBLISHED)}
                        className="brand-btn rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {busyId === listing.id ? "…" : "Publish"}
                      </button>
                    )}
                    {actionError?.id === listing.id && (
                      <p className="w-full text-xs text-red-600">{actionError.message}</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
