import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createInMemoryCacheEnv,
  createStubKeyDBEnv,
  createStubMemcachedEnv,
  createTestcontainersCacheEnv,
  createTestcontainersKeyDBEnv,
  createTestcontainersMemcachedEnv,
  dispatchCacheEvent as dispatchEvent,
  setupCacheEnv,
  setupKeyDBEnv,
  setupMemcachedEnv,
  startCache,
  summarizeCache,
  type CacheEvent,
  type CacheState,
} from '../../src/index.js';

/**
 * Coverage-fill sweep — closes reachable branches in the cache adapter and
 * the v0.6 cache-lifecycle-orchestrator semantics. Follows the observability /
 * realtime pattern of closing wrong-state throws, argument guards, and
 * provider-fallback branches in a single flat test file.
 */

describe('cache-lifecycle-orchestrator — invalid + terminal branches (T-C-CL-cov-*)', () => {
  const evictedTerminal = (event: CacheEvent): void => {
    const s = startCache({ timestamp: 't0' });
    // Push into evicted via `timeout` from filling.
    const evicted = dispatchEvent({ session: s, event: 'timeout', timestamp: 't1' });
    expect(evicted.state).toBe('evicted');
    const next = dispatchEvent({ session: evicted, event, timestamp: 't2' });
    expect(next.state).toBe('evicted');
    const terminals = next.events.filter((e: string) => e.startsWith('terminal:'));
    expect(terminals).toContain(`terminal:${event}-in-evicted`);
  };

  it('filling + timeout → evicted directly', () => {
    const s = startCache({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'timeout', timestamp: 't1' });
    expect(next.state).toBe('evicted');
  });

  it.each<CacheEvent>([
    'read-miss',
    'ttl-warning',
    'ttl-expired',
    'invalidate-requested',
    'evict-requested',
  ])('filling + %s → invalid (state preserved)', (event) => {
    const s = startCache({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event, timestamp: 't1' });
    expect(next.state).toBe('filling');
    const invalids = next.events.filter((e: string) => e.startsWith('invalid:'));
    expect(invalids).toContain(`invalid:${event}-in-filling`);
  });

  it('hot + write-committed keeps state hot and increments writesCommitted', () => {
    let s = startCache({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'write-committed', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'write-committed', timestamp: 't2' });
    expect(next.state).toBe('hot');
    expect(next.writesCommitted).toBe(2);
  });

  it.each<CacheEvent>(['read-miss', 'ttl-expired', 'evict-requested'])(
    'hot + %s → invalid (state preserved)',
    (event) => {
      let s = startCache({ timestamp: 't0' });
      s = dispatchEvent({ session: s, event: 'write-committed', timestamp: 't1' });
      const next = dispatchEvent({ session: s, event, timestamp: 't2' });
      expect(next.state).toBe('hot');
      const invalids = next.events.filter((e: string) => e.startsWith('invalid:'));
      expect(invalids).toContain(`invalid:${event}-in-hot`);
    },
  );

  const toExpiring = (): ReturnType<typeof startCache> => {
    let s = startCache({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'write-committed', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'ttl-warning', timestamp: 't2' });
    return s;
  };

  it('expiring + read-hit increments readHits (state preserved)', () => {
    const s = toExpiring();
    const next = dispatchEvent({ session: s, event: 'read-hit', timestamp: 't3' });
    expect(next.state).toBe('expiring');
    expect(next.readHits).toBe(1);
  });

  it('expiring + evict-requested → evicted', () => {
    const s = toExpiring();
    const next = dispatchEvent({ session: s, event: 'evict-requested', timestamp: 't3' });
    expect(next.state).toBe('evicted');
    expect(next.evictions).toBe(1);
  });

  it('expiring + timeout → evicted', () => {
    const s = toExpiring();
    const next = dispatchEvent({ session: s, event: 'timeout', timestamp: 't3' });
    expect(next.state).toBe('evicted');
  });

  it.each<CacheEvent>([
    'write-committed',
    'read-miss',
    'invalidate-requested',
  ])('expiring + %s → invalid (state preserved)', (event) => {
    const s = toExpiring();
    const next = dispatchEvent({ session: s, event, timestamp: 't3' });
    expect(next.state).toBe('expiring');
    const invalids = next.events.filter((e: string) => e.startsWith('invalid:'));
    expect(invalids).toContain(`invalid:${event}-in-expiring`);
  });

  const toStale = (): ReturnType<typeof startCache> => {
    let s = toExpiring();
    s = dispatchEvent({ session: s, event: 'ttl-expired', timestamp: 't3' });
    return s;
  };

  it('stale + timeout → evicted', () => {
    const s = toStale();
    const next = dispatchEvent({ session: s, event: 'timeout', timestamp: 't4' });
    expect(next.state).toBe('evicted');
  });

  it.each<CacheEvent>([
    'read-hit',
    'ttl-warning',
    'ttl-expired',
    'invalidate-requested',
  ])('stale + %s → invalid (state preserved)', (event) => {
    const s = toStale();
    const next = dispatchEvent({ session: s, event, timestamp: 't4' });
    expect(next.state).toBe('stale');
    const invalids = next.events.filter((e: string) => e.startsWith('invalid:'));
    expect(invalids).toContain(`invalid:${event}-in-stale`);
  });

  it.each<CacheEvent>([
    'write-committed',
    'read-miss',
    'ttl-warning',
    'ttl-expired',
    'invalidate-requested',
    'evict-requested',
    'timeout',
  ])('evicted + %s stays evicted with terminal record', (event) => {
    evictedTerminal(event);
  });

  it('summarizeCache tallies invalid + terminal + writes across full traversal', () => {
    let s = startCache({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'read-hit', timestamp: 't1' }); // invalid in filling
    s = dispatchEvent({ session: s, event: 'write-committed', timestamp: 't2' });
    s = dispatchEvent({ session: s, event: 'read-miss', timestamp: 't3' }); // invalid in hot
    s = dispatchEvent({ session: s, event: 'ttl-warning', timestamp: 't4' });
    s = dispatchEvent({ session: s, event: 'ttl-expired', timestamp: 't5' });
    s = dispatchEvent({ session: s, event: 'evict-requested', timestamp: 't6' });
    // Now evicted — one more push should record a terminal event.
    s = dispatchEvent({ session: s, event: 'read-hit', timestamp: 't7' });
    const sum = summarizeCache(s);
    expect(sum.currentState satisfies CacheState).toBe('evicted');
    expect(sum.invalidEvents).toBeGreaterThanOrEqual(2);
    expect(sum.terminalEvents).toBeGreaterThanOrEqual(1);
    expect(sum.writesCommitted).toBe(1);
    expect(sum.evictions).toBe(1);
  });
});

