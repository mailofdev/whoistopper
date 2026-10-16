"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ListingMark, listingHost, listingWhen } from "@/components/leaderboard/listing-meta";
import { claimRankAction } from "@/features/leaderboards/claim";
import { formatInrFromPaise } from "@/lib/money";
import { site } from "@/config/site";
import type { Category, LeaderboardEntry } from "@/types/domain";

export function PublicBoard({
  entries,
  today = [],
  categories,
  scope,
  category,
  bidding,
  notice,
}: {
  entries: LeaderboardEntry[];
  today?: LeaderboardEntry[];
  categories: Category[];
  scope: "all_time" | "daily";
  category?: string;
  bidding: "all_time" | "daily" | "category";
  notice?: string;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const visible = scope === "daily" && category ? entries.filter((entry) => entry.categorySlug === category) : entries;
  const top = visible.find((entry) => entry.placement === "paid" && entry.amountPaise);
  const opening = top?.amountPaise ? Math.floor(top.amountPaise / 100) + 1 : 99;
  const [amount, setAmount] = useState(opening);
  const [website, setWebsite] = useState("");
  const [categoryChoice, setCategoryChoice] = useState(category ?? "");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const quoted = rankFor(visible, amount);
  const boardName = bidding === "category"
    ? categories.find((item) => item.slug === category)?.name ?? "Category"
    : scope === "daily" ? "Today" : "All-time";
  const ready = website.trim().length > 0 && categoryChoice.length > 0 && amount >= 99;

  function openConfirm() {
    if (!ready) return;
    setAgreed(false);
    setError("");
    setConfirming(true);
    dialogRef.current?.showModal();
  }

  async function claim() {
    if (!agreed) return;
    setPending(true);
    setError("");
    const result = await claimRankAction({
      website,
      amountRupees: amount,
      scope: scope === "daily" ? "daily" : "all_time",
      category: categoryChoice,
      boardCategory: bidding === "category" ? category : undefined,
      termsAccepted: agreed,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    dialogRef.current?.close();
    router.push(result.href);
  }

  return (
    <div className="min-w-0 space-y-5">
      <h1 className="sr-only">Rankings</h1>
      <CategoryRail scope={scope} category={category} categories={categories} />
      <div className="flex justify-center">
        <div className="glass inline-flex gap-1 rounded-full p-1 text-sm" role="tablist" aria-label="Ranking period">
          <Tab href={category ? `/?category=${category}` : "/"} selected={scope === "all_time"}>All-time</Tab>
          <Tab href={category ? `/leaderboard/today?category=${category}` : "/leaderboard/today"} selected={scope === "daily"}>Today</Tab>
        </div>
      </div>
      <form
        id="claim-form"
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          openConfirm();
        }}
      >
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <p className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Claim <span className="text-brand">#{quoted}</span> for
          </p>
          <div className="flex items-center gap-2">
            <Step label="Decrease amount" onClick={() => setAmount((value) => Math.max(99, value - 1))} disabled={amount <= 99}>−</Step>
            <span className="flex items-baseline text-3xl font-semibold text-brand sm:text-4xl">
              <span aria-hidden="true">₹</span>
              <input
                aria-label="Amount in rupees"
                inputMode="numeric"
                className="bg-transparent text-center text-brand outline-none"
                style={{ width: `${Math.max(3, String(amount || 0).length)}ch` }}
                value={amount || ""}
                onChange={(event) => setAmount(Number(event.target.value.replace(/[^\d]/g, "")) || 0)}
              />
            </span>
            <Step label="Increase amount" onClick={() => setAmount((value) => Math.min(1_000_000, value + 1))} disabled={amount >= 1_000_000}>+</Step>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_14rem_auto]">
          <input
            required
            aria-label="Your product URL or @handle"
            className="glass-field h-12 w-full rounded-full px-4 text-navy placeholder:text-secondary"
            placeholder="Your product URL or @handle"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
          <select
            required
            aria-label="Choose a category"
            className="glass-field h-12 rounded-full px-4 text-navy"
            value={categoryChoice}
            onChange={(event) => setCategoryChoice(event.target.value)}
          >
            <option value="">Choose a category</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>{item.name}</option>
            ))}
          </select>
          <button type="submit" disabled={!ready} className="h-12 rounded-full bg-brand px-5 text-sm font-semibold text-on-brand shadow-card disabled:cursor-not-allowed disabled:bg-muted disabled:text-secondary disabled:shadow-none">
            Claim rank
          </button>
        </div>
      </form>

      <div className={today.length > 0 || scope === "all_time" ? "grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]" : ""}>
        <div className="min-w-0">
          {notice ? <p className="mb-3 text-sm text-secondary">{notice}</p> : null}
          {error && !confirming ? <p className="mb-3 text-sm text-danger" role="alert">{error}</p> : null}
          <ol className="space-y-3">
            {visible.map((entry) => (
              <ListingRow
                key={entry.id}
                entry={entry}
                onTake={(rupees) => {
                  setAmount(rupees);
                  document.getElementById("claim-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              />
            ))}
          </ol>
          {visible.length === 0 ? (
            <p className="glass rounded-3xl px-4 py-10 text-center text-sm leading-6 text-secondary">No paid ranks on this board yet. Claim the first one with a product link. A rank is the amount paid, not a review.</p>
          ) : null}
        </div>
        {scope === "all_time" ? <TodayRail entries={today} /> : null}
      </div>

      <dialog
        ref={dialogRef}
        className="confirm-rank"
        aria-labelledby="confirm-rank-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        onClose={() => {
          setAgreed(false);
          setConfirming(false);
        }}
      >
        <div className="glass rounded-3xl p-5 text-navy">
          <div className="flex items-start justify-between gap-3">
            <h2 id="confirm-rank-title" className="text-lg font-semibold">Confirm this rank</h2>
            <button type="button" className="rounded-full px-2 text-secondary hover:text-navy" aria-label="Close" onClick={() => dialogRef.current?.close()}>×</button>
          </div>
          <p className="mt-2 text-sm leading-6 text-secondary">Check the rank and price, then agree to the Terms of Service to continue.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-muted/70 p-4 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-secondary">Rank</p>
              <p className="mt-1 text-lg font-semibold">#{quoted}</p>
              <p className="text-secondary">{boardName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-secondary">Price</p>
              <p className="mt-1 text-lg font-semibold text-brand">{formatInrFromPaise(Math.max(amount, 0) * 100)}</p>
              <p className="text-secondary">Due now</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-secondary">
            A listing at that rank goes on the public board. It goes live when payment confirms. Someone else can claim a higher rank. If this product already has a lower bid on this board, checkout charges only the extra amount needed to reach this bid.
          </p>
          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-line px-3 py-3 text-sm leading-6">
            <input
              type="checkbox"
              className="mt-1"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
            />
            <span>
              I have read and agree to the <Link className="text-brand underline" href="/terms" target="_blank">Terms of Service</Link> of {site.domain}
            </span>
          </label>
          <p className="mt-2 flex gap-3 px-1 text-xs text-secondary">
            <Link className="underline" href="/privacy" target="_blank">Privacy</Link>
            <Link className="underline" href="/rules" target="_blank">Rules</Link>
          </p>
          {error ? <p className="mt-3 text-sm text-danger" role="alert">{error}</p> : null}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="h-10 rounded-full px-4 text-sm text-secondary hover:text-navy" onClick={() => dialogRef.current?.close()}>Cancel</button>
            <button type="button" disabled={!agreed || pending} className="h-10 rounded-full bg-brand px-4 text-sm font-semibold text-on-brand disabled:cursor-not-allowed disabled:bg-muted disabled:text-secondary" onClick={() => void claim()}>
              {pending ? "Opening checkout…" : "Continue to checkout"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

function rankFor(entries: LeaderboardEntry[], rupees: number): number {
  const paise = Math.round(rupees * 100);
  const ahead = entries.filter((entry) => entry.placement === "paid" && entry.amountPaise != null && entry.amountPaise >= paise).length;
  return ahead + 1;
}

function ListingRow({ entry, onTake }: { entry: LeaderboardEntry; onTake: (rupees: number) => void }) {
  const when = listingWhen(entry);
  const host = listingHost(entry);
  const next = entry.amountPaise ? Math.floor(entry.amountPaise / 100) + 1 : 99;
  return (
    <li className="glass flex items-start gap-3 rounded-3xl p-4">
      <span className="w-8 shrink-0 pt-3 text-sm font-semibold text-secondary">#{entry.rank ?? "–"}</span>
      <ListingMark name={entry.name} logoUrl={entry.logoUrl} />
      <div className="min-w-0 flex-1">
        <a className="block truncate font-medium hover:text-brand" href={`/out/${entry.slug}`} target="_blank" rel="noopener noreferrer">{entry.name}</a>
        {entry.shortDescription ? <p className="mt-1 line-clamp-2 text-sm leading-6 text-secondary">{entry.shortDescription}</p> : null}
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-secondary">
          <Link href={`/?category=${entry.categorySlug}`}>{entry.categoryName}</Link>
          {when ? <><Sep />{when}</> : null}
          {host ? <><Sep />{host}</> : null}
          {entry.clicks > 0 ? <><Sep />{new Intl.NumberFormat("en-IN").format(entry.clicks)} clicks</> : null}
          <Sep />
          <Link href={`/products/${entry.slug}`}>see details</Link>
        </p>
      </div>
      {entry.placement === "paid" && entry.amountPaise ? (
        <button type="button" className="shrink-0 pt-1 text-sm font-semibold text-brand" aria-label={`Set bid to ${formatInrFromPaise(next * 100)} to move above this rank`} onClick={() => onTake(next)}>
          {formatInrFromPaise(entry.amountPaise)}
        </button>
      ) : (
        <span className="shrink-0 pt-1 text-sm text-secondary">Free</span>
      )}
    </li>
  );
}

function Sep() {
  return <span aria-hidden="true">·</span>;
}

function TodayRail({ entries }: { entries: LeaderboardEntry[] }) {
  const paid = entries.filter((entry) => entry.placement === "paid" && entry.rank);
  return (
    <aside className="glass h-fit rounded-3xl p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Today&apos;s ranking</h2>
        <Link href="/leaderboard/today" className="text-sm text-secondary hover:text-navy">see all</Link>
      </div>
      {paid.length === 0 ? <p className="mt-4 text-sm text-secondary">No paid ranks yet today. The daily board starts empty at midnight UTC.</p> : (
        <ol className="mt-3 space-y-3">
          {paid.slice(0, 9).map((entry) => (
            <li key={entry.id} className="flex items-center gap-2 text-sm">
              <span className="w-6 shrink-0 text-xs text-secondary">#{entry.rank}</span>
              <ListingMark name={entry.name} logoUrl={entry.logoUrl} compact />
              <a className="min-w-0 flex-1 truncate hover:text-brand" href={`/out/${entry.slug}`} target="_blank" rel="noopener noreferrer">{entry.name}</a>
              <span className="shrink-0 font-medium text-brand">{entry.amountPaise ? formatInrFromPaise(entry.amountPaise) : ""}</span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}

function Step({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} className="grid h-8 w-8 place-items-center rounded-full border border-brand/40 text-lg leading-none text-brand disabled:opacity-40" onClick={onClick}>
      {children}
    </button>
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
      <div ref={scroller} className="glass flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-full p-1 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Filter href={scope === "daily" ? "/leaderboard/today" : "/"} active={!category}>All</Filter>
        {categories.map((item) => (
          <Filter key={item.id} href={scope === "daily" ? `/leaderboard/today?category=${item.slug}` : `/?category=${item.slug}`} active={category === item.slug}>
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
