import type { RedisClientType } from 'redis';

type BroadcastPayload = {
  targetSessionId: string;
  eventName: string;
  payload: any;
};

type BroadcastSubscriber = (data: BroadcastPayload) => void;

interface IBroadcastService {
  publish(data: BroadcastPayload): Promise<void>;

  subscribe(channel: string, handler: BroadcastSubscriber): Promise<void>;

  unsubscribe(channel: string): Promise<void>;

  disconnect(): Promise<void>;
}

/**
 * Redis-backed broadcast service for scalable realtime updates.
 * Supports multi-instance deployments on Vercel/serverless.
 */
class RedisBroadcastService implements IBroadcastService {
  private publisher: RedisClientType | null = null;
  private subscriber: RedisClientType | null = null;
  private subscriptions = new Map<string, BroadcastSubscriber>();

  private getRedisUrl(): string {
    const url = process.env['UPSTASH_REDIS_URL'] || process.env['REDIS_URL'];
    if (!url) {
      throw new Error('UPSTASH_REDIS_URL or REDIS_URL not configured');
    }
    return url;
  }

  private async ensurePublisher(): Promise<RedisClientType> {
    if (!this.publisher) {
      const { createClient } = await import('redis');
      this.publisher = createClient({ url: this.getRedisUrl() });
      await this.publisher.connect();
    }
    return this.publisher;
  }

  private async ensureSubscriber(): Promise<RedisClientType> {
    if (!this.subscriber) {
      const { createClient } = await import('redis');
      this.subscriber = createClient({ url: this.getRedisUrl() });
      await this.subscriber.connect();
    }
    return this.subscriber;
  }

  async publish(data: BroadcastPayload): Promise<void> {
    try {
      const pub = await this.ensurePublisher();
      const channel = `realtime:${data.targetSessionId}`;
      await pub.publish(channel, JSON.stringify(data));
    } catch (error) {
      console.error('[RedisBroadcast] publish error:', error);
      throw error;
    }
  }

  async subscribe(channel: string, handler: BroadcastSubscriber): Promise<void> {
    try {
      const sub = await this.ensureSubscriber();
      this.subscriptions.set(channel, handler);

      await sub.subscribe(channel, (message) => {
        try {
          const data = JSON.parse(message) as BroadcastPayload;
          handler(data);
        } catch (error) {
          console.error('[RedisBroadcast] message parse error:', error);
        }
      });
    } catch (error) {
      console.error('[RedisBroadcast] subscribe error:', error);
      throw error;
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      const sub = await this.ensureSubscriber();
      await sub.unsubscribe(channel);
      this.subscriptions.delete(channel);
    } catch (error) {
      console.error('[RedisBroadcast] unsubscribe error:', error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      const publisher = this.publisher;
      const subscriber = this.subscriber;

      this.publisher = null;
      this.subscriber = null;
      this.subscriptions.clear();

      if (subscriber) {
        try {
          await subscriber.quit();
        } catch {
          await subscriber.disconnect();
        }
      }

      if (publisher) {
        try {
          await publisher.quit();
        } catch {
          await publisher.disconnect();
        }
      }
    } catch (error) {
      console.error('[RedisBroadcast] disconnect error:', error);
    }
  }
}

/**
 * Local-only fallback for dev/testing without Redis.
 */
class LocalBroadcastService implements IBroadcastService {
  private subscriptions = new Map<string, BroadcastSubscriber[]>();

  async publish(data: BroadcastPayload): Promise<void> {
    const channel = `realtime:${data.targetSessionId}`;
    const handlers = this.subscriptions.get(channel) || [];
    handlers.forEach((h) => h(data));
  }

  async subscribe(channel: string, handler: BroadcastSubscriber): Promise<void> {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, []);
    }
    this.subscriptions.get(channel)!.push(handler);
  }

  async unsubscribe(channel: string): Promise<void> {
    this.subscriptions.delete(channel);
  }

  async disconnect(): Promise<void> {
    this.subscriptions.clear();
  }
}

/**
 * Factory to create appropriate broadcast service.
 */
function createBroadcastService(): IBroadcastService {
  const useRedis = process.env['UPSTASH_REDIS_URL'] || process.env['REDIS_URL'];
  return useRedis ? new RedisBroadcastService() : new LocalBroadcastService();
}

function registerBroadcastCleanup(service: IBroadcastService): void {
  const globalKey = '__realtimeBroadcastCleanupRegistered__';
  const state = globalThis as typeof globalThis & Record<string, boolean | undefined>;

  if (state[globalKey]) {
    return;
  }

  state[globalKey] = true;

  const cleanup = () => {
    void service.disconnect();
  };

  process.once('beforeExit', cleanup);
  process.once('SIGINT', cleanup);
  process.once('SIGTERM', cleanup);
}

export const broadcastService = createBroadcastService();
registerBroadcastCleanup(broadcastService);
export type { IBroadcastService, BroadcastPayload };
