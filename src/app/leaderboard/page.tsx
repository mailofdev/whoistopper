import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/products/product-card";
import { Alert, EmptyState, PageHeader, Pagination, Skeleton } from "@/components/ui/primitives";
import { utcDayKey } from "@/features/leaderboards/engine";
import { toPublicError } from "@/lib/errors";
import { pageMetadata } from "@/lib/metadata";
import { parsePage } from "@/lib/pagination";
import { getServices } from "@/lib/services";
import type { LeaderboardScope } from "@/types/domain";

export const metadata = pageMetadata(
  "All-time leaderboard",
  "Paid positions ordered by verified INR amount. Free listings follow and are not a quality score.",
  "/leaderboard",
);

export default function LeaderboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <Board scope={{ type: "all_time", key: "all_time" }} path="/leaderboard" searchParams={searchParams} />
    </Suspense>
  );
}

export async function Board({
  scope,
  path,
  searchParams,
}: {
  scope: LeaderboardScope;
  path: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  try {
    const params = await searchParams;
    const page = parsePage(params.page);
    const board = await getServices().leaderboards.get(scope, page, 12);
    return (
      <>
        <PageHeader eyebrow="Transparent ranking" title={board.title} description={board.description} />
        {board.entries.length === 0 ? (
          <EmptyState title="No listings yet" body="Approved products will appear here. Paid rows show up only after a verified payment." />
        ) : (
          <div className="grid gap-3">
            {board.entries.map((entry) => <ProductCard key={entry.id} product={entry} showRank={entry.placement === "paid"} />)}
          </div>
        )}
        <Pagination page={board.page} total={board.total} pageSize={board.pageSize} hrefFor={(next) => `${path}?page=${next}`} />
        <p className="mt-6 text-sm text-secondary">
          <Link className="font-semibold text-brand" href="/rules">Read the ranking rules</Link>
        </p>
      </>
    );
  } catch (error) {
    return <Alert>{toPublicError(error).message}</Alert>;
  }
}

export function todayScope(): LeaderboardScope {
  return { type: "daily", key: utcDayKey(new Date()) };
}
