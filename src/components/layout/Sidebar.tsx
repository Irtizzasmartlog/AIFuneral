"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  FileText,
  Package,
  Mail,
  ImageIcon,
  Receipt,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "intake", label: "Intake", icon: FileText },
  { href: "packages", label: "Packages & Quote", icon: Package },
  { href: "email", label: "Email & Approval", icon: Mail },
  { href: "invitations", label: "Invitations & Add-ons", icon: ImageIcon },
  { href: "invoice", label: "Invoice & Booking", icon: Receipt },
] as const;

export function Sidebar() {
  const params = useParams();
  const pathname = usePathname();
  const caseId = params.id as string | undefined;

  const basePath = caseId ? `/cases/${caseId}` : "";

  return (
    <aside className="w-64 border-r border-border-subtle bg-sidebar p-4 hidden lg:flex flex-col gap-1 overflow-y-auto">
      <div className="mb-6 px-2">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          Case Workflow
        </h3>
        <div className="space-y-1">
          {navItems.map((item) => {
            const href = `${basePath}/${item.href}`;
            const isActive = pathname === href || pathname?.startsWith(href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === "/settings" ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </div>
      <div className="mt-auto px-2">
        <div className="bg-gradient-to-br from-primary to-blue-700 rounded-xl p-4 text-white">
          <p className="text-xs font-medium opacity-80 mb-2">Need assistance?</p>
          <button
            type="button"
            className="w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-xs font-bold transition-all"
          >
            Launch AI Chat
          </button>
        </div>
      </div>
    </aside>
  );
}
