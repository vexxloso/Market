import type { Prisma } from "@prisma/client";
import { BookingStatus } from "@prisma/client";

export type ListingsSearchInput = {
  whereQuery?: string;
  checkIn?: string | null;
  checkOut?: string | null;
  guests?: number | undefined;
};

export function buildListingsWhere({
  whereQuery,
  checkIn,
  checkOut,
  guests,
}: ListingsSearchInput): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = {
    status: "PUBLISHED",
  };

  if (whereQuery) {
    where.OR = [
      { location: { contains: whereQuery, mode: "insensitive" } },
      { country: { contains: whereQuery, mode: "insensitive" } },
      { title: { contains: whereQuery, mode: "insensitive" } },
    ];
  }

  if (guests && guests > 0) {
    where.maxGuests = { gte: guests };
  }

  if (checkIn && checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (
      !Number.isNaN(checkInDate.getTime()) &&
      !Number.isNaN(checkOutDate.getTime())
    ) {
      where.NOT = {
        bookings: {
          some: {
            status: {
              in: [
                BookingStatus.PENDING,
                BookingStatus.ACCEPTED,
                BookingStatus.PAID,
              ],
            },
            AND: [
              { checkIn: { lt: checkOutDate } },
              { checkOut: { gt: checkInDate } },
            ],
          },
        },
      };
    }
  }

  return where;
}

