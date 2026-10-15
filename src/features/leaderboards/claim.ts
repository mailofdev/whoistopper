"use server";

import { connection } from "next/server";
import { utcDayKey } from "@/features/leaderboards/engine";
import { openGatewayOrder } from "@/features/payments/gateway";
import { resolvePaymentRuntime } from "@/features/payments/runtime";
import { rupeesToPaise } from "@/lib/money";
import { createSupabaseAdminClient } from "@/lib/supabase/clients";
import { normalizeWebsiteUrl, slugify } from "@/lib/urls";

export async function claimRankAction(input: {
  website: string;
  amountRupees: number;
  scope: "all_time" | "daily";
  category?: string;
}): Promise<{ ok: true; href: string } | { ok: false; error: string }> {
  await connection();
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
  const runtime = resolvePaymentRuntime();
  if (runtime.mode === "unconfigured") {
    return { ok: false, error: "Payments are not configured, so a rank cannot be purchased yet." };
  }

  const host = new URL(normalized).hostname.replace(/^www\./, "");
  let categoryId = "";
  let scopeType: "all_time" | "daily" | "category" = input.scope;
  let scopeKey = input.scope === "daily" ? utcDayKey(new Date()) : "all_time";
  if (input.category) {
    const category = await admin.from("categories").select("id").eq("slug", input.category).eq("is_active", true).maybeSingle();
    if (!category.data) return { ok: false, error: "That category is not available." };
    categoryId = category.data.id;
    scopeType = "category";
    scopeKey = categoryId;
  } else {
    const category = await admin.from("categories").select("id").eq("is_active", true).order("sort_order").limit(1).maybeSingle();
    if (!category.data) return { ok: false, error: "Add a category before claiming a rank." };
    categoryId = category.data.id;
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

  const created = await admin.from("payment_orders").insert({
    user_id: null,
    product_id: productId,
    provider: runtime.mode === "live" ? "razorpay" : "sandbox",
    amount_paise: amountPaise,
    currency: "INR",
    purpose: "ranking_upgrade",
    scope_type: scopeType,
    scope_key: scopeKey,
    status: "pending",
    fulfillment: "pending",
    idempotency_key: crypto.randomUUID(),
  }).select("id").single();
  if (created.error || !created.data) {
    return { ok: false, error: "Could not open the payment. Apply the latest database migration so a rank can be claimed without an account." };
  }

  try {
    const gateway = await openGatewayOrder({
      receipt: created.data.id,
      amountPaise,
      notes: { productId, scope: scopeType },
    });
    await admin.from("payment_orders").update({ provider: gateway.provider, provider_order_id: gateway.providerOrderId }).eq("id", created.data.id);
  } catch {
    return { ok: false, error: "The payment provider did not open this order." };
  }

  return {
    ok: true,
    href: runtime.mode === "sandbox" ? `/payments/sandbox/${created.data.id}` : `/payments/checkout/${created.data.id}`,
  };
}
