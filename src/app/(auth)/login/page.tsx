"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, TrendingUp } from "lucide-react";
import { useEffect } from "react";

const DEMO = [
  { email: "admin@apexbuild.com", name: "Apex Build Group (Construction)" },
  { email: "admin@nexacloud.io", name: "NexaCloud Systems (IT)" },
  { email: "admin@swiftroute.com", name: "SwiftRoute Logistics" },
  { email: "admin@ironforge.co", name: "IronForge Manufacturing" },
  { email: "admin@verdant.energy", name: "Verdant Energy" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@apexbuild.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [demand, setDemand] = useState<{ industry: string; region: string; count: number }[]>([]);
  useEffect(() => { fetch("/api/demand").then((r) => r.json()).then(setDemand).catch(() => {}); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-[34px] font-semibold tracking-[-0.03em] text-ink">Sign in</h1>
      <p className="text-sm text-muted mt-1">Manage your company page, tenders and deal rooms.</p>
      <form onSubmit={submit} className="card p-6 mt-5 space-y-4">
        <div><label className="label">Corporate email</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><label className="label">Password</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full !py-2.5" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="text-sm text-center text-muted">New to LinkBiz? <Link href="/signup" className="text-action font-semibold hover:underline">Register your company</Link></p>
      </form>
      {demand.length > 0 && (
        <div className="card p-4 mt-4 spectrum-border bg-tint/70">
          <div className="text-xs font-semibold text-action uppercase tracking-wide flex items-center gap-1"><TrendingUp size={12} /> Buyers waiting right now</div>
          <p className="text-sm text-ink mt-1.5"><b>{demand[0].count} businesses</b> in {demand[0].region} are looking for {demand[0].industry.toLowerCase()} vendors. <Link href="/signup" className="text-action font-semibold hover:underline">Register to unlock and bid</Link>.</p>
        </div>
      )}
      <div className="card p-4 mt-4">
        <div className="text-xs font-semibold text-muted uppercase tracking-wide flex items-center gap-1"><Building2 size={12} /> Demo accounts (password: password123)</div>
        <div className="mt-2 grid gap-1">
          {DEMO.map((d) => (
            <button key={d.email} type="button" onClick={() => { setEmail(d.email); setPassword("password123"); }} className="text-left text-sm px-2.5 py-1.5 rounded-lg row-hover">
              <span className="font-semibold text-ink">{d.name}</span> <span className="text-muted">· {d.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
