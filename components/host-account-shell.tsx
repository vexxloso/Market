"use client";

import Link from "next/link";

export type AccountTab = "profile" | "bookings" | "listings" | "messages";

const navLinkClass = (active: boolean) =>
  `text-sm font-medium transition-colors ${
    active
      ? "border-b-2 border-neutral-900 pb-3 text-neutral-900"
      : "border-b-2 border-transparent pb-3 text-neutral-600 hover:text-neutral-900"
  }`;

export function HostAccountShell({
  activeTab,
  children,
}: {
  activeTab: AccountTab;
  children: React.ReactNode;
}) {
  const tabs: { id: AccountTab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "bookings", label: "Bookings" },
    { id: "listings", label: "Listings" },
    { id: "messages", label: "Messages" },
  ];

  return (
    <div className="bg-[var(--background)]">
      <div className="border-b border-[var(--border)] bg-white">
        <div className="container flex h-16 items-center justify-center">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 sm:gap-x-10">
            {tabs.map(({ id, label }) => (
              <Link
                key={id}
                href={`/profile?tab=${id}`}
                scroll={false}
                className={navLinkClass(activeTab === id)}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
