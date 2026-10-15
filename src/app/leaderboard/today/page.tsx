import { Suspense } from "react";
import { connection } from "next/server";
import { Board, todayScope } from "@/app/leaderboard/page";
import { Skeleton } from "@/components/ui/primitives";
import { pageMetadata } from "@/lib/metadata";
import { getServices } from "@/lib/services";
import type { LeaderboardScope } from "@/types/domain";

export const metadata = pageMetadata(
  "Today's leaderboard",
  "Daily paid positions reset at 00:00 UTC. Yesterday's bids stay in history and do not carry over.",
  "/leaderboard/today",
);

export default function TodayPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <TodayBoard searchParams={searchParams} />
    </Suspense>
  );
}

async function TodayBoard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  let scope: LeaderboardScope = todayScope();
  if (category) {
    try {
      const match = await getServices().categories.getBySlug(category);
      if (match) scope = { type: "category", key: match.id };
    } catch {
      scope = todayScope();
    }
  }
  return <Board scope={scope} period="daily" categorySlug={category} searchParams={searchParams} />;
}
