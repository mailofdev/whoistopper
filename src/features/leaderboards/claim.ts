"use server";

import { connection } from "next/server";

export async function claimRankAction(): Promise<{ ok: false; error: string }> {
  await connection();
  return {
    ok: false,
    error: "Rank claims are closed. Choose a fixed advertising package from the submission form. Paying more does not move another listing.",
  };
}
