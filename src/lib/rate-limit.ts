import "server-only";

import { createHash, createHmac } from "node:crypto";

import { lt, sql } from "drizzle-orm";

import { requireDb } from "@/db/client";
import { rateLimitHits } from "@/db/schema";
import { getClientIp } from "@/lib/http";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const cleanupState = new Map<string, number>();

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

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterSec: number;
};

function normalizeWindowStart(now: number, windowSec: number) {
  return new Date(Math.floor(now / (windowSec * 1000)) * windowSec * 1000);
}

function hashBucket(key: string) {
  const appSecret = process.env.APP_SECRET?.trim();

  if (appSecret) {
    return createHmac("sha256", appSecret).update(key).digest("hex");
  }

  return createHash("sha256").update(key).digest("hex");
}

function fallbackRateLimit(
  key: string,
  limit: number,
  windowSec: number
): RateLimitResult {
  const result = consumeRateLimit(`fallback:${key}`, {
    max: limit,
    windowMs: windowSec * 1000
  });
  const resetAt = new Date(result.resetAt);

  return {
    ok: result.success,
    remaining: result.remaining,
    resetAt,
    retryAfterSec: Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
  };
}

async function maybeCleanupExpiredRows(windowSec: number) {
  const cleanupKey = String(windowSec);
  const now = Date.now();
  const lastCleanup = cleanupState.get(cleanupKey) ?? 0;

  if (now - lastCleanup < windowSec * 1000) {
    return;
  }

  cleanupState.set(cleanupKey, now);
  const db = await requireDb("rate limit cleanup");
  const cutoff = new Date(now - windowSec * 4000);
  await db.delete(rateLimitHits).where(lt(rateLimitHits.windowStart, cutoff));
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = normalizeWindowStart(now, windowSec);
  const resetAt = new Date(windowStart.getTime() + windowSec * 1000);

  try {
    const db = await requireDb("rate limiting");
    const bucket = hashBucket(key);
    const rows = await db
      .insert(rateLimitHits)
      .values({
        bucket,
        windowStart,
        count: 1
      })
      .onConflictDoUpdate({
        target: [rateLimitHits.bucket, rateLimitHits.windowStart],
        set: {
          count: sql`${rateLimitHits.count} + 1`
        }
      })
      .returning();

    void maybeCleanupExpiredRows(windowSec).catch(() => undefined);

    const count = rows[0]?.count ?? limit + 1;
    const remaining = Math.max(0, limit - count);

    return {
      ok: count <= limit,
      remaining,
      resetAt,
      retryAfterSec: Math.max(1, Math.ceil((resetAt.getTime() - now) / 1000))
    };
  } catch {
    return fallbackRateLimit(key, limit, windowSec);
  }
}

export function clientIp(request: Request) {
  return getClientIp(request);
}
