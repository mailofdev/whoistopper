"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const links = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/leaderboard/today", label: "Today" },
  { href: "/categories", label: "Categories" },
  { href: "/search", label: "Search" },
  { href: "/submit", label: "Submit" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        className="inline-flex h-11 items-center rounded-lg border border-line px-3 text-sm font-semibold"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((value) => !value)}
      >
        Menu
      </button>
      {open ? (
        <nav id="mobile-nav" className="absolute left-0 right-0 top-16 border-b border-line bg-surface p-4 shadow-card">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link className="block rounded-lg px-3 py-3 hover:bg-muted" href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}

export function AppStatus() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) void registration.unregister();
      }).catch(() => undefined);
    }
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return offline ? <p className="bg-warning/10 px-4 py-2 text-center text-sm text-navy" role="status">You are offline. Reconnect to load new listings or payments.</p> : null;
}
