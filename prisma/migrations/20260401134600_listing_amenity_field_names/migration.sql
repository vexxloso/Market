-- Rename Listing amenity array columns (preserves existing data)
ALTER TABLE "Listing" RENAME COLUMN "essentials" TO "guestFavorites";
ALTER TABLE "Listing" RENAME COLUMN "features" TO "standoutAmenities";
ALTER TABLE "Listing" RENAME COLUMN "safetyItems" TO "safetyAmenities";
