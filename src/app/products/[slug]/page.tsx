import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { after } from "next/server";
import { notFound } from "next/navigation";
import { ShareProfile } from "@/components/creators/share-profile";
import { ProductCard, ProductMark } from "@/components/products/product-card";
import { Alert, Badge, Breadcrumbs, Card, Skeleton } from "@/components/ui/primitives";
import { fieldsFor } from "@/config/catalogue";
import { gameName, gameSlugs } from "@/config/games";
import { siteUrl } from "@/config/site";
import { reportAction } from "@/features/products/actions";
import { toPublicError } from "@/lib/errors";
import { pageMetadata } from "@/lib/metadata";
import { referralHost } from "@/lib/referrals";
import { getServices } from "@/lib/services";
import { isSafeHttpUrl } from "@/lib/urls";
import { youtubeId } from "@/lib/youtube";
import type { ProductDetail } from "@/types/domain";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const product = await getServices().products.getPublicBySlug(slug);
    if (!product) return pageMetadata("Creator", "This profile is not public.", `/products/${slug}`, false);
    return pageMetadata(product.name, product.shortDescription, `/products/${product.slug}`);
  } catch {
    return pageMetadata("Creator", "Creator profile", `/products/${slug}`, false);
  }
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <ProductDetailView params={params} />
    </Suspense>
  );
}

async function ProductDetailView({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const services = getServices();
    const product = await services.products.getPublicBySlug(slug);
    if (!product) notFound();
    const headerStore = await headers();
    const userAgent = headerStore.get("user-agent") ?? "";
    const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const host = referralHost(headerStore.get("referer"), new URL(siteUrl()).host);
    after(async () => {
      await getServices().analytics.recordView({ productId: product.id, userAgent, ip, referrerHost: host });
    });
    const related = await services.products.search({
      category: product.categorySlug,
      sort: "newest",
      page: 1,
      pageSize: 4,
    }).then((result) => result.items.filter((item) => item.id !== product.id).slice(0, 3)).catch(() => []);
    const profileUrl = `${siteUrl()}/products/${product.slug}`;
    const video = youtubeId(product.details.featuredVideoUrl);
    const banner = safeMedia(product.details.bannerUrl);
    const avatar = product.logoUrl && isSafeHttpUrl(product.logoUrl) ? product.logoUrl : null;
    const games = gameSlugs(product.details.games);
    const languages = splitList(product.details.languages);
    const socials = socialEntries(product.socialLinks);
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      mainEntity: {
        "@type": "Person",
        name: product.name,
        description: product.shortDescription,
        url: profileUrl,
        sameAs: socials.map((item) => item.href),
      },
    };
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: `/categories/${product.categorySlug}`, label: product.categoryName }, { label: product.name }]} />
        <article className="overflow-hidden rounded-[2rem]">
          <div className="relative h-40 bg-muted sm:h-56" style={banner ? { backgroundImage: `url("${banner}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
          <div className="glass relative -mt-10 rounded-[2rem] p-5 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              {avatar ? (
                // Creator-supplied public avatar.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="h-24 w-24 rounded-2xl object-cover ring-4 ring-background" />
              ) : (
                <ProductMark name={product.name} />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold text-navy">{product.name}</h1>
                  {product.ownershipVerified ? <Badge tone="success">Verified owner</Badge> : <Badge>Ownership not verified</Badge>}
                </div>
                <p className="mt-2 text-sm text-secondary">{product.categoryName}{product.details.platform ? ` · ${product.details.platform}` : ""}{product.details.handle ? ` · ${product.details.handle}` : ""}</p>
                <p className="mt-3 max-w-2xl text-base leading-7 text-secondary">{product.shortDescription}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ShareProfile url={profileUrl} title={product.name} />
                <a className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-on-brand" href={`/out/${product.slug}`} target="_blank" rel="noopener noreferrer">Visit channel</a>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {games.map((slug) => <Link key={slug} className="rounded-full bg-muted px-3 py-1 text-sm hover:text-brand" href={`/games/${slug}`}>{gameName(slug)}</Link>)}
              {languages.map((language) => <span key={language} className="rounded-full bg-muted px-3 py-1 text-sm text-secondary">{language}</span>)}
            </div>
          </div>
        </article>

        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            {video ? (
              <iframe
                className="aspect-video w-full rounded-3xl border-0"
                src={`https://www.youtube-nocookie.com/embed/${video}`}
                title={`Featured video from ${product.name}`}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : null}
            <Card>
              <h2 className="text-lg font-semibold">About</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-secondary">{product.fullDescription}</p>
              {product.details.achievements ? (
                <>
                  <h3 className="mt-6 text-base font-semibold">Achievements</h3>
                  <p className="mt-1 text-xs text-secondary">Submitted by the creator. RankPush does not verify these.</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-secondary">{product.details.achievements}</p>
                </>
              ) : null}
            </Card>
            {related.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold">More in {product.categoryName}</h2>
                <div className="mt-3 grid gap-3">
                  {related.map((item) => <ProductCard key={item.id} product={item} />)}
                </div>
              </section>
            ) : null}
          </div>
          <div className="space-y-4">
            <Card>
              <h2 className="text-lg font-semibold">Profile</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <Row label="Lane" value={product.categoryName} />
                <Row label="Submitted by" value={product.ownerUsername ? product.ownerDisplayName ?? product.creatorName : product.creatorName} />
                {product.details.country ? <Row label="Country" value={product.details.country} /> : null}
              </dl>
              {product.ownerUsername ? <p className="mt-4 text-sm"><Link className="text-brand" href={`/u/${product.ownerUsername}`}>More from this account</Link></p> : null}
              {socials.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm">
                  {socials.map((item) => <li key={item.label}><a className="text-brand underline" href={item.href} rel="noopener noreferrer" target="_blank">{item.label}</a></li>)}
                </ul>
              ) : null}
              <p className="mt-4 text-xs leading-5 text-secondary">A name on this page is not an ownership check. An active advertisement, when one is running, is labelled in discovery and is not a rating.</p>
            </Card>
            <SubmittedFacts product={product} />
          </div>
        </div>
        <ReportForm productId={product.id} />
      </>
    );
  } catch (error) {
    return <Alert>{toPublicError(error).message}</Alert>;
  }
}

