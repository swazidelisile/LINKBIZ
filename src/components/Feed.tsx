"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { PostCard } from "./PostCard";
import { PostSkeleton } from "./Skeleton";
import type { FeedPost } from "@/lib/data";

const TABS = [
  { key: "all", label: "All Updates" },
  { key: "buy", label: "Looking to Buy" },
  { key: "tender", label: "Open Tenders" },
  { key: "partnership", label: "Seeking Partners" },
  { key: "milestone", label: "Milestones" },
  { key: "event", label: "B2B Events" },
];

export function Feed({ posts, loggedIn }: { posts: FeedPost[]; loggedIn: boolean }) {
  const sp = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState(sp.get("tab") ?? "all");
  const [sort, setSort] = useState<"top" | "recent">("top");
  const [sortOpen, setSortOpen] = useState(false);
  const [pending, start] = useTransition();

  const visible = useMemo(() => {
    const list = tab === "all" ? posts : posts.filter((p) => p.type === tab);
    if (sort === "recent") return list;
    const score = (p: FeedPost) => Object.values(p.reactionCounts).reduce((a, b) => a + b, 0) * 2 + p.commentCount * 3;
    return [...list].sort((a, b) => score(b) - score(a) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, tab, sort]);

  function select(k: string) {
    setTab(k);
    start(() => router.replace(k === "all" ? "/" : `/?tab=${k}`, { scroll: false }));
  }

  return (
    <div className="space-y-2">
      {/* Filter tabs */}
      <div className="card px-1 flex overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => select(t.key)} className={`relative whitespace-nowrap px-3 py-2.5 text-sm font-semibold transition-colors ${tab === t.key ? "text-action" : "text-muted hover:text-ink"}`}>
            {t.label}
            {tab === t.key && <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full meter-spectrum" />}
          </button>
        ))}
      </div>

      {/* Sort divider */}
      <div className="flex items-center gap-2 px-1 relative">
        <div className="flex-1 hairline" />
        <button onClick={() => setSortOpen((o) => !o)} className="text-xs text-muted inline-flex items-center gap-1">
          Sort by: <span className="font-semibold text-ink">{sort === "top" ? "Top" : "Recent"}</span> <ChevronDown size={14} className="text-ink" />
        </button>
        {sortOpen && (
          <div className="absolute right-0 top-5 z-10 card w-36 py-1 !rounded-[14px] shadow-[0_24px_48px_-20px_rgba(28,28,62,0.35)]" onMouseLeave={() => setSortOpen(false)}>
            {(["top", "recent"] as const).map((s) => (
              <button key={s} onClick={() => { setSort(s); setSortOpen(false); }} className={`w-full text-left px-3 py-1.5 text-sm row-hover ${sort === s ? "font-semibold text-ink border-l-2 border-action" : "text-muted"}`}>{s === "top" ? "Top" : "Recent"}</button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {pending && <PostSkeleton />}
        {!pending && visible.length === 0 && <div className="card p-8 text-center text-sm text-muted">No posts in this category yet.</div>}
        {visible.map((p) => <PostCard key={p.id} post={p} loggedIn={loggedIn} />)}
      </div>
    </div>
  );
}
