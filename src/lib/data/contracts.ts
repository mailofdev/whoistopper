import type { PageResult } from "@/lib/pagination";
import type {
  AdminOverview,
  AdminUserRow,
  AnalyticsSeries,
  ApplyEventResult,
  AuditEntry,
  Category,
  CheckoutOrder,
  ContactInput,
  ExportBundle,
  LeaderboardPage,
  LeaderboardScope,
  NotificationItem,
  OrderDetail,
  OwnershipClaim,
  PlatformSettings,
  PlatformStats,
  ProductCardModel,
  ProductDetail,
  ProductInput,
  ProductQuery,
  ProductStatus,
  ProviderEventInput,
  PublicProfile,
  ReconciliationIssue,
  ReportItem,
  ScopeType,
  SessionUser,
  SponsoredPlacement,
  UpgradePreview,
  UserRole,
  WebhookFailure,
} from "@/types/domain";

export interface AppServices {
  categories: {
    list(): Promise<Category[]>;
    listAll(): Promise<Category[]>;
    getBySlug(slug: string): Promise<Category | null>;
    save(actor: SessionUser, input: { id?: string; slug: string; name: string; description: string; sortOrder: number; isActive: boolean; groupSlug: string; groupName: string; groupSort: number; fieldSet: string }): Promise<void>;
  };
  products: {
    search(query: ProductQuery): Promise<PageResult<ProductCardModel>>;
    getPublicBySlug(slug: string): Promise<ProductDetail | null>;
    listRecent(limit: number): Promise<ProductCardModel[]>;
    listTrending(limit: number): Promise<ProductCardModel[]>;
    listOwned(userId: string): Promise<ProductDetail[]>;
    getManageable(user: SessionUser, id: string): Promise<ProductDetail | null>;
    create(user: SessionUser, input: ProductInput): Promise<ProductDetail>;
    update(user: SessionUser, id: string, input: ProductInput): Promise<ProductDetail>;
    listAdmin(status?: ProductStatus): Promise<ProductDetail[]>;
    setStatus(actor: SessionUser, productId: string, status: ProductStatus, reason?: string): Promise<void>;
  };
  leaderboards: {
    get(scope: LeaderboardScope, page: number, pageSize: number, options?: { query?: string; categoryId?: string }): Promise<LeaderboardPage>;
    preview(user: SessionUser, productId: string, scope: ScopeType, amountPaise: number, now?: Date): Promise<UpgradePreview>;
  };
  payments: {
    createRankingOrder(user: SessionUser, productId: string, scope: ScopeType, amountPaise: number, idempotencyKey: string): Promise<CheckoutOrder>;
    cancel(user: SessionUser, orderId: string): Promise<void>;
    getForUser(userId: string, orderId: string): Promise<OrderDetail | null>;
    listForUser(userId: string): Promise<OrderDetail[]>;
    listAdmin(): Promise<OrderDetail[]>;
    applyProviderEvent(event: ProviderEventInput, now?: Date): Promise<ApplyEventResult>;
    sandboxComplete(user: SessionUser, orderId: string, outcome: "success" | "failed" | "cancelled"): Promise<ApplyEventResult>;
    reconcile(): Promise<ReconciliationIssue[]>;
  };
  analytics: {
    recordView(input: { productId: string; userAgent: string; ip: string }): Promise<void>;
    recordClick(input: { productId: string; userAgent: string; ip: string }): Promise<boolean>;
    forProduct(user: SessionUser, productId: string, from: string, to: string): Promise<AnalyticsSeries>;
    platform(): Promise<PlatformStats>;
  };
  profiles: {
    getPublic(username: string): Promise<PublicProfile | null>;
    update(user: SessionUser, input: { displayName: string; username: string; bio: string; website?: string }): Promise<void>;
    exportData(user: SessionUser): Promise<ExportBundle>;
    deleteAccount(user: SessionUser, confirmation: string): Promise<void>;
    listAdmin(): Promise<AdminUserRow[]>;
    setRole(actor: SessionUser, userId: string, role: UserRole): Promise<void>;
  };
  verification: {
    startEmail(user: SessionUser, productId: string): Promise<OwnershipClaim>;
    startDomain(user: SessionUser, productId: string): Promise<OwnershipClaim & { token: string }>;
    confirmEmail(token: string): Promise<void>;
    checkDomain(user: SessionUser, productId: string): Promise<void>;
    simulateDomain(user: SessionUser, productId: string): Promise<void>;
    listForUser(userId: string): Promise<OwnershipClaim[]>;
  };
  notifications: {
    list(userId: string): Promise<NotificationItem[]>;
    markRead(userId: string, id: string): Promise<void>;
    markAllRead(userId: string): Promise<void>;
  };
  reports: {
    create(user: SessionUser | null, input: { productId: string; reason: string; details: string }): Promise<void>;
    listAdmin(): Promise<ReportItem[]>;
    decide(actor: SessionUser, reportId: string, decision: "resolved" | "dismissed", notes: string): Promise<void>;
  };
  contact: {
    send(input: ContactInput): Promise<void>;
    listAdmin(): Promise<Array<ContactInput & { id: string; createdAt: string }>>;
  };
  admin: {
    overview(): Promise<AdminOverview>;
    audit(): Promise<AuditEntry[]>;
    settings(): Promise<PlatformSettings>;
    updateSettings(actor: SessionUser, settings: PlatformSettings): Promise<void>;
    sponsored(): Promise<SponsoredPlacement[]>;
    setSponsored(actor: SessionUser, productId: string, days: number, active: boolean): Promise<void>;
    webhookFailures(): Promise<WebhookFailure[]>;
    snapshotDaily(day: string): Promise<void>;
  };
}
