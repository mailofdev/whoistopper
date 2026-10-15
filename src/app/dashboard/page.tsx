import Link from "next/link";
import { requireUser } from "@/features/auth/session";
import { Badge, Card, PageHeader } from "@/components/ui/primitives";
import { formatInrFromPaise } from "@/lib/money";
import { getServices } from "@/lib/services";

export default async function DashboardPage() {
  const user = await requireUser();
  const services = getServices();
  const [products, orders, notifications] = await Promise.all([
    services.products.listOwned(user.id),
    services.payments.listForUser(user.id),
    services.notifications.list(user.id),
  ]);
  return (
    <>
      <PageHeader title="Overview" description="Your listings, ranks, and unread notices." action={<Link className="inline-flex h-11 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white" href="/submit">Add a product</Link>} />
      {!user.emailVerified ? <p className="mb-4 text-sm text-warning">Email is not verified yet. Check your inbox or the development inbox on the verification page.</p> : null}
      <div className="grid gap-3">
        {products.map((product) => (
          <Card key={product.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold"><Link href={`/dashboard/products/${product.id}`}>{product.name}</Link></h2>
                <p className="text-sm text-secondary">{product.status.replaceAll("_", " ")} · {product.ownershipVerified ? "Ownership verified" : "Ownership pending"}</p>
              </div>
              <div className="text-sm">
                {product.allTimeRank ? <Badge tone="paid">All-time #{product.allTimeRank} · {formatInrFromPaise(product.allTimeAmountPaise ?? 0)}</Badge> : <Badge tone="free">No all-time bid</Badge>}
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-sm text-secondary">{orders.length} payments · {notifications.filter((item) => !item.readAt).length} unread notices</p>
    </>
  );
}
