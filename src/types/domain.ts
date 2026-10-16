export const PRODUCT_STATUSES = [
  "draft",
  "pending_verification",
  "pending_review",
  "approved",
  "rejected",
  "suspended",
  "removed",
] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export type UserRole = "user" | "admin" | "super_admin";
export type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";
export type PaymentPurpose = "ranking_upgrade" | "sponsored_placement";
export type PaymentProvider = "razorpay" | "cashfree" | "sandbox";
export type ScopeType = "all_time" | "daily" | "category";
export type Fulfillment = "pending" | "fulfilled" | "needs_refund" | "not_applicable";
export type PlacementKind = "paid" | "free";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  username: string;
  role: UserRole;
  emailVerified: boolean;
  mfaEnabled: boolean;
  bio: string;
  website: string | null;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SocialLinks {
  x?: string;
  linkedin?: string;
  instagram?: string;
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string;
  normalizedUrl: string;
  shortDescription: string;
  fullDescription: string;
  logoUrl: string | null;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  tags: string[];
  ownerId: string | null;
  ownerUsername: string | null;
  ownerDisplayName: string | null;
  creatorName: string;
  socialLinks: SocialLinks;
  status: ProductStatus;
  rejectionReason: string | null;
  ownershipVerified: boolean;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  allTimeRank: number | null;
  allTimeAmountPaise: number | null;
  todayRank: number | null;
  todayAmountPaise: number | null;
}

export interface ProductCardModel {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  categoryName: string;
  categorySlug: string;
  tags: string[];
  placement: PlacementKind;
  rank: number | null;
  amountPaise: number | null;
  ownershipVerified: boolean;
  approvedAt: string | null;
}

export type LeaderboardScope =
  | { type: "all_time"; key: "all_time" }
  | { type: "daily"; key: string }
  | { type: "category"; key: string };

export interface LeaderboardEntry extends ProductCardModel {
  confirmedAt: string | null;
  websiteUrl: string;
  logoUrl: string | null;
  clicks: number;
}

export interface LeaderboardPage {
  scope: LeaderboardScope;
  title: string;
  description: string;
  entries: LeaderboardEntry[];
  page: number;
  pageSize: number;
  total: number;
  paidCount: number;
}

export interface ProductQuery {
  q?: string;
  category?: string;
  tag?: string;
  sort: "newest" | "name" | "rank";
  page: number;
  pageSize: number;
}

export interface ProductInput {
  name: string;
  websiteUrl: string;
  shortDescription: string;
  fullDescription: string;
  categorySlug: string;
  tags: string[];
  creatorName: string;
  socialLinks: SocialLinks;
  logoUrl?: string;
  submit: boolean;
}

export interface OrderDetail {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productSlug: string;
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
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
}

export interface CheckoutOrder extends OrderDetail {
  publishableKeyId: string | null;
  sandbox: boolean;
}

export interface UpgradePreview {
  minimumPaise: number;
  quotedRank: number;
  amountPaise: number;
  message: string;
}

export interface AnalyticsPoint {
  day: string;
  views: number;
  clicks: number;
}

export interface AnalyticsSeries {
  productId: string;
  productName: string;
  points: AnalyticsPoint[];
  views: number;
  clicks: number;
}

export interface PlatformStats {
  approvedListings: number;
  categories: number;
  paidPlacements: number;
}

export interface PublicProfile {
  username: string;
  displayName: string;
  bio: string;
  website: string | null;
  products: ProductCardModel[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface OwnershipClaim {
  id: string;
  productId: string;
  productName: string;
  method: "email" | "domain";
  status: "pending" | "verified" | "expired" | "rejected";
  host: string | null;
  createdAt: string;
  devLink?: string;
}

export interface ReportItem {
  id: string;
  productId: string | null;
  productName: string | null;
  reporterId: string | null;
  reason: string;
  details: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export interface PlatformSettings {
  minimumBidPaise: number;
  minimumIncrementPaise: number;
  maxBidPaise: number;
  sponsoredWeeklyPricePaise: number;
  sponsoredMaxActive: number;
  holdNewListingsForReview: boolean;
}

export interface SponsoredPlacement {
  id: string;
  productId: string;
  productName: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
}

export interface WebhookFailure {
  id: string;
  provider: string;
  eventId: string;
  error: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface ReconciliationIssue {
  orderId: string;
  code: string;
  message: string;
}

export interface AdminOverview {
  users: number;
  productsByStatus: Record<ProductStatus, number>;
  openReports: number;
  paidOrders: number;
  recordedChargePaise: number;
  webhookFailures: number;
  pendingSubmissions: number;
}

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string;
  username: string;
  role: UserRole;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  orderId: string;
  entryType: "charge" | "refund" | "adjustment";
  amountPaise: number;
  currency: "INR";
  direction: "credit" | "debit";
  createdAt: string;
}

export interface ExportBundle {
  exportedAt: string;
  profile: {
    id: string;
    email: string;
    displayName: string;
    username: string;
    bio: string;
    website: string | null;
  };
  products: Array<{ id: string; name: string; slug: string; status: ProductStatus }>;
  orders: Array<{ id: string; amountPaise: number; status: OrderStatus; createdAt: string }>;
}

export interface ContactInput {
  name: string;
  email: string;
  message: string;
}

export interface ProviderEventInput {
  provider: PaymentProvider;
  eventId: string;
  type: "payment.captured" | "payment.failed" | "payment.cancelled" | "refund.processed";
  providerOrderId: string;
  providerPaymentId?: string;
  amountPaise?: number;
  currency?: string;
}

export interface ApplyEventResult {
  orderId: string;
  status: OrderStatus;
  duplicate: boolean;
  ignored: boolean;
  finalRank: number | null;
  fulfillment: Fulfillment;
}