describe('in-memory cache — reachable branches (T-CACHE-cov-*)', () => {
  it('readActive prunes an entry that expired between writes and reads', async () => {
    const env = createInMemoryCacheEnv({ inMemory: { expiryTickMs: 100000 } });
    try {
      // Sub-second TTL — Date.now() drifts past expireAt before we read again.
      await env.set('flash', 'boom', { ttlSeconds: 0.02 });
      await new Promise((r) => setTimeout(r, 50));
      // First read triggers the readActive() cleanup path (not the sweep).
      expect(await env.get('flash')).toBeNull();
    } finally {
      await env.stop();
    }
  });

  it('ttl races with expiry sweep and reports -2 when the entry lingers stale', async () => {
    const env = createInMemoryCacheEnv({ inMemory: { expiryTickMs: 100000 } });
    try {
      await env.set('race', 'x', { ttlSeconds: 0.01 });
      await new Promise((r) => setTimeout(r, 40));
      // Sweep hasn't run yet (tickMs = 100s) — ttl() should notice expireAt is
      // stale and prune the entry inline.
      const remaining = await env.ttl('race');
      expect(remaining).toBe(-2);
    } finally {
      await env.stop();
    }
  });

  it('applyTTLExpectation throws on exact-seconds mismatch', async () => {
    const env = createInMemoryCacheEnv({});
    try {
      await env.set('any', 'v', { ttlSeconds: 5 });
      await expect(env.assertTTL('any', { seconds: 999 })).rejects.toThrow(
        /expected TTL=999s/,
      );
    } finally {
      await env.stop();
    }
  });

  it('subscribe.next after close throws immediately', async () => {
    const env = createInMemoryCacheEnv({});
    try {
      const sub = await env.subscribe('closed');
      await sub.close();
      await expect(sub.next({ timeoutMs: 10 })).rejects.toThrow(/is closed/);
    } finally {
      await env.stop();
    }
  });

  it('stop() unblocks in-flight next() waiters with the sentinel index -1', async () => {
    const env = createInMemoryCacheEnv({});
    const sub = await env.subscribe('pending');
    const pending = sub.next({ timeoutMs: 5000 });
    await env.stop();
    const resolved = await pending;
    expect(resolved.index).toBe(-1);
  });
});

describe('stub-keydb — reachable branches (T-KDB-cov-*)', () => {
  it('selectMaster throws when the cluster is empty', async () => {
    const env = createStubKeyDBEnv({ cluster: [] });
    try {
      await expect(env.get('missing')).rejects.toThrow(/cluster has no masters/);
    } finally {
      await env.stop();
    }
  });

  it('replicateDelete removes the key from every other master synchronously', async () => {
    const env = createStubKeyDBEnv({ cluster: ['m-a', 'm-b', 'm-c'] });
    try {
      await env.set('k', 'v');
      expect(env.listEntries()).toHaveLength(3);
      await env.delete('k');
      expect(env.listEntries()).toHaveLength(0);
    } finally {
      await env.stop();
    }
  });

  it('replicateDelete honours replicationLagMs when > 0', async () => {
    const env = createStubKeyDBEnv({
      cluster: ['m-a', 'm-b'],
      stub: { replicationLagMs: 30 },
    });
    try {
      await env.set('k', 'v', { master: 'm-a' });
      await new Promise((r) => setTimeout(r, 60));
      expect(await env.get('k', { master: 'm-b' })).toBe('v');
      await env.delete('k');
      // Immediately the originator's copy is gone, replicas still show it.
      expect(await env.get('k', { master: 'm-b' })).toBe('v');
      await new Promise((r) => setTimeout(r, 60));
      expect(await env.get('k', { master: 'm-b' })).toBeNull();
    } finally {
      await env.stop();
    }
  });

  it('readEntry prunes an entry once its expiresAt elapses', async () => {
    const env = createStubKeyDBEnv({ stub: { expiryTickMs: 100000 } });
    try {
      await env.set('k', 'v', { ttlSeconds: 0.02 });
      await new Promise((r) => setTimeout(r, 50));
      expect(await env.get('k')).toBeNull();
    } finally {
      await env.stop();
    }
  });

  it('assertTTL throws on exact-seconds mismatch', async () => {
    const env = createStubKeyDBEnv({});
    try {
      await env.set('k', 'v', { ttlSeconds: 10 });
      await expect(env.assertTTL('k', { seconds: 999 })).rejects.toThrow(
        /expected TTL 999s/,
      );
    } finally {
      await env.stop();
    }
  });

  it('assertTTL throws when atMost bound is violated', async () => {
    const env = createStubKeyDBEnv({});
    try {
      await env.set('k', 'v', { ttlSeconds: 30 });
      await expect(env.assertTTL('k', { atMost: 1 })).rejects.toThrow(
        /expected TTL <= 1s/,
      );
    } finally {
      await env.stop();
    }
  });

  it('subscription.received() returns the accumulated history snapshot', async () => {
    const env = createStubKeyDBEnv({});
    try {
      const sub = await env.subscribe('log');
      await env.publish('log', 'first');
      await env.publish('log', 'second');
      const snapshot = sub.received();
      expect(snapshot.map((m) => m.message)).toEqual(['first', 'second']);
      // Snapshot is a copy, not a live view.
      expect(snapshot).not.toBe(sub.received());
      await sub.close();
    } finally {
      await env.stop();
    }
  });
});

