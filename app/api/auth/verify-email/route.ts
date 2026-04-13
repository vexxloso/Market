import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAppPublicBaseUrl } from "@/lib/app-origin";

function redirect(request: Request, pathWithQuery: string) {
  const base = getAppPublicBaseUrl(request).replace(/\/$/, "");
  const q = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
  return NextResponse.redirect(`${base}${q}`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  if (!token) {
    return redirect(request, "/confirm-email?error=missing");
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return redirect(request, "/confirm-email?error=invalid");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpires: null,
      emailVerificationCode: null,
    },
  });

  return redirect(request, "/confirm-email?verified=1");
}
