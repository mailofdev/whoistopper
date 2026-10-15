import { NextResponse } from "next/server";
import { configurationGaps } from "@/config/env";
import { site } from "@/config/site";

export function GET() {
  return NextResponse.json(
    { ok: true, service: site.id, gaps: configurationGaps() },
    { headers: { "cache-control": "no-store" } },
  );
}
