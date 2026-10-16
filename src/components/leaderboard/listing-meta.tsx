import type { LeaderboardEntry } from "@/types/domain";

export function listingHost(entry: Pick<LeaderboardEntry, "websiteUrl" | "name">): string {
  if (!entry.websiteUrl) return "";
  try {
    return new URL(entry.websiteUrl).hostname.replace(/^www\./, "");
  } catch {
    return entry.name;
  }
}

export function listingWhen(entry: Pick<LeaderboardEntry, "confirmedAt" | "approvedAt">): string {
  const iso = entry.confirmedAt ?? entry.approvedAt;
  if (!iso) return "";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.round(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export function ListingMark({ name, logoUrl, compact = false }: { name: string; logoUrl: string | null; compact?: boolean }) {
  const size = compact ? "h-8 w-8 rounded-xl text-xs" : "h-11 w-11 rounded-2xl text-sm";
  const logo = logoUrl?.startsWith("https://") ? logoUrl : "";
  if (logo) {
    return <span aria-hidden="true" className={`${size} shrink-0 bg-muted bg-cover bg-center`} style={{ backgroundImage: `url(${JSON.stringify(logo)})` }} />;
  }
  const letters = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "RP";
  return (
    <span className={`grid ${size} shrink-0 place-items-center bg-brand font-semibold text-on-brand`} aria-hidden="true">
      {letters}
    </span>
  );
}
