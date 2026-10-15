import { productId } from "@/mocks/data/products";

/** Relative daily bids. The store copies them onto the current UTC day at startup. */
export const dailyBidTemplate = [
  { productId: productId(23), amountPaise: 150_000 },
  { productId: productId(24), amountPaise: 80_000 },
  { productId: productId(6), amountPaise: 20_000 },
] as const;

export const sponsoredSeed = {
  productId: productId(11),
  days: 7,
} as const;
