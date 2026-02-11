"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

type CaseStatus =
  | "Draft"
  | "Quoted"
  | "Sent"
  | "Approved"
  | "Booked"
  | "Completed";

const statusVariant: Record<CaseStatus, "secondary" | "default" | "success" | "warning" | "outline"> = {
  Draft: "secondary",
  Quoted: "outline",
  Sent: "outline",
  Approved: "default",
  Booked: "success",
  Completed: "success",
};

export function TopBar({
  casesList = [],
}: {
  casesList?: { id: string; caseNumber: string; status: string }[];
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const caseId = params?.id as string | undefined;
  const caseData = caseId ? casesList?.find((c) => c.id === caseId) ?? null : null;

  if (status === "loading") {
    return (
      <header className="h-16 border-b border-border-subtle bg-white px-6 flex items-center justify-between z-50 flex-shrink-0">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
      </header>
    );
  }

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  return (
    <header className="h-16 border-b border-border-subtle bg-white px-6 flex items-center justify-between z-50 flex-shrink-0">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
            FF
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">
            FuneralFlow<span className="text-primary">AI</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium text-slate-900 border-b-2 border-primary"
          >
            Dashboard
          </Link>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            Active Cases
          </Link>
        </nav>
        {caseData && casesList && casesList.length > 0 && (
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-slate-500">Current Case:</span>
            <select
              className="text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer text-slate-900"
              value={caseData.id}
              onChange={(e) => router.push(`/cases/${e.target.value}/intake`)}
            >
              {casesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber}
                </option>
              ))}
            </select>
            <Badge variant={statusVariant[caseData.status as CaseStatus] ?? "secondary"}>
              {caseData.status}
            </Badge>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="h-8 w-px bg-slate-200" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold">{session?.user?.name ?? "User"}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
                  {(session?.user as { organizationName?: string })?.organizationName ?? "Organization"}
                </p>
              </div>
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
