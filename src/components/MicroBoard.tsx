"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Clock, MapPin, Plus, Check, X, Trophy } from "lucide-react";
import { Avatar } from "./Avatar";
import { VerifiedBadge } from "./VerifiedBadge";
import { Modal } from "./Modal";
import { TENDER_CATEGORIES, daysLeft, timeAgo } from "@/lib/format";
import type { CompanyLite } from "@/lib/data";

type Bid = { id: number; amount: number; timelineDays: number; message: string; status: string; createdAt: string; company: CompanyLite };
type Micro = { id: number; companyId: number; title: string; category: string; location: string; budget: number; durationDays: number; description: string; status: string; expiresAt: string; createdAt: string; company: CompanyLite; bids: Bid[] };

export function MicroBoard({ me }: { me: number }) {
  const router = useRouter();
  const [items, setItems] = useState<Micro[]>([]);
  const [tab, setTab] = useState<"open" | "mine">("open");
  const [create, setCreate] = useState(false);
  const [bidFor, setBidFor] = useState<Micro | null>(null);
  const [f, setF] = useState({ title: "", category: TENDER_CATEGORIES[0], location: "", budget: "", durationDays: "7", description: "", expiresInDays: "7" });
  const [bid, setBid] = useState({ amount: "", timelineDays: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/micro");
    if (r.ok) setItems(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function post() {
    setBusy(true); setError(null);
    const r = await fetch("/api/micro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error);
    setCreate(false); setF({ title: "", category: TENDER_CATEGORIES[0], location: "", budget: "", durationDays: "7", description: "", expiresInDays: "7" });
    load(); router.refresh();
  }
  async function sendBid() {
    if (!bidFor) return;
    setBusy(true); setError(null);
    const r = await fetch(`/api/micro/${bidFor.id}/bids`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bid) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error);
    router.push(`/messages?c=${d.conversationId}`);
  }
  async function decide(m: Micro, bidId: number, action: "accept" | "decline") {
    await fetch(`/api/micro/${m.id}/bids`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bidId, action }) });
    load();
  }

  const visible = tab === "mine" ? items.filter((m) => m.companyId === me) : items.filter((m) => m.status === "open");

  return (
    <div className="space-y-3">
      <div className="card p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><Zap size={20} className="text-action" /> Live Micro-RFP Board</h1>
          <p className="text-sm text-muted mt-0.5">Specific daily needs from verified businesses. Structured, comparable bids - no email ping-pong.</p>
        </div>
        <button onClick={() => setCreate(true)} className="btn-primary"><Plus size={14} /> Post a need</button>
      </div>

      <div className="card px-1 flex">
        {([["open", "Open requests"], ["mine", "My requests & bids"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`relative px-3 py-2.5 text-sm font-semibold ${tab === k ? "text-action" : "text-muted hover:text-ink"}`}>
            {l}{tab === k && <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full meter-spectrum" />}
          </button>
        ))}
      </div>

      {visible.length === 0 && <div className="card p-10 text-center text-sm text-muted">{tab === "mine" ? "You haven't posted any micro-RFPs yet." : "No open requests right now."}</div>}

      {visible.map((m) => {
        const mine = m.companyId === me;
        const left = daysLeft(m.expiresAt);
        return (
          <div key={m.id} className="card p-4">
            <div className="flex items-start gap-3">
              <Avatar name={m.company.name} src={m.company.logoUrl} size={44} rounded="rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <Link href={`/company/${m.company.slug}`} className="font-semibold text-ink hover:underline inline-flex items-center gap-1">{m.company.name} {m.company.verified && <VerifiedBadge size={12} />}</Link>
                  <span className="text-muted">· {timeAgo(m.createdAt)}</span>
                  {m.status === "awarded" && <span className="chip !bg-emerald-50 !text-emerald-700 gap-1"><Trophy size={11} /> Awarded</span>}
                </div>
                <h3 className="font-semibold text-ink mt-0.5">{m.title}</h3>
                <p className="text-sm text-ink-70 mt-1">{m.description}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  <span className="font-semibold text-ink">Budget ${m.budget.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {m.location}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {m.durationDays}-day job</span>
                  <span className={left <= 2 ? "text-red-700 font-semibold" : ""}>{m.status === "open" ? `${left}d to bid` : "Closed"}</span>
                  <span>{m.bids.length} bid{m.bids.length === 1 ? "" : "s"}</span>
                </div>
                {!mine && m.status === "open" && (
                  <button onClick={() => { setBidFor(m); setBid({ amount: "", timelineDays: String(m.durationDays), message: "" }); setError(null); }} className="btn-primary !py-1 !text-xs mt-2.5"><Zap size={12} /> Submit structured bid</button>
                )}
              </div>
            </div>

            {(mine || m.bids.some((b) => b.company.id === me)) && m.bids.length > 0 && (
              <div className="mt-3 rounded-xl border border-line overflow-hidden">
                <div className="px-3 py-1.5 bg-hover/60 text-xs font-semibold text-muted">Comparable bids</div>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-line">
                    {m.bids.map((b) => (
                      <tr key={b.id} className="align-top">
                        <td className="px-3 py-2 w-44">
                          <div className="flex items-center gap-1.5 font-semibold text-ink"><Avatar name={b.company.name} src={b.company.logoUrl} size={18} rounded="rounded" /> <span className="truncate">{b.company.name}</span></div>
                          {b.company.verified && <span className="text-[10px] text-action font-semibold">Verified · transaction-reviewed</span>}
                        </td>
                        <td className="px-2 py-2 font-semibold text-ink whitespace-nowrap">${b.amount.toLocaleString()}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-muted">{b.timelineDays} days</td>
                        <td className="px-2 py-2 text-ink-70">{b.message}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          {b.status === "accepted" ? <span className="text-emerald-700 font-semibold inline-flex items-center gap-1"><Check size={12} /> Accepted</span>
                            : b.status === "declined" ? <span className="text-muted">Declined</span>
                            : mine && m.status === "open" ? (
                              <span className="inline-flex gap-1">
                                <button onClick={() => decide(m, b.id, "accept")} className="btn-primary !py-0.5 !px-2 !text-[11px] !min-h-0">Accept</button>
                                <button onClick={() => decide(m, b.id, "decline")} className="btn-ghost !py-0.5 !px-2 !text-[11px] !min-h-0"><X size={11} /></button>
                              </span>
                            ) : <span className="text-muted">Submitted</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      <Modal open={create} onClose={() => setCreate(false)} title="Post a daily need (Micro-RFP)">
        <div className="space-y-3">
          <div><label className="label">What do you need? *</label><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Need a structural engineer in Johannesburg for a 2-week audit" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Category</label><select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{TENDER_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label className="label">Location</label><input className="input" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="City or Remote" /></div>
            <div><label className="label">Budget (USD) *</label><input type="number" className="input" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} /></div>
            <div><label className="label">Job duration (days)</label><input type="number" className="input" value={f.durationDays} onChange={(e) => setF({ ...f, durationDays: e.target.value })} /></div>
          </div>
          <div><label className="label">Details *</label><textarea rows={3} className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Specs, standards, deliverables..." /></div>
          <div><label className="label">Bidding window (days)</label><input type="number" className="input" value={f.expiresInDays} onChange={(e) => setF({ ...f, expiresInDays: e.target.value })} /></div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2"><button onClick={() => setCreate(false)} className="btn-ghost">Cancel</button><button onClick={post} disabled={busy || !f.title || !f.budget || !f.description} className="btn-primary">{busy ? "Posting..." : "Post to verified network"}</button></div>
        </div>
      </Modal>

      <Modal open={!!bidFor} onClose={() => setBidFor(null)} title={`Bid: ${bidFor?.title ?? ""}`}>
        <div className="space-y-3">
          <p className="text-sm text-muted">Structured bid to {bidFor?.company.name}. Budget guide ${bidFor?.budget.toLocaleString()}, expected {bidFor?.durationDays} days. Your verified profile and reviews attach automatically.</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Your price (USD) *</label><input type="number" className="input" value={bid.amount} onChange={(e) => setBid({ ...bid, amount: e.target.value })} /></div>
            <div><label className="label">Timeline (days) *</label><input type="number" className="input" value={bid.timelineDays} onChange={(e) => setBid({ ...bid, timelineDays: e.target.value })} /></div>
          </div>
          <div><label className="label">Approach & relevant experience *</label><textarea rows={3} className="input" value={bid.message} onChange={(e) => setBid({ ...bid, message: e.target.value })} /></div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2"><button onClick={() => setBidFor(null)} className="btn-ghost">Cancel</button><button onClick={sendBid} disabled={busy || !bid.amount || !bid.message} className="btn-primary">{busy ? "Sending..." : "Send bid & open deal room"}</button></div>
        </div>
      </Modal>
    </div>
  );
}
