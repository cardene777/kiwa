import type { MemcachedTestEnv } from '@kiwa-lab/cache';

/**
 * A small session-cache pipeline stitched together so the PoC proves the
 * `get / set / add / replace / increment / decrement / delete / flush` loop
 * end-to-end without booting a real Memcached container.
 *
 * The pipeline models a per-user session token cache — each session has a
 * TTL, incoming pageview events increment a per-session counter, and the
 * assertion helpers verify the observed cache state.
 */
export interface SessionState {
  userId: string;
  token: string;
  pageviews: number;
}

/**
 * Create a fresh session cache backed by the supplied env. `ttlSeconds`
 * controls how long each session token stays valid.
 */
export function createSessionCache(env: MemcachedTestEnv, ttlSeconds: number) {
  const keyFor = (userId: string) => `session:${userId}`;
  const countKeyFor = (userId: string) => `session:${userId}:pageviews`;
  return {
    async register(userId: string, token: string): Promise<boolean> {
      // add() returns false if the session already exists — mirrors a
      // production login handler that rejects concurrent logins.
      const ok = await env.add(keyFor(userId), token, { ttlSeconds });
      if (ok) await env.set(countKeyFor(userId), '0', { ttlSeconds });
      return ok;
    },
    async fetch(userId: string): Promise<SessionState | null> {
      const token = await env.get(keyFor(userId));
      if (!token) return null;
      const raw = await env.get(countKeyFor(userId));
      const pageviews = raw === null ? 0 : Number.parseInt(raw, 10);
      return { userId, token, pageviews };
    },
    async rotate(userId: string, token: string): Promise<boolean> {
      // replace() only succeeds if the session already exists — mirrors a
      // production token rotation that refuses to create sessions on the fly.
      return env.replace(keyFor(userId), token, { ttlSeconds });
    },
    async recordPageview(userId: string): Promise<number | null> {
      return env.increment(countKeyFor(userId));
    },
    async logout(userId: string): Promise<boolean> {
      // Delete both keys — Memcached has no scan, so the session-cache owns
      // the composite key naming.
      const tokenDeleted = await env.delete(keyFor(userId));
      await env.delete(countKeyFor(userId));
      return tokenDeleted;
    },
    async flushAll(): Promise<void> {
      await env.flush();
    },
  };
}
