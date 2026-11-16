/** Pulsing placeholders that mirror the exact geometry of live cards. */

export function PostSkeleton() {
  return (
    <div className="card" aria-hidden>
      <div className="p-3 flex items-start gap-2">
        <div className="skeleton-circle h-12 w-12" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="skeleton h-3.5 w-40" />
          <div className="skeleton h-3 w-56" />
          <div className="skeleton h-3 w-20" />
        </div>
      </div>
      <div className="px-4 pb-3 space-y-2">
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-11/12" />
        <div className="skeleton h-3 w-2/3" />
      </div>
      <div className="skeleton h-56 w-full rounded-none" />
      <div className="px-4 py-2 flex justify-between"><div className="skeleton h-3 w-20" /><div className="skeleton h-3 w-24" /></div>
      <div className="hairline mx-4" />
      <div className="px-2 py-1 grid grid-cols-4 gap-1">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-9 rounded-xl" />)}</div>
    </div>
  );
}

export function IdentitySkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden>
      <div className="skeleton h-14 w-full rounded-none" />
      <div className="px-3 pb-3 -mt-9 flex flex-col items-center">
        <div className="skeleton-circle h-[72px] w-[72px] border-2 border-white" />
        <div className="skeleton h-4 w-32 mt-3" />
        <div className="skeleton h-3 w-40 mt-2" />
      </div>
      <div className="hairline" />
      <div className="p-3 space-y-2.5">{[0, 1, 2].map((i) => <div key={i} className="flex justify-between"><div className="skeleton h-3 w-24" /><div className="skeleton h-3 w-8" /></div>)}</div>
    </div>
  );
}

export function WidgetSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card p-3" aria-hidden>
      <div className="skeleton h-4 w-32 mb-3" />
      <div className="space-y-3">{Array.from({ length: rows }).map((_, i) => <div key={i} className="space-y-1.5"><div className="skeleton h-3 w-full" /><div className="skeleton h-2.5 w-24" /></div>)}</div>
    </div>
  );
}

export function TenderSkeleton() {
  return (
    <div className="card p-4 flex gap-3" aria-hidden>
      <div className="skeleton h-12 w-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-32" />
        <div className="skeleton h-3 w-full" />
        <div className="flex gap-4"><div className="skeleton h-3 w-20" /><div className="skeleton h-3 w-16" /><div className="skeleton h-3 w-14" /></div>
      </div>
    </div>
  );
}
