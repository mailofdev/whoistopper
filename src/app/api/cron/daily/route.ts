import { NextResponse } from "next/server";
import { utcDayKey } from "@/features/leaderboards/engine";
import { log } from "@/lib/logging/logger";
import { getServices } from "@/lib/services";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const day = utcDayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  try {
    await getServices().admin.snapshotDaily(day);
    return NextResponse.json({ ok: true, day });
  } catch (error) {
    log("error", "cron.daily", { error: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "Snapshot failed." }, { status: 500 });
  }
}
