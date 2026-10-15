import { assignRanks } from "@/features/leaderboards/engine";
import type { MockStore, StoredOrder, StoredProduct, StoredUser } from "@/mocks/store";
import type {
  LeaderboardEntry,
  OrderDetail,
  ProductCardModel,
  ProductDetail,
  SessionUser,
} from "@/types/domain";

export function toSession(user: StoredUser): SessionUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    username: user.username,
    role: user.role,
    emailVerified: user.emailVerified,
    mfaEnabled: user.mfaEnabled,
    bio: user.bio,
    website: user.website,
  };
}

export function toDetail(store: MockStore, product: StoredProduct, today: string): ProductDetail {
  const category = store.categories.find((item) => item.id === product.categoryId);
  const owner = store.users.find((item) => item.id === product.ownerId && !item.deletedAt);
  const allTime = rankFor(store, product.id, "all_time", "all_time");
  const daily = rankFor(store, product.id, "daily", today);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    websiteUrl: product.websiteUrl,
    normalizedUrl: product.normalizedUrl,
    shortDescription: product.shortDescription,
    fullDescription: product.fullDescription,
    logoUrl: product.logoUrl,
    categoryId: product.categoryId,
    categorySlug: category?.slug ?? "",
    categoryName: category?.name ?? "Uncategorised",
    tags: product.tags,
    ownerId: product.ownerId,
    ownerUsername: owner?.username ?? null,
    ownerDisplayName: owner?.displayName ?? null,
    creatorName: product.creatorName,
    socialLinks: product.socialLinks,
    status: product.status,
    rejectionReason: product.rejectionReason,
    ownershipVerified: product.ownershipVerified,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    approvedAt: product.approvedAt,
    allTimeRank: allTime?.rank ?? null,
    allTimeAmountPaise: allTime?.amountPaise ?? null,
    todayRank: daily?.rank ?? null,
    todayAmountPaise: daily?.amountPaise ?? null,
  };
}

export function toCard(
  store: MockStore,
  product: StoredProduct,
  placement?: { rank: number | null; amountPaise: number | null; kind: "paid" | "free" },
): ProductCardModel {
  const category = store.categories.find((item) => item.id === product.categoryId);
  const paid = placement ?? rankFor(store, product.id, "all_time", "all_time");
  const kind = placement?.kind ?? (paid ? "paid" : "free");
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    categoryName: category?.name ?? "Uncategorised",
    categorySlug: category?.slug ?? "",
    tags: product.tags,
    placement: kind,
    rank: kind === "paid" ? (placement?.rank ?? paid?.rank ?? null) : null,
    amountPaise: kind === "paid" ? (placement?.amountPaise ?? paid?.amountPaise ?? null) : null,
    ownershipVerified: product.ownershipVerified,
    approvedAt: product.approvedAt,
  };
}

export function toOrder(store: MockStore, order: StoredOrder): OrderDetail {
  const product = store.products.find((item) => item.id === order.productId);
  return {
    id: order.id,
    userId: order.userId,
    productId: order.productId,
    productName: product?.name ?? "Listing",
    productSlug: product?.slug ?? "",
    provider: order.provider,
    providerOrderId: order.providerOrderId,
    providerPaymentId: order.providerPaymentId,
    amountPaise: order.amountPaise,
    currency: "INR",
    purpose: order.purpose,
    scopeType: order.scopeType,
    scopeKey: order.scopeKey,
    quotedRank: order.quotedRank,
    finalRank: order.finalRank,
    status: order.status,
    fulfillment: order.fulfillment,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    paidAt: order.paidAt,
  };
}

export function rankFor(
  store: MockStore,
  productId: string,
  scopeType: "all_time" | "daily" | "category",
  scopeKey: string,
): { rank: number; amountPaise: number; confirmedAt: string } | null {
  const ranked = assignRanks(
    store.placements
      .filter((item) => item.scopeType === scopeType && item.scopeKey === scopeKey && item.status === "active")
      .map((item) => ({
        id: item.id,
        productId: item.productId,
        amountPaise: item.amountPaise,
        confirmedAt: item.confirmedAt,
      })),
  );
  const match = ranked.find((item) => item.productId === productId);
  return match ? { rank: match.rank, amountPaise: match.amountPaise, confirmedAt: match.confirmedAt } : null;
}

export function boardEntries(store: MockStore, scopeType: "all_time" | "daily" | "category", scopeKey: string): LeaderboardEntry[] {
  const ranked = assignRanks(
    store.placements
      .filter((item) => item.scopeType === scopeType && item.scopeKey === scopeKey && item.status === "active")
      .map((item) => ({
        id: item.id,
        productId: item.productId,
        amountPaise: item.amountPaise,
        confirmedAt: item.confirmedAt,
      })),
  );
  const paidIds = new Set(ranked.map((item) => item.productId));
  const paid: LeaderboardEntry[] = ranked.flatMap((placement) => {
    const product = store.products.find((item) => item.id === placement.productId && item.status === "approved");
    if (!product) return [];
    return [{
      ...toCard(store, product, { rank: placement.rank, amountPaise: placement.amountPaise, kind: "paid" }),
      confirmedAt: placement.confirmedAt,
    }];
  });
  const free: LeaderboardEntry[] = store.products
    .filter((product) => product.status === "approved" && !paidIds.has(product.id))
    .filter((product) => scopeType !== "category" || product.categoryId === scopeKey)
    .sort((a, b) => (b.approvedAt ?? "").localeCompare(a.approvedAt ?? "") || a.name.localeCompare(b.name))
    .map((product) => ({
      ...toCard(store, product, { rank: null, amountPaise: null, kind: "free" }),
      confirmedAt: null,
    }));
  return [...paid, ...free];
}
