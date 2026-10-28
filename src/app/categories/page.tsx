import Link from "next/link";
import { Suspense } from "react";
import { Alert, Skeleton } from "@/components/ui/primitives";
import { toPublicError } from "@/lib/errors";
import { pageMetadata } from "@/lib/metadata";
import { getServices } from "@/lib/services";

export const metadata = pageMetadata(
  "Categories",
  "Creator lanes. Organic order uses the published score. Sponsorships are labelled advertisements.",
  "/categories",
);

export default function CategoriesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <CategoryList />
    </Suspense>
  );
}

async function CategoryList() {
  try {
    const categories = (await getServices().categories.list()).filter((category) => category.isActive);
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-4xl font-semibold tracking-tight">Lanes</h1>
          <p className="mt-3 max-w-2xl text-secondary">Choose a lane to browse creators. A lane sponsorship is a labelled advertisement and does not change the organic score.</p>
        </header>
        <div className="grid gap-3 md:grid-cols-2">
          {categories.map((category) => (
            <section key={category.id} className="glass rounded-3xl p-4">
              <h2 className="font-semibold">
                <Link className="hover:text-brand" href={`/categories/${category.slug}`}>{category.name}</Link>
              </h2>
              <p className="mt-1 text-sm text-secondary">{category.description}</p>
            </section>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    return <Alert>{toPublicError(error).message}</Alert>;
  }
}
