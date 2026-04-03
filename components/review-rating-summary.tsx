import type { ReactNode } from "react";
import { FiveStarIcons } from "@/components/star-rating-display";

export function ReviewRatingSummary({
  avgRating,
  reviewCount,
  iconRight = false,
}: {
  avgRating: number | null | undefined;
  reviewCount: number | null | undefined;
  iconRight?: boolean;
}): ReactNode {
  const count = typeof reviewCount === "number" ? reviewCount : 0;
  if (!count) return null;

  const avg = typeof avgRating === "number" ? avgRating : null;
  if (avg == null) return null;

  const stars = Math.min(5, Math.max(0, Math.round(avg)));

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-semibold text-neutral-800 ${
        iconRight ? "flex-row-reverse" : ""
      }`}
    >
      <FiveStarIcons rating={stars} sizeClass="h-3.5 w-3.5" />
      <span className="tabular-nums text-amber-600">{avg.toFixed(1)}</span>
      <span className="font-medium text-[var(--muted)]">({count})</span>
    </div>
  );
}
