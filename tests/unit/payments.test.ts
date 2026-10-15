import { describe, expect, it } from "vitest";
import { decideProviderEvent } from "@/features/payments/state-machine";
import { PaymentIntegrityError } from "@/lib/errors";
import { verifyCashfreeSignature, verifyRazorpaySignature } from "@/features/payments/signature";
import { createHmac } from "node:crypto";
import { findReconciliationIssues } from "@/features/payments/reconcile";
import { assertSandboxAllowed, resolvePaymentRuntime } from "@/features/payments/runtime";
import type { OrderDetail } from "@/types/domain";

const order: Pick<OrderDetail, "id" | "status" | "amountPaise" | "currency" | "purpose" | "providerPaymentId" | "fulfillment"> = {
  id: "40000000-0000-4000-8000-000000000001",
  status: "pending",
  amountPaise: 9900,
  currency: "INR",
  purpose: "ranking_upgrade",
  providerPaymentId: null,
  fulfillment: "pending",
};

describe("payment integrity", () => {
  it("captures once and treats the same event as a duplicate", () => {
    const event = {
      provider: "razorpay" as const,
      eventId: "evt_1",
      type: "payment.captured" as const,
      providerOrderId: "order_1",
      providerPaymentId: "pay_1",
      amountPaise: 9900,
      currency: "INR",
    };
    const first = decideProviderEvent(order, event, new Set(), "2026-10-15T00:00:00.000Z");
    expect(first.allocateRank).toBe(true);
    expect(first.ledger?.entryType).toBe("charge");
    const second = decideProviderEvent(
      { ...order, status: "paid", providerPaymentId: "pay_1" },
      event,
      new Set(["evt_1"]),
      "2026-10-15T00:00:01.000Z",
    );
    expect(second.duplicate).toBe(true);
    expect(second.allocateRank).toBe(false);
  });

  it("rejects a mismatched amount and an out-of-order refund", () => {
    expect(() => decideProviderEvent(order, {
      provider: "razorpay",
      eventId: "evt_bad",
      type: "payment.captured",
      providerOrderId: "order_1",
      providerPaymentId: "pay_2",
      amountPaise: 100,
      currency: "INR",
    }, new Set(), "2026-10-15T00:00:00.000Z")).toThrow(PaymentIntegrityError);
    expect(() => decideProviderEvent(order, {
      provider: "razorpay",
      eventId: "evt_refund",
      type: "refund.processed",
      providerOrderId: "order_1",
      amountPaise: 9900,
      currency: "INR",
    }, new Set(), "2026-10-15T00:00:00.000Z")).toThrow(/before a verified payment/);
  });

  it("ignores a failure that arrives after a verified payment", () => {
    const decision = decideProviderEvent(
      { ...order, status: "paid", providerPaymentId: "pay_1" },
      { provider: "razorpay", eventId: "evt_fail", type: "payment.failed", providerOrderId: "order_1" },
      new Set(),
      "2026-10-15T00:00:00.000Z",
    );
    expect(decision.ignored).toBe(true);
    expect(decision.status).toBe("paid");
  });

  it("verifies Razorpay and Cashfree signatures", () => {
    const body = JSON.stringify({ ok: true });
    const secret = "whsec_test";
    const razorpay = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyRazorpaySignature(body, razorpay, secret)).toBe(true);
    expect(verifyRazorpaySignature(body, "nope", secret)).toBe(false);
    const timestamp = "1700000000";
    const cashfree = createHmac("sha256", secret).update(`${timestamp}${body}`).digest("base64");
    expect(verifyCashfreeSignature(body, timestamp, cashfree, secret)).toBe(true);
    expect(verifyCashfreeSignature(body, timestamp, cashfree, "other")).toBe(false);
  });

  it("keeps sandbox completion out of production", () => {
    expect(resolvePaymentRuntime({ NODE_ENV: "production", PAYMENT_MODE: "sandbox" }).mode).toBe("unconfigured");
    expect(resolvePaymentRuntime({
      NODE_ENV: "production",
      PAYMENT_MODE: "live",
      NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_live_x",
      RAZORPAY_KEY_SECRET: "secret",
      RAZORPAY_WEBHOOK_SECRET: "whsec",
    }).mode).toBe("live");
    expect(() => assertSandboxAllowed({ NODE_ENV: "production" })).toThrow(/production/);
  });

  it("flags a paid order with no ledger charge", () => {
    const issues = findReconciliationIssues([{
      ...order,
      userId: "u",
      productId: "p",
      productName: "Nadi",
      productSlug: "nadi",
      provider: "sandbox",
      providerOrderId: "o",
      scopeType: "all_time",
      scopeKey: "all_time",
      quotedRank: 1,
      finalRank: 1,
      status: "paid",
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
      paidAt: "2026-10-01T00:00:00.000Z",
    }], []);
    expect(issues.map((issue) => issue.code)).toContain("missing_charge");
  });
});
