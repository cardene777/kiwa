import type {
  KeyDBAssertTTLExpected,
  KeyDBEntrySnapshot,
  KeyDBPubSubMessage,
  KeyDBSubscription,
  KeyDBTestEnv,
  SetupKeyDBEnvOptions,
} from './types.js';

interface StubEntry {
  key: string;
  value: string;
  /** Absolute expiry epoch ms; 0 = no expiry. */
  expiresAt: number;
}

interface SubscriberSlot {
  resolvers: Array<(msg: KeyDBPubSubMessage) => void>;
  history: KeyDBPubSubMessage[];
  cursor: number;
}

/**
 * Build an in-process stub of KeyDB covering the Redis-compatible surface
 * (get / set / delete / TTL / Pub/Sub) plus KeyDB-specific multi-master
 * replication — writes on one master replicate to every other master after
 * an optional simulated lag.
 */
export function createStubKeyDBEnv(
  opts: SetupKeyDBEnvOptions,
): KeyDBTestEnv<'mock'> {
  const cluster = opts.cluster ?? ['stub-master-0'];
  const replicationLagMs = opts.stub?.replicationLagMs ?? 0;
  const expiryTickMs = opts.stub?.expiryTickMs ?? 5;
  // Each master owns its own store so multi-master tests can observe
  // replication timing.
  const stores = new Map<string, Map<string, StubEntry>>();
  for (const master of cluster) stores.set(master, new Map());
  const subscribers = new Map<string, Set<SubscriberSlot>>();
  let messageIndex = 0;
  let stopped = false;
  let expiryTimer: ReturnType<typeof setTimeout> | null = null;

  function assertNotStopped(): void {
    if (stopped) throw new Error('setupKeyDBEnv: cannot use env after stop()');
  }

  function selectMaster(preferred?: string | undefined): string {
    if (preferred !== undefined) {
      if (!stores.has(preferred)) {
        throw new Error(
          `KeyDBEnv: master "${preferred}" is not part of the cluster (known: ${JSON.stringify(cluster)})`,
        );
      }
      return preferred;
    }
    if (cluster.length === 0) {
      throw new Error(
        'KeyDBEnv: cluster has no masters — cannot resolve a target master',
      );
    }
    return cluster[0]!;
  }

  function replicateWrite(originator: string, key: string, entry: StubEntry): void {
    // Write to originator immediately.
    stores.get(originator)!.set(key, { ...entry });
    // Replicate to other masters.
    const replicate = () => {
      for (const master of cluster) {
        if (master === originator) continue;
        stores.get(master)!.set(key, { ...entry });
      }
      if (entry.expiresAt > 0) scheduleExpiryTick();
    };
    if (replicationLagMs === 0) {
      replicate();
      return;
    }
    const timer = setTimeout(() => {
      if (!stopped) replicate();
    }, replicationLagMs);
    (timer as unknown as { unref?: () => void }).unref?.();
  }

  function replicateDelete(originator: string, key: string): void {
    stores.get(originator)!.delete(key);
    const replicate = () => {
      for (const master of cluster) {
        if (master === originator) continue;
        stores.get(master)!.delete(key);
      }
    };
    if (replicationLagMs === 0) {
      replicate();
      return;
    }
    const timer = setTimeout(() => {
      if (!stopped) replicate();
    }, replicationLagMs);
    (timer as unknown as { unref?: () => void }).unref?.();
  }

  function scheduleExpiryTick(): void {
    if (stopped || expiryTimer !== null) return;
    expiryTimer = setTimeout(() => {
      expiryTimer = null;
      const now = Date.now();
      let anyKeys = false;
      for (const store of stores.values()) {
        for (const [key, entry] of store) {
          if (entry.expiresAt > 0 && entry.expiresAt <= now) store.delete(key);
        }
        if (store.size > 0) anyKeys = true;
      }
      if (anyKeys) scheduleExpiryTick();
    }, expiryTickMs);
    (expiryTimer as unknown as { unref?: () => void }).unref?.();
  }

  function readEntry(master: string, key: string): StubEntry | null {
    const store = stores.get(master);
    if (!store) return null;
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt > 0 && entry.expiresAt <= Date.now()) {
      store.delete(key);
      return null;
    }
    return entry;
  }

  const env: KeyDBTestEnv<'mock'> = {
    mode: 'mock',
    backend: 'stub',
    keydbUrl: undefined,
    client: opts.client ?? 'ioredis',
    cluster,
    async get(key: string, options) {
      assertNotStopped();
      const master = selectMaster(options?.master);
      const entry = readEntry(master, key);
      return entry?.value ?? null;
    },
    async set(key: string, value: string, options) {
      assertNotStopped();
      if (options?.ttlSeconds !== undefined && options.ttlSeconds <= 0) {
        throw new Error('set: ttlSeconds must be > 0 (omit for no expiry)');
      }
      const expiresAt =
        options?.ttlSeconds !== undefined ? Date.now() + options.ttlSeconds * 1000 : 0;
      const master = selectMaster(options?.master);
      replicateWrite(master, key, { key, value, expiresAt });
    },
    async delete(key: string) {
      assertNotStopped();
      const master = selectMaster();
      const existed = readEntry(master, key) !== null;
      replicateDelete(master, key);
      return existed ? 1 : 0;
    },
    async expire(key: string, ttlSeconds: number) {
      assertNotStopped();
      if (ttlSeconds <= 0) throw new Error('expire: ttlSeconds must be > 0');
      const master = selectMaster();
      const entry = readEntry(master, key);
      if (!entry) return false;
      const expiresAt = Date.now() + ttlSeconds * 1000;
      replicateWrite(master, key, { ...entry, expiresAt });
      return true;
    },
    async ttl(key: string) {
      assertNotStopped();
      const master = selectMaster();
      const entry = readEntry(master, key);
      if (!entry) return -2;
      if (entry.expiresAt === 0) return -1;
      const remainingMs = entry.expiresAt - Date.now();
      return Math.max(0, Math.ceil(remainingMs / 1000));
    },
    async assertTTL(key: string, expected: KeyDBAssertTTLExpected) {
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
    async publish(channel: string, message: string, options) {
      assertNotStopped();
      const master = selectMaster(options?.master);
      messageIndex += 1;
      const msg: KeyDBPubSubMessage = {
        channel,
        message,
        index: messageIndex,
        master,
      };
      const subs = subscribers.get(channel);
      if (!subs || subs.size === 0) return 0;
      let delivered = 0;
      for (const slot of subs) {
        slot.history.push(msg);
        const pending = slot.resolvers.shift();
        if (pending) pending(msg);
        delivered += 1;
      }
      return delivered;
    },
    async subscribe(channel: string) {
      assertNotStopped();
      const slot: SubscriberSlot = { resolvers: [], history: [], cursor: 0 };
      const slots = subscribers.get(channel) ?? new Set<SubscriberSlot>();
      slots.add(slot);
      subscribers.set(channel, slots);
      const subscription: KeyDBSubscription = {
        channel,
        received() {
          return [...slot.history];
        },
        async next(nextOpts) {
          if (slot.cursor < slot.history.length) {
            const msg = slot.history[slot.cursor]!;
            slot.cursor += 1;
            return msg;
          }
          const timeoutMs = nextOpts?.timeoutMs ?? 5000;
          return new Promise<KeyDBPubSubMessage>((resolve, reject) => {
            let done = false;
            const timer = setTimeout(() => {
              if (done) return;
              done = true;
              reject(
                new Error(
                  `KeyDBSubscription.next: timeout waiting for message on "${channel}" after ${timeoutMs}ms`,
                ),
              );
            }, timeoutMs);
            (timer as unknown as { unref?: () => void }).unref?.();
            slot.resolvers.push((msg) => {
              if (done) return;
              done = true;
              clearTimeout(timer);
              slot.cursor = slot.history.length;
              resolve(msg);
            });
          });
        },
        async close() {
          slots.delete(slot);
          if (slots.size === 0) subscribers.delete(channel);
        },
      };
      return subscription;
    },
    async assertPublished(channel: string, expected) {
      const timeoutMs = expected.timeoutMs ?? 5000;
      const sub = await env.subscribe(channel);
      try {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
          const remaining = deadline - Date.now();
          try {
            const msg = await sub.next({ timeoutMs: remaining });
            if (matches(msg.message, expected.match)) return msg;
          } catch {
            break;
          }
        }
        throw new Error(
          `assertPublished: no message on "${channel}" matched ${String(expected.match)} within ${timeoutMs}ms`,
        );
      } finally {
        await sub.close();
      }
    },
    async flushAll() {
      assertNotStopped();
      for (const store of stores.values()) store.clear();
    },
    listEntries() {
      const now = Date.now();
      const out: KeyDBEntrySnapshot[] = [];
      for (const [master, store] of stores) {
        for (const entry of store.values()) {
          if (entry.expiresAt > 0 && entry.expiresAt <= now) continue;
          out.push({
            key: entry.key,
            value: entry.value,
            master,
            expiresAt: entry.expiresAt,
          });
        }
      }
      return out;
    },
    async stop() {
      stopped = true;
      if (expiryTimer) {
        clearTimeout(expiryTimer);
        expiryTimer = null;
      }
      for (const store of stores.values()) store.clear();
      subscribers.clear();
    },
  };

  return env;
}

function matches(payload: string, expected: string | RegExp): boolean {
  if (typeof expected === 'string') return payload === expected;
  return expected.test(payload);
}
