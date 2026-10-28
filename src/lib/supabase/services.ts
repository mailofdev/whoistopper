import { lookup } from "node:dns/promises";
import { ACTIVE_CATEGORY_SLUGS, isActiveFieldSet, RETIRED_CATEGORY_SLUGS, sanitizeDetails } from "@/config/catalogue";
import { PACKAGE_DEFAULTS } from "@/config/packages";
import { ORGANIC_RANKING_SUMMARY, utcDayKey } from "@/features/leaderboards/engine";
import { findReconciliationIssues } from "@/features/payments/reconcile";
import { readServerEnv } from "@/config/env";
import { site } from "@/config/site";
import { AppError, ConfigurationError } from "@/lib/errors";
import { log } from "@/lib/logging/logger";
import type { AppServices } from "@/lib/data/contracts";
import {
  canEditProduct,
  canManageRoles,
  canModerate,
  canViewPrivateAnalytics,
  isAdmin,
} from "@/lib/security/authorization";
import { isLikelyBot } from "@/lib/security/bots";
import { newToken, sha256, visitorHash } from "@/lib/security/hash";
import { isBlockedAddress } from "@/lib/security/ssrf";
import { slugify } from "@/lib/urls";
import { createSupabaseAdminClient, createSupabaseAnonClient, createSupabaseServerClient } from "@/lib/supabase/clients";
import type {
  AnalyticsPoint,
  LeaderboardEntry,
  LeaderboardScope,
  OrderDetail,
  PlatformSettings,
  ProductCardModel,
  ProductDetail,
  ProductStatus,
} from "@/types/domain";

type QueryError = { message: string; code?: string };

function fail(error: QueryError | null): void {
  if (!error) return;
  log("error", "supabase request failed", { code: error.code ?? "unknown" });
  const message = error.message.toLowerCase();
  if (error.code === "23505" || message.includes("duplicate") || message.includes("already")) {
    throw new AppError("That record already exists.", "duplicate", 409);
  }
  if (message.includes("amount") || message.includes("ranking rules")) {
    throw new AppError("That amount cannot be used for a ranking upgrade.", "invalid_amount", 400);
  }
  if (message.includes("pending payment")) {
    throw new AppError("Finish or cancel the pending payment for this leaderboard first.", "pending_order", 409);
  }
  if (message.includes("sandbox")) {
    throw new AppError("Sandbox payments are disabled for this database.", "sandbox_disabled", 403);
  }
  if (message.includes("not allowed") || message.includes("not permitted") || message.includes("sign in")) {
    throw new AppError("You cannot do that.", "forbidden", 403);
  }
  throw new AppError("The database could not complete that request.", "database", 500);
}

async function anon() {
  const client = createSupabaseAnonClient();
  if (!client) throw new ConfigurationError();
  return client;
}

async function server() {
  const client = await createSupabaseServerClient();
  if (!client) throw new ConfigurationError();
  return client;
}

function admin() {
  const client = createSupabaseAdminClient();
  if (!client) throw new ConfigurationError("The service role key is not configured.");
  return client;
}

async function replaceTags(productId: string, tags: string[]) {
  const client = await server();
  const removed = await client.from("product_tags").delete().eq("product_id", productId);
  fail(removed.error);
  for (const slug of tags) {
    const saved = await client.from("tags").upsert({ slug, name: slug }, { onConflict: "slug" }).select("id").single();
    fail(saved.error);
    if (!saved.data) continue;
    const linked = await client.from("product_tags").insert({ product_id: productId, tag_id: saved.data.id });
    fail(linked.error);
  }
}

function categoryOf(value: { slug?: string; name?: string; field_set?: string } | { slug?: string; name?: string; field_set?: string }[] | null) {
  const row = Array.isArray(value) ? value[0] : value;
  return { slug: row?.slug ?? "", name: row?.name ?? "Uncategorised", fieldSet: row?.field_set ?? "" };
}

function mapCategory(row: { id: string; slug: string; name: string; description: string; sort_order: number; is_active: boolean; group_slug?: string | null; group_name?: string | null; group_sort?: number | null; field_set?: string | null }) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    groupSlug: row.group_slug ?? "digital-presence",
    groupName: row.group_name ?? "Digital Presence",
    groupSort: row.group_sort ?? 1,
    fieldSet: row.field_set ?? "",
  };
}

function detailsOf(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const details: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!/^[a-z0-9_]{1,40}$/.test(key) || typeof item !== "string") continue;
    const trimmed = item.trim();
    if (trimmed) details[key] = trimmed.slice(0, 500);
  }
  return details;
}

function relatedName(value: unknown, fallback = "Listing"): string {
  if (Array.isArray(value)) {
    const first = value[0] as { name?: string; display_name?: string } | undefined;
    return first?.name ?? first?.display_name ?? fallback;
  }
  if (value && typeof value === "object") {
    const row = value as { name?: string; display_name?: string };
    return row.name ?? row.display_name ?? fallback;
  }
  return fallback;
}

function tagsOf(value: { tags: { slug: string } | { slug: string }[] | null }[] | null): string[] {
  return (value ?? []).flatMap((item) => {
    const tag = Array.isArray(item.tags) ? item.tags[0] : item.tags;
    return tag?.slug ? [tag.slug] : [];
  });
}

