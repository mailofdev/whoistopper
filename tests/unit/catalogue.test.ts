import { describe, expect, it } from "vitest";
import { ACTIVE_CATEGORY_SLUGS, CATALOGUE, CATEGORY_MIGRATION, RETIRED_CATEGORY_SLUGS, boardQuery, fieldsFor, sanitizeDetails } from "@/config/catalogue";
import { istDayKey, shiftIstDay } from "@/features/leaderboards/engine";
import { readListingImage } from "@/features/listings/media";
import { sha256 } from "@/lib/security/hash";

const sample: Record<string, Record<string, string>> = {
  "websites-saas": { productType: "SaaS", useCase: "Send invoices", audience: "Studios", pricingUrl: "https://example.com/pricing" },
  "business-startups": { businessType: "Startup", industry: "Software", market: "India" },
  "developer-tools": { toolType: "Library", platform: "TypeScript", openSource: "Yes", repositoryUrl: "https://github.com/example/tool" },
  "instagram-pages": { profileUrl: "https://instagram.com/example", handle: "example", niche: "Design" },
  "youtube-channels": { channelUrl: "https://www.youtube.com/@example", niche: "Music" },
  "other-online-profiles": { platform: "LinkedIn", purpose: "Design hiring" },
  "gaming-esports": { title: "Valorant", listingType: "Team" },
  "art-creative-work": { discipline: "Illustration" },
  "music-entertainment": { listingType: "Podcast", genre: "Interviews" },
  "skills-portfolios": { profession: "Designer" },
};

describe("directory catalogue", () => {
  it("publishes exactly the ten launch categories", () => {
    expect(CATALOGUE.map((item) => item.slug)).toEqual([...ACTIVE_CATEGORY_SLUGS]);
    expect(new Set(CATALOGUE.map((item) => item.fieldSet))).toEqual(new Set(ACTIVE_CATEGORY_SLUGS));
  });

  it("validates each category and drops unknown fields", () => {
    for (const slug of ACTIVE_CATEGORY_SLUGS) {
      const clean = sanitizeDetails(slug, { ...sample[slug], password: "nope", rankAmount: "999" });
      expect(clean.password).toBeUndefined();
      expect(clean.rankAmount).toBeUndefined();
      expect(clean.country).toBe("India");
      expect(fieldsFor(slug).filter((field) => field.required).every((field) => clean[field.key])).toBe(true);
    }
  });

  it("rejects a retired category and a missing required field", () => {
    expect(() => sanitizeDetails("saas", sample["websites-saas"])).toThrow(/not open/);
    expect(() => sanitizeDetails("instagram-pages", { niche: "Design" })).toThrow(/instagram/i);
    expect(() => sanitizeDetails("gaming-esports", { title: "Casino bets", listingType: "Gaming website" })).toThrow(/gambling/i);
    expect(RETIRED_CATEGORY_SLUGS).toContain("saas");
    expect(CATEGORY_MIGRATION.saas.slug).toBe("websites-saas");
    expect(CATEGORY_MIGRATION.media.slug).toBe("music-entertainment");
    expect(CATEGORY_MIGRATION["developer-tools"]).toBeUndefined();
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
