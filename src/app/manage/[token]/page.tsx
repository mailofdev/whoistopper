import { Suspense } from "react";
import { ManageForm } from "@/features/listings/forms";
import { Alert, PageHeader, Skeleton } from "@/components/ui/primitives";
import { loadManagedListing } from "@/features/listings/actions";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("Manage a listing", "Private listing controls.", "/manage", false);

export default function ManagePage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <Manage params={params} />
    </Suspense>
  );
}

async function Manage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const listing = await loadManagedListing(token);
  if (!listing) return <Alert>This private link is not valid, or it has been revoked.</Alert>;
  return (
    <>
      <PageHeader title="Manage listing" description="This page is private. The address is the credential. Do not share it." />
      <ManageForm token={token} listing={listing} />
    </>
  );
}
