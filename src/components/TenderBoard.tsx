"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { TenderCard } from "./TenderCard";
import { TENDER_CATEGORIES, REGIONS, TENDER_TYPES } from "@/lib/format";
import type { TenderWithCompany } from "@/lib/data";

const BUDGETS = [
  { label: "Any budget", min: "", max: "" },
  { label: "Under $500K", min: "", max: "500000" },
  { label: "$500K – $2M", min: "500000", max: "2000000" },
  { label: "$2M – $5M", min: "2000000", max: "5000000" },
  { label: "Over $5M", min: "5000000", max: "" },
];
const DEADLINES = [
  { label: "Any deadline", v: "" },
  { label: "Closing in 7 days", v: "7" },
  { label: "Closing in 14 days", v: "14" },
  { label: "Closing in 30 days", v: "30" },
];

export function TenderBoard({ initial, initialQuery }: { initial: TenderWithCompany[]; initialQuery: string }) {
  const [q, setQ] = useState(initialQuery);
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState(0);
  const [deadline, setDeadline] = useState("");
  const [items, setItems] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    if (region) p.set("region", region);
    if (type) p.set("type", type);
    if (BUDGETS[budget].min) p.set("budgetMin", BUDGETS[budget].min);
    if (BUDGETS[budget].max) p.set("budgetMax", BUDGETS[budget].max);
    if (deadline) p.set("deadlineWithin", deadline);
    const res = await fetch(`/api/tenders?${p}`);
    setItems(await res.json());
    setLoading(false);
  }, [q, category, region, type, budget, deadline]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const activeCount = [category, region, type, deadline].filter(Boolean).length + (budget ? 1 : 0);
  const clear = () => { setCategory(""); setRegion(""); setType(""); setBudget(0); setDeadline(""); setQ(""); };

  const Filters = (
    <div className="space-y-3">
      <div><label className="label">Industry / Category</label><select className="input" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{TENDER_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
      <div><label className="label">Location / Region</label><select className="input" value={region} onChange={(e) => setRegion(e.target.value)}><option value="">All regions</option>{REGIONS.map((c) => <option key={c}>{c}</option>)}</select></div>
      <div><label className="label">Tender type</label>
        <div className="space-y-1">
          {[["", "All types"], ...Object.entries(TENDER_TYPES)].map(([k, v]) => (
            <label key={k} className="flex items-center gap-2 text-sm text-ink-70"><input type="radio" name="ttype" checked={type === k} onChange={() => setType(k)} className="accent-action" /> {v}</label>
          ))}
        </div>
      </div>
      <div><label className="label">Budget range</label><select className="input" value={budget} onChange={(e) => setBudget(Number(e.target.value))}>{BUDGETS.map((b, i) => <option key={b.label} value={i}>{b.label}</option>)}</select></div>
      <div><label className="label">Submission deadline</label><select className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)}>{DEADLINES.map((d) => <option key={d.label} value={d.v}>{d.label}</option>)}</select></div>
      {activeCount > 0 && <button onClick={clear} className="text-xs font-semibold text-action hover:underline flex items-center gap-1"><X size={12} /> Clear all filters</button>}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 items-start">
      <aside className="hidden md:block card p-4 sticky top-[72px]">
        <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><SlidersHorizontal size={16} /> Filters</h3>
        {Filters}
      </aside>
      <section className="space-y-2 min-w-0">
        <div className="card p-3 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tenders by title, scope or keyword…" className="input !pl-9" />
          </div>
          <button onClick={() => setMobileFilters((m) => !m)} className="btn-ghost md:hidden"><SlidersHorizontal size={14} /> {activeCount > 0 && <span className="badge-spectrum rounded-full text-[10px] px-1.5">{activeCount}</span>}</button>
        </div>
        {mobileFilters && <div className="card p-4 md:hidden">{Filters}</div>}
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted">{loading ? "Searching…" : `${items.length} open tender${items.length === 1 ? "" : "s"}`}</p>
          <p className="text-xs text-muted">Sorted by closing date</p>
        </div>
        <div className={`space-y-2 ${loading ? "opacity-60" : ""}`}>
          {items.length === 0 && !loading && <div className="card p-10 text-center text-sm text-muted">No tenders match your filters.</div>}
          {items.map((t) => <TenderCard key={t.id} tender={t} />)}
        </div>
      </section>
    </div>
  );
}
