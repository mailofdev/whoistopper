import Link from "next/link";
import { Mark } from "@/components/brand/mark";
import { SiteSearch } from "@/components/layout/site-search";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const links = [
  { href: "/leaderboard/today", label: "Daily" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About" },
  { href: "/rules", label: "Rules" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 px-3 pt-3">
      <div className="glass mx-auto flex max-w-6xl flex-wrap items-center gap-2 rounded-full px-3 py-2 sm:px-4">
        <Link href="/" className="mr-auto flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight text-navy">
          <Mark className="h-8 w-8 shrink-0" />
          <span className="truncate">rank<span className="text-brand">push</span><span className="font-medium text-secondary">.lol</span></span>
        </Link>
        <nav className="order-last flex w-full gap-1 overflow-x-auto text-sm sm:order-none sm:w-auto" aria-label="Main">
          {links.map((link) => (
            <Link key={link.href} className="shrink-0 rounded-full px-3 py-2 text-secondary hover:bg-white/40 hover:text-navy" href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="contents">
          <SiteSearch />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
