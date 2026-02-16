/**
 * Derive a single "search location" string from case (and optionally intake) for venue search.
 * Priority: locationQuery > preferred venue/location (venuePreference) > suburb + state > place of death (from intake).
 */

const VENUE_PREFIXES = [
  "mosque in ",
  "cemetery in ",
  "crematorium in ",
  "chapel in ",
  "memorial in ",
];

/**
 * Strip venue-type prefixes so we only geocode the suburb/location, not the keyword.
 * e.g. "mosque in dandenong 3175" → "dandenong 3175", "cemetery in truganina" → "truganina"
 */
export function extractLocationQuery(raw: string): string {
  let s = raw.trim();
  const lower = s.toLowerCase();
  for (const prefix of VENUE_PREFIXES) {
    if (lower.startsWith(prefix)) {
      s = s.slice(prefix.length).trim();
      break;
    }
  }
  return s;
}

type CaseForLocation = {
  locationQuery?: string | null;
  venuePreference?: string | null;
  suburb?: string | null;
  state?: string | null;
};

export function getLocationQuery(caseRecord: CaseForLocation, intakeCollectedJson?: string | null): string {
  if (caseRecord.locationQuery?.trim()) return caseRecord.locationQuery.trim();
  if (caseRecord.venuePreference?.trim()) return caseRecord.venuePreference.trim();
  const suburbState = [caseRecord.suburb?.trim(), caseRecord.state?.trim()].filter(Boolean).join(", ");
  if (suburbState) return suburbState;
  if (intakeCollectedJson) {
    try {
      const parsed = JSON.parse(intakeCollectedJson) as Record<string, unknown>;
      const preferred = parsed.preferredVenueLocation;
      if (typeof preferred === "string" && preferred.trim()) return preferred.trim();
      const residential = parsed.residentialAddress;
      if (typeof residential === "string" && residential.trim()) return residential.trim();
      const placeOfDeath = parsed.placeOfDeath;
      if (typeof placeOfDeath === "string" && placeOfDeath.trim()) return placeOfDeath.trim();
    } catch {
      // ignore
    }
  }
  return "";
}
