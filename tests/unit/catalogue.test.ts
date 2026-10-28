import { describe, expect, it } from "vitest";
import { ACTIVE_CATEGORY_SLUGS, CATALOGUE, CATEGORY_MIGRATION, CREATOR_FIELD_SET, RETIRED_CATEGORY_SLUGS, boardQuery, fieldsFor, sanitizeDetails } from "@/config/catalogue";
import { istDayKey, shiftIstDay } from "@/features/leaderboards/engine";
import { readListingImage } from "@/features/listings/media";
import { sha256 } from "@/lib/security/hash";

const creator = {
  platform: "YouTube",
  profileUrl: "https://www.youtube.com/@example",
  handle: "example",
  games: "Valorant, League of Legends",
  languages: "English, Hindi",
  featuredVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
};

describe("creator catalogue", () => {
  it("publishes the creator lanes on one shared form", () => {
    expect(CATALOGUE.map((item) => item.slug)).toEqual([...ACTIVE_CATEGORY_SLUGS]);
    expect(new Set(CATALOGUE.map((item) => item.fieldSet))).toEqual(new Set([CREATOR_FIELD_SET]));
  });

  it("keeps submitted creator fields and drops unknown ones", () => {
    const clean = sanitizeDetails(CREATOR_FIELD_SET, { ...creator, password: "nope", rankAmount: "999" });
    expect(clean.password).toBeUndefined();
    expect(clean.rankAmount).toBeUndefined();
    expect(clean.platform).toBe("YouTube");
    expect(clean.games).toContain("Valorant");
    expect(clean.country).toBeUndefined();
    expect(fieldsFor(CREATOR_FIELD_SET).filter((field) => field.required).every((field) => clean[field.key])).toBe(true);
  });

  it("rejects a retired lane, a missing required field, and gambling copy", () => {
    expect(() => sanitizeDetails("youtube-channels", creator)).toThrow(/not open/);
    expect(() => sanitizeDetails(CREATOR_FIELD_SET, { ...creator, profileUrl: "" })).toThrow(/channel or profile/i);
    expect(() => sanitizeDetails(CREATOR_FIELD_SET, { ...creator, games: "Casino bets" })).toThrow(/gambling/i);
    expect(RETIRED_CATEGORY_SLUGS).toContain("youtube-channels");
    expect(CATEGORY_MIGRATION["youtube-channels"].slug).toBe("youtube");
    expect(CATEGORY_MIGRATION.saas.slug).toBe("communities");
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
