"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

type ActivityItem = {
  id: string;
  type: "agent" | "email" | "system" | "user";
  message: string;
  createdAt: Date;
  meta?: string;
};

export function ActivityLog({ items }: { items: ActivityItem[] }) {
  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card className="flex flex-col min-h-[300px]">
      <CardHeader className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
        <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Activity Log</h3>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-500">No activity yet.</p>
        ) : (
          sorted.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div
                className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  item.type === "agent" ? "bg-primary" : "bg-slate-300"
                }`}
              />
              <div>
                <p className="text-[11px] leading-relaxed">{item.message}</p>
                <p className="text-[9px] text-slate-400 mt-1 uppercase font-medium">
                  {new Date(item.createdAt).toLocaleString("en-AU", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