describe('stub-memcached — reachable branches (T-MC-cov-*)', () => {
  it('readEntry prunes an entry once its expiresAt elapses', async () => {
    const env = createStubMemcachedEnv({ stub: { expiryTickMs: 100000 } });
    try {
      await env.set('k', 'v', { ttlSeconds: 0.02 });
      await new Promise((r) => setTimeout(r, 50));
      expect(await env.get('k')).toBeNull();
    } finally {
      await env.stop();
    }
  });

  it('assertTTL throws on exact-seconds mismatch', async () => {
    const env = createStubMemcachedEnv({});
    try {
      await env.set('k', 'v', { ttlSeconds: 10 });
      await expect(env.assertTTL('k', { seconds: 999 })).rejects.toThrow(
        /expected TTL 999s/,
      );
    } finally {
      await env.stop();
    }
  });

  it('assertTTL throws when atMost bound is violated', async () => {
    const env = createStubMemcachedEnv({});
    try {
      await env.set('k', 'v', { ttlSeconds: 30 });
      await expect(env.assertTTL('k', { atMost: 1 })).rejects.toThrow(
        /expected TTL <= 1s/,
      );
    } finally {
      await env.stop();
    }
  });
});

/**
 * The testcontainers KeyDB / Memcached wrappers cover their "url unreachable"
 * error path already; here we exercise the success path with a listening TCP
 * socket, plus the URL parse guard for a non-numeric port.
 */
