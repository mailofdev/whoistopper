import { Suspense } from "react";
import { ProductCard } from "@/components/products/product-card";
import { Alert, PageHeader, Skeleton } from "@/components/ui/primitives";
import { toPublicError } from "@/lib/errors";
import { pageMetadata } from "@/lib/metadata";
import { getServices } from "@/lib/services";

export const metadata = pageMetadata("Recently added", "The newest approved listings.", "/new");

export default function Page() {
  return <Suspense fallback={<Skeleton className="h-40" />}><List /></Suspense>;
}
async function List() {
  try {
    const items = await getServices().products.listRecent(12);
    return <><PageHeader title="Recently added" description="Newest approved listings. A new listing is not ranked until a payment is verified." /><div className="grid gap-3">{items.map((product) => <ProductCard key={product.id} product={product} />)}</div></>;
  } catch (error) {
    return <Alert>{toPublicError(error).message}</Alert>;
  }
}
