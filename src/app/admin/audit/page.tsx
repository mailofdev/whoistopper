import { requireAdmin } from "@/features/auth/session";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { getServices } from "@/lib/services";

export default async function AuditPage() {
  await requireAdmin();
  const entries = await getServices().admin.audit();
  return (
    <>
      <PageHeader title="Audit log" description="Administrative and financial changes recorded by the application." />
      {entries.length === 0 ? <EmptyState title="No audit entries" body="Role changes, moderation, and setting updates are recorded here." /> : (
        <ul className="space-y-2 text-sm">
          {entries.map((entry) => <li key={entry.id} className="rounded-xl border border-line p-3">{entry.createdAt.slice(0, 16).replace("T", " ")} · {entry.actorName} · {entry.action} · {entry.entityType}</li>)}
        </ul>
      )}
    </>
  );
}

