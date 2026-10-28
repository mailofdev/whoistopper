export const site = {
  id: "rankpush",
  name: "RankPush",
  shortName: "RankPush",
  domain: "rankpush.lol",
  description:
    "Public profiles for YouTubers, streamers, and gamers. Launch a free profile, get discovered by game and lane, and promote it with a labelled fixed-price advertisement. An advertisement is not a rating or an endorsement.",
  locale: "en-IN",
  themeColor: "#0c0d10",
  backgroundColor: "#0c0d10",
  verificationFile: "rankpush.txt",
} as const;

export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") return "https://rankpush.lol";
  return "http://localhost:3000";
}
