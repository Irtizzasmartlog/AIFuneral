"use client";

import { Card, CardContent } from "@/components/ui/card";

type Template = { id: string; name: string; slug: string; thumbnailUrl: string | null } | null;

type DesignTokens = {
  background: string;
  border: string;
  accentBg: string;
  accentText: string;
  mutedText: string;
  typography: string;
};

const TEMPLATE_TOKENS: Record<string, DesignTokens> = {
  "modern-slate": {
    background: "bg-slate-50",
    border: "border-slate-200",
    accentBg: "bg-slate-600",
    accentText: "text-slate-800",
    mutedText: "text-slate-500",
    typography: "font-serif",
  },
  "heritage-gold": {
    background: "bg-amber-50",
    border: "border-amber-200",
    accentBg: "bg-amber-700",
    accentText: "text-amber-900",
    mutedText: "text-amber-700",
    typography: "font-serif",
  },
  "serene-white": {
    background: "bg-white",
    border: "border-slate-100",
    accentBg: "bg-slate-400",
    accentText: "text-slate-700",
    mutedText: "text-slate-400",
    typography: "font-serif",
  },
};

const DEFAULT_TOKENS: DesignTokens = TEMPLATE_TOKENS["modern-slate"];

function getDesignTokens(template: Template): DesignTokens {
  if (!template?.slug) return DEFAULT_TOKENS;
  return TEMPLATE_TOKENS[template.slug] ?? DEFAULT_TOKENS;
}

export function InvitationPreview({
  template,
  serviceName,
  serviceDate,
  serviceTime,
  locationName,
  locationAddress,
}: {
  template?: Template;
  serviceName: string;
  serviceDate: string;
  serviceTime: string;
  locationName: string;
  locationAddress: string;
}) {
  const tokens = getDesignTokens(template ?? null);
  const dateStr = serviceDate
    ? new Date(serviceDate + "T12:00:00").toLocaleDateString("en-AU", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date TBC";
  const timeStr = serviceTime || "Time TBC";

  return (
    <Card className="border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live preview</h3>
      </div>
      <CardContent className="p-8 bg-slate-50">
        <div
          className={`shadow-lg rounded-sm max-w-sm mx-auto p-8 border ${tokens.background} ${tokens.border}`}
        >
          <div className={`text-center space-y-6 ${tokens.typography}`}>
            <p className={`text-[10px] uppercase tracking-widest ${tokens.mutedText}`}>
              In Loving Memory
            </p>
            <h4 className={`text-2xl font-bold ${tokens.accentText}`}>
              {serviceName || "Name"}
            </h4>
            <div className={`h-px w-12 mx-auto ${tokens.accentBg}`} />
            <div className="space-y-2">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${tokens.accentText}`}>
                Memorial Service
              </p>
              <p className={`text-sm font-medium ${tokens.accentText}`}>{dateStr}</p>
              <p className={`text-sm ${tokens.mutedText}`}>at {timeStr}</p>
            </div>
            <div className="pt-4 space-y-1">
              <p className={`text-sm font-bold ${tokens.accentText}`}>
                {locationName || "Venue"}
              </p>
              <p className={`text-xs ${tokens.mutedText}`}>{locationAddress || "Address"}</p>
            </div>
            <p className={`text-[9px] italic ${tokens.mutedText} pt-6`}>
              The family kindly requests your presence.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
