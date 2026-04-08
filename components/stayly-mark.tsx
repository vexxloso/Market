/**
 * Shared brand mark — use everywhere the Noire Haven logo should appear (header, footer, etc.).
 */
export function StaylyMark({
  className,
  decorative = false,
}: {
  className?: string;
  /** When true, mark is purely visual (e.g. beside “stayly” inside a labeled link). */
  decorative?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Noire Haven"}
    >
      <path
        fill="var(--brand, #0d9488)"
        d="M16 3.5 3 14.25h2.75v12.5c0 1.24 1.01 2.25 2.25 2.25h5.75v-7.5h4v7.5h5.75c1.24 0 2.25-1.01 2.25-2.25v-12.5H29L16 3.5Z"
      />
    </svg>
  );
}
