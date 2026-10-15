import { requireUser } from "@/features/auth/session";
import { PageHeader } from "@/components/ui/primitives";

export const metadata = { robots: { index: false, follow: false } };

export default async function ExportPage() {
  await requireUser();
  return (
    <>
      <PageHeader title="Export your data" description="The file includes your profile, listings, and payment history. It does not include other people's data." />
      <a className="inline-flex h-11 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white" href="/api/account/export">Download JSON</a>
    </>
  );
}

