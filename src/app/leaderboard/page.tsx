import { Suspense } from "react";
import { connection } from "next/server";
import { PublicBoard } from "@/components/leaderboard/public-board";
import { Skeleton } from "@/components/ui/primitives";
import { utcDayKey } from "@/features/leaderboards/engine";
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
  return <Board scope={{ type: "all_time", key: "all_time" }} period="all_time" searchParams={searchParams} />;
}

export async function Board({
  scope,
  period,
  categorySlug,
  searchParams,
}: {
  scope: LeaderboardScope;
  period: "all_time" | "daily";
  categorySlug?: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await searchParams;
  let entries: LeaderboardEntry[] = [];
  let today: LeaderboardEntry[] = [];
  let categories: Category[] = [];
  let notice: string | undefined;
  try {
    const services = getServices();
    categories = (await services.categories.list()).filter((category) => category.isActive);
    entries = (await services.leaderboards.get(scope, 1, 48)).entries;
    if (period === "all_time") {
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
      key={`${scope.type}:${scope.key}:${categorySlug ?? ""}`}
      entries={entries}
      today={today}
      categories={categories}
      scope={period}
      category={categorySlug}
      bidding={scope.type}
      notice={notice}
    />
  );
}

export function todayScope(): LeaderboardScope {
  return { type: "daily", key: utcDayKey(new Date()) };
}
