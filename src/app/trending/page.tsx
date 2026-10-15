import { Suspense } from "react";
import { ProductCard } from "@/components/products/product-card";
import { Alert, EmptyState, PageHeader, Skeleton } from "@/components/ui/primitives";
import { toPublicError } from "@/lib/errors";
import { pageMetadata } from "@/lib/metadata";
import { getServices } from "@/lib/services";

export const metadata = pageMetadata("Trending", "Products ordered by outbound clicks in the last 7 days.", "/trending");

export default function Page() {
  return <Suspense fallback={<Skeleton className="h-40" />}><List /></Suspense>;
}

async function List() {
  try {
    const items = await getServices().products.listTrending(12);
    return (
      <>
        <PageHeader title="Trending" description="Ordered by counted outbound clicks over the last 7 UTC days. This is not a paid rank." />
        {items.length === 0 ? <EmptyState title="No trend yet" body="Trending appears after real outbound clicks are counted." /> : <div className="grid gap-3">{items.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
      </>
    );
  } catch (error) {
    return <Alert>{toPublicError(error).message}</Alert>;
  }
}
