import "server-only";

import { PACKAGE_DEFAULTS, priceForCheckout, type AdPackageDefinition, type PackageSlug } from "@/config/packages";
import { campaignWindow } from "@/features/campaigns/schedule";
import { openGatewayOrder } from "@/features/payments/gateway";
import { resolvePaymentRuntime } from "@/features/payments/runtime";
import { liveAdvertisingApproved } from "@/config/env";
import { createSupabaseAdminClient, createSupabaseAnonClient } from "@/lib/supabase/clients";

export async function listAdPackages(): Promise<AdPackageDefinition[]> {
  const client = createSupabaseAnonClient();
  if (!client) return [...PACKAGE_DEFAULTS];
  const { data, error } = await client
    .from("ad_packages")
    .select("slug, name, description, price_paise, duration_hours, placement, exclusive")
    .eq("is_active", true)
    .order("sort_order");
  if (error || !data?.length) return [...PACKAGE_DEFAULTS];
  const known = new Set(PACKAGE_DEFAULTS.map((item) => item.slug));
  return data.flatMap((row) => {
    if (!known.has(row.slug as PackageSlug)) return [];
    return [{
      slug: row.slug as PackageSlug,
      name: row.name,
      description: row.description,
      pricePaise: row.price_paise,
      durationHours: row.duration_hours,
      placement: row.placement,
      exclusive: row.exclusive,
    }];
  });
}

export async function openPackageCheckout(input: {
  productId: string;
  packageSlug: string;
  categoryId: string;
  userId?: string | null;
  clientPricePaise?: number;
}): Promise<{ ok: true; href: string; startsAt: string; endsAt: string; pricePaise: number } | { ok: false; error: string }> {
  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false, error: "The directory database is not connected, so this package cannot be purchased yet." };
  const runtime = resolvePaymentRuntime();
  if (runtime.mode === "unconfigured") return { ok: false, error: "Payments are not configured, so this package cannot be purchased yet." };
  if (runtime.mode === "live" && !liveAdvertisingApproved()) {
    return { ok: false, error: "Live payments stay off until the payment provider approves this advertising model." };
  }

  const loaded = await admin
    .from("ad_packages")
    .select("id, slug, price_paise, duration_hours, placement, exclusive, is_active")
    .eq("slug", input.packageSlug)
    .eq("is_active", true)
    .maybeSingle();
  if (!loaded.data) return { ok: false, error: "That advertising package is not available." };

  let pricePaise: number;
  try {
    pricePaise = priceForCheckout(Number(loaded.data.price_paise), input.clientPricePaise);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "The package price is set on the server." };
  }

  const placement = loaded.data.placement as AdPackageDefinition["placement"];
  const scopeType = placement === "daily_featured" ? "daily" : placement === "category_sponsor" ? "category" : "all_time";
  const scopeKey = placement === "category_sponsor" ? input.categoryId : placement === "daily_featured" ? "featured" : "directory";
  if (loaded.data.exclusive) {
    let overlap = admin.from("ad_campaigns").select("id").eq("placement", placement).in("status", ["scheduled", "active"]);
    if (placement === "category_sponsor") overlap = overlap.eq("category_id", input.categoryId);
    const existing = await overlap.limit(1);
    if (existing.data && existing.data.length > 0) {
      return { ok: false, error: "That exclusive placement is already sold for this period." };
    }
  }

  const quote = campaignWindow(new Date(), Number(loaded.data.duration_hours));
  const pending = await admin
    .from("payment_orders")
    .select("id, provider_order_id, provider")
    .eq("product_id", input.productId)
    .eq("package_id", loaded.data.id)
    .eq("status", "pending")
    .maybeSingle();
  let orderId = pending.data?.id ?? "";
  if (!orderId) {
    const created = await admin.from("payment_orders").insert({
      user_id: input.userId ?? null,
      product_id: input.productId,
      package_id: loaded.data.id,
      provider: runtime.mode === "live" ? "razorpay" : "sandbox",
      amount_paise: pricePaise,
      currency: "INR",
      purpose: "advertising_package",
      scope_type: scopeType,
      scope_key: scopeKey,
      quoted_starts_at: quote.startsAt,
      quoted_ends_at: quote.endsAt,
      status: "pending",
      fulfillment: "pending",
      idempotency_key: crypto.randomUUID(),
    }).select("id").single();
    if (created.error || !created.data) return { ok: false, error: "Could not open the payment. Apply the latest database migration if this is a new environment." };
    orderId = created.data.id;
  }

  try {
    const gateway = await openGatewayOrder({
      receipt: orderId,
      amountPaise: pricePaise,
      notes: { productId: input.productId, package: input.packageSlug },
    });
    await admin.from("payment_orders").update({ provider: gateway.provider, provider_order_id: gateway.providerOrderId }).eq("id", orderId);
  } catch {
    return { ok: false, error: "The payment provider did not open this order." };
  }
  const href = runtime.mode === "sandbox" ? `/payments/sandbox/${orderId}` : `/payments/checkout/${orderId}`;
  return { ok: true, href, startsAt: quote.startsAt, endsAt: quote.endsAt, pricePaise };
}
