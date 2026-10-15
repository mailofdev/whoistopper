import { NextResponse } from "next/server";
import { configurationGaps } from "@/config/env";

export function GET() {
  return NextResponse.json(
    { ok: true, service: "who-is-topper", gaps: configurationGaps() },
    { headers: { "cache-control": "no-store" } },
  );
}
