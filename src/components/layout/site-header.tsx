import Link from "next/link";
import { Suspense } from "react";
import { Mark } from "@/components/brand/mark";
import { SiteSearch } from "@/components/layout/site-search";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getCurrentUser } from "@/features/auth/session";

const links = [
  { href: "/leaderboard", label: "Discover" },
  { href: "/trending", label: "Trending" },
  { href: "/games", label: "Games" },
  { href: "/categories", label: "Lanes" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 px-3 pt-3">
      <div className="glass mx-auto flex max-w-6xl flex-wrap items-center gap-2 rounded-full px-3 py-2 sm:px-4">
        <Link href="/" className="mr-auto flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight text-navy">
          <Mark className="h-8 w-8 shrink-0" />
          <span className="truncate">Rank<span className="text-brand">Push</span></span>
        </Link>
        <nav className="order-last flex w-full gap-1 overflow-x-auto text-sm sm:order-none sm:w-auto" aria-label="Main">
          {links.map((link) => (
            <Link key={link.href} className="shrink-0 rounded-full px-3 py-2 text-secondary hover:bg-white/10 hover:text-navy" href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="contents">
          <SiteSearch />
          <Suspense fallback={<Link className="rounded-full px-3 py-2 text-sm text-secondary" href="/login">Sign in</Link>}>
            <AccountLink />
          </Suspense>
          <ThemeToggle />
          <Link className="inline-flex h-11 items-center rounded-full bg-brand px-4 text-sm font-semibold text-on-brand" href="/submit">Launch</Link>
        </div>
      </div>
    </header>
  );
}

async function AccountLink() {
  let signedIn = false;
  try {
    signedIn = Boolean(await getCurrentUser());
  } catch {
    signedIn = false;
  }
  if (!signedIn) return <Link className="rounded-full px-3 py-2 text-sm text-secondary hover:text-navy" href="/login">Sign in</Link>;
  return <Link className="rounded-full px-3 py-2 text-sm text-secondary hover:text-navy" href="/dashboard">Studio</Link>;
}