async function withTcpServer<T>(
  fn: (endpoint: { host: string; port: number }) => Promise<T>,
): Promise<T> {
  const net = await import('node:net');
  const server = net.createServer((socket) => socket.end());
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  server.unref?.();
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('withTcpServer: expected AddressInfo, got string / null');
  }
  try {
    return await fn({ host: '127.0.0.1', port: address.port });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe('testcontainers-keydb — success + parse guards (T-KDB-tc-cov-*)', () => {
  it('probe succeeds against a listening TCP socket and returns a live env', async () => {
    await withTcpServer(async ({ host, port }) => {
      const env = await createTestcontainersKeyDBEnv({
        testcontainers: { url: `keydb://${host}:${port}` },
      });
      try {
        expect(env.mode).toBe('live');
        expect(env.backend).toBe('testcontainers');
        expect(env.keydbUrl).toBe(`keydb://${host}:${port}`);
        // Every method is bound to the inner stub — smoke each proxy.
        await env.set('k', 'v');
        expect(await env.get('k')).toBe('v');
        expect(await env.delete('k')).toBe(1);
        expect(await env.expire('k', 30)).toBe(false);
        expect(await env.ttl('missing')).toBe(-2);
        await env.set('k2', 'v2', { ttlSeconds: 30 });
        await env.assertTTL('k2', { atLeast: 25 });
        const sub = await env.subscribe('chan');
        await env.publish('chan', 'hello');
        const msg = await sub.next();
        expect(msg.message).toBe('hello');
        await sub.close();
        expect(env.listEntries().map((e) => e.key)).toContain('k2');
        await env.flushAll();
        expect(env.listEntries()).toHaveLength(0);
      } finally {
        await env.stop();
      }
    });
  });

  it('probe accepts the redis:// scheme', async () => {
    await withTcpServer(async ({ host, port }) => {
      const env = await createTestcontainersKeyDBEnv({
        testcontainers: { url: `redis://${host}:${port}` },
      });
      try {
        expect(env.keydbUrl).toBe(`redis://${host}:${port}`);
      } finally {
        await env.stop();
      }
    });
  });

  it('probe accepts a bare host:port pair', async () => {
    await withTcpServer(async ({ host, port }) => {
      const env = await createTestcontainersKeyDBEnv({
        testcontainers: { url: `${host}:${port}` },
      });
      try {
        expect(env.keydbUrl).toBe(`${host}:${port}`);
      } finally {
        await env.stop();
      }
    });
  });

  it('rejects a URL whose port is not a valid integer', async () => {
    await expect(
      createTestcontainersKeyDBEnv({
        testcontainers: { url: 'keydb://localhost:abc' },
      }),
    ).rejects.toThrow(/is not a valid integer/);
  });
});

describe('testcontainers-memcached — success + parse guards (T-MC-tc-cov-*)', () => {
  it('probe succeeds against a listening TCP socket and returns a live env', async () => {
    await withTcpServer(async ({ host, port }) => {
      const env = await createTestcontainersMemcachedEnv({
        servers: ['mc-a', 'mc-b'],
        testcontainers: { url: `memcached://${host}:${port}` },
      });
      try {
        expect(env.mode).toBe('live');
        expect(env.backend).toBe('testcontainers');
        expect(env.memcachedUrl).toBe(`memcached://${host}:${port}`);
        expect(env.servers).toEqual(['mc-a', 'mc-b']);
        await env.set('k', 'v');
        expect(await env.get('k')).toBe('v');
        expect(await env.add('k', 'v2')).toBe(false);
        expect(await env.replace('k', 'v3')).toBe(true);
        expect(await env.get('k')).toBe('v3');
        await env.set('n', '10');
        expect(await env.increment('n', 5)).toBe(15);
        expect(await env.decrement('n', 1)).toBe(14);
        expect(await env.ttl('missing')).toBe(-2);
        await env.set('t', 'v', { ttlSeconds: 30 });
        await env.assertTTL('t', { atLeast: 25 });
        expect(env.serverFor('t')).toMatch(/^mc-/);
        expect(env.listEntries().map((e) => e.key)).toContain('t');
        expect(await env.delete('k')).toBe(true);
        await env.flush();
        expect(env.listEntries()).toHaveLength(0);
      } finally {
        await env.stop();
      }
    });
  });

  it('probe accepts a bare host:port pair', async () => {
    await withTcpServer(async ({ host, port }) => {
      const env = await createTestcontainersMemcachedEnv({
        testcontainers: { url: `${host}:${port}` },
      });
      try {
        expect(env.memcachedUrl).toBe(`${host}:${port}`);
      } finally {
        await env.stop();
      }
    });
  });

  it('rejects a URL whose port is not a valid integer', async () => {
    await expect(
      createTestcontainersMemcachedEnv({
        testcontainers: { url: 'memcached://localhost:notaport' },
      }),
    ).rejects.toThrow(/is not a valid integer/);
  });
});

/**
 * testcontainers-cache — the largest gap in the package. We can't spin up a
 * real Docker container inside a unit test, but the driver code is small and
 * duck-typed against the ioredis / node-redis / testcontainers surfaces we
 * exercise. We swap those imports with in-process fakes via `vi.mock`.
 */

interface FakeIoRedisSubscribeHandler {
  (channel: string, message: string): void;
}

interface FakeIoRedisClient {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<'OK'>;
  setex: (key: string, seconds: number, value: string) => Promise<'OK'>;
  del: (...keys: string[]) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
  ttl: (key: string) => Promise<number>;
  publish: (channel: string, message: string) => Promise<number>;
  subscribe: (channel: string) => Promise<'OK'>;
  unsubscribe: (channel: string) => Promise<'OK'>;
  on: (event: 'message', handler: FakeIoRedisSubscribeHandler) => void;
  off: (event: 'message', handler: FakeIoRedisSubscribeHandler) => void;
  flushdb: () => Promise<'OK'>;
  quit: () => Promise<'OK'>;
  disconnect: () => void;
  __emit: (channel: string, message: string) => void;
  __isSubscribing: boolean;
  listeners: Set<FakeIoRedisSubscribeHandler>;
}

interface FakeIoRedisModuleShape {
  default: new (url: string, opts?: { maxRetriesPerRequest?: number | null }) => FakeIoRedisClient;
}

interface FakeNodeRedisSubscribeHandler {
  (message: string, deliveredChannel: string): void;
}

interface FakeNodeRedisClient {
  connect: () => Promise<void>;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, opts?: { EX?: number }) => Promise<string | null>;
  del: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<boolean | number>;
  ttl: (key: string) => Promise<number>;
  publish: (channel: string, message: string) => Promise<number>;
  subscribe: (channel: string, handler: FakeNodeRedisSubscribeHandler) => Promise<void>;
  unsubscribe: (channel: string) => Promise<void>;
  duplicate: () => FakeNodeRedisClient;
  flushDb: () => Promise<string>;
  quit: () => Promise<string>;
  disconnect: () => Promise<void>;
  __emit: (channel: string, message: string) => void;
}

interface FakeNodeRedisModuleShape {
  createClient: (opts: { url: string }) => FakeNodeRedisClient;
}

