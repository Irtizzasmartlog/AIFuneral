"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, ExternalLink, Check, Loader2 } from "lucide-react";
import { selectVenue } from "@/app/actions/packages";
import type { VenueCategory } from "@/lib/venues/types";

type VenueResult = {
  name: string;
  address: string;
  distanceKm: number;
  placeId: string | null;
  mapsUrl: string;
  category: string;
};

const TABS: { value: VenueCategory; label: string }[] = [
  { value: "cemetery", label: "Cemeteries" },
  { value: "crematorium", label: "Crematoriums" },
  { value: "mosque", label: "Mosques" },
  { value: "chapel", label: "Chapels / Memorial" },
];

type NearbyVenuesProps = {
  caseId: string;
  locationQuery: string | null;
  /** Clean location for display (e.g. "dandenong 3175" not "mosque in dandenong 3175") */
  searchAreaLabel?: string | null;
  selectedVenueName: string | null;
  selectedVenueAddress: string | null;
  selectedVenueCategory: string | null;
  selectedVenueMapsUrl: string | null;
};

export function NearbyVenues({
  caseId,
  locationQuery,
  searchAreaLabel,
  selectedVenueName,
  selectedVenueAddress,
  selectedVenueCategory,
  selectedVenueMapsUrl,
}: NearbyVenuesProps) {
  const displaySearchArea = searchAreaLabel ?? locationQuery;
  const [type, setType] = useState<VenueCategory>("cemetery");
  const [venues, setVenues] = useState<VenueResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  useEffect(() => {
    if (!locationQuery?.trim()) {
      setVenues([]);
      setDisabled(false);
      setMessage("Add Preferred Venue or Suburb/Postcode in Intake to see nearby venues.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setMessage(null);
    fetch(`/api/cases/${caseId}/venues?type=${type}&radiusKm=10`)
      .then((r) => r.json())
      .then((data: { venues?: VenueResult[]; disabled?: boolean; message?: string; error?: string }) => {
        if (cancelled) return;
        setVenues(data.venues ?? []);
        setDisabled(Boolean(data.disabled));
        setMessage(data.message ?? data.error ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setVenues([]);
          setMessage("Failed to load venues.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId, type, locationQuery]);

  async function handleSelectVenue(venue: VenueResult) {
    const id = `${venue.placeId ?? venue.name}-${venue.address}`;
    setSelectingId(id);
    try {
      await selectVenue(caseId, {
        name: venue.name,
        address: venue.address,
        category: venue.category,
        mapsUrl: venue.mapsUrl,
      });
    } finally {
      setSelectingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Nearby venues
        </h2>
        {displaySearchArea && (
          <p className="text-xs text-slate-500">Search area: {displaySearchArea}</p>
        )}
        {selectedVenueName && (
          <div className="mt-2 p-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
            <Check className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">Selected venue</p>
              <p className="text-xs text-slate-600 truncate">{selectedVenueName}</p>
              {selectedVenueAddress && (
                <p className="text-[11px] text-slate-500 truncate">{selectedVenueAddress}</p>
              )}
            </div>
            {selectedVenueMapsUrl && (
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <a href={selectedVenueMapsUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {disabled && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Venue lookup is disabled (missing maps API key).
          </p>
        )}
        {!disabled && !locationQuery?.trim() && (
          <p className="text-sm text-slate-500">{message}</p>
        )}
        {!disabled && locationQuery?.trim() && (
          <Tabs value={type} onValueChange={(v) => setType(v as VenueCategory)}>
            <TabsList className="grid w-full grid-cols-4 mb-3">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={type} className="mt-0">
              {loading && (
                <div className="flex items-center justify-center py-8 text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading…
                </div>
              )}
              {!loading && message && !venues.length && (
                <p className="text-sm text-slate-500 py-4">{message}</p>
              )}
              {!loading && venues.length > 0 && (
                <ul className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                  {venues.map((venue) => {
                    const id = `${venue.placeId ?? venue.name}-${venue.address}`;
                    const isSelected =
                      selectedVenueName === venue.name &&
                      selectedVenueAddress === venue.address &&
                      selectedVenueCategory === venue.category;
                    return (
                      <li
                        key={id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                      >
                        <p className="font-medium text-sm text-slate-800">{venue.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{venue.address}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{venue.distanceKm} km away</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={venue.mapsUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              Open in Maps
                            </a>
                          </Button>
                          <Button
                            variant={isSelected ? "secondary" : "default"}
                            size="sm"
                            disabled={selectingId !== null}
                            onClick={() => handleSelectVenue(venue)}
                          >
                            {selectingId === id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                            ) : isSelected ? (
                              <Check className="h-3.5 w-3.5 mr-1" />
                            ) : null}
                            Select as venue
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
