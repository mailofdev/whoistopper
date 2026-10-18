import { NextResponse } from "next/server";
import { shiftIstDay } from "@/features/leaderboards/engine";
import { log } from "@/lib/logging/logger";
import { getServices } from "@/lib/services";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const day = shiftIstDay(new Date(), -1);
  try {
    await getServices().admin.snapshotDaily(day);
    try {
      const { createSupabaseAdminClient } = await import("@/lib/supabase/clients");
      const admin = createSupabaseAdminClient();
      if (admin) await admin.rpc("expire_ad_campaigns");
    } catch (expireError) {
      log("error", "cron.expire", { error: expireError instanceof Error ? expireError.message : "unknown" });
    }
    return NextResponse.json({ ok: true, day });
  } catch (error) {
    log("error", "cron.daily", { error: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "Snapshot failed." }, { status: 500 });
  }
}
