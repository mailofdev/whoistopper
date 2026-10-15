import Link from "next/link";
import { Suspense } from "react";
import { logoutAction } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/session";
import { isAdmin } from "@/lib/security/authorization";
import { MobileNav } from "@/components/layout/mobile-nav";

const links = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/leaderboard/today", label: "Today" },
  { href: "/categories", label: "Categories" },
  { href: "/search", label: "Search" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-navy">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-sm text-white">W</span>
          Who&apos;s Topper
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-secondary md:flex" aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} className="hover:text-navy" href={link.href}>{link.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link className="hidden h-11 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white md:inline-flex" href="/submit">
            Submit
          </Link>
          <Suspense fallback={<span className="h-11 w-20" />}>
            <AuthLinks />
          </Suspense>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

async function AuthLinks() {
  const user = await getCurrentUser();
  if (!user) {
    return <Link className="inline-flex h-11 items-center px-3 text-sm font-semibold" href="/login">Sign in</Link>;
  }
  return (
    <div className="hidden items-center gap-2 md:flex">
      <Link className="text-sm font-semibold" href="/dashboard">Dashboard</Link>
      {isAdmin(user) ? <Link className="text-sm font-semibold" href="/admin">Admin</Link> : null}
      <form action={logoutAction}>
        <button className="h-11 px-3 text-sm font-semibold text-secondary" type="submit">Log out</button>
      </form>
    </div>
  );
}
