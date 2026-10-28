import { normalizeWebsiteUrl } from "@/lib/urls";

export const CREATOR_FIELD_SET = "creator";

export const ACTIVE_CATEGORY_SLUGS = [
  "youtube",
  "streaming",
  "gaming",
  "esports",
  "clips",
  "communities",
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

/**
 * Moves for known legacy slugs. Listings on slugs outside this map stay attached for a manual review.
 */
export const CATEGORY_MIGRATION: Record<string, { slug: string; reason: string }> = {
  saas: { slug: "communities", reason: "creator catalogue" },
  fintech: { slug: "communities", reason: "creator catalogue" },
  commerce: { slug: "communities", reason: "creator catalogue" },
  health: { slug: "communities", reason: "creator catalogue" },
  climate: { slug: "communities", reason: "creator catalogue" },
  education: { slug: "communities", reason: "creator catalogue" },
  media: { slug: "streaming", reason: "creator catalogue" },
  "achievements-skills": { slug: "communities", reason: "creator catalogue" },
  "websites-saas": { slug: "communities", reason: "creator catalogue" },
  "business-startups": { slug: "communities", reason: "creator catalogue" },
  "developer-tools": { slug: "communities", reason: "creator catalogue" },
  "instagram-pages": { slug: "clips", reason: "creator catalogue" },
  "youtube-channels": { slug: "youtube", reason: "creator catalogue" },
  "other-online-profiles": { slug: "communities", reason: "creator catalogue" },
  "gaming-esports": { slug: "gaming", reason: "creator catalogue" },
  "art-creative-work": { slug: "communities", reason: "creator catalogue" },
  "music-entertainment": { slug: "streaming", reason: "creator catalogue" },
  "skills-portfolios": { slug: "communities", reason: "creator catalogue" },
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

const handle: ListingField = { key: "handle", label: "Handle", kind: "text", required: true, max: 40, hint: "" };
const games: ListingField = { key: "games", label: "Games", kind: "text", required: true, max: 160, hint: "Comma-separated" };
const languages: ListingField = { key: "languages", label: "Languages", kind: "text", required: true, max: 120, hint: "Comma-separated" };
const achievements: ListingField = { key: "achievements", label: "Achievements", kind: "textarea", max: 500, hint: "Optional. Not verified." };
const featuredVideo: ListingField = { key: "featuredVideoUrl", label: "Featured video", kind: "url", max: 300, urlKind: "youtube", hint: "Optional YouTube link" };

function platform(options: readonly string[]): ListingField {
  return { key: "platform", label: "Platform", kind: "select", required: true, max: 40, options, hint: "" };
}

/** Lane-specific questions. The public channel URL is a separate field on the form. */
const LANE_FIELDS: Record<string, ListingField[]> = {
  youtube: [platform(["YouTube"]), handle, games, languages, featuredVideo, achievements],
  streaming: [platform(["Twitch", "Kick", "YouTube"]), handle, games, languages],
  gaming: [platform(["YouTube", "Twitch", "Kick", "Other"]), handle, games, languages, achievements],
  esports: [
    platform(["YouTube", "Twitch", "Kick", "Other"]),
    { key: "role", label: "Role", kind: "select", required: true, max: 40, options: ["Player", "Team", "Organisation"], hint: "" },
    handle,
    games,
    languages,
    achievements,
  ],
  clips: [platform(["YouTube", "TikTok", "Instagram"]), handle, games, languages],
  communities: [
    platform(["YouTube", "Twitch", "Kick", "Other"]),
    handle,
    { ...games, required: false, hint: "Optional, comma-separated" },
    languages,
  ],
};

const displayFields: ListingField[] = [
  platform(["YouTube", "Twitch", "Kick", "TikTok", "Instagram", "Other"]),
  { key: "role", label: "Role", kind: "text", max: 40, hint: "" },
  handle,
  games,
  languages,
  { key: "country", label: "Country", kind: "text", max: 80, hint: "" },
  achievements,
  featuredVideo,
  { key: "profileUrl", label: "Profile URL", kind: "url", max: 300, urlKind: "any", hint: "" },
  { key: "bannerUrl", label: "Banner image URL", kind: "url", max: 300, urlKind: "any", hint: "" },
];

export const FIELD_SETS: Record<string, ListingField[]> = {
  [CREATOR_FIELD_SET]: displayFields,
};

export const LANE_SOCIALS: Record<string, readonly ("youtube" | "twitch" | "kick" | "instagram" | "x" | "linkedin")[]> = {
  youtube: ["youtube", "instagram", "x"],
  streaming: ["twitch", "kick", "youtube", "x"],
  gaming: ["twitch", "youtube", "x"],
  esports: ["twitch", "youtube", "x"],
  clips: ["youtube", "instagram", "x"],
  communities: ["youtube", "twitch", "instagram", "x"],
};

export const CHANNEL_LABEL: Record<string, string> = {
  youtube: "YouTube channel URL",
  streaming: "Stream or channel URL",
  gaming: "Profile URL",
  esports: "Team or player URL",
  clips: "Clip channel URL",
  communities: "Community URL",
};

export const CATALOGUE = [
  { slug: "youtube", name: "YouTube", description: "Channels and YouTube creators with a public page.", fieldSet: CREATOR_FIELD_SET, sort: 1 },
  { slug: "streaming", name: "Streaming", description: "Live streamers on Twitch, Kick, YouTube, and similar public platforms.", fieldSet: CREATOR_FIELD_SET, sort: 2 },
  { slug: "gaming", name: "Gaming", description: "Players and gaming creators. Gambling and cheating services are excluded.", fieldSet: CREATOR_FIELD_SET, sort: 3 },
  { slug: "esports", name: "Esports", description: "Players, teams, and competitive organisations with a public profile.", fieldSet: CREATOR_FIELD_SET, sort: 4 },
  { slug: "clips", name: "Clips", description: "Short-form creators on Shorts, TikTok, Reels, and clip channels.", fieldSet: CREATOR_FIELD_SET, sort: 5 },
  { slug: "communities", name: "Communities", description: "Game communities, shows, and other public creator pages.", fieldSet: CREATOR_FIELD_SET, sort: 6 },
] as const;

const GAMBLING = /\b(gambling|casino|sportsbook|wager(?:ing)?|betting|cheat(?:ing|s)?|stolen account|account theft)\b/i;

export function fieldsFor(fieldSet: string): ListingField[] {
  return LANE_FIELDS[fieldSet] ?? FIELD_SETS[fieldSet] ?? [];
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
  if (GAMBLING.test(Object.values(details).join(" "))) {
    throw new Error("Gambling, wagering, and cheating services cannot be listed.");
  }
  return details;
}

export function assertPermittedCopy(_fieldSet: string, texts: string[]): void {
  if (GAMBLING.test(texts.join(" "))) throw new Error("Gambling, wagering, and cheating services cannot be listed.");
}

export function boardQuery(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/[%_\\]/g, " ").replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}
