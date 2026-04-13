import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildListingsWhere } from "@/lib/listings-search";
import { getVerifiedSessionUser } from "@/lib/auth";
import { ListingLikeButton } from "@/components/listing-like-button";
import { ReviewRatingSummary } from "@/components/review-rating-summary";
import { StayTypeIcon } from "@/components/stay-type-icon";
import {
  listingDetailUrl,
  listingsUrl,
  listingsUrlWithPage,
  normalizeStaysParam,
} from "@/lib/stays-search-params";

const PAGE_SIZE = 24;

function formatBathrooms(bathrooms: number) {
  if (Number.isInteger(bathrooms)) return String(Math.trunc(bathrooms));
  const s = bathrooms.toFixed(1);
  return s.endsWith(".0") ? String(Math.trunc(bathrooms)) : s;
}

function listingCapacityLine(
  maxGuests: number,
  bedrooms: number,
  beds: number,
  bathrooms: number,
) {
  return [
    `${maxGuests} guest${maxGuests === 1 ? "" : "s"}`,
    `${bedrooms} bedroom${bedrooms === 1 ? "" : "s"}`,
    `${beds} bed${beds === 1 ? "" : "s"}`,
    `${formatBathrooms(bathrooms)} bath${bathrooms === 1 ? "" : "s"}`,
  ].join(" · ");
}

function listingFeaturePills(
  guestFavorites: string[],
  standout: string[],
  limit = 8,
) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const label of [...guestFavorites, ...standout]) {
    const t = label.trim();
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
    if (out.length >= limit) break;
  }
  return out;
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeParam(param?: string | string[]) {
  return normalizeStaysParam(param);
}

function formatWhen(checkIn?: string | null, checkOut?: string | null) {
  if (checkIn && checkOut) {
    // Expect YYYY-MM-DD, show MM-DD
    return `${checkIn.slice(5)}–${checkOut.slice(5)}`;
  }
  return "Any dates";
}

function hostInitial(name: string | null | undefined, email: string) {
  const base = (name?.trim() || email).charAt(0);
  return base ? base.toUpperCase() : "?";
}

