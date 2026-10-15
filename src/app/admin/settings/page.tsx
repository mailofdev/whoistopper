import { SettingsForm } from "@/features/admin/settings-form";
import { requireAdmin } from "@/features/auth/session";
import { PageHeader } from "@/components/ui/primitives";
import { configurationGaps } from "@/config/env";
import { getServices } from "@/lib/services";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getServices().admin.settings();
  const gaps = configurationGaps();
  return (
    <>
      <PageHeader title="Platform settings" description="Ranking floors apply to new orders. Existing placements keep their verified amounts." />
      {gaps.length ? <ul className="mb-4 list-disc pl-5 text-sm text-secondary">{gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul> : null}
      <SettingsForm defaults={settings} />
    </>
  );
}

