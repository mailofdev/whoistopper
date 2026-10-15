import type { ProductStatus, SessionUser } from "@/types/domain";

const OWNER_EDITABLE: ProductStatus[] = ["draft", "pending_verification", "rejected", "approved"];

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "admin" || user?.role === "super_admin";
}

export function isSuperAdmin(user: SessionUser | null): boolean {
  return user?.role === "super_admin";
}

export function canEditProduct(
  user: SessionUser | null,
  product: { ownerId: string | null; status: ProductStatus },
): boolean {
  if (!user || product.ownerId !== user.id) return false;
  if (isAdmin(user)) return true;
  return OWNER_EDITABLE.includes(product.status);
}

export function canUpgradeProduct(
  user: SessionUser | null,
  product: { ownerId: string | null; status: ProductStatus; ownershipVerified: boolean },
): boolean {
  return Boolean(user && product.ownerId === user.id && product.status === "approved" && product.ownershipVerified);
}

export function canViewPrivateAnalytics(user: SessionUser | null, ownerId: string | null): boolean {
  if (!user) return false;
  return user.id === ownerId || isAdmin(user);
}

export function canManageRoles(user: SessionUser | null): boolean {
  return isSuperAdmin(user);
}

export function canModerate(user: SessionUser | null): boolean {
  return isAdmin(user);
}
