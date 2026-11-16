"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Megaphone, Boxes, Warehouse, Ship, UserCheck, Cog, Plus, Send, CheckCircle2, ArrowRight } from "lucide-react";
import { Avatar } from "./Avatar";
import { Modal } from "./Modal";
import { timeAgo } from "@/lib/format";
import type { CompanyLite } from "@/lib/data";

type Pod = { id: number; name: string; industry: string; description: string; memberLimit: number; members: CompanyLite[]; isMember: boolean; messages: { id: number; content: string; createdAt: string; company: CompanyLite }[] };
type Referral = { id: number; note: string; commissionPct: number; status: string; createdAt: string; referrer: CompanyLite; referred: CompanyLite; buyer: CompanyLite | null; outgoing: boolean };
type Resource = { id: number; type: string; title: string; description: string; location: string; rate: number; unit: string; company: CompanyLite };

const TYPE: Record<string, { icon: typeof Cog; label: string }> = {
  warehouse: { icon: Warehouse, label: "Warehouse space" },
  shipping: { icon: Ship, label: "Shared shipping" },
  executive: { icon: UserCheck, label: "Fractional executive" },
  equipment: { icon: Cog, label: "Idle equipment" },
};

export function ResourcesView({ me }: { me: number }) {
  const router = useRouter();
  const [tab, setTab] = useState<"pods" | "referrals" | "market">("pods");
  const [pods, setPods] = useState<Pod[]>([]);
  const [refs, setRefs] = useState<Referral[]>([]);
  const [market, setMarket] = useState<Resource[]>([]);
  const [openPod, setOpenPod] = useState<number | null>(null);
  const [podText, setPodText] = useState("");
  const [podError, setPodError] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [lf, setLf] = useState({ type: "warehouse", title: "", description: "", location: "", rate: "", unit: "$/day" });
  const [busy, setBusy] = useState(false);

  async function load() {
    const [p, r, m] = await Promise.all([fetch("/api/pods"), fetch("/api/referrals"), fetch("/api/resources")]);
    if (p.ok) setPods(await p.json());
    if (r.ok) setRefs(await r.json());
    if (m.ok) setMarket(await m.json());
  }
  useEffect(() => { load(); }, []);

  async function join(pod: Pod) {
    setPodError(null);
    const r = await fetch("/api/pods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ podId: pod.id, action: pod.isMember ? "leave" : "join" }) });
    const d = await r.json();
    if (!r.ok) return setPodError(d.error);
    load();
  }
  async function podSend(podId: number) {
    if (!podText.trim()) return;
    const r = await fetch(`/api/pods/${podId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: podText }) });
    if (r.ok) { setPodText(""); load(); }
  }
  async function listResource() {
    setBusy(true);
    const r = await fetch("/api/resources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lf) });
    setBusy(false);
    if (r.ok) { setListOpen(false); setLf({ type: "warehouse", title: "", description: "", location: "", rate: "", unit: "$/day" }); load(); }
  }
  async function convert(ref: Referral) {
    await fetch("/api/referrals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ref.id, status: ref.status === "tracked" ? "converted" : "credited" }) });
    load(); router.refresh();
  }
  async function inquire(res: Resource) {
    const r = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companyId: res.company.id, kind: "general", subject: `Resource: ${res.title}`, content: `Hi ${res.company.name}, we're interested in "${res.title}" (${res.location}) at $${res.rate} ${res.unit}. Is it available?` }) });
    const d = await r.json();
    router.push(`/messages?c=${d.conversationId}`);
  }

  const earned = refs.filter((r) => r.outgoing && r.status !== "tracked").length;

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <h1 className="text-xl font-semibold">Community Hub</h1>
        <p className="text-sm text-muted mt-0.5">Vetted mastermind pods, tracked B2B referral loops and a local marketplace for fractional & surplus resources.</p>
      </div>
      <div className="card px-1 flex overflow-x-auto">
        {([["pods", "Mastermind Pods", Users], ["referrals", "Referral Loops", Megaphone], ["market", "Resource Marketplace", Boxes]] as const).map(([k, l, I]) => (
          <button key={k} onClick={() => setTab(k)} className={`relative whitespace-nowrap px-3 py-2.5 text-sm font-semibold inline-flex items-center gap-1.5 ${tab === k ? "text-action" : "text-muted hover:text-ink"}`}>
            <I size={15} /> {l}{tab === k && <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full meter-spectrum" />}
          </button>
        ))}
      </div>

      {tab === "pods" && (
        <div className="space-y-2">
          {podError && <div className="card p-3 text-sm text-red-700 border-red-200 bg-red-50">{podError}</div>}
          {pods.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h3 className="font-semibold text-ink">{p.name}</h3>
                  <p className="text-sm text-muted mt-0.5">{p.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex -space-x-2">{p.members.slice(0, 6).map((m) => <Avatar key={m.id} name={m.name} src={m.logoUrl} size={26} rounded="rounded" className="ring-2 ring-white" />)}</div>
                    <span className="text-xs text-muted">{p.members.length}/{p.memberLimit} seats · non-competing · vetted</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {p.isMember && <button onClick={() => setOpenPod(openPod === p.id ? null : p.id)} className="btn-outline !py-1 !text-xs">Open pod space</button>}
                  <button onClick={() => join(p)} className={`${p.isMember ? "btn-ghost" : "btn-primary"} !py-1 !text-xs`}>{p.isMember ? "Leave" : p.members.length >= p.memberLimit ? "Waitlist" : "Request seat"}</button>
                </div>
              </div>
              {openPod === p.id && p.isMember && (
                <div className="mt-3 rounded-xl border border-line">
                  <div className="max-h-64 overflow-y-auto p-3 space-y-2.5 bg-hover/40">
                    {p.messages.map((m) => (
                      <div key={m.id} className="flex gap-2">
                        <Avatar name={m.company.name} src={m.company.logoUrl} size={28} rounded="rounded" />
                        <div className="bg-white border border-line rounded-lg px-3 py-2 flex-1">
                          <div className="flex justify-between text-xs"><b>{m.company.name}</b><span className="text-muted">{timeAgo(m.createdAt)}</span></div>
                          <p className="text-sm text-ink mt-0.5">{m.content}</p>
                        </div>
                      </div>
                    ))}
                    {p.messages.length === 0 && <p className="text-xs text-muted text-center py-4">Daily troubleshooting starts here. Share a vendor question or a win.</p>}
                  </div>
                  <div className="p-2 border-t border-line flex gap-2">
                    <input className="input !rounded-full" value={podText} onChange={(e) => setPodText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && podSend(p.id)} placeholder="Troubleshoot, recommend a vendor, share a resource..." />
                    <button onClick={() => podSend(p.id)} className="btn-primary !rounded-full !p-2.5"><Send size={16} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "referrals" && (
        <div className="space-y-2">
          <div className="card p-4 flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted max-w-lg">Recommend a business from any feed post's "..." menu. LinkBiz tracks the loop end-to-end and applies the referred company's published commission automatically on conversion.</p>
            <span className="chip gap-1"><CheckCircle2 size={12} className="text-emerald-600" /> {earned} converting referral{earned === 1 ? "" : "s"}</span>
          </div>
          {refs.length === 0 && <div className="card p-8 text-center text-sm text-muted">No referrals yet. Open a feed post and choose "Recommend a business".</div>}
          {refs.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <Avatar name={r.referrer.name} src={r.referrer.logoUrl} size={28} rounded="rounded" />
                <Link href={`/company/${r.referrer.slug}`} className="font-semibold hover:underline">{r.referrer.name}</Link>
                <ArrowRight size={14} className="text-action" />
                <Avatar name={r.referred.name} src={r.referred.logoUrl} size={28} rounded="rounded" />
                <Link href={`/company/${r.referred.slug}`} className="font-semibold hover:underline">{r.referred.name}</Link>
                {r.buyer && <span className="text-xs text-muted">for {r.buyer.name}</span>}
                <span className={`ml-auto chip ${r.status === "credited" ? "!bg-emerald-50 !text-emerald-700" : r.status === "converted" ? "!bg-tint !text-action" : ""}`}>{r.status}</span>
              </div>
              <p className="text-sm text-ink-70 mt-2">{r.note}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted flex-wrap gap-2">
                <span>{timeAgo(r.createdAt)} · commission {r.commissionPct}% on conversion {r.outgoing ? "(you earn)" : "(you pay on conversion)"}</span>
                {r.status !== "credited" && <button onClick={() => convert(r)} className="btn-outline !py-0.5 !text-xs">{r.status === "tracked" ? "Mark converted" : "Credit commission"}</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "market" && (
        <div className="space-y-2">
          <div className="card p-4 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted">Rent idle warehouse space, share containers, book vetted fractional executives - local, verified, hourly.</p>
            <button onClick={() => setListOpen(true)} className="btn-primary !py-1 !text-xs"><Plus size={12} /> List a resource</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {market.map((r) => {
              const T = TYPE[r.type] ?? TYPE.equipment;
              return (
                <div key={r.id} className="card p-4 flex flex-col">
                  <div className="flex items-center gap-2 text-xs text-muted"><T.icon size={14} className="text-action" /> {T.label} · {r.location}</div>
                  <h3 className="font-semibold text-ink mt-1">{r.title}</h3>
                  <p className="text-sm text-ink-70 mt-1 flex-1">{r.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-sm"><b className="text-ink">${r.rate}</b> <span className="text-xs text-muted">{r.unit}</span></div>
                    <Link href={`/company/${r.company.slug}`} className="flex items-center gap-1.5 text-xs text-muted hover:text-action"><Avatar name={r.company.name} src={r.company.logoUrl} size={20} rounded="rounded" /> {r.company.name}</Link>
                  </div>
                  {r.company.id !== me && <button onClick={() => inquire(r)} className="btn-outline w-full mt-2.5 !py-1 !text-xs">Book / inquire</button>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal open={listOpen} onClose={() => setListOpen(false)} title="List a fractional or surplus resource">
        <div className="space-y-3">
          <div><label className="label">Type</label><select className="input" value={lf.type} onChange={(e) => setLf({ ...lf, type: e.target.value })}>{Object.entries(TYPE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
          <div><label className="label">Title *</label><input className="input" value={lf.title} onChange={(e) => setLf({ ...lf, title: e.target.value })} placeholder="e.g. 1,200 m2 ambient warehouse - Durban" /></div>
          <div><label className="label">Description</label><textarea rows={3} className="input" value={lf.description} onChange={(e) => setLf({ ...lf, description: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Location</label><input className="input" value={lf.location} onChange={(e) => setLf({ ...lf, location: e.target.value })} /></div>
            <div><label className="label">Rate (USD) *</label><input type="number" className="input" value={lf.rate} onChange={(e) => setLf({ ...lf, rate: e.target.value })} /></div>
            <div><label className="label">Unit</label><input className="input" value={lf.unit} onChange={(e) => setLf({ ...lf, unit: e.target.value })} placeholder="$/hour" /></div>
          </div>
          <div className="flex justify-end gap-2"><button onClick={() => setListOpen(false)} className="btn-ghost">Cancel</button><button onClick={listResource} disabled={busy || !lf.title || !lf.rate} className="btn-primary">{busy ? "Listing..." : "Publish listing"}</button></div>
        </div>
      </Modal>
    </div>
  );
}
