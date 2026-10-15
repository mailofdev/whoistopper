"use server";

import { revalidatePath } from "next/cache";
import { assertSandboxAllowed } from "@/features/payments/runtime";
import { getCurrentUser } from "@/features/auth/session";
import { toPublicError } from "@/lib/errors";
import { getServices } from "@/lib/services";
import { createSupabaseAdminClient } from "@/lib/supabase/clients";
import { rupeesToPaise } from "@/lib/money";
import { upgradeSchema } from "@/lib/validation/schemas";
import type { ScopeType } from "@/types/domain";

export async function previewUpgradeAction(input: unknown) {
  const parsed = upgradeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Enter a valid amount." };
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false as const, error: "Sign in to preview a rank." };
    const preview = await getServices().leaderboards.preview(
      user,
      parsed.data.productId,
      parsed.data.scope,
      rupeesToPaise(parsed.data.amountRupees),
    );
    return { ok: true as const, preview };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

export async function createUpgradeAction(input: unknown) {
  const parsed = upgradeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Enter a valid amount." };
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false as const, error: "Sign in to pay for a rank." };
    const supplied = typeof input === "object" && input && "idempotencyKey" in input
      ? String((input as { idempotencyKey?: string }).idempotencyKey ?? "")
      : "";
    const idempotencyKey = /^[0-9a-f-]{36}$/i.test(supplied) ? supplied : crypto.randomUUID();
    const order = await getServices().payments.createRankingOrder(
      user,
      parsed.data.productId,
      parsed.data.scope as ScopeType,
      rupeesToPaise(parsed.data.amountRupees),
      idempotencyKey,
    );
    revalidatePath("/leaderboard");
    return { ok: true as const, order };
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
