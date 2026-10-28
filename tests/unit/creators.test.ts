import { describe, expect, it } from "vitest";
import { gameName, gameSlugs } from "@/config/games";
import { organicScore } from "@/features/leaderboards/engine";
import { referralHost } from "@/lib/referrals";
import { youtubeId } from "@/lib/youtube";

describe("organic score", () => {
  const now = new Date("2026-10-28T00:00:00.000Z");

  it("adds clicks, a fresh approval, verification, and an avatar", () => {
    expect(organicScore({
      clicks30d: 150,
      ownershipVerified: true,
      approvedAt: "2026-10-20T00:00:00.000Z",
      hasAvatar: true,
      now,
    })).toBe(200 + 30 + 25 + 10);
  });

  it("ignores payment and drops a stale freshness bonus", () => {
    expect(organicScore({
      clicks30d: 1,
      ownershipVerified: false,
      approvedAt: "2026-01-01T00:00:00.000Z",
      hasAvatar: false,
      now,
    })).toBe(2);
  });
});

describe("creator links", () => {
  it("turns a game list into slugs", () => {
    expect(gameSlugs("Valorant, League of Legends")).toEqual(["valorant", "league-of-legends"]);
    expect(gameName("league-of-legends")).toBe("League of Legends");
  });

  it("accepts a public YouTube id and rejects other hosts", () => {
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://twitch.tv/example")).toBeNull();
  });

  it("keeps an external referrer host and drops this site", () => {
    expect(referralHost("https://www.youtube.com/watch?v=secret", "rankpush.lol")).toBe("youtube.com");
    expect(referralHost("https://rankpush.lol/trending", "rankpush.lol")).toBeNull();
    expect(referralHost("https://user:pass@evil.test", "rankpush.lol")).toBeNull();
  });
});
