import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getPrimaryAdminUserId(): Promise<string | null> {
  const u = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return u?.id ?? null;
}
