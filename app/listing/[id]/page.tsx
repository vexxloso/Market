import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getVerifiedSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AmenityIcon } from "@/app/host/new/amenity-icons";
import { IconGlobeStamp } from "@/components/profile-airbnb-icons";
import { ListingBookingForm } from "@/components/listing-booking-form";
import { ListingDetailMap } from "@/components/listing-detail-map";
import { ListingReviewsList } from "@/components/listing-reviews-list";
import { bookingDefaultsFromSearchParams, listingsUrl } from "@/lib/stays-search-params";

function BackToListButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:border-neutral-700"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back to list
    </Link>
  );
}

function getInitial(name: string | null | undefined, email: string) {
  const base = (name?.trim() || email).charAt(0);
  return base ? base.toUpperCase() : "?";
}

function AvatarLink({
  userId,
  name,
  email,
  avatarUrl,
}: {
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}) {
  return (
    <Link href={`/profile/${userId}`} aria-label="View user profile">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="h-10 w-10 rounded-full border border-[var(--border)] object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand)]">
          {getInitial(name, email)}
        </div>
      )}
    </Link>
  );
}

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ListingDetailsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const backListingsHref = listingsUrl(sp);

  const [session, listing] = await Promise.all([
    getVerifiedSessionUser(),
    prisma.listing.findUnique({
      where: { id },
      include: {
        host: true,
        reviews: { include: { user: true }, orderBy: { createdAt: "desc" } },
      },
    }),
  ]);

  if (!listing) notFound();

  const bookingDefaults = bookingDefaultsFromSearchParams(sp, listing.maxGuests);

  const mapsPublicKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasListingMapPin =
    Boolean(mapsPublicKey) &&
    Number.isFinite(listing.latitude) &&
    Number.isFinite(listing.longitude) &&
    !(listing.latitude === 0 && listing.longitude === 0);

  const canEdit =
    session != null &&
    (session.role === UserRole.ADMIN ||
      (session.role === UserRole.HOST && listing.hostId === session.id));

  const gallery = [
    ...(listing.imageUrls.length > 0 ? listing.imageUrls : [listing.imageUrl]),
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
  ];

  return (
    <main className="w-full px-6 pb-8 pt-6">
      <div className="grid gap-7 lg:grid-cols-[2fr_1fr]">
        <section>
          <div className="mb-4">
            <BackToListButton href={backListingsHref} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-3xl font-semibold">{listing.title}</h1>
            {canEdit && (
              <Link
                href={`/host/new?draftId=${listing.id}`}
                className="shrink-0 rounded-lg border border-[var(--brand-soft-border)] bg-[var(--brand-soft)] px-4 py-2 text-center text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft-hover)]"
              >
                Edit listing
              </Link>
            )}
          </div>
          <p className="muted mt-1 flex items-center gap-2 text-sm sm:text-base">
            <svg
              className="h-5 w-5 shrink-0 text-neutral-600"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M12 22s8-6.2 8-13a8 8 0 10-16 0c0 6.8 8 13 8 13z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <span>{[listing.location, listing.country].filter(Boolean).join(", ")}</span>
          </p>
          {hasListingMapPin ? (
            <div className="mt-4">
              <h2 className="text-lg font-semibold">Where you&apos;ll be</h2>
              <p className="muted mt-1 text-sm">The map is centered on this listing.</p>
              <div className="mt-3">
                <ListingDetailMap
                  apiKey={mapsPublicKey}
                  latitude={listing.latitude}
                  longitude={listing.longitude}
                  title={listing.title}
                />
              </div>
            </div>
          ) : null}
          <div className="mt-4 grid grid-cols-1 gap-2 overflow-hidden rounded-3xl md:grid-cols-4 md:grid-rows-2">
            {gallery.map((image, idx) => (
              <div
                key={image + idx}
                className={idx === 0 ? "md:col-span-2 md:row-span-2" : ""}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={`${listing.title} ${idx + 1}`}
                  className="h-[210px] w-full object-cover md:h-full"
                />
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-5">
            <h2 className="text-lg font-semibold">About this place</h2>
            <p className="muted mt-2 text-sm leading-6">{listing.description}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="font-medium">Guest favorites</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {listing.guestFavorites.map((label) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-neutral-900"
                    >
                      <AmenityIcon label={label} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium">Standout amenities</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {listing.standoutAmenities.map((label) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-neutral-900"
                    >
                      <AmenityIcon label={label} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium">Safety</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {listing.safetyAmenities.map((label) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-neutral-900"
                    >
                      <AmenityIcon label={label} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium">Host language</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {listing.hostLanguages.map((lang) => (
                    <div
                      key={lang}
                      className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-neutral-900"
                    >
                      <IconGlobeStamp className="h-5 w-5 text-neutral-900" />
                      <span>{lang}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-5">
            <h2 className="text-lg font-semibold">Hosted by</h2>
            <div className="mt-3 flex items-center gap-3">
              <AvatarLink
                userId={listing.host.id}
                name={listing.host.name}
                email={listing.host.email}
                avatarUrl={listing.host.avatarUrl}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900">
                  {listing.host.name ?? listing.host.email}
                </p>
                <p className="muted text-sm">Superhost · Response rate 99% · 7 years hosting</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-5">
            <h2 className="text-lg font-semibold">Reviews</h2>
            <div className="mt-3">
              <ListingReviewsList
                listingId={listing.id}
                listingCoverUrl={
                  listing.imageUrls[0] ?? listing.imageUrl ?? null
                }
                reviews={listing.reviews.map((r) => ({
                  id: r.id,
                  rating: r.rating,
                  comment: r.comment,
                  user: {
                    id: r.user.id,
                    name: r.user.name,
                    email: r.user.email,
                    avatarUrl: r.user.avatarUrl,
                  },
                }))}
              />
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-[var(--border)] bg-white p-5 lg:sticky lg:top-24">
          <p className="text-2xl font-semibold">${listing.weekdayPrice}</p>
          <p className="muted text-sm">weekday price</p>
          <p className="muted text-sm">${listing.weekendPrice} weekend</p>
          <p className="muted mt-3 text-sm">
            Hosted by {listing.host.name ?? listing.host.email}
          </p>
          {canEdit ? (
            <Link
              href={`/host/new?draftId=${listing.id}`}
              className="mt-5 block rounded-xl border border-[var(--brand-soft-border)] bg-[var(--brand-soft)] py-2 text-center text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft-hover)]"
            >
              Edit listing
            </Link>
          ) : (
            <ListingBookingForm
              listingId={listing.id}
              maxGuests={listing.maxGuests}
              weekdayPrice={listing.weekdayPrice}
              weekendPrice={listing.weekendPrice}
              isLoggedIn={session != null}
              initialCheckIn={bookingDefaults.initialCheckIn}
              initialCheckOut={bookingDefaults.initialCheckOut}
              initialGuests={bookingDefaults.initialGuests}
            />
          )}
        </aside>
      </div>
    </main>
  );
}
