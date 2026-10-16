import { Suspense } from "react";
import { ListingForm } from "@/features/listings/forms";
import { Alert, PageHeader, Skeleton } from "@/components/ui/primitives";
import { toPublicError } from "@/lib/errors";
import { pageMetadata } from "@/lib/metadata";
import { getServices } from "@/lib/services";

export const metadata = pageMetadata(
  "Submit a listing",
  "List a website, profile, collection, or creative work. Browsing and submitting do not require an account. Paid ranks start at ₹99.",
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
    const categories = (await getServices().categories.list()).filter((category) => category.isActive);
    if (categories.length === 0) return <Alert>No categories are open for submissions yet.</Alert>;
    return (
      <>
        <PageHeader
          title="Submit a listing"
          description="No account is required. You get a private link to edit or remove the listing. A free listing waits for review when moderation is on. A paid rank is applied only after the payment is confirmed."
        />
        <ListingForm categories={categories} />
      </>
    );
  } catch (error) {
    return <Alert>{toPublicError(error).message}</Alert>;
  }
}
