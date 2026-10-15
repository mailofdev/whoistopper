import { requireUser } from "@/features/auth/session";
import { DeleteAccountForm } from "@/features/auth/account-forms";
import { Card, PageHeader } from "@/components/ui/primitives";

export const metadata = { robots: { index: false, follow: false } };

export default async function DeletePage() {
  await requireUser();
  return (
    <Card className="mx-auto max-w-lg">
      <PageHeader title="Delete account" description="Your public profile is anonymised. Listings you own are detached. Payment ledger rows stay for accounting." />
      <DeleteAccountForm />
    </Card>
  );
}

