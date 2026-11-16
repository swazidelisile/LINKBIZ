import { initials } from "@/lib/format";

/** Circular by default (LinkedIn identity treatment). Pass rounded="rounded-xl" for company-logo squares. */
export function Avatar({ name, src, size = 40, rounded = "rounded-full", className = "", ring = false }: { name: string; src?: string | null; size?: number; rounded?: string; className?: string; ring?: boolean }) {
  const ringCls = ring ? "border-2 border-white shadow-[0_6px_18px_-10px_rgba(28,28,62,0.55)]" : "border border-line";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} width={size} height={size} className={`${rounded} ${ringCls} object-cover bg-white shrink-0 ${className}`} style={{ width: size, height: size }} />;
  }
  return (
    <div className={`${rounded} ${ring ? "border-2 border-white shadow-[0_6px_18px_-10px_rgba(28,28,62,0.55)]" : ""} brand-tile flex items-center justify-center font-semibold shrink-0 ${className}`} style={{ width: size, height: size, fontSize: size / 2.6 }}>
      {initials(name)}
    </div>
  );
}
