import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-[11px] brand-tile flex items-center justify-center font-extrabold text-xl leading-none">lb</div>
          <span className="font-semibold text-[22px] tracking-[-0.02em] text-ink">Link<span className="gradient-text">Biz</span></span>
        </Link>
      </header>
      <div className="flex-1 flex items-start justify-center px-4 pb-16 pt-2">{children}</div>
      <footer className="pb-8 text-center text-xs text-muted">
        Built for ambitious businesses · <span className="text-ink-70">Tenders, partners and deals in one network.</span>
      </footer>
    </div>
  );
}
