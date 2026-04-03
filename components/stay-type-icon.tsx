import type { StayType } from "@prisma/client";

export function StayTypeIcon({
  stayType,
  className = "h-4 w-4 text-neutral-800",
}: {
  stayType: StayType | string;
  className?: string;
}) {
  const t = String(stayType);
  if (t === "HOTEL_ROOM") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 48 48"
        fill="none"
        className={className}
      >
        <path
          d="M24 8L8 18v22h32V18L24 8z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <rect
          x="18"
          y="26"
          width="12"
          height="14"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (t === "BNB_ROOM") {
    return (
      <svg aria-hidden viewBox="0 0 48 48" fill="none" className={className}>
        <rect
          x="10"
          y="12"
          width="28"
          height="30"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M10 22h28" stroke="currentColor" strokeWidth="2" />
        <circle cx="20" cy="32" r="2" fill="currentColor" />
      </svg>
    );
  }

  if (t === "RENTAL_ROOM") {
    return (
      <svg aria-hidden viewBox="0 0 48 48" fill="none" className={className}>
        <rect
          x="12"
          y="10"
          width="24"
          height="30"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M16 16h16M16 22h16M16 28h10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return null;
}

