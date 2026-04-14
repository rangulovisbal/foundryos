type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function consumeRateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    const next = {
      count: 1,
      resetAt: now + windowMs
    };
    buckets.set(key, next);
    return { success: true, remaining: max - 1, resetAt: next.resetAt };
  }

  if (current.count >= max) {
    return { success: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  buckets.set(key, current);
  return {
    success: true,
    remaining: max - current.count,
    resetAt: current.resetAt
  };
}
