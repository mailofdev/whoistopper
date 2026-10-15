import { afterEach, describe, expect, it } from "vitest";
import { resetMockStore } from "@/mocks/store";
import { mockServices } from "@/mocks/services";
import { productId } from "@/mocks/data/products";
import { DEMO_PASSWORD, mockPasswordHash, verifyMockPassword } from "@/mocks/data/users";
import { mockAuth } from "@/mocks/services";

describe("mock services", () => {
  afterEach(() => {
    resetMockStore(new Date("2026-10-15T12:00:00.000Z"));
  });

  it("selects the same service shape and keeps the all-time tie break", async () => {
    resetMockStore(new Date("2026-10-15T12:00:00.000Z"));
    const board = await mockServices.leaderboards.get({ type: "all_time", key: "all_time" }, 1, 20);
    expect(board.entries[0]?.slug).toBe("nadi-payroll");
    expect(board.entries[1]?.slug).toBe("chaileger");
    expect(board.entries[0]?.amountPaise).toBe(board.entries[1]?.amountPaise);
    expect(board.entries[0]?.placement).toBe("paid");
    expect(board.entries.some((entry) => entry.placement === "free")).toBe(true);
  });

  it("hides unapproved listings from search and blocks a second capture", async () => {
    resetMockStore(new Date("2026-10-15T12:00:00.000Z"));
    const results = await mockServices.products.search({ q: "TankerTrack", sort: "newest", page: 1, pageSize: 12 });
    expect(results.total).toBe(0);
    const user = mockAuth.authenticate("ananya@example.com", DEMO_PASSWORD);
    expect(user?.username).toBe("ananya");
    expect(verifyMockPassword(DEMO_PASSWORD, mockPasswordHash(DEMO_PASSWORD))).toBe(true);
    if (!user) throw new Error("missing demo user");
    const checkout = await mockServices.payments.createRankingOrder(user, productId(7), "all_time", 9900, "idem-1");
    const again = await mockServices.payments.createRankingOrder(user, productId(7), "all_time", 9900, "idem-1");
    expect(again.id).toBe(checkout.id);
    const paid = await mockServices.payments.sandboxComplete(user, checkout.id, "success");
    expect(paid.status).toBe("paid");
    expect(paid.finalRank).toBeGreaterThan(0);
    const duplicate = await mockServices.payments.sandboxComplete(user, checkout.id, "success");
    expect(duplicate.duplicate).toBe(true);
    const issues = await mockServices.payments.reconcile();
    expect(issues.find((issue) => issue.orderId === checkout.id)).toBeUndefined();
  });
});
