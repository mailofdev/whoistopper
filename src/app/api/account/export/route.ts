import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/session";
import { toPublicError } from "@/lib/errors";
import { getServices } from "@/lib/services";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const data = await getServices().profiles.exportData(user);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": "attachment; filename=\"rankpush-export.json\"",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: toPublicError(error).message }, { status: 500 });
  }
}
