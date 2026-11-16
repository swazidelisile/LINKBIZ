import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Download, FileText, MapPin, Wallet, Tag, Users, CheckCircle2, CalendarDays, Clock } from "lucide-react";
import { getTender, getTenders } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Countdown } from "@/components/Countdown";
import { BidModal } from "@/components/BidModal";
import { TenderCard } from "@/components/TenderCard";
import { money, TENDER_TYPES } from "@/lib/format";
import { db } from "@/db";
import { tenderBids } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export default async function TenderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tender = await getTender(Number(id));
  if (!tender) notFound();
  const session = await getSession();
  const [related, myBid] = await Promise.all([
    getTenders({ category: tender.category }).then((r) => r.filter((t) => t.id !== tender.id).slice(0, 3)),
    session ? db.select().from(tenderBids).where(and(eq(tenderBids.tenderId, tender.id), eq(tenderBids.companyId, session.company.id))) : Promise.resolve([]),
  ]);
  const isOwner = session?.company.id === tender.companyId;

  return (
    <div className="px-4 sm:px-0 space-y-3">
      <Link href="/tenders" className="text-sm text-muted hover:text-action inline-flex items-center gap-1"><ArrowLeft size={14} /> Back to marketplace</Link>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
        <div className="space-y-3 min-w-0">
          <div className="card p-5">
            <div className="flex items-center gap-2 text-xs"><span className="font-semibold uppercase tracking-wide text-action">{TENDER_TYPES[tender.type]}</span><span className="text-muted">·</span><span className="text-muted">Ref. LB-{String(tender.id).padStart(5, "0")}</span></div>
            <h1 className="text-2xl font-semibold text-ink mt-1 leading-tight">{tender.title}</h1>
            <Link href={`/company/${tender.company.slug}`} className="mt-3 flex items-center gap-3 group w-fit">
              <Avatar name={tender.company.name} src={tender.company.logoUrl} size={44} />
              <div><div className="font-semibold text-sm group-hover:underline flex items-center gap-1">{tender.company.name} {tender.company.verified && <VerifiedBadge size={14} />}</div><div className="text-xs text-muted">{tender.company.industry} · {tender.company.location}</div></div>
            </Link>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="rounded-xl bg-canvas p-3"><div className="text-xs text-muted flex items-center gap-1"><Wallet size={12} /> Budget</div><div className="font-semibold mt-0.5">{money(tender.budgetMin, tender.currency)} – {money(tender.budgetMax, tender.currency)}</div></div>
              <div className="rounded-xl bg-canvas p-3"><div className="text-xs text-muted flex items-center gap-1"><MapPin size={12} /> Region</div><div className="font-semibold mt-0.5">{tender.region}</div></div>
              <div className="rounded-xl bg-canvas p-3"><div className="text-xs text-muted flex items-center gap-1"><Tag size={12} /> Category</div><div className="font-semibold mt-0.5">{tender.category}</div></div>
              <div className="rounded-xl bg-canvas p-3"><div className="text-xs text-muted flex items-center gap-1"><Users size={12} /> Bids</div><div className="font-semibold mt-0.5">{tender.bidCount} received</div></div>
            </div>
          </div>
          <div className="card p-5">
            <h2 className="font-semibold text-ink">Scope of Work</h2>
            <p className="text-sm text-ink-70 mt-2 leading-relaxed whitespace-pre-line">{tender.scope}</p>
          </div>
          <div className="card p-5">
            <h2 className="font-semibold text-ink">Eligibility Requirements</h2>
            <ul className="mt-2 space-y-1.5">
              {tender.eligibility.map((e) => <li key={e} className="flex gap-2 text-sm text-ink-70"><CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" /> {e}</li>)}
              {tender.eligibility.length === 0 && <li className="text-sm text-muted">No specific eligibility requirements listed.</li>}
            </ul>
          </div>
          <div className="card p-5">
            <h2 className="font-semibold text-ink">Tender Documents</h2>
            <ul className="mt-2 divide-y divide-line">
              {tender.documents.map((d) => (
                <li key={d.name} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3"><div className="h-9 w-9 rounded bg-red-50 text-red-600 flex items-center justify-center"><FileText size={18} /></div><div><div className="text-sm font-semibold">{d.name}</div><div className="text-xs text-muted">PDF · {d.size}</div></div></div>
                  <a href={d.url} download className="btn-ghost !py-1 !text-xs"><Download size={12} /> Download</a>
                </li>
              ))}
              {tender.documents.length === 0 && <li className="text-sm text-muted py-2">No documents attached.</li>}
            </ul>
          </div>
        </div>
        <aside className="space-y-3 lg:sticky lg:top-[72px]">
          <div className="card p-4 space-y-3">
            <div className="text-xs font-semibold text-muted uppercase tracking-wide flex items-center gap-1"><Clock size={12} /> Closing in</div>
            <Countdown deadline={tender.deadline.toISOString()} />
            <div className="text-xs text-muted flex items-center gap-1"><CalendarDays size={12} /> Deadline: {tender.deadline.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</div>
            <Suspense>
              <BidModal tender={tender} loggedIn={!!session} isOwner={!!isOwner} alreadyBid={myBid.length > 0} companyName={session?.company.name} />
            </Suspense>
            {!session && <p className="text-xs text-center text-muted"><Link href="/login" className="text-action font-semibold">Sign in</Link> to submit a bid.</p>}
          </div>
          {related.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-ink-70 mb-2 px-1">Similar tenders</h3>
              <div className="space-y-2">{related.map((t) => <TenderCard key={t.id} tender={t} compact />)}</div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
