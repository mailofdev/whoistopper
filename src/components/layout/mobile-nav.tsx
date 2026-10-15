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
  const [install, setInstall] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstall(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener("beforeinstallprompt", onPrompt);
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);
  return (
    <>
      {offline ? <p className="bg-warning/10 px-4 py-2 text-center text-sm text-navy" role="status">You are offline. Reconnect to load new listings or payments.</p> : null}
      {install ? (
        <div className="border-b border-line bg-muted px-4 py-2 text-center text-sm">
          <button className="font-semibold text-brand" onClick={() => void install.prompt()}>Install Who&apos;s Topper</button>
        </div>
      ) : null}
    </>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}
