import { gameSlugs } from "@/config/games";
import { productSchema } from "@/lib/validation/schemas";
import { normalizeWebsiteUrl, slugify } from "@/lib/urls";

export function parseProductInput(input: unknown) {
  const parsed = productSchema.parse(input);
  const websiteUrl = normalizeWebsiteUrl(parsed.websiteUrl);
  const tags = [...new Set([
    ...parsed.tags.map((tag) => slugify(tag)),
    ...gameSlugs(parsed.details?.games),
  ])].filter((tag) => tag && tag !== "product").slice(0, 8);
  return {
    ...parsed,
    websiteUrl,
    logoUrl: parsed.logoUrl || undefined,
    tags,
  };
}
