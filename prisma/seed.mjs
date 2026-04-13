import {
  PrismaClient,
  BookingStatus,
  UserRole,
  ListingStatus,
} from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";
import { LISTING_SPECS } from "./listing-seeds.mjs";

const prisma = new PrismaClient();

/** Same algorithm as `lib/password.ts` — use this password for every seeded account in dev. */
const SEED_LOGIN_PASSWORD = "password123";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}

const seedPasswordHash = hashPassword(SEED_LOGIN_PASSWORD);

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  // Normalize time so date-based comparisons in UI behave predictably.
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  const seedVerifiedAt = new Date();
  // eslint-disable-next-line no-console
  console.log(
    `[seed] Login password for all seeded accounts: ${SEED_LOGIN_PASSWORD}`,
  );
  // WARNING: This seed wipes and recreates core tables for easier testing.
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  const hostA = await prisma.user.create({
    data: {
      email: "jamesjhonn93@gmail.com",
      passwordHash: seedPasswordHash,
      emailVerifiedAt: seedVerifiedAt,
      name: "Host James",
      role: UserRole.HOST,
      avatarUrl: "https://i.pravatar.cc/150?img=14",
      bio: "I love welcoming guests and keeping things cozy.",
      work: "Local design & hospitality",
      profileAnswers: {},
    },
  });

  const hostB = await prisma.user.create({
    data: {
      email: "hoster1@gmail.com",
      passwordHash: seedPasswordHash,
      emailVerifiedAt: seedVerifiedAt,
      name: "Host Hoster1",
      role: UserRole.HOST,
      avatarUrl: "https://i.pravatar.cc/150?img=15",
      profileAnswers: {},
    },
  });

  const hostC = await prisma.user.create({
    data: {
      email: "hoster2@gmail.com",
      passwordHash: seedPasswordHash,
      emailVerifiedAt: seedVerifiedAt,
      name: "Host Hoster2",
      role: UserRole.HOST,
      avatarUrl: "https://i.pravatar.cc/150?img=16",
      profileAnswers: {},
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "andrea.business112@gmail.com",
      passwordHash: seedPasswordHash,
      emailVerifiedAt: seedVerifiedAt,
      name: "Platform Admin",
      role: UserRole.ADMIN,
      avatarUrl: "https://i.pravatar.cc/150?img=12",
    },
  });

  const guestUsers = await Promise.all(
    [
      ["riorajhon19930303@gmail.com", "Guest One", 24],
      ["guest2@stayly.dev", "Guest Two", 32],
      ["guest3@stayly.dev", "Guest Three", 44],
      ["guest4@stayly.dev", "Guest Four", 55],
      ["guest5@stayly.dev", "Guest Five", 66],
      ["guest6@stayly.dev", "Guest Six", 77],
    ].map(([email, name, img]) =>
      prisma.user.create({
        data: {
          email,
          passwordHash: seedPasswordHash,
          emailVerifiedAt: seedVerifiedAt,
          name,
          role: UserRole.GUEST,
          avatarUrl: `https://i.pravatar.cc/150?img=${img}`,
        },
      }),
    ),
  );

  const [guest1, guest2, guest3, guest4, guest5, guest6] = guestUsers;

  const UNSPLASH_IMAGES = [
    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1631049552240-59c37f38802b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=80",
  ];

  const DEFAULT_GUEST_FAV = ["Wifi", "Kitchen", "Heating"];
  const DEFAULT_STANDOUT = ["Patio"];
  const DEFAULT_SAFETY = ["Smoke alarm", "First aid kit"];
  const DEFAULT_LANG = ["English"];

  function imageSet(index) {
    return [0, 1, 2, 3, 4].map(
      (j) => UNSPLASH_IMAGES[(index + j) % UNSPLASH_IMAGES.length],
    );
  }

  const hostIds = [hostA.id, hostB.id, hostC.id];

  const listings = await Promise.all(
    LISTING_SPECS.map((spec, i) => {
      const imgs = imageSet(i);
      return prisma.listing.create({
        data: {
          hostId: hostIds[i % 3],
          title: spec.title,
          description: spec.description,
          stayType: spec.stayType,
          status: ListingStatus.PUBLISHED,
          location: spec.location,
          country: spec.country,
          streetLine1: spec.streetLine1,
          city: spec.city,
          stateRegion: spec.stateRegion,
          postalCode: spec.postalCode,
          latitude: spec.lat,
          longitude: spec.lng,
          pricePerNight: spec.pricePerNight,
          weekdayPrice: spec.weekday,
          weekendPrice: spec.weekend,
          maxGuests: spec.maxGuests,
          bedrooms: spec.bedrooms,
          beds: spec.beds,
          bathrooms: spec.bathrooms,
          imageUrl: imgs[0],
          imageUrls: imgs,
          guestFavorites: spec.guestFavorites ?? DEFAULT_GUEST_FAV,
          standoutAmenities: spec.standoutAmenities ?? DEFAULT_STANDOUT,
          safetyAmenities: spec.safetyAmenities ?? DEFAULT_SAFETY,
          hostLanguages: spec.hostLanguages ?? DEFAULT_LANG,
        },
      });
    }),
  );

  const [listing1, listing2, listing3, listing4] = listings;

  // Likes: create varying like counts.
  await prisma.listingLike.createMany({
    skipDuplicates: true,
    data: [
      // listing1 liked by guest1..guest3
      { userId: guest1.id, listingId: listing1.id },
      { userId: guest2.id, listingId: listing1.id },
      { userId: guest3.id, listingId: listing1.id },

      // listing2 liked by guest1..guest6
      { userId: guest1.id, listingId: listing2.id },
      { userId: guest2.id, listingId: listing2.id },
      { userId: guest3.id, listingId: listing2.id },
      { userId: guest4.id, listingId: listing2.id },
      { userId: guest5.id, listingId: listing2.id },
      { userId: guest6.id, listingId: listing2.id },

      // listing3 liked by guest2, guest4
      { userId: guest2.id, listingId: listing3.id },
      { userId: guest4.id, listingId: listing3.id },

      // listing4 liked by guest1, guest3
      { userId: guest1.id, listingId: listing4.id },
      { userId: guest3.id, listingId: listing4.id },
    ],
  });

  // Bookings in all stages
  const pendingBooking = await prisma.booking.create({
    data: {
      userId: guest1.id,
      listingId: listing1.id,
      checkIn: daysFromNow(10),
      checkOut: daysFromNow(14),
      guests: 2,
      totalPrice: 520,
      status: BookingStatus.PENDING,
    },
  });

  await prisma.booking.create({
    data: {
      userId: guest1.id,
      listingId: listing2.id,
      checkIn: daysFromNow(20),
      checkOut: daysFromNow(24),
      guests: 2,
      totalPrice: 560,
      status: BookingStatus.ACCEPTED,
    },
  });

  // PAID booking with checkout already in the past (so review form shows on Profile -> Bookings)
  const paidPastBooking = await prisma.booking.create({
    data: {
      userId: guest1.id,
      listingId: listing3.id,
      checkIn: daysFromNow(-40),
      checkOut: daysFromNow(-35),
      guests: 2,
      totalPrice: 780,
      status: BookingStatus.PAID,
    },
  });

  // COMPLETED booking + review already written
  const completedPastBooking = await prisma.booking.create({
    data: {
      userId: guest4.id,
      listingId: listing2.id,
      checkIn: daysFromNow(-80),
      checkOut: daysFromNow(-75),
      guests: 2,
      totalPrice: 820,
      status: BookingStatus.COMPLETED,
    },
  });

  await prisma.booking.create({
    data: {
      userId: guest5.id,
      listingId: listing3.id,
      checkIn: daysFromNow(30),
      checkOut: daysFromNow(32),
      guests: 1,
      totalPrice: 240,
      status: BookingStatus.CANCELLED,
    },
  });

  // A few reviews per listing for avg rating + count.
  // IMPORTANT: Do NOT create a review for paidPastBooking's guest (guest1) / listing3
  // so the review form remains actionable.
  await prisma.review.createMany({
    data: [
      {
        userId: guest1.id,
        listingId: listing1.id,
        rating: 5,
        comment: "Incredible space—everything felt spotless and easy.",
      },
      {
        userId: guest2.id,
        listingId: listing1.id,
        rating: 4,
        comment: "Great host and location. Would stay again.",
      },
      {
        userId: guest3.id,
        listingId: listing1.id,
        rating: 5,
        comment: "Perfect for our weekend trip. Loved the balcony!",
      },

      // listing2 has many reviews (used by Most reviews + rating)
      {
        userId: guest1.id,
        listingId: listing2.id,
        rating: 5,
        comment: "Fantastic experience. Clean, comfy, and very responsive.",
      },
      {
        userId: guest2.id,
        listingId: listing2.id,
        rating: 4,
        comment: "Nice stay and good neighborhood. Highly recommend.",
      },
      {
        userId: guest4.id,
        listingId: listing2.id,
        rating: 5,
        comment: "Everything went smoothly. Great value for money.",
      },
      {
        userId: guest5.id,
        listingId: listing2.id,
        rating: 4,
        comment: "Lovely place—quiet and well equipped.",
      },

      // listing3
      {
        userId: guest2.id,
        listingId: listing3.id,
        rating: 5,
        comment: "Hot tub was amazing and the cabin felt super cozy.",
      },
      {
        userId: guest4.id,
        listingId: listing3.id,
        rating: 4,
        comment: "Relaxing getaway, great amenities and vibe.",
      },

      // listing4
      {
        userId: guest1.id,
        listingId: listing4.id,
        rating: 5,
        comment: "Amazing sunset view. Perfect for a couple’s trip.",
      },
      {
        userId: guest6.id,
        listingId: listing4.id,
        rating: 3,
        comment: "Good stay overall, a few minor issues but manageable.",
      },

      // completedPastBooking guest writes a review
      {
        userId: guest4.id,
        listingId: listing2.id,
        rating: 5,
        comment: "Booking completed and I would absolutely return.",
      },
    ],
    skipDuplicates: true,
  });

  // Ensure conversation/messages are created by the UI when needed.
  // We intentionally don't create Conversation/Message here to keep seed simple.
  void pendingBooking;
  void paidPastBooking;
  void completedPastBooking;

  await prisma.$disconnect();
}

main()
  .then(async () => {
    console.log("Seed completed.");
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
