export const site = {
  name: "Who's Topper",
  shortName: "Topper",
  description:
    "India's transparent product leaderboard. Discover startups, tools, and websites, or pay in INR for a clearly labelled ranking position.",
  locale: "en-IN",
  themeColor: "#4F46E5",
  backgroundColor: "#F8FAFC",
} as const;

export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return configured || "http://localhost:3000";
}
