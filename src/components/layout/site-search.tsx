"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SiteSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  if (!open) {
    return (
      <button type="button" className="grid h-11 w-11 place-items-center rounded-full text-secondary hover:bg-white/40" aria-expanded={false} aria-label="Search" onClick={() => setOpen(true)}>
        ⌕
      </button>
    );
  }

  return (
    <form
      className="order-last flex w-full items-center gap-2 sm:order-none sm:w-auto"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
        setOpen(false);
      }}
    >
      <input
        autoFocus
        aria-label="Search products"
        className="glass-field h-11 min-w-0 flex-1 rounded-full px-4 text-sm text-navy outline-none sm:w-56 sm:flex-none"
        placeholder="Search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button type="button" className="h-11 shrink-0 rounded-full px-3 text-sm text-secondary" onClick={() => setOpen(false)}>Close</button>
    </form>
  );
}
