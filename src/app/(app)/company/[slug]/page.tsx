import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Globe, Building2, Users, CalendarDays, ShieldCheck, Award, Briefcase, Quote, FolderCheck, Star, Hash, Lock, ReceiptText } from "lucide-react";
import { getCompanyProfile, getFeed, getReviews } from "@/lib/data";
import { TrustCard } from "@/components/TrustCard";
import { getSession } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ProfileActions } from "@/components/ProfileActions";
import { TenderCard } from "@/components/TenderCard";
import { PostCard } from "@/components/PostCard";
import { compact } from "@/lib/format";

const TABS = [
  { key: "about", label: "About" },
  { key: "services", label: "Services & Capabilities" },
  { key: "achievements", label: "Achievements & Track Record" },
  { key: "tenders", label: "Active Tenders" },
  { key: "reviews", label: "Verified Reviews" },
  { key: "posts", label: "Posts" },
];

const achIcon: Record<string, typeof Award> = { project: FolderCheck, award: Award, testimonial: Quote, case_study: Star };
const achLabel: Record<string, string> = { project: "Completed Project", award: "Award", testimonial: "Client Testimonial", case_study: "Verified Case Study" };

export default async function CompanyPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ slug }, sp, session] = await Promise.all([params, searchParams, getSession()]);
  const profile = await getCompanyProfile(slug, session?.company.id);
  if (!profile) notFound();
  const { company: c, services, achievements, tenders, isFollowing, followers } = profile;
  const tab = TABS.some((t) => t.key === sp.tab) ? sp.tab! : "about";
  const posts = tab === "posts" ? await getFeed({ companyId: c.id, viewerId: session?.company.id }) : [];
  const reviews = tab === "reviews" ? await getReviews(c.id) : [];
  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : null;
  const isOwner = session?.company.id === c.id;

  return (
    <div className="space-y-3 sm:px-0">
      <div className="card overflow-hidden">
        <div className={`h-36 sm:h-52 bg-cover bg-center ${c.coverUrl ? "" : "cover-gradient"}`} style={c.coverUrl ? { backgroundImage: `url(${c.coverUrl})` } : undefined} />
        <div className="px-5 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14">
            <div className="rounded-[26px] bg-white/85 p-1.5 shadow-[0_18px_40px_-20px_rgba(28,28,62,0.55)] backdrop-blur-xl"><Avatar name={c.name} src={c.logoUrl} size={120} rounded="rounded-[20px]" className="!w-24 !h-24 sm:!w-[112px] sm:!h-[112px]" /></div>
            <div className="flex-1 min-w-0 sm:pb-1">
              <h1 className="text-2xl sm:text-[32px] font-semibold tracking-[-0.03em] leading-tight text-ink flex items-center gap-2 flex-wrap">{c.name} {c.verified && <VerifiedBadge size={20} label />}</h1>
              <p className="text-ink-70 text-sm mt-0.5">{c.tagline}</p>
              <div className="text-sm text-muted mt-1 flex flex-wrap gap-x-3 gap-y-1">
                <span className="flex items-center gap-1"><Building2 size={14} /> {c.industry}</span>
                <span className="flex items-center gap-1"><MapPin size={14} /> {c.location}</span>
                <span className="flex items-center gap-1 font-semibold text-action"><Users size={14} /> {compact(followers)} followers</span>
                <span className="flex items-center gap-1">{c.size} employees</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <ProfileActions companyId={c.id} companyName={c.name} loggedIn={!!session} isOwner={!!isOwner} following={isFollowing} />
          </div>
        </div>
        <div className="border-t border-line px-2 flex overflow-x-auto">
          {TABS.map((t) => (
            <Link key={t.key} href={`/company/${c.slug}?tab=${t.key}`} scroll={false} className={`relative whitespace-nowrap px-3 py-2.5 text-sm font-semibold transition-colors ${tab === t.key ? "text-ink" : "text-muted hover:text-ink"}`}>
              {t.label}{t.key === "tenders" && tenders.length > 0 && <span className="ml-1.5 text-[10px] badge-spectrum rounded-full px-1.5 py-0.5">{tenders.length}</span>}{tab === t.key && <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full meter-spectrum" />}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3 items-start">
        <div className="space-y-3 min-w-0">
          {tab === "about" && (
            <>
              <div className="card p-5">
                <h2 className="font-semibold text-xl text-ink">Overview</h2>
                <p className="text-sm text-ink-70 mt-2 leading-relaxed">{c.overview ?? "This company has not added an overview yet."}</p>
                <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><dt className="text-muted flex items-center gap-1"><Globe size={14} /> Website</dt><dd className="font-semibold text-action">{c.website ? <a href={c.website} target="_blank" rel="noreferrer" className="hover:underline">{c.website}</a> : "-"}</dd></div>
                  <div><dt className="text-muted flex items-center gap-1"><Hash size={14} /> Registration / Tax ID</dt><dd className="font-semibold">{c.registrationId}</dd></div>
                  <div><dt className="text-muted flex items-center gap-1"><Building2 size={14} /> Industry</dt><dd className="font-semibold">{c.industry}</dd></div>
                  <div><dt className="text-muted flex items-center gap-1"><Users size={14} /> Company size</dt><dd className="font-semibold">{c.size} employees</dd></div>
                  <div><dt className="text-muted flex items-center gap-1"><MapPin size={14} /> Headquarters</dt><dd className="font-semibold">{c.location}</dd></div>
                  <div><dt className="text-muted flex items-center gap-1"><CalendarDays size={14} /> Founded</dt><dd className="font-semibold">{c.founded ?? "-"}</dd></div>
                </dl>
              </div>
              <div className="card p-5">
                <h2 className="font-semibold text-xl text-ink flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-600" /> Compliance & Certifications</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.certifications.map((x) => <span key={x} className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 px-2.5 py-1 text-xs font-semibold"><ShieldCheck size={12} /> {x}</span>)}
                  {c.certifications.length === 0 && <p className="text-sm text-muted">No certifications listed.</p>}
                </div>
              </div>
              <div className="card p-5">
                <h2 className="font-semibold text-xl text-ink">Key Executives</h2>
                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                  {c.executives.map((e) => (
                    <div key={e.name} className="flex items-center gap-3"><Avatar name={e.name} size={44} rounded="rounded-full" /><div><div className="font-semibold text-sm">{e.name}</div><div className="text-xs text-muted">{e.title}</div></div></div>
                  ))}
                  {c.executives.length === 0 && <p className="text-sm text-muted">No executives listed.</p>}
                </div>
              </div>
            </>
          )}

          {tab === "services" && (
            <div className="space-y-3">
              {services.length === 0 && <div className="card p-8 text-center text-sm text-muted">No services listed yet.</div>}
              {services.map((s) => (
                <div key={s.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><span className="chip mb-1.5">{s.category}</span><h3 className="font-semibold text-ink">{s.title}</h3></div>
                    <Briefcase size={20} className="text-line shrink-0" />
                  </div>
                  <p className="text-sm text-ink-70 mt-2">{s.description}</p>
                  <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-canvas p-2.5"><div className="text-xs text-muted">Starting pricing</div><div className="font-semibold">{s.pricingTier ?? "On request"}</div></div>
                    <div className="rounded-xl bg-canvas p-2.5"><div className="text-xs text-muted">Capacity</div><div className="font-semibold">{s.capacity ?? "-"}</div></div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">{s.tags.map((t) => <span key={t} className="text-xs text-action bg-tint rounded px-2 py-0.5 font-medium">#{t}</span>)}</div>
                </div>
              ))}
            </div>
          )}

          {tab === "achievements" && (
            <div className="grid sm:grid-cols-2 gap-3">
              {achievements.length === 0 && <div className="card p-8 text-center text-sm text-muted sm:col-span-2">No achievements yet.</div>}
              {achievements.map((a) => {
                const Icon = achIcon[a.type] ?? Award;
                return (
                  <div key={a.id} className="card overflow-hidden flex flex-col">
                    {a.imageUrl && <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${a.imageUrl})` }} />}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1 font-semibold text-muted"><Icon size={14} /> {achLabel[a.type]}</span>{a.verified && <VerifiedBadge size={13} label />}</div>
                      <h3 className="font-semibold text-ink mt-1.5">{a.title}</h3>
                      <p className={`text-sm text-ink-70 mt-1 flex-1 ${a.type === "testimonial" ? "italic" : ""}`}>{a.description}</p>
                      <div className="text-xs text-muted mt-3">{a.client && <span>{a.type === "testimonial" ? "- " : "Client: "}{a.client}</span>}{a.client && a.year && " · "}{a.year}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "tenders" && (
            <div className="space-y-2">
              {tenders.length === 0 && <div className="card p-8 text-center text-sm text-muted">{c.name} has no open tenders at the moment.</div>}
              {tenders.map((t) => <TenderCard key={t.id} tender={t} />)}
            </div>
          )}

          {tab === "reviews" && (
            <div className="space-y-3">
              <div className="card p-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="font-semibold text-xl text-ink">Transaction-Verified Reviews</h2>
                    <p className="text-sm text-muted mt-0.5 flex items-center gap-1.5"><Lock size={13} /> Only businesses with completed invoices or contracts processed through LinkBiz can leave feedback.</p>
                  </div>
                  {avgRating && <div className="text-right"><div className="text-2xl font-bold text-ink">{avgRating}<span className="text-sm text-muted font-normal"> / 5</span></div><div className="text-xs text-muted">{reviews.length} verified deal{reviews.length === 1 ? "" : "s"}</div></div>}
                </div>
              </div>
              {reviews.length === 0 && <div className="card p-8 text-center text-sm text-muted">No verified reviews yet. Reviews unlock after a contract settles through LinkBiz escrow.</div>}
              {reviews.map((r) => (
                <div key={r.id} className="card p-5">
                  <div className="flex items-start gap-3">
                    <Avatar name={r.reviewer.name} src={r.reviewer.logoUrl} size={44} rounded="rounded-xl" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/company/${r.reviewer.slug}`} className="font-semibold text-sm hover:underline">{r.reviewer.name}</Link>
                        {r.reviewer.verified && <VerifiedBadge size={13} />}
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 text-[11px] font-semibold"><ReceiptText size={11} /> Transaction verified</span>
                      </div>
                      <div className="flex items-center gap-0.5 mt-1">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} className={i <= r.rating ? "fill-amber-400 text-amber-400" : "text-line"} />)}</div>
                      <p className="text-sm text-ink mt-2">{r.content}</p>
                      <div className="mt-2 text-xs text-muted flex flex-wrap gap-x-3 gap-y-1">
                        <span>Contract {r.contractRef}</span>
                        <span>Invoice value ${r.invoiceAmount.toLocaleString()}</span>
                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "posts" && (
            <div className="space-y-2">
              {posts.length === 0 && <div className="card p-8 text-center text-sm text-muted">No posts yet.</div>}
              {posts.map((p) => <PostCard key={p.id} post={p} loggedIn={!!session} />)}
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <TrustCard company={c} isOwner={!!isOwner} />
          <div className="card p-4 text-sm">
            <h3 className="font-semibold">At a glance</h3>
            <ul className="mt-2 space-y-1.5 text-ink-70">
              <li className="flex justify-between"><span className="text-muted">Services</span><b>{services.length}</b></li>
              <li className="flex justify-between"><span className="text-muted">Track record items</span><b>{achievements.length}</b></li>
              <li className="flex justify-between"><span className="text-muted">Open tenders</span><b>{tenders.length}</b></li>
              <li className="flex justify-between"><span className="text-muted">Certifications</span><b>{c.certifications.length}</b></li>
              <li className="flex justify-between"><span className="text-muted">Verified business</span><b>{c.verified ? "Yes" : "Pending"}</b></li>
            </ul>
          </div>
          {tenders.length > 0 && tab !== "tenders" && (
            <div>
              <h3 className="text-sm font-semibold text-ink-70 mb-2 px-1">Active tenders</h3>
              <div className="space-y-2">{tenders.slice(0, 2).map((t) => <TenderCard key={t.id} tender={t} compact />)}</div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
