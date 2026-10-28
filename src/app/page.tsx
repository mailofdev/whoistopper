import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ProductCard } from "@/components/products/product-card";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import { GAMES } from "@/config/games";
import { ORGANIC_RANKING_SUMMARY, istDayKey } from "@/features/leaderboards/engine";
import { ConfigurationError, toPublicError } from "@/lib/errors";
import { getServices } from "@/lib/services";
import type { Category, LeaderboardEntry, ProductCardModel } from "@/types/domain";

export default function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Home searchParams={searchParams} />
    </Suspense>
  );
}

async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : "";
  if (/^[a-z0-9-]+$/.test(category)) redirect(`/categories/${category}`);
  let notice = "";
  let categories: Category[] = [];
  let recent: ProductCardModel[] = [];
  let trending: ProductCardModel[] = [];
  let promoted: LeaderboardEntry[] = [];
  try {
    const services = getServices();
    const [categoryRows, recentRows, trendingRows, today] = await Promise.all([
      services.categories.list(),
      services.products.listRecent(6),
      services.products.listTrending(6),
      services.leaderboards.get({ type: "daily", key: istDayKey(new Date()) }, 1, 6),
    ]);
    categories = categoryRows.filter((category) => category.isActive);
    recent = recentRows;
    trending = trendingRows;
    promoted = today.entries.filter((entry) => entry.placement === "paid");
  } catch (error) {
    notice = error instanceof ConfigurationError
      ? "The directory is not connected to a database yet, so discovery is empty."
      : toPublicError(error).message;
  }

  return (
    <div className="space-y-12">
      <section className="glass overflow-hidden rounded-[2rem] px-5 py-10 sm:px-10">
        <p className="text-sm font-semibold text-brand">Creator launch and discovery</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-navy sm:text-6xl">Launch a profile people can actually find.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-secondary">
          RankPush is a public home for YouTubers, streamers, and gamers. Publish a free profile, show your games and work, and share one link. Organic order is a published score. Paid spots stay labelled and do not buy that score.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="inline-flex h-12 items-center rounded-full bg-brand px-5 text-sm font-semibold text-on-brand" href="/submit">Launch your profile</Link>
          <Link className="inline-flex h-12 items-center rounded-full bg-muted px-5 text-sm font-semibold text-navy" href="/leaderboard">Discover creators</Link>
        </div>
      </section>

      {notice ? <p className="text-sm text-secondary">{notice}</p> : null}

      <CreatorSection
        title="Promoted"
        href="/leaderboard/today"
        body="Labelled advertisements with a fixed price and a fixed window. They are not the organic ranking."
        items={promoted}
        unavailable={Boolean(notice)}
        empty="No promotion is running. A daily package lasts 24 hours from activation."
      />
      <CreatorSection
        title="Trending"
        href="/trending"
        body="Ordered by counted outbound clicks over the last 7 UTC days."
        items={trending}
        unavailable={Boolean(notice)}
        empty="Trending appears after real outbound clicks are counted."
      />
      <CreatorSection
        title="Just launched"
        href="/new"
        body="The newest approved profiles. Approval time is one part of the organic score, not the whole order."
        items={recent}
        unavailable={Boolean(notice)}
        empty="No approved profiles yet. The first launches show up here after review."
      />

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Lanes</h2>
            <p className="mt-1 text-sm text-secondary">Browse by the kind of creator, then open a game.</p>
          </div>
          <Link className="text-sm text-secondary hover:text-navy" href="/categories">All lanes</Link>
        </div>
        {categories.length === 0 ? <EmptyState title={notice ? "Lanes unavailable" : "Lanes are not loaded"} body={notice ? "Lanes appear when the directory responds." : "Apply the latest database migration, then reload. The catalogue stays empty until those categories exist."} /> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link key={category.id} className="glass rounded-3xl p-4 hover:text-brand" href={`/categories/${category.slug}`}>
                <h3 className="font-semibold text-navy">{category.name}</h3>
                <p className="mt-1 text-sm leading-6 text-secondary">{category.description}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold">Games</h2>
          <Link className="text-sm text-secondary hover:text-navy" href="/games">All games</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {GAMES.slice(0, 10).map((game) => (
            <Link key={game.slug} className="glass rounded-full px-4 py-2 text-sm hover:text-brand" href={`/games/${game.slug}`}>{game.name}</Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <Note title="1. Publish" body="Add your public channel, games, languages, and an optional video. You get a private link to edit it. An account is optional." />
        <Note title="2. Get found" body="Approved profiles appear in search, lanes, game pages, trending, and the organic directory." />
        <Note title="3. Promote, if you want" body="A free profile is the default. A promotion is a labelled fixed-price advertisement. Checkout does not mark a payment successful until the provider confirms it." />
      </section>
      <p className="text-sm leading-6 text-secondary">{ORGANIC_RANKING_SUMMARY} <Link className="text-brand" href="/rules">Read the rules.</Link></p>
    </div>
  );
}

function CreatorSection({
  title,
  href,
  body,
  items,
  empty,
  unavailable = false,
}: {
  title: string;
  href: string;
  body: string;
  items: ProductCardModel[];
  empty: string;
  unavailable?: boolean;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-secondary">{body}</p>
        </div>
        <Link className="shrink-0 text-sm text-secondary hover:text-navy" href={href}>See all</Link>
      </div>
      {unavailable ? null : items.length === 0 ? <EmptyState title={`No ${title.toLowerCase()} yet`} body={empty} /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </section>
  );
}

function Note({ title, body }: { title: string; body: string }) {
  return (
    <div className="glass rounded-3xl p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-secondary">{body}</p>
    </div>
  );
}
