import type {
  AssertTTLExpected,
  CacheSubscription,
  CacheTestEnv,
  PubSubMessage,
  SetupCacheEnvOptions,
} from './types.js';

/**
 * Internal representation of a stored key. `expireAt` is an absolute epoch ms
 * value — `undefined` when the key has no expiry.
 */
interface StoredEntry {
  value: string;
  expireAt: number | undefined;
}

interface SubscriberSlot {
  resolvers: Array<(msg: PubSubMessage) => void>;
  history: PubSubMessage[];
  /**
   * How many entries from `history` the consumer has already drained via
   * `next()`. Lets multiple consecutive `next()` calls yield historical
   * messages that arrived before the caller reached `await`.
   */
  cursor: number;
}

/**
 * Build an in-memory (offline, in-process) Redis-shaped cache environment.
 * Suitable for unit tests that need to exercise the get / set / delete / TTL /
 * Pub/Sub loop without spinning up a Redis container.
 */
export function createInMemoryCacheEnv(
  opts: SetupCacheEnvOptions,
): CacheTestEnv<'mock'> {
  const expiryTickMs = opts.inMemory?.expiryTickMs ?? 5;
  const store = new Map<string, StoredEntry>();
  const subscribers = new Map<string, Set<SubscriberSlot>>();
  let subscriptionCount = 0;
  let messageIndex = 0;
  let stopped = false;
  let expiryTimer: ReturnType<typeof setInterval> | null = null;

  function isExpired(entry: StoredEntry): boolean {
    if (entry.expireAt === undefined) return false;
    return entry.expireAt <= Date.now();
  }

  function readActive(key: string): StoredEntry | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (isExpired(entry)) {
      store.delete(key);
      return null;
    }
    return entry;
  }

  function scheduleExpirySweep(): void {
    if (expiryTimer !== null || stopped) return;
    expiryTimer = setInterval(() => {
      for (const [key, entry] of store) {
        if (isExpired(entry)) {
          store.delete(key);
        }
      }
    }, expiryTickMs);
    // Timers keep the Node.js event loop alive by default, which prevents
    // Vitest from exiting cleanly. `unref()` opts the timer out of that.
    if (typeof expiryTimer === 'object' && expiryTimer !== null) {
      (expiryTimer as { unref?: () => void }).unref?.();
    }
  }

  function ensureNotStopped(op: string): void {
    if (stopped) {
      throw new Error(`setupCacheEnv: cannot ${op} after stop()`);
    }
  }

  function deliverPublish(channel: string, message: string): number {
    const slots = subscribers.get(channel);
    if (!slots || slots.size === 0) return 0;
    messageIndex += 1;
    const payload: PubSubMessage = { channel, message, index: messageIndex };
    let delivered = 0;
    for (const slot of slots) {
      slot.history.push(payload);
      const waiter = slot.resolvers.shift();
      if (waiter) waiter(payload);
      delivered += 1;
    }
    return delivered;
  }

  const env: CacheTestEnv<'mock'> = {
    mode: 'mock',
    backend: 'in-memory',
    redisUrl: undefined,
    client: opts.client ?? 'ioredis',
    async get(key) {
      ensureNotStopped('get');
      const entry = readActive(key);
      return entry ? entry.value : null;
    },
    async set(key, value, setOpts) {
      ensureNotStopped('set');
      const ttlSeconds = setOpts?.ttlSeconds;
      if (ttlSeconds !== undefined && ttlSeconds <= 0) {
        throw new Error('set: ttlSeconds must be positive');
      }
      const expireAt =
        ttlSeconds === undefined ? undefined : Date.now() + ttlSeconds * 1000;
      store.set(key, { value, expireAt });
      if (expireAt !== undefined) scheduleExpirySweep();
    },
    async delete(key) {
      ensureNotStopped('delete');
      const existed = readActive(key) !== null;
      store.delete(key);
      return existed ? 1 : 0;
    },
    async expire(key, ttlSeconds) {
      ensureNotStopped('expire');
      if (ttlSeconds <= 0) {
        throw new Error('expire: ttlSeconds must be positive');
      }
      const entry = readActive(key);
      if (!entry) return false;
      entry.expireAt = Date.now() + ttlSeconds * 1000;
      scheduleExpirySweep();
      return true;
    },
    async ttl(key) {
      ensureNotStopped('ttl');
      const entry = readActive(key);
      if (!entry) return -2;
      if (entry.expireAt === undefined) return -1;
      const remainingMs = entry.expireAt - Date.now();
      if (remainingMs <= 0) {
        // Race with the expiry sweep — treat as missing.
        store.delete(key);
        return -2;
      }
      return Math.ceil(remainingMs / 1000);
    },
    async assertTTL(key, expected) {
      const observed = await env.ttl(key);
      return applyTTLExpectation(key, observed, expected);
    },
    async publish(channel, message) {
      ensureNotStopped('publish');
      return deliverPublish(channel, message);
    },
    async subscribe(channel) {
      ensureNotStopped('subscribe');
      subscriptionCount += 1;
      const slot: SubscriberSlot = { resolvers: [], history: [], cursor: 0 };
      let slots = subscribers.get(channel);
      if (!slots) {
        slots = new Set();
        subscribers.set(channel, slots);
      }
      slots.add(slot);
      let closed = false;
      const sub: CacheSubscription = {
        channel,
        received: () => slot.history.slice(),
        async next(nextOpts) {
          if (closed) {
            throw new Error(`subscribe: channel "${channel}" is closed`);
          }
          // Drain any messages that arrived before this next() call.
          if (slot.cursor < slot.history.length) {
            const buffered = slot.history[slot.cursor];
            slot.cursor += 1;
            if (buffered) return buffered;
          }
          const timeoutMs = nextOpts?.timeoutMs ?? 5000;
          return new Promise<PubSubMessage>((resolve, reject) => {
            const timer = setTimeout(() => {
              const idx = slot.resolvers.indexOf(resolveWrapped);
              if (idx >= 0) slot.resolvers.splice(idx, 1);
              reject(
                new Error(
                  `subscribe.next: timeout waiting on channel "${channel}" after ${timeoutMs}ms`,
                ),
              );
            }, timeoutMs);
            (timer as unknown as { unref?: () => void }).unref?.();
            const resolveWrapped = (msg: PubSubMessage): void => {
              clearTimeout(timer);
              slot.cursor += 1;
              resolve(msg);
            };
            slot.resolvers.push(resolveWrapped);
          });
        },
        async close() {
          if (closed) return;
          closed = true;
          const bucket = subscribers.get(channel);
          if (bucket) {
            bucket.delete(slot);
            if (bucket.size === 0) subscribers.delete(channel);
          }
          // Reject any in-flight waiters so the caller's `await` unblocks.
          for (const waiter of slot.resolvers) {
            waiter({ channel, message: '', index: -1 });
          }
          slot.resolvers.length = 0;
        },
      };
      return sub;
    },
    async assertPublished(channel, expected) {
      ensureNotStopped('assertPublished');
      const timeoutMs = expected.timeoutMs ?? 500;
      const bucket = subscribers.get(channel);
      const matcher = matcherFor(expected.match);
      if (bucket) {
        for (const slot of bucket) {
          const hit = slot.history.find((entry) => matcher(entry.message));
          if (hit) return hit;
        }
      }
      // No subscriber matched yet — wait for the next delivery on any slot.
      const deadline = Date.now() + timeoutMs;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const currentBucket = subscribers.get(channel);
        if (currentBucket) {
          for (const slot of currentBucket) {
            const hit = slot.history.find((entry) => matcher(entry.message));
            if (hit) return hit;
          }
        }
        if (Date.now() > deadline) {
          throw new Error(
            `assertPublished: no message on "${channel}" matched ${describeMatch(expected.match)} within ${timeoutMs}ms`,
          );
        }
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, Math.min(20, timeoutMs));
          (timer as unknown as { unref?: () => void }).unref?.();
        });
      }
    },
    async flushAll() {
      ensureNotStopped('flushAll');
      store.clear();
    },
    async stop() {
      if (stopped) return;
      stopped = true;
      if (expiryTimer !== null) {
        clearInterval(expiryTimer);
        expiryTimer = null;
      }
      // Close every outstanding subscription so consumer `await sub.next()`
      // calls fail loudly instead of hanging forever.
      for (const [channel, bucket] of subscribers) {
        for (const slot of bucket) {
          for (const waiter of slot.resolvers) {
            waiter({ channel, message: '', index: -1 });
          }
          slot.resolvers.length = 0;
        }
      }
      subscribers.clear();
      store.clear();
      // Referenced only to keep the local unused-var lint quiet — value is
      // observable through historical `subscribe` calls if a caller stashed
      // the subscription object.
      void subscriptionCount;
    },
  };
  return env;
}

