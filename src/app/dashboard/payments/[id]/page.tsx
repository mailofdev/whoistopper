import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import { Card, PageHeader } from "@/components/ui/primitives";
import { formatInrFromPaise } from "@/lib/money";
import { getServices } from "@/lib/services";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const order = await getServices().payments.getForUser(user.id, id);
  if (!order) notFound();
  const rows = [
    ["Product", order.productName],
    ["Amount", formatInrFromPaise(order.amountPaise)],
    ["Status", order.status],
    ["Fulfillment", order.fulfillment],
    ["Scope", order.scopeType ?? "—"],
    ["Quoted rank", order.quotedRank ? `#${order.quotedRank} (preview)` : "—"],
    ["Final rank", order.finalRank ? `#${order.finalRank}` : "Assigned after verified payment"],
    ["Provider reference", order.providerOrderId ?? "—"],
    ["Paid at", order.paidAt ?? "—"],
  ];
  return (
    <>
      <PageHeader title="Receipt" description={order.id} />
      <Card>
        <dl className="space-y-2 text-sm">
          {rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-secondary">{label}</dt><dd className="text-right">{value}</dd></div>)}
        </dl>
      </Card>
    </>
  );
}

