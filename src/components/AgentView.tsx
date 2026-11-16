"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Send, X, FileText, RefreshCw, Zap, ShoppingCart, Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar } from "./Avatar";
import { PostSkeleton } from "./Skeleton";
import type { CompanyLite } from "@/lib/data";

type Match = {
  id: number; sourceType: string; sourceId: number; score: number; pitch: string; outline: string | null;
  status: string; title: string; owner: CompanyLite | undefined; category: string; budget: string | null; live: boolean;
};

const SRC: Record<string, { label: string; icon: typeof Zap }> = {
  tender: { label: "Open tender", icon: Briefcase },
  micro: { label: "Micro-RFP", icon: Zap },
  buy: { label: "Buying intent", icon: ShoppingCart },
};

export function AgentView({ companyName }: { companyName: string }) {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  async function load() {
    setMatches(null);
    const r = await fetch("/api/agent");
    if (r.ok) setMatches(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function act(m: Match, action: "pitch" | "dismiss") {
    setBusy(m.id);
    const r = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: m.id, action }) });
    const d = await r.json();
    setBusy(null);
    if (action === "pitch" && d.conversationId) return router.push(`/messages?c=${d.conversationId}`);
    setMatches((p) => p?.map((x) => (x.id === m.id ? { ...x, status: action === "pitch" ? "pitched" : "dismissed" } : x)) ?? null);
  }

  const active = matches?.filter((m) => m.status !== "dismissed") ?? [];
  const dismissed = matches?.filter((m) => m.status === "dismissed") ?? [];

  return (
    <div className="space-y-3">
      <div className="card p-5 bg-gradient-to-br from-tint via-white/60 to-white/30 spectrum-border">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-ink flex items-center gap-2"><Sparkles className="text-action" size={22} /> Your Autonomous Deal-Matching Agent</h1>
            <p className="text-sm text-muted mt-1 max-w-xl">Scanning the network continuously for {companyName}: open tenders, micro-RFPs and buying-intent posts are scored against your verified capabilities, capacity and region. You are only alerted when a warm match is ready - with the pitch already written.</p>
          </div>
          <button onClick={load} className="btn-outline"><RefreshCw size={14} /> Re-scan network</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="chip gap-1"><span className="dot-live bg-emerald-500" /> Agent active</span>
          <span className="chip">{active.length} warm matches</span>
          <span className="chip">{active.filter((m) => m.outline).length} proposal drafts ready</span>
        </div>
      </div>

      {!matches && <><PostSkeleton /><PostSkeleton /></>}
      {matches && active.length === 0 && <div className="card p-10 text-center text-sm text-muted">No warm matches right now. Add services and keep your capacity status current - the agent re-scores every scan.</div>}

      {active.map((m) => {
        const Src = SRC[m.sourceType] ?? SRC.tender;
        const open = openId === m.id;
        return (
          <div key={m.id} className="card p-4">
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-sm ${m.score >= 75 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : m.score >= 60 ? "bg-tint text-action border border-action/20" : "bg-hover text-muted border border-line"}`}>{m.score}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted flex-wrap">
                  <span className="inline-flex items-center gap-1 font-semibold text-action"><Src.icon size={12} /> {Src.label}</span>
                  <span>· {m.category}</span>
                  {m.budget && <span>· {m.budget}</span>}
                  {m.status === "pitched" && <span className="chip !bg-emerald-50 !text-emerald-700">Pitch sent</span>}
                  {!m.live && <span className="chip">Archived</span>}
                </div>
                <h3 className="font-semibold text-ink mt-0.5 leading-snug">{m.title}</h3>
                {m.owner && (
                  <Link href={`/company/${m.owner.slug}`} className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted hover:text-action">
                    <Avatar name={m.owner.name} src={m.owner.logoUrl} size={18} rounded="rounded" /> {m.owner.name} · {m.owner.location}
                  </Link>
                )}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button onClick={() => act(m, "pitch")} disabled={busy === m.id || m.status === "pitched"} className="btn-primary !py-1 !text-xs"><Send size={12} /> {m.status === "pitched" ? "Pitched" : "Send AI pitch"}</button>
                  {m.outline && <button onClick={() => setOpenId(open ? null : m.id)} className="btn-outline !py-1 !text-xs"><FileText size={12} /> 80% proposal draft {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</button>}
                  {m.sourceType === "tender" && <Link href={`/tenders/${m.sourceId}?bid=1`} className="btn-ghost !py-1 !text-xs">Open tender</Link>}
                  {m.sourceType === "micro" && <Link href="/micro" className="btn-ghost !py-1 !text-xs">Open board</Link>}
                  <button onClick={() => act(m, "dismiss")} disabled={busy === m.id} className="btn-text !py-1 !text-xs"><X size={12} /> Dismiss</button>
                </div>
              </div>
            </div>
            {open && m.outline && (
              <pre className="mt-3 rounded-xl border border-line bg-hover/60 p-3 text-xs text-ink whitespace-pre-wrap font-sans max-h-96 overflow-y-auto">{m.outline}</pre>
            )}
            {open && (
              <details className="mt-2 text-xs text-muted">
                <summary className="cursor-pointer font-semibold text-action">View the auto-written pitch</summary>
                <pre className="mt-1 whitespace-pre-wrap font-sans rounded-xl border border-line p-3 bg-white">{m.pitch}</pre>
              </details>
            )}
          </div>
        );
      })}

      {dismissed.length > 0 && (
        <details className="card p-4 text-sm text-muted">
          <summary className="cursor-pointer font-semibold">Dismissed matches ({dismissed.length})</summary>
          <ul className="mt-2 space-y-1 text-xs">{dismissed.map((m) => <li key={m.id}>{m.title} - score {m.score}</li>)}</ul>
        </details>
      )}
    </div>
  );
}
