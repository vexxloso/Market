"use client";

import { withBasePath } from "@/lib/app-origin";
import { useState, type MouseEvent } from "react";

function HeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg
      aria-hidden
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 21s-7-4.9-7-10a4 4 0 017-2 4 4 0 017 2c0 5.1-7 10-7 10z" />
    </svg>
  ) : (
    <svg
      aria-hidden
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s-7-4.9-7-10a4 4 0 017-2 4 4 0 017 2c0 5.1-7 10-7 10z" />
    </svg>
  );
}

export function ListingLikeButton({
  listingId,
  initialLiked,
  initialLikeCount,
}: {
  listingId: string;
  initialLiked: boolean;
  initialLikeCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [busy, setBusy] = useState(false);

  async function toggleLike(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(withBasePath(`/api/listings/${listingId}/like`), {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as
        | { liked?: boolean; likeCount?: number; error?: string }
        | undefined;
      if (!res.ok || typeof data?.likeCount !== "number") return;
      setLiked(Boolean(data.liked));
      setLikeCount(data.likeCount);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleLike}
      disabled={busy}
      aria-pressed={liked}
      className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-white disabled:opacity-60"
      title={liked ? "Unlike" : "Like"}
    >
      <span className={liked ? "text-[var(--like)]" : "text-neutral-900"}>
        <HeartIcon filled={liked} />
      </span>
      <span
        className={
          liked ? "tabular-nums text-[var(--like)]" : "tabular-nums text-neutral-900"
        }
      >
        {likeCount}
      </span>
    </button>
  );
}

