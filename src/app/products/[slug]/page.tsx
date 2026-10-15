import { Suspense } from "react";
import { Alert, Breadcrumbs, Card, PageHeader, Skeleton } from "@/components/ui/primitives";
import { reportAction } from "@/features/products/actions";
import { toPublicError } from "@/lib/errors";
import { headers } from "next/headers";
import { after } from "next/server";
import { formatInrFromPaise } from "@/lib/money";
import { pageMetadata } from "@/lib/metadata";
import { getServices } from "@/lib/services";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const product = await getServices().products.getPublicBySlug(slug);
    if (!product) return pageMetadata("Product", "This listing is not public.", `/products/${slug}`, false);
    return pageMetadata(product.name, product.shortDescription, `/products/${product.slug}`);
  } catch {
    return pageMetadata("Product", "Product listing", `/products/${slug}`, false);
  }
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await getServices().products.getPublicBySlug(slug);
    if (!product) notFound();
    const headerStore = await headers();
    const userAgent = headerStore.get("user-agent") ?? "";
    const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    after(async () => {
      await getServices().analytics.recordView({ productId: product.id, userAgent, ip });
    });
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: product.name,
      description: product.shortDescription,
      url: product.websiteUrl,
      applicationCategory: product.categoryName,
    };
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: `/categories/${product.categorySlug}`, label: product.categoryName }, { label: product.name }]} />
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <article>
            <PageHeader eyebrow={product.categoryName} title={product.name} description={product.shortDescription} />
            <p className="whitespace-pre-wrap text-sm leading-7 text-secondary">{product.fullDescription}</p>
            <p className="mt-4 text-sm">By {product.ownerUsername ? <a className="font-semibold text-brand" href={`/u/${product.ownerUsername}`}>{product.ownerDisplayName}</a> : product.creatorName}</p>
          </article>
          <Card>
            <h2 className="text-lg font-semibold">Placement</h2>
            <p className="mt-2 text-sm text-secondary">Paid rank is the verified bid. It is not a rating or an endorsement.</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt>All-time</dt><dd>{product.allTimeRank ? `#${product.allTimeRank} · ${formatInrFromPaise(product.allTimeAmountPaise ?? 0)}` : "Free listing"}</dd></div>
              <div className="flex justify-between"><dt>Today (UTC)</dt><dd>{product.todayRank ? `#${product.todayRank} · ${formatInrFromPaise(product.todayAmountPaise ?? 0)}` : "No daily bid"}</dd></div>
              <div className="flex justify-between"><dt>Owner</dt><dd>{product.ownershipVerified ? "Verified" : "Unverified"}</dd></div>
            </dl>
            <a className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand text-sm font-semibold text-on-brand" href={`/out/${product.slug}`} target="_blank" rel="noopener noreferrer">Visit website</a>
          </Card>
        </div>
        <ReportForm productId={product.id} />
      </>
    );
  } catch (error) {
    return <Alert>{toPublicError(error).message}</Alert>;
  }
}

function ReportForm({ productId }: { productId: string }) {
  return (
    <Card className="mt-8">
      <h2 className="text-lg font-semibold">Report this listing</h2>
      <form className="mt-4 grid gap-3" action={async (formData) => {
        "use server";
        await reportAction({
          productId,
          reason: String(formData.get("reason") ?? "other"),
          details: String(formData.get("details") ?? ""),
        });
      }}>
        <label className="text-sm font-medium">Reason
          <select className="mt-1 h-11 w-full rounded-lg border border-line px-3" name="reason">
            <option value="inaccurate">Inaccurate</option>
            <option value="prohibited">Prohibited</option>
            <option value="impersonation">Impersonation</option>
            <option value="malware">Malware or phishing</option>
            <option value="spam">Spam</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="text-sm font-medium">Details
          <textarea className="mt-1 min-h-24 w-full rounded-lg border border-line px-3 py-2" name="details" required minLength={10} />
        </label>
        <button className="h-11 rounded-lg border border-line text-sm font-semibold" type="submit">Send report</button>
      </form>
    </Card>
  );
}
