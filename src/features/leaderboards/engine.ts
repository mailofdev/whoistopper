export const DEFAULT_RANKING_RULES = {
  minimumBidPaise: 9_900,
  minimumIncrementPaise: 1_000,
  maxBidPaise: 100_000_000,
} as const;

export interface RankingRules {
  minimumBidPaise: number;
  minimumIncrementPaise: number;
  maxBidPaise: number;
}

export interface Placement {
  id: string;
  productId: string;
  amountPaise: number;
  confirmedAt: string;
}

export interface RankedPlacement extends Placement {
  rank: number;
}

/**
 * Daily leaderboards use the Asia/Kolkata calendar date.
 * 2026-10-15T18:29:59.999Z is still 2026-10-15 IST.
 * 2026-10-15T18:30:00.000Z is 2026-10-16 IST.
 * Yesterday's rows stay in history and are excluded by scope key, not deleted.
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

/** UTC day key kept for analytics buckets. Ranking boards use istDayKey. */
export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function comparePlacements(a: Placement, b: Placement): number {
  if (a.amountPaise !== b.amountPaise) return b.amountPaise - a.amountPaise;
  if (a.confirmedAt !== b.confirmedAt) return a.confirmedAt < b.confirmedAt ? -1 : 1;
  if (a.productId !== b.productId) return a.productId < b.productId ? -1 : 1;
  return 0;
}

export function assignRanks(placements: Placement[]): RankedPlacement[] {
  return [...placements].sort(comparePlacements).map((placement, index) => ({
    ...placement,
    rank: index + 1,
  }));
}

export function minimumAmountForTarget(input: {
  placements: Placement[];
  bidderProductId: string;
  rules: RankingRules;
}): number {
  const own = input.placements.find((placement) => placement.productId === input.bidderProductId);
  if (!own) return input.rules.minimumBidPaise;
  return Math.max(input.rules.minimumBidPaise, own.amountPaise + input.rules.minimumIncrementPaise);
}

export function previewRank(input: {
  placements: Placement[];
  bidderProductId: string;
  amountPaise: number;
  confirmedAt: string;
}): number {
  const next = upsertPlacement(input.placements, {
    id: input.placements.find((placement) => placement.productId === input.bidderProductId)?.id ?? "preview",
    productId: input.bidderProductId,
    amountPaise: input.amountPaise,
    confirmedAt: input.confirmedAt,
  });
  const ranked = assignRanks(next).find((placement) => placement.productId === input.bidderProductId);
  return ranked?.rank ?? next.length;
}

export function applyVerifiedBid(input: {
  placements: Placement[];
  bid: Placement;
  rules: RankingRules;
}): { placements: RankedPlacement[]; rank: number; applied: boolean } {
  if (!Number.isInteger(input.bid.amountPaise)) {
    throw new Error("Bid amount must be an integer number of paise.");
  }
  if (input.bid.amountPaise > input.rules.maxBidPaise) {
    throw new Error("Bid amount exceeds the platform maximum.");
  }
  const floor = minimumAmountForTarget({
    placements: input.placements,
    bidderProductId: input.bid.productId,
    rules: input.rules,
  });
  if (input.bid.amountPaise < floor) {
    throw new Error("Bid amount is below the minimum for this listing.");
  }
  const existing = input.placements.find((placement) => placement.productId === input.bid.productId);
  if (existing && existing.amountPaise >= input.bid.amountPaise) {
    return { placements: assignRanks(input.placements), rank: assignRanks(input.placements).find((item) => item.productId === input.bid.productId)?.rank ?? 0, applied: false };
  }
  const ranked = assignRanks(upsertPlacement(input.placements, input.bid));
  const rank = ranked.find((placement) => placement.productId === input.bid.productId)?.rank ?? ranked.length;
  return { placements: ranked, rank, applied: true };
}

function upsertPlacement(placements: Placement[], bid: Placement): Placement[] {
  const index = placements.findIndex((placement) => placement.productId === bid.productId);
  if (index === -1) return [...placements, bid];
  const copy = placements.slice();
  copy[index] = { ...copy[index], amountPaise: bid.amountPaise, confirmedAt: bid.confirmedAt };
  return copy;
}

const scopeQueues = new Map<string, Promise<unknown>>();

/** Serialises ranking writes for one scope inside this process. Postgres uses an advisory lock. */
export async function withScopeLock<T>(scopeKey: string, task: () => Promise<T>): Promise<T> {
  const previous = scopeQueues.get(scopeKey) ?? Promise.resolve();
  const run = previous.then(task, task);
  scopeQueues.set(
    scopeKey,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );
  return run;
}
