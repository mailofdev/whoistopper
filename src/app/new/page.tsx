import { Suspense } from "react";
import { ProductCard } from "@/components/products/product-card";
import { Alert, EmptyState, PageHeader, Skeleton } from "@/components/ui/primitives";
import { toPublicError } from "@/lib/errors";
import { pageMetadata } from "@/lib/metadata";
import { getServices } from "@/lib/services";

export const metadata = pageMetadata("Just launched", "The newest approved creator profiles.", "/new");

export default function Page() {
  return <Suspense fallback={<Skeleton className="h-40" />}><List /></Suspense>;
}
async function List() {
  try {
    const items = await getServices().products.listRecent(12);
    return (
      <>
        <PageHeader title="Just launched" description="Newest approved profiles. This list is recency, not the organic score." />
        {items.length === 0 ? <EmptyState title="No launches yet" body="Approved profiles appear here. An empty list means none have been approved." /> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        )}
      </>
    );
  } catch (error) {
    return <Alert>{toPublicError(error).message}</Alert>;
  }
}
