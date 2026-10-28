import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/products/product-card";
import { Alert, EmptyState, PageHeader, Skeleton } from "@/components/ui/primitives";
import { GAMES, gameName } from "@/config/games";
import { toPublicError } from "@/lib/errors";
import { pageMetadata } from "@/lib/metadata";
import { getServices } from "@/lib/services";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const known = GAMES.some((game) => game.slug === slug);
  if (!known) return pageMetadata("Game", "This game page is not available.", `/games/${slug}`, false);
  const name = gameName(slug);
  return pageMetadata(name, `Creators who listed ${name} on their RankPush profile.`, `/games/${slug}`);
}

export default function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <GameList params={params} />
    </Suspense>
  );
}

async function GameList({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!GAMES.some((game) => game.slug === slug)) notFound();
  const name = gameName(slug);
  try {
    const creators = await getServices().products.listByTag(slug, 24);
    return (
      <>
        <PageHeader eyebrow="Game" title={name} description={`Approved profiles that tagged ${name}. This is not a sponsored game page unless an advertisement is labelled on the profile.`} />
        {creators.length === 0 ? (
          <EmptyState title={`No ${name} creators yet`} body="Profiles show up here after a creator lists this game and the profile is approved." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((creator) => <ProductCard key={creator.id} product={creator} />)}
          </div>
        )}
      </>
    );
  } catch (error) {
    return <Alert>{toPublicError(error).message}</Alert>;
  }
}
