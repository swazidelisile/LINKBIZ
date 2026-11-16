"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Map, AlertTriangle, CheckCircle2, Users, Sparkles, ArrowRight } from "lucide-react";
import { Avatar } from "./Avatar";
import { VerifiedBadge } from "./VerifiedBadge";
import { PostSkeleton } from "./Skeleton";
import type { CompanyLite } from "@/lib/data";

type Audit = {
  company: { name: string; industry: string; location: string };
  competitors: CompanyLite[]; localCount: number; buyers: CompanyLite[]; missing: string[];
  trustScore: number; demand: { industry: string; region: string; count: number }[]; openOpportunities: number;
};

export function AuditView() {
  const [a, setA] = useState<Audit | null>(null);
  useEffect(() => { fetch("/api/audit").then((r) => r.json()).then(setA); }, []);
  if (!a) return <div className="space-y-2"><PostSkeleton /><PostSkeleton /></div>;

  const scoreColor = a.trustScore >= 80 ? "text-emerald-700" : a.trustScore >= 50 ? "text-amber-600" : "text-red-700";

  return (
    <div className="space-y-3">
      <div className="card p-5 bg-gradient-to-br from-tint via-white/60 to-white/30 spectrum-border">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-action flex items-center gap-1"><Sparkles size={12} /> Free instant audit - generated on verification</div>
            <h1 className="text-xl font-semibold mt-1">Business Audit & Competitor Map</h1>
            <p className="text-sm text-muted mt-0.5">{a.company.name} · {a.company.industry} · {a.company.location}</p>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${scoreColor}`}>{a.trustScore}</div>
            <div className="text-xs text-muted">Trust score / 100</div>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-hover overflow-hidden"><div className="h-full rounded-full meter-spectrum" style={{ width: `${a.trustScore}%` }} /></div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 items-start">
        <div className="card p-4">
          <h2 className="font-semibold flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /> Missing trust signals ({a.missing.length})</h2>
          {a.missing.length === 0 ? (
            <p className="text-sm text-emerald-700 mt-2 flex items-center gap-1.5"><CheckCircle2 size={15} /> All key badges verified. You rank above 80% of peers.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {a.missing.map((m) => (
                <li key={m} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500 shrink-0" /> {m}</span>
                  <Link href="/settings" className="text-xs font-semibold text-action hover:underline shrink-0">Fix</Link>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted mt-3">Verified businesses receive 3.2x more tender invitations on LinkBiz.</p>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold flex items-center gap-2"><Users size={16} className="text-action" /> Active B2B buyers in your sector ({a.buyers.length})</h2>
          <p className="text-xs text-muted mt-0.5">These businesses have open tenders or micro-RFPs right now.</p>
          <ul className="mt-2 divide-y divide-line">
            {a.buyers.map((b) => (
              <li key={b.id} className="py-2 flex items-center gap-2">
                <Avatar name={b.name} src={b.logoUrl} size={32} rounded="rounded" />
                <div className="min-w-0 flex-1"><Link href={`/company/${b.slug}`} className="text-sm font-semibold hover:underline inline-flex items-center gap-1">{b.name} {b.verified && <VerifiedBadge size={12} />}</Link><div className="text-xs text-muted truncate">{b.industry} · {b.location}</div></div>
                <Link href="/agent" className="btn-outline !py-0.5 !px-2.5 !text-xs shrink-0">Pitch</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold flex items-center gap-2"><Map size={16} className="text-action" /> Competitor map ({a.competitors.length})</h2>
          <p className="text-xs text-muted mt-0.5">{a.localCount > 0 ? `${a.localCount} direct competitors in your country.` : "Same-sector businesses on LinkBiz."} Positioning tip: differentiate on verified badges and live capacity.</p>
          <ul className="mt-2 divide-y divide-line">
            {a.competitors.length === 0 && <li className="py-3 text-sm text-muted">No direct competitors on LinkBiz yet - first-mover advantage in your sector.</li>}
            {a.competitors.map((c) => (
              <li key={c.id} className="py-2 flex items-center gap-2">
                <Avatar name={c.name} src={c.logoUrl} size={32} rounded="rounded" />
                <div className="min-w-0 flex-1"><Link href={`/company/${c.slug}`} className="text-sm font-semibold hover:underline">{c.name}</Link><div className="text-xs text-muted truncate">{c.tagline}</div></div>
                <span className="text-xs text-muted shrink-0">{c.location.split(",").pop()}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold flex items-center gap-2"><ShieldCheck size={16} className="text-action" /> Live demand for your capabilities</h2>
          <ul className="mt-2 space-y-2">
            {a.demand.map((d, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span>{d.count} open request{d.count === 1 ? "" : "s"} - {d.industry}</span>
                <span className="text-xs text-muted">{d.region}</span>
              </li>
            ))}
            {a.demand.length === 0 && <li className="text-sm text-muted">{a.openOpportunities} open opportunities across the network.</li>}
          </ul>
          <Link href="/agent" className="btn-primary w-full mt-3">Let my AI agent pitch these buyers <ArrowRight size={14} /></Link>
        </div>
      </div>
    </div>
  );
}
