"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, Shield, FileText, PenLine } from "lucide-react";
import { Avatar } from "./Avatar";
import { ROLE_LABELS } from "@/lib/format";

type Member = { id: number; role: string; email: string; fullName: string; userId: number };
const ROLE_INFO = [
  { key: "admin", icon: Shield, desc: "Full control: edit page, manage team, publish posts & tenders, review bids." },
  { key: "tender_manager", icon: FileText, desc: "Publish and manage tenders, review bids, post updates, handle deal rooms." },
  { key: "content_editor", icon: PenLine, desc: "Publish business updates, milestones and partnership requests." },
];

export function TeamManager({ members, isAdmin, myUserId }: { members: Member[]; isAdmin: boolean; myUserId: number }) {
  const router = useRouter();
  const [f, setF] = useState({ fullName: "", email: "", role: "content_editor", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function invite(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    const res = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) return setError(d.error);
    setF({ fullName: "", email: "", role: "content_editor", password: "" });
    router.refresh();
  }
  async function remove(id: number) {
    await fetch("/api/members", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  }

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-3 items-start">
      <div className="card p-5">
        <h2 className="font-semibold">Team members ({members.length})</h2>
        <div className="divide-y divide-line mt-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-3">
              <Avatar name={m.fullName} size={40} rounded="rounded-full" />
              <div className="flex-1 min-w-0"><div className="font-semibold text-sm">{m.fullName} {m.userId === myUserId && <span className="text-xs text-muted">(you)</span>}</div><div className="text-xs text-muted">{m.email}</div></div>
              <span className="chip">{ROLE_LABELS[m.role]}</span>
              {isAdmin && m.userId !== myUserId && <button onClick={() => remove(m.id)} className="p-1.5 text-muted hover:text-red-600"><Trash2 size={16} /></button>}
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-line pt-4">
          <h3 className="font-semibold text-sm">Roles explained</h3>
          <div className="mt-2 grid sm:grid-cols-3 gap-2">
            {ROLE_INFO.map((r) => <div key={r.key} className="rounded-xl bg-hover p-3"><div className="flex items-center gap-1.5 font-semibold text-sm"><r.icon size={14} className="text-action" /> {ROLE_LABELS[r.key]}</div><p className="text-xs text-muted mt-1">{r.desc}</p></div>)}
          </div>
        </div>
      </div>
      <form onSubmit={invite} className="card p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><UserPlus size={18} /> Invite team member</h2>
        {!isAdmin && <p className="text-xs text-amber-700 bg-amber-50 rounded p-2">Only Admins can invite or change roles.</p>}
        <div><label className="label">Full name</label><input className="input" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} disabled={!isAdmin} required /></div>
        <div><label className="label">Work email</label><input type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} disabled={!isAdmin} required /></div>
        <div><label className="label">Role</label><select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} disabled={!isAdmin}>{Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label className="label">Temporary password</label><input className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="welcome123" disabled={!isAdmin} /></div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={!isAdmin || busy}>{busy ? "Adding…" : "Add to company"}</button>
      </form>
    </div>
  );
}
