"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const hasFetchedFirst = useRef(false);
  useEffect(() => {
    if (hasFetchedFirst.current || loading || messages.length > 0) return;
    hasFetchedFirst.current = true;
    setLoading(true);
    fetch("/api/chat/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId, messages: [] }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(new Error(d.error ?? res.statusText)));
        return res.json();
      })
      .then((data: { assistantMessage: string; parsed: IntakeResultJSON }) => {
        setMessages([{ role: "assistant", content: data.assistantMessage }]);
        setLastParsed(data.parsed);
        if (data.parsed?.case_patch) setSnapshotPatch(data.parsed.case_patch);
      })
      .catch(() => setError("Failed to load first question"))
      .finally(() => setLoading(false));
  }, [caseId, loading, messages.length]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);
    setError(null);
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);

    try {
      const res = await fetch("/api/chat/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, messages: newMessages }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed: ${res.status}`);
      }
      const data = await res.json();
      const { assistantMessage, parsed } = data as { assistantMessage: string; parsed: IntakeResultJSON };
      setMessages((prev) => [...prev, { role: "assistant", content: assistantMessage }]);
      setLastParsed(parsed);
      if (parsed?.case_patch) setSnapshotPatch(parsed.case_patch);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      toast.error("Failed to get response");
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyToCase() {
    if (!lastParsed) return;
    try {
      await applyIntakeToCase(caseId, lastParsed);
      toast.success("Case updated");
      router.refresh();
    } catch (e) {
      toast.error("Failed to apply");
    }
  }

  const mode = lastParsed?.mode ?? "COLLECTING";
  const canProceed = mode === "GENERATED";

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
        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={handleApplyToCase} disabled={!lastParsed}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Apply to Case
          </Button>
          {canProceed ? (
            <Button asChild>
              <Link href={`/cases/${caseId}/packages`} className="flex items-center gap-2">
                Proceed to Packages
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button disabled>
              Proceed to Packages
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
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