export default async function ListingsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const whereQuery = normalizeParam(params.where)?.trim() ?? "";
  const checkIn = normalizeParam(params.checkIn);
  const checkOut = normalizeParam(params.checkOut);
  const guestsRaw = normalizeParam(params.guests);
  const guests = guestsRaw ? Number(guestsRaw) : undefined;

  const viewRaw = normalizeParam(params.view);
  const view: "grid" | "list" = viewRaw === "list" ? "list" : "grid";

  const pageRaw = normalizeParam(params.page);
  let page = pageRaw ? Math.trunc(Number(pageRaw)) : 1;
  if (!Number.isFinite(page) || page < 1) page = 1;

  const where = buildListingsWhere({
    whereQuery,
    checkIn: checkIn ?? null,
    checkOut: checkOut ?? null,
    guests,
  });

  const session = await getVerifiedSessionUser();

  const totalCount = await prisma.listing.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  if (page > totalPages) page = totalPages;

  const dbListings = await prisma.listing.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      title: true,
      location: true,
      country: true,
      pricePerNight: true,
      imageUrl: true,
      stayType: true,
      maxGuests: true,
      bedrooms: true,
      beds: true,
      bathrooms: true,
      guestFavorites: true,
      standoutAmenities: true,
      host: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      _count: { select: { likes: true } },
    },
  });

  const reviewStatsById = new Map<
    string,
    { avgRating: number | null; reviewCount: number }
  >();

  const listingIds = dbListings.map((l) => l.id);
  if (listingIds.length > 0) {
    const reviewStats = await prisma.review.groupBy({
      by: ["listingId"],
      where: { listingId: { in: listingIds } },
      _avg: { rating: true },
      _count: { id: true },
    });

    reviewStats.forEach((s) => {
      reviewStatsById.set(s.listingId, {
        avgRating: typeof s._avg?.rating === "number" ? s._avg.rating : null,
        reviewCount: s._count.id,
      });
    });
  }

  const likedSet = new Set<string>();
  if (session?.id && dbListings.length > 0) {
    const ids = dbListings.map((l) => l.id);
    const liked = await prisma.listingLike.findMany({
      where: { userId: session.id, listingId: { in: ids } },
      select: { listingId: true },
    });
    liked.forEach((l) => likedSet.add(l.listingId));
  }

  const whereLabel = whereQuery || "Anywhere";

  return (
    <div className="min-h-screen">
      <main className="w-full px-6 py-7">
        <section className="mb-6">
          <h1 className="text-2xl font-semibold">Stays</h1>
          <p className="muted mt-2 text-sm">
            Where: <span className="font-medium text-neutral-900">{whereLabel}</span> ·
            When: <span className="font-medium text-neutral-900">{formatWhen(checkIn, checkOut)}</span> ·
            Who:{" "}
            <span className="font-medium text-neutral-900">
              {guests ? `${guests} guest${guests === 1 ? "" : "s"}` : "Any guests"}
            </span>
          </p>
          <p className="muted mt-2 text-sm">
            {totalCount} result{totalCount === 1 ? "" : "s"}
            {totalPages > 1 ? (
              <>
                {" "}
                · page {page} of {totalPages}
              </>
            ) : null}
          </p>
        </section>

        <div className="mb-4 flex items-center justify-end gap-2">
          <Link
            href={listingsUrl(params, "list")}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              view === "list"
                ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                : "border-[var(--border)] bg-white text-neutral-700 hover:border-neutral-700"
            }`}
          >
            List
          </Link>
          <Link
            href={listingsUrl(params, "grid")}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              view === "grid"
                ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                : "border-[var(--border)] bg-white text-neutral-700 hover:border-neutral-700"
            }`}
          >
            Grid
          </Link>
        </div>

        {view === "list" ? (
          <section className="space-y-4">
            {dbListings.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm">
                No stays found for these filters.
              </div>
            ) : (
              dbListings.map((listing) => {
                const pills = listingFeaturePills(
                  listing.guestFavorites,
                  listing.standoutAmenities,
                );
                return (
                  <article
                    key={listing.id}
                    className="relative flex overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
                  >
                    <Link
                      href={listingDetailUrl(listing.id, params)}
                      className="relative h-40 w-40 shrink-0 bg-neutral-200 sm:h-auto sm:min-h-[11rem] sm:w-44"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={listing.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </Link>
                    <div className="relative flex min-w-0 flex-1 flex-col md:flex-row md:items-stretch">
                      <div className="pointer-events-none absolute right-3 top-3 z-10 md:right-4 md:top-4">
                        <div className="pointer-events-auto">
                          <ListingLikeButton
                            listingId={listing.id}
                            initialLiked={likedSet.has(listing.id)}
                            initialLikeCount={listing._count.likes}
                          />
                        </div>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between p-4 pr-14 md:pr-4">
                        <div>
                          <Link
                            href={listingDetailUrl(listing.id, params)}
                            className="block no-underline hover:opacity-90"
                          >
                            <h3 className="truncate pr-2 text-base font-semibold text-neutral-900 md:pr-0">
                              {listing.title}
                            </h3>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                              {listing.location}, {listing.country}
                            </p>
                            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-900">
                              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                                Type
                              </span>
                              <span className="inline-flex items-center gap-1.5 font-medium capitalize">
                                <StayTypeIcon stayType={listing.stayType} className="h-4 w-4 shrink-0" />
                                {listing.stayType.replaceAll("_", " ").toLowerCase()}
                              </span>
                            </p>
                            <p className="mt-2 text-sm text-neutral-900">
                              <span className="font-semibold">${listing.pricePerNight}</span> / night
                            </p>
                            <div className="mt-1">
                              <ReviewRatingSummary
                                avgRating={reviewStatsById.get(listing.id)?.avgRating}
                                reviewCount={reviewStatsById.get(listing.id)?.reviewCount}
                              />
                            </div>
                          </Link>
                          <Link
                            href={`/profile/${listing.host.id}`}
                            className="mt-3 flex max-w-full items-center gap-2 rounded-lg py-1 no-underline transition hover:bg-neutral-50"
                          >
                            {listing.host.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={listing.host.avatarUrl}
                                alt=""
                                className="h-9 w-9 shrink-0 rounded-full border border-[var(--border)] object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--brand-soft-border-light)] bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand)]">
                                {hostInitial(listing.host.name, listing.host.email)}
                              </div>
                            )}
                            <span className="min-w-0 truncate text-sm font-medium text-neutral-900 hover:underline">
                              {listing.host.name?.trim() || listing.host.email}
                            </span>
                          </Link>
                        </div>
                      </div>
                      <div className="border-t border-[var(--border)] bg-neutral-50/80 p-4 md:w-64 md:shrink-0 md:border-l md:border-t-0 lg:w-72">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                          Features
                        </p>
                        <p className="mt-2 text-sm font-medium leading-snug text-neutral-900">
                          {listingCapacityLine(
                            listing.maxGuests,
                            listing.bedrooms,
                            listing.beds,
                            listing.bathrooms,
                          )}
                        </p>
                        {pills.length > 0 ? (
                          <ul className="mt-3 flex flex-wrap gap-1.5">
                            {pills.map((label) => (
                              <li
                                key={label}
                                className="rounded-full border border-[var(--border)] bg-white px-2.5 py-0.5 text-xs text-neutral-800"
                              >
                                {label}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-xs text-[var(--muted)]">No amenities listed yet.</p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        ) : (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {dbListings.length === 0 ? null : (
              dbListings.map((listing) => {
                const loc =
                  [listing.location?.trim(), listing.country?.trim()]
                    .filter(Boolean)
                    .join(", ") || "";
                const typeLabel = listing.stayType.replaceAll("_", " ").toLowerCase();
                return (
                  <article key={listing.id} className="group min-w-0">
                    <div className="relative mb-1.5 aspect-[4/3] overflow-hidden rounded-xl bg-neutral-200 sm:mb-2 sm:rounded-2xl">
                      <Link href={listingDetailUrl(listing.id, params)} className="block h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </Link>
                      <div className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2">
                        <div className="scale-90 origin-top-right sm:scale-100">
                          <ListingLikeButton
                            listingId={listing.id}
                            initialLiked={likedSet.has(listing.id)}
                            initialLikeCount={listing._count.likes}
                          />
                        </div>
                      </div>
                    </div>
                    <Link
                      href={listingDetailUrl(listing.id, params)}
                      className="block space-y-0.5 text-neutral-900 no-underline hover:opacity-90"
                    >
                      <h3 className="line-clamp-2 text-xs font-semibold leading-snug sm:text-sm">
                        {listing.title}
                      </h3>
                      {loc ? (
                        <p className="line-clamp-1 text-[10px] text-[var(--muted)] sm:text-xs">
                          {loc}
                        </p>
                      ) : null}
                      <p className="flex items-center gap-1 text-[10px] text-neutral-800 sm:text-xs">
                        <StayTypeIcon
                          stayType={listing.stayType}
                          className="h-3 w-3 shrink-0 text-[var(--muted)] sm:h-3.5 sm:w-3.5"
                        />
                        <span className="line-clamp-1 capitalize">{typeLabel}</span>
                      </p>
                      <p className="text-[10px] text-neutral-900 sm:text-xs">
                        <span className="font-semibold">${listing.pricePerNight}</span>{" "}
                        <span className="font-normal text-[var(--muted)]">night</span>
                      </p>
                      <div className="[&_svg]:h-3 [&_svg]:w-3 [&_.tabular-nums]:text-[10px] sm:[&_svg]:h-3.5 sm:[&_svg]:w-3.5 sm:[&_.tabular-nums]:text-xs">
                        <ReviewRatingSummary
                          avgRating={reviewStatsById.get(listing.id)?.avgRating}
                          reviewCount={reviewStatsById.get(listing.id)?.reviewCount}
                        />
                      </div>
                    </Link>
                  </article>
                );
              })
            )}
          </section>
        )}

        {totalPages > 1 ? (
          <nav
            className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-[var(--border)] pt-6"
            aria-label="Listing pages"
          >
            <Link
              href={listingsUrlWithPage(params, Math.max(1, page - 1), view)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold no-underline ${
                page <= 1
                  ? "pointer-events-none border-[var(--border)] text-[var(--muted)] opacity-50"
                  : "border-[var(--border)] bg-white text-neutral-800 hover:border-neutral-700"
              }`}
              aria-disabled={page <= 1}
            >
              Previous
            </Link>
            <span className="px-2 text-sm text-[var(--muted)]">
              Page <span className="font-semibold text-neutral-900">{page}</span> of{" "}
              <span className="font-semibold text-neutral-900">{totalPages}</span>
            </span>
            <Link
              href={listingsUrlWithPage(params, Math.min(totalPages, page + 1), view)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold no-underline ${
                page >= totalPages
                  ? "pointer-events-none border-[var(--border)] text-[var(--muted)] opacity-50"
                  : "border-[var(--border)] bg-white text-neutral-800 hover:border-neutral-700"
              }`}
              aria-disabled={page >= totalPages}
            >
              Next
            </Link>
          </nav>
        ) : null}
      </main>
    </div>
  );
}

