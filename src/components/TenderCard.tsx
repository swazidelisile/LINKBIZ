import Link from "next/link";
import { Clock, MapPin, Wallet, Users, FileText } from "lucide-react";
import { Avatar } from "./Avatar";
import { VerifiedBadge } from "./VerifiedBadge";
import { money, daysLeft, TENDER_TYPES } from "@/lib/format";
import type { TenderWithCompany } from "@/lib/data";

const typeColor: Record<string, string> = {
  open_tender: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rfq: "bg-amber-50 text-amber-700 border-amber-200",
  subcontracting: "bg-violet-50 text-violet-700 border-violet-200",
};

export function TenderCard({ tender, compact = false }: { tender: TenderWithCompany; compact?: boolean }) {
  const left = daysLeft(tender.deadline);
  const urgent = left <= 10;
  return (
    <Link href={`/tenders/${tender.id}`} className="card block p-4 hover:bg-white/75 transition-colors">
      <div className="flex items-start gap-3">
        <Avatar name={tender.company.name} src={tender.company.logoUrl} size={compact ? 40 : 48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-semibold text-ink leading-snug ${compact ? "text-sm line-clamp-2" : "text-base"}`}>{tender.title}</h3>
            <span className={`shrink-0 text-[11px] font-semibold border rounded px-1.5 py-0.5 ${typeColor[tender.type]}`}>{TENDER_TYPES[tender.type]}</span>
          </div>
          <div className="text-xs text-muted mt-0.5 flex items-center gap-1">{tender.company.name} {tender.company.verified && <VerifiedBadge size={12} />}</div>
          {!compact && <p className="text-sm text-muted mt-2 line-clamp-2">{tender.summary}</p>}
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1"><Wallet size={13} className="text-muted" /> {money(tender.budgetMin, tender.currency)} – {money(tender.budgetMax, tender.currency)}</span>
            <span className="flex items-center gap-1"><MapPin size={13} className="text-muted" /> {tender.region}</span>
            <span className={`flex items-center gap-1 font-semibold ${urgent ? "text-red-600" : "text-ink-70"}`}><Clock size={13} /> {left > 0 ? `${left}d left` : "Closed"}</span>
            {!compact && <span className="flex items-center gap-1"><Users size={13} className="text-muted" /> {tender.bidCount} bids</span>}
            {!compact && <span className="flex items-center gap-1"><FileText size={13} className="text-muted" /> {tender.documents.length} docs</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
