import { afterEach, describe, expect, it } from 'vitest';
import { setupKeyDBEnv, type KeyDBTestEnv } from '@kiwa-lab/cache';
import { createRegionCache } from '../src/multi-region-cache.js';

const envs: KeyDBTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function makeEnv(): Promise<KeyDBTestEnv> {
  const env = await setupKeyDBEnv({
    cluster: ['us-east', 'us-west', 'eu-central'],
  });
  envs.push(env);
  return env;
}

describe('KeyDB PoC — multi-region rate limiter', () => {
  it('T-KDB-POC-001 bump increments the per-user counter on the local master', async () => {
    const env = await makeEnv();
    const east = createRegionCache(env, { region: 'us-east', ttlSeconds: 60 });
    expect(await east.bump('u-1')).toBe(1);
    expect(await east.bump('u-1')).toBe(2);
    expect(await east.count('u-1')).toBe(2);
  });

  it('T-KDB-POC-002 counters replicate across regions (synchronous)', async () => {
    const env = await makeEnv();
    const east = createRegionCache(env, { region: 'us-east', ttlSeconds: 60 });
    const west = createRegionCache(env, { region: 'us-west', ttlSeconds: 60 });
    await east.bump('u-1');
    await east.bump('u-1');
    // Synchronous replication (default) — west sees the counter value immediately.
    expect(await west.count('u-1')).toBe(2);
  });

  it('T-KDB-POC-003 broadcastInvalidate removes the key and publishes a signal', async () => {
    const env = await makeEnv();
    const east = createRegionCache(env, { region: 'us-east', ttlSeconds: 60 });
    const eu = createRegionCache(env, { region: 'eu-central', ttlSeconds: 60 });
    await east.bump('u-1');
    // Listen for invalidation before publishing.
    const seen: Array<{ key: string; master: string }> = [];
    const watcher = await eu.watchInvalidations((key, master) => {
      seen.push({ key, master });
    });
    await east.broadcastInvalidate('u-1');
    // Wait for the invalidation to reach the watcher.
    await new Promise((r) => setTimeout(r, 60));
    await watcher.stop();
    expect(seen).toEqual([{ key: 'rate:u-1', master: 'us-east' }]);
    expect(await eu.count('u-1')).toBe(0);
  });

  it('T-KDB-POC-004 TTL applies uniformly across replicated masters', async () => {
    const env = await makeEnv();
    const east = createRegionCache(env, { region: 'us-east', ttlSeconds: 60 });
    const west = createRegionCache(env, { region: 'us-west', ttlSeconds: 60 });
    await east.bump('u-1');
    const eastTtl = await env.ttl('rate:u-1');
    expect(eastTtl).toBeGreaterThanOrEqual(59);
    expect(eastTtl).toBeLessThanOrEqual(60);
    expect(await west.count('u-1')).toBe(1);
  });
});

describe('KeyDB PoC — replication timing', () => {
  it('T-KDB-POC-005 with replication lag, west sees write later than east', async () => {
    const env = await setupKeyDBEnv({
      cluster: ['us-east', 'us-west'],
      stub: { replicationLagMs: 50 },
    });
    envs.push(env);
    const east = createRegionCache(env, { region: 'us-east', ttlSeconds: 60 });
    const west = createRegionCache(env, { region: 'us-west', ttlSeconds: 60 });
    await east.bump('u-1');
    // west still lagging.
    expect(await west.count('u-1')).toBe(0);
    await new Promise((r) => setTimeout(r, 80));
    // west catches up.
    expect(await west.count('u-1')).toBe(1);
  });

  it('T-KDB-POC-006 concurrent bumps from different masters both settle', async () => {
    const env = await makeEnv();
    const east = createRegionCache(env, { region: 'us-east', ttlSeconds: 60 });
    const west = createRegionCache(env, { region: 'us-west', ttlSeconds: 60 });
    // Concurrent bumps on the same key from different masters. Eventual
    // consistency means both writes settle; the last one wins.
    await Promise.all([east.bump('u-1'), west.bump('u-1')]);
    // Both masters have the final value (1 or 2 depending on order).
    const finalEast = await east.count('u-1');
    const finalWest = await west.count('u-1');
    expect(finalEast).toBeGreaterThan(0);
    expect(finalWest).toBe(finalEast);
  });
});

describe('KeyDB PoC — Pub/Sub cross-region', () => {
  it('T-KDB-POC-007 publish from one master is delivered to subscribers on any master', async () => {
    const env = await makeEnv();
    const sub = await env.subscribe('cross-region');
    await env.publish('cross-region', 'hello from east', { master: 'us-east' });
    const msg = await sub.next();
    expect(msg.master).toBe('us-east');
    expect(msg.message).toBe('hello from east');
    await sub.close();
  });

  it('T-KDB-POC-008 assertPublished pattern-matches invalidation payloads', async () => {
    const env = await makeEnv();
    setTimeout(() => {
      void env.publish('cache-invalidate', 'rate:u-42');
    }, 20);
    const msg = await env.assertPublished('cache-invalidate', {
      match: /^rate:u-\d+$/,
      timeoutMs: 500,
    });
    expect(msg.message).toBe('rate:u-42');
  });
});
