import type { AdPlacement } from "@/config/packages";

export interface CampaignWindow {
  startsAt: string;
  endsAt: string;
}

/** Duration is a fixed length from activation, not a midnight reset. */
export function campaignWindow(start: Date, durationHours: number): CampaignWindow {
  if (!Number.isInteger(durationHours) || durationHours <= 0) {
    throw new Error("Campaign duration must be a positive number of hours.");
  }
  const startsAt = new Date(start);
  const endsAt = new Date(startsAt.getTime() + durationHours * 3_600_000);
  return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
}

export function formatIstDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  }).format(new Date(iso));
}

export function isAdvertisementVisible(
  input: { status: string; startsAt: string | null; endsAt: string | null },
  now: Date,
): boolean {
  if (input.status !== "active" || !input.startsAt || !input.endsAt) return false;
  const time = now.getTime();
  return new Date(input.startsAt).getTime() <= time && time < new Date(input.endsAt).getTime();
}

export interface ScheduledAd {
  productId: string;
  startsAt: string;
  placement: AdPlacement;
  pricePaise?: number;
}

/** Shared placements keep start-time order. Price is not a sort key. */
export function scheduleSharedPlacement<T extends ScheduledAd>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.startsAt !== b.startsAt) return a.startsAt < b.startsAt ? -1 : 1;
    return a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0;
  });
}

export interface OrganicRow {
  id: string;
  name: string;
  approvedAt: string | null;
  organicScore?: number;
}

/** Higher organic score first. Equal scores use newer approval, then name. Payment is ignored. */
export function orderOrganic<T extends OrganicRow>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const score = (b.organicScore ?? 0) - (a.organicScore ?? 0);
    if (score !== 0) return score;
    const left = a.approvedAt ?? "";
    const right = b.approvedAt ?? "";
    if (left !== right) return left < right ? 1 : -1;
    const name = a.name.localeCompare(b.name, "en");
    if (name !== 0) return name;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}
