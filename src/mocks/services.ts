import { lookup } from "node:dns/promises";
import { randomUUID } from "node:crypto";
import { isMockDataEnabled } from "@/config/data-source";
import {
  applyVerifiedBid,
  minimumAmountForTarget,
  previewRank,
  utcDayKey,
  withScopeLock,
  type Placement,
  type RankingRules,
} from "@/features/leaderboards/engine";
import { openGatewayOrder } from "@/features/payments/gateway";
import { findReconciliationIssues } from "@/features/payments/reconcile";
import { assertSandboxAllowed } from "@/features/payments/runtime";
import { decideProviderEvent } from "@/features/payments/state-machine";
import { AppError, PaymentIntegrityError } from "@/lib/errors";
import { paginate } from "@/lib/pagination";
import { hourBucket, newToken, sha256, visitorHash } from "@/lib/security/hash";
import { isLikelyBot } from "@/lib/security/bots";
import {
  canEditProduct,
  canManageRoles,
  canModerate,
  canUpgradeProduct,
  canViewPrivateAnalytics,
  isAdmin,
} from "@/lib/security/authorization";
import { isBlockedAddress } from "@/lib/security/ssrf";
import { slugify } from "@/lib/urls";
import type { AppServices } from "@/lib/data/contracts";
import { boardEntries, rankFor, toCard, toDetail, toOrder } from "@/mocks/present";
import { getStore, type MockStore, type StoredProduct } from "@/mocks/store";
import type {
  LeaderboardScope,
  ProductInput,
  ProductQuery,
  ScopeType,
  SessionUser,
} from "@/types/domain";

function rulesOf(store: MockStore): RankingRules {
  return {
    minimumBidPaise: store.settings.minimumBidPaise,
    minimumIncrementPaise: store.settings.minimumIncrementPaise,
    maxBidPaise: store.settings.maxBidPaise,
  };
}

function todayKey(now = new Date()): string {
  return utcDayKey(now);
}

function scopeKeyFor(product: StoredProduct, scope: ScopeType, now = new Date()): string {
  if (scope === "all_time") return "all_time";
  if (scope === "daily") return todayKey(now);
  return product.categoryId;
}

function activeModels(store: MockStore, scope: ScopeType, key: string): Placement[] {
  return store.placements
    .filter((item) => item.scopeType === scope && item.scopeKey === key && item.status === "active")
    .map((item) => ({
      id: item.id,
      productId: item.productId,
      amountPaise: item.amountPaise,
      confirmedAt: item.confirmedAt,
    }));
}

function requireProduct(store: MockStore, id: string): StoredProduct {
  const product = store.products.find((item) => item.id === id);
  if (!product) throw new AppError("Listing not found.", "not_found", 404);
  return product;
}

function notify(store: MockStore, userId: string | null, title: string, body: string, href: string | null) {
  if (!userId) return;
  store.notifications.unshift({
    id: randomUUID(),
    userId,
    title,
    body,
    href,
    readAt: null,
    createdAt: new Date().toISOString(),
  });
}

function audit(store: MockStore, actor: SessionUser, action: string, entityType: string, entityId: string) {
  store.audit.unshift({
    id: randomUUID(),
    actorId: actor.id,
    actorName: actor.displayName,
    action,
    entityType,
    entityId,
    createdAt: new Date().toISOString(),
  });
}

function analyticsSalt(): string | null {
  if (process.env.ANALYTICS_SALT) return process.env.ANALYTICS_SALT;
  if (process.env.NODE_ENV === "production") return null;
  return "development-analytics-salt";
}

function markVerified(store: MockStore, product: StoredProduct) {
  product.ownershipVerified = true;
  product.updatedAt = new Date().toISOString();
  if (product.status === "draft" || product.status === "pending_verification") {
    product.status = store.settings.holdNewListingsForReview ? "pending_review" : "approved";
    if (product.status === "approved") product.approvedAt = product.updatedAt;
  }
  notify(store, product.ownerId, "Ownership verified", `${product.name} can move through review.`, `/dashboard/products/${product.id}`);
}

function checkoutFrom(store: MockStore, orderId: string) {
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) throw new AppError("Order not found.", "not_found", 404);
  return {
    ...toOrder(store, order),
    publishableKeyId: order.provider === "razorpay" ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? null : null,
    sandbox: order.provider === "sandbox",
  };
}

