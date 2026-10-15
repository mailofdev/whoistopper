interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const existing = buckets.get(key)?.timestamps ?? [];
  const fresh = existing.filter((timestamp) => now - timestamp < windowMs);
  if (fresh.length >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((fresh[0] + windowMs - now) / 1000));
    buckets.set(key, { timestamps: fresh });
    return { ok: false, retryAfterSeconds };
  }
  fresh.push(now);
  buckets.set(key, { timestamps: fresh });
  return { ok: true };
}

export function resetRateLimits(): void {
  buckets.clear();
}

/** In-memory limiter. It protects a single server instance and resets on restart. */
export function rateLimitNote(): string {
  return "Rate limits are stored in process memory. Use a shared store before running more than one instance.";
}
