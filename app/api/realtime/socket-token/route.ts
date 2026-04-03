import { SignJWT } from "jose";
import { NextResponse } from "next/server";
import { getVerifiedSessionUser } from "@/lib/auth";

function secret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? "dev-insecure-jwt-secret-change-me",
  );
}

/** Short-lived token for Socket.IO auth (same secret as session JWT). */
export async function POST() {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const token = await new SignJWT({ rt: "ws" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.id)
    .setIssuedAt()
    .setExpirationTime("4h")
    .sign(secret());

  return NextResponse.json({ token });
}
