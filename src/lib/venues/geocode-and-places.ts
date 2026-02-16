/**
 * Geocode location string to lat/lng and search nearby venues.
 * Uses Google Maps APIs when GOOGLE_MAPS_API_KEY is set; otherwise returns disabled message.
 * Expands short suburb-only queries (e.g. "dandenong") to "Dandenong VIC, Australia" on retry.
 */

import type { VenueCategory, VenueResult, GeocodeResult, GeocodeFailure } from "./types";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_RESULTS = 8;

const geocodeCache = new Map<string, { data: GeocodeResult; ts: number }>();
const venuesCache = new Map<string, { data: VenueResult[]; ts: number }>();

function cacheKeyGeocode(q: string): string {
  return `geo:${q.trim().toLowerCase()}`;
}

function cacheKeyVenues(lat: number, lng: number, type: string, radiusKm: number): string {
  return `venues:${lat.toFixed(4)},${lng.toFixed(4)}:${type}:${radiusKm}`;
}

function getCached<T>(cache: Map<string, { data: T; ts: number }>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() - entry.ts > CACHE_TTL_MS) return null;
  return entry.data;
}

function setCache<T>(cache: Map<string, { data: T; ts: number }>, key: string, data: T): void {
  cache.set(key, { data, ts: Date.now() });
}

/** Trim only. */
function normalizeQuery(q: string): string {
  return q.trim();
}

const AU_STATES = /\b(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)\b/i;

/**
 * Normalise AU location for geocoding: add " VIC, Australia" for short suburb-only queries,
 * or " Australia" when state is present but country is missing.
 * Used when first geocode attempt returns ZERO_RESULTS.
 */
function normalizeAusLocation(q: string): string {
  const t = q.trim();
  if (!t) return t;
  if (/australia/i.test(t)) return t;
  if (/\d{4}/.test(t)) return t; // has postcode — return as-is
  const hasState = AU_STATES.test(t);
  if (hasState) return t + " Australia"; // e.g. "Dandenong VIC" → "Dandenong VIC Australia"
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length >= 1 && words.length <= 3) return t + " VIC, Australia"; // e.g. "dandenong" → "dandenong VIC, Australia"
  return t;
}

type GeocodeApiResult =
  | { ok: true; lat: number; lng: number; formattedAddress?: string }
  | { ok: false; status: string; error_message?: string };

// --- Google Geocoding ---
async function geocodeGoogle(geocodeQuery: string, apiKey: string): Promise<GeocodeApiResult> {
  const addr = encodeURIComponent(geocodeQuery);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${addr}&key=${apiKey}&region=au`;
  const geocodeUrlWithoutKey = `https://maps.googleapis.com/maps/api/geocode/json?address=${addr}&key=***`;
  console.log("[venues] geocodeQuery:", geocodeQuery);
  console.log("[venues] geocodeUrl:", geocodeUrlWithoutKey);
  const res = await fetch(url);
  const json = (await res.json()) as {
    status: string;
    error_message?: string;
    results?: Array<{
      geometry: { location: { lat: number; lng: number } };
      formatted_address?: string;
    }>;
  };
  const status = json.status;
  const error_message = json.error_message;
  if (status !== "OK") {
    console.log("[venues] geocode status:", status, error_message != null ? "error_message: " + error_message : "");
    return { ok: false, status, error_message };
  }
  if (!json.results?.length) {
    console.log("[venues] geocode status: OK but results.length === 0");
    return { ok: false, status: "ZERO_RESULTS" };
  }
  const first = json.results[0];
  const loc = first.geometry?.location;
  if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") {
    console.log("[venues] geocode status: OK but invalid results[0].geometry.location");
    return { ok: false, status: "INVALID_RESULT" };
  }
  const { lat, lng } = loc;
  if (process.env.NODE_ENV === "development") {
    console.log("[venues] geocode status: OK lat/lng:", lat, lng);
  }
  return {
    ok: true,
    lat,
    lng,
    formattedAddress: first.formatted_address,
  };
}

function logGeocodeDev(context: {
  query: string;
  normalizedQuery: string;
  geocodeStatus: string;
  error_message?: string;
  attempt?: "first" | "retry";
}): void {
  if (process.env.NODE_ENV !== "development") return;
  console.log("[venues] geocode", context);
}

