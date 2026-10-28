import { slugify } from "@/lib/urls";

export const GAMES = [
  { slug: "valorant", name: "Valorant" },
  { slug: "league-of-legends", name: "League of Legends" },
  { slug: "counter-strike-2", name: "Counter-Strike 2" },
  { slug: "fortnite", name: "Fortnite" },
  { slug: "minecraft", name: "Minecraft" },
  { slug: "apex-legends", name: "Apex Legends" },
  { slug: "call-of-duty", name: "Call of Duty" },
  { slug: "rocket-league", name: "Rocket League" },
  { slug: "overwatch", name: "Overwatch" },
  { slug: "gta", name: "GTA" },
  { slug: "roblox", name: "Roblox" },
  { slug: "dota-2", name: "Dota 2" },
  { slug: "pubg", name: "PUBG" },
  { slug: "marvel-rivals", name: "Marvel Rivals" },
  { slug: "ea-fc", name: "EA FC" },
] as const;

export function gameSlugs(value: string | undefined): string[] {
  if (!value) return [];
  const slugs = value.split(/[,/|]/).map((part) => slugify(part.trim())).filter((slug) => slug && slug !== "product");
  return [...new Set(slugs)].slice(0, 8);
}

export function gameName(slug: string): string {
  return GAMES.find((game) => game.slug === slug)?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
