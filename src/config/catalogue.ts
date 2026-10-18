import { normalizeWebsiteUrl } from "@/lib/urls";

export const ACTIVE_CATEGORY_SLUGS = [
  "websites-saas",
  "business-startups",
  "developer-tools",
  "instagram-pages",
  "youtube-channels",
  "other-online-profiles",
  "gaming-esports",
  "art-creative-work",
  "music-entertainment",
  "skills-portfolios",
] as const;

/** Slugs that must stay inactive. Re-seeding must not turn them back on. */
export const RETIRED_CATEGORY_SLUGS = [
  "saas",
  "fintech",
  "commerce",
  "education",
  "health",
  "climate",
  "media",
  "cars-bikes",
  "luxury-gadgets",
  "travel-experiences",
  "fashion-collections",
  "achievements-skills",
  "fitness-lifestyle",
] as const;

/**
 * Automatic moves for known legacy slugs. `developer-tools` keeps its slug and is updated in place.
 * Listings on retired slugs that are not in this map stay attached for a manual review.
 */
export const CATEGORY_MIGRATION: Record<string, { slug: string; reason: string }> = {
  saas: { slug: "websites-saas", reason: "legacy catalogue map" },
  fintech: { slug: "business-startups", reason: "legacy catalogue map" },
  commerce: { slug: "business-startups", reason: "legacy catalogue map" },
  health: { slug: "business-startups", reason: "legacy catalogue map" },
  climate: { slug: "business-startups", reason: "legacy catalogue map" },
  education: { slug: "skills-portfolios", reason: "legacy catalogue map" },
  media: { slug: "music-entertainment", reason: "default media map; review if the listing is not entertainment" },
  "achievements-skills": { slug: "skills-portfolios", reason: "catalogue replacement" },
};

export type FieldKind = "text" | "textarea" | "url" | "select";
export type UrlKind = "any" | "instagram" | "youtube" | "repository";

export interface ListingField {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  max: number;
  hint: string;
  options?: readonly string[];
  urlKind?: UrlKind;
}

const countryField: ListingField = {
  key: "country",
  label: "Country or target audience",
  kind: "text",
  max: 80,
  hint: "Optional. India is used when this is left blank.",
};

