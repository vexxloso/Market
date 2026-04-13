import {
  categories,
} from "@/lib/sample-data";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { ListingLikeButton } from "@/components/listing-like-button";
import { buildListingsWhere } from "@/lib/listings-search";
import { ReviewRatingSummary } from "@/components/review-rating-summary";
import { StayTypeIcon } from "@/components/stay-type-icon";
import { listingDetailUrl, listingsUrl } from "@/lib/stays-search-params";

const HOME_FEATURED_LIMIT = 6;
const HOME_SECTION_SIZE = 6;

const listingCardSelect = {
  id: true,
  title: true,
  location: true,
  country: true,
  pricePerNight: true,
  imageUrl: true,
  stayType: true,
  _count: { select: { likes: true } },
} as const;

function CategoryBar() {
  return (
    <div className="surface border-b border-[var(--border)]">
      <div className="container flex gap-3 overflow-x-auto py-4">
        {categories.map((item) => (
          <button
            key={item}
            className="whitespace-nowrap rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium hover:border-neutral-700"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function listingLocationLine(location: string, country: string) {
  const place = location.trim();
  const nation = country.trim();
  if (place && nation) return `${place}, ${nation}`;
  return place || nation || "";
}

function ListingCard({
  id,
  title,
  locationLine,
  pricePerNight,
  image,
  stayType,
  initialLiked,
  likeCount,
  reviewCount,
  avgRating,
  detailHref,
}: {
  id: string;
  title: string;
  /** City/area line; omitted from the card when empty. */
  locationLine: string;
  pricePerNight: number;
  image: string;
  stayType: string;
  initialLiked: boolean;
  likeCount: number;
  reviewCount?: number;
  avgRating?: number | null;
  detailHref: string;
}) {
  return (
    <article className="w-[220px] shrink-0 group">
      <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-neutral-200">
        <Link href={detailHref} className="absolute inset-0 block" aria-label={`View ${title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </Link>
        <div className="absolute right-3 top-3 z-10">
          <ListingLikeButton
            listingId={id}
            initialLiked={initialLiked}
            initialLikeCount={likeCount}
          />
        </div>
      </div>
      <Link
        href={detailHref}
        className="block space-y-1 text-sm text-neutral-900 no-underline hover:opacity-90"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold leading-snug">{title}</h3>
          <div className="flex shrink-0 items-center gap-2">
            <StayTypeIcon stayType={stayType} />
            <span className="whitespace-nowrap">
              {stayType.replaceAll("_", " ")}
            </span>
          </div>
        </div>
        {locationLine ? (
          <p className="muted line-clamp-1 text-xs">{locationLine}</p>
        ) : null}
        <p>
          <span className="font-semibold">${pricePerNight}</span> night
        </p>
        <div>
          <ReviewRatingSummary avgRating={avgRating} reviewCount={reviewCount} />
        </div>
      </Link>
    </article>
  );
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeParam(param?: string | string[]) {
  return Array.isArray(param) ? param[0] : param;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const whereQuery = normalizeParam(params.where)?.trim() ?? "";
  const checkIn = normalizeParam(params.checkIn);
  const checkOut = normalizeParam(params.checkOut);
  const guestsRaw = normalizeParam(params.guests);
  const guests = guestsRaw ? Number(guestsRaw) : undefined;

  const session = await getVerifiedSessionUser();

  const where = buildListingsWhere({
    whereQuery,
    checkIn,
    checkOut,
    guests,
  });

  const { page: _omitPage, ...paramsForLinks } = params;

  const listingsHref = listingsUrl(paramsForLinks);

  const totalCount = await prisma.listing.count({ where });

  const [
    dbListings,
    popularListings,
    topReviewListings,
  ] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: HOME_FEATURED_LIMIT,
      select: listingCardSelect,
    }),
    prisma.listing.findMany({
      where,
      orderBy: [
        { likes: { _count: "desc" } },
        { createdAt: "desc" },
      ],
      take: HOME_SECTION_SIZE,
      select: listingCardSelect,
    }),
    prisma.listing.findMany({
      where,
      orderBy: [
        { reviews: { _count: "desc" } },
        { createdAt: "desc" },
      ],
      take: HOME_SECTION_SIZE,
      select: listingCardSelect,
    }),
  ]);

  const allIds = Array.from(
    new Set([
      ...dbListings.map((l) => l.id),
      ...popularListings.map((l) => l.id),
      ...topReviewListings.map((l) => l.id),
    ]),
  );

  const reviewStatsById = new Map<
    string,
    { avgRating: number | null; reviewCount: number }
  >();

  if (allIds.length > 0) {
    const reviewStats = await prisma.review.groupBy({
      by: ["listingId"],
      where: { listingId: { in: allIds } },
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
  if (session?.id && allIds.length > 0) {
    const liked = await prisma.listingLike.findMany({
      where: { userId: session.id, listingId: { in: allIds } },
      select: { listingId: true },
    });
    liked.forEach((l) => likedSet.add(l.listingId));
  }

  return (
    <div className="min-h-screen">
      <main className="w-full px-6 py-7">
        <section className="border-b border-[var(--border)] pb-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="mb-1 text-2xl font-semibold">Find your next stay</h1>
              <p className="muted">
                Unique homes, cabins, and city escapes.
                {whereQuery || checkIn || checkOut || guests ? (
                  <>
                    {" "}
                    · {totalCount} result{totalCount === 1 ? "" : "s"} for current filters
                  </>
                ) : null}
              </p>
            </div>

            <Link
              href={listingsHref}
              className="self-start rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:border-neutral-700"
            >
              See all
            </Link>
          </div>
        </section>

        <section className="border-b border-[var(--border)] pb-7 pt-7">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
              {whereQuery ? `Stay near ${whereQuery}` : "Featured stays"}
            </h2>
          </div>

          {dbListings.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm">
              No stays found for this search. Try changing city, dates, or guest count.
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {dbListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  locationLine={listingLocationLine(listing.location, listing.country)}
                  pricePerNight={listing.pricePerNight}
                  image={listing.imageUrl}
                  stayType={listing.stayType}
                  initialLiked={likedSet.has(listing.id)}
                  likeCount={listing._count.likes}
                  reviewCount={reviewStatsById.get(listing.id)?.reviewCount}
                  avgRating={reviewStatsById.get(listing.id)?.avgRating}
                  detailHref={listingDetailUrl(listing.id, paramsForLinks)}
                />
              ))}
            </div>
          )}
        </section>

        {totalCount > 0 ? (
          <section className="border-b border-[var(--border)] pb-7 pt-7">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
                Most popular
              </h2>
              <Link
                href={listingsHref}
                className="text-sm font-semibold text-neutral-700 hover:text-neutral-900"
              >
                See all
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {popularListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  locationLine={listingLocationLine(listing.location, listing.country)}
                  pricePerNight={listing.pricePerNight}
                  image={listing.imageUrl}
                  stayType={listing.stayType}
                  initialLiked={likedSet.has(listing.id)}
                  likeCount={listing._count.likes}
                  reviewCount={reviewStatsById.get(listing.id)?.reviewCount}
                  avgRating={reviewStatsById.get(listing.id)?.avgRating}
                  detailHref={listingDetailUrl(listing.id, paramsForLinks)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {totalCount > 0 ? (
          <section className="pt-7">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
                Most reviews
              </h2>
              <Link
                href={listingsHref}
                className="text-sm font-semibold text-neutral-700 hover:text-neutral-900"
              >
                See all
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {topReviewListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  locationLine={listingLocationLine(listing.location, listing.country)}
                  pricePerNight={listing.pricePerNight}
                  image={listing.imageUrl}
                  stayType={listing.stayType}
                  initialLiked={likedSet.has(listing.id)}
                  likeCount={listing._count.likes}
                  reviewCount={reviewStatsById.get(listing.id)?.reviewCount}
                  avgRating={reviewStatsById.get(listing.id)?.avgRating}
                  detailHref={listingDetailUrl(listing.id, paramsForLinks)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
