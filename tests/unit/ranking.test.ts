import { describe, expect, it } from "vitest";
import { priceForCheckout } from "@/config/packages";
import { campaignWindow, isAdvertisementVisible, orderOrganic, scheduleSharedPlacement } from "@/features/campaigns/schedule";
import { decideProviderEvent } from "@/features/payments/state-machine";
import { utcDayKey } from "@/features/leaderboards/engine";

describe("fixed-price campaigns", () => {
  it("uses a 24-hour window instead of the next IST midnight", () => {
    const start = new Date("2026-10-15T18:29:59.999Z");
    const window = campaignWindow(start, 24);
    expect(window.startsAt).toBe("2026-10-15T18:29:59.999Z");
    expect(window.endsAt).toBe("2026-10-16T18:29:59.999Z");
    expect(utcDayKey(start)).toBe("2026-10-15");
  });

  it("hides an advertisement the moment it expires", () => {
    const start = new Date("2026-10-15T10:00:00.000Z");
    const window = campaignWindow(start, 24);
    expect(isAdvertisementVisible({ status: "active", ...window }, new Date("2026-10-16T09:59:00.000Z"))).toBe(true);
    expect(isAdvertisementVisible({ status: "active", ...window }, new Date("2026-10-16T10:00:00.000Z"))).toBe(false);
    expect(isAdvertisementVisible({ status: "scheduled", startsAt: null, endsAt: null }, start)).toBe(false);
    expect(isAdvertisementVisible({ status: "expired", ...window }, start)).toBe(false);
  });

  it("orders shared ads by start time and ignores price", () => {
    const ordered = scheduleSharedPlacement([
      { productId: "late-expensive", startsAt: "2026-10-02T00:00:00.000Z", placement: "daily_featured" as const, pricePaise: 99900 },
      { productId: "early-cheap", startsAt: "2026-10-01T00:00:00.000Z", placement: "daily_featured" as const, pricePaise: 19900 },
    ]);
    expect(ordered.map((item) => item.productId)).toEqual(["early-cheap", "late-expensive"]);
  });

  it("orders organic listings by newest approval, then name", () => {
    const ordered = orderOrganic([
      { id: "b", name: "Beta", approvedAt: "2026-10-01T00:00:00.000Z" },
      { id: "a", name: "Alpha", approvedAt: "2026-10-02T00:00:00.000Z" },
      { id: "c", name: "Alpine", approvedAt: "2026-10-02T00:00:00.000Z" },
    ]);
    expect(ordered.map((item) => item.id)).toEqual(["a", "c", "b"]);
  });

  it("rejects a client price that does not match the server package", () => {
    expect(priceForCheckout(19900)).toBe(19900);
    expect(priceForCheckout(19900, 19900)).toBe(19900);
    expect(() => priceForCheckout(19900, 100)).toThrow(/server/);
  });

  it("schedules an advertising package and does not allocate a rank", () => {
    const decision = decideProviderEvent({
      id: "40000000-0000-4000-8000-000000000001",
      status: "pending",
      amountPaise: 19900,
      currency: "INR",
      purpose: "advertising_package",
      providerPaymentId: null,
      fulfillment: "pending",
    }, {
      provider: "razorpay",
      eventId: "evt_ad",
      type: "payment.captured",
      providerOrderId: "order_1",
      providerPaymentId: "pay_1",
      amountPaise: 19900,
      currency: "INR",
    }, new Set(), "2026-10-15T00:00:00.000Z");
    expect(decision.scheduleCampaign).toBe(true);
    expect(decision.allocateRank).toBe(false);
    expect(decision.status).toBe("paid");
    const again = decideProviderEvent({
      id: "40000000-0000-4000-8000-000000000001",
      status: "paid",
      amountPaise: 19900,
      currency: "INR",
      purpose: "advertising_package",
      providerPaymentId: "pay_1",
      fulfillment: "fulfilled",
    }, {
      provider: "razorpay",
      eventId: "evt_ad",
      type: "payment.captured",
      providerOrderId: "order_1",
      providerPaymentId: "pay_1",
      amountPaise: 19900,
      currency: "INR",
    }, new Set(["evt_ad"]), "2026-10-15T00:00:01.000Z");
    expect(again.duplicate).toBe(true);
    expect(again.scheduleCampaign).toBe(false);
  });

  it("marks a retired ranking payment for refund instead of moving a listing", () => {
    const decision = decideProviderEvent({
      id: "40000000-0000-4000-8000-000000000001",
      status: "pending",
      amountPaise: 9900,
      currency: "INR",
      purpose: "ranking_upgrade",
      providerPaymentId: null,
      fulfillment: "pending",
    }, {
      provider: "razorpay",
      eventId: "evt_old",
      type: "payment.captured",
      providerOrderId: "order_1",
      providerPaymentId: "pay_1",
      amountPaise: 9900,
      currency: "INR",
    }, new Set(), "2026-10-15T00:00:00.000Z");
    expect(decision.allocateRank).toBe(false);
    expect(decision.status).toBe("refund_pending");
    expect(decision.fulfillment).toBe("needs_refund");
  });
});
