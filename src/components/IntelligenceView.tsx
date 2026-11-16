"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bell, Info, BarChart3, Lock, TrendingUp } from "lucide-react";

type Alert = { id: number; industry: string; category: string; severity: string; title: string; detail: string; region: string; createdAt: string };
type Bench = { id: number; metric: string; p25: number; median: number; p75: number; unit: string; sampleSize: number; mine: number | null };

const SEV: Record<string, { cls: string; icon: typeof Info; label: string }> = {
  critical: { cls: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle, label: "Act now" },
  watch: { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Bell, label: "Watch" },
  info: { cls: "bg-tint text-action border-action/20", icon: Info, label: "Info" },
};

export function IntelligenceView({ industry, region }: { industry: string; region: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [allIndustries, setAllIndustries] = useState(false);
  const [bench, setBench] = useState<{ optIn: boolean; rows: Bench[] } | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/alerts${allIndustries ? "" : `?industry=${encodeURIComponent(industry)}`}`).then((r) => r.json()).then(setAlerts);
  }, [industry, allIndustries]);
  useEffect(() => { fetch("/api/benchmarks").then((r) => r.json()).then(setBench); }, []);

  async function saveMetric(metric: string) {
    const v = inputs[metric];
    if (!v) return;
    await fetch("/api/benchmarks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ metric, value: v }) });
    const r = await fetch("/api/benchmarks"); setBench(await r.json());
    setInputs((p) => ({ ...p, [metric]: "" }));
  }
  async function toggleOptIn() {
    await fetch("/api/benchmarks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ optIn: !bench?.optIn }) });
    const r = await fetch("/api/benchmarks"); setBench(await r.json());
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
      <section className="space-y-2 min-w-0">
        <div className="card p-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2"><TrendingUp size={20} className="text-action" /> Supply Chain & Industry Alerts</h1>
            <p className="text-sm text-muted mt-0.5">Curated for {industry} · {region}. Regulatory shifts, tariffs, logistics delays and commodity moves - no fluff.</p>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
            <input type="checkbox" className="accent-action" checked={allIndustries} onChange={(e) => setAllIndustries(e.target.checked)} /> All sectors
          </label>
        </div>
        {alerts.length === 0 && <div className="card p-8 text-center text-sm text-muted">No alerts for this sector right now.</div>}
        {alerts.map((a) => {
          const sev = SEV[a.severity] ?? SEV.info;
          return (
            <div key={a.id} className="card p-4">
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold ${sev.cls}`}><sev.icon size={11} /> {sev.label}</span>
                <span className="chip">{a.category}</span>
                <span className="text-muted">{a.industry} · {a.region} · {new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="font-semibold text-ink mt-1.5">{a.title}</h3>
              <p className="text-sm text-ink-70 mt-1">{a.detail}</p>
            </div>
          );
        })}
      </section>

      <aside className="space-y-2">
        <div className="card p-4">
          <h2 className="font-semibold text-base flex items-center gap-2"><BarChart3 size={16} className="text-action" /> Anonymous Peer Benchmarking</h2>
          <p className="text-xs text-muted mt-1">Compare against anonymised {industry} peers of similar size in your region. Your figures are never shown to anyone.</p>
          <label className="mt-2 flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input type="checkbox" className="accent-action" checked={bench?.optIn ?? false} onChange={toggleOptIn} />
            Opt in - share my anonymised metrics
          </label>
          <div className="hairline mt-3 pt-3 space-y-4">
            {(bench?.rows ?? []).map((b) => {
              const max = Math.max(b.p75 * 1.25, b.mine ?? 0);
              const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
              const pos = b.mine === null ? null : b.mine < b.p25 ? "below" : b.mine > b.p75 ? "above" : "within";
              return (
                <div key={b.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink">{b.metric}</span>
                    <span className="text-xs text-muted">n={b.sampleSize}</span>
                  </div>
                  <div className="relative h-5 mt-1.5 rounded bg-hover overflow-hidden">
                    <div className="absolute inset-y-0 bg-action/15" style={{ left: pct(b.p25), width: `calc(${pct(b.p75)} - ${pct(b.p25)})` }} />
                    <div className="absolute inset-y-0 w-0.5 bg-action" style={{ left: pct(b.median) }} />
                    {b.mine !== null && <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-ink border-2 border-white" style={{ left: `calc(${pct(b.mine)} - 6px)` }} />}
                  </div>
                  <div className="flex justify-between text-[11px] text-muted mt-0.5">
                    <span>P25 {b.p25}{b.unit}</span><span className="font-semibold text-action">Median {b.median}{b.unit}</span><span>P75 {b.p75}{b.unit}</span>
                  </div>
                  {b.mine !== null ? (
                    <div className="text-xs mt-1">You: <b>{b.mine}{b.unit}</b> - <span className={pos === "above" ? "text-emerald-700 font-semibold" : pos === "below" ? "text-red-700 font-semibold" : "text-muted"}>{pos} the peer band</span></div>
                  ) : (
                    <div className="flex gap-1.5 mt-1.5">
                      <input type="number" className="input !py-1 !text-xs" placeholder={`Your ${b.metric.toLowerCase()} (${b.unit})`} value={inputs[b.metric] ?? ""} onChange={(e) => setInputs((p) => ({ ...p, [b.metric]: e.target.value }))} />
                      <button onClick={() => saveMetric(b.metric)} className="btn-outline !py-1 !text-xs shrink-0">Compare</button>
                    </div>
                  )}
                </div>
              );
            })}
            {bench && bench.rows.length === 0 && <p className="text-xs text-muted flex items-center gap-1"><Lock size={12} /> Benchmark cohort for your segment is still forming (min 20 anonymised contributors).</p>}
          </div>
        </div>
      </aside>
    </div>
  );
}
