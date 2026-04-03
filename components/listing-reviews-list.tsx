"use client";

import Link from "next/link";
import { useState } from "react";
import { RatingStarsWithScore } from "@/components/star-rating-display";

const PREVIEW_COUNT = 5;

function getInitial(name: string | null | undefined, email: string) {
  const base = (name?.trim() || email).charAt(0);
  return base ? base.toUpperCase() : "?";
}

export type ListingReviewSerializable = {
  id: string;
  rating: number;
  comment: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
};

function ReviewerAvatar({
  user,
}: {
  user: ListingReviewSerializable["user"];
}) {
  return (
    <Link href={`/profile/${user.id}`} aria-label="View reviewer profile">
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatarUrl}
          alt=""
          className="h-10 w-10 rounded-full border border-[var(--border)] object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand)]">
          {getInitial(user.name, user.email)}
        </div>
      )}
    </Link>
  );
}

export function ListingReviewsList({
  reviews,
  listingCoverUrl,
  listingId,
}: {
  reviews: ListingReviewSerializable[];
  /** Listing hero/thumbnail shown on each review row (same listing for all items). */
  listingCoverUrl?: string | null;
  listingId?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? reviews : reviews.slice(0, PREVIEW_COUNT);
  const hasMore = reviews.length > PREVIEW_COUNT;

  if (reviews.length === 0) {
    return <p className="muted text-sm">No reviews yet.</p>;
  }

  return (
    <div className="space-y-3">
      {visible.map((review) => (
        <article key={review.id} className="rounded-xl border p-3">
          <div className="flex items-start gap-3">
            <ReviewerAvatar user={review.user} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                <Link
                  href={`/profile/${review.user.id}`}
                  className="font-medium text-neutral-900 hover:underline"
                >
                  {review.user.name ?? review.user.email}
                </Link>
                <span className="text-[#717171]" aria-hidden>
                  ·
                </span>
                <Link
                  href={`/profile/${review.user.id}`}
                  className="font-medium text-[var(--brand)] hover:underline"
                >
                  View profile
                </Link>
              </div>
              <div
                className="mt-1 inline-flex items-center gap-2"
                aria-label={`${review.rating} out of 5 stars`}
              >
                <RatingStarsWithScore
                  rating={review.rating}
                  sizeClass="h-4 w-4"
                  scoreDecimals={0}
                />
              </div>
              <p className="muted mt-1 text-sm">{review.comment}</p>
            </div>
            {listingId ? (
              <div className="shrink-0">
                <Link
                  href={`/listing/${listingId}`}
                  className="relative block overflow-hidden rounded-lg border border-[var(--border)] bg-neutral-100"
                  aria-label="Listing cover — view listing"
                >
                  {listingCoverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listingCoverUrl}
                      alt=""
                      className="h-16 w-24 object-cover sm:h-[4.5rem] sm:w-28"
                    />
                  ) : (
                    <div className="flex h-16 w-24 items-center justify-center sm:h-[4.5rem] sm:w-28">
                      <span className="px-1 text-center text-[10px] text-neutral-500">
                        No cover
                      </span>
                    </div>
                  )}
                </Link>
              </div>
            ) : null}
          </div>
        </article>
      ))}
      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="w-full rounded-xl border border-[var(--brand-soft-border)] bg-[var(--brand-soft)] py-2.5 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft-hover)]"
        >
          {expanded
            ? "Show less"
            : `Show all ${reviews.length} reviews`}
        </button>
      ) : null}
    </div>
  );
}
