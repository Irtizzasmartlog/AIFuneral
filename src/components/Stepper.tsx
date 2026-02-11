"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "intake", label: "Intake" },
  { key: "packages", label: "Packages" },
  { key: "email", label: "Email & Approval" },
  { key: "invitations", label: "Invitations" },
  { key: "invoice", label: "Invoice & Booking" },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];

export function Stepper({ currentStep, caseId }: { currentStep: StepKey; caseId?: string }) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="relative">
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2" />
      <div className="relative flex justify-between">
        {STEPS.map((step, i) => {
          const isActive = i === currentIndex;
          const isPast = i < currentIndex;
          const href = caseId ? `/cases/${caseId}/${step.key}` : undefined;
          const content = (
            <>
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-slate-50 relative z-10",
                  isActive && "bg-primary text-white",
                  isPast && "bg-primary text-white",
                  !isActive && !isPast && "bg-slate-200 text-slate-500"
                )}
              >
                {isPast ? (
                  <span className="text-white text-sm">&#10003;</span>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "text-[11px] font-bold mt-2 uppercase tracking-wide",
                  isActive && "text-primary",
                  isPast && "text-primary",
                  !isActive && !isPast && "text-slate-400"
                )}
              >
                {step.label}
              </span>
            </>
          );
          const wrapper = href ? (
            <Link
              key={step.key}
              href={href}
              className="flex flex-col items-center hover:opacity-90 transition-opacity"
            >
              {content}
            </Link>
          ) : (
            <div key={step.key} className="flex flex-col items-center">
              {content}
            </div>
          );
          return wrapper;
        })}
      </div>
    </div>
  );
}

export { STEPS };
