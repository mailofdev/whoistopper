"use server";

import { revalidatePath } from "next/cache";
import { assertSandboxAllowed } from "@/features/payments/runtime";
import { getCurrentUser } from "@/features/auth/session";
import { toPublicError } from "@/lib/errors";
import { getServices } from "@/lib/services";
import { createSupabaseAdminClient } from "@/lib/supabase/clients";
import { openPackageCheckout } from "@/features/payments/packages";
import { upgradeSchema } from "@/lib/validation/schemas";

export async function previewUpgradeAction() {
  return { ok: false as const, error: "Rank previews are closed. Choose a fixed advertising package." };
}

export async function createUpgradeAction(input: unknown) {
  const parsed = upgradeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Choose an advertising package." };
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false as const, error: "Sign in to buy an advertising package." };
    const product = await getServices().products.getManageable(user, parsed.data.productId);
    if (!product) return { ok: false as const, error: "That listing is not available." };
    const opened = await openPackageCheckout({
      productId: product.id,
      packageSlug: parsed.data.packageSlug,
      categoryId: product.categoryId,
      userId: user.id,
      clientPricePaise: parsed.data.clientPricePaise,
    });
    if (!opened.ok) return opened;
    revalidatePath("/");
    return { ok: true as const, href: opened.href, pricePaise: opened.pricePaise };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

export async function sandboxOutcomeAction(orderId: string, outcome: "success" | "failed" | "cancelled") {
  try {
    assertSandboxAllowed();
    const admin = createSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "The directory database is not connected." };
    const loaded = await admin.from("payment_orders").select("id, user_id, provider_order_id, amount_paise, product_id").eq("id", orderId).maybeSingle();
    if (!loaded.data?.provider_order_id) return { ok: false as const, error: "This payment is not open." };
    const user = await getCurrentUser();
    if (loaded.data.user_id && user?.id !== loaded.data.user_id) {
      return { ok: false as const, error: "This payment belongs to another session." };
    }
    if (process.env.NODE_ENV !== "production") {
      await admin.from("platform_settings").upsert({ key: "payments", value: { allowSandbox: true } });
    }
    const type = outcome === "success" ? "payment.captured" : outcome === "failed" ? "payment.failed" : "payment.cancelled";
    const result = await getServices().payments.applyProviderEvent({
      provider: "sandbox",
      eventId: `sandbox_${orderId}_${outcome}_${crypto.randomUUID()}`,
      type,
      providerOrderId: loaded.data.provider_order_id,
      providerPaymentId: outcome === "success" ? `pay_${orderId}` : undefined,
      amountPaise: Number(loaded.data.amount_paise),
      currency: "INR",
    });
    if (outcome === "success") {
      await admin.from("products").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", loaded.data.product_id).in("status", ["pending_review", "draft"]);
    }
    revalidatePath("/");
    revalidatePath("/leaderboard");
    revalidatePath("/leaderboard/today");
    return { ok: true as const, result };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

export async function cancelOrderAction(orderId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false as const, error: "Sign in to cancel a payment." };
    await getServices().payments.cancel(user, orderId);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}
