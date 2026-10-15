import { decideReportAction } from "@/features/admin/actions";
import { requireAdmin } from "@/features/auth/session";
import { Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { getServices } from "@/lib/services";

export default async function ReportsPage() {
  await requireAdmin();
  const reports = await getServices().reports.listAdmin();
  return (
    <>
      <PageHeader title="Reports" description="Open reports stay visible until resolved or dismissed." />
      {reports.length === 0 ? <EmptyState title="No reports" body="Abuse reports from visitors appear here." /> : (
        <div className="grid gap-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <h2 className="font-semibold">{report.productName ?? "Listing"} · {report.reason}</h2>
              <p className="mt-1 text-sm text-secondary">{report.details}</p>
              <p className="mt-1 text-xs text-secondary">{report.status}</p>
              {report.status === "open" || report.status === "reviewing" ? (
                <div className="mt-3 flex gap-2">
                  <form action={async () => { "use server"; await decideReportAction(report.id, "resolved", "Resolved by moderator."); }}><button className="h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white" type="submit">Resolve</button></form>
                  <form action={async () => { "use server"; await decideReportAction(report.id, "dismissed", "Dismissed by moderator."); }}><button className="h-11 rounded-lg border border-line px-4 text-sm font-semibold" type="submit">Dismiss</button></form>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

