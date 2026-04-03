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
  const body = (await request.json()) as { banned?: boolean };

  if (typeof body.banned !== "boolean") {
    return NextResponse.json({ error: "banned boolean required." }, { status: 400 });
  }

  if (id === session.id) {
    return NextResponse.json({ error: "You cannot ban yourself." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (target.role === UserRole.ADMIN && body.banned) {
    return NextResponse.json({ error: "Cannot ban an admin account." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { bannedAt: body.banned ? new Date() : null },
    select: { id: true, bannedAt: true },
  });

  return NextResponse.json({ data: user });
}
