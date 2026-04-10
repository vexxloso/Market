import Link from "next/link";
import { StaylyMark } from "@/components/stayly-mark";

const explore = [
  { href: "/", label: "Home" },
  { href: "/listings", label: "All listings" },
];

const hosting = [
  { href: "/become-host", label: "Become a host" },
  { href: "/host/new", label: "Create a listing" },
];

const account = [
  { href: "/profile", label: "Profile" },
  { href: "/profile?tab=bookings", label: "Trips & bookings" },
  { href: "/profile?tab=messages", label: "Messages" },
];

const legal = [
  { href: "/terms", label: "Terms & conditions" },
  { href: "/privacy", label: "Privacy & cookie policy" },
];

export function SiteFooter() {
  return (
    <footer className="surface mt-auto border-t border-[var(--border)]">
      <div className="container py-12 pb-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xl font-bold text-[var(--brand)] hover:opacity-90"
              aria-label="Noire Haven — Home"
            >
              <StaylyMark className="h-9 w-9 shrink-0" decorative />
              <span className="tracking-tight">Noire Haven</span>
            </Link>
            <p className="muted mt-3 max-w-xs text-sm leading-relaxed">
              Find unique homes, cabins, and city escapes for your next trip.
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-900">
              Explore
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              {explore.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="muted transition hover:text-neutral-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-900">
              Hosting
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              {hosting.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="muted transition hover:text-neutral-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-900">
              Account
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              {account.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="muted transition hover:text-neutral-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-900">
              Legal
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              {legal.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="muted transition hover:text-neutral-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--border)] pt-8 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Noire Haven. All rights reserved.</p>
          <p className="text-xs sm:text-sm">A demo marketplace for short-term stays.</p>
        </div>
      </div>
    </footer>
  );
}
