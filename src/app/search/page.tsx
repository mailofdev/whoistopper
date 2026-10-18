import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProductCard } from "@/components/products/product-card";
import { Alert, EmptyState, PageHeader, Pagination, Skeleton } from "@/components/ui/primitives";
import { toPublicError } from "@/lib/errors";
import { pageMetadata } from "@/lib/metadata";
import { LIST_PAGE_SIZE, pageCount, parsePage } from "@/lib/pagination";
import { getServices } from "@/lib/services";

export const metadata = pageMetadata("Search", "Search approved products by name, category, and tag.", "/search");

export default function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <Results searchParams={searchParams} />
    </Suspense>
  );
}

async function Results({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  let redirectTo: string | undefined;
  try {
    const params = await searchParams;
    const q = typeof params.q === "string" ? params.q : "";
    const category = typeof params.category === "string" ? params.category : "";
    const sort = params.sort === "name" || params.sort === "rank" ? params.sort : "newest";
    const requestedPage = parsePage(params.page);
    const services = getServices();
    const [categories, result] = await Promise.all([
      services.categories.list(),
      services.products.search({ q, category, sort, page: requestedPage, pageSize: LIST_PAGE_SIZE }),
    ]);
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (category) query.set("category", category);
    query.set("sort", sort);
    const lastPage = pageCount(result.total, result.pageSize);
    if (requestedPage > lastPage) {
      redirectTo = searchHref(query, lastPage);
    } else {
      return (
        <>
          <PageHeader title="Search" description="Only approved listings are searchable." />
          <form className="glass mb-6 grid gap-3 rounded-3xl p-3 sm:grid-cols-[1fr_180px_140px_auto] sm:p-4" action="/search">
            <input className="glass-field h-11 rounded-full px-4" name="q" defaultValue={q} aria-label="Search" placeholder="Name or keyword" />
            <select className="glass-field h-11 rounded-full px-4" name="category" defaultValue={category} aria-label="Category">
              <option value="">All categories</option>
              {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
            </select>
            <select className="glass-field h-11 rounded-full px-4" name="sort" defaultValue={sort} aria-label="Sort">
              <option value="newest">Newest</option>
              <option value="name">Name</option>
              <option value="rank">All-time rank</option>
            </select>
            <button className="h-11 rounded-full bg-brand px-4 text-sm font-semibold text-on-brand" type="submit">Search</button>
          </form>
          {result.items.length === 0 ? <EmptyState title="No matches" body="Try another word or clear the category filter." /> : (
            <div className="grid gap-3">{result.items.map((product) => <ProductCard key={product.id} product={product} showRank={sort === "rank"} />)}</div>
          )}
          <Pagination page={requestedPage} total={result.total} pageSize={result.pageSize} hrefFor={(next) => searchHref(query, next)} />
          <p className="mt-4 text-sm"><Link className="text-brand" href="/new">Recently added</Link></p>
        </>
      );
    }
  } catch (error) {
    return <Alert>{toPublicError(error).message}</Alert>;
  }
  redirect(redirectTo ?? "/search");
}

function searchHref(query: URLSearchParams, page: number) {
  const nextQuery = new URLSearchParams(query);
  if (page > 1) nextQuery.set("page", String(page));
  const search = nextQuery.toString();
  return search ? `/search?${search}` : "/search";
}
