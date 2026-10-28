"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ListingMark, listingHost, listingWhen } from "@/components/leaderboard/listing-meta";
import { Pagination } from "@/components/ui/primitives";
import { ORGANIC_RANKING_SUMMARY } from "@/features/leaderboards/engine";
import { LIST_PAGE_SIZE, listHref } from "@/lib/pagination";
import { formatIstDateTime } from "@/features/campaigns/schedule";
import type { Category, LeaderboardEntry } from "@/types/domain";

export function PublicBoard({
  entries,
  today = [],
  categories,
  scope,
  category,
  bidding,
  notice,
  page = 1,
  pageSize = LIST_PAGE_SIZE,
  total = 0,
  query = "",
  path = "/",
}: {
  entries: LeaderboardEntry[];
  today?: LeaderboardEntry[];
  categories: Category[];
  scope: "all_time" | "daily";
  category?: string;
  bidding: "all_time" | "daily" | "category";
  notice?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  query?: string;
  path?: string;
}) {
  const visible = entries;
  const boardName = bidding === "category"
    ? categories.find((item) => item.slug === category)?.name ?? "Lane"
    : scope === "daily" ? "Promoted today" : "Creators";

  return (
    <div className="min-w-0 space-y-5">
      <h1 className="text-3xl font-semibold tracking-tight">{boardName}</h1>
      <CategoryRail scope={scope} category={category} categories={categories} query={query} path={path} />
      <form className="flex gap-2" action={path} method="get">
        {category && !path.startsWith("/categories/") ? <input type="hidden" name="category" value={category} /> : null}
        <input
          name="q"
          defaultValue={query}
          aria-label="Search this board"
          placeholder="Search this board"
          className="glass-field h-11 min-w-0 flex-1 rounded-full px-4 text-sm text-navy"
        />
        <button className="h-11 shrink-0 rounded-full bg-brand px-4 text-sm font-semibold text-on-brand" type="submit">Search board</button>
      </form>
      <div className="flex justify-center">
        <div className="glass inline-flex gap-1 rounded-full p-1 text-sm" role="tablist" aria-label="Ranking period">
          <Tab href={listHref("/leaderboard", { category, query })} selected={scope === "all_time"}>Creators</Tab>
          <Tab href={listHref("/leaderboard/today", { category, query })} selected={scope === "daily"}>Promoted</Tab>
        </div>
      </div>
      <div className="glass flex flex-col gap-3 rounded-3xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-secondary">{ORGANIC_RANKING_SUMMARY}</p>
        <Link href="/submit" className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-on-brand">Launch a profile</Link>
      </div>

      <div className={today.length > 0 || scope === "all_time" ? "grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]" : ""}>
        <div className="min-w-0">
          {notice ? <p className="mb-3 text-sm text-secondary">{notice}</p> : null}
          <ol className="space-y-3">
            {visible.map((entry) => (
              <ListingRow key={entry.id} entry={entry} />
            ))}
          </ol>
          {visible.length === 0 ? (
            <p className="glass rounded-3xl px-4 py-10 text-center text-sm leading-6 text-secondary">
              {query ? "No profiles match that search." : scope === "daily" ? "No featured advertisements are running. A daily package lasts 24 hours from activation, not until midnight." : "No approved profiles yet."}
            </p>
          ) : null}
          <Pagination page={page} total={total} pageSize={pageSize} hrefFor={(next) => listHref(path, { category, query, page: next })} />
        </div>
        {scope === "all_time" ? <TodayRail entries={today} /> : null}
      </div>

    </div>
  );
}

