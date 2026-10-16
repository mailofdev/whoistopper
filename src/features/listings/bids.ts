import "server-only";

import { openGatewayOrder } from "@/features/payments/gateway";
import { resolvePaymentRuntime } from "@/features/payments/runtime";
import { createSupabaseAdminClient } from "@/lib/supabase/clients";

/** Opens a pending ranking order. The amount is the server value, never a client status. */
export async function openListingBid(input: {
  productId: string;
  amountPaise: number;
  scopeType: "all_time" | "daily" | "category";
  scopeKey: string;
}): Promise<{ ok: true; href: string } | { ok: false; error: string }> {
  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false, error: "The directory database is not connected, so this rank cannot be saved yet." };
  const runtime = resolvePaymentRuntime();
  if (runtime.mode === "unconfigured") return { ok: false, error: "Payments are not configured, so a rank cannot be purchased yet." };

  const created = await admin.from("payment_orders").insert({
    user_id: null,
    product_id: input.productId,
    provider: runtime.mode === "live" ? "razorpay" : "sandbox",
    amount_paise: input.amountPaise,
    currency: "INR",
    purpose: "ranking_upgrade",
    scope_type: input.scopeType,
    scope_key: input.scopeKey,
    status: "pending",
    fulfillment: "pending",
    idempotency_key: crypto.randomUUID(),
  }).select("id").single();
  if (created.error || !created.data) return { ok: false, error: "Could not open the payment." };

  try {
    const gateway = await openGatewayOrder({
      receipt: created.data.id,
      amountPaise: input.amountPaise,
      notes: { productId: input.productId, scope: input.scopeType },
    });
    await admin.from("payment_orders").update({ provider: gateway.provider, provider_order_id: gateway.providerOrderId }).eq("id", created.data.id);
  } catch {
    return { ok: false, error: "The payment provider did not open this order." };
  }
  return { ok: true, href: runtime.mode === "sandbox" ? `/payments/sandbox/${created.data.id}` : `/payments/checkout/${created.data.id}` };
}
