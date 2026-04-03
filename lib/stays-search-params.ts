/** Search filters shared by /listings, /, and /listing/[id] links + booking defaults. */

export function normalizeStaysParam(param?: string | string[]) {
  return Array.isArray(param) ? param[0] : param;
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export type StaysViewMode = "grid" | "list";

/**
 * Serialize where / dates / guests / view(list) for URLs.
 */
export function staysSearchQueryString(
  params: Record<string, string | string[] | undefined>,
  options?: { forceView?: StaysViewMode },
): string {
  const qs = new URLSearchParams();
  const where = normalizeStaysParam(params.where)?.trim();
  if (where) qs.set("where", where);

  const ci = normalizeStaysParam(params.checkIn)?.trim() ?? "";
  const co = normalizeStaysParam(params.checkOut)?.trim() ?? "";
  if (ci && YMD.test(ci)) qs.set("checkIn", ci);
  if (co && YMD.test(co)) qs.set("checkOut", co);

  const g = normalizeStaysParam(params.guests);
  if (g != null && g !== "") {
    const n = Math.trunc(Number(g));
    if (Number.isFinite(n) && n > 0) qs.set("guests", String(n));
  }

  let viewList = false;
  if (options?.forceView === "list") viewList = true;
  else if (options?.forceView === "grid") viewList = false;
  else if (normalizeStaysParam(params.view) === "list") viewList = true;
  if (viewList) qs.set("view", "list");

  const pRaw = normalizeStaysParam(params.page);
  if (pRaw != null && pRaw !== "") {
    const n = Math.trunc(Number(pRaw));
    if (Number.isFinite(n) && n > 1) qs.set("page", String(n));
  }

  return qs.toString();
}

export function listingsUrl(
  params: Record<string, string | string[] | undefined>,
  view?: StaysViewMode,
): string {
  const q = staysSearchQueryString(params, view ? { forceView: view } : undefined);
  return q ? `/listings?${q}` : "/listings";
}

/** Preserve filters + view; set page (omit from URL when 1). */
export function listingsUrlWithPage(
  params: Record<string, string | string[] | undefined>,
  page: number,
  view?: StaysViewMode,
): string {
  const { page: _drop, ...rest } = params;
  const merged =
    page > 1 ? { ...rest, page: String(page) } : rest;
  return listingsUrl(merged, view);
}

export function listingDetailUrl(
  id: string,
  params: Record<string, string | string[] | undefined>,
): string {
  const q = staysSearchQueryString(params);
  return q ? `/listing/${id}?${q}` : `/listing/${id}`;
}

export function bookingDefaultsFromSearchParams(
  params: Record<string, string | string[] | undefined>,
  maxGuests: number,
): {
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
} {
  const cap = Math.max(1, maxGuests);

  const ci = normalizeStaysParam(params.checkIn)?.trim() ?? "";
  const co = normalizeStaysParam(params.checkOut)?.trim() ?? "";
  let initialCheckIn: string | undefined;
  let initialCheckOut: string | undefined;
  if (YMD.test(ci) && YMD.test(co)) {
    const a = new Date(`${ci}T12:00:00`);
    const b = new Date(`${co}T12:00:00`);
    if (!Number.isNaN(+a) && !Number.isNaN(+b) && b > a) {
      initialCheckIn = ci;
      initialCheckOut = co;
    }
  }

  let initialGuests: number | undefined;
  const gRaw = normalizeStaysParam(params.guests);
  if (gRaw != null && gRaw !== "") {
    const n = Math.trunc(Number(gRaw));
    if (Number.isFinite(n) && n > 0) initialGuests = Math.min(n, cap);
  }

  return { initialCheckIn, initialCheckOut, initialGuests };
}