function buildFakeIoRedisModule(sharedStores: Map<string, Map<string, { value: string; expiresAt: number }>>): FakeIoRedisModuleShape {
  return {
    default: class FakeRedis implements FakeIoRedisClient {
      readonly url: string;
      readonly listeners = new Set<FakeIoRedisSubscribeHandler>();
      __isSubscribing = false;
      constructor(url: string) {
        this.url = url;
        if (!sharedStores.has(url)) sharedStores.set(url, new Map());
      }
      private store(): Map<string, { value: string; expiresAt: number }> {
        return sharedStores.get(this.url)!;
      }
      async get(key: string): Promise<string | null> {
        const entry = this.store().get(key);
        if (!entry) return null;
        if (entry.expiresAt > 0 && entry.expiresAt <= Date.now()) {
          this.store().delete(key);
          return null;
        }
        return entry.value;
      }
      async set(key: string, value: string): Promise<'OK'> {
        this.store().set(key, { value, expiresAt: 0 });
        return 'OK';
      }
      async setex(key: string, seconds: number, value: string): Promise<'OK'> {
        this.store().set(key, { value, expiresAt: Date.now() + seconds * 1000 });
        return 'OK';
      }
      async del(...keys: string[]): Promise<number> {
        let removed = 0;
        for (const key of keys) if (this.store().delete(key)) removed += 1;
        return removed;
      }
      async expire(key: string, seconds: number): Promise<number> {
        const entry = this.store().get(key);
        if (!entry) return 0;
        entry.expiresAt = Date.now() + seconds * 1000;
        return 1;
      }
      async ttl(key: string): Promise<number> {
        const entry = this.store().get(key);
        if (!entry) return -2;
        if (entry.expiresAt === 0) return -1;
        return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
      }
      async publish(channel: string, message: string): Promise<number> {
        return __ioSubscribers.get(this.url + '::' + channel)?.emit(channel, message) ?? 0;
      }
      async subscribe(channel: string): Promise<'OK'> {
        this.__isSubscribing = true;
        const key = this.url + '::' + channel;
        const bucket = __ioSubscribers.get(key) ?? {
          emit(ch: string, msg: string) {
            let delivered = 0;
            for (const client of this.clients) {
              for (const listener of client.listeners) {
                listener(ch, msg);
                delivered += 1;
              }
            }
            return delivered;
          },
          clients: new Set<FakeIoRedisClient>(),
        };
        bucket.clients.add(this as unknown as FakeIoRedisClient);
        __ioSubscribers.set(key, bucket);
        return 'OK';
      }
      async unsubscribe(channel: string): Promise<'OK'> {
        const key = this.url + '::' + channel;
        const bucket = __ioSubscribers.get(key);
        bucket?.clients.delete(this as unknown as FakeIoRedisClient);
        if (bucket && bucket.clients.size === 0) __ioSubscribers.delete(key);
        return 'OK';
      }
      on(event: 'message', handler: FakeIoRedisSubscribeHandler): void {
        if (event !== 'message') return;
        this.listeners.add(handler);
      }
      off(event: 'message', handler: FakeIoRedisSubscribeHandler): void {
        if (event !== 'message') return;
        this.listeners.delete(handler);
      }
      async flushdb(): Promise<'OK'> {
        this.store().clear();
        return 'OK';
      }
      async quit(): Promise<'OK'> {
        this.listeners.clear();
        return 'OK';
      }
      disconnect(): void {
        this.listeners.clear();
      }
      __emit(channel: string, message: string): void {
        for (const listener of this.listeners) listener(channel, message);
      }
    },
  };
}

interface IoSubscriberBucket {
  emit(channel: string, message: string): number;
  clients: Set<FakeIoRedisClient>;
}

const __ioSubscribers = new Map<string, IoSubscriberBucket>();
const __ioStores = new Map<string, Map<string, { value: string; expiresAt: number }>>();

const __nodeRedisState = {
  store: new Map<string, { value: string; expiresAt: number }>(),
  subscribers: new Map<string, Set<FakeNodeRedisClient>>(),
};

function buildFakeNodeRedisModule(): FakeNodeRedisModuleShape {
  const createClient = (opts: { url: string }): FakeNodeRedisClient => {
    void opts.url;
    let subscribedChannel: string | null = null;
    let subscribedHandler: FakeNodeRedisSubscribeHandler | null = null;
    const client: FakeNodeRedisClient = {
      async connect(): Promise<void> {},
      async get(key) {
        const entry = __nodeRedisState.store.get(key);
        if (!entry) return null;
        if (entry.expiresAt > 0 && entry.expiresAt <= Date.now()) {
          __nodeRedisState.store.delete(key);
          return null;
        }
        return entry.value;
      },
      async set(key, value, options) {
        __nodeRedisState.store.set(key, {
          value,
          expiresAt: options?.EX ? Date.now() + options.EX * 1000 : 0,
        });
        return 'OK';
      },
      async del(key) {
        return __nodeRedisState.store.delete(key) ? 1 : 0;
      },
      async expire(key, seconds) {
        const entry = __nodeRedisState.store.get(key);
        if (!entry) return false;
        entry.expiresAt = Date.now() + seconds * 1000;
        return true;
      },
      async ttl(key) {
        const entry = __nodeRedisState.store.get(key);
        if (!entry) return -2;
        if (entry.expiresAt === 0) return -1;
        return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
      },
      async publish(channel, message) {
        const bucket = __nodeRedisState.subscribers.get(channel);
        if (!bucket) return 0;
        let delivered = 0;
        for (const c of bucket) {
          c.__emit(channel, message);
          delivered += 1;
        }
        return delivered;
      },
      async subscribe(channel, handler) {
        subscribedChannel = channel;
        subscribedHandler = handler;
        const bucket = __nodeRedisState.subscribers.get(channel) ?? new Set<FakeNodeRedisClient>();
        bucket.add(client);
        __nodeRedisState.subscribers.set(channel, bucket);
      },
      async unsubscribe(channel) {
        const bucket = __nodeRedisState.subscribers.get(channel);
        bucket?.delete(client);
        if (bucket && bucket.size === 0) __nodeRedisState.subscribers.delete(channel);
        subscribedChannel = null;
        subscribedHandler = null;
      },
      duplicate() {
        return createClient({ url: opts.url });
      },
      async flushDb() {
        __nodeRedisState.store.clear();
        return 'OK';
      },
      async quit() {
        subscribedHandler = null;
        return 'OK';
      },
      async disconnect() {
        subscribedHandler = null;
      },
      __emit(channel, message) {
        void subscribedChannel;
        if (subscribedHandler) subscribedHandler(message, channel);
      },
    };
    return client;
  };
  return { createClient };
}

