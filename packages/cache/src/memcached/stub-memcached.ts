import type {
  MemcachedAssertTTLExpected,
  MemcachedEntrySnapshot,
  MemcachedTestEnv,
  SetupMemcachedEnvOptions,
} from './types.js';

interface StubEntry {
  key: string;
  value: string;
  server: string;
  /** Absolute expiry epoch ms; 0 = no expiry. */
  expiresAt: number;
}

/**
 * FNV-1a 32-bit hash — small, deterministic, sufficient for a consistent
 * hash ring in tests. We don't need cryptographic quality; we need reproducible
 * placement across servers.
 */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Simple consistent hash ring. Each server gets 128 virtual nodes so key
 * distribution stays stable when servers come and go.
 */
class HashRing {
  private readonly ring: { hash: number; server: string }[] = [];

  constructor(servers: string[]) {
    for (const server of servers) {
      for (let i = 0; i < 128; i += 1) {
        this.ring.push({ hash: fnv1a(`${server}#${i}`), server });
      }
    }
    this.ring.sort((a, b) => a.hash - b.hash);
  }

  serverFor(key: string): string {
    if (this.ring.length === 0) {
      throw new Error(
        'MemcachedEnv: no servers configured — cannot resolve a server for the key',
      );
    }
    const target = fnv1a(key);
    for (const node of this.ring) {
      if (node.hash >= target) return node.server;
    }
    return this.ring[0]?.server ?? this.ring[this.ring.length - 1]!.server;
  }
}

/**
 * Build an in-process stub of Memcached covering the 8 core commands (get /
 * set / delete / add / replace / increment / decrement / flush) + TTL +
 * multi-server consistent hashing — deterministically, without spinning up
 * a container.
 */
export function createStubMemcachedEnv(
  opts: SetupMemcachedEnvOptions,
): MemcachedTestEnv<'mock'> {
  const servers = opts.servers ?? ['stub-0'];
  const ring = new HashRing(servers);
  const store = new Map<string, StubEntry>();
  const expiryTickMs = opts.stub?.expiryTickMs ?? 5;
  let stopped = false;
  let expiryTimer: ReturnType<typeof setTimeout> | null = null;

  function assertNotStopped(): void {
    if (stopped) throw new Error('setupMemcachedEnv: cannot use env after stop()');
  }

  function scheduleExpiryTick(): void {
    if (stopped || expiryTimer !== null) return;
    expiryTimer = setTimeout(() => {
      expiryTimer = null;
      const now = Date.now();
      for (const [key, entry] of store) {
        if (entry.expiresAt > 0 && entry.expiresAt <= now) store.delete(key);
      }
      if (store.size > 0) scheduleExpiryTick();
    }, expiryTickMs);
    (expiryTimer as unknown as { unref?: () => void }).unref?.();
  }

  function computeExpiresAt(ttlSeconds: number | undefined): number {
    if (ttlSeconds === undefined || ttlSeconds === 0) return 0;
    if (ttlSeconds < 0) {
      throw new Error('set: ttlSeconds must be non-negative (0 = no expiry)');
    }
    return Date.now() + ttlSeconds * 1000;
  }

  function readEntry(key: string): StubEntry | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt > 0 && entry.expiresAt <= Date.now()) {
      store.delete(key);
      return null;
    }
    return entry;
  }

  const env: MemcachedTestEnv<'mock'> = {
    mode: 'mock',
    backend: 'stub',
    memcachedUrl: undefined,
    client: opts.client ?? 'memjs',
    servers,
    async get(key: string) {
      assertNotStopped();
      const entry = readEntry(key);
      return entry?.value ?? null;
    },
    async set(key: string, value: string, options) {
      assertNotStopped();
      const expiresAt = computeExpiresAt(options?.ttlSeconds);
      const server = ring.serverFor(key);
      store.set(key, { key, value, server, expiresAt });
      if (expiresAt > 0) scheduleExpiryTick();
    },
    async delete(key: string) {
      assertNotStopped();
      const entry = readEntry(key);
      if (!entry) return false;
      store.delete(key);
      return true;
    },
    async add(key: string, value: string, options) {
      assertNotStopped();
      if (readEntry(key)) return false;
      const expiresAt = computeExpiresAt(options?.ttlSeconds);
      const server = ring.serverFor(key);
      store.set(key, { key, value, server, expiresAt });
      if (expiresAt > 0) scheduleExpiryTick();
      return true;
    },
    async replace(key: string, value: string, options) {
      assertNotStopped();
      const entry = readEntry(key);
      if (!entry) return false;
      const expiresAt =
        options?.ttlSeconds !== undefined
          ? computeExpiresAt(options.ttlSeconds)
          : entry.expiresAt;
      store.set(key, { ...entry, value, expiresAt });
      if (expiresAt > 0) scheduleExpiryTick();
      return true;
    },
    async increment(key: string, delta?: number | undefined) {
      assertNotStopped();
      const entry = readEntry(key);
      if (!entry) return null;
      const current = Number.parseInt(entry.value, 10);
      if (Number.isNaN(current)) return null;
      const next = current + (delta ?? 1);
      store.set(key, { ...entry, value: String(next) });
      return next;
    },
    async decrement(key: string, delta?: number | undefined) {
      assertNotStopped();
      const entry = readEntry(key);
      if (!entry) return null;
      const current = Number.parseInt(entry.value, 10);
      if (Number.isNaN(current)) return null;
      // Memcached clamps at 0 — never returns negative numbers from decr.
      const next = Math.max(0, current - (delta ?? 1));
      store.set(key, { ...entry, value: String(next) });
      return next;
    },
    async flush() {
      assertNotStopped();
      store.clear();
    },
    async ttl(key: string) {
      assertNotStopped();
      const entry = readEntry(key);
      if (!entry) return -2;
      if (entry.expiresAt === 0) return -1;
      const remainingMs = entry.expiresAt - Date.now();
      return Math.max(0, Math.ceil(remainingMs / 1000));
    },
    async assertTTL(key: string, expected: MemcachedAssertTTLExpected) {
      const observed = await env.ttl(key);
      if (expected.seconds !== undefined && observed !== expected.seconds) {
        throw new Error(
          `assertTTL: key "${key}" expected TTL ${expected.seconds}s, observed ${observed}s`,
        );
      }
      if (expected.atLeast !== undefined && observed < expected.atLeast) {
        throw new Error(
          `assertTTL: key "${key}" expected TTL >= ${expected.atLeast}s, observed ${observed}s`,
        );
      }
      if (expected.atMost !== undefined && observed > expected.atMost) {
        throw new Error(
          `assertTTL: key "${key}" expected TTL <= ${expected.atMost}s, observed ${observed}s`,
        );
      }
      return observed;
    },
    serverFor(key: string): string {
      return ring.serverFor(key);
    },
    listEntries(): MemcachedEntrySnapshot[] {
      const now = Date.now();
      const out: MemcachedEntrySnapshot[] = [];
      for (const entry of store.values()) {
        if (entry.expiresAt > 0 && entry.expiresAt <= now) continue;
        out.push({
          key: entry.key,
          value: entry.value,
          server: entry.server,
          expiresAt: entry.expiresAt,
        });
      }
      return out;
    },
    async stop() {
      stopped = true;
      if (expiryTimer) {
        clearTimeout(expiryTimer);
        expiryTimer = null;
      }
      store.clear();
    },
  };
  return env;
}
