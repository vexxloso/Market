"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadGoogleMapsScript,
  runWithGoogleMapsAuthGuard,
} from "@/lib/load-google-maps-script";
import {
  LISTING_ADDRESS_COUNTRIES,
  countryLabelFromCode,
} from "@/lib/listing-address-countries";

export type ListingAddressPayload = {
  location: string;
  country: string;
  streetLine1: string;
  streetLine2: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  verified: boolean;
};

type Props = {
  apiKey: string | undefined;
  value: ListingAddressPayload;
  onChange: (next: ListingAddressPayload) => void;
  onError: (message: string) => void;
  clearError: () => void;
  mapsUnavailable?: boolean;
  onMapsUnavailable?: () => void;
};

function countryCodeFromLabel(label: string): string {
  const row = LISTING_ADDRESS_COUNTRIES.find((c) => c.label === label);
  return row?.code ?? "US";
}

function verifyGeocodeResult(
  results: google.maps.GeocoderResult[] | null,
  status: google.maps.GeocoderStatus,
): { ok: true; result: google.maps.GeocoderResult } | { ok: false; message: string } {
  if (status !== "OK" || !results?.[0]) {
    return { ok: false, message: "Address could not be verified. Check details and try again." };
  }
  const r = results[0];
  const lt = r.geometry.location_type;
  if (
    lt !== google.maps.GeocoderLocationType.ROOFTOP &&
    lt !== google.maps.GeocoderLocationType.RANGE_INTERPOLATED &&
    lt !== google.maps.GeocoderLocationType.APPROXIMATE
  ) {
    return {
      ok: false,
      message:
        "Please pick a street-level suggestion from the list, not only a city or broad area.",
    };
  }
  return { ok: true, result: r };
}

function addressFieldsFromComponents(
  comps: google.maps.GeocoderAddressComponent[],
  lat: number,
  lng: number,
) {
  const get = (type: string) => comps.find((c) => c.types.includes(type))?.long_name ?? "";
  const getShort = (type: string) =>
    comps.find((c) => c.types.includes(type))?.short_name ?? "";
  const streetNum = get("street_number");
  const route = get("route");
  const premise = get("premise");
  const streetLine1 = [streetNum, route].filter(Boolean).join(" ").trim() || premise;
  const locality =
    get("locality") || get("postal_town") || get("sublocality") || get("neighborhood");
  const admin1 = get("administrative_area_level_1");
  const countryLong = get("country");
  const postal = get("postal_code");
  const guestLocation = [locality, admin1].filter(Boolean).join(", ");
  return {
    streetLine1,
    streetLine2: "",
    city: locality,
    stateRegion: admin1,
    postalCode: postal,
    country: countryLong || "",
    guestLocation: guestLocation || locality || admin1 || countryLong,
    lat: String(lat),
    lng: String(lng),
    countryCode: getShort("country"),
  };
}

function componentsFromGeocoderResult(r: google.maps.GeocoderResult) {
  const comps = r.address_components ?? [];
  const pos = r.geometry.location;
  return addressFieldsFromComponents(comps, pos.lat(), pos.lng());
}

