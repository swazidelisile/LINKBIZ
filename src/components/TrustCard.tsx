"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldAlert, FileCheck2, Umbrella, Gauge, Clock3, Pencil } from "lucide-react";

type Trust = {
  id: number; verified: boolean; taxCompliant: boolean; insuranceVerified: boolean; creditTier: string;
  capacityStatus: string; capacityNote: string | null; leadTime: string | null;
};

const CAP: Record<string, { label: string; cls: string; dot: string }> = {
  available: { label: "Open for work", cls: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  limited: { label: "Limited capacity", cls: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  full: { label: "Fully booked", cls: "text-red-700 bg-red-50 border-red-200", dot: "bg-red-500" },
};

export function TrustCard({ company, isOwner }: { company: Trust; isOwner: boolean }) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [status, setStatus] = useState(company.capacityStatus);
  const [note, setNote] = useState(company.capacityNote ?? "");
  const [lead, setLead] = useState(company.leadTime ?? "");
  const cap = CAP[status] ?? CAP.available;

  async function save() {
    await fetch(`/api/companies/${company.id}/capacity`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ capacityStatus: status, capacityNote: note, leadTime: lead }) });
    setEdit(false);
    router.refresh();
  }

  const badges = [
    { ok: company.verified, label: "Registration verified", icon: ShieldCheck },
    { ok: company.taxCompliant, label: "Tax compliant", icon: FileCheck2 },
    { ok: company.insuranceVerified, label: "Insurance verified", icon: Umbrella },
  ];

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base text-ink">Trust & Due Diligence</h3>
        <span className="inline-flex items-center gap-1 rounded-xl border border-line bg-hover px-2 py-0.5 text-xs font-bold text-ink"><Gauge size={12} className="text-action" /> Credit {company.creditTier}</span>
      </div>
      <ul className="mt-2.5 space-y-1.5">
        {badges.map((b) => (
          <li key={b.label} className="flex items-center gap-2 text-sm">
            {b.ok ? <b.icon size={16} className="text-emerald-600" /> : <ShieldAlert size={16} className="text-amber-500" />}
            <span className={b.ok ? "text-ink" : "text-muted"}>{b.label}</span>
            <span className={`ml-auto text-xs font-semibold ${b.ok ? "text-emerald-700" : "text-amber-600"}`}>{b.ok ? "Verified" : "Pending"}</span>
          </li>
        ))}
      </ul>
      <div className="hairline mt-3 pt-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-muted uppercase tracking-wide">Live capacity</div>
          {isOwner && !edit && <button onClick={() => setEdit(true)} className="text-xs text-action font-semibold inline-flex items-center gap-1 hover:underline"><Pencil size={11} /> Update</button>}
        </div>
        {!edit ? (
          <>
            <div className={`mt-1.5 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${cap.cls}`}>
              <span className={`dot-live ${cap.dot}`} /> {cap.label}
            </div>
            {company.capacityNote && <p className="text-xs text-ink-70 mt-1.5">{company.capacityNote}</p>}
            {company.leadTime && <p className="text-xs text-muted mt-0.5 flex items-center gap-1"><Clock3 size={12} /> {company.leadTime}</p>}
          </>
        ) : (
          <div className="mt-2 space-y-2">
            <select className="input !py-1.5" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="available">Open for work</option>
              <option value="limited">Limited capacity</option>
              <option value="full">Fully booked</option>
            </select>
            <input className="input !py-1.5" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 2 of 6 project slots open" />
            <input className="input !py-1.5" value={lead} onChange={(e) => setLead(e.target.value)} placeholder="Lead time, e.g. Kickoff in 2 weeks" />
            <div className="flex gap-2"><button onClick={save} className="btn-primary !py-1 !text-xs">Save status</button><button onClick={() => setEdit(false)} className="btn-ghost !py-1 !text-xs">Cancel</button></div>
          </div>
        )}
      </div>
      <p className="text-[11px] text-muted mt-3">Checks run against registries, tax authorities and insurer APIs. Reviews on this page are locked to platform-processed contracts.</p>
    </div>
  );
}
