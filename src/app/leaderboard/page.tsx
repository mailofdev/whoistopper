import { Suspense } from "react";
import { connection } from "next/server";
import { PublicBoard } from "@/components/leaderboard/public-board";
import { Skeleton } from "@/components/ui/primitives";
import { boardQuery } from "@/config/catalogue";
import { istDayKey } from "@/features/leaderboards/engine";
import { parsePage, parsePageSize } from "@/lib/pagination";
import { ConfigurationError, toPublicError } from "@/lib/errors";
import { pageMetadata } from "@/lib/metadata";
import { getServices } from "@/lib/services";
import type { Category, LeaderboardEntry, LeaderboardScope } from "@/types/domain";

export const metadata = pageMetadata(
  "All-time leaderboard",
  "Paid positions ordered by verified INR amount. A rank is the payment, not a review.",
  "/leaderboard",
);

export default function LeaderboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <AllTime searchParams={searchParams} />
    </Suspense>
  );
}

async function AllTime({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  return <Board scope={{ type: "all_time", key: "all_time" }} period="all_time" path="/leaderboard" searchParams={searchParams} />;
}

export async function Board({
  scope,
  period,
  categorySlug,
  path,
  searchParams,
}: {
  scope: LeaderboardScope;
  period: "all_time" | "daily";
  categorySlug?: string;
  path: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.pageSize, 20);
  const query = boardQuery(typeof params.q === "string" ? params.q : undefined);
  let entries: LeaderboardEntry[] = [];
  let today: LeaderboardEntry[] = [];
  let categories: Category[] = [];
  let total = 0;
  let notice: string | undefined;
  try {
    const services = getServices();
    categories = (await services.categories.list()).filter((category) => category.isActive);
    const categoryId = period === "daily" && categorySlug ? categories.find((category) => category.slug === categorySlug)?.id : undefined;
    const board = await services.leaderboards.get(scope, page, pageSize, { query, categoryId });
    entries = board.entries;
    total = board.total;
    if (period === "all_time" && scope.type !== "category") {
      try {
        today = (await services.leaderboards.get(todayScope(), 1, 9)).entries;
      } catch {
        today = [];
      }
    }
  } catch (error) {
    notice = error instanceof ConfigurationError
      ? "The directory is not connected to a database yet, so the board is empty. A rank is saved only after a verified payment."
      : toPublicError(error).message;
  }
  return (
    <PublicBoard
      key={`${scope.type}:${scope.key}:${categorySlug ?? ""}:${query}:${page}`}
      entries={entries}
      today={today}
      categories={categories}
      scope={period}
      category={categorySlug}
      bidding={scope.type}
      notice={notice}
      page={page}
      pageSize={pageSize}
      total={total}
      query={query}
      path={path}
    />
  );
}

export function todayScope(): LeaderboardScope {
  return { type: "daily", key: istDayKey(new Date()) };
}
