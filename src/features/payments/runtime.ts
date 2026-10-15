import { readRazorpayConfig, readServerEnv, type ServerEnv } from "@/config/env";

export type PaymentRuntime =
  | { mode: "sandbox"; provider: "sandbox" }
  | { mode: "live"; provider: "razorpay"; keyId: string }
  | { mode: "unconfigured" };

/** Sandbox completion never runs in production, even if PAYMENT_MODE=sandbox. */
export function resolvePaymentRuntime(env: ServerEnv = readServerEnv()): PaymentRuntime {
  const razorpay = readRazorpayConfig(env);
  if (env.NODE_ENV === "production") {
    if (!razorpay || env.PAYMENT_MODE === "sandbox") return { mode: "unconfigured" };
    return { mode: "live", provider: "razorpay", keyId: razorpay.keyId };
  }
  if (env.PAYMENT_MODE === "live" && razorpay) {
    return { mode: "live", provider: "razorpay", keyId: razorpay.keyId };
  }
  return { mode: "sandbox", provider: "sandbox" };
}

export function assertSandboxAllowed(env: ServerEnv = readServerEnv()): void {
  if (env.NODE_ENV === "production") {
    throw new Error("Sandbox payments are disabled in production.");
  }
  if (env.PAYMENT_MODE === "live" && readRazorpayConfig(env)) {
    throw new Error("Sandbox completion is disabled while live payment mode is on.");
  }
}
