import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/products/product-card";
import { Alert, Badge, Card, Skeleton } from "@/components/ui/primitives";
import { toPublicError } from "@/lib/errors";
import { getServices } from "@/lib/services";
import { formatInrFromPaise } from "@/lib/money";
import { connection } from "next/server";
import { utcDayKey } from "@/features/leaderboards/engine";

export default function HomePage() {
  return (
    <>
      <section className="grid gap-8 rounded-3xl border border-line bg-surface p-6 shadow-card md:grid-cols-[1.4fr_1fr] md:p-10">
        <div>
          <p className="text-sm font-semibold text-brand">India-first product discovery</p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-navy sm:text-5xl">See what is climbing. Pay in rupees to move up.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-secondary">
            Browse startups, tools, and websites for free. Product owners can list without paying, or bid in INR for a clearly labelled position. Rank is the verified amount, not a review.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link className="inline-flex h-11 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white" href="/leaderboard">View the leaderboard</Link>
            <Link className="inline-flex h-11 items-center justify-center rounded-lg border border-line px-4 text-sm font-semibold" href="/submit">Submit a product</Link>
          </div>
        </div>
        <Card className="bg-muted">
          <h2 className="text-lg font-semibold">How a paid position works</h2>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-secondary">
            <li><span className="font-semibold text-navy">1. List for free.</span> Approved listings stay visible after the paid rows.</li>
            <li><span className="font-semibold text-navy">2. Bid in INR.</span> A higher verified amount ranks above a lower one.</li>
            <li><span className="font-semibold text-navy">3. Ties are public.</span> The earlier confirmation wins, then the listing id.</li>
          </ol>
        </Card>
      </section>
      <Suspense fallback={<Skeleton className="mt-8 h-64" />}>
        <HomeData />
      </Suspense>
    </>
  );
}

async function HomeData() {
  await connection();
  try {
    const services = getServices();
    const [stats, categories, board, recent, trending, sponsored] = await Promise.all([
      services.analytics.platform(),
      services.categories.list(),
      services.leaderboards.get({ type: "daily", key: utcDayKey(new Date()) }, 1, 5),
      services.products.listRecent(4),
      services.products.listTrending(4),
      services.admin.sponsored().catch(() => []),
    ]);
    const liveSponsored = sponsored.filter((item) => item.active);
    return (
      <div className="mt-10 space-y-10">
        <dl className="grid grid-cols-3 gap-3">
          {[
            ["Approved listings", stats.approvedListings],
            ["Categories", stats.categories],
            ["All-time paid spots", stats.paidPlacements],
          ].map(([label, value]) => (
            <Card key={String(label)}>
              <dt className="text-xs text-secondary">{label}</dt>
              <dd className="mt-1 text-2xl font-semibold">{value}</dd>
            </Card>
          ))}
        </dl>
        <section>
          <h2 className="text-xl font-semibold">Categories</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link key={category.id} className="rounded-full border border-line bg-surface px-3 py-2 text-sm hover:bg-muted" href={`/categories/${category.slug}`}>
                {category.name}
              </Link>
            ))}
          </div>
        </section>
        {liveSponsored.length > 0 ? (
          <section>
            <h2 className="text-xl font-semibold">Sponsored</h2>
            <p className="mt-1 text-sm text-secondary">A sponsored card is bought placement. It is not a leaderboard rank.</p>
            <ul className="mt-4 grid gap-3">
              {liveSponsored.slice(0, 2).map((item) => (
                <li key={item.id}><Badge tone="paid">Sponsored</Badge> <span className="ml-2 font-semibold">{item.productName}</span></li>
              ))}
            </ul>
          </section>
        ) : null}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-semibold">Today</h2>
            <Link className="text-sm font-semibold text-brand" href="/leaderboard/today">Full board</Link>
          </div>
          <div className="grid gap-3">
            {board.entries.slice(0, 5).map((entry) => <ProductCard key={entry.id} product={entry} showRank={entry.placement === "paid"} />)}
          </div>
          <p className="mt-3 text-xs text-secondary">UTC day {board.scope.key}. Highest verified bid: {board.entries.find((entry) => entry.amountPaise)?.amountPaise ? formatInrFromPaise(board.entries.find((entry) => entry.amountPaise)?.amountPaise ?? 0) : "none yet"}.</p>
        </section>
        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-semibold">Recently added</h2>
            <div className="grid gap-3">{recent.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          </div>
          <div>
            <h2 className="mb-1 text-xl font-semibold">Trending</h2>
            <p className="mb-4 text-sm text-secondary">Ordered by outbound clicks over the last 7 days.</p>
            {trending.length === 0 ? <p className="text-sm text-secondary">Not enough click data yet.</p> : <div className="grid gap-3">{trending.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
          </div>
        </section>
      </div>
    );
  } catch (error) {
    return <Alert>{toPublicError(error).message}</Alert>;
  }
}
