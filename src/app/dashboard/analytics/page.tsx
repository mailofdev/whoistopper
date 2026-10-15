import { requireUser } from "@/features/auth/session";
import { Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { getServices } from "@/lib/services";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; product?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const services = getServices();
  const products = await services.products.listOwned(user.id);
  const productId = params.product || products[0]?.id;
  // Current dates are the default filter window for this request.
  // eslint-disable-next-line react-hooks/purity
  const from = params.from || new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const to = params.to || new Date().toISOString().slice(0, 10);
  const series = productId ? await services.analytics.forProduct(user, productId, from, to) : null;
  return (
    <>
      <PageHeader title="Analytics" description="Views and outbound clicks for listings you own. Counts skip obvious bots and repeated clicks in the same hour." />
      <form className="mb-4 flex flex-wrap gap-2" action="/dashboard/analytics">
        <select className="h-11 rounded-lg border border-line px-3" name="product" defaultValue={productId} aria-label="Listing">
          {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
        </select>
        <input className="h-11 rounded-lg border border-line px-3" type="date" name="from" defaultValue={from} aria-label="From" />
        <input className="h-11 rounded-lg border border-line px-3" type="date" name="to" defaultValue={to} aria-label="To" />
        <button className="h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white" type="submit">Apply</button>
      </form>
      {!series ? <EmptyState title="No listings" body="Analytics appear after you own a listing." /> : (
        <Card>
          <p className="text-sm text-secondary">{series.productName}: {series.views} views · {series.clicks} outbound clicks</p>
          <ul className="mt-4 space-y-1 text-sm">
            {series.points.map((point) => <li key={point.day} className="flex justify-between"><span>{point.day}</span><span>{point.views} views · {point.clicks} clicks</span></li>)}
          </ul>
        </Card>
      )}
    </>
  );
}