function ListingRow({ entry }: { entry: LeaderboardEntry }) {
  const when = listingWhen(entry);
  const host = listingHost(entry);
  return (
    <li className="glass flex items-start gap-3 rounded-3xl p-4">
      <ListingMark name={entry.name} logoUrl={entry.logoUrl} />
      <div className="min-w-0 flex-1">
        <a className="block truncate font-medium hover:text-brand" href={`/out/${entry.slug}`} target="_blank" rel="noopener noreferrer">{entry.name}</a>
        {entry.shortDescription ? <p className="mt-1 line-clamp-2 text-sm leading-6 text-secondary">{entry.shortDescription}</p> : null}
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-secondary">
          <Link href={`/categories/${entry.categorySlug}`}>{entry.categoryName}</Link>
          {when ? <><Sep />{when}</> : null}
          {host ? <><Sep />{host}</> : null}
          {entry.clicks > 0 ? <><Sep />{new Intl.NumberFormat("en-IN").format(entry.clicks)} clicks</> : null}
          <Sep />
          <span>{entry.placement === "paid" ? "Advertisement" : "Organic"}</span>
          {entry.placement === "paid" && entry.campaignEndsAt ? <><Sep />until {formatIstDateTime(entry.campaignEndsAt)}</> : null}
          <Sep />
          <span>{entry.ownershipVerified ? "Ownership verified" : "Ownership not verified"}</span>
          <Sep />
          <Link href={`/products/${entry.slug}`}>see details</Link>
        </p>
      </div>
      <span className="shrink-0 pt-1 text-sm text-secondary">{entry.placement === "paid" ? "Ad" : "Profile"}</span>
    </li>
  );
}

function Sep() {
  return <span aria-hidden="true">·</span>;
}

function TodayRail({ entries }: { entries: LeaderboardEntry[] }) {
  const ads = entries.filter((entry) => entry.placement === "paid");
  return (
    <aside className="glass h-fit rounded-3xl p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Promoted today</h2>
        <Link href="/leaderboard/today" className="text-sm text-secondary hover:text-navy">see all</Link>
      </div>
      {ads.length === 0 ? <p className="mt-4 text-sm text-secondary">No featured advertisements are running. Each daily campaign lasts 24 hours from activation.</p> : (
        <ol className="mt-3 space-y-3">
          {ads.slice(0, 9).map((entry) => (
            <li key={entry.id} className="flex items-center gap-2 text-sm">
              <ListingMark name={entry.name} logoUrl={entry.logoUrl} compact />
              <a className="min-w-0 flex-1 truncate hover:text-brand" href={`/out/${entry.slug}`} target="_blank" rel="noopener noreferrer">{entry.name}</a>
              <span className="shrink-0 text-xs text-secondary">Ad</span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}

function CategoryRail({
  scope,
  category,
  categories,
  query,
  path,
}: {
  scope: "all_time" | "daily";
  category?: string;
  categories: Category[];
  query?: string;
  path: string;
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
      <div ref={scroller} className="glass flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-full p-1 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Filter href={listHref(scope === "daily" ? "/leaderboard/today" : "/leaderboard", { query, page: 1 })} active={!category && !path.startsWith("/categories/")}>All</Filter>
        {categories.map((item) => (
          <Filter
            key={item.id}
            href={scope === "daily"
              ? listHref("/leaderboard/today", { category: item.slug, query, page: 1 })
              : listHref(`/categories/${item.slug}`, { query, page: 1 })}
            active={category === item.slug}
          >
            {item.name}
          </Filter>
        ))}
        <Filter href="/categories" active={false}>Explore</Filter>
      </div>
      {canNext ? <RailButton label="Next categories" direction="next" onClick={() => scroll(1)} /> : null}
    </div>
  );
}

function RailButton({ label, direction, onClick }: { label: string; direction: "prev" | "next"; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-on-brand shadow-card" onClick={onClick}>
      <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
        <path d={direction === "next" ? "M7.5 4.5 L13 10 L7.5 15.5" : "M12.5 4.5 L7 10 L12.5 15.5"} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function Filter({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`inline-flex h-9 shrink-0 items-center rounded-full px-3 ${active ? "bg-brand font-semibold text-on-brand" : "text-navy hover:bg-muted"}`}>
      {children}
    </Link>
  );
}

function Tab({ href, selected, children }: { href: string; selected: boolean; children: ReactNode }) {
  return (
    <Link href={href} role="tab" aria-selected={selected} className={`inline-flex h-9 items-center justify-center rounded-full px-4 ${selected ? "bg-brand font-semibold text-on-brand" : "text-secondary"}`}>
      {children}
    </Link>
  );
}
