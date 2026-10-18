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
