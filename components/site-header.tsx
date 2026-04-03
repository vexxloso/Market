import Link from "next/link";
import { getVerifiedSessionUser } from "@/lib/auth";
import { HeaderAuthControls } from "@/components/header-auth-controls";
import { SearchBar } from "@/components/search-bar";
import { StaylyMark } from "@/components/stayly-mark";

export async function SiteHeader() {
  const session = await getVerifiedSessionUser();

  return (
    <header className="surface sticky top-0 z-30 border-b border-[var(--border)]">
      <div className="container flex h-20 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-2xl font-bold text-[var(--brand)]"
          aria-label="Stayly — Home"
        >
          <StaylyMark className="h-8 w-8 shrink-0" decorative />
          <span className="tracking-tight">stayly</span>
        </Link>
        <SearchBar />
        <HeaderAuthControls session={session} />
      </div>
    </header>
  );
}