function matcherFor(match: string | RegExp): (message: string) => boolean {
  if (typeof match === 'string') {
    return (msg) => msg === match;
  }
  return (msg) => match.test(msg);
}

function describeMatch(match: string | RegExp): string {
  if (typeof match === 'string') return `"${match}"`;
  return String(match);
}

function applyTTLExpectation(
  key: string,
  observed: number,
  expected: AssertTTLExpected,
): number {
  if (expected.seconds !== undefined) {
    if (observed !== expected.seconds) {
      throw new Error(
        `assertTTL: expected TTL=${expected.seconds}s on "${key}", observed ${observed}`,
      );
    }
    return observed;
  }
  if (expected.atLeast !== undefined && observed < expected.atLeast) {
    throw new Error(
      `assertTTL: expected TTL>=${expected.atLeast}s on "${key}", observed ${observed}`,
    );
  }
  if (expected.atMost !== undefined && observed > expected.atMost) {
    throw new Error(
      `assertTTL: expected TTL<=${expected.atMost}s on "${key}", observed ${observed}`,
    );
  }
  if (
    expected.seconds === undefined &&
    expected.atLeast === undefined &&
    expected.atMost === undefined
  ) {
    throw new Error(
      'assertTTL: at least one of { seconds, atLeast, atMost } must be provided',
    );
  }
  return observed;
}
