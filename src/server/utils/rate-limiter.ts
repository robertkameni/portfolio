import { randomBytes } from 'node:crypto';
import type { RedisClientType } from 'redis';
import { readPositiveIntFromEnv } from './env.util';

function createLeaseToken(): string {
  return `${Date.now()}:${randomBytes(16).toString('hex')}`;
}

type RateLimitDecision = {
  allowed: boolean;
  retryAfterMs?: number;
};

type Lease = {
  acquired: boolean;
  release: () => Promise<void>;
};

export interface RateLimiter {
  checkRateLimit(namespace: string, key: string, options: { maxRequests: number; windowMs: number }): Promise<RateLimitDecision>;
  acquireLease(namespace: string, key: string, ttlMs: number): Promise<Lease>;
  consumeOnce(namespace: string, key: string, value: string): Promise<boolean>;
  setIfAbsent(namespace: string, key: string, value: string, ttlMs: number): Promise<boolean>;
}

type RedisWindowKey = `${string}:${string}`;

const GLOBAL_RATE_LIMITER_KEY = '__rateLimiterCleanupRegistered__';

function getRedisUrl(): string | undefined {
  const rawUrl = process.env['UPSTASH_REDIS_URL'] || process.env['REDIS_URL'];
  const normalizedUrl = rawUrl?.trim();
  return normalizedUrl || undefined;
}

function assertProductionRedisConfigured(): void {
  if (process.env['NODE_ENV'] !== 'production') {
    return;
  }

  if (getRedisUrl()) {
    return;
  }

  throw new Error(
    '[RateLimiter] UPSTASH_REDIS_URL or REDIS_URL is required in production. ' +
      'In-memory rate limiting is not safe on serverless (limits are per-instance). ' +
      'Set UPSTASH_REDIS_URL in your environment.',
  );
}

function registerRateLimiterCleanup(cleanup: () => Promise<void>): void {
  const globalState = globalThis as typeof globalThis & Record<string, boolean | undefined>;
  if (globalState[GLOBAL_RATE_LIMITER_KEY]) {
    return;
  }

  globalState[GLOBAL_RATE_LIMITER_KEY] = true;

  const doCleanup = () => {
    void cleanup();
  };

  process.once('beforeExit', doCleanup);
  process.once('SIGINT', doCleanup);
  process.once('SIGTERM', doCleanup);
}

class InMemoryRateLimiter implements RateLimiter {
  private buckets = new Map<string, number[]>();
  private leases = new Map<string, { token: string; expiresAt: number }>();
  private singleUse = new Map<string, { value: string; expiresAt: number }>();

  async checkRateLimit(namespace: string, key: string, options: { maxRequests: number; windowMs: number }): Promise<RateLimitDecision> {
    const now = Date.now();
    const bucket = `${namespace}:${key}`;
    const cutoff = now - options.windowMs;
    const window = this.buckets.get(bucket) ?? [];
    const validWindow = window.filter((timestamp) => timestamp >= cutoff);

    this.cleanupExpiredBuckets(now);

    if (validWindow.length >= options.maxRequests) {
      this.buckets.set(bucket, validWindow);
      return { allowed: false, retryAfterMs: Math.max(0, validWindow[0] + options.windowMs - now) };
    }

    validWindow.push(now);
    this.buckets.set(bucket, validWindow);
    return { allowed: true };
  }

  async acquireLease(namespace: string, key: string, ttlMs: number): Promise<Lease> {
    const now = Date.now();
    const lockKey = `${namespace}:${key}`;
    const existing = this.leases.get(lockKey);
    this.cleanupExpiredLeases(now);

    if (existing && existing.expiresAt > now) {
      return {
        acquired: false,
        release: async () => {},
      };
    }

    const token = createLeaseToken();
    this.leases.set(lockKey, {
      token,
      expiresAt: now + ttlMs,
    });

    return {
      acquired: true,
      release: async () => {
        const current = this.leases.get(lockKey);
        if (current?.token === token) {
          this.leases.delete(lockKey);
        }
      },
    };
  }