export const mockServices: AppServices = {
  categories: {
    async list() {
      return getStore().categories.filter((category) => category.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
    },
    async getBySlug(slug) {
      return getStore().categories.find((category) => category.slug === slug && category.isActive) ?? null;
    },
    async save(actor, input) {
      if (!canModerate(actor)) throw new AppError("You cannot edit categories.", "forbidden", 403);
      const store = getStore();
      const slug = slugify(input.slug);
      const duplicate = store.categories.find((category) => category.slug === slug && category.id !== input.id);
      if (duplicate) throw new AppError("That category slug is already used.", "duplicate", 409);
      if (input.id) {
        const current = store.categories.find((category) => category.id === input.id);
        if (!current) throw new AppError("Category not found.", "not_found", 404);
        Object.assign(current, { ...input, slug });
      } else {
        store.categories.push({ id: randomUUID(), slug, name: input.name, description: input.description, sortOrder: input.sortOrder, isActive: input.isActive });
      }
      audit(store, actor, "category.save", "category", input.id ?? slug);
    },
  },
  products: {
    async search(query: ProductQuery) {
      const store = getStore();
      const q = query.q?.trim().toLowerCase();
      const filtered = store.products.filter((product) => {
        if (product.status !== "approved") return false;
        if (query.category) {
          const category = store.categories.find((item) => item.slug === query.category);
          if (!category || product.categoryId !== category.id) return false;
        }
        if (query.tag && !product.tags.includes(query.tag)) return false;
        if (!q) return true;
        const category = store.categories.find((item) => item.id === product.categoryId);
        const haystack = `${product.name} ${product.shortDescription} ${product.tags.join(" ")} ${category?.name ?? ""}`.toLowerCase();
        return haystack.includes(q);
      });
      const cards = filtered.map((product) => toCard(store, product));
      cards.sort((a, b) => {
        if (query.sort === "name") return a.name.localeCompare(b.name);
        if (query.sort === "rank") {
          const ar = a.rank ?? 10_000;
          const br = b.rank ?? 10_000;
          return ar - br || a.name.localeCompare(b.name);
        }
        return (b.approvedAt ?? "").localeCompare(a.approvedAt ?? "");
      });
      return paginate(cards, query.page, query.pageSize);
    },
    async getPublicBySlug(slug) {
      const store = getStore();
      const product = store.products.find((item) => item.slug === slug && item.status === "approved");
      return product ? toDetail(store, product, todayKey()) : null;
    },
    async listRecent(limit) {
      const store = getStore();
      return store.products
        .filter((product) => product.status === "approved")
        .sort((a, b) => (b.approvedAt ?? "").localeCompare(a.approvedAt ?? ""))
        .slice(0, limit)
        .map((product) => toCard(store, product, { rank: null, amountPaise: null, kind: rankFor(store, product.id, "all_time", "all_time") ? "paid" : "free" }));
    },
    async listTrending(limit) {
      const store = getStore();
      const start = utcDayKey(new Date(Date.now() - 6 * 86_400_000));
      const counts = new Map<string, number>();
      for (const click of store.clicks) {
        if (click.day < start) continue;
        counts.set(click.productId, (counts.get(click.productId) ?? 0) + 1);
      }
      return [...counts.entries()]
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .flatMap(([productId]) => {
          const product = store.products.find((item) => item.id === productId && item.status === "approved");
          if (!product) return [];
          const paid = Boolean(rankFor(store, product.id, "all_time", "all_time"));
          return [toCard(store, product, { rank: null, amountPaise: null, kind: paid ? "paid" : "free" })];
        });
    },
    async listOwned(userId) {
      const store = getStore();
      return store.products.filter((product) => product.ownerId === userId).map((product) => toDetail(store, product, todayKey()));
    },
    async getManageable(user, id) {
      const store = getStore();
      const product = store.products.find((item) => item.id === id);
      if (!product) return null;
      if (product.ownerId !== user.id && !isAdmin(user)) return null;
      return toDetail(store, product, todayKey());
    },
    async create(user, input: ProductInput) {
      const store = getStore();
      const category = store.categories.find((item) => item.slug === input.categorySlug && item.isActive);
      if (!category) throw new AppError("Choose a category.", "invalid_category", 400);
      const existing = store.products.find((product) => product.normalizedUrl === input.websiteUrl);
      if (existing) {
        if (!existing.ownerId) {
          existing.ownerId = user.id;
          existing.ownershipVerified = false;
          existing.updatedAt = new Date().toISOString();
          notify(store, user.id, "Claim started", `Verify that you control ${existing.name}.`, `/dashboard/verification`);
          return toDetail(store, existing, todayKey());
        }
        throw new AppError("This website is already listed.", "duplicate", 409);
      }
      let slug = slugify(input.name);
      if (store.products.some((product) => product.slug === slug)) slug = `${slug}-${store.products.length + 1}`;
      const now = new Date().toISOString();
      const product: StoredProduct = {
        id: randomUUID(),
        slug,
        name: input.name,
        websiteUrl: input.websiteUrl,
        normalizedUrl: input.websiteUrl,
        shortDescription: input.shortDescription,
        fullDescription: input.fullDescription,
        logoUrl: input.logoUrl || null,
        categoryId: category.id,
        tags: input.tags,
        ownerId: user.id,
        creatorName: input.creatorName,
        socialLinks: input.socialLinks,
        status: input.submit ? "pending_verification" : "draft",
        rejectionReason: null,
        ownershipVerified: false,
        createdAt: now,
        updatedAt: now,
        approvedAt: null,
      };
      store.products.push(product);
      return toDetail(store, product, todayKey());
    },
    async update(user, id, input) {
      const store = getStore();
      const product = requireProduct(store, id);
      if (!canEditProduct(user, product) && !canModerate(user)) {
        throw new AppError("You cannot edit this listing.", "forbidden", 403);
      }
      const category = store.categories.find((item) => item.slug === input.categorySlug && item.isActive);
      if (!category) throw new AppError("Choose a category.", "invalid_category", 400);
      const duplicate = store.products.find((item) => item.normalizedUrl === input.websiteUrl && item.id !== product.id);
      if (duplicate) throw new AppError("This website is already listed.", "duplicate", 409);
      const urlChanged = product.normalizedUrl !== input.websiteUrl;
      product.name = input.name;
      product.websiteUrl = input.websiteUrl;
      product.normalizedUrl = input.websiteUrl;
      product.shortDescription = input.shortDescription;
      product.fullDescription = input.fullDescription;
      product.logoUrl = input.logoUrl || null;
      product.categoryId = category.id;
      product.tags = input.tags;
      product.creatorName = input.creatorName;
      product.socialLinks = input.socialLinks;
      product.updatedAt = new Date().toISOString();
      if (urlChanged) {
        product.ownershipVerified = false;
        if (product.status === "approved") product.status = "pending_review";
      }
      if (input.submit && product.status === "draft") product.status = "pending_verification";
      if (input.submit && product.status === "rejected") product.status = "pending_verification";
      return toDetail(store, product, todayKey());
    },
    async listAdmin(status) {
      if (!status) return getStore().products.map((product) => toDetail(getStore(), product, todayKey()));
      return getStore().products.filter((product) => product.status === status).map((product) => toDetail(getStore(), product, todayKey()));
    },
    async setStatus(actor, productId, status, reason) {
      if (!canModerate(actor)) throw new AppError("You cannot moderate listings.", "forbidden", 403);
      const store = getStore();
      const product = requireProduct(store, productId);
      product.status = status;
      product.rejectionReason = reason || null;
      product.updatedAt = new Date().toISOString();
      if (status === "approved" && !product.approvedAt) product.approvedAt = product.updatedAt;
      audit(store, actor, `product.${status}`, "product", product.id);
      notify(store, product.ownerId, "Listing updated", `${product.name} is now ${status.replaceAll("_", " ")}.`, `/dashboard/products/${product.id}`);
    },
  },
  leaderboards: {
    async get(scope: LeaderboardScope, page, pageSize) {
      const store = getStore();
      const entries = boardEntries(store, scope.type, scope.key);
      const paged = paginate(entries, page, pageSize);
      const category = scope.type === "category" ? store.categories.find((item) => item.id === scope.key) : null;
      const title = scope.type === "all_time" ? "All-time leaderboard" : scope.type === "daily" ? "Today's leaderboard" : `${category?.name ?? "Category"} leaderboard`;
      const description = scope.type === "daily"
        ? `Paid positions for UTC day ${scope.key} are ordered by verified amount. The board starts empty at 00:00 UTC. Ties go to the earlier confirmation, then the listing id. Free listings are separate and are not a quality score.`
        : "Paid positions are ordered by the verified amount in INR. An earlier confirmation wins a tie, then the smaller listing id. Paid placement is not a quality score or a community endorsement. Free listings follow the paid rows.";
      return {
        scope,
        title,
        description,
        entries: paged.items,
        page: paged.page,
        pageSize: paged.pageSize,
        total: paged.total,
        paidCount: entries.filter((entry) => entry.placement === "paid").length,
      };
    },
    async preview(user, productId, scope, amountPaise, now = new Date()) {
      const store = getStore();
      const product = requireProduct(store, productId);
      if (!canUpgradeProduct(user, product)) throw new AppError("Verify ownership of an approved listing before ranking it.", "forbidden", 403);
      const key = scopeKeyFor(product, scope, now);
      const placements = activeModels(store, scope, key);
      const minimumPaise = minimumAmountForTarget({ placements, bidderProductId: product.id, rules: rulesOf(store) });
      if (!Number.isInteger(amountPaise) || amountPaise < minimumPaise || amountPaise > store.settings.maxBidPaise) {
        throw new AppError("Enter an amount at or above the current minimum.", "invalid_amount", 400);
      }
      const quotedRank = previewRank({ placements, bidderProductId: product.id, amountPaise, confirmedAt: now.toISOString() });
      return {
        minimumPaise,
        quotedRank,
        amountPaise,
        message: `If payment were confirmed now, this amount would place the listing at rank ${quotedRank}. The rank is not reserved and can change before verification.`,
      };
    },
  },
  payments: {
    async createRankingOrder(user, productId, scope, amountPaise, idempotencyKey) {
      const store = getStore();
      const existing = store.orders.find((order) => order.userId === user.id && order.idempotencyKey === idempotencyKey);
      if (existing) return checkoutFrom(store, existing.id);
      const product = requireProduct(store, productId);
      if (!canUpgradeProduct(user, product)) throw new AppError("Verify ownership of an approved listing before paying.", "forbidden", 403);
      const now = new Date();
      const key = scopeKeyFor(product, scope, now);
      const pending = store.orders.find((order) => order.productId === product.id && order.scopeType === scope && order.scopeKey === key && order.status === "pending");
      if (pending) throw new AppError("Finish or cancel the pending payment for this leaderboard first.", "pending_order", 409);
      const placements = activeModels(store, scope, key);
      const minimumPaise = minimumAmountForTarget({ placements, bidderProductId: product.id, rules: rulesOf(store) });
      if (!Number.isInteger(amountPaise) || amountPaise < minimumPaise || amountPaise > store.settings.maxBidPaise) {
        throw new AppError("That amount cannot be used for a ranking upgrade.", "invalid_amount", 400);
      }
      const quotedRank = previewRank({ placements, bidderProductId: product.id, amountPaise, confirmedAt: now.toISOString() });
      const id = randomUUID();
      store.orders.unshift({
        id,
        userId: user.id,
        productId: product.id,
        provider: "sandbox",
        providerOrderId: null,
        providerPaymentId: null,
        amountPaise,
        currency: "INR",
        purpose: "ranking_upgrade",
        scopeType: scope,
        scopeKey: key,
        quotedRank,
        finalRank: null,
        status: "pending",
        fulfillment: "pending",
        idempotencyKey,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        paidAt: null,
      });
      try {
        const gateway = await openGatewayOrder({ receipt: id, amountPaise, notes: { productId: product.id, scope, scopeKey: key } });
        const order = store.orders.find((item) => item.id === id);
        if (!order) throw new AppError("Order not found.", "not_found", 404);
        order.provider = gateway.provider;
        order.providerOrderId = gateway.providerOrderId;
      } catch (error) {
        const order = store.orders.find((item) => item.id === id);
        if (order) order.status = "failed";
        if (error instanceof AppError) throw error;
        throw new AppError("The payment provider did not open a checkout.", "provider_error", 502);
      }
      return checkoutFrom(store, id);
    },
    async cancel(user, orderId) {
      const store = getStore();
      const order = store.orders.find((item) => item.id === orderId && item.userId === user.id);
      if (!order) throw new AppError("Order not found.", "not_found", 404);
      if (order.status !== "pending") throw new AppError("Only a pending payment can be cancelled.", "invalid_state", 409);
      order.status = "cancelled";
      order.fulfillment = "not_applicable";
      order.updatedAt = new Date().toISOString();
    },
    async getForUser(userId, orderId) {
      const store = getStore();
      const order = store.orders.find((item) => item.id === orderId && item.userId === userId);
      return order ? toOrder(store, order) : null;
    },
    async listForUser(userId) {
      const store = getStore();
      return store.orders.filter((order) => order.userId === userId).map((order) => toOrder(store, order));
    },
    async listAdmin() {
      const store = getStore();
      return store.orders.map((order) => toOrder(store, order));
    },
    async applyProviderEvent(event, now = new Date()) {
      const store = getStore();
      const seen = new Set(store.events.filter((item) => item.provider === event.provider).map((item) => item.eventId));
      if (seen.has(event.eventId)) {
        const existing = store.orders.find((order) => order.providerOrderId === event.providerOrderId);
        return {
          orderId: existing?.id ?? "",
          status: existing?.status ?? "pending",
          duplicate: true,
          ignored: false,
          finalRank: existing?.finalRank ?? null,
          fulfillment: existing?.fulfillment ?? "pending",
        };
      }
      const order = store.orders.find((item) => item.providerOrderId === event.providerOrderId);
      if (!order) {
        store.webhookFailures.unshift({
          id: randomUUID(),
          provider: event.provider,
          eventId: event.eventId,
          error: "No order matches this provider reference.",
          createdAt: now.toISOString(),
          resolvedAt: null,
        });
        throw new PaymentIntegrityError("No order matches this provider reference.");
      }
      return withScopeLock(`${order.scopeType}:${order.scopeKey}`, async () => {
        const decision = decideProviderEvent(order, event, seen, now.toISOString());
        store.events.push({ id: randomUUID(), provider: event.provider, eventId: event.eventId, type: event.type, createdAt: now.toISOString() });
        if (decision.duplicate || decision.ignored) {
          return { orderId: order.id, status: order.status, duplicate: decision.duplicate, ignored: decision.ignored, finalRank: order.finalRank, fulfillment: order.fulfillment };
        }
        order.status = decision.status;
        order.providerPaymentId = decision.providerPaymentId;
        order.paidAt = decision.paidAt;
        order.updatedAt = now.toISOString();
        if (decision.ledger) {
          store.ledger.push({ ...decision.ledger, id: randomUUID(), createdAt: now.toISOString() });
        }
        if (decision.allocateRank && order.scopeType && order.scopeKey) {
          const placements = activeModels(store, order.scopeType, order.scopeKey);
          try {
            const result = applyVerifiedBid({
              placements,
              bid: { id: order.id, productId: order.productId, amountPaise: order.amountPaise, confirmedAt: now.toISOString() },
              rules: rulesOf(store),
            });
            if (result.applied) {
              for (const row of result.placements) {
                const current = store.placements.find((item) => item.productId === row.productId && item.scopeType === order.scopeType && item.scopeKey === order.scopeKey && item.status === "active");
                if (current) {
                  current.amountPaise = row.amountPaise;
                  current.confirmedAt = row.confirmedAt;
                  if (row.productId === order.productId) current.orderId = order.id;
                } else {
                  store.placements.push({
                    id: randomUUID(),
                    productId: row.productId,
                    scopeType: order.scopeType,
                    scopeKey: order.scopeKey,
                    amountPaise: row.amountPaise,
                    confirmedAt: row.confirmedAt,
                    status: "active",
                    orderId: order.id,
                  });
                }
              }
              order.finalRank = result.rank;
              order.fulfillment = "fulfilled";
              notify(store, order.userId, "Ranking payment confirmed", `The verified amount is now on the leaderboard at rank ${result.rank}.`, `/dashboard/payments/${order.id}`);
            } else {
              order.fulfillment = "needs_refund";
              order.finalRank = result.rank || null;
              notify(store, order.userId, "Payment received, rank unchanged", "A higher or equal bid was already active. Ask support about a refund.", `/dashboard/payments/${order.id}`);
            }
          } catch {
            order.fulfillment = "needs_refund";
            notify(store, order.userId, "Payment needs review", "The payment was verified but the rank could not be updated.", `/dashboard/payments/${order.id}`);
          }
        }
        if (decision.reverseRank && order.scopeType && order.scopeKey) {
          const placement = store.placements.find((item) => item.orderId === order.id && item.status === "active");
          if (placement) placement.status = "superseded";
          order.finalRank = null;
          order.fulfillment = "not_applicable";
        }
        if (order.purpose === "sponsored_placement" && decision.status === "paid") {
          const active = store.sponsored.filter((item) => item.active && item.endsAt > now.toISOString());
          if (active.length >= store.settings.sponsoredMaxActive) {
            order.fulfillment = "needs_refund";
          } else {
            const product = store.products.find((item) => item.id === order.productId);
            store.sponsored.push({
              id: randomUUID(),
              productId: order.productId,
              productName: product?.name ?? "Listing",
              startsAt: now.toISOString(),
              endsAt: new Date(now.getTime() + 7 * 86_400_000).toISOString(),
              active: true,
            });
            order.fulfillment = "fulfilled";
          }
        }
        return { orderId: order.id, status: order.status, duplicate: false, ignored: false, finalRank: order.finalRank, fulfillment: order.fulfillment };
      });
    },
    async sandboxComplete(user, orderId, outcome) {
      assertSandboxAllowed();
      const store = getStore();
      const order = store.orders.find((item) => item.id === orderId && item.userId === user.id);
      if (!order || !order.providerOrderId) throw new AppError("Order not found.", "not_found", 404);
      if (order.provider !== "sandbox") throw new AppError("This order is not a test payment.", "invalid_state", 409);
      const type = outcome === "success" ? "payment.captured" : outcome === "failed" ? "payment.failed" : "payment.cancelled";
      return mockServices.payments.applyProviderEvent({
        provider: "sandbox",
        eventId: `sandbox:${order.id}:${outcome}`,
        type,
        providerOrderId: order.providerOrderId,
        providerPaymentId: outcome === "success" ? `sandbox_pay_${order.id}` : undefined,
        amountPaise: order.amountPaise,
        currency: "INR",
      });
    },
    async reconcile() {
      const store = getStore();
      return findReconciliationIssues(store.orders.map((order) => toOrder(store, order)), store.ledger);
    },
  },
  analytics: {
    async recordView(input) {
      if (isLikelyBot(input.userAgent)) return;
      const salt = analyticsSalt();
      if (!salt) return;
      const store = getStore();
      const day = todayKey();
      const visitor = visitorHash(input.ip, input.userAgent, salt);
      if (store.views.some((view) => view.productId === input.productId && view.day === day && view.visitorHash === visitor)) return;
      store.views.push({ productId: input.productId, day, visitorHash: visitor });
    },
    async recordClick(input) {
      if (isLikelyBot(input.userAgent)) return false;
      const salt = analyticsSalt();
      if (!salt) return false;
      const store = getStore();
      const dedupeKey = sha256(`${salt}|${input.productId}|${visitorHash(input.ip, input.userAgent, salt)}|${hourBucket()}`);
      if (store.clicks.some((click) => click.dedupeKey === dedupeKey)) return false;
      store.clicks.push({ productId: input.productId, day: todayKey(), dedupeKey });
      return true;
    },
    async forProduct(user, productId, from, to) {
      const store = getStore();
      const product = requireProduct(store, productId);
      if (!canViewPrivateAnalytics(user, product.ownerId)) throw new AppError("You cannot view these analytics.", "forbidden", 403);
      const days = new Map<string, { views: number; clicks: number }>();
      for (const view of store.views) {
        if (view.productId !== productId || view.day < from || view.day > to) continue;
        const bucket = days.get(view.day) ?? { views: 0, clicks: 0 };
        bucket.views += 1;
        days.set(view.day, bucket);
      }
      for (const click of store.clicks) {
        if (click.productId !== productId || click.day < from || click.day > to) continue;
        const bucket = days.get(click.day) ?? { views: 0, clicks: 0 };
        bucket.clicks += 1;
        days.set(click.day, bucket);
      }
      const points = [...days.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([day, value]) => ({ day, ...value }));
      return {
        productId,
        productName: product.name,
        points,
        views: points.reduce((sum, point) => sum + point.views, 0),
        clicks: points.reduce((sum, point) => sum + point.clicks, 0),
      };
    },
    async platform() {
      const store = getStore();
      return {
        approvedListings: store.products.filter((product) => product.status === "approved").length,
        categories: store.categories.filter((category) => category.isActive).length,
        paidPlacements: store.placements.filter((placement) => placement.status === "active" && placement.scopeType === "all_time").length,
      };
    },
  },
  profiles: {
    async getPublic(username) {
      const store = getStore();
      const user = store.users.find((item) => item.username === username && !item.deletedAt);
      if (!user) return null;
      const products = store.products
        .filter((product) => product.ownerId === user.id && product.status === "approved")
        .map((product) => toCard(store, product));
      return { username: user.username, displayName: user.displayName, bio: user.bio, website: user.website, products };
    },
    async update(user, input) {
      const store = getStore();
      const current = store.users.find((item) => item.id === user.id && !item.deletedAt);
      if (!current) throw new AppError("Account not found.", "not_found", 404);
      if (store.users.some((item) => item.username === input.username && item.id !== user.id)) {
        throw new AppError("That username is taken.", "duplicate", 409);
      }
      current.displayName = input.displayName;
      current.username = input.username;
      current.bio = input.bio;
      current.website = input.website || null;
    },
    async exportData(user) {
      const store = getStore();
      const current = store.users.find((item) => item.id === user.id);
      if (!current) throw new AppError("Account not found.", "not_found", 404);
      return {
        exportedAt: new Date().toISOString(),
        profile: {
          id: current.id,
          email: current.email,
          displayName: current.displayName,
          username: current.username,
          bio: current.bio,
          website: current.website,
        },
        products: store.products.filter((product) => product.ownerId === user.id).map((product) => ({ id: product.id, name: product.name, slug: product.slug, status: product.status })),
        orders: store.orders.filter((order) => order.userId === user.id).map((order) => ({ id: order.id, amountPaise: order.amountPaise, status: order.status, createdAt: order.createdAt })),
      };
    },
    async deleteAccount(user, confirmation) {
      const store = getStore();
      const current = store.users.find((item) => item.id === user.id && !item.deletedAt);
      if (!current) throw new AppError("Account not found.", "not_found", 404);
      if (confirmation !== current.username) throw new AppError("Type your username to confirm deletion.", "confirmation", 400);
      const supers = store.users.filter((item) => item.role === "super_admin" && !item.deletedAt);
      if (current.role === "super_admin" && supers.length === 1) {
        throw new AppError("Add another super administrator before deleting this account.", "last_super_admin", 409);
      }
      current.deletedAt = new Date().toISOString();
      current.email = `deleted+${current.id}@example.invalid`;
      current.displayName = "Deleted user";
      current.bio = "";
      current.website = null;
      for (const product of store.products) {
        if (product.ownerId === current.id) {
          product.ownerId = null;
          product.ownershipVerified = false;
        }
      }
    },
    async listAdmin() {
      return getStore().users.filter((user) => !user.deletedAt).map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      }));
    },
    async setRole(actor, userId, role) {
      if (!canManageRoles(actor)) throw new AppError("Only a super administrator can change roles.", "forbidden", 403);
      const store = getStore();
      const target = store.users.find((user) => user.id === userId && !user.deletedAt);
      if (!target) throw new AppError("User not found.", "not_found", 404);
      const supers = store.users.filter((user) => user.role === "super_admin" && !user.deletedAt);
      if (target.role === "super_admin" && role !== "super_admin" && supers.length === 1) {
        throw new AppError("The last super administrator cannot be demoted.", "last_super_admin", 409);
      }
      target.role = role;
      audit(store, actor, `role.${role}`, "user", target.id);
    },
  },
  verification: {
    async startEmail(user, productId) {
      const store = getStore();
      const product = requireProduct(store, productId);
      if (product.ownerId !== user.id) throw new AppError("You cannot verify this listing.", "forbidden", 403);
      const token = newToken();
      const claim = {
        id: randomUUID(),
        productId: product.id,
        productName: product.name,
        method: "email" as const,
        status: "pending" as const,
        host: null,
        createdAt: new Date().toISOString(),
        userId: user.id,
        tokenHash: sha256(token),
        devLink: `/verify-ownership?token=${token}`,
      };
      store.claims.unshift(claim);
      store.devInbox.unshift({ id: randomUUID(), to: user.email, subject: `Verify ${product.name}`, url: claim.devLink, createdAt: claim.createdAt });
      return claim;
    },
    async startDomain(user, productId) {
      const store = getStore();
      const product = requireProduct(store, productId);
      if (product.ownerId !== user.id) throw new AppError("You cannot verify this listing.", "forbidden", 403);
      const token = newToken();
      const host = new URL(product.websiteUrl).hostname;
      const claim = {
        id: randomUUID(),
        productId: product.id,
        productName: product.name,
        method: "domain" as const,
        status: "pending" as const,
        host,
        createdAt: new Date().toISOString(),
        userId: user.id,
        tokenHash: sha256(token),
        token,
      };
      store.claims.unshift(claim);
      return { ...claim, token };
    },
    async confirmEmail(token) {
      const store = getStore();
      const claim = store.claims.find((item) => item.tokenHash === sha256(token) && item.method === "email" && item.status === "pending");
      if (!claim) throw new AppError("This verification link is invalid or already used.", "invalid_token", 400);
      claim.status = "verified";
      const product = requireProduct(store, claim.productId);
      markVerified(store, product);
    },
    async checkDomain(user, productId) {
      const store = getStore();
      const product = requireProduct(store, productId);
      if (product.ownerId !== user.id) throw new AppError("You cannot verify this listing.", "forbidden", 403);
      const claim = store.claims.find((item) => item.productId === productId && item.userId === user.id && item.method === "domain" && item.status === "pending");
      if (!claim?.token) throw new AppError("Start domain verification first.", "verification", 400);
      const host = new URL(product.websiteUrl).hostname;
      const addresses = await lookup(host, { all: true });
      if (addresses.length === 0 || addresses.some((item) => isBlockedAddress(item.address))) {
        throw new AppError("That domain cannot be checked from this server.", "ssrf", 400);
      }
      const response = await fetch(`https://${host}/.well-known/whoistopper.txt`, { redirect: "manual", signal: AbortSignal.timeout(5000) });
      if (response.status >= 300 && response.status < 400) throw new AppError("The verification file must not redirect.", "verification", 400);
      if (!response.ok) throw new AppError("The verification file was not found.", "verification", 400);
      const text = (await response.text()).slice(0, 2000).trim();
      if (text !== claim.token) throw new AppError("The verification file does not match this listing.", "verification", 400);
      claim.status = "verified";
      markVerified(store, product);
    },
    async simulateDomain(user, productId) {
      if (!isMockDataEnabled()) throw new AppError("Domain simulation is only available in development mock mode.", "mock_disabled", 403);
      const store = getStore();
      const product = requireProduct(store, productId);
      if (product.ownerId !== user.id) throw new AppError("You cannot verify this listing.", "forbidden", 403);
      const claim = store.claims.find((item) => item.productId === productId && item.method === "domain" && item.status === "pending");
      if (claim) claim.status = "verified";
      markVerified(store, product);
    },
    async listForUser(userId) {
      return getStore().claims.filter((claim) => claim.userId === userId).map((claim) => ({
        id: claim.id,
        productId: claim.productId,
        productName: claim.productName,
        method: claim.method,
        status: claim.status,
        host: claim.host,
        createdAt: claim.createdAt,
        devLink: claim.devLink,
      }));
    },
  },
  notifications: {
    async list(userId) {
      return getStore().notifications.filter((item) => item.userId === userId);
    },
    async markRead(userId, id) {
      const item = getStore().notifications.find((notification) => notification.id === id && notification.userId === userId);
      if (item) item.readAt = new Date().toISOString();
    },
    async markAllRead(userId) {
      const now = new Date().toISOString();
      for (const item of getStore().notifications) {
        if (item.userId === userId) item.readAt = now;
      }
    },
  },
  reports: {
    async create(user, input) {
      const store = getStore();
      const product = requireProduct(store, input.productId);
      if (product.status !== "approved") throw new AppError("This listing cannot be reported.", "not_found", 404);
      store.reports.unshift({
        id: randomUUID(),
        productId: product.id,
        productName: product.name,
        reporterId: user?.id ?? null,
        reason: input.reason,
        details: input.details,
        status: "open",
        createdAt: new Date().toISOString(),
      });
    },
    async listAdmin() {
      return getStore().reports;
    },
    async decide(actor, reportId, decision, notes) {
      if (!canModerate(actor)) throw new AppError("You cannot review reports.", "forbidden", 403);
      const store = getStore();
      const report = store.reports.find((item) => item.id === reportId);
      if (!report) throw new AppError("Report not found.", "not_found", 404);
      report.status = decision;
      audit(store, actor, `report.${decision}`, "report", report.id);
      if (notes) {
        store.audit.unshift({ id: randomUUID(), actorId: actor.id, actorName: actor.displayName, action: notes.slice(0, 180), entityType: "report", entityId: report.id, createdAt: new Date().toISOString() });
      }
    },
  },
  contact: {
    async send(input) {
      getStore().contacts.unshift({ ...input, id: randomUUID(), createdAt: new Date().toISOString() });
    },
    async listAdmin() {
      return getStore().contacts;
    },
  },
  admin: {
    async overview() {
      const store = getStore();
      const productsByStatus = {
        draft: 0,
        pending_verification: 0,
        pending_review: 0,
        approved: 0,
        rejected: 0,
        suspended: 0,
        removed: 0,
      };
      for (const product of store.products) productsByStatus[product.status] += 1;
      return {
        users: store.users.filter((user) => !user.deletedAt).length,
        productsByStatus,
        openReports: store.reports.filter((report) => report.status === "open").length,
        paidOrders: store.orders.filter((order) => order.status === "paid").length,
        recordedChargePaise: store.ledger.filter((entry) => entry.entryType === "charge").reduce((sum, entry) => sum + entry.amountPaise, 0),
        webhookFailures: store.webhookFailures.filter((failure) => !failure.resolvedAt).length,
        pendingSubmissions: productsByStatus.pending_review + productsByStatus.pending_verification,
      };
    },
    async audit() {
      return getStore().audit;
    },
    async settings() {
      return { ...getStore().settings };
    },
    async updateSettings(actor, settings) {
      if (!canManageRoles(actor)) throw new AppError("Only a super administrator can change platform settings.", "forbidden", 403);
      if (settings.minimumIncrementPaise < 100 || settings.maxBidPaise < settings.minimumBidPaise) {
        throw new AppError("Check the ranking amounts.", "invalid_settings", 400);
      }
      const store = getStore();
      store.settings = { ...settings };
      audit(store, actor, "settings.update", "settings", "platform");
    },
    async sponsored() {
      return getStore().sponsored;
    },
    async setSponsored(actor, productId, days, active) {
      if (!canModerate(actor)) throw new AppError("You cannot manage sponsored placements.", "forbidden", 403);
      const store = getStore();
      const product = requireProduct(store, productId);
      if (product.status !== "approved") throw new AppError("Only an approved listing can be sponsored.", "invalid_state", 400);
      const now = new Date();
      if (active) {
        const live = store.sponsored.filter((item) => item.active && item.endsAt > now.toISOString());
        if (live.length >= store.settings.sponsoredMaxActive) throw new AppError("Sponsored slots are full.", "capacity", 409);
      }
      store.sponsored.unshift({
        id: randomUUID(),
        productId: product.id,
        productName: product.name,
        startsAt: now.toISOString(),
        endsAt: new Date(now.getTime() + days * 86_400_000).toISOString(),
        active,
      });
      audit(store, actor, active ? "sponsored.on" : "sponsored.off", "product", product.id);
    },
    async webhookFailures() {
      return getStore().webhookFailures;
    },
    async snapshotDaily(day) {
      const store = getStore();
      if (store.snapshots.some((snapshot) => snapshot.day === day)) return;
      const entries = boardEntries(store, "daily", day);
      store.snapshots.push({ id: randomUUID(), day, capturedAt: new Date().toISOString(), entryCount: entries.length });
    },
  },
};

export { mockAuth } from "@/mocks/auth";
