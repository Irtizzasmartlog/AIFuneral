"use client";

import { Card, CardContent } from "@/components/ui/card";

export function InvitationPreview({
  serviceName,
  serviceDate,
  serviceTime,
  locationName,
  locationAddress,
}: {
  serviceName: string;
  serviceDate: string;
  serviceTime: string;
  locationName: string;
  locationAddress: string;
}) {
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
        <div className="bg-white shadow-lg rounded-sm max-w-sm mx-auto p-8 border border-slate-100">
          <div className="text-center space-y-6">
            <p className="text-[10px] uppercase tracking-widest text-slate-400">In Loving Memory</p>
            <h4 className="text-2xl font-serif font-bold text-slate-800">{serviceName || "Name"}</h4>
            <div className="h-px w-12 bg-slate-300 mx-auto" />
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest">Memorial Service</p>
              <p className="text-sm font-medium">{dateStr}</p>
              <p className="text-sm">at {timeStr}</p>
            </div>
            <div className="pt-4 space-y-1">
              <p className="text-sm font-bold">{locationName || "Venue"}</p>
              <p className="text-xs text-slate-500">{locationAddress || "Address"}</p>
            </div>
            <p className="text-[9px] italic text-slate-400 pt-6">The family kindly requests your presence.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
