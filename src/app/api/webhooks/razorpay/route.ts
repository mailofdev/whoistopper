import { NextResponse } from "next/server";
import { readRazorpayConfig } from "@/config/env";
import { verifyRazorpaySignature } from "@/features/payments/signature";
import { log } from "@/lib/logging/logger";
import { getServices } from "@/lib/services";
import type { ProviderEventInput } from "@/types/domain";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const config = readRazorpayConfig();
  if (!config) return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
  if (!verifyRazorpaySignature(raw, signature, config.webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  const event = mapRazorpay(body, request.headers.get("x-razorpay-event-id"));
  if (!event) return NextResponse.json({ ok: true, ignored: true });
  try {
    const result = await getServices().payments.applyProviderEvent(event);
    return NextResponse.json({ ok: true, duplicate: result.duplicate, status: result.status });
  } catch (error) {
    log("error", "razorpay.webhook", { error: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "The event could not be applied." }, { status: 500 });
  }
}

function mapRazorpay(body: unknown, headerId: string | null): ProviderEventInput | null {
  if (!body || typeof body !== "object") return null;
  const record = body as { event?: string; payload?: { payment?: { entity?: Record<string, unknown> }; refund?: { entity?: Record<string, unknown> } } };
  const name = record.event ?? "";
  const payment = record.payload?.payment?.entity;
  const refund = record.payload?.refund?.entity;
  const entity = name.startsWith("refund") ? refund : payment;
  if (!entity) return null;
  const type = name === "payment.captured" || name === "order.paid"
    ? "payment.captured"
    : name === "payment.failed"
      ? "payment.failed"
      : name === "refund.processed"
        ? "refund.processed"
        : null;
  if (!type) return null;
  const providerOrderId = String(entity.order_id ?? "");
  if (!providerOrderId) return null;
  const providerPaymentId = String(entity.id ?? entity.payment_id ?? "");
  return {
    provider: "razorpay",
    eventId: headerId || `${name}:${providerPaymentId || providerOrderId}`,
    type,
    providerOrderId,
    providerPaymentId: providerPaymentId || undefined,
    amountPaise: typeof entity.amount === "number" ? entity.amount : undefined,
    currency: typeof entity.currency === "string" ? entity.currency : undefined,
  };
}