  async consumeOnce(namespace: string, key: string, value: string): Promise<boolean> {
    const now = Date.now();
    const mapKey = `${namespace}:${key}`;
    const current = this.singleUse.get(mapKey);
    this.cleanupExpiredSingleUse(now);
    if (!current || current.expiresAt <= now || current.value !== value) {
      this.singleUse.delete(mapKey);
      return false;
    }

    this.singleUse.delete(mapKey);
    return true;
  }

  async setIfAbsent(namespace: string, key: string, value: string, ttlMs: number): Promise<boolean> {
    const now = Date.now();
    const mapKey = `${namespace}:${key}`;
    const current = this.singleUse.get(mapKey);
    if (current && current.expiresAt > now) {
      return false;
    }

    this.cleanupExpiredSingleUse(now);
    this.singleUse.set(mapKey, { value, expiresAt: now + ttlMs });
    return true;
  }

  private cleanupExpiredBuckets(now: number): void {
    for (const [key, timestamps] of this.buckets.entries()) {
      const updated = timestamps.filter((timestamp) => timestamp >= now - 24 * 60 * 60 * 1000);
      if (updated.length === 0) {
        this.buckets.delete(key);
      } else {
        this.buckets.set(key, updated);
      }
    }
  }

  private cleanupExpiredLeases(now: number): void {
    for (const [key, lease] of this.leases.entries()) {
      if (lease.expiresAt <= now) {
        this.leases.delete(key);
      }
    }
  }

  private cleanupExpiredSingleUse(now: number): void {
    for (const [key, storedValue] of this.singleUse.entries()) {
      if (storedValue.expiresAt <= now) {
        this.singleUse.delete(key);
      }
    }
  }
}

class RedisRateLimiter implements RateLimiter {
  private client: RedisClientType | null = null;

  private async getClient(): Promise<RedisClientType> {
    if (!this.client) {
      const { createClient } = await import('redis');
      const redisUrl = getRedisUrl();
      if (!redisUrl) {
        throw new Error('UPSTASH_REDIS_URL or REDIS_URL is required for redis rate limiter.');
      }

      const connectTimeout = readPositiveIntFromEnv('AI_REDIS_CONNECT_TIMEOUT_MS', 5000, 500);

      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout,
          reconnectStrategy: false,
        },
      });
      await this.client.connect();
      registerRateLimiterCleanup(async () => {
        if (!this.client) {
          return;
        }
        const client = this.client;
        this.client = null;
        await client.quit();
      });
    }

    return this.client;
  }

  async checkRateLimit(namespace: string, key: string, options: { maxRequests: number; windowMs: number }): Promise<RateLimitDecision> {
    const client = await this.getClient();
    const now = Date.now();
    const bucketStart = Math.floor(now / options.windowMs);
    const redisKey = this.formatKey(namespace, `${key}:${bucketStart}`) as RedisWindowKey;
    const count = Number(await client.incr(redisKey));

    if (count === 1) {
      await client.expire(redisKey, Math.ceil(options.windowMs / 1000));
    }

    const allowed = count <= options.maxRequests;
    if (allowed) {
      return { allowed: true };
    }

    const windowEnd = (bucketStart + 1) * options.windowMs;
    return { allowed: false, retryAfterMs: Math.max(0, windowEnd - now) };
  }

  async acquireLease(namespace: string, key: string, ttlMs: number): Promise<Lease> {
    const client = await this.getClient();
    const leaseKey = this.formatKey(namespace, key);
    const token = createLeaseToken();
    const result = await client.set(leaseKey, token, { PX: ttlMs, NX: true });

    if (!result) {
      return { acquired: false, release: async () => {} };
    }

    return {
      acquired: true,
      release: async () => {
        const activeToken = await client.get(leaseKey);
        if (activeToken === token) {
          await client.del(leaseKey);
        }
      },
    };
  }

  async consumeOnce(namespace: string, key: string, value: string): Promise<boolean> {
    const client = await this.getClient();
    const challengeKey = this.formatKey(namespace, key);
    const storedValue = await client.get(challengeKey);

    if (!storedValue || storedValue !== value) {
      return false;
    }

    await client.del(challengeKey);
    return true;
  }

  async setIfAbsent(namespace: string, key: string, value: string, ttlMs: number): Promise<boolean> {
    const client = await this.getClient();
    const challengeKey = this.formatKey(namespace, key);
    const result = await client.set(challengeKey, value, { PX: ttlMs, NX: true });
    return result === 'OK';
  }

  private formatKey(namespace: string, key: string): string {
    return `rl:${namespace}:${key}`;
  }
}