function cardFrom(row: Record<string, unknown>, placement: "paid" | "free" = "free", rank: number | null = null, amount: number | null = null): ProductCardModel {
  const category = categoryOf(row.categories as { slug: string; name: string } | null);
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    shortDescription: String(row.short_description),
    categoryName: category.name,
    categorySlug: category.slug,
    tags: tagsOf(row.product_tags as { tags: { slug: string } | null }[] | null),
    placement,
    rank,
    amountPaise: amount,
    ownershipVerified: Boolean(row.ownership_verified),
    approvedAt: (row.approved_at as string | null) ?? null,
    logoUrl: (row.logo_url as string | null) ?? null,
  };
}

function detailFrom(row: Record<string, unknown>): ProductDetail {
  const category = categoryOf(row.categories as { slug: string; name: string } | null);
  const card = cardFrom(row);
  return {
    id: card.id,
    slug: card.slug,
    name: card.name,
    shortDescription: card.shortDescription,
    tags: card.tags,
    ownershipVerified: card.ownershipVerified,
    approvedAt: card.approvedAt,
    websiteUrl: String(row.website_url),
    normalizedUrl: String(row.normalized_url),
    fullDescription: String(row.full_description),
    logoUrl: (row.logo_url as string | null) ?? null,
    categoryId: String(row.category_id),
    categorySlug: category.slug,
    categoryName: category.name,
    categoryFieldSet: category.fieldSet,
    details: detailsOf(row.details),
    ownerId: (row.owner_id as string | null) ?? null,
    ownerUsername: (row.owner_username as string | null) ?? null,
    ownerDisplayName: (row.owner_display_name as string | null) ?? null,
    creatorName: String(row.creator_name),
    socialLinks: (row.social_links as ProductDetail["socialLinks"]) ?? {},
    status: row.status as ProductStatus,
    rejectionReason: (row.rejection_reason as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    allTimeRank: null,
    allTimeAmountPaise: null,
    todayRank: null,
    todayAmountPaise: null,
  };
}

const productSelect = "id, slug, name, website_url, normalized_url, short_description, full_description, logo_url, category_id, owner_id, owner_username, owner_display_name, creator_name, social_links, details, status, rejection_reason, ownership_verified, created_at, updated_at, approved_at, categories(slug, name, field_set), product_tags(tags(slug))";

async function withRanks(detail: ProductDetail): Promise<ProductDetail> {
  return detail;
}

function mapOrder(row: Record<string, unknown>): OrderDetail {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    productId: String(row.product_id),
    productName: String(row.product_name ?? "Listing"),
    productSlug: String(row.product_slug ?? ""),
    provider: row.provider as OrderDetail["provider"],
    providerOrderId: (row.provider_order_id as string | null) ?? null,
    providerPaymentId: (row.provider_payment_id as string | null) ?? null,
    amountPaise: Number(row.amount_paise),
    currency: "INR",
    purpose: row.purpose as OrderDetail["purpose"],
    scopeType: (row.scope_type as OrderDetail["scopeType"]) ?? null,
    scopeKey: (row.scope_key as string | null) ?? null,
    quotedRank: (row.quoted_rank as number | null) ?? null,
    finalRank: (row.final_rank as number | null) ?? null,
    status: row.status as OrderDetail["status"],
    fulfillment: row.fulfillment as OrderDetail["fulfillment"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    paidAt: (row.paid_at as string | null) ?? null,
  };
}

async function settingsFrom(client: Awaited<ReturnType<typeof anon>>): Promise<PlatformSettings> {
  const { data, error } = await client.from("platform_settings").select("key, value");
  fail(error);
  const moderation = (data?.find((row) => row.key === "moderation")?.value ?? {}) as { holdNewListingsForReview?: boolean };
  const packages = await client.from("ad_packages").select("slug, price_paise").eq("is_active", true);
  const price = (slug: string, fallback: number) => {
    const row = packages.data?.find((item) => item.slug === slug);
    return row ? Number(row.price_paise) : fallback;
  };
  return {
    dailyFeaturedPricePaise: price("daily-featured", PACKAGE_DEFAULTS[0].pricePaise),
    weeklyFeaturedPricePaise: price("weekly-featured", PACKAGE_DEFAULTS[1].pricePaise),
    categorySponsorPricePaise: price("weekly-category-sponsor", PACKAGE_DEFAULTS[2].pricePaise),
    holdNewListingsForReview: moderation.holdNewListingsForReview ?? true,
  };
}

export const supabaseServices: AppServices = {
  categories: {
    async list() {
      const client = await anon();
      const { data, error } = await client.from("categories").select("id, slug, name, description, sort_order, is_active, group_slug, group_name, group_sort, field_set").eq("is_active", true).order("sort_order");
      fail(error);
      return (data ?? []).map((row) => mapCategory(row)).flatMap((category) => {
        if (!(ACTIVE_CATEGORY_SLUGS as readonly string[]).includes(category.slug)) return [];
        return [{ ...category, fieldSet: isActiveFieldSet(category.fieldSet) ? category.fieldSet : category.slug }];
      });
    },
    async listAll() {
      const client = await server();
      const { data, error } = await client.from("categories").select("id, slug, name, description, sort_order, is_active, group_slug, group_name, group_sort, field_set").order("group_sort").order("sort_order");
      fail(error);
      return (data ?? []).map((row) => mapCategory(row));
    },
    async getBySlug(slug) {
      const categories = await supabaseServices.categories.list();
      return categories.find((category) => category.slug === slug) ?? null;
    },
    async save(actor, input) {
      if (!canModerate(actor)) throw new AppError("You cannot edit categories.", "forbidden", 403);
      const client = await server();
      const slug = slugify(input.slug);
      if ((RETIRED_CATEGORY_SLUGS as readonly string[]).includes(slug)) {
        throw new AppError("That category is retired and cannot be activated.", "retired_category", 400);
      }
      if (!isActiveFieldSet(input.fieldSet)) throw new AppError("Choose one of the open category forms.", "invalid_category", 400);
      const payload = {
        slug,
        name: input.name,
        description: input.description,
        sort_order: input.sortOrder,
        is_active: input.isActive,
        group_slug: "directory",
        group_name: "Directory",
        group_sort: 1,
        field_set: input.fieldSet,
      };
      const query = input.id ? client.from("categories").update(payload).eq("id", input.id) : client.from("categories").insert(payload);
      const { error } = await query;
      fail(error);
      await client.from("admin_audit_logs").insert({ actor_id: actor.id, action: "category.save", entity_type: "category", entity_id: input.id ?? input.slug });
    },
  },
  products: {
    async search(query) {
      const client = await anon();
      let categoryId: string | undefined;
      if (query.category) {
        const category = await supabaseServices.categories.getBySlug(query.category);
        if (!category) return { items: [], page: query.page, pageSize: query.pageSize, total: 0 };
        categoryId = category.id;
      }
      // The builder is thenable, so this stays synchronous. Returning it from an async function would run the query early.
      const build = () => {
        let request = client.from("products").select(productSelect, { count: "exact" }).eq("status", "approved");
        if (categoryId) request = request.eq("category_id", categoryId);
        if (query.q) {
          const safe = query.q.replace(/[^a-zA-Z0-9\s-]/g, " ").trim();
          if (safe) request = request.textSearch("search_vector", safe, { config: "simple", type: "websearch" });
        }
        if (query.sort === "name") request = request.order("name");
        else request = request.order("approved_at", { ascending: false });
        return request;
      };
      const from = (query.page - 1) * query.pageSize;
      const { data, error, count } = await build().range(from, from + query.pageSize - 1);
      if (error?.code === "PGRST103") {
        const head = await build().range(0, 0);
        if (head.error && head.error.code !== "PGRST103") fail(head.error);
        return { items: [], page: query.page, pageSize: query.pageSize, total: head.count ?? 0 };
      }
      fail(error);
      let items = (data ?? []).map((row) => cardFrom(row as unknown as Record<string, unknown>));
      if (query.tag) items = items.filter((item) => item.tags.includes(query.tag ?? ""));
      return { items, page: query.page, pageSize: query.pageSize, total: count ?? items.length };
    },
    async getPublicBySlug(slug) {
      const client = await anon();
      const { data, error } = await client.from("products").select(productSelect).eq("slug", slug).eq("status", "approved").maybeSingle();
      fail(error);
      return data ? withRanks(detailFrom(data as unknown as Record<string, unknown>)) : null;
    },
    async listRecent(limit) {
      const result = await supabaseServices.products.search({ sort: "newest", page: 1, pageSize: limit });
      return result.items;
    },
    async listTrending(limit) {
      const client = await anon();
      const since = utcDayKey(new Date(Date.now() - 6 * 86_400_000));
      const { data, error } = await client.from("analytics_daily").select("product_id, clicks").gte("day", since);
      fail(error);
      const counts = new Map<string, number>();
      for (const row of data ?? []) counts.set(row.product_id, (counts.get(row.product_id) ?? 0) + row.clicks);
      const ids = [...counts.entries()].filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
      if (ids.length === 0) return [];
      const products = await client.from("products").select(productSelect).in("id", ids).eq("status", "approved");
      fail(products.error);
      return (products.data ?? []).map((row) => cardFrom(row as unknown as Record<string, unknown>, "free"));
    },
    async listByTag(tag, limit) {
      const slug = tag.toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (!slug) return [];
      const client = await anon();
      const tagRow = await client.from("tags").select("id").eq("slug", slug).maybeSingle();
      fail(tagRow.error);
      if (!tagRow.data) return [];
      const links = await client.from("product_tags").select("product_id").eq("tag_id", tagRow.data.id).limit(Math.min(Math.max(limit, 1), 24));
      fail(links.error);
      const ids = (links.data ?? []).map((row) => row.product_id);
      if (ids.length === 0) return [];
      const products = await client.from("products").select(productSelect).in("id", ids).eq("status", "approved");
      fail(products.error);
      return (products.data ?? []).map((row) => cardFrom(row as unknown as Record<string, unknown>));
    },
    async listOwned(userId) {
      const client = await server();
      const { data, error } = await client.from("products").select(productSelect).eq("owner_id", userId).order("updated_at", { ascending: false });
      fail(error);
      return Promise.all((data ?? []).map((row) => withRanks(detailFrom(row as unknown as Record<string, unknown>))));
    },
    async getManageable(user, id) {
      const client = await server();
      const { data, error } = await client.from("products").select(productSelect).eq("id", id).maybeSingle();
      fail(error);
      if (!data) return null;
      const detail = detailFrom(data as unknown as Record<string, unknown>);
      if (detail.ownerId !== user.id && !isAdmin(user)) return null;
      return withRanks(detail);
    },
    async create(user, input) {
      const client = await server();
      const { data: category, error: categoryError } = await client.from("categories").select("id, field_set").eq("slug", input.categorySlug).eq("is_active", true).maybeSingle();
      fail(categoryError);
      if (!category || !isActiveFieldSet(String(category.field_set))) throw new AppError("Choose a category.", "invalid_category", 400);
      const details = sanitizeDetails(String(category.field_set), input.details ?? {});
      details.authorization = "confirmed";
      const existing = await client.from("products").select("id, owner_id").eq("normalized_url", input.websiteUrl).maybeSingle();
      fail(existing.error);
      if (existing.data) {
        if (!existing.data.owner_id) {
          const claim = await client.from("products").update({ owner_id: user.id, owner_username: user.username, owner_display_name: user.displayName, ownership_verified: false }).eq("id", existing.data.id);
          fail(claim.error);
          const reloaded = await client.from("products").select(productSelect).eq("id", existing.data.id).single();
          fail(reloaded.error);
          return detailFrom(reloaded.data as unknown as Record<string, unknown>);
        }
        throw new AppError("This website is already listed.", "duplicate", 409);
      }
      const slugBase = slugify(input.name);
      const inserted = await client.from("products").insert({
        slug: slugBase,
        name: input.name,
        website_url: input.websiteUrl,
        normalized_url: input.websiteUrl,
        short_description: input.shortDescription,
        full_description: input.fullDescription,
        logo_url: input.logoUrl || null,
        category_id: category.id,
        owner_id: user.id,
        owner_username: user.username,
        owner_display_name: user.displayName,
        creator_name: input.creatorName,
        social_links: input.socialLinks,
        details,
        status: input.submit ? "pending_verification" : "draft",
      }).select(productSelect).single();
      fail(inserted.error);
      const created = inserted.data as unknown as { id: string };
      await replaceTags(created.id, input.tags);
      const reloaded = await client.from("products").select(productSelect).eq("id", created.id).single();
      fail(reloaded.error);
      return detailFrom(reloaded.data as unknown as Record<string, unknown>);
    },
    async update(user, id, input) {
      const current = await supabaseServices.products.getManageable(user, id);
      if (!current || (!canEditProduct(user, current) && !canModerate(user))) {
        throw new AppError("You cannot edit this listing.", "forbidden", 403);
      }
      const client = await server();
      const { data: category } = await client.from("categories").select("id, field_set, is_active").eq("slug", input.categorySlug).maybeSingle();
      if (!category || !category.is_active || !isActiveFieldSet(String(category.field_set))) throw new AppError("Choose a category.", "invalid_category", 400);
      const details = sanitizeDetails(String(category.field_set), input.details ?? {});
      details.authorization = "confirmed";
      const urlChanged = current.normalizedUrl !== input.websiteUrl;
      const { error } = await client.from("products").update({
        name: input.name,
        website_url: input.websiteUrl,
        normalized_url: input.websiteUrl,
        short_description: input.shortDescription,
        full_description: input.fullDescription,
        logo_url: input.logoUrl || null,
        category_id: category.id,
        creator_name: input.creatorName,
        social_links: input.socialLinks,
        details,
        ownership_verified: urlChanged ? false : current.ownershipVerified,
        status: urlChanged && current.status === "approved" ? "pending_review" : input.submit && (current.status === "draft" || current.status === "rejected") ? "pending_verification" : current.status,
      }).eq("id", id);
      fail(error);
      await replaceTags(id, input.tags);
      const next = await supabaseServices.products.getManageable(user, id);
      if (!next) throw new AppError("Listing not found.", "not_found", 404);
      return next;
    },
    async listAdmin(status) {
      const client = await server();
      let request = client.from("products").select(productSelect).order("updated_at", { ascending: false });
      if (status) request = request.eq("status", status);
      const { data, error } = await request;
      fail(error);
      return (data ?? []).map((row) => detailFrom(row as unknown as Record<string, unknown>));
    },
    async setStatus(actor, productId, status, reason) {
      if (!canModerate(actor)) throw new AppError("You cannot moderate listings.", "forbidden", 403);
      const client = await server();
      const { error } = await client.from("products").update({
        status,
        rejection_reason: reason || null,
        approved_at: status === "approved" ? new Date().toISOString() : undefined,
      }).eq("id", productId);
      fail(error);
      if (status === "approved") {
        try {
          await admin().rpc("activate_scheduled_campaigns", { p_product_id: productId });
        } catch (activateError) {
          log("error", "campaign.activate", { error: activateError instanceof Error ? activateError.message : "unknown" });
        }
      }
      if (status === "removed" || status === "suspended" || status === "rejected") {
        try {
          await admin().from("ranking_placements").update({ status: "superseded" }).eq("product_id", productId).eq("status", "active");
          await admin().from("ad_campaigns").update({ status: "cancelled" }).eq("product_id", productId).in("status", ["active", "scheduled"]);
        } catch (retireError) {
          log("error", "placement.retire", { error: retireError instanceof Error ? retireError.message : "unknown" });
        }
      }
      await client.from("admin_audit_logs").insert({ actor_id: actor.id, action: `product.${status}`, entity_type: "product", entity_id: productId });
    },
  },
  leaderboards: {
    async get(scope: LeaderboardScope, page, pageSize, options) {
      const client = await anon();
      const { data, error } = await client.rpc("get_leaderboard", {
        p_scope_type: scope.type,
        p_scope_key: scope.key,
        p_limit: pageSize,
        p_offset: (page - 1) * pageSize,
        p_query: options?.query ?? "",
        p_category_id: options?.categoryId ?? null,
      });
      fail(error);
      const payload = data as { total: number; paidCount: number; entries: Array<Record<string, unknown>> };
      const entries: LeaderboardEntry[] = (payload.entries ?? []).map((entry) => ({
        id: String(entry.id),
        slug: String(entry.slug),
        name: String(entry.name),
        shortDescription: String(entry.short_description),
        categoryName: String(entry.category_name),
        categorySlug: String(entry.category_slug),
        tags: (entry.tags as string[]) ?? [],
        placement: entry.placement === "sponsored" ? "paid" : "free",
        rank: null,
        amountPaise: null,
        ownershipVerified: Boolean(entry.ownership_verified),
        approvedAt: (entry.approved_at as string | null) ?? null,
        confirmedAt: (entry.confirmed_at as string | null) ?? null,
        campaignEndsAt: (entry.ends_at as string | null) ?? null,
        websiteUrl: "",
        logoUrl: null,
        clicks: 0,
      }));
      if (entries.length > 0) {
        const ids = entries.map((entry) => entry.id);
        const [products, analytics] = await Promise.all([
          client.from("products").select("id, website_url, logo_url").in("id", ids),
          client.from("analytics_daily").select("product_id, clicks").in("product_id", ids),
        ]);
        const sites = new Map((products.data ?? []).map((row) => [row.id, row]));
        const clicks = new Map<string, number>();
        for (const row of analytics.data ?? []) {
          clicks.set(row.product_id, (clicks.get(row.product_id) ?? 0) + Number(row.clicks));
        }
        for (const entry of entries) {
          const site = sites.get(entry.id);
          if (site?.website_url) entry.websiteUrl = site.website_url;
          entry.logoUrl = site?.logo_url ?? null;
          entry.clicks = clicks.get(entry.id) ?? 0;
        }
      }
      const category = scope.type === "category" ? (await supabaseServices.categories.list()).find((item) => item.id === scope.key) : null;
      const title = scope.type === "all_time" ? "Creators" : scope.type === "daily" ? "Promoted today" : `${category?.name ?? "Lane"} creators`;
      return {
        scope,
        title,
        description: scope.type === "daily"
          ? "These are fixed-price advertisements whose campaign is currently inside its disclosed window. Asia/Kolkata is used to display those times. A higher payment does not move an advertisement ahead of one that started earlier."
          : ORGANIC_RANKING_SUMMARY,
        entries,
        page,
        pageSize,
        total: payload.total ?? entries.length,
        paidCount: payload.paidCount ?? 0,
      };
    },
    async preview() {
      throw new AppError("Rank previews are closed. Advertising packages use a fixed server price.", "ranking_closed", 410);
    },
  },
  payments: {
    async createRankingOrder() {
      throw new AppError("Rank purchases are closed. Buy a fixed advertising package instead.", "ranking_closed", 410);
    },
    async cancel(user, orderId) {
      const client = await server();
      const { error } = await client.from("payment_orders").update({ status: "cancelled", fulfillment: "not_applicable" }).eq("id", orderId).eq("user_id", user.id).eq("status", "pending");
      fail(error);
    },
    async getForUser(userId, orderId) {
      const orders = await supabaseServices.payments.listForUser(userId);
      return orders.find((order) => order.id === orderId) ?? null;
    },
    async listForUser(userId) {
      const client = await server();
      const { data, error } = await client.from("payment_orders").select("*, products(name, slug)").eq("user_id", userId).order("created_at", { ascending: false });
      fail(error);
      return (data ?? []).map((row) => mapOrder({ ...row, product_name: row.products?.name, product_slug: row.products?.slug }));
    },
    async listAdmin() {
      const client = await server();
      const { data, error } = await client.from("payment_orders").select("*, products(name, slug)").order("created_at", { ascending: false }).limit(200);
      fail(error);
      return (data ?? []).map((row) => mapOrder({ ...row, product_name: row.products?.name, product_slug: row.products?.slug }));
    },
    async applyProviderEvent(event) {
      const client = admin();
      const { data, error } = await client.rpc("apply_provider_event", {
        p_provider: event.provider,
        p_event_id: event.eventId,
        p_event_type: event.type,
        p_provider_order_id: event.providerOrderId,
        p_provider_payment_id: event.providerPaymentId ?? null,
        p_amount: event.amountPaise ?? null,
        p_currency: event.currency ?? null,
      });
      fail(error);
      const result = data as { orderId: string; status: OrderDetail["status"]; duplicate: boolean; ignored: boolean; finalRank: number | null; fulfillment: OrderDetail["fulfillment"] };
      return { orderId: result.orderId, status: result.status, duplicate: result.duplicate, ignored: result.ignored, finalRank: result.finalRank, fulfillment: result.fulfillment };
    },
    async sandboxComplete() {
      throw new AppError("Complete a labelled test payment from the public board, or wait for the payment provider to confirm it.", "sandbox_disabled", 403);
    },
    async reconcile() {
      const client = await server();
      const orders = await supabaseServices.payments.listAdmin();
      const { data, error } = await client.from("ledger_entries").select("id, order_id, entry_type, amount_paise, currency, direction, created_at");
      fail(error);
      return findReconciliationIssues(orders, (data ?? []).map((row) => ({
        id: row.id,
        orderId: row.order_id,
        entryType: row.entry_type,
        amountPaise: row.amount_paise,
        currency: "INR" as const,
        direction: row.direction,
        createdAt: row.created_at,
      })));
    },
  },
  analytics: {
    async recordView(input) {
      await record(input, "view");
    },
    async recordClick(input) {
      return record(input, "click");
    },
    async forProduct(user, productId, from, to) {
      const product = await supabaseServices.products.getManageable(user, productId);
      if (!product || !canViewPrivateAnalytics(user, product.ownerId)) throw new AppError("You cannot view these analytics.", "forbidden", 403);
      const client = await server();
      const { data, error } = await client.from("analytics_daily").select("day, views, clicks").eq("product_id", productId).gte("day", from).lte("day", to).order("day");
      fail(error);
      const points: AnalyticsPoint[] = (data ?? []).map((row) => ({ day: row.day, views: row.views, clicks: row.clicks }));
      const referrals = await client.from("analytics_referrers").select("host, views").eq("product_id", productId).gte("day", from).lte("day", to);
      const totals = new Map<string, number>();
      if (!referrals.error) {
        for (const row of referrals.data ?? []) totals.set(row.host, (totals.get(row.host) ?? 0) + row.views);
      }
      return {
        productId,
        productName: product.name,
        points,
        views: points.reduce((sum, point) => sum + point.views, 0),
        clicks: points.reduce((sum, point) => sum + point.clicks, 0),
        referrals: [...totals.entries()].map(([host, views]) => ({ host, views })).sort((a, b) => b.views - a.views).slice(0, 12),
      };
    },
    async platform() {
      const client = await anon();
      const products = await client.from("products").select("id", { count: "exact", head: true }).eq("status", "approved");
      const categories = await client.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true);
      const placements = await client.from("ranking_placements").select("id", { count: "exact", head: true }).eq("status", "active").eq("scope_type", "all_time");
      return { approvedListings: products.count ?? 0, categories: categories.count ?? 0, paidPlacements: placements.count ?? 0 };
    },
  },
  profiles: {
    async getPublic(username) {
      const client = await anon();
      const { data, error } = await client.rpc("get_public_profile", { p_username: username });
      fail(error);
      const profile = Array.isArray(data) ? data[0] : data;
      if (!profile) return null;
      const products = await client.from("products").select(productSelect).eq("owner_username", username).eq("status", "approved");
      fail(products.error);
      return {
        username: profile.username,
        displayName: profile.display_name,
        bio: profile.bio,
        website: profile.website,
        products: (products.data ?? []).map((row) => cardFrom(row as unknown as Record<string, unknown>)),
      };
    },
    async update(user, input) {
      const client = await server();
      const { error } = await client.from("profiles").update({ display_name: input.displayName, username: input.username, bio: input.bio, website: input.website || null }).eq("id", user.id);
      fail(error);
      await client.from("products").update({ owner_username: input.username, owner_display_name: input.displayName }).eq("owner_id", user.id);
    },
    async exportData(user) {
      const client = await server();
      const profile = await client.from("profiles").select("id, email, display_name, username, bio, website").eq("id", user.id).single();
      fail(profile.error);
      if (!profile.data) throw new AppError("Profile not found.", "not_found", 404);
      const products = await supabaseServices.products.listOwned(user.id);
      const orders = await supabaseServices.payments.listForUser(user.id);
      return {
        exportedAt: new Date().toISOString(),
        profile: {
          id: profile.data.id,
          email: profile.data.email,
          displayName: profile.data.display_name,
          username: profile.data.username,
          bio: profile.data.bio,
          website: profile.data.website,
        },
        products: products.map((product) => ({ id: product.id, name: product.name, slug: product.slug, status: product.status })),
        orders: orders.map((order) => ({ id: order.id, amountPaise: order.amountPaise, status: order.status, createdAt: order.createdAt })),
      };
    },
    async deleteAccount(user, confirmation) {
      const client = await server();
      const { error } = await client.rpc("delete_own_account", { p_confirmation: confirmation });
      fail(error);
      const privileged = createSupabaseAdminClient();
      if (privileged) await privileged.auth.admin.deleteUser(user.id);
    },
    async listAdmin() {
      const client = await server();
      const { data, error } = await client.from("profiles").select("id, email, display_name, username, role, created_at").is("deleted_at", null).order("created_at");
      fail(error);
      return (data ?? []).map((row) => ({ id: row.id, email: row.email, displayName: row.display_name, username: row.username, role: row.role, createdAt: row.created_at }));
    },
    async setRole(actor, userId, role) {
      if (!canManageRoles(actor)) throw new AppError("Only a super administrator can change roles.", "forbidden", 403);
      const client = await server();
      const { error } = await client.from("profiles").update({ role }).eq("id", userId);
      fail(error);
      await client.from("admin_audit_logs").insert({ actor_id: actor.id, action: `role.${role}`, entity_type: "user", entity_id: userId });
    },
  },
  verification: {
    async startEmail(user, productId) {
      const client = await server();
      const token = newToken();
      const product = await supabaseServices.products.getManageable(user, productId);
      if (!product || product.ownerId !== user.id) throw new AppError("You cannot verify this listing.", "forbidden", 403);
      const { data, error } = await client.from("ownership_claims").insert({ product_id: productId, user_id: user.id, method: "email", token_hash: sha256(token), status: "pending" }).select("id, created_at").single();
      fail(error);
      if (!data) throw new AppError("Could not start verification.", "verification", 500);
      return { id: data.id, productId, productName: product.name, method: "email" as const, status: "pending" as const, host: null, createdAt: data.created_at };
    },
    async startDomain(user, productId) {
      const client = await server();
      const token = newToken();
      const product = await supabaseServices.products.getManageable(user, productId);
      if (!product || product.ownerId !== user.id) throw new AppError("You cannot verify this listing.", "forbidden", 403);
      const host = new URL(product.websiteUrl).hostname;
      const { data, error } = await client.from("ownership_claims").insert({ product_id: productId, user_id: user.id, method: "domain", token_hash: sha256(token), host, status: "pending" }).select("id, created_at").single();
      fail(error);
      if (!data) throw new AppError("Could not start verification.", "verification", 500);
      return { id: data.id, productId, productName: product.name, method: "domain" as const, status: "pending" as const, host, createdAt: data.created_at, token };
    },
    async confirmEmail(token) {
      const client = await anon();
      const { error } = await client.rpc("confirm_ownership_token", { p_token: token });
      fail(error);
    },
    async checkDomain(user, productId) {
      const product = await supabaseServices.products.getManageable(user, productId);
      if (!product || product.ownerId !== user.id) throw new AppError("You cannot verify this listing.", "forbidden", 403);
      const host = new URL(product.websiteUrl).hostname;
      const addresses = await lookup(host, { all: true });
      if (addresses.some((item) => isBlockedAddress(item.address))) throw new AppError("That domain cannot be checked from this server.", "ssrf", 400);
      const response = await fetch(`https://${host}/.well-known/${site.verificationFile}`, { redirect: "manual", signal: AbortSignal.timeout(5000) });
      if (!response.ok || (response.status >= 300 && response.status < 400)) throw new AppError("The verification file was not found.", "verification", 400);
      const text = (await response.text()).slice(0, 2000);
      const { error } = await admin().rpc("confirm_domain_for_user", { p_user_id: user.id, p_product_id: productId, p_file: text });
      fail(error);
    },
    async simulateDomain() {
      throw new AppError("Domain simulation is not available.", "mock_disabled", 403);
    },
    async listForUser(userId) {
      const client = await server();
      const { data, error } = await client.from("ownership_claims").select("id, product_id, method, status, host, created_at, products(name)").eq("user_id", userId).order("created_at", { ascending: false });
      fail(error);
      return (data ?? []).map((row) => ({
        id: row.id,
        productId: row.product_id,
        productName: relatedName((row as { products?: unknown }).products),
        method: row.method,
        status: row.status,
        host: row.host,
        createdAt: row.created_at,
      }));
    },
  },
  notifications: {
    async list(userId) {
      const client = await server();
      const { data, error } = await client.from("notifications").select("id, user_id, title, body, href, read_at, created_at").eq("user_id", userId).order("created_at", { ascending: false });
      fail(error);
      return (data ?? []).map((row) => ({ id: row.id, userId: row.user_id, title: row.title, body: row.body, href: row.href, readAt: row.read_at, createdAt: row.created_at }));
    },
    async markRead(userId, id) {
      const client = await server();
      const { error } = await client.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
      fail(error);
    },
    async markAllRead(userId) {
      const client = await server();
      const { error } = await client.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null);
      fail(error);
    },
  },
  reports: {
    async create(user, input) {
      const client = user ? await server() : await anon();
      const { error } = await client.from("reports").insert({ product_id: input.productId, reporter_id: user?.id ?? null, reason: input.reason, details: input.details });
      fail(error);
    },
    async listAdmin() {
      const client = await server();
      const { data, error } = await client.from("reports").select("id, product_id, reporter_id, reason, details, status, created_at, products(name)").order("created_at", { ascending: false });
      fail(error);
      return (data ?? []).map((row) => ({
        id: row.id,
        productId: row.product_id,
        productName: relatedName((row as { products?: unknown }).products, ""),
        reporterId: row.reporter_id,
        reason: row.reason,
        details: row.details,
        status: row.status,
        createdAt: row.created_at,
      }));
    },
    async decide(actor, reportId, decision, notes) {
      if (!canModerate(actor)) throw new AppError("You cannot review reports.", "forbidden", 403);
      const client = await server();
      const { error } = await client.from("reports").update({ status: decision }).eq("id", reportId);
      fail(error);
      await client.from("moderation_decisions").insert({ report_id: reportId, actor_id: actor.id, action: decision, notes });
      await client.from("admin_audit_logs").insert({ actor_id: actor.id, action: `report.${decision}`, entity_type: "report", entity_id: reportId });
    },
  },
  contact: {
    async send(input) {
      const client = await anon();
      const { error } = await client.from("contact_messages").insert(input);
      fail(error);
    },
    async listAdmin() {
      const client = await server();
      const { data, error } = await client.from("contact_messages").select("id, name, email, message, created_at").order("created_at", { ascending: false });
      fail(error);
      return (data ?? []).map((row) => ({ id: row.id, name: row.name, email: row.email, message: row.message, createdAt: row.created_at }));
    },
  },
  admin: {
    async overview() {
      const client = await server();
      const users = await client.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null);
      const products = await client.from("products").select("status");
      const reports = await client.from("reports").select("id", { count: "exact", head: true }).eq("status", "open");
      const orders = await client.from("payment_orders").select("status, amount_paise");
      const failures = await client.from("webhook_failures").select("id", { count: "exact", head: true }).is("resolved_at", null);
      fail(products.error);
      const productsByStatus: Record<ProductStatus, number> = { draft: 0, pending_verification: 0, pending_review: 0, approved: 0, rejected: 0, suspended: 0, removed: 0 };
      for (const row of products.data ?? []) productsByStatus[row.status as ProductStatus] += 1;
      const paid = (orders.data ?? []).filter((order) => order.status === "paid");
      return {
        users: users.count ?? 0,
        productsByStatus,
        openReports: reports.count ?? 0,
        paidOrders: paid.length,
        recordedChargePaise: paid.reduce((sum, order) => sum + order.amount_paise, 0),
        webhookFailures: failures.count ?? 0,
        pendingSubmissions: productsByStatus.pending_review + productsByStatus.pending_verification,
      };
    },
    async audit() {
      const client = await server();
      const { data, error } = await client.from("admin_audit_logs").select("id, actor_id, action, entity_type, entity_id, created_at, profiles(display_name)").order("created_at", { ascending: false }).limit(100);
      fail(error);
      return (data ?? []).map((row) => ({
        id: row.id,
        actorId: row.actor_id,
        actorName: relatedName((row as { profiles?: unknown }).profiles, "Admin"),
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        createdAt: row.created_at,
      }));
    },
    async settings() {
      return settingsFrom(await server());
    },
    async updateSettings(actor, settings) {
      if (!canManageRoles(actor)) throw new AppError("Only a super administrator can change platform settings.", "forbidden", 403);
      const client = await server();
      const writes = [
        client.from("ad_packages").update({ price_paise: settings.dailyFeaturedPricePaise, updated_at: new Date().toISOString() }).eq("slug", "daily-featured"),
        client.from("ad_packages").update({ price_paise: settings.weeklyFeaturedPricePaise, updated_at: new Date().toISOString() }).eq("slug", "weekly-featured"),
        client.from("ad_packages").update({ price_paise: settings.categorySponsorPricePaise, updated_at: new Date().toISOString() }).eq("slug", "weekly-category-sponsor"),
        client.from("platform_settings").update({ value: { holdNewListingsForReview: settings.holdNewListingsForReview }, updated_by: actor.id }).eq("key", "moderation"),
      ];
      for (const write of writes) fail((await write).error);
    },
    async sponsored() {
      const client = await server();
      const { data, error } = await client.from("sponsored_placements").select("id, product_id, starts_at, ends_at, active, products(name)").order("starts_at", { ascending: false });
      fail(error);
      return (data ?? []).map((row) => ({
        id: row.id,
        productId: row.product_id,
        productName: relatedName((row as { products?: unknown }).products),
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        active: row.active,
      }));
    },
    async setSponsored(actor, productId, days, active) {
      if (!canModerate(actor)) throw new AppError("You cannot manage sponsored placements.", "forbidden", 403);
      const client = await server();
      const now = new Date();
      const { error } = await client.from("sponsored_placements").insert({
        product_id: productId,
        starts_at: now.toISOString(),
        ends_at: new Date(now.getTime() + days * 86_400_000).toISOString(),
        active,
        created_by: actor.id,
      });
      fail(error);
    },
    async webhookFailures() {
      const client = await server();
      const { data, error } = await client.from("webhook_failures").select("id, provider, event_id, error, created_at, resolved_at").order("created_at", { ascending: false });
      fail(error);
      return (data ?? []).map((row) => ({ id: row.id, provider: row.provider, eventId: row.event_id, error: row.error, createdAt: row.created_at, resolvedAt: row.resolved_at }));
    },
    async snapshotDaily(day) {
      const client = await server();
      const { error } = await client.rpc("snapshot_daily_board", { p_day: day });
      fail(error);
    },
  },
};

async function record(input: { productId: string; userAgent: string; ip: string; referrerHost?: string | null }, kind: "view" | "click") {
  if (isLikelyBot(input.userAgent)) return false;
  const salt = process.env.ANALYTICS_SALT || (readServerEnv().NODE_ENV === "production" ? "" : "development-analytics-salt");
  if (!salt) return false;
  try {
    const client = admin();
    const day = utcDayKey(new Date());
    const { data, error } = await client.rpc("record_engagement", {
      p_product_id: input.productId,
      p_kind: kind,
      p_dedupe: sha256(`${salt}|${kind}|${input.productId}|${visitorHash(input.ip, input.userAgent, salt)}|${day}`),
      p_day: day,
    });
    fail(error);
    const recorded = Boolean(data);
    if (recorded && kind === "view" && input.referrerHost) {
      const referral = await client.rpc("record_referral", {
        p_product_id: input.productId,
        p_day: day,
        p_host: input.referrerHost,
      });
      if (referral.error) log("error", "referral.record", { code: referral.error.code ?? "unknown" });
    }
    return recorded;
  } catch (error) {
    if (error instanceof ConfigurationError) return false;
    throw error;
  }
}
