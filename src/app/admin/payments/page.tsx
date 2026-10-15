import { requireAdmin } from "@/features/auth/session";
import { Card, PageHeader } from "@/components/ui/primitives";
import { formatInrFromPaise } from "@/lib/money";
import { getServices } from "@/lib/services";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const services = getServices();
  const [orders, issues] = await Promise.all([services.payments.listAdmin(), services.payments.reconcile()]);
  return (
    <>
      <PageHeader title="Payments" description="Reconciliation compares paid orders with the ledger. It is not a bank statement." />
      {issues.length ? (
        <Card className="mb-4">
          <h2 className="font-semibold">Reconciliation</h2>
          <ul className="mt-2 space-y-1 text-sm text-secondary">{issues.map((issue) => <li key={issue.orderId + issue.code}>{issue.code}: {issue.message}</li>)}</ul>
        </Card>
      ) : <p className="mb-4 text-sm text-teal">No ledger mismatches in the current records.</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-line text-secondary"><th className="py-2">Order</th><th>Amount</th><th>Status</th><th>Rank</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-line">
                <td className="py-3">{order.productName}<div className="text-secondary">{order.id}</div></td>
                <td>{formatInrFromPaise(order.amountPaise)}</td>
                <td>{order.status} / {order.fulfillment}</td>
                <td>{order.finalRank ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

