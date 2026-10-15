import { PaymentIntegrityError } from "@/lib/errors";
import type { Fulfillment, LedgerEntry, OrderDetail, OrderStatus, ProviderEventInput } from "@/types/domain";

export interface EventDecision {
  status: OrderStatus;
  fulfillment: Fulfillment;
  duplicate: boolean;
  ignored: boolean;
  allocateRank: boolean;
  reverseRank: boolean;
  providerPaymentId: string | null;
  paidAt: string | null;
  ledger: Omit<LedgerEntry, "id" | "createdAt"> | null;
}

export function decideProviderEvent(
  order: Pick<OrderDetail, "id" | "status" | "amountPaise" | "currency" | "purpose" | "providerPaymentId" | "fulfillment">,
  event: ProviderEventInput,
  seenEventIds: ReadonlySet<string>,
  nowIso: string,
): EventDecision {
  const base = {
    status: order.status,
    fulfillment: order.fulfillment,
    duplicate: false,
    ignored: false,
    allocateRank: false,
    reverseRank: false,
    providerPaymentId: order.providerPaymentId,
    paidAt: null as string | null,
    ledger: null as EventDecision["ledger"],
  };

  if (seenEventIds.has(event.eventId)) {
    return { ...base, duplicate: true };
  }

  if (event.type === "payment.captured") {
    if (event.currency !== "INR" || event.amountPaise !== order.amountPaise) {
      throw new PaymentIntegrityError("Payment amount or currency does not match the order.");
    }
    if (!event.providerPaymentId) {
      throw new PaymentIntegrityError("Captured payment is missing a provider payment id.");
    }
    if (order.status === "paid" || order.status === "refunded") {
      if (order.providerPaymentId && order.providerPaymentId !== event.providerPaymentId) {
        throw new PaymentIntegrityError("This order was already paid with a different payment.");
      }
      return { ...base, duplicate: true };
    }
    if (order.status !== "pending") {
      throw new PaymentIntegrityError(`A ${order.status} order cannot be captured.`);
    }
    return {
      ...base,
      status: "paid",
      fulfillment: order.purpose === "ranking_upgrade" || order.purpose === "sponsored_placement" ? "pending" : "not_applicable",
      allocateRank: order.purpose === "ranking_upgrade",
      providerPaymentId: event.providerPaymentId,
      paidAt: nowIso,
      ledger: {
        orderId: order.id,
        entryType: "charge",
        amountPaise: order.amountPaise,
        currency: "INR",
        direction: "credit",
      },
    };
  }

  if (event.type === "payment.failed") {
    if (order.status === "paid" || order.status === "refunded") {
      return { ...base, ignored: true };
    }
    if (order.status === "failed") return { ...base, duplicate: true };
    if (order.status !== "pending") return { ...base, ignored: true };
    return { ...base, status: "failed", fulfillment: "not_applicable" };
  }

  if (event.type === "payment.cancelled") {
    if (order.status === "cancelled") return { ...base, duplicate: true };
    if (order.status !== "pending") return { ...base, ignored: true };
    return { ...base, status: "cancelled", fulfillment: "not_applicable" };
  }

  if (order.status === "refunded") return { ...base, duplicate: true };
  if (order.status !== "paid") {
    throw new PaymentIntegrityError("A refund arrived before a verified payment.");
  }
  if (event.amountPaise !== order.amountPaise) {
    throw new PaymentIntegrityError("Refund amount does not match the original charge.");
  }
  return {
    ...base,
    status: "refunded",
    fulfillment: "not_applicable",
    reverseRank: order.purpose === "ranking_upgrade",
    ledger: {
      orderId: order.id,
      entryType: "refund",
      amountPaise: order.amountPaise,
      currency: "INR",
      direction: "debit",
    },
  };
}
