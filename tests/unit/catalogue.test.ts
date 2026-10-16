import { describe, expect, it } from "vitest";
import { CATALOGUE, CATEGORY_GROUPS, boardQuery, sanitizeDetails } from "@/config/catalogue";
import { istDayKey, shiftIstDay } from "@/features/leaderboards/engine";
import { readListingImage } from "@/features/listings/media";
import { sha256 } from "@/lib/security/hash";

describe("presence catalogue", () => {
  it("covers the four groups and the public categories", () => {
    expect(CATEGORY_GROUPS.map((group) => group.name)).toEqual([
      "Digital Presence",
      "Lifestyle & Possessions",
      "Success & Identity",
      "Community & Entertainment",
    ]);
    expect(CATALOGUE).toHaveLength(14);
    expect(new Set(CATALOGUE.map((item) => item.group))).toEqual(new Set(CATEGORY_GROUPS.map((group) => group.slug)));
  });

  it("keeps only the fields for the chosen set and rejects a fake payment status", () => {
    expect(sanitizeDetails("vehicle", { make: "Honda", model: "City", year: "2020", paid: "true" })).toEqual({
      make: "Honda",
      model: "City",
      year: "2020",
    });
    expect(() => sanitizeDetails("instagram", {})).toThrow(/handle/i);
  });

  it("strips search wildcards", () => {
    expect(boardQuery("100%_drop\\")).toBe("100 drop");
  });

  it("uses the IST midnight boundary and the previous IST day", () => {
    expect(istDayKey(new Date("2026-10-15T18:29:59.999Z"))).toBe("2026-10-15");
    expect(istDayKey(new Date("2026-10-15T18:30:00.000Z"))).toBe("2026-10-16");
    expect(shiftIstDay(new Date("2026-10-16T18:35:00.000Z"), -1)).toBe("2026-10-16");
  });

  it("does not treat the manage token as its stored hash", () => {
    const token = "public-looking-token-value-with-enough-length";
    expect(sha256(token)).not.toBe(token);
  });
});

describe("listing images", () => {
  it("rejects a file that is not a JPEG, PNG, or WebP", async () => {
    const file = new File([new Uint8Array([1, 2, 3, 4])], "note.txt", { type: "text/plain" });
    await expect(readListingImage(file)).rejects.toThrow(/JPEG/);
  });
});
