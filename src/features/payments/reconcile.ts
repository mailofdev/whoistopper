import type { LedgerEntry, OrderDetail, ReconciliationIssue } from "@/types/domain";

export function findReconciliationIssues(orders: OrderDetail[], ledger: LedgerEntry[]): ReconciliationIssue[] {
  const issues: ReconciliationIssue[] = [];
  const charges = new Map<string, LedgerEntry[]>();
  const refunds = new Map<string, LedgerEntry[]>();
  for (const entry of ledger) {
    const bucket = entry.entryType === "refund" ? refunds : charges;
    const list = bucket.get(entry.orderId) ?? [];
    list.push(entry);
    bucket.set(entry.orderId, list);
  }

  for (const order of orders) {
    const orderCharges = charges.get(order.id) ?? [];
    const orderRefunds = refunds.get(order.id) ?? [];
    if (order.status === "paid" || order.status === "refunded") {
      if (orderCharges.length === 0) {
        issues.push({ orderId: order.id, code: "missing_charge", message: "Paid order has no charge ledger entry." });
      }
      if (orderCharges.length > 1) {
        issues.push({ orderId: order.id, code: "duplicate_charge", message: "Paid order has more than one charge." });
      }
      const charge = orderCharges[0];
      if (charge && charge.amountPaise !== order.amountPaise) {
        issues.push({ orderId: order.id, code: "amount_mismatch", message: "Ledger charge does not match the order amount." });
      }
    }
    if (order.status === "refunded" && orderRefunds.length === 0) {
      issues.push({ orderId: order.id, code: "missing_refund", message: "Refunded order has no refund ledger entry." });
    }
    if (order.status !== "paid" && order.status !== "refunded" && orderCharges.length > 0) {
      issues.push({ orderId: order.id, code: "unexpected_charge", message: "Unpaid order has a charge ledger entry." });
    }
    charges.delete(order.id);
  }

  for (const [orderId] of charges) {
    issues.push({ orderId, code: "orphan_ledger", message: "Ledger charge has no matching order." });
  }
  return issues;
}