const fakeIoRedisModule = buildFakeIoRedisModule(__ioStores);
const fakeNodeRedisModule = buildFakeNodeRedisModule();

// Replace the dynamic imports with in-process fakes. The compiled testcontainers
// wrapper does `await import('ioredis' | 'redis' | 'testcontainers')`, which
// vitest intercepts here.
vi.mock('ioredis', () => fakeIoRedisModule);
vi.mock('redis', () => fakeNodeRedisModule);

// GenericContainer fake for the "no url provided" path.
class FakeContainer {
  private ports: number[] = [];
  withExposedPorts(port: number): this {
    this.ports.push(port);
    return this;
  }
  async start(): Promise<{
    stop: () => Promise<void>;
    getHost: () => string;
    getMappedPort: (port: number) => number;
  }> {
    return {
      stop: async () => {},
      getHost: () => 'fake-host',
      getMappedPort: (port: number) => port + 1000,
    };
  }
}

vi.mock('testcontainers', () => ({
  GenericContainer: FakeContainer,
}));

describe('testcontainers-cache (ioredis backend, mocked ioredis) — T-CACHE-tc-cov-io-*', () => {
  const envs: Array<{ stop: () => Promise<void> }> = [];
  afterEach(async () => {
    while (envs.length > 0) {
      const env = envs.pop();
      if (env) await env.stop().catch(() => {});
    }
    __ioSubscribers.clear();
    __ioStores.clear();
  });

  it('builds env, exercises the full get / set / delete / TTL surface', async () => {
    const env = await createTestcontainersCacheEnv({
      redis: { url: 'redis://mocked:6379' },
    });
    envs.push(env);
    expect(env.mode).toBe('live');
    expect(env.backend).toBe('testcontainers');
    expect(env.redisUrl).toBe('redis://mocked:6379');
    expect(env.client).toBe('ioredis');
    expect(await env.get('missing')).toBeNull();
    await env.set('k', 'v');
    expect(await env.get('k')).toBe('v');
    await env.set('with-ttl', 'v', { ttlSeconds: 60 });
    expect(await env.ttl('with-ttl')).toBeGreaterThanOrEqual(59);
    expect(await env.delete('with-ttl')).toBe(1);
    expect(await env.delete('with-ttl')).toBe(0);
    // env.expire delegates to the driver — reads primary.expire → 1 → true.
    await env.set('later', 'v');
    expect(await env.expire('later', 30)).toBe(true);
  });

  it('set rejects non-positive ttlSeconds', async () => {
    const env = await createTestcontainersCacheEnv({
      redis: { url: 'redis://mocked:6379' },
    });
    envs.push(env);
    await expect(env.set('bad', 'x', { ttlSeconds: 0 })).rejects.toThrow(
      /ttlSeconds must be positive/,
    );
    await expect(env.set('bad', 'x', { ttlSeconds: -1 })).rejects.toThrow(
      /ttlSeconds must be positive/,
    );
  });

  it('expire rejects non-positive ttlSeconds', async () => {
    const env = await createTestcontainersCacheEnv({
      redis: { url: 'redis://mocked:6379' },
    });
    envs.push(env);
    await expect(env.expire('k', 0)).rejects.toThrow(/ttlSeconds must be positive/);
  });

  it('assertTTL applies every expectation branch through the driver', async () => {
    const env = await createTestcontainersCacheEnv({
      redis: { url: 'redis://mocked:6379' },
    });
    envs.push(env);
    await env.set('k', 'v', { ttlSeconds: 60 });
    const observed = await env.assertTTL('k', { atLeast: 30, atMost: 60 });
    expect(observed).toBeGreaterThan(0);
    // The exact-seconds match path returns the observed TTL when it lines up.
    const matched = await env.assertTTL('k', { seconds: observed });
    expect(matched).toBe(observed);
    await expect(env.assertTTL('k', { seconds: 999 })).rejects.toThrow(
      /expected TTL=999s/,
    );
    await expect(env.assertTTL('k', { atLeast: 999 })).rejects.toThrow(
      /expected TTL>=999s/,
    );
    await expect(env.assertTTL('k', { atMost: 1 })).rejects.toThrow(
      /expected TTL<=1s/,
    );
    await expect(env.assertTTL('k', {})).rejects.toThrow(/at least one of/);
  });

  it('subscribe.next after close throws immediately', async () => {
    const env = await createTestcontainersCacheEnv({
      redis: { url: 'redis://mocked:6379' },
    });
    envs.push(env);
    const sub = await env.subscribe('closed');
    await sub.close();
    await expect(sub.next({ timeoutMs: 10 })).rejects.toThrow(/is closed/);
  });

  it('publish / subscribe deliver messages through the mocked driver', async () => {
    const env = await createTestcontainersCacheEnv({
      redis: { url: 'redis://mocked:6379' },
    });
    envs.push(env);
    const sub = await env.subscribe('room');
    // testcontainers driver's next() only sees future publishes — kick off the
    // wait first, then publish so the waiter resolves.
    const pending = sub.next({ timeoutMs: 500 });
    const delivered = await env.publish('room', 'hi');
    expect(delivered).toBe(1);
    const msg = await pending;
    expect(msg.message).toBe('hi');
    expect(msg.channel).toBe('room');
    expect(sub.received().map((m: { message: string }) => m.message)).toContain('hi');
    await sub.close();
  });

  it('subscribe.next rejects on timeout', async () => {
    const env = await createTestcontainersCacheEnv({
      redis: { url: 'redis://mocked:6379' },
    });
    envs.push(env);
    const sub = await env.subscribe('idle');
    await expect(sub.next({ timeoutMs: 20 })).rejects.toThrow(/timeout waiting/);
    await sub.close();
  });

  it('subscribe.close unblocks in-flight next() waiters with the sentinel', async () => {
    const env = await createTestcontainersCacheEnv({
      redis: { url: 'redis://mocked:6379' },
    });
    envs.push(env);
    const sub = await env.subscribe('blocked');
    const pending = sub.next({ timeoutMs: 5000 });
    await sub.close();
    const resolved = await pending;
    expect(resolved.index).toBe(-1);
  });

  it('assertPublished matches string, regex, and rejects on no match', async () => {
    const env = await createTestcontainersCacheEnv({
      redis: { url: 'redis://mocked:6379' },
    });
    envs.push(env);
    await env.subscribe('log');
    await env.publish('log', 'error: fatal');
    const hit1 = await env.assertPublished('log', { match: 'error: fatal' });
    expect(hit1.message).toBe('error: fatal');
    await env.publish('log', 'user 7 online');
    const hit2 = await env.assertPublished('log', { match: /user \d+/ });
    expect(hit2.message).toBe('user 7 online');
    await expect(
      env.assertPublished('log', { match: /^never:/, timeoutMs: 30 }),
    ).rejects.toThrow(/no message on "log" matched/);
  });

  it('assertPublished waits for a subsequent publish within the timeout', async () => {
    const env = await createTestcontainersCacheEnv({
      redis: { url: 'redis://mocked:6379' },
    });
    envs.push(env);
    await env.subscribe('log');
    const pending = env.assertPublished('log', { match: /welcome/, timeoutMs: 500 });
    setTimeout(() => {
      void env.publish('log', 'welcome onboard');
    }, 30);
    const hit = await pending;
    expect(hit.message).toBe('welcome onboard');
  });

  it('flushAll clears every key through the driver', async () => {
    const env = await createTestcontainersCacheEnv({
      redis: { url: 'redis://mocked:6379' },
    });
    envs.push(env);
    await env.set('a', '1');
    await env.set('b', '2');
    await env.flushAll();
    expect(await env.get('a')).toBeNull();
    expect(await env.get('b')).toBeNull();
  });

  it('stop is idempotent and invalidates subsequent ops', async () => {
    const env = await createTestcontainersCacheEnv({
      redis: { url: 'redis://mocked:6379' },
    });
    await env.stop();
    await expect(env.stop()).resolves.toBeUndefined();
    await expect(env.get('x')).rejects.toThrow(/after stop/);
    await expect(env.set('x', 'y')).rejects.toThrow(/after stop/);
    await expect(env.delete('x')).rejects.toThrow(/after stop/);
    await expect(env.expire('x', 5)).rejects.toThrow(/after stop/);
    await expect(env.ttl('x')).rejects.toThrow(/after stop/);
    await expect(env.publish('c', 'm')).rejects.toThrow(/after stop/);
    await expect(env.subscribe('c')).rejects.toThrow(/after stop/);
    await expect(env.flushAll()).rejects.toThrow(/after stop/);
    await expect(env.assertPublished('c', { match: 'x' })).rejects.toThrow(/after stop/);
  });

  it('closing an outstanding subscription via env.stop cleans it up', async () => {
    const env = await createTestcontainersCacheEnv({
      redis: { url: 'redis://mocked:6379' },
    });
    const sub = await env.subscribe('outstanding');
    expect(sub.received()).toEqual([]);
    await env.stop();
  });

  it('starts a testcontainers-managed instance when no redis.url is provided', async () => {
    const env = await createTestcontainersCacheEnv({});
    envs.push(env);
    expect(env.redisUrl).toBe('redis://fake-host:7379');
    await env.set('k', 'v');
    expect(await env.get('k')).toBe('v');
  });

  it('respects the redis.image override when spawning a container', async () => {
    const env = await createTestcontainersCacheEnv({
      redis: { image: 'redis:custom' },
    });
    envs.push(env);
    // The fake container returns the same host/port regardless of image, so
    // we assert on the effect (env accepts + surfaces a URL) rather than the
    // image itself.
    expect(env.redisUrl).toMatch(/^redis:\/\//);
  });
});

describe('testcontainers-cache (node-redis backend, mocked redis) — T-CACHE-tc-cov-nr-*', () => {
  const envs: Array<{ stop: () => Promise<void> }> = [];
  afterEach(async () => {
    while (envs.length > 0) {
      const env = envs.pop();
      if (env) await env.stop().catch(() => {});
    }
    __nodeRedisState.store.clear();
    __nodeRedisState.subscribers.clear();
  });

  it('builds env and exercises get / set / TTL through node-redis', async () => {
    const env = await createTestcontainersCacheEnv({
      client: 'node-redis',
      redis: { url: 'redis://mocked:6379' },
    });
    envs.push(env);
    expect(env.client).toBe('node-redis');
    await env.set('k', 'v');
    expect(await env.get('k')).toBe('v');
    await env.set('with-ttl', 'v', { ttlSeconds: 30 });
    expect(await env.ttl('with-ttl')).toBeGreaterThan(0);
    expect(await env.delete('with-ttl')).toBe(1);
    await env.set('later', 'v');
    expect(await env.expire('later', 30)).toBe(true);
  });

  it('publish / subscribe deliver via the node-redis mock', async () => {
    const env = await createTestcontainersCacheEnv({
      client: 'node-redis',
      redis: { url: 'redis://mocked:6379' },
    });
    envs.push(env);
    const sub = await env.subscribe('bell');
    const pending = sub.next({ timeoutMs: 500 });
    const delivered = await env.publish('bell', 'ring');
    expect(delivered).toBe(1);
    const msg = await pending;
    expect(msg.message).toBe('ring');
    await sub.close();
    // After close, the next publish delivers nothing.
    const post = await env.publish('bell', 'silent');
    expect(post).toBe(0);
  });

  it('flushAll clears store via node-redis flushDb', async () => {
    const env = await createTestcontainersCacheEnv({
      client: 'node-redis',
      redis: { url: 'redis://mocked:6379' },
    });
    envs.push(env);
    await env.set('a', '1');
    await env.flushAll();
    expect(await env.get('a')).toBeNull();
  });
});

describe('setupCacheEnv — testcontainers wiring through the public factory', () => {
  it('routes through setupCacheEnv into the mocked testcontainers driver', async () => {
    const env = await setupCacheEnv({
      mode: 'testcontainers',
      redis: { url: 'redis://mocked:6379' },
    });
    try {
      expect(env.backend).toBe('testcontainers');
      expect(env.mode).toBe('live');
      await env.set('k', 'v');
      expect(await env.get('k')).toBe('v');
    } finally {
      await env.stop();
      __ioStores.clear();
      __ioSubscribers.clear();
    }
  });
});

/**
 * Peer-dependency missing error paths. `vi.doMock` + `vi.resetModules` +
 * dynamic re-import lets a single test override the module before the
 * lazy `await import('ioredis' | 'redis' | 'testcontainers')` inside the
 * testcontainers driver resolves.
 */

describe('testcontainers-cache — peer dep missing branches', () => {
  afterEach(async () => {
    vi.doUnmock('ioredis');
    vi.doUnmock('redis');
    vi.doUnmock('testcontainers');
    vi.resetModules();
  });

  it('surfaces a helpful error when the ioredis peer dep fails to import', async () => {
    vi.resetModules();
    vi.doMock('ioredis', () => {
      throw new Error('boom-io');
    });
    const mod = await import('../../src/testcontainers-cache.js');
    await expect(
      mod.createTestcontainersCacheEnv({ redis: { url: 'redis://mocked:6379' } }),
    ).rejects.toThrow(/requires the 'ioredis' peer dependency/);
  });

  it('surfaces a helpful error when the redis (node-redis) peer dep fails to import', async () => {
    vi.resetModules();
    vi.doMock('redis', () => {
      throw new Error('boom-redis');
    });
    const mod = await import('../../src/testcontainers-cache.js');
    await expect(
      mod.createTestcontainersCacheEnv({
        client: 'node-redis',
        redis: { url: 'redis://mocked:6379' },
      }),
    ).rejects.toThrow(/requires the 'redis' peer dependency/);
  });

  it('surfaces a helpful error when the testcontainers peer dep fails to import', async () => {
    vi.resetModules();
    vi.doMock('testcontainers', () => {
      throw new Error('boom-tc');
    });
    const mod = await import('../../src/testcontainers-cache.js');
    await expect(
      mod.createTestcontainersCacheEnv({}),
    ).rejects.toThrow(/requires the 'testcontainers' peer dependency/);
  });
});

describe('setupKeyDBEnv / setupMemcachedEnv — remaining testcontainers wiring', () => {
  it('setupKeyDBEnv wires through the testcontainers success path', async () => {
    await withTcpServer(async ({ host, port }) => {
      const env = await setupKeyDBEnv({
        mode: 'testcontainers',
        testcontainers: { url: `keydb://${host}:${port}` },
      });
      try {
        expect(env.mode).toBe('live');
        expect(env.backend).toBe('testcontainers');
      } finally {
        await env.stop();
      }
    });
  });

  it('setupMemcachedEnv wires through the testcontainers success path', async () => {
    await withTcpServer(async ({ host, port }) => {
      const env = await setupMemcachedEnv({
        mode: 'testcontainers',
        testcontainers: { url: `memcached://${host}:${port}` },
      });
      try {
        expect(env.mode).toBe('live');
        expect(env.backend).toBe('testcontainers');
      } finally {
        await env.stop();
      }
    });
  });
});
