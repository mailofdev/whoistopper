import { NextResponse } from "next/server";

function home(request: Request) {
  return NextResponse.redirect(new URL("/?paid=1", request.url), {
    status: 303,
    headers: { "cache-control": "no-store" },
  });
}

export function GET(request: Request) {
  return home(request);
}

export async function POST(request: Request) {
  await request.formData().catch(() => undefined);
  return home(request);
}
