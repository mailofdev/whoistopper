import { NextResponse } from "next/server";
import { verifyCashfreeSignature } from "@/features/payments/signature";
import { log } from "@/lib/logging/logger";
import { getServices } from "@/lib/services";
import type { ProviderEventInput } from "@/types/domain";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-webhook-signature") ?? "";
  const timestamp = request.headers.get("x-webhook-timestamp") ?? "";
  const secret = process.env.CASHFREE_WEBHOOK_SECRET ?? "";
  if (!secret) return NextResponse.json({ error: "Cashfree is not configured." }, { status: 503 });
  if (!verifyCashfreeSignature(raw, timestamp, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  const event = mapCashfree(body);
  if (!event) return NextResponse.json({ ok: true, ignored: true });
  try {
    const result = await getServices().payments.applyProviderEvent(event);
    return NextResponse.json({ ok: true, duplicate: result.duplicate, status: result.status });
  } catch (error) {
    log("error", "cashfree.webhook", { error: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "The event could not be applied." }, { status: 500 });
  }
}

function mapCashfree(body: unknown): ProviderEventInput | null {
  if (!body || typeof body !== "object") return null;
  const record = body as { type?: string; data?: { order?: { order_id?: string }; payment?: { cf_payment_id?: string; payment_amount?: number; payment_currency?: string; payment_status?: string } } };
  const status = record.data?.payment?.payment_status ?? "";
  const type = status === "SUCCESS" ? "payment.captured" : status === "FAILED" || status === "USER_DROPPED" ? "payment.failed" : status === "VOID" ? "payment.cancelled" : null;
  const providerOrderId = record.data?.order?.order_id ?? "";
  if (!type || !providerOrderId) return null;
  const paymentId = String(record.data?.payment?.cf_payment_id ?? "");
  const amount = record.data?.payment?.payment_amount;
  return {
    provider: "cashfree",
    eventId: `${record.type ?? status}:${paymentId || providerOrderId}`,
    type,
    providerOrderId,
    providerPaymentId: paymentId || undefined,
    amountPaise: typeof amount === "number" ? Math.round(amount * 100) : undefined,
    currency: record.data?.payment?.payment_currency,
  };
}
