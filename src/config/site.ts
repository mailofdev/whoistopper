export const site = {
  id: "rankpush",
  name: "RankPush",
  shortName: "RankPush",
  domain: "rankpush.lol",
  description:
    "Public leaderboard for digital presence, lifestyle, achievements, and creative work. A paid rank is a verified INR bid, labelled as paid placement.",
  locale: "en-IN",
  themeColor: "#D4145A",
  backgroundColor: "#FAF7F5",
  verificationFile: "rankpush.txt",
} as const;

export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") return "https://rankpush.lol";
  return "http://localhost:3000";
}
