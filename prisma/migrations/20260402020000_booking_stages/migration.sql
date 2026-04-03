-- Rename CONFIRMED -> PAID (matches existing behavior where payment confirmation set CONFIRMED)
ALTER TYPE "BookingStatus" RENAME VALUE 'CONFIRMED' TO 'PAID';

-- Add ACCEPTED stage for host acceptance flow
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';

