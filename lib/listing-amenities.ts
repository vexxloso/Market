/** Stored on Listing as exact label strings (matches host wizard / Airbnb-style copy). */

export const GUEST_FAVORITES = [
  "Wifi",
  "TV",
  "Kitchen",
  "Washer",
  "Free parking on premises",
  "Paid parking on premises",
  "Air conditioning",
  "Dedicated workspace",
] as const;

export const STANDOUT_AMENITIES = [
  "Pool",
  "Hot tub",
  "Patio",
  "BBQ grill",
  "Outdoor dining area",
  "Fire pit",
  "Pool table",
  "Indoor fireplace",
  "Piano",
  "Exercise equipment",
  "Lake access",
  "Beach access",
  "Ski-in/Ski-out",
  "Outdoor shower",
] as const;

export const SAFETY_AMENITIES = [
  "Smoke alarm",
  "First aid kit",
  "Fire extinguisher",
  "Carbon monoxide alarm",
] as const;

export type GuestFavorite = (typeof GUEST_FAVORITES)[number];
export type StandoutAmenity = (typeof STANDOUT_AMENITIES)[number];
export type SafetyAmenity = (typeof SAFETY_AMENITIES)[number];
