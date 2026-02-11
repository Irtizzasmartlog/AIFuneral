import type { CaseInput, SchedulingLogisticsOutput, SchedulingTask } from "./types";

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export function runSchedulingLogisticsAgent(caseData: CaseInput): SchedulingLogisticsOutput {
  const tasks: SchedulingTask[] = [];
  const serviceDate = caseData.preferredServiceDate
    ? new Date(caseData.preferredServiceDate)
    : addDays(new Date(), 14);
  const serviceType = caseData.serviceType ?? "burial";
  const venue = caseData.venuePreference ?? "chapel";
  const urgency = caseData.urgency ?? "";

  const daysBefore = urgency.toLowerCase().includes("24") || urgency.toLowerCase().includes("48") ? 2 : 7;

  tasks.push({
    title: `${venue.charAt(0).toUpperCase() + venue.slice(1)} booking confirmation`,
    dueDate: addDays(serviceDate, -daysBefore).toISOString().split("T")[0],
    category: "venue",
  });

  if (serviceType === "cremation") {
    tasks.push({
      title: "Crematorium notification and paperwork",
      dueDate: addDays(serviceDate, -daysBefore).toISOString().split("T")[0],
      category: "logistics",
    });
  }

  tasks.push({
    title: "Transfer of remains arrangement",
    dueDate: addDays(serviceDate, -Math.max(1, daysBefore - 2)).toISOString().split("T")[0],
    category: "logistics",
  });

  tasks.push({
    title: "Director review of documents",
    dueDate: addDays(serviceDate, -daysBefore).toISOString().split("T")[0],
    category: "compliance",
  });

  tasks.push({
    title: "Final confirmation with family",
    dueDate: addDays(serviceDate, -1).toISOString().split("T")[0],
    category: "other",
  });

  return { tasks };
}
