import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductCard } from "@/components/products/product-card";
import { Alert, PageHeader, Skeleton } from "@/components/ui/primitives";
import { toPublicError } from "@/lib/errors";
import { pageMetadata } from "@/lib/metadata";
import { getServices } from "@/lib/services";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return pageMetadata(`@${username}`, "Public creator profile.", `/u/${username}`);
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  return <Suspense fallback={<Skeleton className="h-40" />}><Profile params={params} /></Suspense>;
}

async function Profile({ params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const profile = await getServices().profiles.getPublic(username);
    if (!profile) notFound();
    return (
      <>
        <PageHeader title={profile.displayName} description={profile.bio || "Public listings from this creator."} />
        <div className="grid gap-3">{profile.products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </>
    );
  } catch (error) {
    return <Alert>{toPublicError(error).message}</Alert>;
  }
}

