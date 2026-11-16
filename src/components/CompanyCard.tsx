"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, UserPlus, Check, Handshake, Store } from "lucide-react";
import { Avatar } from "./Avatar";
import { VerifiedBadge } from "./VerifiedBadge";
import { compact } from "@/lib/format";
import type { CompanyLite } from "@/lib/data";
import { useRouter } from "next/navigation";

export function CompanyCard({ company, variant = "full", loggedIn = true, following = false }: { company: CompanyLite; variant?: "full" | "compact"; loggedIn?: boolean; following?: boolean }) {
  const [isFollowing, setFollowing] = useState(following);
  const [requested, setRequested] = useState<string | null>(null);
  const router = useRouter();

  async function follow() {
    if (!loggedIn) return router.push("/login");
    setFollowing((f) => !f);
    await fetch(`/api/companies/${company.id}/follow`, { method: "POST" });
  }
  async function connect(kind: "vendor" | "partner") {
    if (!loggedIn) return router.push("/login");
    setRequested(kind);
    await fetch("/api/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companyId: company.id, kind }) });
  }

  if (variant === "compact") {
    return (
      <div className="flex items-start gap-3 py-2.5">
        <Link href={`/company/${company.slug}`}><Avatar name={company.name} src={company.logoUrl} size={44} /></Link>
        <div className="min-w-0 flex-1">
          <Link href={`/company/${company.slug}`} className="font-semibold text-sm text-ink hover:underline flex items-center gap-1 truncate">{company.name} {company.verified && <VerifiedBadge size={13} />}</Link>
          <div className="text-xs text-muted truncate">{company.industry} · {company.location}</div>
          <button onClick={follow} className={`mt-1.5 ${isFollowing ? "btn-ghost" : "btn-outline"} !py-0.5 !px-3 !text-xs`}>
            {isFollowing ? <><Check size={12} /> Following</> : <><UserPlus size={12} /> Follow</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="h-16 cover-gradient" />
      <div className="px-4 pb-4 -mt-7 flex flex-col flex-1">
        <Link href={`/company/${company.slug}`}><Avatar name={company.name} src={company.logoUrl} size={64} ring /></Link>
        <Link href={`/company/${company.slug}`} className="mt-2 font-semibold text-base text-ink hover:underline flex items-center gap-1">{company.name} {company.verified && <VerifiedBadge size={14} />}</Link>
        <div className="text-xs text-muted line-clamp-2 min-h-[2rem]">{company.tagline}</div>
        <div className="text-xs text-muted mt-1.5 flex items-center gap-1"><MapPin size={12} /> {company.location}</div>
        <div className="text-xs text-muted mt-0.5">{company.industry} · {compact(company.followerCount)} followers</div>
        <div className="mt-3 flex flex-wrap gap-1.5 mt-auto pt-3">
          <button onClick={follow} className={`${isFollowing ? "btn-ghost" : "btn-outline"} !px-3 !text-xs`}>{isFollowing ? <><Check size={12} /> Following</> : <><UserPlus size={12} /> Follow</>}</button>
          <button onClick={() => connect("partner")} disabled={!!requested} className="btn-ghost !px-3 !text-xs"><Handshake size={12} /> {requested === "partner" ? "Requested" : "Partner"}</button>
          <button onClick={() => connect("vendor")} disabled={!!requested} className="btn-ghost !px-3 !text-xs"><Store size={12} /> {requested === "vendor" ? "Requested" : "Vendor"}</button>
        </div>
      </div>
    </div>
  );
}
