import Link from "next/link";
import { Badge } from "@/components/ui/primitives";
import { gameName } from "@/config/games";
import { isSafeHttpUrl } from "@/lib/urls";
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
      {letters || "RP"}
    </span>
  );
}

export function ProductCard({ product }: { product: ProductCardModel; showRank?: boolean }) {
  const games = product.tags.slice(0, 3);
  return (
    <article className="glass flex h-full flex-col rounded-3xl p-4 transition duration-200 hover:-translate-y-0.5">
      <div className="flex gap-3">
        {product.logoUrl && isSafeHttpUrl(product.logoUrl) ? (
          // Avatars are creator-supplied public images.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.logoUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
        ) : (
          <ProductMark name={product.name} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold text-navy">
              <Link className="hover:text-brand" href={`/products/${product.slug}`}>{product.name}</Link>
            </h2>
            {product.ownershipVerified ? <Badge tone="success">Verified</Badge> : null}
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-secondary">{product.shortDescription}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone={product.placement === "paid" ? "paid" : "free"}>
          {product.placement === "paid" ? "Advertisement" : "Organic listing"}
        </Badge>
        <Link className="text-xs font-medium text-secondary hover:text-navy" href={`/categories/${product.categorySlug}`}>
          {product.categoryName}
        </Link>
        {games.map((tag) => (
          <Link key={tag} className="text-xs text-secondary hover:text-navy" href={`/games/${tag}`}>{gameName(tag)}</Link>
        ))}
      </div>
    </article>
  );
}
