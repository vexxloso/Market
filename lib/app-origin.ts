/** Absolute site origin for links inside support / admin messages. */
export function getAppOrigin(request?: Request): string {
  if (request) {
    const host =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (host) {
      const proto = request.headers.get("x-forwarded-proto") ?? "http";
      return `${proto}://${host}`;
    }
  }
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (env) return env;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
