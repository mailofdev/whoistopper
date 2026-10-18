import { Suspense } from "react";
import { connection } from "next/server";
import { Board, todayScope } from "@/app/leaderboard/page";
import { Skeleton } from "@/components/ui/primitives";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Today's featured ads",
  "Fixed-price advertisements whose 24-hour campaign is currently running. Times use Asia/Kolkata.",
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
  return <Board scope={todayScope()} period="daily" categorySlug={category} path="/leaderboard/today" searchParams={searchParams} />;
}
