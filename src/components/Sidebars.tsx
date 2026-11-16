import Link from "next/link";
import { Bookmark, FileText, Users, Briefcase, Info, Sparkles, BarChart3, Boxes, Zap, Wrench } from "lucide-react";
import { Avatar } from "./Avatar";
import { VerifiedBadge } from "./VerifiedBadge";
import { CompanyCard } from "./CompanyCard";
import { NewsWidget } from "./NewsWidget";
import { compact, ROLE_LABELS, daysLeft, money } from "@/lib/format";
import type { CompanyLite, TenderWithCompany } from "@/lib/data";
import type { Session } from "@/lib/auth";

type Stats = { posts: number; openTenders: number; bids: number; followers: number; connections: number };

export function LeftSidebar({ session, stats }: { session: Session | null; stats: Stats | null }) {
  if (!session || !stats) {
    return (
      <div className="card overflow-hidden">
        <div className="h-20 cover-gradient" />
        <div className="px-3 pb-4 pt-3 text-center">
          <h3 className="font-semibold text-base text-ink">Welcome to LinkBiz</h3>
          <p className="text-xs text-muted mt-1 leading-snug">The B2B network where businesses showcase capabilities and win tenders.</p>
          <Link href="/signup" className="btn-primary w-full mt-3">Register your company</Link>
          <Link href="/login" className="btn-outline w-full mt-2">Sign in</Link>
        </div>
      </div>
    );
  }
  const c = session.company;
  const rows: { label: string; value: string | number; href: string }[] = [
    { label: "Profile followers", value: compact(c.followerCount + stats.followers), href: `/company/${c.slug}` },
    { label: "Business connections", value: stats.connections, href: "/network" },
    { label: "Open tenders issued", value: stats.openTenders, href: `/company/${c.slug}?tab=tenders` },
    { label: "Bids submitted", value: stats.bids, href: "/tenders?mine=1" },
  ];
  return (
    <>
      {/* Identity card */}
      <div className="card overflow-hidden">
        <div className="h-20 cover-gradient bg-cover bg-center" style={c.coverUrl ? { backgroundImage: `url(${c.coverUrl})` } : undefined} />
        <div className="px-3 pb-3 -mt-9 text-center">
          <Link href={`/company/${c.slug}`} className="inline-block"><Avatar name={c.name} src={c.logoUrl} size={72} ring className="mx-auto" /></Link>
          <Link href={`/company/${c.slug}`} className="block mt-2 font-semibold text-base text-ink hover:underline leading-tight">
            <span className="inline-flex items-center gap-1">{c.name} {c.verified && <VerifiedBadge size={14} />}</span>
          </Link>
          <div className="text-xs text-muted mt-1 line-clamp-2 leading-snug">{c.tagline}</div>
          <div className="text-xs text-muted mt-1">{c.location}</div>
          <div className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${c.capacityStatus === "available" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : c.capacityStatus === "limited" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700"}`}>
            <span className={`dot-live ${c.capacityStatus === "available" ? "bg-emerald-500" : c.capacityStatus === "limited" ? "bg-amber-500" : "bg-red-500"}`} />
            {c.capacityStatus === "available" ? "Open for work" : c.capacityStatus === "limited" ? "Limited capacity" : "Fully booked"}
          </div>
        </div>
        <div className="hairline" />
        <ul className="py-2">
          {rows.map((r) => (
            <li key={r.label}>
              <Link href={r.href} className="flex items-center justify-between px-3 py-1.5 text-xs row-hover">
                <span className="text-muted font-medium">{r.label}</span>
                <span className="font-semibold text-action">{r.value}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="hairline" />
        <Link href="/settings" className="block px-3 py-3 row-hover">
          <div className="text-xs text-muted">Your role on this page</div>
          <div className="text-xs font-semibold text-ink flex items-center gap-1.5"><span className="h-3 w-3 rounded-[2px] bg-amber-400 inline-block" /> {ROLE_LABELS[session.role]}</div>
        </Link>
        <div className="hairline" />
        <Link href="/tenders?mine=1" className="flex items-center gap-2 px-3 py-3 text-xs font-semibold text-ink row-hover"><Bookmark size={16} className="text-muted" /> Saved tenders</Link>
      </div>

      {/* Sticky secondary shortcuts card */}
      <div className="card p-3 hidden md:block">
        <ul className="space-y-2.5 text-xs font-semibold text-action">
          <li><Link href="/agent" className="flex items-center gap-2 hover:underline"><Sparkles size={14} /> AI Deal-Matching Agent</Link></li>
          <li><Link href="/micro" className="flex items-center gap-2 hover:underline"><Zap size={14} /> Micro-RFP Board</Link></li>
          <li><Link href="/tenders" className="flex items-center gap-2 hover:underline"><FileText size={14} /> Tender Marketplace</Link></li>
          <li><Link href="/intelligence" className="flex items-center gap-2 hover:underline"><BarChart3 size={14} /> Market Intelligence</Link></li>
          <li><Link href="/resources" className="flex items-center gap-2 hover:underline"><Boxes size={14} /> Pods & Referrals</Link></li>
          <li><Link href="/tools" className="flex items-center gap-2 hover:underline"><Wrench size={14} /> Invoices, QR & Compliance</Link></li>
          <li><Link href="/network" className="flex items-center gap-2 hover:underline"><Users size={14} /> Business Network</Link></li>
          <li><Link href="/settings" className="flex items-center gap-2 hover:underline"><Briefcase size={14} /> Manage team &amp; roles</Link></li>
        </ul>
        <div className="hairline mt-3 pt-2.5">
          <Link href="/network" className="block text-center text-sm font-semibold text-muted rounded-xl py-1.5 row-hover">Discover more</Link>
        </div>
      </div>
    </>
  );
}

const NEWS = [
  { t: "Global infrastructure spend to hit $9.2T in 2026", m: "2h ago · 4,120 readers" },
  { t: "New procurement rules favour SME subcontractors", m: "5h ago · 2,870 readers" },
  { t: "Cold-chain capacity in Asia up 18% year-on-year", m: "1d ago · 1,944 readers" },
  { t: "Cyber insurance premiums rise for unaudited vendors", m: "1d ago · 1,502 readers" },
  { t: "Solar module prices fall to record low", m: "2d ago · 3,318 readers" },
  { t: "Steel tariffs reshape European supply chains", m: "2d ago · 1,210 readers" },
  { t: "Public tenders now require ESG disclosures", m: "3d ago · 988 readers" },
  { t: "Logistics M&A activity hits five-year high", m: "3d ago · 742 readers" },
];

export function RightSidebar({ tenders, suppliers, loggedIn }: { tenders: TenderWithCompany[]; suppliers: CompanyLite[]; loggedIn: boolean }) {
  return (
    <div className="space-y-2">
      <NewsWidget
        title="LinkBiz News"
        items={NEWS}
        trending={tenders.slice(0, 4).map((t) => ({
          href: `/tenders/${t.id}`,
          t: t.title,
          m: `${t.company.name} · ${money(t.budgetMax, t.currency)} · ${daysLeft(t.deadline)}d left`,
          urgent: daysLeft(t.deadline) <= 10,
        }))}
      />

      <div className="card p-3">
        <div className="flex items-center justify-between"><h3 className="font-semibold text-base text-ink">Add to your network</h3><Info size={16} className="text-muted" /></div>
        <div className="divide-y divide-line">
          {suppliers.slice(0, 3).map((s) => <CompanyCard key={s.id} company={s} variant="compact" loggedIn={loggedIn} />)}
        </div>
        <Link href="/network" className="block text-center text-sm font-semibold text-muted rounded-xl py-1.5 mt-1 row-hover">View all recommendations →</Link>
      </div>

      {/* Sticky footer / promo card */}
      <div className="sticky top-[76px] space-y-2">
        <div className="card promo-card p-4 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">Grow your business with</div>
          <div className="font-semibold text-base text-white mt-1 tracking-[-0.02em]">LinkBiz Premium Business</div>
          <p className="text-xs text-white/70 mt-1.5 leading-relaxed">Unlimited tender alerts, bid analytics and verified badge priority.</p>
          <Link href="/signup" className="btn-glass-light w-full mt-3 !py-1">Try for free</Link>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-3 text-xs text-muted">
          {["About", "Accessibility", "Help Center", "Privacy & Terms", "Tender Guidelines", "Business Solutions", "More"].map((l) => <span key={l} className="hover:text-action hover:underline cursor-pointer">{l}</span>)}
        </nav>
        <div className="flex items-center justify-center gap-1 text-xs text-muted"><span className="font-extrabold text-action">LinkBiz</span> Corporation © 2026</div>
      </div>
    </div>
  );
}
