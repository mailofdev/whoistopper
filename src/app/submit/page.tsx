import { Suspense } from "react";
import { ProductForm } from "@/features/products/product-form";
import { Alert, PageHeader, Skeleton } from "@/components/ui/primitives";
import { toPublicError } from "@/lib/errors";
import { pageMetadata } from "@/lib/metadata";
import { getServices } from "@/lib/services";

export const metadata = pageMetadata("Submit a product", "List a product for free. Ranking is a separate, labelled payment.", "/submit", false);

export default function SubmitPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <SubmitForm />
    </Suspense>
  );
}

async function SubmitForm() {
  try {
    const categories = await getServices().categories.list();
    return (
      <>
        <PageHeader title="Submit a product" description="New listings stay private until ownership is verified and a moderator approves them. An unclaimed website can be claimed instead of duplicated." />
        <ProductForm categories={categories} />
      </>
    );
  } catch (error) {
    return <Alert>{toPublicError(error).message}</Alert>;
  }
}
