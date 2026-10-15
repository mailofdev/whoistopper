import Link from "next/link";
import { requireUser } from "@/features/auth/session";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { getServices } from "@/lib/services";

export default async function ProductsPage() {
  const user = await requireUser();
  const products = await getServices().products.listOwned(user.id);
  return (
    <>
      <PageHeader title="Listings" description="Drafts stay private. Approved listings appear on public boards." action={<Link className="inline-flex h-11 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white" href="/submit">Add</Link>} />
      {products.length === 0 ? <EmptyState title="No listings yet" body="Submit a product to start." /> : (
        <div className="grid gap-3">
          {products.map((product) => (
            <Card key={product.id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Link className="font-semibold hover:text-brand" href={`/dashboard/products/${product.id}`}>{product.name}</Link>
                  <p className="text-sm text-secondary">{product.websiteUrl}</p>
                </div>
                <Badge>{product.status.replaceAll("_", " ")}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

