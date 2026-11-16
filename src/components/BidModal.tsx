"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, FileText, X, Upload, CheckCircle2, Building2, Award, MessageSquare } from "lucide-react";
import { Modal } from "./Modal";
import type { TenderWithCompany } from "@/lib/data";
import Link from "next/link";

export function BidModal({ tender, loggedIn, isOwner, alreadyBid, companyName }: { tender: TenderWithCompany; loggedIn: boolean; isOwner: boolean; alreadyBid: boolean; companyName?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"bid" | "eoi">("bid");
  const [amount, setAmount] = useState("");
  const [cover, setCover] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includePortfolio, setIncludePortfolio] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ conversationId: number } | null>(null);
  const [submitted, setSubmitted] = useState(alreadyBid);
  const closed = new Date(tender.deadline) < new Date();

  useEffect(() => { if (sp.get("bid") === "1" && loggedIn && !isOwner && !closed) setOpen(true); }, [sp, loggedIn, isOwner, closed]);

  function openModal() {
    if (!loggedIn) return router.push("/login");
    setOpen(true);
  }
  function addFiles() {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".pdf"; input.multiple = true;
    input.onchange = () => setFiles((p) => [...p, ...Array.from(input.files ?? []).map((f) => f.name)]);
    input.click();
  }
  async function submit() {
    setBusy(true); setError(null);
    const res = await fetch(`/api/tenders/${tender.id}/bids`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, amount: amount || null, coverLetter: cover, attachments: files, includeProfile, includePortfolio }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error);
    setDone({ conversationId: data.conversationId });
    setSubmitted(true);
    router.refresh();
  }
  async function inquire() {
    if (!loggedIn) return router.push("/login");
    const res = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companyId: tender.companyId, kind: "tender", tenderId: tender.id, subject: `Inquiry: ${tender.title}` }) });
    const data = await res.json();
    router.push(`/messages?c=${data.conversationId}`);
  }

  if (isOwner) {
    return <div className="rounded-xl bg-hover border p-3 text-sm text-muted">You issued this tender. Bids and inquiries appear in your <Link href="/messages" className="text-action font-semibold hover:underline">Deal Room</Link>.</div>;
  }

  return (
    <>
      <div className="space-y-2">
        <button onClick={openModal} disabled={closed || submitted} className="btn-primary w-full !py-2.5">
          {submitted ? <><CheckCircle2 size={16} /> Submission received</> : closed ? "Tender closed" : <><Send size={16} /> Submit Bid / Expression of Interest</>}
        </button>
        <button onClick={inquire} className="btn-outline w-full"><MessageSquare size={16} /> Ask a question (Deal Room)</button>
      </div>

      <Modal open={open} onClose={() => { setOpen(false); if (done) router.replace(`/tenders/${tender.id}`); }} title={done ? "Submission received" : "Submit Bid / Expression of Interest"} wide>
        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 size={56} className="mx-auto text-emerald-600" />
            <h3 className="text-lg font-semibold mt-3">Your {type === "eoi" ? "Expression of Interest" : "bid"} has been sent to {tender.company.name}</h3>
            <p className="text-sm text-muted mt-1">A Tender Discussion room has been opened so you can exchange clarifications, NDAs and revised quotes.</p>
            <div className="flex justify-center gap-2 mt-5">
              <Link href={`/messages?c=${done.conversationId}`} className="btn-primary">Open Deal Room</Link>
              <button onClick={() => { setOpen(false); router.replace(`/tenders/${tender.id}`); }} className="btn-ghost">Done</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-hover border p-3 text-sm"><span className="text-muted">Submitting to</span> <b>{tender.company.name}</b> <span className="text-muted">for</span> <b>{tender.title}</b></div>
            <div className="grid grid-cols-2 gap-2">
              {([["bid", "Full Bid / Proposal"], ["eoi", "Expression of Interest"]] as const).map(([k, v]) => (
                <button key={k} onClick={() => setType(k)} className={`rounded-xl border p-3 text-sm font-semibold text-left ${type === k ? "border-action bg-tint text-action" : "border-line text-ink-70"}`}>{v}</button>
              ))}
            </div>
            {type === "bid" && (
              <div><label className="label">Proposed amount ({tender.currency})</label><input type="number" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Budget guide: ${tender.budgetMin.toLocaleString()} – ${tender.budgetMax.toLocaleString()}`} /></div>
            )}
            <div><label className="label">{type === "bid" ? "Proposal summary / cover letter *" : "Why you're interested & relevant experience *"}</label>
              <textarea rows={5} className="input" value={cover} onChange={(e) => setCover(e.target.value)} placeholder={`Dear ${tender.company.name} procurement team, ${companyName ?? "we"} would like to…`} /></div>
            <div>
              <label className="label">Attach to submission</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 rounded-xl border p-3 text-sm cursor-pointer hover:bg-hover"><input type="checkbox" checked={includeProfile} onChange={(e) => setIncludeProfile(e.target.checked)} className="accent-action" /><Building2 size={18} className="text-muted" /><div><b>Company Profile</b><div className="text-xs text-muted">Registration, certifications, executives</div></div></label>
                <label className="flex items-center gap-3 rounded-xl border p-3 text-sm cursor-pointer hover:bg-hover"><input type="checkbox" checked={includePortfolio} onChange={(e) => setIncludePortfolio(e.target.checked)} className="accent-action" /><Award size={18} className="text-muted" /><div><b>Achievements & Portfolio</b><div className="text-xs text-muted">Completed projects, awards, case studies</div></div></label>
                <div className="rounded-xl border border-dashed p-3">
                  <div className="flex items-center justify-between"><div className="text-sm flex items-center gap-2"><FileText size={18} className="text-muted" /><b>Proposal PDF</b></div><button onClick={addFiles} className="btn-ghost !py-1 !text-xs"><Upload size={12} /> Upload</button></div>
                  {files.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{files.map((f) => <span key={f} className="chip gap-1">{f} <button onClick={() => setFiles((p) => p.filter((x) => x !== f))}><X size={12} /></button></span>)}</div>}
                </div>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 border-t border-line pt-3">
              <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
              <button onClick={submit} disabled={busy || !cover.trim()} className="btn-primary"><Send size={14} /> {busy ? "Submitting…" : type === "bid" ? "Submit Bid" : "Send EOI"}</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
