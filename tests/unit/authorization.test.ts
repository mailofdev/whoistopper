import { describe, expect, it } from "vitest";
import { canEditProduct, canUpgradeProduct, canViewPrivateAnalytics, isAdmin } from "@/lib/security/authorization";
import type { SessionUser } from "@/types/domain";

const owner: SessionUser = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
  email: "ananya@example.com",
  displayName: "Ananya Iyer",
  username: "ananya",
  role: "user",
  emailVerified: true,
  mfaEnabled: false,
  bio: "",
  website: null,
};
const other: SessionUser = { ...owner, id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3", role: "user" };
const admin: SessionUser = { ...owner, id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4", role: "admin" };

describe("authorization", () => {
  it("stops a user from editing or viewing someone else's listing data", () => {
    const product = { ownerId: owner.id, status: "approved" as const, ownershipVerified: true };
    expect(canEditProduct(other, product)).toBe(false);
    expect(canUpgradeProduct(other, product)).toBe(false);
    expect(canViewPrivateAnalytics(other, product.ownerId)).toBe(false);
    expect(canEditProduct(owner, product)).toBe(true);
    expect(canUpgradeProduct(owner, { ...product, ownershipVerified: false })).toBe(false);
    expect(canViewPrivateAnalytics(admin, product.ownerId)).toBe(true);
    expect(isAdmin(other)).toBe(false);
  });
});