function SubmittedFacts({ product }: { product: ProductDetail }) {
  const shown = new Set(["platform", "handle", "games", "languages", "achievements", "featuredVideoUrl", "bannerUrl"]);
  const fields = fieldsFor(product.categorySlug).filter((field) => product.details[field.key] && !shown.has(field.key));
  if (fields.length === 0) return null;
  return (
    <Card>
      <h2 className="text-lg font-semibold">Submitted details</h2>
      <p className="mt-2 text-xs leading-5 text-secondary">These were entered with the profile. They are not checked facts.</p>
      <dl className="mt-3 space-y-3 text-sm">
        {fields.map((field) => (
          <div key={field.key}>
            <dt className="font-medium">{field.label}</dt>
            <dd className="break-words text-secondary">
              {field.kind === "url" && isSafeHttpUrl(product.details[field.key]) ? <a className="text-brand underline" href={product.details[field.key]} rel="noopener noreferrer" target="_blank">{product.details[field.key]}</a> : product.details[field.key]}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3"><dt className="text-secondary">{label}</dt><dd className="text-right">{value}</dd></div>;
}

function splitList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 8);
}

function safeMedia(value: string | undefined): string | null {
  if (!value || !isSafeHttpUrl(value) || /[\s"'()<>]/.test(value)) return null;
  return value;
}

function socialEntries(links: ProductDetail["socialLinks"]): Array<{ label: string; href: string }> {
  const labels: Record<string, string> = { youtube: "YouTube", twitch: "Twitch", kick: "Kick", instagram: "Instagram", x: "X", linkedin: "LinkedIn" };
  return Object.entries(links).flatMap(([key, href]) => {
    if (!href || !isSafeHttpUrl(href) || !labels[key]) return [];
    return [{ label: labels[key], href }];
  });
}

function ReportForm({ productId }: { productId: string }) {
  return (
    <Card className="mt-8">
      <h2 className="text-lg font-semibold">Report this profile</h2>
      <form className="mt-4 grid gap-3" action={async (formData) => {
        "use server";
        await reportAction({
          productId,
          reason: String(formData.get("reason") ?? "other"),
          details: String(formData.get("details") ?? ""),
        });
      }}>
        <label className="text-sm font-medium">Reason
          <select className="glass-field mt-1 h-11 w-full rounded-2xl px-3" name="reason">
            <option value="inaccurate">Inaccurate</option>
            <option value="prohibited">Prohibited</option>
            <option value="impersonation">Impersonation</option>
            <option value="malware">Malware or phishing</option>
            <option value="spam">Spam</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="text-sm font-medium">Details
          <textarea className="glass-field mt-1 min-h-24 w-full rounded-2xl px-3 py-2" name="details" required minLength={10} />
        </label>
        <button className="h-11 rounded-full border border-line text-sm font-semibold" type="submit">Send report</button>
      </form>
    </Card>
  );
}
