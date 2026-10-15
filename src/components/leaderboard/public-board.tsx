"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { claimRankAction } from "@/features/leaderboards/claim";
import { formatInrFromPaise } from "@/lib/money";
import type { ReactNode } from "react";
import type { Category, LeaderboardEntry } from "@/types/domain";

export function PublicBoard({
  entries,
  categories,
  scope,
  category,
  notice,
}: {
  entries: LeaderboardEntry[];
  categories: Category[];
  scope: "all_time" | "daily";
  category?: string;
  notice?: string;
}) {
  const router = useRouter();
  const top = entries.find((entry) => entry.placement === "paid" && entry.amountPaise);
  const opening = top?.amountPaise ? Math.floor(top.amountPaise / 100) + 1 : 99;
  const [amount, setAmount] = useState(opening);
  const [website, setWebsite] = useState("");
  const [error, setError] = useState(notice ?? "");
  const [pending, setPending] = useState(false);

  async function claim(nextAmount = amount) {
    setPending(true);
    setError("");
    const result = await claimRankAction({ website, amountRupees: nextAmount, scope, category });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(result.href);
  }

  return (
    <div className="min-w-0 space-y-3">
      <h1 className="sr-only">Rankings</h1>
      <CategoryRail scope={scope} category={category} categories={categories} />
      <div className="glass flex gap-1 rounded-full p-1 text-sm" role="tablist">
        <Tab href={category ? `/?category=${category}` : "/"} selected={scope === "all_time"}>All-time</Tab>
        <Tab href={category ? `/leaderboard/today?category=${category}` : "/leaderboard/today"} selected={scope === "daily"}>Today</Tab>
      </div>
      <form
        className="glass grid min-w-0 gap-3 rounded-3xl p-3 sm:p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void claim();
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold/25 text-sm font-semibold text-navy">#1</span>
          <input
            aria-label="Amount in rupees"
            className="glass-field h-11 min-w-0 flex-1 rounded-full px-4 text-center font-semibold text-navy"
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value.replace(/[^\d]/g, "")) || 0)}
          />
        </div>
        <input
          required
          aria-label="Your product URL or @handle"
          className="glass-field h-11 w-full rounded-full px-4 text-navy placeholder:text-secondary"
          placeholder="Your product URL or @handle"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
        <button type="submit" disabled={pending || !website.trim()} className="h-11 w-full rounded-full bg-brand px-4 text-sm font-semibold text-on-brand shadow-card disabled:cursor-not-allowed disabled:bg-muted disabled:text-secondary disabled:shadow-none">
          Claim rank
        </button>
        {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
      </form>
      <ol className="space-y-3">
        {entries.map((entry) => {
          const price = entry.amountPaise ? Math.floor(entry.amountPaise / 100) + 1 : 99;
          return (
            <li key={entry.id} className="glass flex flex-col gap-3 rounded-3xl p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand/15 text-sm font-semibold text-brand">#{entry.rank ?? "–"}</span>
                <div className="min-w-0">
                  <a className="block truncate font-medium hover:text-brand" href={`/out/${entry.slug}`} target="_blank" rel="noopener noreferrer">{entry.name}</a>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-secondary">
                    <Link href={`/?category=${entry.categorySlug}`}>{entry.categoryName}</Link>
                    <Link href={`/products/${entry.slug}`}>see details</Link>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="glass-field h-11 w-full rounded-full px-4 text-sm text-secondary hover:text-navy sm:w-auto sm:shrink-0"
                onClick={() => {
                  setAmount(price);
                  window.scrollTo({ top: 0 });
                }}
              >
                {entry.placement === "paid" && entry.amountPaise ? `claim this rank for ${formatInrFromPaise(price * 100)}` : "Free listing"}
              </button>
            </li>
          );
        })}
      </ol>
      {entries.length === 0 ? (
        <p className="glass rounded-3xl px-4 py-8 text-center text-sm leading-6 text-secondary">No paid ranks yet. Claim the first one with a product link. A rank is the amount paid, not a review.</p>
      ) : null}
    </div>
  );
}

function CategoryRail({
  scope,
  category,
  categories,
}: {
  scope: "all_time" | "daily";
  category?: string;
  categories: Category[];
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => {
      setCanPrev(el.scrollLeft > 4);
      setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [categories, scope]);

  function scroll(direction: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    const chips = [...el.children] as HTMLElement[];
    const origin = el.getBoundingClientRect().left;
    const startOf = (chip: HTMLElement) => chip.getBoundingClientRect().left - origin + el.scrollLeft;
    const endOf = (chip: HTMLElement) => startOf(chip) + chip.offsetWidth;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = reduced ? "auto" : "smooth";
    if (direction === 1) {
      const edge = el.scrollLeft + el.clientWidth - 4;
      const next = chips.find((chip) => endOf(chip) > edge);
      el.scrollTo({ left: next ? startOf(next) : el.scrollWidth, behavior });
      return;
    }
    const prev = [...chips].reverse().find((chip) => startOf(chip) < el.scrollLeft - 4);
    el.scrollTo({ left: prev ? Math.max(0, endOf(prev) - el.clientWidth) : 0, behavior });
  }

  return (
    <div className="flex items-center gap-2">
      {canPrev ? <RailButton label="Previous categories" direction="prev" onClick={() => scroll(-1)} /> : null}
      <div ref={scroller} className="flex min-w-0 flex-1 gap-2 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Filter href={scope === "daily" ? "/leaderboard/today" : "/"} active={!category}>All</Filter>
        {categories.map((item) => (
          <Filter key={item.id} href={`/?category=${item.slug}${scope === "daily" ? "&scope=today" : ""}`} active={category === item.slug}>
            {item.name}
          </Filter>
        ))}
      </div>
      {canNext ? <RailButton label="Next categories" direction="next" onClick={() => scroll(1)} /> : null}
    </div>
  );
}

function RailButton({ label, direction, onClick }: { label: string; direction: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-on-brand shadow-card"
      onClick={onClick}
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
        <path
          d={direction === "next" ? "M7.5 4.5 L13 10 L7.5 15.5" : "M12.5 4.5 L7 10 L12.5 15.5"}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function Filter({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`inline-flex h-11 shrink-0 items-center rounded-full px-4 ${active ? "bg-brand font-semibold text-on-brand shadow-card" : "glass-field text-navy"}`}>
      {children}
    </Link>
  );
}

function Tab({ href, selected, children }: { href: string; selected: boolean; children: ReactNode }) {
  return (
    <Link href={href} role="tab" aria-selected={selected} className={`inline-flex h-10 flex-1 items-center justify-center rounded-full px-3 ${selected ? "bg-brand font-semibold text-on-brand shadow-card" : "text-secondary"}`}>
      {children}
    </Link>
  );
}
