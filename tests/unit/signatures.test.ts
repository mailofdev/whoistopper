import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { verifyCashfreeSignature, verifyRazorpaySignature } from "@/features/payments/signature";
import { createHmac } from "node:crypto";

describe("webhook signatures", () => {
  it("accepts a Razorpay hex signature and rejects a mismatch", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const secret = "test-webhook-secret";
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyRazorpaySignature(body, signature, secret)).toBe(true);
    expect(verifyRazorpaySignature(body, signature, "other")).toBe(false);
    expect(verifyRazorpaySignature(body, "", secret)).toBe(false);
  });

  it("accepts a Cashfree timestamp signature", () => {
    const body = "{\"type\":\"PAYMENT_SUCCESS_WEBHOOK\"}";
    const secret = "cashfree-test";
    const timestamp = "1710000000";
    const signature = createHmac("sha256", secret).update(`${timestamp}${body}`).digest("base64");
    expect(verifyCashfreeSignature(body, timestamp, signature, secret)).toBe(true);
    expect(verifyCashfreeSignature(body, "1710000001", signature, secret)).toBe(false);
  });

  it("keeps the SQL rank order aligned with the ranking engine", () => {
    const sql = readFileSync("supabase/migrations/20261015120100_ranking_and_payments.sql", "utf8");
    expect(sql).toContain("amount_paise desc, pl.confirmed_at asc, p.id asc");
  });
});
