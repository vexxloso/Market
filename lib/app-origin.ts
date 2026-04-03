/** Origin only (scheme + host, no path). */
function envOriginOnly(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (env) return env;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Optional URL prefix when the app is mounted under a path (must match next.config basePath). */
export function getPublicBasePath(): string {
  const bp = process.env.NEXT_PUBLIC_BASE_PATH?.trim().replace(/\/$/, "") || "";
  if (!bp || bp === "/") return "";
  return bp.startsWith("/") ? bp : `/${bp}`;
}

/**
 * Prefix for browser `fetch()` / `new Request()` so `/api/*` hits the Next app under basePath.
 * Root-relative paths like `/api/...` go to the site origin only (e.g. wrong on `/market`).
 */
export function withBasePath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const bp = getPublicBasePath();
  return bp ? `${bp}${p}` : p;
}

/**
 * Public base URL for absolute links (emails, redirects, Stripe return URLs).
 * Use origin from the request when available so Host / X-Forwarded-* match Nginx.
 */
export function getAppPublicBaseUrl(request?: Request): string {
  let origin: string;
  if (request) {
    const host =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (host) {
      const proto = request.headers.get("x-forwarded-proto") ?? "http";
      origin = `${proto}://${host}`;
    } else {
      origin = envOriginOnly();
    }
  } else {
    origin = envOriginOnly();
  }

  const o = origin.replace(/\/$/, "");
  const bp = getPublicBasePath();
  return bp ? `${o}${bp}` : o;
}

/** @deprecated Prefer getAppPublicBaseUrl — kept for calls that only need scheme+host. */
export function getAppOrigin(request?: Request): string {
  if (request) {
    const host =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (host) {
      const proto = request.headers.get("x-forwarded-proto") ?? "http";
      return `${proto}://${host}`;
    }
  }
  return envOriginOnly();
}
