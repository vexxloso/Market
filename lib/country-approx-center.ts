/** Rough country center for map pin when Google Maps verification is unavailable (dev / misconfigured API). */
const CENTERS: Record<string, { lat: number; lng: number }> = {
  US: { lat: 39.8283, lng: -98.5795 },
  GB: { lat: 54.7023, lng: -3.2766 },
  CA: { lat: 56.1304, lng: -106.3468 },
  AU: { lat: -25.2744, lng: 133.7751 },
  DE: { lat: 51.1657, lng: 10.4515 },
  FR: { lat: 46.2276, lng: 2.2137 },
  ES: { lat: 40.4637, lng: -3.7492 },
  IT: { lat: 41.8719, lng: 12.5674 },
  PT: { lat: 39.3999, lng: -8.2245 },
  NL: { lat: 52.1326, lng: 5.2913 },
  BR: { lat: -14.235, lng: -51.9253 },
  MX: { lat: 23.6345, lng: -102.5528 },
  IN: { lat: 20.5937, lng: 78.9629 },
  ID: { lat: -0.7893, lng: 113.9213 },
  JP: { lat: 36.2048, lng: 138.2529 },
  KR: { lat: 35.9078, lng: 127.7669 },
  TH: { lat: 15.87, lng: 100.9925 },
  NZ: { lat: -40.9006, lng: 174.886 },
};

export function countryApproxCenter(isoCode: string): { lat: number; lng: number } {
  const c = CENTERS[isoCode.toUpperCase()];
  return c ?? { lat: 0, lng: 0 };
}
