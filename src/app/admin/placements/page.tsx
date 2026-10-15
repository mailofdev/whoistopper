import { setSponsoredAction } from "@/features/admin/actions";
import { requireAdmin } from "@/features/auth/session";
import { Card, PageHeader } from "@/components/ui/primitives";
import { getServices } from "@/lib/services";

export default async function PlacementsPage() {
  await requireAdmin();
  const services = getServices();
  const [placements, products] = await Promise.all([services.admin.sponsored(), services.products.listAdmin("approved")]);
  return (
    <>
      <PageHeader title="Sponsored placements" description="Sponsored cards are labelled separately from paid rank. They are not a quality score." />
      <ul className="mb-6 space-y-2 text-sm">
        {placements.map((item) => <li key={item.id}>{item.productName} · {item.active ? "active" : "inactive"} · until {item.endsAt.slice(0, 10)}</li>)}
      </ul>
      <Card>
        <form className="flex flex-wrap gap-2" action={async (formData) => {
          "use server";
          await setSponsoredAction(String(formData.get("productId")), Number(formData.get("days")), formData.get("active") === "on");
        }}>
          <select className="h-11 rounded-lg border border-line px-3" name="productId" aria-label="Product" required>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
          <input className="h-11 w-24 rounded-lg border border-line px-3" name="days" type="number" min={1} max={90} defaultValue={7} aria-label="Days" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked /> Active</label>
          <button className="h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white" type="submit">Save placement</button>
        </form>
      </Card>
    </>
  );
}

