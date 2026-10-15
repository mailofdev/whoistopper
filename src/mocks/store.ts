import { randomUUID } from "node:crypto";
import { assignRanks, utcDayKey } from "@/features/leaderboards/engine";
import { sampleCount } from "@/mocks/data/analytics";
import { categories } from "@/mocks/data/categories";
import { dailyBidTemplate, sponsoredSeed } from "@/mocks/data/leaderboards";
import { cancelledOrderSeed, failedOrderSeed, refundedOrderSeed } from "@/mocks/data/payments";
import { productId, seedProducts } from "@/mocks/data/products";
import { mockPasswordHash, seedUsers } from "@/mocks/data/users";
import type {
  AuditEntry,
  Category,
  ContactInput,
  Fulfillment,
  LedgerEntry,
  NotificationItem,
  OrderStatus,
  OwnershipClaim,
  PaymentProvider,
  PaymentPurpose,
  PlatformSettings,
  ProductStatus,
  ReportItem,
  ScopeType,
  SocialLinks,
  SponsoredPlacement,
  UserRole,
  WebhookFailure,
} from "@/types/domain";

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  username: string;
  role: UserRole;
  emailVerified: boolean;
  mfaEnabled: boolean;
  bio: string;
  website: string | null;
  createdAt: string;
  deletedAt: string | null;
}

export interface StoredProduct {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string;
  normalizedUrl: string;
  shortDescription: string;
  fullDescription: string;
  logoUrl: string | null;
  categoryId: string;
  tags: string[];
  ownerId: string | null;
  creatorName: string;
  socialLinks: SocialLinks;
  status: ProductStatus;
  rejectionReason: string | null;
  ownershipVerified: boolean;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
}

export interface StoredPlacement {
  id: string;
  productId: string;
  scopeType: ScopeType;
  scopeKey: string;
  amountPaise: number;
  confirmedAt: string;
  status: "active" | "superseded";
  orderId: string | null;
}

export interface StoredOrder {
  id: string;
  userId: string;
  productId: string;
  provider: PaymentProvider;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  amountPaise: number;
  currency: "INR";
  purpose: PaymentPurpose;
  scopeType: ScopeType | null;
  scopeKey: string | null;
  quotedRank: number | null;
  finalRank: number | null;
  status: OrderStatus;
  fulfillment: Fulfillment;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
}

export interface StoredClaim extends OwnershipClaim {
  userId: string;
  tokenHash: string;
  token?: string;
}

export interface MockStore {
  users: StoredUser[];
  categories: Category[];
  products: StoredProduct[];
  placements: StoredPlacement[];
  orders: StoredOrder[];
  events: { id: string; provider: string; eventId: string; type: string; createdAt: string }[];
  ledger: LedgerEntry[];
  views: { productId: string; day: string; visitorHash: string }[];
  clicks: { productId: string; day: string; dedupeKey: string }[];
  notifications: NotificationItem[];
  claims: StoredClaim[];
  reports: ReportItem[];
  audit: AuditEntry[];
  settings: PlatformSettings;
  sponsored: SponsoredPlacement[];
  contacts: Array<ContactInput & { id: string; createdAt: string }>;
  webhookFailures: WebhookFailure[];
  snapshots: { id: string; day: string; capturedAt: string; entryCount: number }[];
  devInbox: { id: string; to: string; subject: string; url: string; createdAt: string }[];
  passwordResets: { tokenHash: string; userId: string; expiresAt: string }[];
}

const owners = {
  ananya: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
  rohan: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
} as const;

