"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Send, Paperclip, FileText, ArrowLeft, Briefcase, Inbox, Search, PanelRight, X } from "lucide-react";
import { DealRoomPanel } from "./DealRoomPanel";
import { Avatar } from "./Avatar";
import { VerifiedBadge } from "./VerifiedBadge";
import { timeAgo } from "@/lib/format";
import type { CompanyLite } from "@/lib/data";

type Msg = { id: number; conversationId: number; senderCompanyId: number; content: string; attachment: { name: string; size: string } | null; createdAt: string };
type Conv = { id: number; kind: string; tenderId: number | null; subject: string | null; updatedAt: string; other: CompanyLite; lastMessage: Msg | null };

export function Messenger({ initial, me, initialActive }: { initial: Conv[]; me: number; initialActive?: number }) {
  const [convs, setConvs] = useState(initial);
  const [filter, setFilter] = useState<"all" | "general" | "tender">("all");
  const [q, setQ] = useState("");
  const [active, setActive] = useState<number | undefined>(initialActive);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState<{ name: string; size: string } | null>(null);
  const [mobileList, setMobileList] = useState(!initialActive);
  const [panel, setPanel] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const loadMsgs = useCallback(async (id: number) => {
    const r = await fetch(`/api/conversations/${id}/messages`);
    if (r.ok) setMsgs(await r.json());
  }, []);
  const loadConvs = useCallback(async () => {
    const r = await fetch("/api/conversations");
    if (r.ok) setConvs(await r.json());
  }, []);

  useEffect(() => { if (active) loadMsgs(active); }, [active, loadMsgs]);
  // Realtime-ish: poll every 3 seconds
  useEffect(() => {
    const i = setInterval(() => { if (active) loadMsgs(active); loadConvs(); }, 3000);
    return () => clearInterval(i);
  }, [active, loadMsgs, loadConvs]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!active || (!text.trim() && !file)) return;
    const body = { content: text, attachment: file };
    setText(""); setFile(null);
    const optimistic: Msg = { id: Date.now(), conversationId: active, senderCompanyId: me, content: body.content || "Shared a file", attachment: body.attachment, createdAt: new Date().toISOString() };
    setMsgs((m) => [...m, optimistic]);
    await fetch(`/api/conversations/${active}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    loadMsgs(active); loadConvs();
  }
  function attach() {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".pdf,.doc,.docx,.xlsx,.zip";
    input.onchange = () => { const f = input.files?.[0]; if (f) setFile({ name: f.name, size: `${(f.size / 1024 / 1024).toFixed(1)} MB` }); };
    input.click();
  }

  const visible = convs.filter((c) => (filter === "all" || c.kind === filter) && (!q || c.other.name.toLowerCase().includes(q.toLowerCase()) || c.subject?.toLowerCase().includes(q.toLowerCase())));
  const conv = convs.find((c) => c.id === active);

  return (
    <div className={`card overflow-hidden grid grid-cols-1 ${panel ? "md:grid-cols-[280px_minmax(0,1fr)_320px]" : "md:grid-cols-[320px_1fr]"} h-[calc(100vh-9rem)] md:h-[calc(100vh-7.5rem)]`}>
      <aside className={`border-r border-line flex flex-col min-h-0 ${mobileList ? "" : "hidden md:flex"}`}>
        <div className="p-3 border-b border-line space-y-2">
          <h1 className="font-semibold">Messaging & Deal Room</h1>
          <div className="relative"><Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations" className="input !pl-8 !py-1.5 !bg-hover" /></div>
          <div className="flex gap-1">
            {([["all", "All", Inbox], ["general", "General Inquiries", Inbox], ["tender", "Tender Discussions", Briefcase]] as const).map(([k, l, I]) => (
              <button key={k} onClick={() => setFilter(k)} className={`flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 border ${filter === k ? "bg-brand text-white border-action" : "border-slate-300 text-muted hover:bg-hover"}`}><I size={12} /> {l}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-line">
          {visible.length === 0 && <p className="p-6 text-sm text-muted text-center">No conversations yet.</p>}
          {visible.map((c) => (
            <button key={c.id} onClick={() => { setActive(c.id); setMobileList(false); }} className={`w-full text-left p-3 flex gap-3 hover:bg-hover ${active === c.id ? "bg-tint" : ""}`}>
              <Avatar name={c.other.name} src={c.other.logoUrl} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2"><span className="font-semibold text-sm truncate">{c.other.name}</span><span className="text-[10px] text-muted shrink-0">{c.lastMessage ? timeAgo(c.lastMessage.createdAt) : ""}</span></div>
                <div className="text-xs font-medium text-ink-70 truncate flex items-center gap-1">{c.kind === "tender" && <Briefcase size={11} className="text-action" />}{c.subject}</div>
                <div className="text-xs text-muted truncate">{c.lastMessage?.senderCompanyId === me ? "You: " : ""}{c.lastMessage?.content ?? "No messages yet"}</div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className={`flex flex-col min-h-0 ${mobileList ? "hidden md:flex" : ""}`}>
        {conv ? (
          <>
            <div className="p-3 border-b border-line flex items-center gap-3">
              <button onClick={() => setMobileList(true)} className="md:hidden p-1"><ArrowLeft size={18} /></button>
              <Link href={`/company/${conv.other.slug}`}><Avatar name={conv.other.name} src={conv.other.logoUrl} size={40} /></Link>
              <div className="min-w-0 flex-1">
                <Link href={`/company/${conv.other.slug}`} className="font-semibold text-sm hover:underline flex items-center gap-1">{conv.other.name} {conv.other.verified && <VerifiedBadge size={13} />}</Link>
                <div className="text-xs text-muted truncate flex items-center gap-1">{conv.kind === "tender" ? <><Briefcase size={11} className="text-action" /> Tender discussion · </> : "General inquiry · "}{conv.subject}{conv.tenderId && <Link href={`/tenders/${conv.tenderId}`} className="text-action hover:underline ml-1">View tender</Link>}</div>
              </div>
              <button onClick={() => setPanel((p) => !p)} title="Deal Room" className={`p-2 rounded-full row-hover shrink-0 ${panel ? "text-action bg-tint" : "text-muted"}`}><PanelRight size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-hover/60">
              {msgs.map((m) => {
                const mine = m.senderCompanyId === me;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${mine ? "btn-message-me text-white rounded-br-md" : "bg-white/85 border border-line rounded-bl-md"}`}>
                      <p className="whitespace-pre-line leading-relaxed">{m.content}</p>
                      {m.attachment && (
                        <div className={`mt-2 flex items-center gap-2 rounded-lg px-2.5 py-2 ${mine ? "bg-white/15" : "bg-hover"}`}>
                          <FileText size={18} /><div className="min-w-0"><div className="text-xs font-semibold truncate">{m.attachment.name}</div><div className={`text-[10px] ${mine ? "text-white/70" : "text-muted"}`}>{m.attachment.size}</div></div>
                        </div>
                      )}
                      <div className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-muted"}`}>{new Date(m.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottom} />
            </div>
            <form onSubmit={send} className="p-3 border-t border-line">
              {file && <div className="mb-2 chip gap-1"><FileText size={12} /> {file.name} · {file.size} <button type="button" onClick={() => setFile(null)} className="ml-1 font-semibold">×</button></div>}
              <div className="flex items-end gap-2">
                <button type="button" onClick={attach} title="Share quote, NDA or capability statement" className="p-2 rounded-full hover:bg-hover text-muted"><Paperclip size={20} /></button>
                <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} placeholder="Write a message…" className="input flex-1 resize-none !rounded-2xl" />
                <button className="btn-primary !rounded-full !p-2.5" disabled={!text.trim() && !file}><Send size={18} /></button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted text-sm p-8 text-center"><Inbox size={40} className="mb-2 text-line" />Select a conversation, or start one from a company page or tender.</div>
        )}
      </section>

      {panel && conv && (
        <aside className="border-l border-line bg-white overflow-y-auto hidden md:block">
          <div className="flex items-center justify-between px-4 pt-3">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">Workspace</span>
            <button onClick={() => setPanel(false)} className="p-1 rounded-full row-hover text-muted"><X size={16} /></button>
          </div>
          <DealRoomPanel conversationId={conv.id} me={me} otherName={conv.other.name} onChanged={() => { loadConvs(); loadMsgs(conv.id); }} />
        </aside>
      )}
      {panel && conv && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setPanel(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-[88%] max-w-sm bg-white overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 pt-3">
              <span className="text-xs font-bold uppercase tracking-wide text-muted">Workspace</span>
              <button onClick={() => setPanel(false)} className="p-1 rounded-full row-hover text-muted"><X size={16} /></button>
            </div>
            <DealRoomPanel conversationId={conv.id} me={me} otherName={conv.other.name} onChanged={() => { loadConvs(); loadMsgs(conv.id); }} />
          </div>
        </div>
      )}
    </div>
  );
}
