import { NextResponse } from "next/server";
import { ListingStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { sendPlatformMessageToUser } from "@/lib/admin-messaging";
import { getAppPublicBaseUrl } from "@/lib/app-origin";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getVerifiedSessionUser();
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { reason?: string };
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason) {
    return NextResponse.json({ error: "Reason is required." }, { status: 400 });
  }
  if (reason.length > 2000) {
    return NextResponse.json({ error: "Reason is too long." }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, title: true, hostId: true, status: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const origin = getAppPublicBaseUrl(request);
  const listingUrl = `${origin}/listing/${listing.id}`;
  const profileUrl = `${origin}/profile/${listing.hostId}`;
  const hostListingsUrl = `${origin}/profile?tab=listings`;

  const note =
    `[Noire Haven — listing unpublished]\n` +
    `Your listing “${listing.title}” was unpublished by platform moderation.\n` +
    `Reason: ${reason}\n\n` +
    `Links:\n• Listing: ${listingUrl}\n• Your profile: ${profileUrl}\n• Host listings tab: ${hostListingsUrl}`;

  try {
    await sendPlatformMessageToUser({
      adminUserId: session.id,
      targetUserId: listing.hostId,
      body: note,
    });
  } catch (e) {
    if ((e as Error).message === "NO_ADMIN_USER") {
      return NextResponse.json(
        { error: "No admin user available for support messaging." },
        { status: 500 },
      );
    }
    throw e;
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: { status: ListingStatus.UNPUBLISHED },
  });

  return NextResponse.json({ data: updated });
}
