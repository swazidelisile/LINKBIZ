"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Upload, PenLine, CheckCircle2, Circle, Landmark, Sparkles, Plus, ArrowRightLeft, AlertTriangle, Info, ShieldCheck } from "lucide-react";

type Room = {
  isDealRoom: boolean; ndaStatus: string;
  milestones: { title: string; amount: number; done: boolean }[];
  documents: { name: string; size: string; by: number; at: string }[];
  escrowAmount: number; escrowStatus: string;
};
type Copilot = { flags: { level: string; text: string }[]; marketNote: string; counterOffer: string };

export function DealRoomPanel({ conversationId, me, otherName, onChanged }: { conversationId: number; me: number; otherName: string; onChanged: () => void }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [copilot, setCopilot] = useState<Copilot | null>(null);
  const [copilotBusy, setCopilotBusy] = useState(false);
  const [escrowInput, setEscrowInput] = useState("");
  const [msTitle, setMsTitle] = useState("");
  const [msAmount, setMsAmount] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/conversations/${conversationId}/dealroom`);
    if (r.ok) setRoom(await r.json());
  }, [conversationId]);
  useEffect(() => { setRoom(null); setCopilot(null); load(); }, [load]);

  async function act(body: Record<string, unknown>) {
    await fetch(`/api/conversations/${conversationId}/dealroom`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await load();
    onChanged();
  }
  function uploadDoc() {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".pdf,.doc,.docx,.xlsx,.zip";
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) act({ action: "doc", name: f.name, size: `${(f.size / 1024 / 1024).toFixed(1)} MB` });
    };
    input.click();
  }
  async function runCopilot() {
    setCopilotBusy(true);
    const r = await fetch(`/api/conversations/${conversationId}/copilot`);
    if (r.ok) setCopilot(await r.json());
    setCopilotBusy(false);
  }

  if (!room) return <div className="p-4 space-y-3"><div className="skeleton h-5 w-32" /><div className="skeleton h-20 w-full" /><div className="skeleton h-20 w-full" /></div>;

  if (!room.isDealRoom) {
    return (
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-base flex items-center gap-2"><ArrowRightLeft size={16} className="text-action" /> Deal Room</h3>
        <p className="text-sm text-muted">Convert this thread into a structured workspace: shared document folder, NDA e-signatures, milestone tracker and escrow-backed payouts.</p>
        <button onClick={() => act({ action: "convert" })} className="btn-primary w-full">Convert to Deal Room</button>
        <button onClick={runCopilot} disabled={copilotBusy} className="btn-outline w-full"><Sparkles size={14} /> {copilotBusy ? "Analysing thread..." : "AI Contract Copilot"}</button>
        {copilot && <CopilotView c={copilot} />}
      </div>
    );
  }

  const doneCount = room.milestones.filter((m) => m.done).length;
  const totalValue = room.milestones.reduce((a, m) => a + m.amount, 0);

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base flex items-center gap-2"><ArrowRightLeft size={16} className="text-action" /> Deal Room</h3>
        <span className="chip">{doneCount}/{room.milestones.length} milestones</span>
      </div>

      {/* NDA */}
      <section className="rounded-xl border border-line p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold flex items-center gap-1.5"><PenLine size={14} className="text-action" /> Mutual NDA</div>
          <span className={`text-xs font-semibold ${room.ndaStatus === "signed" ? "text-emerald-700" : room.ndaStatus === "sent" ? "text-amber-600" : "text-muted"}`}>
            {room.ndaStatus === "signed" ? "Signed by both" : room.ndaStatus === "sent" ? "Awaiting signatures" : "Not started"}
          </span>
        </div>
        {room.ndaStatus !== "signed" && (
          <button onClick={() => act({ action: "nda" })} className="btn-outline w-full mt-2 !py-1 !text-xs">
            {room.ndaStatus === "none" ? "Send NDA for e-signature" : `E-sign as your company`}
          </button>
        )}
        {room.ndaStatus === "signed" && <p className="text-xs text-muted mt-1.5 flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-600" /> Documents can now be exchanged safely.</p>}
      </section>

      {/* Documents */}
      <section className="rounded-xl border border-line p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold flex items-center gap-1.5"><FileText size={14} className="text-action" /> Shared folder</div>
          <button onClick={uploadDoc} className="text-xs font-semibold text-action inline-flex items-center gap-1 hover:underline"><Upload size={12} /> Upload</button>
        </div>
        <ul className="mt-2 space-y-1.5">
          {room.documents.length === 0 && <li className="text-xs text-muted">Quotes, NDAs and capability statements shared here.</li>}
          {room.documents.map((d, i) => (
            <li key={i} className="flex items-center gap-2 text-xs">
              <FileText size={14} className="text-muted shrink-0" />
              <span className="truncate flex-1 text-ink">{d.name}</span>
              <span className="text-muted shrink-0">{d.by === me ? "You" : otherName.split(" ")[0]} · {d.size}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Milestones */}
      <section className="rounded-xl border border-line p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Milestones</div>
          <span className="text-xs text-muted">${totalValue.toLocaleString()} total</span>
        </div>
        <ul className="mt-2 space-y-1.5">
          {room.milestones.map((m, i) => (
            <li key={i}>
              <button onClick={() => act({ action: "milestone", index: i })} className="w-full flex items-center gap-2 text-xs text-left row-hover rounded px-1 py-1">
                {m.done ? <CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> : <Circle size={15} className="text-muted shrink-0" />}
                <span className={`flex-1 ${m.done ? "line-through text-muted" : "text-ink"}`}>{m.title}</span>
                <span className="text-muted shrink-0">${m.amount.toLocaleString()}</span>
              </button>
            </li>
          ))}
        </ul>
        {adding ? (
          <div className="mt-2 space-y-1.5">
            <input className="input !py-1 !text-xs" placeholder="Milestone title" value={msTitle} onChange={(e) => setMsTitle(e.target.value)} />
            <input className="input !py-1 !text-xs" placeholder="Amount (USD)" type="number" value={msAmount} onChange={(e) => setMsAmount(e.target.value)} />
            <div className="flex gap-1.5">
              <button onClick={async () => { await act({ action: "addMilestone", title: msTitle, amount: msAmount }); setAdding(false); setMsTitle(""); setMsAmount(""); }} disabled={!msTitle} className="btn-primary !py-0.5 !text-xs">Add</button>
              <button onClick={() => setAdding(false)} className="btn-ghost !py-0.5 !text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="mt-2 text-xs font-semibold text-action inline-flex items-center gap-1 hover:underline"><Plus size={12} /> Add milestone</button>
        )}
      </section>

      {/* Escrow */}
      <section className="rounded-xl border border-line p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold flex items-center gap-1.5"><Landmark size={14} className="text-action" /> Invoice Escrow</div>
          <span className={`text-xs font-semibold ${room.escrowStatus === "released" ? "text-emerald-700" : room.escrowStatus === "funded" ? "text-action" : "text-muted"}`}>
            {room.escrowStatus === "released" ? "Released" : room.escrowStatus === "funded" ? "Funds held" : "Not funded"}
          </span>
        </div>
        {room.escrowStatus === "none" && (
          <div className="mt-2 flex gap-1.5">
            <input className="input !py-1 !text-xs" type="number" placeholder="Amount USD" value={escrowInput} onChange={(e) => setEscrowInput(e.target.value)} />
            <button onClick={() => act({ action: "escrow", op: "fund", amount: escrowInput })} disabled={!escrowInput} className="btn-primary !py-1 !text-xs shrink-0">Fund</button>
          </div>
        )}
        {room.escrowStatus === "funded" && (
          <>
            <p className="text-xs text-muted mt-1.5">${room.escrowAmount.toLocaleString()} held by LinkBiz. Release when the milestone is verified.</p>
            <button onClick={() => act({ action: "escrow", op: "release" })} className="btn-primary w-full mt-2 !py-1 !text-xs">Release payout</button>
          </>
        )}
        {room.escrowStatus === "released" && <p className="text-xs text-muted mt-1.5">${room.escrowAmount.toLocaleString()} paid out. Both parties can now leave a transaction-verified review.</p>}
      </section>

      {/* AI copilot */}
      <section>
        <button onClick={runCopilot} disabled={copilotBusy} className="btn-outline w-full"><Sparkles size={14} /> {copilotBusy ? "Reviewing terms..." : "AI Negotiation Copilot"}</button>
        {copilot && <div className="mt-2"><CopilotView c={copilot} /></div>}
      </section>
    </div>
  );
}

function CopilotView({ c }: { c: Copilot }) {
  return (
    <div className="rounded-xl border border-action/15 bg-tint p-3 space-y-2">
      <div className="text-xs font-bold uppercase tracking-wide text-action flex items-center gap-1"><Sparkles size={12} /> Copilot analysis</div>
      <ul className="space-y-1.5">
        {c.flags.map((f, i) => (
          <li key={i} className="flex gap-1.5 text-xs text-ink">
            {f.level === "warn" ? <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" /> : f.level === "ok" ? <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" /> : <Info size={13} className="text-muted shrink-0 mt-0.5" />}
            {f.text}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">{c.marketNote}</p>
      <div className="rounded bg-white border border-line p-2 text-xs text-ink"><b className="text-action">Counter-offer:</b> {c.counterOffer}</div>
    </div>
  );
}
