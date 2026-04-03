import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { Prisma, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { AdminDashboardClient } from "./admin-management-client";

const PAGE_SIZE = 12;

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
  const params = await searchParams;

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

    const [usersCount, listingsCount, bookingsCount, reviewsCount] = counts;

    const up = clampPage(pickPage(params.up), usersCount, PAGE_SIZE);
    const bp = clampPage(pickPage(params.bp), bookingsCount, PAGE_SIZE);
    const lp = clampPage(pickPage(params.lp), listingsCount, PAGE_SIZE);
    const rp = clampPage(pickPage(params.rp), reviewsCount, PAGE_SIZE);

    const [users, bookings, listings, recentReviews, seededAdmin] = await Promise.all([
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
        },
      }),
      prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        skip: (bp - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
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

    const userRows = users.map((u) => ({
      ...u,
      bannedAt: u.bannedAt?.toISOString() ?? null,
    }));

    const bookingRows = bookings.map((b) => ({
      id: b.id,
      status: b.status,
      guests: b.guests,
      totalPrice: b.totalPrice,
      checkIn: b.checkIn.toISOString(),
      checkOut: b.checkOut.toISOString(),
      user: b.user,
      listing: b.listing,
    }));

    const listingRows = listings.map((l) => ({
      id: l.id,
      title: l.title,
      status: l.status,
      pricePerNight: l.pricePerNight,
      coverImageUrl: l.imageUrls[0] ?? l.imageUrl,
      host: l.host,
      hostId: l.hostId,
    }));

    const reviewRows = recentReviews.map((r) => ({
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
  } catch (e) {
    if (isDatabaseUnreachable(e)) {
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
    throw e;
  }
}
