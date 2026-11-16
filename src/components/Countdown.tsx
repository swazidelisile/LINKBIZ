"use client";

import { useEffect, useState } from "react";

export function Countdown({ deadline }: { deadline: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const diff = new Date(deadline).getTime() - now;
  if (diff <= 0) return <div className="text-red-600 font-semibold">Submissions closed</div>;
  const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
  const urgent = d < 7;
  return (
    <div className={`grid grid-cols-4 gap-1 text-center ${urgent ? "text-red-600" : "text-action"}`}>
      {[[d, "days"], [h, "hrs"], [m, "min"], [s, "sec"]].map(([v, l]) => (
        <div key={l} className="rounded-xl bg-hover border border-line py-1.5"><div className="text-xl font-semibold tabular-nums">{String(v).padStart(2, "0")}</div><div className="text-[10px] uppercase text-muted">{l}</div></div>
      ))}
    </div>
  );
}
