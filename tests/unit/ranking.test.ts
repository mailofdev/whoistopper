import { describe, expect, it } from "vitest";
import {
  applyVerifiedBid,
  assignRanks,
  comparePlacements,
  minimumAmountForTarget,
  previewRank,
  utcDayKey,
  withScopeLock,
  type Placement,
} from "@/features/leaderboards/engine";
import { DEFAULT_RANKING_RULES } from "@/features/leaderboards/engine";

const rules = { ...DEFAULT_RANKING_RULES };

function place(productId: string, amountPaise: number, confirmedAt: string): Placement {
  return { id: productId, productId, amountPaise, confirmedAt };
}

describe("ranking engine", () => {
  it("orders by amount, then earlier confirmation, then product id", () => {
    const ranked = assignRanks([
      place("b", 500000, "2026-09-01T09:00:00.000Z"),
      place("a", 500000, "2026-09-01T08:00:00.000Z"),
      place("c", 1000, "2026-09-01T08:00:00.000Z"),
      place("d", 500000, "2026-09-01T08:00:00.000Z"),
    ]);
    expect(ranked.map((item) => item.productId)).toEqual(["a", "d", "b", "c"]);
    expect(ranked.map((item) => item.rank)).toEqual([1, 2, 3, 4]);
    expect(comparePlacements(place("a", 10, "2026-01-01T00:00:00.000Z"), place("b", 10, "2026-01-01T00:00:00.000Z"))).toBeLessThan(0);
  });

  it("uses the UTC calendar day, including the midnight boundary", () => {
    expect(utcDayKey(new Date("2026-10-15T23:59:59.999Z"))).toBe("2026-10-15");
    expect(utcDayKey(new Date("2026-10-16T00:00:00.000Z"))).toBe("2026-10-16");
  });

  it("requires a full increment above an existing bid and previews without reserving", () => {
    const placements = [place("other", 20000, "2026-10-01T00:00:00.000Z")];
    expect(minimumAmountForTarget({ placements, bidderProductId: "mine", rules })).toBe(9900);
    expect(minimumAmountForTarget({ placements, bidderProductId: "other", rules })).toBe(21000);
    expect(previewRank({
      placements,
      bidderProductId: "mine",
      amountPaise: 25000,
      confirmedAt: "2026-10-02T00:00:00.000Z",
    })).toBe(1);
  });

  it("rejects a later payment that is below the increment on an existing bid", () => {
    const placements = [place("mine", 50000, "2026-10-01T00:00:00.000Z")];
    expect(() => applyVerifiedBid({
      placements,
      bid: place("mine", 20000, "2026-10-02T00:00:00.000Z"),
      rules,
    })).toThrow(/minimum/);
    const upgraded = applyVerifiedBid({
      placements,
      bid: place("mine", 51000, "2026-10-02T00:00:00.000Z"),
      rules,
    });
    expect(upgraded.applied).toBe(true);
    expect(upgraded.rank).toBe(1);
  });

  it("serialises simultaneous upgrades so both bids survive", async () => {
    let placements = [place("seed", 9900, "2026-10-01T00:00:00.000Z")];
    const first = withScopeLock("all_time", async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      const result = applyVerifiedBid({
        placements,
        bid: place("one", 20000, "2026-10-02T00:00:00.100Z"),
        rules,
      });
      placements = result.placements;
      return result.rank;
    });
    const second = withScopeLock("all_time", async () => {
      const result = applyVerifiedBid({
        placements,
        bid: place("two", 30000, "2026-10-02T00:00:00.200Z"),
        rules,
      });
      placements = result.placements;
      return result.rank;
    });
    await Promise.all([first, second]);
    expect(assignRanks(placements).map((item) => item.productId)).toEqual(["two", "one", "seed"]);
  });
});
