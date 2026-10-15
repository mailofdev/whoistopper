import { requireAdmin } from "@/features/auth/session";
import { Card, PageHeader } from "@/components/ui/primitives";
import { formatInrFromPaise } from "@/lib/money";
import { getServices } from "@/lib/services";

export default async function AdminPage() {
  await requireAdmin();
  const overview = await getServices().admin.overview();
  const cards = [
    ["People", overview.users],
    ["Awaiting review", overview.pendingSubmissions],
    ["Open reports", overview.openReports],
    ["Paid orders", overview.paidOrders],
    ["Recorded charges", formatInrFromPaise(overview.recordedChargePaise)],
    ["Webhook failures", overview.webhookFailures],
  ];
  return (
    <>
      <PageHeader title="Administration" description="Counts come from stored records. Recorded charges are ledger entries, not a bank balance." />
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map(([label, value]) => (
          <Card key={String(label)}>
            <p className="text-xs text-secondary">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