export const FIELD_SETS: Record<string, ListingField[]> = {
  "websites-saas": [
    countryField,
    { key: "productType", label: "Product type", kind: "select", required: true, max: 40, options: ["SaaS", "Web app", "Content website", "Marketplace", "Other"], hint: "What kind of public product this is." },
    { key: "useCase", label: "Main use case", kind: "text", required: true, max: 160, hint: "What a visitor uses it for." },
    { key: "audience", label: "Target audience", kind: "text", required: true, max: 120, hint: "Who it is for. This is not checked." },
    { key: "pricingUrl", label: "Pricing page URL", kind: "url", max: 300, urlKind: "any", hint: "Optional." },
    { key: "launchUrl", label: "Public launch URL", kind: "url", max: 300, urlKind: "any", hint: "Optional." },
  ],
  "business-startups": [
    countryField,
    { key: "businessType", label: "Business type", kind: "select", required: true, max: 40, options: ["Startup", "Small business", "D2C brand", "Service business", "Other"], hint: "As submitted. Not a funding or turnover check." },
    { key: "industry", label: "Industry", kind: "text", required: true, max: 80, hint: "As submitted." },
    { key: "market", label: "Target market", kind: "text", required: true, max: 120, hint: "Who the business serves." },
    { key: "socialUrl", label: "Public social profile", kind: "url", max: 300, urlKind: "any", hint: "Optional." },
  ],
  "developer-tools": [
    countryField,
    { key: "toolType", label: "Tool type", kind: "select", required: true, max: 40, options: ["Library", "API", "CLI", "Browser extension", "Development platform", "Other"], hint: "As submitted." },
    { key: "platform", label: "Supported technology or platform", kind: "text", required: true, max: 120, hint: "For example, a language, framework, or operating system." },
    { key: "openSource", label: "Open-source status", kind: "select", required: true, max: 20, options: ["Yes", "No", "Not applicable"], hint: "As submitted. A repository link is not a licence review." },
    { key: "repositoryUrl", label: "Repository URL", kind: "url", max: 300, urlKind: "repository", hint: "Optional public repository." },
  ],
  "instagram-pages": [
    countryField,
    { key: "profileUrl", label: "Public Instagram profile URL", kind: "url", required: true, max: 300, urlKind: "instagram", hint: "A public instagram.com URL. Never a password or session." },
    { key: "handle", label: "Public handle", kind: "text", required: true, max: 40, hint: "Without a password or token." },
    { key: "niche", label: "Page niche", kind: "text", required: true, max: 120, hint: "As submitted." },
    { key: "audienceSize", label: "Publicly stated audience size", kind: "text", max: 40, hint: "Optional. Not required, and not verified." },
  ],
  "youtube-channels": [
    countryField,
    { key: "channelUrl", label: "Public YouTube channel URL", kind: "url", required: true, max: 300, urlKind: "youtube", hint: "A public YouTube URL. Never a password or analytics login." },
    { key: "niche", label: "Content niche", kind: "text", required: true, max: 120, hint: "As submitted." },
    { key: "subscribers", label: "Public subscriber count", kind: "text", max: 40, hint: "Optional. Listing a channel does not verify the audience." },
  ],
  "other-online-profiles": [
    countryField,
    { key: "platform", label: "Platform", kind: "select", required: true, max: 40, options: ["LinkedIn", "X", "Personal website", "Portfolio", "Community", "Newsletter", "Other"], hint: "Where the public profile lives." },
    { key: "purpose", label: "Profile purpose or niche", kind: "text", required: true, max: 160, hint: "As submitted." },
  ],
  "gaming-esports": [
    countryField,
    { key: "title", label: "Game or esports title", kind: "text", required: true, max: 80, hint: "The game or competition. Gambling and cheating services are not allowed." },
    { key: "listingType", label: "Listing type", kind: "select", required: true, max: 40, options: ["Player", "Team", "Tournament", "Community", "Gaming website"], hint: "As submitted." },
    { key: "profileUrl", label: "Public profile or team URL", kind: "url", max: 300, urlKind: "any", hint: "Optional." },
  ],
  "art-creative-work": [
    countryField,
    { key: "discipline", label: "Creative discipline", kind: "select", required: true, max: 40, options: ["Illustration", "Photography", "Design", "Writing", "Animation", "Other"], hint: "As submitted." },
    { key: "shopUrl", label: "Shop or commission URL", kind: "url", max: 300, urlKind: "any", hint: "Optional public page." },
  ],
  "music-entertainment": [
    countryField,
    { key: "listingType", label: "Listing type", kind: "select", required: true, max: 40, options: ["Musician", "Podcast", "Entertainment channel", "Event", "Other"], hint: "As submitted." },
    { key: "genre", label: "Genre or niche", kind: "text", required: true, max: 80, hint: "As submitted." },
    { key: "streamingUrl", label: "Public streaming or social link", kind: "url", max: 300, urlKind: "any", hint: "Optional." },
  ],
  "skills-portfolios": [
    countryField,
    { key: "profession", label: "Profession or skill category", kind: "text", required: true, max: 80, hint: "As submitted. Do not include government IDs or home addresses." },
    { key: "skills", label: "Publicly displayed skills", kind: "text", max: 200, hint: "Optional." },
  ],
};

