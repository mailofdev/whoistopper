import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";
import { getServices } from "@/lib/services";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["", "/leaderboard", "/leaderboard/today", "/categories", "/search", "/trending", "/new", "/about", "/faq", "/contact", "/rules", "/terms", "/privacy", "/refunds", "/submit"];
  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${siteUrl()}${path || "/"}`,
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.6,
  }));
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return entries;
    const services = getServices();
    const products = await services.products.search({ sort: "newest", page: 1, pageSize: 48 });
    const categories = await services.categories.list();
    for (const product of products.items) entries.push({ url: `${siteUrl()}/products/${product.slug}`, changeFrequency: "daily", priority: 0.7 });
    for (const category of categories) entries.push({ url: `${siteUrl()}/categories/${category.slug}`, changeFrequency: "daily", priority: 0.5 });
  } catch {
    return entries;
  }
  return entries;
}
