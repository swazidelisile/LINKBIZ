"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Home, FileText, Users, MessageSquare, Search, Building2, LogOut, Settings, ChevronDown, Briefcase, Repeat, Grid3X3, Bell, Sparkles, BarChart3, Boxes, Zap, Wrench, ShieldCheck } from "lucide-react";
import { Avatar } from "./Avatar";
import { VerifiedBadge } from "./VerifiedBadge";
import { ROLE_LABELS } from "@/lib/format";
import type { CompanyLite } from "@/lib/data";

export type NavSession = {
  company: CompanyLite;
  role: string;
  user: { fullName: string; email: string };
} | null;

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/network", label: "My Network", icon: Users },
  { href: "/tenders", label: "Tenders", icon: FileText },
  { href: "/messages", label: "Messaging", icon: MessageSquare },
  { href: "/agent", label: "AI Agent", icon: Sparkles },
];

const MORE = [
  { href: "/micro", label: "Micro-RFP Board", icon: Zap, desc: "Daily needs, structured bids" },
  { href: "/intelligence", label: "Market Intelligence", icon: BarChart3, desc: "Alerts & peer benchmarks" },
  { href: "/resources", label: "Community Hub", icon: Boxes, desc: "Pods, referrals, surplus resources" },
  { href: "/tools", label: "Business Tools", icon: Wrench, desc: "Invoices, QR card, compliance" },
  { href: "/audit", label: "Business Audit", icon: ShieldCheck, desc: "Competitor map & trust score" },
];

function NavTab({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Home; active: boolean }) {
  return (
    <Link href={href} className={`relative flex flex-col items-center justify-center w-[76px] h-[52px] text-xs transition-colors duration-200 ${active ? "text-ink" : "text-muted hover:text-ink"}`}>
      <Icon size={24} strokeWidth={active ? 2.25 : 1.75} />
      <span className={`mt-0.5 leading-none hidden lg:block ${active ? "font-semibold" : ""}`}>{label}</span>
      {active && <span className="nav-active-bar" />}
    </Link>
  );
}

