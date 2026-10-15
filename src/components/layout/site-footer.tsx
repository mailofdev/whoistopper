import Link from "next/link";
import { Mark } from "@/components/brand/mark";
import { site } from "@/config/site";

const links = [
  ["Rules", "/rules"],
  ["FAQ", "/faq"],
  ["Terms", "/terms"],
  ["Privacy", "/privacy"],
  ["Refunds", "/refunds"],
] as const;

export function SiteFooter() {
  return (
    <footer className="px-3 pb-4">
      <div className="glass mx-auto flex max-w-3xl flex-col items-center gap-1 rounded-3xl px-4 py-3 text-center">
        <p className="flex items-center justify-center gap-2 text-sm font-semibold text-navy">
          <Mark className="h-5 w-5" />
          <span>Rank<span className="text-brand">Push</span></span>
          <span className="font-normal text-secondary">{site.domain}</span>
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-1 text-sm text-secondary">
          {links.map(([label, href]) => (
            <Link key={href} className="rounded-full px-3 py-2 hover:bg-white/40 hover:text-navy" href={href}>{label}</Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
