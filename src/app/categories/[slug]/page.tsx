import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Board } from "@/app/leaderboard/page";
import { Alert, Skeleton } from "@/components/ui/primitives";
import { toPublicError } from "@/lib/errors";
import { pageMetadata } from "@/lib/metadata";
import { getServices } from "@/lib/services";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const category = await getServices().categories.getBySlug(slug);
    if (category) return pageMetadata(`${category.name} leaderboard`, category.description, `/categories/${category.slug}`);
  } catch {
    // Metadata falls back when the directory is unavailable.
  }
  return pageMetadata(`${slug} leaderboard`, "Category leaderboard with paid placement labelled separately from free listings.", `/categories/${slug}`);
}

export default function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <CategoryBoard params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CategoryBoard({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  try {
    const { slug } = await params;
    const category = await getServices().categories.getBySlug(slug);
    if (!category) notFound();
    return <Board scope={{ type: "category", key: category.id }} period="all_time" categorySlug={slug} path={`/categories/${slug}`} searchParams={searchParams} />;
  } catch (error) {
    return <Alert>{toPublicError(error).message}</Alert>;
  }
}
