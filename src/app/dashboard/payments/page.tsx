import Link from "next/link";
import { requireUser } from "@/features/auth/session";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { formatInrFromPaise } from "@/lib/money";
import { getServices } from "@/lib/services";

export default async function PaymentsPage() {
  const user = await requireUser();
  const orders = await getServices().payments.listForUser(user.id);
  return (
    <>
      <PageHeader title="Payments" description="Receipts show the verified status. A pending order is not a rank." />
      {orders.length === 0 ? <EmptyState title="No payments" body="Upgrade an approved, verified listing to create an order." /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-line text-secondary"><th className="py-2">Product</th><th>Amount</th><th>Status</th><th>Rank</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-line">
                  <td className="py-3"><Link className="font-semibold text-brand" href={`/dashboard/payments/${order.id}`}>{order.productName}</Link></td>
                  <td>{formatInrFromPaise(order.amountPaise)}</td>
                  <td>{order.status}</td>
                  <td>{order.finalRank ? `#${order.finalRank}` : order.quotedRank ? `preview #${order.quotedRank}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

