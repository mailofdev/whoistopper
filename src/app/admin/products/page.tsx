import { moderateProductAction } from "@/features/admin/actions";
import { requireAdmin } from "@/features/auth/session";
import { Card, PageHeader } from "@/components/ui/primitives";
import { PRODUCT_STATUSES } from "@/types/domain";
import { getServices } from "@/lib/services";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const selected = PRODUCT_STATUSES.find((item) => item === status);
  const products = await getServices().products.listAdmin(selected);
  return (
    <>
      <PageHeader title="Products" description="Approve, reject, suspend, restore, or remove listings." />
      <form className="mb-4" action="/admin/products">
        <select className="h-11 rounded-lg border border-line px-3" name="status" defaultValue={selected ?? ""} aria-label="Status">
          <option value="">All statuses</option>
          {PRODUCT_STATUSES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
        </select>
        <button className="ml-2 h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand" type="submit">Filter</button>
      </form>
      <div className="grid gap-3">
        {products.map((product) => (
          <Card key={product.id}>
            <h2 className="font-semibold">{product.name}</h2>
            <p className="text-sm text-secondary">{product.status.replaceAll("_", " ")} · {product.websiteUrl}</p>
            <form className="mt-3 flex flex-wrap gap-2" action={async (formData) => {
              "use server";
              await moderateProductAction({
                productId: String(formData.get("productId")),
                status: String(formData.get("status")),
                reason: String(formData.get("reason") ?? ""),
              });
            }}>
              <input type="hidden" name="productId" value={product.id} />
              <select className="h-11 rounded-lg border border-line px-3" name="status" defaultValue={product.status} aria-label={`Status for ${product.name}`}>
                {PRODUCT_STATUSES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
              </select>
              <input className="h-11 rounded-lg border border-line px-3" name="reason" placeholder="Reason" aria-label="Reason" />
              <button className="h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand" type="submit">Save</button>
            </form>
          </Card>
        ))}
      </div>
    </>
  );
}

