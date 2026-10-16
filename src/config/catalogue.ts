export const CATEGORY_GROUPS = [
  { slug: "digital-presence", name: "Digital Presence", sort: 1 },
  { slug: "lifestyle", name: "Lifestyle & Possessions", sort: 2 },
  { slug: "success", name: "Success & Identity", sort: 3 },
  { slug: "community", name: "Community & Entertainment", sort: 4 },
] as const;

export type FieldKind = "text" | "textarea" | "url" | "number";

export interface ListingField {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  max: number;
  hint: string;
}

/** Reusable field sets. A category stores `field_set` and can be pointed at any set. */
export const FIELD_SETS: Record<string, ListingField[]> = {
  website: [
    { key: "audience", label: "Who it is for", kind: "text", max: 120, hint: "Submitted by the lister. Not checked." },
  ],
  instagram: [
    { key: "handle", label: "Instagram handle", kind: "text", required: true, max: 40, hint: "As submitted. This does not verify the account." },
    { key: "niche", label: "What the page is about", kind: "text", max: 120, hint: "As submitted." },
  ],
  youtube: [
    { key: "handle", label: "Channel handle", kind: "text", required: true, max: 80, hint: "As submitted. This does not verify the channel." },
    { key: "topic", label: "Topic", kind: "text", max: 120, hint: "As submitted." },
  ],
  profile: [
    { key: "platform", label: "Platform", kind: "text", required: true, max: 40, hint: "Where this profile lives." },
    { key: "handle", label: "Handle", kind: "text", max: 80, hint: "As submitted." },
  ],
  vehicle: [
    { key: "make", label: "Make", kind: "text", required: true, max: 40, hint: "As submitted. Not a registration check." },
    { key: "model", label: "Model", kind: "text", required: true, max: 40, hint: "As submitted." },
    { key: "year", label: "Year", kind: "number", max: 4, hint: "As submitted." },
    { key: "city", label: "City", kind: "text", max: 60, hint: "Optional." },
  ],
  collection: [
    { key: "focus", label: "What the collection is", kind: "text", required: true, max: 120, hint: "As submitted." },
    { key: "highlights", label: "Highlights", kind: "textarea", max: 500, hint: "As submitted. Not an appraisal." },
  ],
  travel: [
    { key: "destination", label: "Destination", kind: "text", required: true, max: 80, hint: "As submitted." },
    { key: "when", label: "When", kind: "text", max: 80, hint: "As submitted." },
  ],
  fashion: [
    { key: "focus", label: "Focus", kind: "text", required: true, max: 120, hint: "As submitted." },
    { key: "highlights", label: "Highlights", kind: "textarea", max: 500, hint: "As submitted." },
  ],
  business: [
    { key: "stage", label: "Stage", kind: "text", max: 40, hint: "As submitted. Not a funding check." },
    { key: "city", label: "City", kind: "text", max: 60, hint: "Optional." },
  ],
  achievement: [
    { key: "year", label: "Year", kind: "number", max: 4, hint: "As submitted." },
    { key: "evidence", label: "Public evidence link", kind: "url", max: 300, hint: "Optional. A link is not proof the claim was checked." },
  ],
  gaming: [
    { key: "game", label: "Game", kind: "text", required: true, max: 80, hint: "As submitted." },
    { key: "handle", label: "Player or team name", kind: "text", required: true, max: 80, hint: "As submitted. Not a platform verification." },
  ],
  fitness: [
    { key: "focus", label: "Focus", kind: "text", required: true, max: 120, hint: "As submitted. Not a medical or coaching credential." },
    { key: "city", label: "City", kind: "text", max: 60, hint: "Optional." },
  ],
  music: [
    { key: "role", label: "Role", kind: "text", required: true, max: 80, hint: "Artist, label, playlist, or show. As submitted." },
    { key: "sample", label: "Public sample link", kind: "url", max: 300, hint: "Optional." },
  ],
  artwork: [
    { key: "medium", label: "Medium", kind: "text", required: true, max: 80, hint: "As submitted." },
    { key: "year", label: "Year", kind: "number", max: 4, hint: "Optional." },
  ],
};

