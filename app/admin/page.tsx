import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { Prisma, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { AdminDashboardClient } from "./admin-management-client";

const PAGE_SIZE = 12;

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  bannedAt: string | null;
  avatarUrl: string | null;
  stripeAccountId: string | null;
  stripeConnectStatus: string;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
  stripeDetailsSubmitted: boolean;
  stripeVerifiedAt: string | null;
};

type BookingRow = {
  id: string;
  status: string;
  guests: number;
  totalPrice: number;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  platformFeeAmount: number | null;
  hostPayoutAmount: number | null;
  payoutStatus: string;
  payoutEligibleAt: string | null;
  lastPayout: { id: string; status: string; stripeTransferId: string | null; error: string | null } | null;
  checkIn: string;
  checkOut: string;
  user: { id: string; email: string; name: string | null; avatarUrl: string | null };
  listing: {
    id: string;
    title: string;
    hostId: string;
    host: { id: string; email: string; name: string | null; avatarUrl: string | null };
  };
};

type ListingRow = {
  id: string;
  title: string;
  status: string;
  pricePerNight: number;
  coverImageUrl: string;
  hostId: string;
  host: { id: string; email: string; name: string | null; avatarUrl: string | null };
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string;
  listing: {
    id: string;
    title: string;
    coverImageUrl: string;
    host: { id: string; email: string; name: string | null; avatarUrl: string | null };
  };
  guest: { id: string; email: string; name: string | null; avatarUrl: string | null };
};

function isDatabaseUnreachable(e: unknown) {
  if (e instanceof Prisma.PrismaClientInitializationError) return true;
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    (e.code === "P1001" || e.code === "P1017")
  );
}

