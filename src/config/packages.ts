/** Server-side catalogue of advertising packages. Checkout ignores any client price. */
export const PACKAGE_SLUGS = ["daily-featured", "weekly-featured", "weekly-category-sponsor"] as const;

export type PackageSlug = (typeof PACKAGE_SLUGS)[number];
export type AdPlacement = "daily_featured" | "weekly_featured" | "category_sponsor";

export interface AdPackageDefinition {
  slug: PackageSlug;
  name: string;
  description: string;
  pricePaise: number;
  durationHours: number;
  placement: AdPlacement;
  exclusive: boolean;
}

export const PACKAGE_DEFAULTS: readonly AdPackageDefinition[] = [
  {
    slug: "daily-featured",
    name: "Daily featured profile",
    description: "A labelled advertisement beside discovery for 24 hours from activation. It does not change the organic score, and a higher payment cannot move it ahead of an advertisement that started earlier.",
    pricePaise: 19_900,
    durationHours: 24,
    placement: "daily_featured",
    exclusive: false,
  },
  {
    slug: "weekly-featured",
    name: "Weekly featured profile",
    description: "A labelled advertisement on the creator directory for seven days from activation. Organic profiles keep their own score.",
    pricePaise: 99_900,
    durationHours: 24 * 7,
    placement: "weekly_featured",
    exclusive: false,
  },
  {
    slug: "weekly-category-sponsor",
    name: "Weekly lane sponsor",
    description: "A labelled sponsorship on one creator lane for seven days from activation. Sponsors share that slot in start-time order. The organic list in that lane is unchanged.",
    pricePaise: 199_900,
    durationHours: 24 * 7,
    placement: "category_sponsor",
    exclusive: false,
  },
];

export function packageBySlug(slug: string): AdPackageDefinition | null {
  return PACKAGE_DEFAULTS.find((item) => item.slug === slug) ?? null;
}

/** The charged amount is always the server price. A different client amount is rejected. */
export function priceForCheckout(serverPricePaise: number, clientPricePaise?: number): number {
  if (!Number.isInteger(serverPricePaise) || serverPricePaise <= 0) {
    throw new Error("This package has no server price.");
  }
  if (clientPricePaise != null && clientPricePaise !== serverPricePaise) {
    throw new Error("The package price is set on the server.");
  }
  return serverPricePaise;
}