export function Navbar({ session, companies }: { session: NavSession; companies: CompanyLite[] }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMore(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => { setOpen(false); setMore(false); setSheet(false); }, [path]);

  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const moreActive = MORE.some((m) => isActive(m.href));

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  async function switchCompany(id: number) {
    await fetch("/api/auth/switch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companyId: id }) });
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-40 nav-glass">
        <div className="mx-auto max-w-[1128px] px-4 lg:px-6 h-[52px] flex items-center">
          <Link href="/" aria-label="LinkBiz home" className="shrink-0 mr-2">
            <div className="h-[34px] w-[34px] rounded-[11px] brand-tile flex items-center justify-center font-extrabold text-[19px] leading-none tracking-tight">lb</div>
          </Link>
          <form
            onSubmit={(e) => { e.preventDefault(); router.push(`/tenders?q=${encodeURIComponent(q)}`); }}
            className={`relative transition-[width] duration-200 ease-out ${focus ? "w-full max-w-[400px]" : "w-full max-w-[260px]"}`}
          >
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-70 pointer-events-none" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} placeholder="Search"
              className="w-full h-[36px] rounded-full bg-search pl-10 pr-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:bg-white/90 focus:ring-4 focus:ring-action/15 focus:border focus:border-action/40 transition-all duration-200" />
          </form>

          <nav className="hidden md:flex items-center ml-auto">
            {NAV.map((n) => <NavTab key={n.href} {...n} active={isActive(n.href)} />)}
            <Link href="/intelligence" className="relative flex flex-col items-center justify-center w-[76px] h-[52px] text-xs text-muted hover:text-ink">
              <span className="relative"><Bell size={24} strokeWidth={1.75} /><span className="absolute -top-1 -right-2 badge-spectrum text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">5</span></span>
              <span className="mt-0.5 leading-none hidden lg:block">Alerts</span>
            </Link>
          </nav>

          <div className="relative ml-auto md:ml-0" ref={ref}>
            {session ? (
              <button onClick={() => setOpen((o) => !o)} className="flex flex-col items-center justify-center w-[60px] md:w-[72px] h-[52px] text-xs text-muted hover:text-ink">
                <Avatar name={session.company.name} src={session.company.logoUrl} size={24} />
                <span className="hidden lg:flex items-center gap-0.5 mt-0.5 leading-none">Me <ChevronDown size={14} /></span>
              </button>
            ) : (
              <div className="flex items-center gap-2 pl-2">
                <Link href="/signup" className="hidden sm:inline-flex btn-text !text-ink">Join now</Link>
                <Link href="/login" className="btn-outline">Sign in</Link>
              </div>
            )}

            {open && session && (
              <div className="absolute right-0 top-[52px] w-[288px] card !rounded-t-none p-0 overflow-hidden shadow-[0_24px_48px_-20px_rgba(28,28,62,0.35)]">
                <div className="p-3">
                  <div className="flex gap-2 items-start">
                    <Avatar name={session.company.name} src={session.company.logoUrl} size={56} />
                    <div className="min-w-0">
                      <div className="font-semibold text-base text-ink flex items-center gap-1 truncate">{session.company.name} {session.company.verified && <VerifiedBadge size={14} />}</div>
                      <div className="text-xs text-ink-70 line-clamp-2">{session.company.tagline}</div>
                    </div>
                  </div>
                  <Link href={`/company/${session.company.slug}`} className="btn-outline w-full mt-3 !py-1 !min-h-7 !text-sm">View Company Page</Link>
                </div>
                <div className="hairline" />
                <div className="py-1">
                  <div className="px-3 pt-1.5 pb-1 text-sm font-semibold text-ink">Account</div>
                  <div className="px-3 pb-1 text-xs text-muted">{session.user.fullName} · {ROLE_LABELS[session.role]}</div>
                  <Link href="/settings" className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted row-hover hover:text-ink"><Settings size={16} /> Team & Roles</Link>
                  <Link href="/tenders?mine=1" className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted row-hover hover:text-ink"><Briefcase size={16} /> My Tenders & Bids</Link>
                  <Link href="/audit" className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted row-hover hover:text-ink"><ShieldCheck size={16} /> Business Audit & Competitor Map</Link>
                </div>
                <div className="hairline" />
                <div className="py-1">
                  <div className="px-3 pt-1.5 pb-1 text-sm font-semibold text-ink flex items-center gap-1.5"><Repeat size={14} /> Switch company <span className="text-xs font-normal text-muted">(demo)</span></div>
                  <div className="max-h-36 overflow-y-auto">
                    {companies.filter((c) => c.id !== session.company.id).map((c) => (
                      <button key={c.id} onClick={() => switchCompany(c.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-muted row-hover hover:text-ink text-left">
                        <Avatar name={c.name} src={c.logoUrl} size={24} rounded="rounded" /> <span className="truncate">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="hairline" />
                <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted row-hover hover:text-ink"><LogOut size={16} /> Sign Out</button>
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center self-stretch" ref={moreRef}>
            <div className="w-px h-[52px] bg-line mx-1" />
            <div className="relative">
              <button onClick={() => setMore((m) => !m)} className={`flex flex-col items-center justify-center w-[80px] h-[52px] text-xs ${moreActive ? "text-ink" : "text-muted hover:text-ink"}`}>
                <Grid3X3 size={24} strokeWidth={1.75} />
                <span className="flex items-center gap-0.5 mt-0.5 leading-none">More <ChevronDown size={14} /></span>
                {moreActive && <span className="nav-active-bar" />}
              </button>
              {more && (
                <div className="absolute right-0 top-[52px] w-[280px] card !rounded-t-none py-1 shadow-[0_24px_48px_-20px_rgba(28,28,62,0.35)]">
                  {MORE.map((m) => (
                    <Link key={m.href} href={m.href} className="flex items-center gap-3 px-3 py-2 row-hover">
                      <m.icon size={18} className="text-action shrink-0" />
                      <div><div className="text-sm font-semibold text-ink">{m.label}</div><div className="text-xs text-muted">{m.desc}</div></div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 nav-glass flex" style={{ borderTop: "1px solid rgba(0,0,0,0.07)", borderBottom: "none" }}>
        {NAV.slice(0, 4).map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} className={`relative flex-1 flex flex-col items-center justify-center h-[52px] text-[10px] ${active ? "text-ink" : "text-muted"}`}>
              {active && <span className="nav-active-bar" style={{ top: 0, bottom: "auto" }} />}
              <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
              <span className="mt-0.5 leading-none">{label.replace("My ", "")}</span>
            </Link>
          );
        })}
        <button onClick={() => setSheet(true)} className={`relative flex-1 flex flex-col items-center justify-center h-[52px] text-[10px] ${moreActive || isActive("/agent") || isActive("/company") ? "text-ink" : "text-muted"}`}>
          <Grid3X3 size={22} strokeWidth={1.75} />
          <span className="mt-0.5 leading-none">More</span>
        </button>
      </nav>
      {sheet && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setSheet(false)}>
          <div className="absolute bottom-0 inset-x-0 bg-white/85 backdrop-blur-2xl border-t border-white/70 rounded-t-3xl p-4 pb-8 shadow-[0_-20px_60px_-20px_rgba(28,28,62,0.35)]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto h-1 w-10 rounded-full bg-line mb-3" />
            <Link href="/agent" className="flex items-center gap-3 px-2 py-2.5 row-hover rounded"><Sparkles size={20} className="text-action" /><div><div className="font-semibold text-sm">AI Agent</div><div className="text-xs text-muted">Warm matches & proposal drafts</div></div></Link>
            {MORE.map((m) => (
              <Link key={m.href} href={m.href} className="flex items-center gap-3 px-2 py-2.5 row-hover rounded"><m.icon size={20} className="text-action" /><div><div className="font-semibold text-sm">{m.label}</div><div className="text-xs text-muted">{m.desc}</div></div></Link>
            ))}
            <Link href={session ? `/company/${session.company.slug}` : "/login"} className="flex items-center gap-3 px-2 py-2.5 row-hover rounded"><Building2 size={20} className="text-action" /><div className="font-semibold text-sm">Company Page</div></Link>
          </div>
        </div>
      )}
    </>
  );
}