export const CATALOGUE = [
  { slug: "websites-saas", name: "Websites & SaaS", description: "Public websites, web apps, and software products.", fieldSet: "websites-saas", sort: 1 },
  { slug: "business-startups", name: "Business & Startups", description: "Companies, brands, and service businesses with a public page.", fieldSet: "business-startups", sort: 2 },
  { slug: "developer-tools", name: "Developer Tools", description: "Libraries, APIs, CLIs, and other tools for people building software.", fieldSet: "developer-tools", sort: 3 },
  { slug: "instagram-pages", name: "Instagram Pages", description: "Public Instagram pages. Account passwords and private data are never collected.", fieldSet: "instagram-pages", sort: 4 },
  { slug: "youtube-channels", name: "YouTube Channels", description: "Public YouTube channels. Listing a channel does not verify its audience.", fieldSet: "youtube-channels", sort: 5 },
  { slug: "other-online-profiles", name: "Other Online Profiles", description: "Public profiles on LinkedIn, X, a personal site, or a similar network.", fieldSet: "other-online-profiles", sort: 6 },
  { slug: "gaming-esports", name: "Gaming & Esports", description: "Players, teams, tournaments, communities, and gaming websites. Gambling and cheating services are excluded.", fieldSet: "gaming-esports", sort: 7 },
  { slug: "art-creative-work", name: "Art & Creative Work", description: "Public portfolios of illustration, photography, design, writing, and animation.", fieldSet: "art-creative-work", sort: 8 },
  { slug: "music-entertainment", name: "Music & Entertainment", description: "Musicians, podcasts, entertainment channels, and public events.", fieldSet: "music-entertainment", sort: 9 },
  { slug: "skills-portfolios", name: "Skills & Portfolios", description: "Professional profiles and portfolios. Government IDs and private employment documents are not collected.", fieldSet: "skills-portfolios", sort: 10 },
] as const;

const GAMBLING = /\b(gambling|casino|sportsbook|wager(?:ing)?|betting|cheat(?:ing|s)?|stolen account|account theft)\b/i;

export function fieldsFor(fieldSet: string): ListingField[] {
  return FIELD_SETS[fieldSet] ?? [];
}

export function isActiveFieldSet(fieldSet: string): boolean {
  return Object.prototype.hasOwnProperty.call(FIELD_SETS, fieldSet);
}

function destination(value: string, kind: UrlKind, label: string): string {
  const normalized = normalizeWebsiteUrl(value);
  const host = new URL(normalized).hostname;
  if (kind === "instagram" && host !== "instagram.com") throw new Error(`${label} must be a public instagram.com URL.`);
  if (kind === "youtube" && host !== "youtube.com" && host !== "youtu.be" && host !== "m.youtube.com") {
    throw new Error(`${label} must be a public YouTube URL.`);
  }
  return normalized;
}

export function sanitizeDetails(fieldSet: string, input: unknown): Record<string, string> {
  const fields = fieldsFor(fieldSet);
  if (fields.length === 0) throw new Error("This category is not open for submissions.");
  const source = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const details: Record<string, string> = {};
  for (const field of fields) {
    const raw = source[field.key];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) {
      if (field.required) throw new Error(`Add ${field.label.toLowerCase()}.`);
      continue;
    }
    if (value.length > field.max) throw new Error(`${field.label} is too long.`);
    if (field.kind === "select" && field.options && !field.options.includes(value)) {
      throw new Error(`Choose a valid ${field.label.toLowerCase()}.`);
    }
    details[field.key] = field.kind === "url" ? destination(value, field.urlKind ?? "any", field.label) : value;
  }
  if (!details.country) details.country = "India";
  if (fieldSet === "gaming-esports" && GAMBLING.test(Object.values(details).join(" "))) {
    throw new Error("Gambling, wagering, and cheating services cannot be listed.");
  }
  return details;
}

export function assertPermittedCopy(fieldSet: string, texts: string[]): void {
  if (fieldSet !== "gaming-esports") return;
  if (GAMBLING.test(texts.join(" "))) throw new Error("Gambling, wagering, and cheating services cannot be listed.");
}

export function boardQuery(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/[%_\\]/g, " ").replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}
