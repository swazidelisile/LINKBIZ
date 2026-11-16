"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, PartyPopper, Eye, HeartHandshake, MessageSquareText, Repeat2, Send, Paperclip, Clock, Wallet, MapPin, Globe, MoreHorizontal, Bookmark, Link2, EyeOff, Flag, Megaphone, CheckCircle2 } from "lucide-react";
import { Modal } from "./Modal";
import type { CompanyLite } from "@/lib/data";
import { Avatar } from "./Avatar";
import { VerifiedBadge } from "./VerifiedBadge";
import { timeAgo, POST_TYPES, money, daysLeft, TENDER_TYPES } from "@/lib/format";
import type { FeedPost } from "@/lib/data";

const REACTIONS = [
  { key: "endorse", label: "Endorse", icon: ThumbsUp, color: "text-action", bg: "bg-action" },
  { key: "celebrate", label: "Celebrate", icon: PartyPopper, color: "text-emerald-700", bg: "bg-emerald-600" },
  { key: "interested", label: "Interested", icon: Eye, color: "text-amber-700", bg: "bg-amber-500" },
  { key: "support", label: "Support", icon: HeartHandshake, color: "text-rose-700", bg: "bg-rose-600" },
];

const typeStyle: Record<string, string> = {
  update: "text-muted",
  tender: "text-action",
  milestone: "text-emerald-700",
  partnership: "text-violet-700",
  buy: "text-action",
  event: "text-amber-700",
  benchmark: "text-emerald-700",
};

const CLAMP = 210;

