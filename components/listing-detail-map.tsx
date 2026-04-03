"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadGoogleMapsScript,
  runWithGoogleMapsAuthGuard,
} from "@/lib/load-google-maps-script";

type Props = {
  apiKey: string | undefined;
  latitude: number;
  longitude: number;
  title?: string;
};

function isValidCoord(lat: number, lng: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

export function ListingDetailMap({ apiKey, latitude, longitude, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!apiKey || !containerRef.current || !isValidCoord(latitude, longitude)) return;
    let cancelled = false;
    (async () => {
      try {
        await loadGoogleMapsScript(apiKey);
        if (cancelled || !containerRef.current) return;
        await runWithGoogleMapsAuthGuard(() => {
          if (cancelled || !containerRef.current) return;
          const center = { lat: latitude, lng: longitude };
          const map = new google.maps.Map(containerRef.current!, {
            center,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
          new google.maps.Marker({
            map,
            position: center,
            title: title ?? "Listing location",
          });
          return map;
        });
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiKey, latitude, longitude, title]);

  if (!apiKey || !isValidCoord(latitude, longitude)) {
    return null;
  }

  if (loadFailed) {
    return (
      <p className="muted text-sm">
        Map unavailable. The exact address is shared after you book.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-[min(360px,45vh)] w-full overflow-hidden rounded-2xl bg-neutral-200"
      role="region"
      aria-label="Listing location map"
    />
  );
}