function createRateLimiter(): RateLimiter {
  assertProductionRedisConfigured();

  const useRedis = Boolean(getRedisUrl());
  if (!useRedis) {
    return new InMemoryRateLimiter();
  }

  const redisLimiter = new RedisRateLimiter();
  const fallback = new InMemoryRateLimiter();
  let redisHealthy = true;

  const rateLimitOpTimeoutMs = readPositiveIntFromEnv('AI_RATE_LIMIT_OP_TIMEOUT_MS', 5000, 500);

  const withRedisTimeout = <T>(promise: Promise<T>): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(`Redis rate limit operation exceeded ${rateLimitOpTimeoutMs}ms`)), rateLimitOpTimeoutMs);
      }),
    ]);
  };

  return {
    checkRateLimit: (namespace, key, options) =>
      (redisHealthy
        ? withRedisTimeout(executeRateLimitCheck(redisHealthy, redisLimiter, fallback, namespace, key, options))
        : fallback.checkRateLimit(namespace, key, options)
      ).catch((error) => {
        console.error('[RateLimiter] Redis rate limit failed. Falling back to in-memory:', error);
        redisHealthy = false;
        return fallback.checkRateLimit(namespace, key, options);
      }),
    acquireLease: (namespace, key, ttlMs) =>
      executeRateLimitedOperation(redisHealthy, redisLimiter, fallback, (target) => target.acquireLease(namespace, key, ttlMs)).catch((error) => {
        console.error('[RateLimiter] Redis lease operation failed. Falling back to in-memory:', error);
        redisHealthy = false;
        return fallback.acquireLease(namespace, key, ttlMs);
      }),
    consumeOnce: (namespace, key, value) =>
      executeRateLimitedOperation(redisHealthy, redisLimiter, fallback, (target) => target.consumeOnce(namespace, key, value)).catch((error) => {
        console.error('[RateLimiter] Redis consumeOnce operation failed. Falling back to in-memory:', error);
        redisHealthy = false;
        return fallback.consumeOnce(namespace, key, value);
      }),
    setIfAbsent: (namespace, key, value, ttlMs) =>
      executeRateLimitedOperation(redisHealthy, redisLimiter, fallback, (target) => target.setIfAbsent(namespace, key, value, ttlMs)).catch((error) => {
        console.error('[RateLimiter] Redis setIfAbsent operation failed. Falling back to in-memory:', error);
        redisHealthy = false;
        return fallback.setIfAbsent(namespace, key, value, ttlMs);
      }),
  };
}

export const rateLimiter = createRateLimiter();

async function executeRateLimitCheck(
  redisHealthy: boolean,
  redisLimiter: RedisRateLimiter,
  fallbackLimiter: InMemoryRateLimiter,
  namespace: string,
  key: string,
  options: { maxRequests: number; windowMs: number },
): Promise<RateLimitDecision> {
  if (!redisHealthy) {
    return fallbackLimiter.checkRateLimit(namespace, key, options);
  }

  try {
    return await redisLimiter.checkRateLimit(namespace, key, options);
  } catch (error) {
    throw error;
  }
}

async function executeRateLimitedOperation<T>(
  redisHealthy: boolean,
  redisLimiter: RedisRateLimiter,
  fallbackLimiter: InMemoryRateLimiter,
  callback: (limiter: RateLimiter) => Promise<T>,
): Promise<T> {
  if (!redisHealthy) {
    return callback(fallbackLimiter);
  }

  try {
    return await callback(redisLimiter);
  } catch (error) {
    throw error;
  }
}
