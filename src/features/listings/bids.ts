import "server-only";

/** Amount-based rank purchases are closed. Advertising packages use openPackageCheckout. */
export async function openListingBid(): Promise<{ ok: false; error: string }> {
  return { ok: false, error: "Rank purchases are closed. Choose a fixed advertising package." };
}
