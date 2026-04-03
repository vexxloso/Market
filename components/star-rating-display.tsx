/** Filled yellow stars + optional numeric score for reviews (light UI). */

function StarShape({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

export function FiveStarIcons({
  rating,
  max = 5,
  sizeClass = "h-4 w-4",
  className,
}: {
  rating: number;
  max?: number;
  sizeClass?: string;
  className?: string;
}) {
  const r = Math.max(0, Math.min(max, Number(rating) || 0));
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className ?? ""}`}
      aria-hidden
    >
      {Array.from({ length: max }, (_, idx) => {
        const filled = idx + 1 <= r;
        return (
          <StarShape
            key={idx}
            className={`${sizeClass} ${filled ? "text-amber-400" : "text-neutral-200"}`}
          />
        );
      })}
    </span>
  );
}

export function RatingStarsWithScore({
  rating,
  max = 5,
  sizeClass = "h-4 w-4",
  scoreDecimals,
  className,
}: {
  rating: number;
  max?: number;
  sizeClass?: string;
  /** If set (e.g. 1), show numeric average; integer reviews omit for whole number display. */
  scoreDecimals?: number;
  className?: string;
}) {
  const r = Math.max(0, Math.min(max, Number(rating) || 0));
  const label =
    scoreDecimals !== undefined ? r.toFixed(scoreDecimals) : String(Math.round(r));
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <FiveStarIcons rating={Math.round(r)} max={max} sizeClass={sizeClass} />
      <span className="text-sm font-semibold tabular-nums text-amber-600">{label}</span>
      {max === 5 ? (
        <span className="text-xs font-medium text-[var(--muted)]">/5</span>
      ) : null}
    </span>
  );
}
