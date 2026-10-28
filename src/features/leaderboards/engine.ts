/**
 * Daily display uses the Asia/Kolkata calendar date.
 * 2026-10-15T18:29:59.999Z is still 2026-10-15 IST.
 * 2026-10-15T18:30:00.000Z is 2026-10-16 IST.
 * Advertising campaigns use a fixed duration from activation, not this midnight boundary.
 */
export function istDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function shiftIstDay(date: Date, days: number): string {
  const [year, month, day] = istDayKey(date).split("-").map(Number);
  const anchor = new Date(Date.UTC(year, month - 1, day, 6, 30));
  anchor.setUTCDate(anchor.getUTCDate() + days);
  return istDayKey(anchor);
}

/** UTC day key kept for analytics buckets. */
export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Keep these weights identical to get_leaderboard in the creator-platform migration. */
export const ORGANIC_CLICK_POINTS = 2;
export const ORGANIC_CLICK_CAP = 100;
export const ORGANIC_FRESH_POINTS = 30;
export const ORGANIC_FRESH_MS = 14 * 86_400_000;
export const ORGANIC_VERIFIED_POINTS = 25;
export const ORGANIC_AVATAR_POINTS = 10;

export const ORGANIC_RANKING_SUMMARY =
  "Organic order uses a published score: 2 points for each outbound click in the last 30 UTC days, capped at 100 clicks; 30 points if the profile was approved in the last 14 days; 25 points if ownership is verified; 10 points if the profile has an avatar. Equal scores go to the newer approval, then the name. A promotion is a labelled advertisement and is not part of this score.";

export function organicScore(input: {
  clicks30d: number;
  ownershipVerified: boolean;
  approvedAt: string | null;
  hasAvatar: boolean;
  now?: Date;
}): number {
  const clicks = Math.max(0, Math.min(ORGANIC_CLICK_CAP, Math.floor(input.clicks30d)));
  let score = clicks * ORGANIC_CLICK_POINTS;
  if (input.ownershipVerified) score += ORGANIC_VERIFIED_POINTS;
  if (input.hasAvatar) score += ORGANIC_AVATAR_POINTS;
  if (input.approvedAt) {
    const approved = new Date(input.approvedAt).getTime();
    const now = (input.now ?? new Date()).getTime();
    if (Number.isFinite(approved) && now - approved >= 0 && now - approved <= ORGANIC_FRESH_MS) {
      score += ORGANIC_FRESH_POINTS;
    }
  }
  return score;
}
