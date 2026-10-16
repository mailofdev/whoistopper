import { Suspense } from "react";
import { connection } from "next/server";
import { Board } from "@/app/leaderboard/page";
import { Skeleton } from "@/components/ui/primitives";
import { utcDayKey } from "@/features/leaderboards/engine";
import { getServices } from "@/lib/services";
import type { LeaderboardScope } from "@/types/domain";

export default function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <HomeBoard searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeBoard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const daily = params.scope === "today";
  let scope: LeaderboardScope = daily
    ? { type: "daily", key: utcDayKey(new Date()) }
    : { type: "all_time", key: "all_time" };
  if (category && !daily) {
    try {
      const match = await getServices().categories.getBySlug(category);
      if (match) scope = { type: "category", key: match.id };
    } catch {
      scope = { type: "all_time", key: "all_time" };
    }
  }
  return <Board scope={scope} categorySlug={category} period={daily ? "daily" : "all_time"} searchParams={searchParams} />;
}
