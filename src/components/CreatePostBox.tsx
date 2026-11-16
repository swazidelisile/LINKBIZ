"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, FileText, Megaphone, Handshake, X, Paperclip, Plus, Repeat, ShoppingCart, CalendarDays } from "lucide-react";
import { Avatar } from "./Avatar";
import { Modal } from "./Modal";
import { TENDER_CATEGORIES, REGIONS, TENDER_TYPES } from "@/lib/format";
import type { NavSession } from "./Navbar";

type Mode = "update" | "tender" | null;

export function CreatePostBox({ session, canPost, canTender }: { session: NonNullable<NavSession>; canPost: boolean; canTender: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // business update state
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"update" | "milestone" | "partnership" | "buy" | "event">("update");
  const [sync, setSync] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);

  // tender state
  const [tender, setTender] = useState({
    title: "", category: TENDER_CATEGORIES[0], type: "open_tender", region: REGIONS[0], budgetMin: "", budgetMax: "", summary: "", scope: "", eligibility: "", deadline: "",
  });
  const [docs, setDocs] = useState<string[]>([]);

  function reset() {
    setMode(null); setContent(""); setImageUrl(""); setAttachments([]); setDocs([]); setError(null); setPostType("update"); setSync([]);
    setTender({ title: "", category: TENDER_CATEGORIES[0], type: "open_tender", region: REGIONS[0], budgetMin: "", budgetMax: "", summary: "", scope: "", eligibility: "", deadline: "" });
  }

  function addFile(setter: (fn: (prev: string[]) => string[]) => void, accept: string) {
    const input = document.createElement("input");
    input.type = "file"; input.accept = accept; input.multiple = true;
    input.onchange = () => { const names = Array.from(input.files ?? []).map((f) => f.name); setter((p) => [...p, ...names]); };
    input.click();
  }
  function pickImage() {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = () => { const f = input.files?.[0]; if (f) setImageUrl(URL.createObjectURL(f)); };
    input.click();
  }

  async function submit() {
    setBusy(true); setError(null);
    const body = mode === "tender"
      ? { kind: "tender", content: content || undefined, tender: { ...tender, documents: docs } }
      : { kind: "post", type: postType, content, imageUrl: imageUrl && !imageUrl.startsWith("blob:") ? imageUrl : imageUrl ? "/covers/default.jpg" : null, attachments, syncedTo: sync };
    const res = await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Something went wrong");
    reset();
    router.refresh();
  }

  return (
    <>
      <div className="card px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <Link href={`/company/${session.company.slug}`}><Avatar name={session.company.name} src={session.company.logoUrl} size={48} /></Link>
          <button
            onClick={() => canPost && setMode("update")}
            disabled={!canPost}
            className="flex-1 h-12 text-left border border-slate-400 px-4 text-sm font-semibold text-muted transition-colors hover:bg-black/[0.08] disabled:opacity-60 disabled:hover:bg-transparent"
            style={{ borderRadius: 35 }}
          >
            Start a post
          </button>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <button onClick={() => canPost && setMode("update")} disabled={!canPost} className="btn-text flex-1 disabled:opacity-50"><ImageIcon size={20} className="text-action" /> <span className="hidden sm:inline">Media</span></button>
          <button onClick={() => { if (canPost) { setPostType("event"); setMode("update"); } }} disabled={!canPost} className="btn-text flex-1 disabled:opacity-50"><CalendarDays size={20} className="text-amber-600" /> <span className="hidden sm:inline">Event</span></button>
          <button onClick={() => { if (canPost) { setPostType("buy"); setMode("update"); } }} disabled={!canPost} className="btn-text flex-1 disabled:opacity-50"><ShoppingCart size={20} className="text-orange-800" /> <span className="hidden sm:inline">Buying need</span></button>
          <button onClick={() => canTender && setMode("tender")} disabled={!canTender} title={canTender ? "" : "Requires Tender Manager or Admin role"} className="btn-text flex-1 disabled:opacity-50"><FileText size={20} className="text-orange-700" /> <span className="hidden sm:inline">Tender notice</span></button>
        </div>
        {!canPost && <p className="text-xs text-muted text-center pb-2">Your role ({session.role}) can view but not publish. Ask an Admin to upgrade your role.</p>}
      </div>

      <Modal open={mode === "update"} onClose={reset} title="Create a Business Update">
        <div className="flex items-center gap-3 mb-3">
          <Avatar name={session.company.name} src={session.company.logoUrl} size={44} />
          <div>
            <div className="font-semibold text-sm">{session.company.name}</div>
            <select value={postType} onChange={(e) => setPostType(e.target.value as typeof postType)} className="text-xs border border-slate-300 rounded-full px-2 py-0.5 mt-0.5">
              <option value="update">Business Update</option>
              <option value="buy">Looking to Buy</option>
              <option value="milestone">Project Milestone</option>
              <option value="partnership">Seeking Partners</option>
              <option value="event">B2B Event</option>
            </select>
          </div>
        </div>
        <textarea autoFocus value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder={postType === "partnership" ? "Describe the partner you're looking for, the opportunity and the region…" : postType === "milestone" ? "Share a project milestone, delivery or achievement…" : "What would you like to share with your network?"} className="w-full text-sm resize-none focus:outline-none" />
        {imageUrl && (
          <div className="relative mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="rounded-lg max-h-56 w-full object-cover" />
            <button onClick={() => setImageUrl("")} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"><X size={14} /></button>
          </div>
        )}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">{attachments.map((a) => <span key={a} className="chip gap-1"><Paperclip size={12} /> {a} <button onClick={() => setAttachments((p) => p.filter((x) => x !== a))}><X size={12} /></button></span>)}</div>
        )}
        <div className="mt-3 rounded-xl border border-line bg-hover/60 p-2.5">
          <div className="text-xs font-semibold text-ink flex items-center gap-1.5"><Repeat size={13} className="text-action" /> Multi-channel sync - post once, publish everywhere</div>
          <div className="mt-1.5 flex flex-wrap gap-3">
            {["LinkedIn", "Facebook", "Google Business"].map((ch) => (
              <label key={ch} className="flex items-center gap-1.5 text-xs text-ink-70 cursor-pointer">
                <input type="checkbox" className="accent-action" checked={sync.includes(ch)} onChange={(e) => setSync((p) => e.target.checked ? [...p, ch] : p.filter((x) => x !== ch))} /> {ch}
              </label>
            ))}
          </div>
          <p className="text-[11px] text-muted mt-1">AI reformats this update for each platform automatically.</p>
        </div>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <div className="flex gap-1">
            <button onClick={pickImage} className="p-2 rounded-full hover:bg-hover text-muted" title="Add photo"><ImageIcon size={20} /></button>
            <button onClick={() => addFile(setAttachments, ".pdf,.doc,.docx,.xlsx")} className="p-2 rounded-full hover:bg-hover text-muted" title="Attach document"><Paperclip size={20} /></button>
            {postType === "partnership" && <span className="flex items-center gap-1 text-xs text-violet-700 px-2"><Handshake size={14} /> Partnership request</span>}
          </div>
          <button onClick={submit} disabled={!content.trim() || busy} className="btn-primary">{busy ? "Posting…" : "Post"}</button>
        </div>
      </Modal>

      <Modal open={mode === "tender"} onClose={reset} title="Publish a Tender Notice" wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><label className="label">Tender title *</label><input className="input" value={tender.title} onChange={(e) => setTender({ ...tender, title: e.target.value })} placeholder="e.g. Supply & Install of HVAC Systems" /></div>
          <div><label className="label">Tender type</label><select className="input" value={tender.type} onChange={(e) => setTender({ ...tender, type: e.target.value })}>{Object.entries(TENDER_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label className="label">Category</label><select className="input" value={tender.category} onChange={(e) => setTender({ ...tender, category: e.target.value })}>{TENDER_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className="label">Region</label><select className="input" value={tender.region} onChange={(e) => setTender({ ...tender, region: e.target.value })}>{REGIONS.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className="label">Submission deadline *</label><input type="date" className="input" min={new Date().toISOString().slice(0, 10)} value={tender.deadline} onChange={(e) => setTender({ ...tender, deadline: e.target.value })} /></div>
          <div><label className="label">Budget min (USD)</label><input type="number" className="input" value={tender.budgetMin} onChange={(e) => setTender({ ...tender, budgetMin: e.target.value })} placeholder="250000" /></div>
          <div><label className="label">Budget max (USD)</label><input type="number" className="input" value={tender.budgetMax} onChange={(e) => setTender({ ...tender, budgetMax: e.target.value })} placeholder="500000" /></div>
          <div className="sm:col-span-2"><label className="label">Short summary</label><input className="input" value={tender.summary} onChange={(e) => setTender({ ...tender, summary: e.target.value })} placeholder="One-line summary shown on tender cards" /></div>
          <div className="sm:col-span-2"><label className="label">Scope of work *</label><textarea rows={4} className="input" value={tender.scope} onChange={(e) => setTender({ ...tender, scope: e.target.value })} placeholder="Describe deliverables, timelines, standards…" /></div>
          <div className="sm:col-span-2"><label className="label">Eligibility requirements (one per line)</label><textarea rows={3} className="input" value={tender.eligibility} onChange={(e) => setTender({ ...tender, eligibility: e.target.value })} placeholder={"ISO 9001 certified\nMinimum 3 comparable projects"} /></div>
          <div className="sm:col-span-2">
            <label className="label">Tender documents (PDF)</label>
            <div className="flex flex-wrap gap-2 items-center">
              {docs.map((d) => <span key={d} className="chip gap-1"><FileText size={12} /> {d} <button onClick={() => setDocs((p) => p.filter((x) => x !== d))}><X size={12} /></button></span>)}
              <button onClick={() => addFile(setDocs, ".pdf")} className="btn-ghost !py-1 !text-xs"><Plus size={12} /> Upload PDF</button>
            </div>
          </div>
          <div className="sm:col-span-2"><label className="label">Feed announcement (optional)</label><input className="input" value={content} onChange={(e) => setContent(e.target.value)} placeholder="📋 Tender Notice: we invite qualified suppliers to…" /></div>
        </div>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        <div className="mt-4 flex justify-end gap-2 border-t border-line pt-3">
          <button onClick={reset} className="btn-ghost">Cancel</button>
          <button onClick={submit} disabled={busy || !tender.title || !tender.scope || !tender.deadline} className="btn-primary"><Megaphone size={14} /> {busy ? "Publishing…" : "Publish Tender"}</button>
        </div>
      </Modal>
    </>
  );
}