function orderId(n: number): string {
  return `40000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

function paidOrder(input: {
  id: string;
  product: StoredProduct;
  amountPaise: number;
  scopeType: ScopeType;
  scopeKey: string;
  at: string;
  rank: number;
}): StoredOrder {
  return {
    id: input.id,
    userId: input.product.ownerId ?? owners.ananya,
    productId: input.product.id,
    provider: "sandbox",
    providerOrderId: `seed_${input.id}`,
    providerPaymentId: `seed_pay_${input.id}`,
    amountPaise: input.amountPaise,
    currency: "INR",
    purpose: "ranking_upgrade",
    scopeType: input.scopeType,
    scopeKey: input.scopeKey,
    quotedRank: input.rank,
    finalRank: input.rank,
    status: "paid",
    fulfillment: "fulfilled",
    idempotencyKey: `seed-${input.id}`,
    createdAt: input.at,
    updatedAt: input.at,
    paidAt: input.at,
  };
}

export function createStore(now = new Date()): MockStore {
  const settings: PlatformSettings = {
    minimumBidPaise: 9_900,
    minimumIncrementPaise: 1_000,
    maxBidPaise: 100_000_000,
    sponsoredWeeklyPricePaise: 49_900,
    sponsoredMaxActive: 3,
    holdNewListingsForReview: true,
  };

  const users: StoredUser[] = seedUsers.map((user, index) => ({
    id: user.id,
    email: user.email,
    passwordHash: mockPasswordHash(user.password),
    displayName: user.displayName,
    username: user.username,
    role: user.role,
    emailVerified: true,
    mfaEnabled: user.mfaEnabled,
    bio: user.bio,
    website: user.website,
    createdAt: new Date(Date.UTC(2026, 6, 1 + index)).toISOString(),
    deletedAt: null,
  }));

  const products: StoredProduct[] = seedProducts.map((seed) => {
    const createdAt = new Date(Date.UTC(2026, 7, seed.n, 8, 0, 0)).toISOString();
    const approved = seed.status === "approved" || seed.status === "suspended" || seed.status === "removed";
    return {
      id: productId(seed.n),
      slug: seed.slug,
      name: seed.name,
      websiteUrl: `https://${seed.host}`,
      normalizedUrl: `https://${seed.host}`,
      shortDescription: seed.short,
      fullDescription: seed.full,
      logoUrl: null,
      categoryId: categories.find((category) => category.slug === seed.categorySlug)?.id ?? categories[0].id,
      tags: seed.tags,
      ownerId: seed.owner ? owners[seed.owner] : null,
      creatorName: seed.creator,
      socialLinks: {},
      status: seed.status,
      rejectionReason: seed.status === "rejected" ? "The description did not explain what the product does." : null,
      ownershipVerified: seed.verified,
      createdAt,
      updatedAt: createdAt,
      approvedAt: approved ? createdAt : null,
    };
  });

  const placements: StoredPlacement[] = [];
  const orders: StoredOrder[] = [];
  const ledger: LedgerEntry[] = [];

  seedProducts.forEach((seed) => {
    const product = products.find((item) => item.id === productId(seed.n));
    if (!product) return;
    if (seed.allTimePaise && seed.allTimeAt) {
      const id = orderId(seed.n);
      placements.push({
        id: `50000000-0000-4000-8000-${String(seed.n).padStart(12, "0")}`,
        productId: product.id,
        scopeType: "all_time",
        scopeKey: "all_time",
        amountPaise: seed.allTimePaise,
        confirmedAt: seed.allTimeAt,
        status: "active",
        orderId: id,
      });
      orders.push(paidOrder({ id, product, amountPaise: seed.allTimePaise, scopeType: "all_time", scopeKey: "all_time", at: seed.allTimeAt, rank: 0 }));
    }
    if (seed.categoryPaise) {
      const id = orderId(100 + seed.n);
      const at = "2026-09-15T08:00:00.000Z";
      placements.push({
        id: `50000000-0000-4000-8000-${String(100 + seed.n).padStart(12, "0")}`,
        productId: product.id,
        scopeType: "category",
        scopeKey: product.categoryId,
        amountPaise: seed.categoryPaise,
        confirmedAt: at,
        status: "active",
        orderId: id,
      });
      orders.push(paidOrder({ id, product, amountPaise: seed.categoryPaise, scopeType: "category", scopeKey: product.categoryId, at, rank: 1 }));
    }
  });

  for (const offset of [0, 1, 2]) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset, 12, 0, 0));
    const key = utcDayKey(day);
    dailyBidTemplate.forEach((bid, index) => {
      const product = products.find((item) => item.id === bid.productId);
      if (!product) return;
      const at = new Date(day.getTime() - (index + 1) * 60_000).toISOString();
      const amountPaise = bid.amountPaise - offset * 1_000;
      const id = randomUUID();
      placements.push({
        id: randomUUID(),
        productId: product.id,
        scopeType: "daily",
        scopeKey: key,
        amountPaise,
        confirmedAt: at,
        status: "active",
        orderId: id,
      });
      orders.push(paidOrder({ id, product, amountPaise, scopeType: "daily", scopeKey: key, at, rank: index + 1 }));
    });
  }

  for (const order of orders) {
    ledger.push({
      id: randomUUID(),
      orderId: order.id,
      entryType: "charge",
      amountPaise: order.amountPaise,
      currency: "INR",
      direction: "credit",
      createdAt: order.paidAt ?? order.createdAt,
    });
  }

  const loom = products.find((product) => product.id === refundedOrderSeed.productId);
  if (loom?.ownerId) {
    orders.push({
      id: refundedOrderSeed.id,
      userId: loom.ownerId,
      productId: loom.id,
      provider: "sandbox",
      providerOrderId: `seed_${refundedOrderSeed.id}`,
      providerPaymentId: `seed_pay_${refundedOrderSeed.id}`,
      amountPaise: refundedOrderSeed.amountPaise,
      currency: "INR",
      purpose: "ranking_upgrade",
      scopeType: "all_time",
      scopeKey: "all_time",
      quotedRank: 6,
      finalRank: null,
      status: "refunded",
      fulfillment: "not_applicable",
      idempotencyKey: `seed-${refundedOrderSeed.id}`,
      createdAt: refundedOrderSeed.paidAt,
      updatedAt: refundedOrderSeed.refundedAt,
      paidAt: refundedOrderSeed.paidAt,
    });
    ledger.push(
      { id: randomUUID(), orderId: refundedOrderSeed.id, entryType: "charge", amountPaise: refundedOrderSeed.amountPaise, currency: "INR", direction: "credit", createdAt: refundedOrderSeed.paidAt },
      { id: randomUUID(), orderId: refundedOrderSeed.id, entryType: "refund", amountPaise: refundedOrderSeed.amountPaise, currency: "INR", direction: "debit", createdAt: refundedOrderSeed.refundedAt },
    );
  }

  const failedProduct = products.find((product) => product.id === failedOrderSeed.productId);
  const cancelledProduct = products.find((product) => product.id === cancelledOrderSeed.productId);
  if (failedProduct?.ownerId) {
    orders.push({
      id: failedOrderSeed.id,
      userId: failedProduct.ownerId,
      productId: failedProduct.id,
      provider: "sandbox",
      providerOrderId: `seed_${failedOrderSeed.id}`,
      providerPaymentId: null,
      amountPaise: failedOrderSeed.amountPaise,
      currency: "INR",
      purpose: "ranking_upgrade",
      scopeType: "all_time",
      scopeKey: "all_time",
      quotedRank: null,
      finalRank: null,
      status: "failed",
      fulfillment: "not_applicable",
      idempotencyKey: `seed-${failedOrderSeed.id}`,
      createdAt: failedOrderSeed.createdAt,
      updatedAt: failedOrderSeed.createdAt,
      paidAt: null,
    });
  }
  if (cancelledProduct?.ownerId) {
    orders.push({
      id: cancelledOrderSeed.id,
      userId: cancelledProduct.ownerId,
      productId: cancelledProduct.id,
      provider: "sandbox",
      providerOrderId: `seed_${cancelledOrderSeed.id}`,
      providerPaymentId: null,
      amountPaise: cancelledOrderSeed.amountPaise,
      currency: "INR",
      purpose: "ranking_upgrade",
      scopeType: "daily",
      scopeKey: utcDayKey(now),
      quotedRank: null,
      finalRank: null,
      status: "cancelled",
      fulfillment: "not_applicable",
      idempotencyKey: `seed-${cancelledOrderSeed.id}`,
      createdAt: cancelledOrderSeed.createdAt,
      updatedAt: cancelledOrderSeed.createdAt,
      paidAt: null,
    });
  }

  const views: MockStore["views"] = [];
  const clicks: MockStore["clicks"] = [];
  for (const seed of seedProducts) {
    if (seed.status !== "approved") continue;
    for (let dayIndex = 0; dayIndex < 14; dayIndex += 1) {
      const day = utcDayKey(new Date(now.getTime() - dayIndex * 86_400_000));
      const viewCount = sampleCount(seed.n, dayIndex, "views");
      for (let index = 0; index < viewCount; index += 1) {
        views.push({ productId: productId(seed.n), day, visitorHash: `${seed.n}-${day}-v${index}` });
      }
      const clickCount = sampleCount(seed.n, dayIndex, "clicks");
      for (let index = 0; index < clickCount; index += 1) {
        clicks.push({ productId: productId(seed.n), day, dedupeKey: `${seed.n}-${day}-c${index}` });
      }
    }
  }

  fillSeedRanks(placements, orders);

  const amber = products.find((product) => product.id === sponsoredSeed.productId);
  const sponsored: SponsoredPlacement[] = amber
    ? [{
        id: "60000000-0000-4000-8000-000000000011",
        productId: amber.id,
        productName: amber.name,
        startsAt: now.toISOString(),
        endsAt: new Date(now.getTime() + sponsoredSeed.days * 86_400_000).toISOString(),
        active: true,
      }]
    : [];

  return {
    users,
    categories: categories.map((category) => ({ ...category })),
    products,
    placements,
    orders,
    events: [],
    ledger,
    views,
    clicks,
    notifications: [
      {
        id: "70000000-0000-4000-8000-000000000001",
        userId: owners.ananya,
        title: "Nadi Payroll is approved",
        body: "The listing is public. Ranking still requires a verified payment.",
        href: "/products/nadi-payroll",
        readAt: null,
        createdAt: "2026-08-02T08:00:00.000Z",
      },
    ],
    claims: [],
    reports: [
      {
        id: "80000000-0000-4000-8000-000000000004",
        productId: productId(4),
        productName: "BazaarKit",
        reporterId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
        reason: "inaccurate",
        details: "The sample report says the catalogue description may be out of date.",
        status: "open",
        createdAt: "2026-10-10T08:00:00.000Z",
      },
    ],
    audit: [
      {
        id: "90000000-0000-4000-8000-000000000001",
        actorId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
        actorName: "Meera Nair",
        action: "product.approved",
        entityType: "product",
        entityId: productId(1),
        createdAt: "2026-08-02T08:00:00.000Z",
      },
    ],
    settings,
    sponsored,
    contacts: [],
    webhookFailures: [
      {
        id: "91000000-0000-4000-8000-000000000001",
        provider: "sandbox",
        eventId: "evt_unknown_sample",
        error: "No order matches this provider reference.",
        createdAt: "2026-10-11T08:00:00.000Z",
        resolvedAt: null,
      },
    ],
    snapshots: [],
    devInbox: [],
    passwordResets: [],
  };
}

