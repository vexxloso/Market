import { NextResponse } from "next/server";
import { ListingStatus, StayType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

type UpdatePayload = {
  title?: string;
  description?: string;
  stayType?: StayType;
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
  maxGuests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  imageUrl?: string;
  imageUrls?: string[];
  guestFavorites?: string[];
  standoutAmenities?: string[];
  safetyAmenities?: string[];
  hostLanguages?: string[];
  status?: ListingStatus;
};

export async function GET(_request: Request, { params }: Params) {
  const session = await getVerifiedSessionUser();
  if (!session || (session.role !== "HOST" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Host login required." }, { status: 403 });
  }

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  if (session.role !== "ADMIN" && listing.hostId !== session.id) {
    return NextResponse.json({ error: "Not your listing." }, { status: 403 });
  }

  return NextResponse.json({ data: listing });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getVerifiedSessionUser();
  if (!session || (session.role !== "HOST" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Host login required." }, { status: 403 });
  }

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  if (session.role !== "ADMIN" && listing.hostId !== session.id) {
    return NextResponse.json({ error: "Not your listing." }, { status: 403 });
  }

  const body = (await request.json()) as UpdatePayload;

  if (body.status === ListingStatus.PUBLISHED) {
    const guestFavorites = (body.guestFavorites ?? listing.guestFavorites).filter(Boolean);
    const standoutAmenities = (body.standoutAmenities ?? listing.standoutAmenities).filter(
      Boolean,
    );
    const safetyAmenities = (body.safetyAmenities ?? listing.safetyAmenities).filter(Boolean);
    const hostLanguages = (body.hostLanguages ?? listing.hostLanguages).filter(Boolean);
    const imageUrls = (body.imageUrls ?? listing.imageUrls).filter(Boolean);
    const title = (body.title ?? listing.title).trim();
    const description = (body.description ?? listing.description).trim();
    const location = (body.location ?? listing.location).trim();
    const country = (body.country ?? listing.country).trim();
    const maxGuests = body.maxGuests ?? listing.maxGuests;
    const bedrooms = body.bedrooms ?? listing.bedrooms;
    const beds = body.beds ?? listing.beds;
    const bathrooms = body.bathrooms ?? listing.bathrooms;
    const weekdayPrice = body.weekdayPrice ?? listing.weekdayPrice;
    const weekendPrice = body.weekendPrice ?? listing.weekendPrice;

    if (!title || description.length < 20 || !location || !country) {
      return NextResponse.json(
        { error: "Complete title, description, and location before publishing." },
        { status: 400 },
      );
    }
    if (
      guestFavorites.length === 0 ||
      standoutAmenities.length === 0 ||
      safetyAmenities.length === 0 ||
      hostLanguages.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Select at least one guest favorite, standout amenity, safety item, and host language.",
        },
        { status: 400 },
      );
    }
    if (maxGuests < 1 || bedrooms < 1 || beds < 1 || bathrooms < 0.5) {
      return NextResponse.json({ error: "Invalid capacity values." }, { status: 400 });
    }
    if (weekdayPrice < 1 || weekendPrice < 1) {
      return NextResponse.json({ error: "Prices must be at least 1." }, { status: 400 });
    }
    if (imageUrls.length < 5) {
      return NextResponse.json({ error: "Upload at least 5 photos." }, { status: 400 });
    }

    const finalLat =
      body.latitude !== undefined && !Number.isNaN(body.latitude)
        ? body.latitude
        : listing.latitude;
    const finalLng =
      body.longitude !== undefined && !Number.isNaN(body.longitude)
        ? body.longitude
        : listing.longitude;
    if (
      !Number.isFinite(finalLat) ||
      !Number.isFinite(finalLng) ||
      (finalLat === 0 && finalLng === 0)
    ) {
      return NextResponse.json(
        { error: "Set a map location (latitude and longitude) before publishing." },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: {
      title: body.title ?? listing.title,
      description: body.description ?? listing.description,
      stayType: body.stayType ?? listing.stayType,
      location: body.location ?? listing.location,
      country: body.country ?? listing.country,
      streetLine1: body.streetLine1 ?? listing.streetLine1,
      streetLine2: body.streetLine2 ?? listing.streetLine2,
      city: body.city ?? listing.city,
      stateRegion: body.stateRegion ?? listing.stateRegion,
      postalCode: body.postalCode ?? listing.postalCode,
      latitude:
        body.latitude !== undefined && !Number.isNaN(body.latitude)
          ? body.latitude
          : listing.latitude,
      longitude:
        body.longitude !== undefined && !Number.isNaN(body.longitude)
          ? body.longitude
          : listing.longitude,
      pricePerNight: body.pricePerNight ?? body.weekdayPrice ?? listing.pricePerNight,
      weekdayPrice: body.weekdayPrice ?? listing.weekdayPrice,
      weekendPrice: body.weekendPrice ?? listing.weekendPrice,
      maxGuests: body.maxGuests ?? listing.maxGuests,
      bedrooms: body.bedrooms ?? listing.bedrooms,
      beds: body.beds ?? listing.beds,
      bathrooms: body.bathrooms ?? listing.bathrooms,
      imageUrl: body.imageUrl ?? listing.imageUrl,
      imageUrls: body.imageUrls ?? listing.imageUrls,
      guestFavorites: body.guestFavorites ?? listing.guestFavorites,
      standoutAmenities: body.standoutAmenities ?? listing.standoutAmenities,
      safetyAmenities: body.safetyAmenities ?? listing.safetyAmenities,
      hostLanguages: body.hostLanguages ?? listing.hostLanguages,
      status: body.status ?? listing.status,
    },
  });

  return NextResponse.json({ data: updated });
}
