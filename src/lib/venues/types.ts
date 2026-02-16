export type VenueCategory = "cemetery" | "mosque" | "crematorium" | "chapel" | "memorial";

export type VenueResult = {
  name: string;
  address: string;
  distanceKm: number;
  placeId: string | null;
  mapsUrl: string;
  category: VenueCategory;
};

export type GeocodeResult = { lat: number; lng: number; formattedAddress?: string };

export type GeocodeFailure = {
  error: string;
  debug?: {
    status: string;
    error_message?: string;
    triedVicSuffix?: boolean;
    lastQueryUsed?: string;
  };
};
