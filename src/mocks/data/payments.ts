import { productId } from "@/mocks/data/products";

export const refundedOrderSeed = {
  id: "40000000-0000-4000-8000-000000000022",
  productId: productId(22),
  amountPaise: 15_000,
  paidAt: "2026-09-18T04:00:00.000Z",
  refundedAt: "2026-09-19T04:00:00.000Z",
} as const;

export const failedOrderSeed = {
  id: "40000000-0000-4000-8000-000000000098",
  productId: productId(7),
  amountPaise: 9_900,
  createdAt: "2026-10-02T04:00:00.000Z",
} as const;

export const cancelledOrderSeed = {
  id: "40000000-0000-4000-8000-000000000099",
  productId: productId(9),
  amountPaise: 12_000,
  createdAt: "2026-10-03T04:00:00.000Z",
} as const;
