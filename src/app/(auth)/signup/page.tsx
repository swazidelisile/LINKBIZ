"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { INDUSTRIES, COMPANY_SIZES } from "@/lib/format";
import { ShieldCheck, Users, FileText, Sparkles, Globe, Upload, Hash, ArrowRight, TrendingUp } from "lucide-react";

type Demand = { industry: string; region: string; count: number };
type Built = { companyName: string; industry: string; location: string; website: string; tagline: string; services: { title: string; category: string; description: string; tags: string[] }[]; confidence: number };

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ companyName: "", registrationId: "", industry: INDUSTRIES[0], size: COMPANY_SIZES[2], location: "", website: "", tagline: "", fullName: "", email: "", password: "" });
  const [built, setBuilt] = useState<Built | null>(null);
  const [demand, setDemand] = useState<Demand[]>([]);
  const [url, setUrl] = useState("");
  const [buildBusy, setBuildBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { fetch("/api/demand").then((r) => r.json()).then(setDemand).catch(() => {}); }, []);

  async function build(source: "url" | "pdf" | "reg") {
    setBuildBusy(true); setError(null);
    const body = source === "url" ? { url } : source === "reg" ? { registrationId: f.registrationId } : { pdfName: "Company_Profile.pdf" };
    if (source === "url" && !url) { setBuildBusy(false); return setError("Paste your website URL first"); }
    if (source === "reg" && !f.registrationId) { setBuildBusy(false); return setError("Enter your registration number first"); }
    const r = await fetch("/api/ai/build-profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    setBuildBusy(false);
    if (!r.ok) return setError(d.error);
    setBuilt(d);
    setF((p) => ({ ...p, companyName: d.companyName || p.companyName, industry: INDUSTRIES.includes(d.industry) ? d.industry : p.industry, location: d.location || p.location, website: d.website || p.website, tagline: d.tagline || p.tagline }));
    setStep(1);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) {
      if (!f.companyName || !f.registrationId || !f.location) return setError("Please complete all required company fields");
      setError(null); return setStep(2);
    }
    setBusy(true); setError(null);
    const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, services: built?.services ?? [] }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error);
    router.push("/audit");
    router.refresh();
  }

  const totalDemand = demand.reduce((a, d) => a + d.count, 0);

  return (
    <div className="w-full max-w-5xl grid md:grid-cols-[1fr_400px] gap-8 items-start">
      <div className="hidden md:block pt-6">
        <h1 className="text-[44px] font-semibold text-ink leading-[1.08] tracking-[-0.03em]">Buyers are already waiting.<br /><span className="gradient-text">Register and bid today.</span></h1>

        {/* Reverse lead-gen: live anonymised demand */}
        <div className="card p-4 mt-6 spectrum-border">
          <div className="text-xs font-bold uppercase tracking-wide text-action flex items-center gap-1"><TrendingUp size={12} /> Live demand on LinkBiz right now</div>
          <ul className="mt-2 space-y-2">
            {demand.slice(0, 4).map((d, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span><b>{d.count} business{d.count === 1 ? "" : "es"}</b> in {d.region} looking for {d.industry.toLowerCase()} vendors</span>
                <span className="chip">Register to unlock</span>
              </li>
            ))}
            {demand.length === 0 && <li className="text-sm text-muted">{totalDemand || "Dozens of"} open requests across construction, IT, logistics and energy.</li>}
          </ul>
        </div>

        <ul className="mt-6 space-y-4 text-ink-70">
          <li className="flex gap-3"><Sparkles className="text-action shrink-0" size={20} /> <div><b>Zero-effort onboarding</b><br /><span className="text-sm text-muted">Paste your website or upload a profile PDF - AI builds your verified page, service catalog and capability deck in seconds.</span></div></li>
          <li className="flex gap-3"><ShieldCheck className="text-action shrink-0" size={20} /> <div><b>Free Instant Business Audit</b><br /><span className="text-sm text-muted">On verification: competitor map, missing compliance badges and active B2B buyers in your sector.</span></div></li>
          <li className="flex gap-3"><FileText className="text-action shrink-0" size={20} /> <div><b>Day-1 utility, zero connections needed</b><br /><span className="text-sm text-muted">AI invoice generator, QR business card and compliance calendar are free from the moment you register.</span></div></li>
          <li className="flex gap-3"><Users className="text-action shrink-0" size={20} /> <div><b>Team roles</b><br /><span className="text-sm text-muted">Admins, Tender Managers and Content Editors manage one company page.</span></div></li>
        </ul>
      </div>

      <form onSubmit={submit} className="card p-6 space-y-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">Register your company</h2>
          <div className="flex gap-1 mt-2">{[0, 1, 2].map((s) => <div key={s} className={`h-1 flex-1 rounded ${step >= s ? "meter-spectrum" : "bg-hover"}`} />)}</div>
          <p className="text-xs text-muted mt-1">{step === 0 ? "Instant start - let AI build your page" : step === 1 ? "Step 1 of 2 - Company details" : "Step 2 of 2 - Admin account"}</p>
        </div>

        {step === 0 && (
          <>
            <div className="rounded-xl border border-action/15 bg-tint p-3">
              <div className="text-sm font-semibold flex items-center gap-1.5"><Sparkles size={14} className="text-action" /> Zero-effort profile builder</div>
              <p className="text-xs text-muted mt-1">Skip the long forms. AI drafts your page from any one of these:</p>
            </div>
            <div>
              <label className="label flex items-center gap-1"><Globe size={12} /> Your website URL</label>
              <div className="flex gap-2">
                <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourcompany.com" />
                <button type="button" onClick={() => build("url")} disabled={buildBusy} className="btn-primary shrink-0 !px-3">{buildBusy ? "..." : "Build"}</button>
              </div>
            </div>
            <button type="button" onClick={() => build("pdf")} disabled={buildBusy} className="w-full rounded-xl border border-dashed border-action/25 bg-white/50 p-3 text-sm text-muted row-hover flex items-center justify-center gap-2"><Upload size={16} /> Upload company profile PDF</button>
            <div>
              <label className="label flex items-center gap-1"><Hash size={12} /> Or business registration number</label>
              <div className="flex gap-2">
                <input className="input" value={f.registrationId} onChange={set("registrationId")} placeholder="e.g. 2015/123456/07" />
                <button type="button" onClick={() => build("reg")} disabled={buildBusy} className="btn-outline shrink-0 !px-3">Look up</button>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="button" onClick={() => setStep(1)} className="w-full text-center text-sm font-semibold text-muted py-2 row-hover rounded-xl">Fill manually instead <ArrowRight size={13} className="inline" /></button>
          </>
        )}

        {step === 1 && (
          <>
            {built && <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 flex items-center gap-1.5"><Sparkles size={13} /> AI drafted your page ({built.confidence}% confidence) - {built.services.length} services pre-built. Review below.</div>}
            <div><label className="label">Company name *</label><input className="input" value={f.companyName} onChange={set("companyName")} required /></div>
            <div><label className="label">Registration / Tax ID *</label><input className="input" value={f.registrationId} onChange={set("registrationId")} placeholder="e.g. 2015/123456/07 or EIN" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Industry sector *</label><select className="input" value={f.industry} onChange={set("industry")}>{INDUSTRIES.map((i) => <option key={i}>{i}</option>)}</select></div>
              <div><label className="label">Company size *</label><select className="input" value={f.size} onChange={set("size")}>{COMPANY_SIZES.map((i) => <option key={i}>{i}</option>)}</select></div>
            </div>
            <div><label className="label">Headquarters location *</label><input className="input" value={f.location} onChange={set("location")} placeholder="City, Country" required /></div>
            <div><label className="label">Website</label><input className="input" value={f.website} onChange={set("website")} placeholder="https://" /></div>
            <div><label className="label">Tagline</label><input className="input" value={f.tagline} onChange={set("tagline")} placeholder="What your company does, in one line" /></div>
          </>
        )}

        {step === 2 && (
          <>
            <div><label className="label">Your full name *</label><input className="input" value={f.fullName} onChange={set("fullName")} required /></div>
            <div><label className="label">Corporate email *</label><input className="input" type="email" value={f.email} onChange={set("email")} placeholder="you@company.com" required /></div>
            <div><label className="label">Password *</label><input className="input" type="password" minLength={6} value={f.password} onChange={set("password")} required /></div>
            <p className="text-xs text-muted">You will be the <b>Admin</b>. Your <b>free Business Audit & Competitor Map</b> generates immediately after registration.</p>
          </>
        )}

        {step > 0 && error && <p className="text-sm text-red-600">{error}</p>}
        {step > 0 && (
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setStep(step - 1)} className="btn-ghost">Back</button>
            <button className="btn-primary flex-1 !py-2.5" disabled={busy}>{busy ? "Creating..." : step === 1 ? "Continue" : "Create page & run free audit"}</button>
          </div>
        )}
        <p className="text-xs text-center text-muted">Already on LinkBiz? <Link href="/login" className="font-semibold text-action hover:underline">Sign in</Link></p>
      </form>
    </div>
  );
}
