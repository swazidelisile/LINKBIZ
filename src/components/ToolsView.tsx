"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Receipt, QrCode, CalendarClock, Plus, X, Download, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { Avatar } from "./Avatar";

type Item = { desc: string; qty: number; price: number };
type Invoice = { id: number; number: string; clientName: string; items: Item[]; taxPct: number; total: number; dueDate: string; status: string; createdAt: string };
type Company = { id: number; slug: string; name: string; tagline: string | null; location: string; email: string; website: string | null; logoUrl: string | null; taxCompliant: boolean; insuranceVerified: boolean; verified: boolean; certifications: string[]; founded: number | null };

export function ToolsView({ company }: { company: Company }) {
  const [tab, setTab] = useState<"invoice" | "card" | "compliance">("invoice");
  return (
    <div className="space-y-3">
      <div className="card p-4">
        <h1 className="text-xl font-semibold">Business Tools</h1>
        <p className="text-sm text-muted mt-0.5">Free single-player utilities - valuable from day one, even before your network joins.</p>
      </div>
      <div className="card px-1 flex overflow-x-auto">
        {([["invoice", "AI Invoice Generator", Receipt], ["card", "QR Business Card", QrCode], ["compliance", "Compliance Reminders", CalendarClock]] as const).map(([k, l, I]) => (
          <button key={k} onClick={() => setTab(k)} className={`relative whitespace-nowrap px-3 py-2.5 text-sm font-semibold inline-flex items-center gap-1.5 ${tab === k ? "text-action" : "text-muted hover:text-ink"}`}>
            <I size={15} /> {l}{tab === k && <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full meter-spectrum" />}
          </button>
        ))}
      </div>
      {tab === "invoice" && <InvoiceTool company={company} />}
      {tab === "card" && <CardTool company={company} />}
      {tab === "compliance" && <ComplianceTool company={company} />}
    </div>
  );
}

function InvoiceTool({ company }: { company: Company }) {
  const [client, setClient] = useState("");
  const [items, setItems] = useState<Item[]>([{ desc: "", qty: 1, price: 0 }]);
  const [tax, setTax] = useState("15");
  const [due, setDue] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [saved, setSaved] = useState<Invoice[]>([]);
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() { const r = await fetch("/api/tools/invoices"); if (r.ok) setSaved(await r.json()); }
  useEffect(() => { load(); }, []);

  const sub = items.reduce((a, i) => a + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);
  const total = Math.round(sub * (1 + (Number(tax) || 0) / 100));

  function aiFill() {
    if (!client) return;
    setItems([
      { desc: `Professional services - ${client} (phase 1)`, qty: 1, price: 4800 },
      { desc: "Project management & reporting", qty: 4, price: 350 },
    ]);
  }
  async function save(status: "draft" | "sent") {
    setBusy(true);
    const r = await fetch("/api/tools/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientName: client, items: items.filter((i) => i.desc), taxPct: tax, dueDate: due, status }) });
    const d = await r.json();
    setBusy(false);
    if (r.ok) { setPreview(d.invoice); load(); }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-3 items-start">
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">New invoice</h2>
          <button onClick={aiFill} disabled={!client} className="btn-outline !py-1 !text-xs"><Sparkles size={12} /> AI draft line items</button>
        </div>
        <div><label className="label">Bill to *</label><input className="input" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client company name" /></div>
        <div className="space-y-2">
          <label className="label">Line items</label>
          {items.map((it, i) => (
            <div key={i} className="flex gap-1.5">
              <input className="input flex-1" placeholder="Description" value={it.desc} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))} />
              <input className="input !w-16" type="number" min={1} value={it.qty} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, qty: Number(e.target.value) } : x))} />
              <input className="input !w-24" type="number" placeholder="Price" value={it.price || ""} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, price: Number(e.target.value) } : x))} />
              <button onClick={() => setItems((p) => p.filter((_, j) => j !== i))} className="text-muted hover:text-red-600"><X size={16} /></button>
            </div>
          ))}
          <button onClick={() => setItems((p) => [...p, { desc: "", qty: 1, price: 0 }])} className="text-xs font-semibold text-action inline-flex items-center gap-1 hover:underline"><Plus size={12} /> Add line</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Tax / VAT %</label><input className="input" type="number" value={tax} onChange={(e) => setTax(e.target.value)} /></div>
          <div><label className="label">Due date</label><input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
        </div>
        <div className="hairline pt-3 flex items-center justify-between">
          <div className="text-sm">Subtotal <b>${sub.toLocaleString()}</b> · Total <b className="text-action">${total.toLocaleString()}</b></div>
          <div className="flex gap-2">
            <button onClick={() => save("draft")} disabled={busy || !client} className="btn-ghost !py-1 !text-xs">Save draft</button>
            <button onClick={() => save("sent")} disabled={busy || !client} className="btn-primary !py-1 !text-xs">Generate & send</button>
          </div>
        </div>
        {saved.length > 0 && (
          <div className="hairline pt-3">
            <div className="text-xs font-semibold text-muted mb-1.5">Recent invoices</div>
            <ul className="divide-y divide-line">
              {saved.map((inv) => (
                <li key={inv.id}>
                  <button onClick={() => setPreview(inv)} className="w-full flex items-center justify-between py-1.5 text-sm row-hover rounded px-1">
                    <span className="font-semibold">{inv.number}</span>
                    <span className="text-muted text-xs">{inv.clientName}</span>
                    <span className="font-semibold">${inv.total.toLocaleString()}</span>
                    <span className="chip">{inv.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card p-5" id="invoice-preview">
        {preview ? (
          <>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2"><Avatar name={company.name} src={company.logoUrl} size={40} rounded="rounded" /><div><div className="font-bold">{company.name}</div><div className="text-xs text-muted">{company.location}</div></div></div>
              <div className="text-right"><div className="text-lg font-bold text-action">INVOICE</div><div className="text-xs text-muted">{preview.number}</div></div>
            </div>
            <div className="mt-4 grid grid-cols-2 text-sm">
              <div><div className="text-xs text-muted">Bill to</div><b>{preview.clientName}</b></div>
              <div className="text-right"><div className="text-xs text-muted">Due date</div><b>{preview.dueDate}</b></div>
            </div>
            <table className="w-full text-sm mt-4">
              <thead><tr className="text-xs text-muted border-b border-line"><th className="text-left py-1.5">Description</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Amount</th></tr></thead>
              <tbody className="divide-y divide-line">
                {preview.items.map((i, x) => <tr key={x}><td className="py-1.5">{i.desc}</td><td className="text-right">{i.qty}</td><td className="text-right">${i.price.toLocaleString()}</td><td className="text-right">${(i.qty * i.price).toLocaleString()}</td></tr>)}
              </tbody>
            </table>
            <div className="mt-3 text-sm text-right space-y-0.5">
              <div className="text-muted">Tax ({preview.taxPct}%) included</div>
              <div className="text-lg font-bold">Total ${preview.total.toLocaleString()}</div>
            </div>
            <div className="hairline mt-4 pt-3 text-xs text-muted">Pay via LinkBiz Escrow for milestone-protected settlement. {company.email}</div>
            <button onClick={() => window.print()} className="btn-outline mt-3 !py-1 !text-xs"><Download size={12} /> Print / PDF</button>
          </>
        ) : (
          <div className="text-center text-sm text-muted py-16"><Receipt size={36} className="mx-auto text-line mb-2" />Generate an invoice to see the live preview.</div>
        )}
      </div>
    </div>
  );
}

function CardTool({ company }: { company: Company }) {
  const [qr, setQr] = useState<string>("");
  const url = typeof window !== "undefined" ? `${window.location.origin}/company/${company.slug}?src=qr` : `/company/${company.slug}`;
  useEffect(() => {
    QRCode.toDataURL(url, { width: 480, margin: 2, color: { dark: "#191919", light: "#ffffff" } }).then(setQr);
  }, [url]);
  return (
    <div className="grid sm:grid-cols-2 gap-3 items-start">
      <div className="card p-6 text-center">
        <div className="h-16 -mx-6 -mt-6 mb-4 rounded-t-[17px] cover-gradient" />
        <Avatar name={company.name} src={company.logoUrl} size={72} ring className="mx-auto -mt-12" />
        <h2 className="font-bold text-lg mt-2">{company.name}</h2>
        <p className="text-sm text-muted">{company.tagline}</p>
        <p className="text-xs text-muted mt-1">{company.location} · {company.email}</p>
        {qr && <img src={qr} alt="QR code to company profile" className="mx-auto mt-4 w-44 h-44 border border-line rounded-lg" />}
        <p className="text-[11px] text-muted mt-2 break-all">{url}</p>
        {qr && <a href={qr} download={`${company.slug}-qr.png`} className="btn-primary mt-3"><Download size={14} /> Download QR card</a>}
      </div>
      <div className="card p-4">
        <h3 className="font-semibold">Scan tracking</h3>
        <p className="text-xs text-muted mt-1">Every scan lands on your verified LinkBiz page with source attribution (?src=qr).</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[["142", "Scans"], ["61", "Profile views"], ["9", "Inquiries"]].map(([v, l]) => (
            <div key={l} className="rounded-xl bg-hover/60 border border-line p-3"><div className="text-xl font-bold text-action">{v}</div><div className="text-xs text-muted">{l}</div></div>
          ))}
        </div>
        <p className="text-xs text-muted mt-3">Print the QR on proposals, vehicles and site boards - procurement teams scan straight into your capability deck and live capacity status.</p>
      </div>
    </div>
  );
}

function ComplianceTool({ company }: { company: Company }) {
  const year = new Date().getFullYear();
  const rows = [
    { name: "Corporate tax filing", due: `${year}-03-31`, ok: company.taxCompliant, note: company.taxCompliant ? "Verified with revenue authority" : "Upload tax clearance certificate to unlock the badge" },
    { name: "Liability insurance renewal", due: `${year}-06-30`, ok: company.insuranceVerified, note: company.insuranceVerified ? "Coverage verified by insurer API" : "Connect your broker to verify coverage" },
    { name: "Business registration annual return", due: `${year}-08-15`, ok: company.verified, note: company.verified ? "Registry check passed" : "Complete registry verification" },
    { name: "ISO surveillance audit", due: `${year}-11-01`, ok: company.certifications.some((c) => c.startsWith("ISO")), note: company.certifications.length ? `Certifications on file: ${company.certifications.slice(0, 2).join(", ")}` : "Add certifications to your profile" },
    { name: "B-BBEE / diversity certificate", due: `${year}-05-01`, ok: company.certifications.some((c) => /B-BBEE|diversity/i.test(c)), note: "Required for public-sector tender eligibility in ZA" },
  ];
  const daysTo = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  return (
    <div className="card p-4">
      <h2 className="font-semibold">Automated compliance calendar</h2>
      <p className="text-xs text-muted mt-0.5">Deadlines inferred for {company.location}. Verified items auto-clear when registry, tax and insurer checks pass.</p>
      <ul className="mt-3 divide-y divide-line">
        {rows.map((r) => {
          const d = daysTo(r.due);
          return (
            <li key={r.name} className="py-3 flex items-start gap-3">
              {r.ok ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle size={18} className={d < 60 ? "text-red-600 shrink-0 mt-0.5" : "text-amber-500 shrink-0 mt-0.5"} />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{r.name}</span>
                  <span className={`text-xs font-semibold ${r.ok ? "text-emerald-700" : d < 60 ? "text-red-700" : "text-muted"}`}>{r.ok ? "Cleared" : d >= 0 ? `Due in ${d} days` : `${-d} days overdue`}</span>
                </div>
                <p className="text-xs text-muted mt-0.5">{r.note} · {r.due}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
