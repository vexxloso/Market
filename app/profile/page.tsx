import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getVerifiedSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "./profile-client";
import { normalizeProfileAnswers } from "@/lib/profile-shared";
import { hostCanPublishListings, isHostStripePayoutReady } from "@/lib/host-stripe-payout";

type ProfilePageProps = {
  searchParams: Promise<{ tab?: string; booking?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const session = await getVerifiedSessionUser();
  if (!session) {
    redirect("/?auth=login");
  }

  const { tab: tabParam, booking: bookingThreadParam } = await searchParams;
  const initialMessageBookingId =
    typeof bookingThreadParam === "string" && bookingThreadParam.trim()
      ? bookingThreadParam.trim()
      : undefined;
  const initialTab =
    tabParam === "listings" ||
    tabParam === "bookings" ||
    tabParam === "messages" ||
    tabParam === "profile"
      ? tabParam
      : "profile";

  const hostPayoutFields =
    session.role === UserRole.HOST || session.role === UserRole.ADMIN
      ? await prisma.user.findUnique({
          where: { id: session.id },
          select: {
            stripeConnectStatus: true,
            stripeChargesEnabled: true,
            stripePayoutsEnabled: true,
            stripeAccountId: true,
            stripeDetailsSubmitted: true,
          },
        })
      : null;

  const stripePayoutVerified = hostPayoutFields
    ? isHostStripePayoutReady(hostPayoutFields)
    : false;
  const canPublishListings = hostPayoutFields
    ? hostCanPublishListings(session.role, hostPayoutFields)
    : false;

  const listings =
    session.role === UserRole.HOST || session.role === UserRole.ADMIN
      ? await prisma.listing.findMany({
          where: { hostId: session.id },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const tripBookings = await prisma.booking.findMany({
    where: { userId: session.id },
    include: {
      listing: {
        include: {
          host: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const hostIncomingBookings =
    session.role === UserRole.HOST || session.role === UserRole.ADMIN
      ? await prisma.booking.findMany({
          where: {
            listing: { hostId: session.id },
            userId: { not: session.id },
          },
          include: {
            listing: true,
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const profileUser =
    initialTab === "profile"
      ? await prisma.user.findUnique({
          where: { id: session.id },
          select: {
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
            work: true,
            role: true,
            profileAnswers: true,
          },
        })
      : null;

  const reviewsWritten =
    initialTab === "profile" && profileUser
      ? await prisma.review.findMany({
          where: { userId: session.id },
          orderBy: { createdAt: "desc" },
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                imageUrls: true,
                host: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        })
      : [];

  return (
    <main className="min-h-[60vh]">
      <ProfileClient
        session={{
          id: session.id,
          email: session.email,
          name: session.name,
          role: session.role,
          canManageListings:
            session.role === UserRole.HOST || session.role === UserRole.ADMIN,
        }}
        hostPayoutStatus={
          hostPayoutFields
            ? {
                verified: stripePayoutVerified,
                canPublishListings,
                stripeConnectStatus: hostPayoutFields.stripeConnectStatus,
                chargesEnabled: hostPayoutFields.stripeChargesEnabled,
                payoutsEnabled: hostPayoutFields.stripePayoutsEnabled,
                detailsSubmitted: hostPayoutFields.stripeDetailsSubmitted,
                hasStripeAccount: Boolean(hostPayoutFields.stripeAccountId),
              }
            : null
        }
        profile={
          profileUser
            ? {
                name: profileUser.name,
                email: profileUser.email,
                avatarUrl: profileUser.avatarUrl,
                bio: profileUser.bio,
                work: profileUser.work,
                role: profileUser.role,
                profileAnswers: normalizeProfileAnswers(profileUser.profileAnswers),
              }
            : null
        }
        reviewsWritten={reviewsWritten.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt.toISOString(),
          listing: {
            id: r.listing.id,
            title: r.listing.title,
            coverImageUrl:
              r.listing.imageUrls[0] ?? r.listing.imageUrl ?? null,
            host: {
              id: r.listing.host.id,
              name: r.listing.host.name,
              email: r.listing.host.email,
              avatarUrl: r.listing.host.avatarUrl,
            },
          },
        }))}
        listings={listings}
        tripBookings={tripBookings.map((b) => ({
          id: b.id,
          checkIn: b.checkIn.toISOString(),
          checkOut: b.checkOut.toISOString(),
          status: b.status,
          totalPrice: b.totalPrice,
          listing: {
            id: b.listing.id,
            title: b.listing.title,
            location: b.listing.location,
            country: b.listing.country,
            imageUrl: b.listing.imageUrl,
          },
          host: {
            id: b.listing.host.id,
            name: b.listing.host.name,
            email: b.listing.host.email,
            avatarUrl: b.listing.host.avatarUrl,
          },
        }))}
        hostIncomingBookings={hostIncomingBookings.map((b) => ({
          id: b.id,
          checkIn: b.checkIn.toISOString(),
          checkOut: b.checkOut.toISOString(),
          status: b.status,
          totalPrice: b.totalPrice,
          listing: {
            id: b.listing.id,
            title: b.listing.title,
            location: b.listing.location,
            country: b.listing.country,
            imageUrl: b.listing.imageUrl,
          },
          guest: {
            id: b.user.id,
            email: b.user.email,
            name: b.user.name,
            avatarUrl: b.user.avatarUrl,
          },
        }))}
        initialTab={initialTab}
        initialMessageBookingId={initialMessageBookingId}
      />
    </main>
  );
}
