import type { KeyDBTestEnv } from '@kiwa-test/cache';

/**
 * A small multi-region rate-limit cache stitched together so the PoC proves
 * the multi-master replication + Pub/Sub loop end-to-end without booting a
 * real KeyDB cluster.
 *
 * The pipeline models a geo-distributed API rate limiter — each region has
 * its own KeyDB master, requests bump a per-region counter, and cross-region
 * cache invalidations flow through Pub/Sub.
 */
export interface RegionCacheOptions {
  region: string;
  ttlSeconds: number;
}

export function createRegionCache(env: KeyDBTestEnv, opts: RegionCacheOptions) {
  const keyFor = (userId: string) => `rate:${userId}`;
  const invalidationChannel = 'cache-invalidate';
  return {
    async bump(userId: string): Promise<number> {
      const key = keyFor(userId);
      const existing = await env.get(key, { master: opts.region });
      const next = existing === null ? 1 : Number.parseInt(existing, 10) + 1;
      await env.set(key, String(next), {
        ttlSeconds: opts.ttlSeconds,
        master: opts.region,
      });
      return next;
    },
    async count(userId: string): Promise<number> {
      const raw = await env.get(keyFor(userId), { master: opts.region });
      if (raw === null) return 0;
      return Number.parseInt(raw, 10);
    },
    async broadcastInvalidate(userId: string): Promise<number> {
      const key = keyFor(userId);
      await env.delete(key);
      return env.publish(invalidationChannel, key, { master: opts.region });
    },
    async watchInvalidations(handler: (key: string, master: string) => void) {
      const sub = await env.subscribe(invalidationChannel);
      let stopped = false;
      const loop = (async () => {
        while (!stopped) {
          try {
            const msg = await sub.next({ timeoutMs: 100 });
            handler(msg.message, msg.master);
          } catch {
            // timeout — check `stopped` and continue
          }
        }
      })();
      return {
        stop: async () => {
          stopped = true;
          await sub.close();
          await loop;
        },
      };
    },
  };
}
