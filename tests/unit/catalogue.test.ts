import { describe, expect, it } from "vitest";
import { ACTIVE_CATEGORY_SLUGS, CATALOGUE, CATEGORY_MIGRATION, CREATOR_FIELD_SET, RETIRED_CATEGORY_SLUGS, boardQuery, fieldsFor, sanitizeDetails } from "@/config/catalogue";
import { istDayKey, shiftIstDay } from "@/features/leaderboards/engine";
import { readListingImage } from "@/features/listings/media";
import { sha256 } from "@/lib/security/hash";

const youtube = {
  platform: "YouTube",
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

  it("keeps the fields for that lane and drops the rest", () => {
    const clean = sanitizeDetails("youtube", { ...youtube, password: "nope", role: "Player" });
    expect(clean.password).toBeUndefined();
    expect(clean.role).toBeUndefined();
    expect(clean.platform).toBe("YouTube");
    expect(clean.games).toContain("Valorant");
    expect(fieldsFor("clips").some((field) => field.key === "achievements")).toBe(false);
    expect(fieldsFor("esports").some((field) => field.key === "role" && field.required)).toBe(true);
    expect(fieldsFor("streaming").map((field) => field.key)).not.toContain("featuredVideoUrl");
  });

  it("rejects a retired lane, a missing required field, and gambling copy", () => {
    expect(() => sanitizeDetails("youtube-channels", youtube)).toThrow(/not open/);
    expect(() => sanitizeDetails("youtube", { ...youtube, handle: "" })).toThrow(/handle/i);
    expect(() => sanitizeDetails("streaming", { platform: "TikTok", handle: "example", games: "Valorant", languages: "English" })).toThrow(/platform/i);
    expect(() => sanitizeDetails("gaming", { platform: "Twitch", handle: "example", games: "Casino bets", languages: "English" })).toThrow(/gambling/i);
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
