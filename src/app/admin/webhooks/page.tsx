import { requireAdmin } from "@/features/auth/session";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { getServices } from "@/lib/services";

export default async function WebhooksPage() {
  await requireAdmin();
  const failures = await getServices().admin.webhookFailures();
  return (
    <>
      <PageHeader title="Webhook failures" description="Failed provider events stay here until the cause is fixed and the provider retries." />
      {failures.length === 0 ? <EmptyState title="No failed webhooks" body="Signature failures and apply errors are listed when they happen." /> : (
        <ul className="space-y-3 text-sm">
          {failures.map((failure) => <li key={failure.id} className="rounded-xl border border-line p-4">{failure.provider} · {failure.eventId}<div className="text-secondary">{failure.error}</div></li>)}
        </ul>
      )}
    </>
  );
}

