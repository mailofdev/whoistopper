import Link from "next/link";
import { Badge } from "@/components/ui/primitives";
import type { ProductCardModel } from "@/types/domain";

export function ProductMark({ name }: { name: string }) {
  const letters = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
  return (
    <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-muted text-sm font-semibold text-brand">
      {letters}
    </span>
  );
}

export function ProductCard({ product }: { product: ProductCardModel; showRank?: boolean }) {
  return (
    <article className="glass rounded-3xl p-4">
      <div className="flex gap-3">
        <ProductMark name={product.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold text-navy">
              <Link className="hover:text-brand" href={`/products/${product.slug}`}>{product.name}</Link>
            </h2>
            {product.ownershipVerified ? <Badge tone="success">Verified owner</Badge> : null}
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-secondary">{product.shortDescription}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={product.placement === "paid" ? "paid" : "free"}>
              {product.placement === "paid" ? "Advertisement" : "Organic listing"}
            </Badge>
            <Link className="text-xs font-medium text-secondary hover:text-navy" href={`/categories/${product.categorySlug}`}>
              {product.categoryName}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
