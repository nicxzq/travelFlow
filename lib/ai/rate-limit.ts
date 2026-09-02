type Bucket = { tokens: number; updatedAt: number };

const CAPACITY = 6;
const REFILL_INTERVAL_MS = 60_000;
const MAX_TRACKED_KEYS = 5_000;
const buckets = new Map<string, Bucket>();

/** Keys come from a spoofable header, so the map is swept rather than trusted to stay small. */
function evictStale(now: number) {
  if (buckets.size < MAX_TRACKED_KEYS) return;

  buckets.forEach((bucket, key) => {
    if (now - bucket.updatedAt >= REFILL_INTERVAL_MS) buckets.delete(key);
  });

  if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
}

/** Per-instance on serverless: a burst guard, not a global quota. */
export function takeRateLimitToken(key: string, now = Date.now()): boolean {
  evictStale(now);

  const bucket = buckets.get(key);
  if (!bucket) {
    buckets.set(key, { tokens: CAPACITY - 1, updatedAt: now });
    return true;
  }

  const windows = Math.floor((now - bucket.updatedAt) / REFILL_INTERVAL_MS);
  const tokens = windows > 0 ? Math.min(CAPACITY, bucket.tokens + windows * CAPACITY) : bucket.tokens;
  const updatedAt = bucket.updatedAt + windows * REFILL_INTERVAL_MS;

  if (tokens <= 0) {
    buckets.set(key, { tokens, updatedAt });
    return false;
  }

  buckets.set(key, { tokens: tokens - 1, updatedAt });
  return true;
}