export function PostCard({ post, loggedIn }: { post: FeedPost; loggedIn: boolean }) {
  const router = useRouter();
  const [myReaction, setMyReaction] = useState(post.myReaction);
  const [counts, setCounts] = useState(post.reactionCounts);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments);
  const [comment, setComment] = useState("");
  const [picker, setPicker] = useState(false);
  const [menu, setMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [recOpen, setRecOpen] = useState(false);
  const [recList, setRecList] = useState<CompanyLite[]>([]);
  const [recTarget, setRecTarget] = useState<number | null>(null);
  const [recNote, setRecNote] = useState("");
  const [recDone, setRecDone] = useState(false);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const long = post.content.length > CLAMP;
  const body = long && !expanded ? post.content.slice(0, CLAMP).trimEnd() : post.content;

  async function react(type: string) {
    if (!loggedIn) return router.push("/login");
    setPicker(false);
    const next = { ...counts };
    if (myReaction) next[myReaction] = Math.max(0, (next[myReaction] ?? 1) - 1);
    const newReaction = myReaction === type ? null : type;
    if (newReaction) next[newReaction] = (next[newReaction] ?? 0) + 1;
    setMyReaction(newReaction);
    setCounts(next);
    await fetch(`/api/posts/${post.id}/react`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) });
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!loggedIn) return router.push("/login");
    if (!comment.trim()) return;
    const res = await fetch(`/api/posts/${post.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: comment }) });
    const data = await res.json();
    if (data.comment) setComments((c) => [...c, data.comment]);
    setComment("");
  }

  async function repost() {
    if (!loggedIn) return router.push("/login");
    setReposted(true);
    await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "update", content: `Reposted from ${post.company.name}:\n\n${post.content}`, repostOfId: post.id, imageUrl: post.imageUrl }) });
    router.refresh();
  }

  async function openRecommend() {
    if (!loggedIn) return router.push("/login");
    setMenu(false); setRecOpen(true); setRecDone(false);
    if (!recList.length) {
      const r = await fetch("/api/companies");
      setRecList(await r.json());
    }
  }
  async function sendRecommend() {
    if (!recTarget) return;
    const res = await fetch("/api/referrals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companyId: recTarget, note: recNote, postId: post.id, buyerCompanyId: post.companyId }) });
    if (res.ok) {
      setRecDone(true);
      const target = recList.find((c) => c.id === recTarget);
      if (target) setComments((c) => [...c, { id: Date.now(), content: `We recommend ${target.name} for this. Tracked referral.`, createdAt: new Date(), company: target }]);
      setShowComments(true);
    }
  }

  const active = REACTIONS.find((r) => r.key === myReaction);
  const present = REACTIONS.filter((r) => counts[r.key]);
  const t = post.tender;

  return (
    <article className="card">
      {/* Author header */}
      <div className="px-4 pt-3 pb-2 flex items-start gap-2">
        <Link href={`/company/${post.company.slug}`}><Avatar name={post.company.name} src={post.company.logoUrl} size={48} rounded="rounded-xl" /></Link>
        <div className="min-w-0 flex-1 leading-tight">
          <Link href={`/company/${post.company.slug}`} className="font-semibold text-sm text-ink hover:text-action hover:underline inline-flex items-center gap-1">
            {post.company.name}
            {post.company.verified && <VerifiedBadge size={14} />}
            <span className="text-xs font-normal text-muted">· Following</span>
          </Link>
          <div className="text-xs text-muted truncate">{post.company.tagline}</div>
          <div className="text-xs text-muted flex items-center gap-1">{timeAgo(post.createdAt)} · <Globe size={12} /> <span className={`font-medium ${typeStyle[post.type]}`}>· {POST_TYPES[post.type]}</span></div>
        </div>
        <div className="relative shrink-0 -mr-2 -mt-1">
          <button onClick={() => setMenu((m) => !m)} className="p-1.5 rounded-full text-muted row-hover" aria-label="More options"><MoreHorizontal size={20} /></button>
          {menu && (
            <div className="absolute right-0 top-9 z-10 card w-64 py-1 shadow-[0_4px_12px_rgba(0,0,0,0.15)]" onMouseLeave={() => setMenu(false)}>
              <button onClick={() => { setSaved((s) => !s); setMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted row-hover hover:text-ink text-left"><Bookmark size={18} className={saved ? "fill-ink text-ink" : ""} /><span><b className="block text-ink">{saved ? "Unsave" : "Save"}</b><span className="text-xs">Save for later</span></span></button>
              <button onClick={() => { navigator.clipboard?.writeText(`${location.origin}/company/${post.company.slug}?tab=posts`); setMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted row-hover hover:text-ink text-left"><Link2 size={18} /><b className="text-ink">Copy link to post</b></button>
              <button onClick={openRecommend} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted row-hover hover:text-ink text-left"><Megaphone size={18} /><span><b className="block text-ink">Recommend a business</b><span className="text-xs">Tracked referral with commission</span></span></button>
              <button onClick={() => setMenu(false)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted row-hover hover:text-ink text-left"><EyeOff size={18} /><b className="text-ink">Not interested</b></button>
              <button onClick={() => setMenu(false)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted row-hover hover:text-ink text-left"><Flag size={18} /><b className="text-ink">Report post</b></button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-2 text-sm text-ink whitespace-pre-line leading-[1.4]">
        {body}
        {long && !expanded && <>… <button onClick={() => setExpanded(true)} className="text-muted font-medium hover:text-action hover:underline">see more</button></>}
      </div>
      {post.syncedTo.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <Repeat2 size={12} className="text-action" /> Auto-synced to
          {post.syncedTo.map((ch) => <span key={ch} className="chip gap-1"><CheckCircle2 size={11} className="text-emerald-600" /> {ch}</span>)}
        </div>
      )}
      {post.attachments.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {post.attachments.map((a) => <span key={a} className="chip gap-1"><Paperclip size={12} /> {a}</span>)}
        </div>
      )}

      {/* Full-bleed media */}
      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt="" className="w-full max-h-[420px] object-cover block" />
      )}

      {/* Tender attachment */}
      {t && (
        <div className="mx-4 my-2 rounded-lg border border-line bg-hover/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-action">{TENDER_TYPES[t.type]}</span>
            <span className={`text-xs font-semibold flex items-center gap-1 ${daysLeft(t.deadline) <= 10 ? "text-red-700" : "text-muted"}`}><Clock size={12} /> Closes in {daysLeft(t.deadline)} days</span>
          </div>
          <Link href={`/tenders/${t.id}`} className="block font-semibold text-ink mt-1 hover:underline leading-snug">{t.title}</Link>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1"><Wallet size={12} /> {money(t.budgetMin, t.currency)} – {money(t.budgetMax, t.currency)}</span>
            <span className="flex items-center gap-1"><MapPin size={12} /> {t.region}</span>
            <span>{t.category}</span>
          </div>
          <div className="mt-2.5 flex gap-2">
            <Link href={`/tenders/${t.id}?bid=1`} className="btn-primary !py-1 !min-h-7 !text-xs"><Send size={12} /> Send Proposal / Inquire</Link>
            <Link href={`/tenders/${t.id}`} className="btn-ghost !py-1 !min-h-7 !text-xs">View details</Link>
          </div>
        </div>
      )}

      {/* Reaction counter bar */}
      {(total > 0 || comments.length > 0) && (
        <div className="px-4 py-2 flex items-center justify-between text-xs text-muted">
          <button className="flex items-center gap-1 hover:text-action hover:underline">
            <span className="flex -space-x-1">
              {present.map((r) => (
                <span key={r.key} className={`h-4 w-4 rounded-full ${r.bg} ring-2 ring-white flex items-center justify-center text-white`}><r.icon size={9} strokeWidth={2.5} /></span>
              ))}
            </span>
            {total > 0 && <span className="ml-1">{total}</span>}
          </button>
          <div className="flex items-center gap-2">
            {comments.length > 0 && <button onClick={() => setShowComments((s) => !s)} className="hover:text-action hover:underline">{comments.length} comment{comments.length === 1 ? "" : "s"}</button>}
            {comments.length > 0 && reposted && <span>·</span>}
            {reposted && <span>1 repost</span>}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="mx-4 hairline" />
      <div className="px-2 py-1 grid grid-cols-4 gap-1">
        <div className="relative" onMouseLeave={() => setPicker(false)}>
          <button onMouseEnter={() => setPicker(true)} onClick={() => (active ? react(active.key) : react("endorse"))} className={`btn-text w-full ${active ? active.color : ""}`}>
            {active ? <active.icon size={20} className={active.key === "endorse" ? "fill-current" : ""} /> : <ThumbsUp size={20} />}
            <span className="hidden sm:inline">{active ? active.label : "Endorse"}</span>
          </button>
          {picker && (
            <div className="absolute bottom-full left-0 mb-1 card flex gap-1 p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.15)] z-10 rounded-full">
              {REACTIONS.map((r) => (
                <button key={r.key} onClick={() => react(r.key)} title={r.label} className={`group flex items-center justify-center h-10 w-10 rounded-full hover:scale-125 transition-transform ${r.color} hover:bg-black/[0.06]`}>
                  <r.icon size={22} />
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setShowComments((s) => !s)} className="btn-text w-full"><MessageSquareText size={20} /> <span className="hidden sm:inline">Comment</span></button>
        <button onClick={repost} disabled={reposted} className={`btn-text w-full ${reposted ? "text-emerald-700" : ""}`}><Repeat2 size={20} /> <span className="hidden sm:inline">{reposted ? "Reposted" : "Repost"}</span></button>
        {t ? (
          <Link href={`/tenders/${t.id}?bid=1`} className="btn-text w-full"><Send size={20} /> <span className="hidden sm:inline">Inquire</span></Link>
        ) : (
          <Link href={`/messages?to=${post.company.id}`} className="btn-text w-full"><Send size={20} /> <span className="hidden sm:inline">Send</span></Link>
        )}
      </div>

      <Modal open={recOpen} onClose={() => setRecOpen(false)} title="Recommend a business (tracked referral)">
        {recDone ? (
          <div className="text-center py-4">
            <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
            <p className="font-semibold mt-2">Referral tracked</p>
            <p className="text-sm text-muted">If this converts into a contract, commissions are credited automatically. Track it in the Community Hub.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted">Tag a vetted business for this need. LinkBiz tracks the loop end-to-end and applies their published referral commission on conversion.</p>
            <div className="max-h-56 overflow-y-auto divide-y divide-line border border-line rounded-xl">
              {recList.filter((c) => c.id !== post.companyId).map((c) => (
                <button key={c.id} onClick={() => setRecTarget(c.id)} className={`w-full flex items-center gap-2 px-3 py-2 text-left row-hover ${recTarget === c.id ? "bg-tint" : ""}`}>
                  <Avatar name={c.name} src={c.logoUrl} size={32} rounded="rounded" />
                  <div className="min-w-0 flex-1"><div className="text-sm font-semibold truncate">{c.name}</div><div className="text-xs text-muted truncate">{c.industry} · {c.location}</div></div>
                  {recTarget === c.id && <CheckCircle2 size={16} className="text-action" />}
                </button>
              ))}
            </div>
            <textarea rows={2} className="input" value={recNote} onChange={(e) => setRecNote(e.target.value)} placeholder="Why are they a good fit for this need?" />
            <div className="flex justify-end gap-2"><button onClick={() => setRecOpen(false)} className="btn-ghost">Cancel</button><button onClick={sendRecommend} disabled={!recTarget} className="btn-primary">Send tracked referral</button></div>
          </div>
        )}
      </Modal>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4 pt-1 space-y-3">
          <form onSubmit={submitComment} className="flex gap-2 items-center">
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder={loggedIn ? "Add a comment…" : "Sign in to comment"} className="input !rounded-full !border-slate-400" />
            {comment.trim() && <button className="btn-primary !py-1 !min-h-7">Post</button>}
          </form>
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Link href={`/company/${c.company.slug}`}><Avatar name={c.company.name} src={c.company.logoUrl} size={32} rounded="rounded-xl" /></Link>
              <div className="flex-1 min-w-0">
                <div className="bg-hover rounded-lg rounded-tl-none px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/company/${c.company.slug}`} className="text-sm font-semibold text-ink hover:text-action hover:underline truncate">{c.company.name}</Link>
                    <span className="text-xs text-muted shrink-0">{timeAgo(c.createdAt)}</span>
                  </div>
                  <div className="text-xs text-muted truncate">{c.company.tagline}</div>
                  <p className="text-sm text-ink mt-1">{c.content}</p>
                </div>
                <div className="flex items-center gap-2 px-2 mt-0.5 text-xs text-muted"><button className="font-semibold hover:text-ink">Endorse</button><span>·</span><button className="font-semibold hover:text-ink">Reply</button></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