function pickPage(raw: string | string[] | undefined): number {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(String(s ?? "1"), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function clampPage(page: number, total: number, size: number): number {
  const max = Math.max(1, Math.ceil(total / size));
  return Math.min(Math.max(1, page), max);
}

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getVerifiedSessionUser();
  if (!session || session.role !== UserRole.ADMIN) {
    redirect("/?auth=login");
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? null;
  const stripeMode =
    (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_")
      ? ("test" as const)
      : (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_")
        ? ("live" as const)
        : null;
  const params = await searchParams;

  let usersCount = 0;
  let listingsCount = 0;
  let bookingsCount = 0;
  let reviewsCount = 0;
  let up = 1;
  let bp = 1;
  let lp = 1;
  let rp = 1;

  let seededAdmin: { email: string; role: UserRole } | null = null;
  let userRows: UserRow[] = [];
  let bookingRows: BookingRow[] = [];
  let listingRows: ListingRow[] = [];
  let reviewRows: ReviewRow[] = [];
  let dbUnreachable = false;

  try {
    const [counts, seededAdminPromise] = await Promise.all([
      Promise.all([
        prisma.user.count(),
        prisma.listing.count(),
        prisma.booking.count(),
        prisma.review.count(),
      ]),
      adminEmail
        ? prisma.user.findUnique({
            where: { email: adminEmail },
            select: { email: true, role: true },
          })
        : Promise.resolve(null),
    ]);

    [usersCount, listingsCount, bookingsCount, reviewsCount] = counts;

    up = clampPage(pickPage(params.up), usersCount, PAGE_SIZE);
    bp = clampPage(pickPage(params.bp), bookingsCount, PAGE_SIZE);
    lp = clampPage(pickPage(params.lp), listingsCount, PAGE_SIZE);
    rp = clampPage(pickPage(params.rp), reviewsCount, PAGE_SIZE);

    const [users, bookings, listings, recentReviews, seededAdminResult] =
      await Promise.all([
        prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          skip: (up - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            bannedAt: true,
            avatarUrl: true,
            stripeAccountId: true,
            stripeConnectStatus: true,
            stripeChargesEnabled: true,
            stripePayoutsEnabled: true,
            stripeDetailsSubmitted: true,
            stripeVerifiedAt: true,
          },
        }),
        prisma.booking.findMany({
          orderBy: { createdAt: "desc" },
          skip: (bp - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          include: {
            payouts: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { id: true, status: true, stripeTransferId: true, error: true },
            },
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
            listing: {
              select: {
                id: true,
                title: true,
                hostId: true,
                host: {
                  select: { id: true, email: true, name: true, avatarUrl: true },
                },
              },
            },
          },
        }),
        prisma.listing.findMany({
          orderBy: { createdAt: "desc" },
          skip: (lp - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          select: {
            id: true,
            title: true,
            status: true,
            pricePerNight: true,
            imageUrl: true,
            imageUrls: true,
            hostId: true,
            host: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
          },
        }),
        prisma.review.findMany({
          orderBy: { createdAt: "desc" },
          skip: (rp - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
            listing: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                imageUrls: true,
                hostId: true,
                host: {
                  select: { id: true, email: true, name: true, avatarUrl: true },
                },
              },
            },
          },
        }),
        seededAdminPromise,
      ]);

    seededAdmin = seededAdminResult;

    userRows = users.map((u) => ({
      ...u,
      bannedAt: u.bannedAt?.toISOString() ?? null,
      stripeVerifiedAt: u.stripeVerifiedAt?.toISOString() ?? null,
    }));

    bookingRows = bookings.map((b) => ({
      id: b.id,
      status: b.status,
      guests: b.guests,
      totalPrice: b.totalPrice,
      stripeCheckoutSessionId: b.stripeCheckoutSessionId,
      stripePaymentIntentId: b.stripePaymentIntentId,
      platformFeeAmount: b.platformFeeAmount,
      hostPayoutAmount: b.hostPayoutAmount,
      payoutStatus: b.payoutStatus,
      payoutEligibleAt: b.payoutEligibleAt?.toISOString() ?? null,
      lastPayout: b.payouts[0] ?? null,
      checkIn: b.checkIn.toISOString(),
      checkOut: b.checkOut.toISOString(),
      user: b.user,
      listing: b.listing,
    }));

    listingRows = listings.map((l) => ({
      id: l.id,
      title: l.title,
      status: l.status,
      pricePerNight: l.pricePerNight,
      coverImageUrl: l.imageUrls[0] ?? l.imageUrl,
      host: l.host,
      hostId: l.hostId,
    }));

    reviewRows = recentReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      listing: {
        id: r.listing.id,
        title: r.listing.title,
        coverImageUrl: r.listing.imageUrls[0] ?? r.listing.imageUrl,
        host: r.listing.host,
      },
      guest: r.user,
    }));
  } catch (e) {
    if (isDatabaseUnreachable(e)) {
      dbUnreachable = true;
    } else {
      throw e;
    }
  }

  if (dbUnreachable) {
    return (
      <main className="container max-w-2xl py-10">
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          <p className="font-semibold">Database unreachable</p>
          <p className="mt-2 leading-relaxed">
            The app cannot connect to PostgreSQL. Your terminal likely shows Prisma{" "}
            <code className="rounded bg-amber-100/80 px-1">P1001</code> (connection refused).
          </p>
          <ul className="mt-4 list-inside list-disc space-y-1">
            <li>Start your PostgreSQL service (port 5432, or whatever <code>DATABASE_URL</code> uses).</li>
            <li>
              Confirm <code className="rounded bg-amber-100/80 px-1">DATABASE_URL</code> in{" "}
              <code className="rounded bg-amber-100/80 px-1">.env</code> matches the running server.
            </li>
            <li>Reload this page after the database is up.</li>
          </ul>
        </div>
        <p className="muted mt-4 text-xs">
          If you were sent to the home page with a login prompt instead: when the DB is down the session check can
          fail, so log in again after PostgreSQL is running.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[60vh]">
      <Suspense
        fallback={
          <div className="bg-[var(--background)] px-6 py-10 sm:px-10">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-8 text-sm text-[var(--muted)]">
              Loading admin tools…
            </div>
          </div>
        }
      >
        <AdminDashboardClient
          currentAdminId={session.id}
          stripeMode={stripeMode}
          usersCount={usersCount}
          listingsCount={listingsCount}
          bookingsCount={bookingsCount}
          reviewsCount={reviewsCount}
          pageSize={PAGE_SIZE}
          pagination={{ up, bp, lp, rp }}
          adminEmail={adminEmail}
          seededAdmin={seededAdmin}
          users={userRows}
          bookings={bookingRows}
          listings={listingRows}
          recentReviews={reviewRows}
        />
      </Suspense>
    </main>
  );
}
