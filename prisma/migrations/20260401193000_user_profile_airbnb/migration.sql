-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "work" TEXT,
ADD COLUMN     "profileAnswers" JSONB,
ADD COLUMN     "showTravelStamps" BOOLEAN NOT NULL DEFAULT true;
