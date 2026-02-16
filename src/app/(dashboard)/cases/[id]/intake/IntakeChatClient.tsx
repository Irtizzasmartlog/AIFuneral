"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { parseAssistantResponse } from "@/lib/chat/mock-intake-engine";
import type { ChatMessage, IntakeResultJSON, CasePatch } from "@/lib/chat/types";
import { applyIntakeToCase } from "@/app/actions/case";
import { Send, User, Bot, CheckCircle, ArrowRight, BarChart3, Church, Globe } from "lucide-react";

type IntakeChatClientProps = {
  caseId: string;
  caseNumber: string;
  initialMessages: { role: string; content: string }[];
  initialCaseData: CasePatch | null;
};

function displayText(content: string): string {
  const { text } = parseAssistantResponse(content);
  return text;
}

function parseFromContent(content: string): IntakeResultJSON | null {
  const { parsed } = parseAssistantResponse(content);
  return parsed;
}

export function IntakeChatClient({
  caseId,
  caseNumber,
  initialMessages,
  initialCaseData,
}: IntakeChatClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastParsed, setLastParsed] = useState<IntakeResultJSON | null>(() => {
    const lastAssistant = [...initialMessages].reverse().find((m) => m.role === "assistant");
    if (lastAssistant) return parseFromContent(lastAssistant.content);
    return null;
  });
  const [snapshotPatch, setSnapshotPatch] = useState<CasePatch>(() => {
    const lastAssistant = [...initialMessages].reverse().find((m) => m.role === "assistant");
    const parsed = lastAssistant ? parseFromContent(lastAssistant.content) : null;
    if (parsed?.case_patch && Object.keys(parsed.case_patch).length > 0) return parsed.case_patch;
    return initialCaseData ?? {};
  });
  const [hasApplied, setHasApplied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Default to empty so local uses relative /api/chat/intake
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
  const intakeUrl = apiBase ? `${apiBase}/api/chat/intake` : "/api/chat/intake";

  const hasFetchedFirst = useRef(false);
  useEffect(() => {
    if (hasFetchedFirst.current || loading || messages.length > 0) return;
    hasFetchedFirst.current = true;
    setLoading(true);
    const payload = { caseId, messages: [] as ChatMessage[] };
    console.log("[intake] request payload:", payload);
    fetch(intakeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const raw = await res.json().catch(() => ({}));
        console.log("[intake] response status:", res.status, "| raw response:", raw);
        if (!res.ok) {
          setError((raw as { error?: string }).error ?? res.statusText ?? "Failed to load first question");
          return;
        }
        const msg = (raw as { assistantMessage?: string; content?: string }).assistantMessage ?? (raw as { content?: string }).content ?? "";
        setMessages([{ role: "assistant", content: msg }]);
        const parsed = (raw as { parsed?: IntakeResultJSON }).parsed ?? null;
        setLastParsed(parsed);
        if (parsed?.case_patch) setSnapshotPatch(parsed.case_patch);
      })
      .catch((e) => {
        console.error("[intake] fetch error:", e);
        setError("Failed to load first question");
      })
      .finally(() => setLoading(false));
  }, [caseId, loading, messages.length, intakeUrl]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);
    setError(null);
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);

    try {
      const payload = { caseId, messages: newMessages };
      console.log("[intake] request payload:", payload);
      const res = await fetch(intakeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      console.log("[intake] response status:", res.status, "| raw response:", data);
      if (!res.ok) {
        const errMsg = (data as { error?: string }).error ?? `Request failed: ${res.status}`;
        setError(errMsg);
        toast.error("Failed to get response");
        return;
      }
      const msg = (data as { assistantMessage?: string }).assistantMessage ?? (data as { content?: string }).content ?? "";
      const parsed = (data as { parsed?: IntakeResultJSON }).parsed ?? null;
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
      setLastParsed(parsed);
      if (parsed?.case_patch) setSnapshotPatch(parsed.case_patch);
    } catch (e) {
      console.error("[intake] send error:", e);
      setError(e instanceof Error ? e.message : "Something went wrong");
      toast.error("Failed to get response");
    } finally {
      setLoading(false);
    }
  }

  const [applying, setApplying] = useState(false);
  const [proceedingToPackages, setProceedingToPackages] = useState(false);

  async function handleApplyToCase() {
    if (!lastParsed) return;
    setApplying(true);
    try {
      await applyIntakeToCase(caseId, lastParsed);
      setHasApplied(true);
      toast.success("Case updated and packages generated");
      router.refresh();
    } catch (e) {
      toast.error("Failed to apply");
    } finally {
      setApplying(false);
    }
  }

  const mode = lastParsed?.mode ?? "COLLECTING";
  const canProceed = mode === "GENERATED";
  const targetPackagesUrl = `/cases/${caseId}/packages`;

  async function handleProceedToPackages() {
    console.log("Proceed to packages", caseId, targetPackagesUrl);
    setProceedingToPackages(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/packages/generate`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      console.log("Generate packages response:", res.status, data);
      if (!res.ok) {
        toast.error(data.error ?? "Failed to generate packages");
        return;
      }
      toast.success(data.count ? `${data.count} packages generated` : "Packages ready");
      router.push(targetPackagesUrl);
    } catch (e) {
      console.error("Proceed to packages failed", e);
      toast.error("Could not open Packages page");
    } finally {
      setProceedingToPackages(false);
    }
  }

  const completionFields = [
    snapshotPatch.deceasedFullName,
    snapshotPatch.nextOfKinName,
    snapshotPatch.nextOfKinEmail,
    snapshotPatch.serviceType,
    snapshotPatch.budgetMin != null,
    snapshotPatch.budgetMax != null,
    snapshotPatch.suburb,
    snapshotPatch.state,
  ];
  const filled = completionFields.filter(Boolean).length;
  const completionPercent = Math.round((filled / 8) * 100);

  return (
    <div className="flex gap-8 items-start">
      <div className="flex-1 flex flex-col min-h-[500px]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-bold text-slate-900">Chat intake</h2>
            <p className="text-xs text-slate-500">One question at a time. Answer in the box below.</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[280px] max-h-[420px]" ref={scrollRef}>
            {messages.length === 0 && !loading && (
              <p className="text-sm text-slate-500">Send a message to start, or wait for the first question.</p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
              >
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-xl px-4 py-2.5 max-w-[85%] ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{m.role === "assistant" ? displayText(m.content) : m.content}</p>
                </div>
                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-xl px-4 py-2.5 bg-slate-100">
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
          {error && (
            <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          <div className="p-4 border-t border-slate-200 flex gap-2">
            <Input
              placeholder="Type your answer or request..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={loading}>
              {loading ? "..." : "Send"}
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleApplyToCase}
              disabled={!lastParsed || applying}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {applying ? "Applying..." : "Apply to Case"}
            </Button>
            <Button
              onClick={handleProceedToPackages}
              disabled={!canProceed || proceedingToPackages}
              className="flex items-center gap-2"
            >
              {proceedingToPackages ? "Generating..." : "Proceed to Packages"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          {canProceed && !hasApplied && (
            <p className="text-sm text-amber-700">
              Please apply intake to the case before proceeding to Packages.
            </p>
          )}
        </div>
      </div>

      <div className="w-80 flex-shrink-0 sticky top-0">
        <Card className="overflow-hidden">
          <CardHeader className="p-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                Case Snapshot
              </h3>
            </div>
            <Badge variant={mode === "GENERATED" ? "default" : "secondary"}>
              {mode === "GENERATED" ? "Ready" : "In progress"}
            </Badge>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Subject
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {snapshotPatch.deceasedFullName || "Not set"}
              </p>
              <p className="text-[11px] text-slate-500">Case ID: {caseNumber}</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Completion</span>
                <span className="font-bold">{completionPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, completionPercent)}%` }}
                />
              </div>
            </div>
            <div className="space-y-4">
              {(snapshotPatch.serviceType || snapshotPatch.serviceStyle) && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Church className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Service
                    </p>
                    <p className="text-xs font-medium text-slate-700 capitalize">
                      {snapshotPatch.serviceType} {snapshotPatch.serviceStyle ? `(${snapshotPatch.serviceStyle})` : ""}
                    </p>
                  </div>
                </div>
              )}
              {(snapshotPatch.culturalFaithRequirements || snapshotPatch.serviceStyle) && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Affiliation
                    </p>
                    <p className="text-xs font-medium text-slate-700">
                      {snapshotPatch.culturalFaithRequirements || snapshotPatch.serviceStyle || "Not specified"}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {snapshotPatch.nextOfKinName && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Primary contact
                </p>
                <p className="text-sm font-semibold text-slate-900">{snapshotPatch.nextOfKinName}</p>
                <p className="text-xs text-slate-500">
                  {snapshotPatch.nextOfKinPhone || snapshotPatch.nextOfKinEmail || ""}
                </p>
              </div>
            )}
            {mode === "GENERATED" && lastParsed?.packages?.length && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Packages generated
                </p>
                <p className="text-xs text-slate-600">
                  {lastParsed.packages.length} tiers. Click Apply to Case then Proceed to Packages.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
