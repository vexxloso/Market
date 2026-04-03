"use client";

const iconClass = "h-7 w-7 text-neutral-900";

/** Simple line icons keyed by the exact amenity label stored in the database. */
export function AmenityIcon({ label }: { label: string }) {
  switch (label) {
    case "Wifi":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 18.5v.01M8.5 14.5a7 7 0 0111 0M5 11a11 11 0 0114 0M2 7.5a15 15 0 0120 0"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case "TV":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "Kitchen":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="9" cy="11" r="1.25" fill="currentColor" />
          <path d="M14 9h4M14 13h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "Washer":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "Free parking on premises":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <path
            d="M4 18h4l1.5-6h3c3 0 5-1.5 5-4s-2-4-5-4H8.5L7 18"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="17" cy="7" r="1" fill="currentColor" />
        </svg>
      );
    case "Paid parking on premises":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <rect x="5" y="5" width="6" height="14" rx="1" stroke="currentColor" strokeWidth="1.75" />
          <path d="M8 8v2M11 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="14" y="10" width="6" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "Air conditioning":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3v18M6 6l6 6 6-6M6 18l6-6 6 6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "Dedicated workspace":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <rect x="3" y="8" width="18" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <path d="M8 8V6M16 8V6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <path
            d="M17 4l1 2M7 4L6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "Pool":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <path
            d="M4 14c2 0 3-1 5-1s3 1 5 1 3-1 5-1M4 18c2 0 3-1 5-1s3 1 5 1 3-1 5-1"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path d="M12 5v5M10 7l2-2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "Hot tub":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="15" rx="9" ry="4" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M7 15c0-4 2.5-7 5-7s5 3 5 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "Patio":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <path d="M4 20h16M6 20V10l6-4 6 4v10" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M9 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "BBQ grill":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="14" rx="8" ry="3" stroke="currentColor" strokeWidth="1.75" />
          <path d="M7 14V9M12 14V8M17 14V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M10 5c0 2 4 2 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "Outdoor dining area":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <path d="M4 18h16M8 18V10h8v8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <path d="M12 6v4M9 4l3 2 3-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "Fire pit":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 20c3-2 5-5 5-9 0-3-2-5-5-8-3 3-5 5-5 8 0 4 2 7 5 9z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M12 12l2 3-2 2-2-2 2-3z" fill="currentColor" opacity="0.35" />
        </svg>
      );
    case "Pool table":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <rect x="3" y="6" width="18" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="9" cy="11" r="1.25" fill="currentColor" />
          <circle cx="15" cy="11" r="1.25" fill="currentColor" />
        </svg>
      );
    case "Indoor fireplace":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <path d="M6 20h12M7 20V9h10v11" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
          <path
            d="M12 17c1.5-1.5 2-3 2-5-2 0-3 2-2 5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "Piano":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <path
            d="M5 18h14V8H5v10zM8 8V6h8v2"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M9 14h2M13 14h2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
      );
    case "Exercise equipment":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <path d="M5 12h3l2-2h4l2 2h3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <path d="M7 10v4M17 10v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "Lake access":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <path d="M4 15c3 1 5 1 8 0s5-1 8 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <path d="M6 10l2-5h8l2 5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "Beach access":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <path d="M2 18c4-2 7-2 10 0s6 2 10 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <path d="M8 10l2-6 3 4 3-5 2 7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "Ski-in/Ski-out":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <path d="M8 5l8 6-4 10" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M5 19l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "Outdoor shower":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 4v2M10 6h4M9 8h6v2c0 3-2 5-3 7H9c-1-2-3-4-3-7V8z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M8 19h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 2" />
        </svg>
      );
    case "Smoke alarm":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );
    case "First aid kit":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <rect x="6" y="7" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <path d="M12 10v5M9.5 12.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "Fire extinguisher":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <path
            d="M10 4h4v3h-4V4zM9 7l1 13h4l1-13"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M8 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "Carbon monoxide alarm":
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <rect x="7" y="6" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <path d="M10 10h4M10 14h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg aria-hidden className={iconClass} viewBox="0 0 24 24" fill="none">
          <rect x="5" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
  }
}
