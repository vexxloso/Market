import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser, setSessionUser } from "@/lib/auth";

export async function POST() {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  if (session.role === UserRole.ADMIN || session.role === UserRole.HOST) {
    return NextResponse.json({ message: "Already hosting-capable.", role: session.role });
  }

  if (session.role !== UserRole.GUEST) {
    return NextResponse.json({ error: "Unexpected role." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.id },
    data: { role: UserRole.HOST },
  });

  const updated = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, role: true, name: true },
  });

  if (!updated) {
    return NextResponse.json({ error: "User update failed." }, { status: 500 });
  }

  await setSessionUser({
    id: updated.id,
    email: updated.email,
    role: updated.role,
    name: updated.name,
  });

  return NextResponse.json({
    message: "You can now list your place.",
    role: updated.role,
  });
}
