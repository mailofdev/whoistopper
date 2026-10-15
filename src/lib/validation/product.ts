import { productSchema } from "@/lib/validation/schemas";
import { normalizeWebsiteUrl, slugify } from "@/lib/urls";

export function parseProductInput(input: unknown) {
  const parsed = productSchema.parse(input);
  const websiteUrl = normalizeWebsiteUrl(parsed.websiteUrl);
  return {
    ...parsed,
    websiteUrl,
    logoUrl: parsed.logoUrl || undefined,
    tags: [...new Set(parsed.tags.map((tag) => slugify(tag)).filter(Boolean))],
  };
}
