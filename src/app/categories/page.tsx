import Link from "next/link";
import { Suspense } from "react";
import { ListingMark, listingWhen } from "@/components/leaderboard/listing-meta";
import { Alert, Skeleton } from "@/components/ui/primitives";
import { toPublicError } from "@/lib/errors";
import { formatInrFromPaise } from "@/lib/money";
import { pageMetadata } from "@/lib/metadata";
import { getServices } from "@/lib/services";
import type { Category, LeaderboardEntry } from "@/types/domain";

export const metadata = pageMetadata(
  "Categories",
  "Every category has its own ranking. Pick one to see who leads it.",
  "/categories",
);

export default function CategoriesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <CategoryList />
    </Suspense>
  );
}

async function CategoryList() {
  try {
    const services = getServices();
    const categories = (await services.categories.list()).filter((category) => category.isActive);
    const boards = await Promise.all(categories.map(async (category) => {
      const board = await services.leaderboards.get({ type: "category", key: category.id }, 1, 8);
      const paid = board.entries.filter((entry) => entry.placement === "paid" && entry.rank);
      return { category, paid: paid.slice(0, 3), paidCount: board.paidCount, leader: paid[0] };
    }));
    const active = [...boards].filter((board) => board.paidCount > 0).sort((a, b) => b.paidCount - a.paidCount || a.category.sortOrder - b.category.sortOrder).slice(0, 3);
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-4xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-3 text-secondary">Every category has its own ranking. Pick one to see who leads it.</p>
        </header>
        {active.length > 0 ? (
          <section className="glass rounded-3xl p-4 sm:p-5">
            <h2 className="text-sm font-semibold">Most active categories</h2>
            <p className="mt-1 text-sm text-secondary">Where ranks are getting claimed right now, and who is holding the top spot.</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {active.map((board, index) => (
                <ActiveCard key={board.category.id} place={index + 1} category={board.category} leader={board.leader} paidCount={board.paidCount} />
              ))}
            </div>
          </section>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {boards.map((board) => (
            <section key={board.category.id} className="glass rounded-3xl p-4">
              <h2 className="font-semibold">
                <Link className="hover:text-brand" href={`/categories/${board.category.slug}`}>{board.category.name}</Link>
              </h2>
              {board.paid.length === 0 ? (
                <p className="mt-4 text-sm text-secondary">No paid ranks yet.</p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {board.paid.map((entry) => (
                    <li key={entry.id} className="flex items-center gap-2 text-sm">
                      <span className="w-6 shrink-0 text-xs text-secondary">#{entry.rank}</span>
                      <ListingMark name={entry.name} logoUrl={entry.logoUrl} compact />
                      <a className="min-w-0 flex-1 truncate hover:text-brand" href={`/out/${entry.slug}`} target="_blank" rel="noopener noreferrer">{entry.name}</a>
                      <span className="shrink-0 font-medium text-brand">{entry.amountPaise ? formatInrFromPaise(entry.amountPaise) : ""}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    return <Alert>{toPublicError(error).message}</Alert>;
  }
}

function ActiveCard({
  place,
  category,
  leader,
  paidCount,
}: {
  place: number;
  category: Category;
  leader?: LeaderboardEntry;
  paidCount: number;
}) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">#{place}{place === 1 ? " hottest" : ""}</p>
      <h3 className="mt-1 font-semibold">
        <Link className="hover:text-brand" href={`/categories/${category.slug}`}>{category.name}</Link>
      </h3>
      <p className="mt-3 text-sm text-secondary">
        {paidCount} claim{paidCount === 1 ? "" : "s"}
        {leader ? <span> · {listingWhen(leader)}</span> : null}
      </p>
      {leader ? (
        <p className="mt-3 flex items-center gap-2 text-sm">
          <ListingMark name={leader.name} logoUrl={leader.logoUrl} compact />
          <span className="min-w-0 flex-1 truncate">Leading {leader.name}</span>
          <span className="shrink-0 font-medium text-brand">{leader.amountPaise ? formatInrFromPaise(leader.amountPaise) : ""}</span>
        </p>
      ) : null}
    </article>
  );
}