// --- Google Places Nearby (Legacy) ---
function keywordForCategory(category: VenueCategory): string {
  switch (category) {
    case "cemetery":
      return "cemetery";
    case "mosque":
      return "mosque";
    case "crematorium":
      return "crematorium";
    case "chapel":
      return "funeral home chapel memorial";
    case "memorial":
      return "memorial centre memorial park";
    default:
      return "funeral memorial";
  }
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function searchNearbyGoogle(
  lat: number,
  lng: number,
  category: VenueCategory,
  radiusKm: number,
  apiKey: string
): Promise<VenueResult[]> {
  const radiusM = Math.min(Math.round(radiusKm * 1000), 50000);
  const keyword = keywordForCategory(category);
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusM}&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;
  const res = await fetch(url);
  const json = (await res.json()) as {
    status: string;
    results?: Array<{
      name: string;
      vicinity: string;
      place_id?: string;
      geometry: { location: { lat: number; lng: number } };
    }>;
  };
  if (json.status !== "OK" || !json.results?.length) return [];
  const out: VenueResult[] = json.results.slice(0, MAX_RESULTS).map((r) => {
    const placeLat = r.geometry.location.lat;
    const placeLng = r.geometry.location.lng;
    const distanceKm = haversineKm(lat, lng, placeLat, placeLng);
    const mapsUrl = r.place_id
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + " " + r.vicinity)}`
      : `https://www.google.com/maps/search/?api=1&query=${placeLat},${placeLng}`;
    return {
      name: r.name,
      address: r.vicinity,
      distanceKm: Math.round(distanceKm * 10) / 10,
      placeId: r.place_id ?? null,
      mapsUrl,
      category,
    };
  });
  out.sort((a, b) => a.distanceKm - b.distanceKm);
  return out.slice(0, MAX_RESULTS);
}

// --- Public API ---

const GEOCODE_USER_MESSAGE =
  "We couldn't locate that suburb. Try including suburb + postcode (e.g. Dandenong 3175)";

/**
 * Geocode a location string to lat/lng. First attempt uses original query; on ZERO_RESULTS
 * retries once with normalizeAusLocation(query). Returns coords or a failure with user message and (dev) debug.
 */
export async function geocodeLocation(
  locationQuery: string
): Promise<GeocodeResult | GeocodeFailure> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) {
    return { error: "Venue lookup is disabled.", debug: { status: "NO_API_KEY" } };
  }
  const trimmed = normalizeQuery(locationQuery);
  if (!trimmed) {
    return { error: "No location provided.", debug: { status: "EMPTY" } };
  }
  const key = cacheKeyGeocode(trimmed);
  const cached = getCached(geocodeCache, key);
  if (cached) return cached;

  const normalizedQuery = normalizeAusLocation(trimmed);
  let lastStatus = "";
  let lastQueryUsed = trimmed;

  // First attempt: original query
  let result = await geocodeGoogle(trimmed, apiKey);
  lastStatus = result.ok ? "OK" : result.status;
  lastQueryUsed = trimmed;
  logGeocodeDev({
    query: trimmed,
    normalizedQuery,
    geocodeStatus: lastStatus,
    error_message: !result.ok ? result.error_message : undefined,
    attempt: "first",
  });
  if (result.ok) {
    const geocodeResult: GeocodeResult = {
      lat: result.lat,
      lng: result.lng,
      formattedAddress: result.formattedAddress,
    };
    setCache(geocodeCache, key, geocodeResult);
    return geocodeResult;
  }

  // Retry once with normalizeAusLocation(query) when first attempt returns ZERO_RESULTS
  if (result.status === "ZERO_RESULTS" && normalizedQuery !== trimmed) {
    result = await geocodeGoogle(normalizedQuery, apiKey);
    lastStatus = result.ok ? "OK" : result.status;
    lastQueryUsed = normalizedQuery;
    logGeocodeDev({
      query: trimmed,
      normalizedQuery,
      geocodeStatus: lastStatus,
      error_message: !result.ok ? result.error_message : undefined,
      attempt: "retry",
    });
    if (result.ok) {
      const geocodeResult: GeocodeResult = {
        lat: result.lat,
        lng: result.lng,
        formattedAddress: result.formattedAddress,
      };
      setCache(geocodeCache, key, geocodeResult);
      return geocodeResult;
    }
  }

  return {
    error: GEOCODE_USER_MESSAGE,
    debug: {
      status: lastStatus,
      error_message: !result.ok ? result.error_message : undefined,
      lastQueryUsed,
    },
  };
}

export async function searchNearbyVenues(
  lat: number,
  lng: number,
  category: VenueCategory,
  radiusKm: number
): Promise<VenueResult[]> {
  const key = cacheKeyVenues(lat, lng, category, radiusKm);
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (apiKey) {
    const cached = getCached(venuesCache, key);
    if (cached) return cached;
    const results = await searchNearbyGoogle(lat, lng, category, radiusKm, apiKey);
    setCache(venuesCache, key, results);
    return results;
  }
  return [];
}

export function isVenueLookupEnabled(): boolean {
  return Boolean(process.env.GOOGLE_MAPS_API_KEY?.trim());
}

export async function getNearbyVenues(
  locationQuery: string,
  category: VenueCategory,
  radiusKm: number
): Promise<{
  venues: VenueResult[];
  disabled: boolean;
  error?: string;
  debugStatus?: GeocodeFailure["debug"];
}> {
  if (!locationQuery?.trim()) {
    return { venues: [], disabled: false, error: "No location provided." };
  }
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) {
    return { venues: [], disabled: true };
  }
  const geocodeResult = await geocodeLocation(locationQuery);
  if ("error" in geocodeResult) {
    return {
      venues: [],
      disabled: false,
      error: geocodeResult.error,
      debugStatus: geocodeResult.debug,
    };
  }
  const venues = await searchNearbyVenues(geocodeResult.lat, geocodeResult.lng, category, radiusKm);
  return { venues, disabled: false };
}
