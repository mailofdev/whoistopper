import Link from "next/link";
import { Suspense } from "react";
import { Alert, Card, PageHeader, Skeleton } from "@/components/ui/primitives";
import { toPublicError } from "@/lib/errors";
import { pageMetadata } from "@/lib/metadata";
import { getServices } from "@/lib/services";

export const metadata = pageMetadata("Categories", "Browse Indian product listings by category.", "/categories");

export default function CategoriesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <CategoryList />
    </Suspense>
  );
}

async function CategoryList() {
  try {
    const categories = await getServices().categories.list();
    return (
      <>
        <PageHeader title="Categories" description="Each category has its own paid leaderboard. Free listings in that category appear after the paid rows." />
        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map((category) => (
            <Card key={category.id}>
              <h2 className="text-lg font-semibold"><Link className="hover:text-brand" href={`/categories/${category.slug}`}>{category.name}</Link></h2>
              <p className="mt-2 text-sm text-secondary">{category.description}</p>
            </Card>
          ))}
        </div>
      </>
    );
  } catch (error) {
    return <Alert>{toPublicError(error).message}</Alert>;
  }
}
