"use client";

import { withBasePath } from "@/lib/app-origin";
import Link from "next/link";
import { Suspense } from "react";
import {
  GUEST_FAVORITES,
  SAFETY_AMENITIES,
  STANDOUT_AMENITIES,
} from "@/lib/listing-amenities";
import { ALL_LANGUAGES } from "@/lib/languages";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AmenityIcon } from "./amenity-icons";
import { countryApproxCenter } from "@/lib/country-approx-center";
import { LISTING_ADDRESS_COUNTRIES } from "@/lib/listing-address-countries";
import {
  ListingLocationStep,
  type ListingAddressPayload,
} from "./listing-location-step";

const STAY_TYPE_OPTIONS = [
  {
    value: "HOTEL_ROOM",
    label: "Hotel Rooms",
    hint: "Private room with hotel-style services and amenities.",
    icon: (
      <svg aria-hidden className="h-14 w-14 shrink-0" viewBox="0 0 48 48" fill="none">
        <path
          d="M24 8L8 18v22h32V18L24 8z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <rect x="18" y="26" width="12" height="14" rx="1" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    value: "BNB_ROOM",
    label: "B&B rooms",
    hint: "Private room in a home, often with breakfast and shared spaces.",
    icon: (
      <svg aria-hidden className="h-14 w-14 shrink-0" viewBox="0 0 48 48" fill="none">
        <rect x="10" y="12" width="28" height="30" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M10 22h28" stroke="currentColor" strokeWidth="2" />
        <circle cx="20" cy="32" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: "RENTAL_ROOM",
    label: "Rental Rooms",
    hint: "Independent rental spaces for short or long stays.",
    icon: (
      <svg aria-hidden className="h-14 w-14 shrink-0" viewBox="0 0 48 48" fill="none">
        <rect x="12" y="10" width="24" height="30" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M16 16h16M16 22h16M16 28h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

const STEP_COUNT = 10;

function AmenityGrid({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((label) => {
        const on = selected.includes(label);
        return (
          <button
            key={label}
            type="button"
            onClick={() => onToggle(label)}
            className={`flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition hover:border-neutral-400 ${
              on ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-neutral-200 bg-white"
            }`}
          >
            <AmenityIcon label={label} />
            <span className="text-sm font-medium leading-snug">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ToggleGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: readonly string[];
  selected: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <fieldset className="rounded-xl border border-[var(--border)] p-4">
      <legend className="mb-3 px-1 text-sm font-semibold">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((item) => {
          const on = selected.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                on
                  ? "border-[var(--brand)] bg-[var(--brand-soft-hover)] text-[var(--brand)]"
                  : "border-[var(--border)] hover:border-neutral-400"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function NewListingWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdFromUrl = searchParams.get("draftId");
  const [step, setStep] = useState(0);

  const [title, setTitle] = useState("");
  const [stayType, setStayType] = useState<string>("RENTAL_ROOM");
  const [description, setDescription] = useState("");
  const [pickedGuestFavorites, setPickedGuestFavorites] = useState<string[]>(
    [],
  );
  const [addr, setAddr] = useState<ListingAddressPayload>({
    location: "",
    country: "United States",
    streetLine1: "",
    streetLine2: "",
    city: "",
    stateRegion: "",
    postalCode: "",
    latitude: "",
    longitude: "",
    verified: false,
  });
  const [maxGuests, setMaxGuests] = useState(2);
  const [bedrooms, setBedrooms] = useState(1);
  const [beds, setBeds] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [weekdayPrice, setWeekdayPrice] = useState(100);
  const [weekendPrice, setWeekendPrice] = useState(120);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pickedStandout, setPickedStandout] = useState<string[]>([]);
  const [pickedSafety, setPickedSafety] = useState<string[]>([]);
  const [pickedLanguages, setPickedLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftListingId, setDraftListingId] = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  /** Google Maps failed to init (e.g. ApiNotActivatedMapError) — wizard uses approximate pin */
  const [mapsUnavailable, setMapsUnavailable] = useState(false);

  useEffect(() => {
    if (!draftIdFromUrl) {
      setDraftListingId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setDraftLoading(true);
      setError("");
      const res = await fetch(withBasePath(`/api/listings/${draftIdFromUrl}`));
      const raw = await res.text();
      let parsed: { data?: Record<string, unknown>; error?: string } = {};
      try {
        parsed = raw ? (JSON.parse(raw) as typeof parsed) : {};
      } catch {
        parsed = {};
      }
      if (!res.ok) {
        if (!cancelled) {
          setDraftLoading(false);
          setError(parsed.error ?? "Could not load draft.");
        }
        return;
      }
      const listing = parsed.data;
      if (!listing || cancelled) {
        if (!cancelled) setDraftLoading(false);
        return;
      }
      setDraftListingId(draftIdFromUrl);
      setTitle(String(listing.title ?? ""));
      setStayType(String(listing.stayType ?? "RENTAL_ROOM"));
      setDescription(String(listing.description ?? ""));
      setPickedGuestFavorites(
        Array.isArray(listing.guestFavorites)
          ? (listing.guestFavorites as string[])
          : [],
      );
      const lat = listing.latitude as number | undefined;
      const lng = listing.longitude as number | undefined;
      const hasCoords =
        lat !== undefined &&
        lng !== undefined &&
        (Math.abs(lat) > 1e-6 || Math.abs(lng) > 1e-6);
      const L = listing as Record<string, unknown>;
      setAddr({
        location: String(listing.location ?? ""),
        country: String(listing.country ?? "United States"),
        streetLine1: String(L.streetLine1 ?? ""),
        streetLine2: String(L.streetLine2 ?? ""),
        city: String(L.city ?? ""),
        stateRegion: String(L.stateRegion ?? ""),
        postalCode: String(L.postalCode ?? ""),
        latitude: hasCoords ? String(lat) : "",
        longitude: hasCoords ? String(lng) : "",
        verified: hasCoords,
      });
      setMaxGuests(Number(listing.maxGuests ?? 2));
      setBedrooms(Number(listing.bedrooms ?? 1));
      setBeds(Number(listing.beds ?? 1));
      setBathrooms(Number(listing.bathrooms ?? 1));
      setWeekdayPrice(Number(listing.weekdayPrice ?? 100));
      setWeekendPrice(Number(listing.weekendPrice ?? 120));
      const urls = Array.isArray(listing.imageUrls)
        ? (listing.imageUrls as string[]).filter(Boolean)
        : [];
      const main = String(listing.imageUrl ?? "");
      if (urls.length > 0) setImageUrls(urls);
      else if (main) setImageUrls([main]);
      else setImageUrls([]);
      setPickedStandout(
        Array.isArray(listing.standoutAmenities)
          ? (listing.standoutAmenities as string[])
          : [],
      );
      setPickedSafety(
        Array.isArray(listing.safetyAmenities) ? (listing.safetyAmenities as string[]) : [],
      );
      setPickedLanguages(
        Array.isArray(listing.hostLanguages) ? (listing.hostLanguages as string[]) : [],
      );
      setDraftLoading(false);
      setStep(0);
    })();
    return () => {
      cancelled = true;
    };
  }, [draftIdFromUrl]);

  function buildPayload() {
    return {
      title: title.trim(),
      description: description.trim(),
      stayType,
      location: addr.location.trim(),
      country: addr.country.trim(),
      streetLine1: addr.streetLine1.trim(),
      streetLine2: addr.streetLine2.trim(),
      city: addr.city.trim(),
      stateRegion: addr.stateRegion.trim(),
      postalCode: addr.postalCode.trim(),
      latitude: addr.latitude === "" ? undefined : Number(addr.latitude),
      longitude: addr.longitude === "" ? undefined : Number(addr.longitude),
      pricePerNight: weekdayPrice,
      weekdayPrice,
      weekendPrice,
      maxGuests,
      bedrooms,
      beds,
      bathrooms,
      imageUrl: imageUrls[0],
      imageUrls,
      guestFavorites: pickedGuestFavorites,
      standoutAmenities: pickedStandout,
      safetyAmenities: pickedSafety,
      hostLanguages: pickedLanguages,
    };
  }

  async function parseJsonResponse(res: Response) {
    const raw = await res.text();
    try {
      return raw ? (JSON.parse(raw) as { error?: string }) : {};
    } catch {
      return {};
    }
  }

  function toggle(list: string[], setList: (v: string[]) => void, item: string) {
    if (list.includes(item)) setList(list.filter((x) => x !== item));
    else setList([...list, item]);
  }

  function validateCurrent(): string | null {
    switch (step) {
      case 0:
        return title.trim() ? null : "Enter a title.";
      case 1:
        return stayType ? null : "Choose a place type.";
      case 2:
        return description.trim().length >= 20
          ? null
          : "Describe your place (at least 20 characters).";
      case 3:
        if (pickedGuestFavorites.length === 0)
          return "Select at least one guest favorite.";
        if (pickedStandout.length === 0)
          return "Select at least one standout amenity.";
        if (pickedSafety.length === 0)
          return "Select at least one safety item.";
        return null;
      case 4: {
        const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (mapsKey && mapsUnavailable) {
          if (!addr.streetLine1.trim() || !addr.city.trim() || !addr.country.trim()) {
            return "Fill street address, city, and country to continue without Google Maps.";
          }
          const loc =
            addr.location.trim() ||
            [addr.city, addr.stateRegion].filter(Boolean).join(", ");
          if (!loc.trim()) {
            return "Add a guest-facing area (city or region).";
          }
          return null;
        }
        if (mapsKey) {
          if (!addr.verified)
            return "Search for your address and pick a suggestion from the list.";
          const la = Number(addr.latitude);
          const lo = Number(addr.longitude);
          if (!Number.isFinite(la) || !Number.isFinite(lo))
            return "Coordinates are missing — select your address again from search.";
          return null;
        }
        return addr.location.trim() && addr.country.trim()
          ? null
          : "Add city and country (or set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for map verification).";
      }
      case 5:
        if (maxGuests < 1 || bedrooms < 1 || beds < 1 || bathrooms < 0.5)
          return "Check guest and room counts.";
        return null;
      case 6:
        if (weekdayPrice < 1 || weekendPrice < 1)
          return "Set weekday and weekend prices.";
        return null;
      case 7:
        return imageUrls.length >= 5 ? null : "Upload at least 5 photos.";
      case 8:
        return pickedLanguages.length > 0 ? null : "Select at least one language.";
      default:
        return null;
    }
  }

  function next() {
    const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (step === 4 && mapsKey && mapsUnavailable) {
      const v = validateCurrent();
      if (v) {
        setError(v);
        return;
      }
      const code =
        LISTING_ADDRESS_COUNTRIES.find((c) => c.label === addr.country)?.code ?? "US";
      const { lat, lng } = countryApproxCenter(code);
      const loc =
        addr.location.trim() ||
        [addr.city, addr.stateRegion].filter(Boolean).join(", ");
      setAddr({
        ...addr,
        location: loc,
        latitude: String(lat),
        longitude: String(lng),
        verified: false,
      });
      setError("");
      setStep((s) => Math.min(s + 1, STEP_COUNT - 1));
      return;
    }

    const v = validateCurrent();
    if (v) {
      setError(v);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEP_COUNT - 1));
  }

  function back() {
    setError("");
    if (step === 0) {
      router.push("/profile?tab=listings");
      return;
    }
    setStep((s) => s - 1);
  }

  function addLanguage(value: string) {
    const normalized = value.trim();
    if (!normalized) return;
    if (pickedLanguages.includes(normalized)) return;
    setPickedLanguages((prev) => [...prev, normalized]);
    setLanguageInput("");
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch(withBasePath("/api/uploads/listing-image"), {
      method: "POST",
      body: fd,
    });
    setUploading(false);
    const raw = await res.text();
    let data: { error?: string; url?: string } = {};
    try {
      data = raw ? (JSON.parse(raw) as { error?: string; url?: string }) : {};
    } catch {
      data = {};
    }
    if (!res.ok) {
      setError(data.error ?? "Upload failed.");
      return;
    }
    if (!data.url) {
      setError("Upload failed.");
      return;
    }
    setImageUrls((prev) => [...prev, data.url as string]);
    e.currentTarget.value = "";
  }

  function validateAll(): string | null {
    if (!title.trim()) return "Enter a title.";
    if (!stayType) return "Choose a place type.";
    if (description.trim().length < 20) return "Description too short.";
    if (pickedGuestFavorites.length === 0) return "Select guest favorites.";
    if (pickedStandout.length === 0) return "Select standout amenities.";
    if (pickedSafety.length === 0) return "Select safety items.";
    if (!addr.location.trim() || !addr.country.trim()) return "Add location.";
    const mapsKeyAll = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (
      mapsKeyAll &&
      !mapsUnavailable &&
      (!addr.verified ||
        !Number.isFinite(Number(addr.latitude)) ||
        !Number.isFinite(Number(addr.longitude)))
    ) {
      return "Choose your listing location from map search before publishing.";
    }
    if (
      mapsKeyAll &&
      mapsUnavailable &&
      (!Number.isFinite(Number(addr.latitude)) || !Number.isFinite(Number(addr.longitude)))
    ) {
      return "Address coordinates missing. Return to the location step and use Next again.";
    }
    if (maxGuests < 1 || bedrooms < 1 || beds < 1 || bathrooms < 0.5)
      return "Check capacity.";
    if (weekdayPrice < 1 || weekendPrice < 1) return "Set weekday and weekend prices.";
    if (imageUrls.length < 5) return "Upload at least 5 photos.";
    if (pickedLanguages.length === 0) return "Select languages.";
    return null;
  }

  async function publish() {
    const v = validateAll();
    if (v) {
      setError(v);
      return;
    }
    setError("");
    setLoading(true);
    const payload = buildPayload();
    const updating = Boolean(draftListingId);
    const res = await fetch(
      withBasePath(updating ? `/api/listings/${draftListingId}` : "/api/listings"),
      {
        method: updating ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          status: "PUBLISHED",
        }),
      },
    );
    setLoading(false);
    if (!res.ok) {
      const data = await parseJsonResponse(res);
      setError(data.error ?? "Publish failed.");
      return;
    }
    router.push("/profile?tab=listings");
    router.refresh();
  }

  async function saveDraft() {
    setError("");
    setSavingDraft(true);
    const payload = buildPayload();
    const updating = Boolean(draftListingId);
    const res = await fetch(
      withBasePath(updating ? `/api/listings/${draftListingId}` : "/api/listings"),
      {
        method: updating ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          status: "INCOMPLETE",
        }),
      },
    );
    setSavingDraft(false);
    if (!res.ok) {
      const data = await parseJsonResponse(res);
      setError(data.error ?? "Draft save failed.");
      return;
    }
    router.push("/profile?tab=listings");
    router.refresh();
  }

  if (draftLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white text-neutral-900">
        <p className="text-sm text-neutral-600">Loading your draft…</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white text-neutral-900">
      <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-[var(--brand)]">
          stayly
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Questions?
          </button>
          <button
            type="button"
            onClick={saveDraft}
            className="rounded-full border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            {savingDraft ? "Saving..." : "Save &amp; exit"}
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-y-auto px-4 py-8 sm:px-6">
        <div
          className={`mx-auto w-full flex-1 ${
            step === 3 || step === 5 ? "max-w-[900px]" : "max-w-[560px]"
          }`}
        >
          {step === 0 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                What is your place called?
              </h1>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sunny loft downtown"
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-base outline-none focus:border-[var(--brand)]"
                autoFocus
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                What type of place will guests have?
              </h1>
              <div className="flex flex-col gap-3">
                {STAY_TYPE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setStayType(o.value)}
                    className={`flex w-full items-start justify-between gap-4 rounded-xl border-2 p-5 text-left transition hover:border-neutral-400 ${
                      stayType === o.value
                        ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                        : "border-neutral-200 bg-white"
                    }`}
                  >
                    <div>
                      <p className="text-lg font-medium">{o.label}</p>
                      <p className="mt-1 text-sm text-neutral-600">{o.hint}</p>
                    </div>
                    <div className="text-neutral-900">{o.icon}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Describe your place to guests
              </h1>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share what makes it special, the vibe, and nearby highlights."
                rows={8}
                className="w-full resize-y rounded-lg border border-neutral-300 px-4 py-3 text-base outline-none focus:border-[var(--brand)]"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Tell guests what your place has to offer
                </h1>
                <p className="mt-2 text-sm text-neutral-600">
                  You can add more amenities after you publish your listing.
                </p>
              </div>
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">
                  What about these guest favorites?
                </h2>
                <AmenityGrid
                  options={GUEST_FAVORITES}
                  selected={pickedGuestFavorites}
                  onToggle={(item) =>
                    toggle(pickedGuestFavorites, setPickedGuestFavorites, item)
                  }
                />
              </section>
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">
                  Do you have any standout amenities?
                </h2>
                <AmenityGrid
                  options={STANDOUT_AMENITIES}
                  selected={pickedStandout}
                  onToggle={(item) => toggle(pickedStandout, setPickedStandout, item)}
                />
              </section>
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">
                  Do you have any of these safety items?
                </h2>
                <AmenityGrid
                  options={SAFETY_AMENITIES}
                  selected={pickedSafety}
                  onToggle={(item) => toggle(pickedSafety, setPickedSafety, item)}
                />
              </section>
            </div>
          )}

          {step === 4 && (
            <ListingLocationStep
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
              value={addr}
              onChange={setAddr}
              onError={setError}
              clearError={() => setError("")}
              mapsUnavailable={mapsUnavailable}
              onMapsUnavailable={() => setMapsUnavailable(true)}
            />
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                How many people can stay?
              </h1>
              <p className="text-xl text-neutral-500">
                You&apos;ll add more details later, like bed types.
              </p>
              <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200">
                {[
                  {
                    label: "Guests",
                    value: maxGuests,
                    min: 1,
                    step: 1,
                    onMinus: () => setMaxGuests((v) => Math.max(1, v - 1)),
                    onPlus: () => setMaxGuests((v) => v + 1),
                  },
                  {
                    label: "Bedrooms",
                    value: bedrooms,
                    min: 1,
                    step: 1,
                    onMinus: () => setBedrooms((v) => Math.max(1, v - 1)),
                    onPlus: () => setBedrooms((v) => v + 1),
                  },
                  {
                    label: "Beds",
                    value: beds,
                    min: 1,
                    step: 1,
                    onMinus: () => setBeds((v) => Math.max(1, v - 1)),
                    onPlus: () => setBeds((v) => v + 1),
                  },
                  {
                    label: "Bathrooms",
                    value: bathrooms,
                    min: 0.5,
                    step: 0.5,
                    onMinus: () =>
                      setBathrooms((v) => Math.max(0.5, Number((v - 0.5).toFixed(1)))),
                    onPlus: () => setBathrooms((v) => Number((v + 0.5).toFixed(1))),
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-5 py-6">
                    <p className="text-3xl font-medium tracking-tight">{row.label}</p>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={row.onMinus}
                        disabled={row.value <= row.min}
                        className="h-11 w-11 rounded-full bg-neutral-100 text-2xl text-neutral-700 disabled:opacity-40"
                      >
                        -
                      </button>
                      <span className="min-w-10 text-center text-2xl">
                        {row.step === 0.5 ? row.value.toFixed(1) : row.value}
                      </span>
                      <button
                        type="button"
                        onClick={row.onPlus}
                        className="h-11 w-11 rounded-full bg-neutral-100 text-2xl text-neutral-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Set your prices
              </h1>
              <p className="text-sm text-neutral-600">
                Add different nightly rates for weekdays and weekends. These prices
                already include all fees.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="block text-xs text-neutral-600">
                    Weekday price (Mon-Fri)
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={weekdayPrice}
                    onChange={(e) => setWeekdayPrice(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-[var(--brand)]"
                  />
                </label>
                <label className="block text-sm">
                  <span className="block text-xs text-neutral-600">
                    Weekend price (Sat-Sun)
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={weekendPrice}
                    onChange={(e) => setWeekendPrice(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-[var(--brand)]"
                  />
                </label>
              </div>
              <p className="text-xs text-neutral-500">
                Guests see these as final nightly rates (all fees included).
              </p>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Add your photos
              </h1>
              <p className="text-sm text-neutral-600">
                Upload at least 5 photos. JPEG, PNG, or WebP, max 5MB each.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onFileChange}
                className="hidden"
              />
              {uploading && <p className="text-sm text-neutral-500">Uploading…</p>}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {imageUrls.map((url, idx) => (
                  <div key={url + idx} className="relative overflow-hidden rounded-xl border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Listing photo ${idx + 1}`} className="h-32 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setImageUrls((prev) => prev.filter((_, imageIdx) => imageIdx !== idx))
                      }
                      className="absolute right-2 top-2 rounded-full bg-neutral-600/85 px-2 py-1 text-xs text-white shadow-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 text-4xl text-neutral-500 hover:border-neutral-600"
                  aria-label="Add photo"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-neutral-500">
                {imageUrls.length} uploaded (minimum 5).
              </p>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Languages you speak
              </h1>
              <label className="block text-sm font-medium">Add language</label>
              <div className="flex gap-2">
                <input
                  list="all-languages"
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLanguage(languageInput);
                    }
                  }}
                  placeholder="Search or type a language"
                  className="w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-[var(--brand)]"
                />
                <datalist id="all-languages">
                  {ALL_LANGUAGES.map((language) => (
                    <option key={language} value={language} />
                  ))}
                </datalist>
                <button
                  type="button"
                  onClick={() => addLanguage(languageInput)}
                  className="brand-btn rounded-lg px-4 py-3 text-sm font-semibold text-white"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {pickedLanguages.map((language) => (
                  <button
                    key={language}
                    type="button"
                    onClick={() =>
                      setPickedLanguages((prev) => prev.filter((item) => item !== language))
                    }
                    className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm"
                    title="Remove language"
                  >
                    {language} ×
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Review &amp; publish
              </h1>
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
                <p className="font-medium">{title || "—"}</p>
                <p className="text-neutral-600">
                  {addr.location}, {addr.country}
                </p>
                <p className="mt-2">
                  {maxGuests} guests · {bedrooms} bed · {beds} beds · {bathrooms}{" "}
                  baths · ${weekdayPrice} weekday · ${weekendPrice} weekend
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-6 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      </main>

      <footer className="shrink-0 border-t border-neutral-200 bg-white px-4 py-4 sm:px-6">
        <div
          className={`mx-auto mb-4 flex gap-1 ${
            step === 3 || step === 5 ? "max-w-[900px]" : "max-w-[560px]"
          }`}
        >
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <div
              key={i}
              className={`h-0.5 flex-1 rounded-full ${
                i <= step ? "bg-[var(--brand)]" : "bg-neutral-200"
              }`}
            />
          ))}
        </div>
        <div
          className={`mx-auto flex items-center justify-between gap-4 ${
            step === 3 || step === 5 ? "max-w-[900px]" : "max-w-[560px]"
          }`}
        >
          <button
            type="button"
            onClick={back}
            className="border-0 bg-transparent text-base font-medium text-neutral-900 underline underline-offset-4"
          >
            Back
          </button>
          {step < STEP_COUNT - 1 ? (
            <button
              type="button"
              onClick={next}
              className="brand-btn rounded-lg px-6 py-3 text-sm font-semibold text-white"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={publish}
              className="brand-btn rounded-lg px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Publishing…" : "Publish listing"}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

export default function NewListingPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
          <p className="text-sm text-neutral-600">Loading…</p>
        </div>
      }
    >
      <NewListingWizardContent />
    </Suspense>
  );
}
