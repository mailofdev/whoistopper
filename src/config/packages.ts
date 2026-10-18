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
    name: "Daily Featured Listing",
    description: "A labelled advertisement on Today's Featured Ads for 24 hours from activation. It does not buy a rank, and a higher payment cannot move it ahead of an advertisement that started earlier.",
    pricePaise: 19_900,
    durationHours: 24,
    placement: "daily_featured",
    exclusive: false,
  },
  {
    slug: "weekly-featured",
    name: "Weekly Featured Listing",
    description: "A labelled advertisement in the featured strip on the permanent directory for seven days from activation. Organic listings stay in their own order.",
    pricePaise: 99_900,
    durationHours: 24 * 7,
    placement: "weekly_featured",
    exclusive: false,
  },
  {
    slug: "weekly-category-sponsor",
    name: "Weekly Category Sponsor",
    description: "A labelled sponsorship on one category for seven days from activation. Sponsors share that slot in start-time order. The organic category list is unchanged.",
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
