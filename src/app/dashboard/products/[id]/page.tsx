import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import { ProductForm } from "@/features/products/product-form";
import { PageHeader } from "@/components/ui/primitives";
import { getServices } from "@/lib/services";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const services = getServices();
  const product = await services.products.getManageable(user, id);
  if (!product) notFound();
  const categories = await services.categories.list();
  return (
    <>
      <PageHeader title={product.name} description={`Status: ${product.status.replaceAll("_", " ")}. Ownership: ${product.ownershipVerified ? "verified" : "pending"}.`} action={<Link className="font-semibold text-brand" href={`/dashboard/products/${id}/upgrade`}>Buy an advertisement</Link>} />
      <ProductForm
        categories={categories}
        productId={product.id}
        defaults={{
          name: product.name,
          websiteUrl: product.websiteUrl,
          shortDescription: product.shortDescription,
          fullDescription: product.fullDescription,
          categorySlug: product.categorySlug,
          tags: product.tags.join(", "),
          creatorName: product.creatorName,
          details: product.details,
        }}
      />
    </>
  );
}

