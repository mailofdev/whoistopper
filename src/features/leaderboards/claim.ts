"use server";

import { connection } from "next/server";
import { istDayKey } from "@/features/leaderboards/engine";
import { openListingBid } from "@/features/listings/bids";
import { rupeesToPaise } from "@/lib/money";
import { createSupabaseAdminClient } from "@/lib/supabase/clients";
import { normalizeWebsiteUrl, slugify } from "@/lib/urls";

export async function claimRankAction(input: {
  website: string;
  amountRupees: number;
  scope: "all_time" | "daily";
  category: string;
  boardCategory?: string;
  termsAccepted: boolean;
}): Promise<{ ok: true; href: string } | { ok: false; error: string }> {
  await connection();
  if (input.termsAccepted !== true) {
    return { ok: false, error: "Confirm that you have read and agree to the Terms of Service." };
  }
  const raw = input.website.trim();
  const handle = raw.startsWith("@") ? raw.slice(1).replace(/[^a-zA-Z0-9_]/g, "") : "";
  const website = handle ? `https://x.com/${handle}` : raw;
  let normalized: string;
  try {
    normalized = normalizeWebsiteUrl(website);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Enter a product URL." };
  }
  const amountPaise = rupeesToPaise(input.amountRupees);
  if (!Number.isInteger(amountPaise) || amountPaise < 9900 || amountPaise > 100_000_000) {
    return { ok: false, error: "Enter an amount from ₹99 to ₹10,00,000. A matching amount ranks below the earlier payment, so add at least ₹1 to move above a listed rank." };
  }
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { ok: false, error: "The directory database is not connected, so this rank cannot be saved yet." };
  }
  const host = new URL(normalized).hostname.replace(/^www\./, "");
  const listing = await admin.from("categories").select("id").eq("slug", input.category).eq("is_active", true).maybeSingle();
  if (!listing.data) return { ok: false, error: "Choose a category." };
  const categoryId = listing.data.id;
  let scopeType: "all_time" | "daily" | "category" = input.scope;
  let scopeKey = input.scope === "daily" ? istDayKey(new Date()) : "all_time";
  const boardSlug = input.boardCategory?.trim();
  if (boardSlug) {
    const board = await admin.from("categories").select("id").eq("slug", boardSlug).eq("is_active", true).maybeSingle();
    if (!board.data) return { ok: false, error: "That category is not available." };
    scopeType = "category";
    scopeKey = board.data.id;
  }

  const existing = await admin.from("products").select("id").eq("normalized_url", normalized).maybeSingle();
  let productId = existing.data?.id ?? "";
  if (!productId) {
    const inserted = await admin.from("products").insert({
      slug: `${slugify(host)}-${crypto.randomUUID().slice(0, 8)}`,
      name: host,
      website_url: normalized,
      normalized_url: normalized,
      short_description: `${host} is listed by a public rank claim.`,
      full_description: `${host} is listed by a public rank claim. The rank follows the verified payment.`,
      category_id: categoryId,
      creator_name: host,
      status: "pending_review",
    }).select("id").single();
    if (inserted.error || !inserted.data) return { ok: false, error: "Could not save this product link." };
    productId = inserted.data.id;
  }

  const current = await admin
    .from("ranking_placements")
    .select("amount_paise")
    .eq("product_id", productId)
    .eq("scope_type", scopeType)
    .eq("scope_key", scopeKey)
    .eq("status", "active")
    .maybeSingle();
  if (current.data && amountPaise < Number(current.data.amount_paise) + 1000) {
    return { ok: false, error: "Raise this product by at least ₹10 above its current amount. A smaller payment does not lower a rank." };
  }

  const opened = await openListingBid({ productId, amountPaise, scopeType, scopeKey });
  if (!opened.ok) {
    return { ok: false, error: opened.error === "Could not open the payment." ? "Could not open the payment. Apply the latest database migration so a rank can be claimed without an account." : opened.error };
  }
  return { ok: true, href: opened.href };
}
