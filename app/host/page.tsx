import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { BookingAcceptButton } from "@/components/booking-accept-button";

export default async function HostDashboardPage() {
  const session = await getVerifiedSessionUser();
  if (!session || (session.role !== UserRole.HOST && session.role !== UserRole.ADMIN)) {
    redirect("/?auth=login");
  }

  const myListings = await prisma.listing.findMany({
    where: { hostId: session.id },
    orderBy: { createdAt: "desc" },
  });

  const myBookings = await prisma.booking.findMany({
    where: {
      listing: { hostId: session.id },
    },
    include: { listing: true, user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="container py-8">
      <section className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Host dashboard</h1>
          <p className="muted text-sm">Manage your listings and reservations.</p>
        </div>
        <Link
          href="/host/new"
          className="brand-btn rounded-xl px-4 py-2 text-sm font-semibold text-white"
        >
          Add listing
        </Link>
      </section>

      <section className="mb-7 rounded-2xl border border-[var(--border)] bg-white p-4">
        <h2 className="mb-3 text-base font-semibold">My listings</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {myListings.map((listing) => (
            <article key={listing.id} className="rounded-xl border p-3">
              <p className="font-medium">{listing.title}</p>
              <p className="muted text-sm">
                {listing.location}, {listing.country}
              </p>
              <p className="text-sm">${listing.pricePerNight} / night</p>
            </article>
          ))}
          {myListings.length === 0 && (
            <p className="muted text-sm">No listings yet. Create your first one.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
        <h2 className="mb-3 text-base font-semibold">Incoming bookings</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="py-2">Listing</th>
                <th className="py-2">Guest</th>
                <th className="py-2">Dates</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {myBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-[var(--border)]">
                  <td className="py-2">{booking.listing.title}</td>
                  <td className="py-2">{booking.user.email}</td>
                  <td className="py-2">
                    {booking.checkIn.toISOString().slice(0, 10)} -{" "}
                    {booking.checkOut.toISOString().slice(0, 10)}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-3">
                      <span>{booking.status}</span>
                      <BookingAcceptButton
                        bookingId={booking.id}
                        status={booking.status}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {myBookings.length === 0 && (
                <tr>
                  <td className="py-2 muted" colSpan={4}>
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
