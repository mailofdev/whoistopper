import { Suspense } from "react";
import { ListingForm } from "@/features/listings/forms";
import { listAdPackages } from "@/features/payments/packages";
import { Alert, PageHeader, Skeleton } from "@/components/ui/primitives";
import { toPublicError } from "@/lib/errors";
import { pageMetadata } from "@/lib/metadata";
import { getServices } from "@/lib/services";

export const metadata = pageMetadata(
  "Launch a profile",
  "Publish a free creator profile. A promotion is an optional labelled advertisement with a fixed price in INR.",
  "/submit",
);

export default function SubmitPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <SubmitForm />
    </Suspense>
  );
}

async function SubmitForm() {
  try {
    const [categories, packages] = await Promise.all([
      getServices().categories.list().then((rows) => rows.filter((category) => category.isActive)),
      listAdPackages(),
    ]);
    if (categories.length === 0) return <Alert>No categories are open for submissions yet.</Alert>;
    return (
      <>
        <PageHeader
          title="Launch a profile"
          description="No account is required. You get a private link to edit or remove the profile. A free profile is not an advertisement. A paid package is a labelled advertisement at a fixed price, charged only after the server verifies payment."
        />
        <ListingForm categories={categories} packages={packages} />
      </>
    );
  } catch (error) {
    return <Alert>{toPublicError(error).message}</Alert>;
  }
}
