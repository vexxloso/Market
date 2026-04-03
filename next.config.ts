import type { NextConfig } from "next";
import path from "node:path";

/** Use a different build dir on Windows if `.next` stays locked (e.g. EBUSY rename). Set in `.env.local`: NEXT_DIST_DIR=.next-local */
const distDir = process.env.NEXT_DIST_DIR?.trim();

const nextConfig: NextConfig = {
  ...(distDir ? { distDir: path.normalize(distDir) } : {}),
  /** Reduces Windows EBUSY / rename issues with Turbopack’s on-disk dev cache on some drives. */
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
