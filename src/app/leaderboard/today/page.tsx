import { Suspense } from "react";
import { connection } from "next/server";
import { Board, todayScope } from "@/app/leaderboard/page";
import { Skeleton } from "@/components/ui/primitives";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Today's leaderboard",
  "Daily paid positions reset at 00:00 UTC. Yesterday's bids stay in history and do not carry over.",
  "/leaderboard/today",
);

export default function TodayPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <TodayBoard searchParams={searchParams} />
    </Suspense>
  );
}

async function TodayBoard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  return <Board scope={todayScope()} path="/leaderboard/today" searchParams={searchParams} />;
}
