-- CreateEnum
CREATE TYPE "StripeConnectStatus" AS ENUM ('NOT_CONNECTED', 'PENDING', 'CONNECTED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('NOT_ELIGIBLE', 'ELIGIBLE', 'TRANSFERRED', 'PAID_OUT', 'FAILED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "hostPayoutAmount" INTEGER,
ADD COLUMN     "payoutEligibleAt" TIMESTAMP(3),
ADD COLUMN     "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'NOT_ELIGIBLE',
ADD COLUMN     "platformFeeAmount" INTEGER,
ADD COLUMN     "stripeCheckoutSessionId" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeConnectStatus" "StripeConnectStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
ADD COLUMN     "stripeDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "stripeTransferId" TEXT,
    "amount" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'NOT_ELIGIBLE',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payout_stripeTransferId_key" ON "Payout"("stripeTransferId");

-- CreateIndex
CREATE INDEX "Payout_bookingId_idx" ON "Payout"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_stripeCheckoutSessionId_key" ON "Booking"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_stripePaymentIntentId_key" ON "Booking"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeAccountId_key" ON "User"("stripeAccountId");

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

