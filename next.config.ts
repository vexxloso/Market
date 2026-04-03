import type { NextConfig } from "next";
import path from "node:path";

/** Use a different build dir on Windows if `.next` stays locked (e.g. EBUSY rename). Set in `.env.local`: NEXT_DIST_DIR=.next-local */
const distDir = process.env.NEXT_DIST_DIR?.trim();

/** When set (e.g. `/market`), app + APIs live under that path so Nginx can share port 80 with a static site. */
const basePathRaw = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
const basePath =
  basePathRaw && basePathRaw !== "/"
    ? basePathRaw.startsWith("/")
      ? basePathRaw
      : `/${basePathRaw}`
    : undefined;

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
  ...(distDir ? { distDir: path.normalize(distDir) } : {}),
  /** Reduces Windows EBUSY / rename issues with Turbopack’s on-disk dev cache on some drives. */
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