function fillSeedRanks(placements: StoredPlacement[], orders: StoredOrder[]) {
  const groups = new Map<string, StoredPlacement[]>();
  for (const placement of placements) {
    if (placement.status !== "active") continue;
    const key = `${placement.scopeType}|${placement.scopeKey}`;
    const list = groups.get(key) ?? [];
    list.push(placement);
    groups.set(key, list);
  }
  for (const list of groups.values()) {
    const ranked = assignRanks(
      list.map((placement) => ({
        id: placement.id,
        productId: placement.productId,
        amountPaise: placement.amountPaise,
        confirmedAt: placement.confirmedAt,
      })),
    );
    for (const row of ranked) {
      const placement = list.find((item) => item.productId === row.productId);
      const order = orders.find((item) => item.id === placement?.orderId);
      if (order?.status === "paid") {
        order.finalRank = row.rank;
        order.quotedRank = row.rank;
      }
    }
  }
}

const globalStore = globalThis as typeof globalThis & { __whoIsTopperStore?: MockStore };

export function getStore(): MockStore {
  if (!globalStore.__whoIsTopperStore) globalStore.__whoIsTopperStore = createStore();
  return globalStore.__whoIsTopperStore;
}

export function resetMockStore(now = new Date()): MockStore {
  globalStore.__whoIsTopperStore = createStore(now);
  return globalStore.__whoIsTopperStore;
}
