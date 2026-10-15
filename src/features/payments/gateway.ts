import { isMockDataEnabled } from "@/config/data-source";
import { AppError } from "@/lib/errors";
import { readRazorpayConfig, readServerEnv } from "@/config/env";
import { resolvePaymentRuntime } from "@/features/payments/runtime";

export interface GatewayOrder {
  provider: "razorpay" | "sandbox";
  providerOrderId: string;
  publishableKeyId: string | null;
  sandbox: boolean;
}

export async function openGatewayOrder(input: {
  receipt: string;
  amountPaise: number;
  notes: Record<string, string>;
}): Promise<GatewayOrder> {
  const runtime = resolvePaymentRuntime();
  if (runtime.mode === "unconfigured") {
    throw new AppError("Payments are not configured for this environment.", "payments_unconfigured", 503);
  }
  if (runtime.mode === "sandbox") {
    if (!isMockDataEnabled() && readServerEnv().NODE_ENV === "production") {
      throw new AppError("Sandbox payments are disabled in production.", "sandbox_disabled", 403);
    }
    return {
      provider: "sandbox",
      providerOrderId: `sandbox_${input.receipt}`,
      publishableKeyId: null,
      sandbox: true,
    };
  }
  const keys = readRazorpayConfig();
  if (!keys) {
    throw new AppError("Payments are not configured for this environment.", "payments_unconfigured", 503);
  }
  const { default: Razorpay } = await import("razorpay");
  const client = new Razorpay({ key_id: keys.keyId, key_secret: keys.keySecret });
  const order = await client.orders.create({
    amount: input.amountPaise,
    currency: "INR",
    receipt: input.receipt.slice(0, 40),
    notes: input.notes,
  });
  return {
    provider: "razorpay",
    providerOrderId: order.id,
    publishableKeyId: keys.keyId,
    sandbox: false,
  };
}
