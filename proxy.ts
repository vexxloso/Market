import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "stayly_session";

async function parseRole(raw?: string) {
  if (!raw) return null;
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET ?? "dev-insecure-jwt-secret-change-me",
    );
    const { payload } = await jwtVerify(raw, secret);
    const role = payload.role;
    return role === "ADMIN" || role === "HOST" || role === "GUEST" ? role : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const role = await parseRole(request.cookies.get(SESSION_COOKIE)?.value);
  const isApiRequest = path.startsWith("/api/");

  if (path.startsWith("/admin")) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/?auth=login", request.url));
    }
  }

  if (path.startsWith("/api/admin")) {
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only." }, { status: 403 });
    }
  }

  if (path.startsWith("/host")) {
    if (role !== "HOST" && role !== "ADMIN") {
      if (isApiRequest) {
        return NextResponse.json({ error: "Host or admin required." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/?auth=login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/host/:path*", "/api/admin/:path*"],
};