export function ListingLocationStep({
  apiKey,
  value,
  onChange,
  onError,
  clearError,
  mapsUnavailable = false,
  onMapsUnavailable,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const [mapsReady, setMapsReady] = useState(false);
  /** Map + Places search (Airbnb-style). Shuts off when API key missing or Maps failed to init. */
  const useMapSearch = Boolean(apiKey) && !mapsUnavailable;
  const countryCode = countryCodeFromLabel(value.country);

  function patch(p: Partial<ListingAddressPayload>) {
    onChange({ ...valueRef.current, ...p });
  }

  useEffect(() => {
    if (!apiKey || !mapRef.current || !useMapSearch) return;
    let cancelled = false;
    (async () => {
      try {
        await loadGoogleMapsScript(apiKey);
        if (cancelled || !mapRef.current) return;
        await runWithGoogleMapsAuthGuard(() => {
          if (cancelled || !mapRef.current) return;
          const lat = valueRef.current.latitude ? Number(valueRef.current.latitude) : 37.7749;
          const lng = valueRef.current.longitude ? Number(valueRef.current.longitude) : -122.4194;
          const center = {
            lat: Number.isFinite(lat) ? lat : 37.7749,
            lng: Number.isFinite(lng) ? lng : -122.4194,
          };
          const map = new google.maps.Map(mapRef.current!, {
            center,
            zoom: valueRef.current.verified ? 16 : 11,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
          mapInstanceRef.current = map;
          const marker = new google.maps.Marker({
            map,
            position: center,
            visible: Boolean(
              valueRef.current.verified &&
                valueRef.current.latitude &&
                valueRef.current.longitude,
            ),
          });
          markerRef.current = marker;
          return map;
        });
        if (!cancelled) setMapsReady(true);
      } catch (e) {
        if (!cancelled) {
          onMapsUnavailable?.();
          onError(e instanceof Error ? e.message : "Could not load Google Maps. Check your API key.");
        }
      }
    })();
    return () => {
      cancelled = true;
      mapInstanceRef.current = null;
      markerRef.current = null;
      setMapsReady(false);
    };
  }, [apiKey, useMapSearch, onError, onMapsUnavailable]);

  useEffect(() => {
    if (!mapsReady || !useMapSearch) return;
    const map = mapInstanceRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const lat = Number(value.latitude);
    const lng = Number(value.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const pos = { lat, lng };
    map.panTo(pos);
    marker.setPosition(pos);
    const showPin =
      value.verified ||
      ((value.streetLine1.trim() !== "" || value.location.trim() !== "") &&
        Number.isFinite(lat) &&
        Number.isFinite(lng));
    marker.setVisible(showPin);
    if (value.verified) {
      map.setZoom(16);
    }
  }, [
    mapsReady,
    useMapSearch,
    value.latitude,
    value.longitude,
    value.verified,
    value.streetLine1,
    value.location,
  ]);

  useEffect(() => {
    if (!mapsReady || !useMapSearch || !searchInputRef.current) return;
    const input = searchInputRef.current;
    const ac = new google.maps.places.Autocomplete(input, {
      fields: ["place_id", "geometry", "formatted_address", "address_components", "name"],
    });
    const initialAddr = valueRef.current;
    if (initialAddr.verified || (initialAddr.streetLine1 && initialAddr.city)) {
      input.value = [
        initialAddr.streetLine1,
        initialAddr.city,
        initialAddr.stateRegion,
        initialAddr.country,
      ]
        .filter(Boolean)
        .join(", ");
    }
    const listener = ac.addListener("place_changed", () => {
      clearError();
      const place = ac.getPlace();
      const loc = place.geometry?.location;
      if (!loc) {
        onError("Choose a suggestion from the dropdown — typing alone won’t place the pin.");
        patch({ verified: false });
        return;
      }

      const map = mapInstanceRef.current;
      const marker = markerRef.current;
      if (map && marker) {
        const viewport = place.geometry?.viewport;
        if (viewport) {
          map.fitBounds(viewport);
          const z = map.getZoom();
          if (z !== undefined && z > 17) map.setZoom(17);
        } else {
          map.panTo(loc);
          map.setZoom(16);
        }
        marker.setPosition(loc);
        marker.setVisible(true);
      }

      const comps = place.address_components ?? [];
      const prev = valueRef.current;
      let basePatch: Partial<ListingAddressPayload> = {
        latitude: String(loc.lat()),
        longitude: String(loc.lng()),
        verified: false,
      };

      if (comps.length > 0) {
        const parsed = addressFieldsFromComponents(comps, loc.lat(), loc.lng());
        basePatch = {
          ...basePatch,
          streetLine1: parsed.streetLine1,
          streetLine2: parsed.streetLine2,
          city: parsed.city,
          stateRegion: parsed.stateRegion,
          postalCode: parsed.postalCode,
          country: parsed.country || prev.country || countryLabelFromCode(parsed.countryCode || countryCode),
          location: place.formatted_address || parsed.guestLocation,
        };
      } else if (place.formatted_address) {
        basePatch.location = place.formatted_address;
      }

      patch(basePatch);

      const placeId = place.place_id;
      if (!placeId) {
        onError("Couldn’t confirm that place. Pick another suggestion.");
        return;
      }

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ placeId }, (results, status) => {
        const ver = verifyGeocodeResult(results, status);
        if (!ver.ok) {
          patch({ verified: false });
          onError(ver.message);
          return;
        }
        const c = componentsFromGeocoderResult(ver.result);
        const pos = ver.result.geometry.location;
        const cur = valueRef.current;
        mapInstanceRef.current?.panTo(pos);
        mapInstanceRef.current?.setZoom(16);
        if (markerRef.current) {
          markerRef.current.setPosition(pos);
          markerRef.current.setVisible(true);
        }
        patch({
          streetLine1: c.streetLine1,
          streetLine2: c.streetLine2,
          city: c.city,
          stateRegion: c.stateRegion,
          postalCode: c.postalCode,
          country: c.country || cur.country || countryLabelFromCode(c.countryCode || countryCode),
          location: place.formatted_address || c.guestLocation,
          latitude: c.lat,
          longitude: c.lng,
          verified: true,
        });
      });
    });
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [mapsReady, useMapSearch, clearError, countryCode, onError]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Where&apos;s your place located?
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Your address is only shared with guests after they&apos;ve made a reservation. Search for
          your listing and select it from the suggestions.
        </p>
      </div>

      {mapsUnavailable && apiKey && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>Google Maps isn&apos;t loading.</strong> Enter your address below; you can continue
          with an approximate map pin. Fix your API key (Maps JavaScript, Places, Geocoding, billing,
          HTTP referrers for this origin) when you can.
        </p>
      )}

      {!apiKey && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Set <code className="rounded bg-white/80 px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> for
          map search. Until then, add the area and country guests will see.
        </p>
      )}

      {useMapSearch && (
        <div className="relative w-full">
          <div
            ref={mapRef}
            className="relative z-0 h-[min(560px,62vh)] w-full overflow-hidden rounded-3xl bg-neutral-200"
          />
          <div className="pointer-events-none absolute inset-x-0 top-5 z-[1] flex justify-center px-3 sm:top-8 sm:px-4">
            <div className="pointer-events-auto w-full max-w-[640px] rounded-full border border-neutral-200/90 bg-white py-1 pl-1 pr-2 shadow-[0_8px_28px_rgba(0,0,0,0.12)] sm:pr-3">
              <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <svg className="h-6 w-6 shrink-0 text-neutral-700" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M12 22s8-6.2 8-13a8 8 0 10-16 0c0 6.8 8 13 8 13z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search your address"
                  autoComplete="off"
                  onChange={() => {
                    clearError();
                    if (valueRef.current.verified) patch({ verified: false });
                  }}
                  className="min-w-0 flex-1 border-0 bg-transparent text-base text-neutral-900 outline-none placeholder:text-neutral-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (searchInputRef.current) searchInputRef.current.value = "";
                    patch({ verified: false });
                    clearError();
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl leading-none text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                  aria-label="Clear search"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!apiKey && (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-600">
              Area guests will see
            </span>
            <input
              value={value.location}
              onChange={(e) => {
                clearError();
                patch({ location: e.target.value, verified: false });
              }}
              placeholder="e.g. San Francisco, CA"
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-900"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-600">Country / region</span>
            <select
              value={countryCode}
              onChange={(e) => {
                clearError();
                patch({
                  verified: false,
                  country: countryLabelFromCode(e.target.value),
                });
              }}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-900"
            >
              {LISTING_ADDRESS_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {mapsUnavailable && apiKey && (
        <div className="space-y-4">
          <p className="text-xs text-neutral-500">We&apos;ll only use this to place an approximate pin.</p>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-600">Country / region</span>
            <select
              value={countryCode}
              onChange={(e) => {
                clearError();
                patch({
                  verified: false,
                  country: countryLabelFromCode(e.target.value),
                });
              }}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-900"
            >
              {LISTING_ADDRESS_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <div className="overflow-hidden rounded-xl border border-neutral-300">
            <input
              value={value.streetLine1}
              onChange={(e) => {
                clearError();
                patch({ streetLine1: e.target.value, verified: false });
              }}
              placeholder="Street address"
              className="w-full border-0 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-inset focus:ring-neutral-900"
            />
            <input
              value={value.streetLine2}
              onChange={(e) => {
                clearError();
                patch({ streetLine2: e.target.value, verified: false });
              }}
              placeholder="Apt, suite (optional)"
              className="w-full border-t border-neutral-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-inset focus:ring-neutral-900"
            />
            <input
              value={value.city}
              onChange={(e) => {
                clearError();
                const city = e.target.value;
                patch({
                  city,
                  location: [city, value.stateRegion].filter(Boolean).join(", "),
                  verified: false,
                });
              }}
              placeholder="City / town"
              className="w-full border-t border-neutral-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-inset focus:ring-neutral-900"
            />
            <input
              value={value.stateRegion}
              onChange={(e) => {
                clearError();
                const stateRegion = e.target.value;
                patch({
                  stateRegion,
                  location: [value.city, stateRegion].filter(Boolean).join(", "),
                  verified: false,
                });
              }}
              placeholder="State / territory"
              className="w-full border-t border-neutral-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-inset focus:ring-neutral-900"
            />
            <input
              value={value.postalCode}
              onChange={(e) => {
                clearError();
                patch({ postalCode: e.target.value, verified: false });
              }}
              placeholder="ZIP / postal code"
              className="w-full border-t border-neutral-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-inset focus:ring-neutral-900"
            />
          </div>
        </div>
      )}

      {mapsUnavailable &&
        !value.verified &&
        value.streetLine1.trim() &&
        value.city.trim() &&
        apiKey && (
          <p className="text-sm text-neutral-600">
            Use <strong>Next</strong> — we&apos;ll set an approximate pin until Google Maps works
            again.
          </p>
        )}

      {value.verified && useMapSearch && (
        <p className="text-sm font-medium text-emerald-700">
          Location saved. Guests see:{" "}
          <span className="text-neutral-900">{value.location}</span>, {value.country}
        </p>
      )}
    </div>
  );
}
