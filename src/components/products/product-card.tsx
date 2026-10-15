import Link from "next/link";
import { Badge } from "@/components/ui/primitives";
import { formatInrFromPaise } from "@/lib/money";
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

export function ProductCard({ product, showRank = false }: { product: ProductCardModel; showRank?: boolean }) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex gap-3">
        {showRank && product.rank ? (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy text-lg font-semibold text-white">
            <span className="sr-only">Rank </span>
            {product.rank}
          </span>
        ) : (
          <ProductMark name={product.name} />
        )}
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
              {product.placement === "paid" ? "Paid placement" : "Free listing"}
            </Badge>
            <Link className="text-xs font-medium text-secondary hover:text-navy" href={`/categories/${product.categorySlug}`}>
              {product.categoryName}
            </Link>
            {product.placement === "paid" && product.amountPaise ? (
              <span className="text-xs font-semibold text-navy">{formatInrFromPaise(product.amountPaise)}</span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
