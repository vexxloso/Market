import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getVerifiedSessionUser();
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { role?: UserRole };
  if (!body.role || !Object.values(UserRole).includes(body.role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, email: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (id === session.id && body.role !== UserRole.ADMIN) {
    return NextResponse.json(
      { error: "You cannot remove your own admin role." },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: body.role },
  });

  return NextResponse.json({
    data: user,
    audit: {
      actorId: session.id,
      action: "USER_ROLE_UPDATED",
      targetUserId: user.id,
      previousRole: target.role,
      newRole: user.role,
    },
  });
}