export const CATALOGUE = [
  { slug: "websites-saas", name: "Websites & SaaS", description: "Sites, apps, and software people can open on the public web.", group: "digital-presence", fieldSet: "website", sort: 1 },
  { slug: "instagram-pages", name: "Instagram Pages", description: "Public Instagram pages and profiles.", group: "digital-presence", fieldSet: "instagram", sort: 2 },
  { slug: "youtube-channels", name: "YouTube Channels", description: "Public YouTube channels.", group: "digital-presence", fieldSet: "youtube", sort: 3 },
  { slug: "other-online-profiles", name: "Other Online Profiles", description: "Public profiles on other networks.", group: "digital-presence", fieldSet: "profile", sort: 4 },
  { slug: "cars-bikes", name: "Cars & Bikes", description: "Vehicles people choose to show publicly.", group: "lifestyle", fieldSet: "vehicle", sort: 1 },
  { slug: "luxury-gadgets", name: "Luxury & Gadgets", description: "Collections of watches, devices, and other objects.", group: "lifestyle", fieldSet: "collection", sort: 2 },
  { slug: "travel-experiences", name: "Travel & Experiences", description: "Trips and experiences described by the person who took them.", group: "lifestyle", fieldSet: "travel", sort: 3 },
  { slug: "fashion-collections", name: "Fashion & Collections", description: "Wardrobes, drops, and styled collections.", group: "lifestyle", fieldSet: "fashion", sort: 4 },
  { slug: "business-startups", name: "Business & Startups", description: "Companies and projects with a public page.", group: "success", fieldSet: "business", sort: 1 },
  { slug: "achievements-skills", name: "Achievements & Skills", description: "Claims about work, awards, or skills. These are not verified facts.", group: "success", fieldSet: "achievement", sort: 2 },
  { slug: "gaming-esports", name: "Gaming & Esports", description: "Players, teams, and public gaming profiles.", group: "community", fieldSet: "gaming", sort: 1 },
  { slug: "fitness-lifestyle", name: "Fitness & Lifestyle", description: "Training, routines, and public fitness profiles.", group: "community", fieldSet: "fitness", sort: 2 },
  { slug: "music-entertainment", name: "Music & Entertainment", description: "Artists, shows, and public entertainment pages.", group: "community", fieldSet: "music", sort: 3 },
  { slug: "art-creative-work", name: "Art & Creative Work", description: "Artwork and other creative work with a public page.", group: "community", fieldSet: "artwork", sort: 4 },
] as const;

const groupsBySlug = new Map(CATEGORY_GROUPS.map((group) => [group.slug, group]));

export function groupFor(slug: string) {
  return groupsBySlug.get(slug as (typeof CATEGORY_GROUPS)[number]["slug"]) ?? null;
}

export function fieldsFor(fieldSet: string): ListingField[] {
  return FIELD_SETS[fieldSet] ?? FIELD_SETS.website;
}

export function sanitizeDetails(fieldSet: string, input: unknown): Record<string, string> {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const details: Record<string, string> = {};
  for (const field of fieldsFor(fieldSet)) {
    const raw = source[field.key];
    const value = typeof raw === "string" ? raw.trim() : typeof raw === "number" && Number.isFinite(raw) ? String(raw) : "";
    if (!value) {
      if (field.required) throw new Error(`Add ${field.label.toLowerCase()}.`);
      continue;
    }
    if (value.length > field.max) throw new Error(`${field.label} is too long.`);
    if (field.kind === "number" && !/^\d{1,4}$/.test(value)) throw new Error(`${field.label} should be a year or a number.`);
    if (field.kind === "url" && !/^https:\/\/[^\s]+$/.test(value)) throw new Error(`${field.label} must be an https link.`);
    details[field.key] = value;
  }
  return details;
}

export function boardQuery(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/[%_\\]/g, " ").replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}
