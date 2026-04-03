import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id }, select: { id: true } });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const existing = await prisma.listingLike.findUnique({
    where: { userId_listingId: { userId: session.id, listingId: id } },
    select: { id: true },
  });

  if (existing) {
    await prisma.listingLike.delete({
      where: { id: existing.id },
    });
  } else {
    await prisma.listingLike.create({
      data: {
        userId: session.id,
        listingId: id,
      },
    });
  }

  const likeCount = await prisma.listingLike.count({ where: { listingId: id } });
  const liked = !existing;

  return NextResponse.json({ liked, likeCount });
}

