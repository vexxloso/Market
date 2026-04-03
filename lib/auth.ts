import { Prisma, UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "stayly_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  name?: string | null;
  /** From DB when using getVerifiedSessionUser; not stored in JWT. */
  avatarUrl?: string | null;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET ?? "dev-insecure-jwt-secret-change-me";
  return new TextEncoder().encode(secret);
}

type SessionClaims = {
  sub: string;
  email: string;
  role: UserRole;
  name?: string | null;
};

async function encodeSession(data: SessionUser) {
  return new SignJWT({
    email: data.email,
    role: data.role,
    name: data.name ?? null,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(data.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function decodeSession(value: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(value, getJwtSecret());
    const claims = payload as unknown as SessionClaims;
    if (!claims.sub || !claims.email || !claims.role) return null;
    return {
      id: claims.sub,
      email: claims.email,
      role: claims.role,
      name: claims.name ?? null,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return await decodeSession(raw);
}

function sessionCookieSecure(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  if (process.env.COOKIE_SECURE === "true") return true;
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  return url.startsWith("https://");
}

export async function setSessionUser(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: sessionCookieSecure(),
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getVerifiedSessionUser() {
  const session = await getSessionUser();
  if (!session) return null;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        avatarUrl: true,
        bannedAt: true,
      },
    });

    if (!dbUser) return null;
    if (dbUser.bannedAt) return null;

    return {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      name: dbUser.name,
      avatarUrl: dbUser.avatarUrl,
    } satisfies SessionUser;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientInitializationError) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[auth] Database unreachable — treating as signed out. Start PostgreSQL or fix DATABASE_URL.",
          e.message,
        );
      }
      return null;
    }
    throw e;
  }
}
