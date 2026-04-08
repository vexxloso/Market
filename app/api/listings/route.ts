import { NextResponse } from "next/server";
import { ListingStatus, StayType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import {
  STRIPE_CONNECT_REQUIRED_CODE,
  STRIPE_CONNECT_REQUIRED_MESSAGE,
  hostCanPublishListings,
} from "@/lib/host-stripe-payout";

export async function GET() {
  const data = await prisma.listing.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    include: { host: true, reviews: true },
  });
  return NextResponse.json({ data });
}

type ListingPayload = {
  title?: string;
  description?: string;
  stayType?: StayType;
  status?: ListingStatus;
  location?: string;
  country?: string;
  streetLine1?: string;
  streetLine2?: string;
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  pricePerNight?: number;
  weekdayPrice?: number;
  weekendPrice?: number;
  imageUrl?: string;
  imageUrls?: string[];
  maxGuests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  guestFavorites?: string[];
  standoutAmenities?: string[];
  safetyAmenities?: string[];
  hostLanguages?: string[];
};

function isStayType(v: unknown): v is StayType {
  return v === "HOTEL_ROOM" || v === "BNB_ROOM" || v === "RENTAL_ROOM";
}

function isListingStatus(v: unknown): v is ListingStatus {
  return v === "INCOMPLETE" || v === "PUBLISHED" || v === "UNPUBLISHED";
}

export async function POST(request: Request) {
  const session = await getVerifiedSessionUser();
  if (!session || (session.role !== "HOST" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Host login required." }, { status: 403 });
  }

  const me = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      stripeAccountId: true,
      stripeConnectStatus: true,
      stripeChargesEnabled: true,
      stripePayoutsEnabled: true,
    },
  });
  if (!me) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const canPublish = hostCanPublishListings(session.role, me);

  const body = (await request.json()) as ListingPayload;
  const statusExplicit = body.status && isListingStatus(body.status);
  const status = statusExplicit ? body.status! : canPublish ? ListingStatus.PUBLISHED : ListingStatus.INCOMPLETE;

  if (status === ListingStatus.PUBLISHED && !canPublish) {
    return NextResponse.json(
      { error: STRIPE_CONNECT_REQUIRED_MESSAGE, code: STRIPE_CONNECT_REQUIRED_CODE },
      { status: 403 },
    );
  }

  const stayType = body.stayType && isStayType(body.stayType) ? body.stayType : "RENTAL_ROOM";

  const guestFavorites = body.guestFavorites?.filter(Boolean) ?? [];
  const standoutAmenities = body.standoutAmenities?.filter(Boolean) ?? [];
  const safetyAmenities = body.safetyAmenities?.filter(Boolean) ?? [];
  const hostLanguages = body.hostLanguages?.filter(Boolean) ?? [];
  const imageUrls = body.imageUrls?.filter(Boolean) ?? [];

  if (
    status === ListingStatus.PUBLISHED &&
    (guestFavorites.length === 0 ||
      standoutAmenities.length === 0 ||
      safetyAmenities.length === 0 ||
      hostLanguages.length === 0)
  ) {
    return NextResponse.json(
      {
        error:
          "Select at least one guest favorite, standout amenity, safety item, and host language.",
      },
      { status: 400 },
    );
  }

  const maxGuests = body.maxGuests ?? 2;
  const bedrooms = body.bedrooms ?? 1;
  const beds = body.beds ?? 1;
  const bathrooms = body.bathrooms ?? 1;

  if (
    status === ListingStatus.PUBLISHED &&
    (maxGuests < 1 || bedrooms < 1 || beds < 1 || bathrooms < 0.5)
  ) {
    return NextResponse.json({ error: "Invalid capacity values." }, { status: 400 });
  }

  const weekdayPrice = body.weekdayPrice ?? body.pricePerNight ?? 100;
  const weekendPrice = body.weekendPrice ?? body.pricePerNight ?? 120;
  if (status === ListingStatus.PUBLISHED && (weekdayPrice < 1 || weekendPrice < 1)) {
    return NextResponse.json({ error: "Prices must be at least 1." }, { status: 400 });
  }
  if (status === ListingStatus.PUBLISHED && imageUrls.length < 5) {
    return NextResponse.json({ error: "Upload at least 5 photos." }, { status: 400 });
  }

  const lat =
    body.latitude !== undefined && !Number.isNaN(body.latitude)
      ? body.latitude
      : 0;
  const lng =
    body.longitude !== undefined && !Number.isNaN(body.longitude)
      ? body.longitude
      : 0;

  if (
    status === ListingStatus.PUBLISHED &&
    (!Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      (lat === 0 && lng === 0))
  ) {
    return NextResponse.json(
      { error: "Set a map location (latitude and longitude) before publishing." },
      { status: 400 },
    );
  }

  const listing = await prisma.listing.create({
    data: {
      hostId: session.id,
      title: body.title?.trim() || "Untitled draft listing",
      description: body.description?.trim() || "Draft listing description.",
      stayType,
      status,
      location: body.location?.trim() || "Unknown location",
      country: body.country?.trim() || "Unknown country",
      streetLine1: body.streetLine1?.trim() ?? "",
      streetLine2: body.streetLine2?.trim() ?? "",
      city: body.city?.trim() ?? "",
      stateRegion: body.stateRegion?.trim() ?? "",
      postalCode: body.postalCode?.trim() ?? "",
      latitude: lat,
      longitude: lng,
      pricePerNight: weekdayPrice,
      weekdayPrice,
      weekendPrice,
      imageUrl:
        body.imageUrl?.trim() ||
        imageUrls[0] ||
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      imageUrls,
      guestFavorites,
      standoutAmenities,
      safetyAmenities,
      hostLanguages,
      maxGuests,
      bedrooms,
      beds,
      bathrooms,
    },
  });

  return NextResponse.json({ data: listing }, { status: 201 });
}
