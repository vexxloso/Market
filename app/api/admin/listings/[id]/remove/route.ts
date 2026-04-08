import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
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
    select: { id: true, title: true, hostId: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const origin = getAppPublicBaseUrl(request);
  const profileUrl = `${origin}/profile/${listing.hostId}`;
  const hostListingsUrl = `${origin}/profile?tab=listings`;

  const note =
    `[Noire Haven — listing removed]\n` +
    `Your listing “${listing.title}” was permanently removed by platform moderation.\n` +
    `Reason: ${reason}\n\n` +
    `Links:\n• Your profile: ${profileUrl}\n• Listings tab (manage others): ${hostListingsUrl}`;

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

  await prisma.listing.delete({ where: { id } });

  return NextResponse.json({ data: { removed: true } });
}
