import type {
  AssertTTLExpected,
  CacheSubscription,
  CacheTestEnv,
  PubSubMessage,
  SetupCacheEnvOptions,
} from './types.js';

/**
 * Minimal duck-typed shape for the `ioredis` client — the only ops the fixture
 * needs. Kept as an interface so we can `await import('ioredis')` at runtime
 * and satisfy the peerDependency contract without pulling ioredis into the
 * build graph.
 */
interface IoRedisModule {
  default: new (
    url: string,
    opts?: { maxRetriesPerRequest?: number | null },
  ) => IoRedisClient;
}

interface IoRedisClient {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<'OK'>;
  setex: (key: string, seconds: number, value: string) => Promise<'OK'>;
  del: (...keys: string[]) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
  ttl: (key: string) => Promise<number>;
  publish: (channel: string, message: string) => Promise<number>;
  subscribe: (channel: string) => Promise<unknown>;
  unsubscribe: (channel: string) => Promise<unknown>;
  on: (event: 'message', handler: (channel: string, message: string) => void) => void;
  off: (event: 'message', handler: (channel: string, message: string) => void) => void;
  flushdb: () => Promise<'OK'>;
  quit: () => Promise<unknown>;
  disconnect: () => void;
}

/**
 * Minimal duck-typed shape for the `redis` (node-redis v4) client.
 */
interface NodeRedisModule {
  createClient: (opts: { url: string }) => NodeRedisClient;
}

interface NodeRedisClient {
  connect: () => Promise<void>;
  get: (key: string) => Promise<string | null>;
  set: (
    key: string,
    value: string,
    opts?: { EX?: number },
  ) => Promise<string | null>;
  del: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<boolean | number>;
  ttl: (key: string) => Promise<number>;
  publish: (channel: string, message: string) => Promise<number>;
  subscribe: (
    channel: string,
    handler: (message: string, channel: string) => void,
  ) => Promise<void>;
  unsubscribe: (channel: string) => Promise<void>;
  duplicate: () => NodeRedisClient;
  flushDb: () => Promise<string>;
  quit: () => Promise<string>;
  disconnect: () => Promise<void>;
}

type RedisContainer = {
  start: () => Promise<{
    stop: () => Promise<void>;
    getHost: () => string;
    getMappedPort: (port: number) => number;
  }>;
  withExposedPorts: (port: number) => RedisContainer;
};

async function startRedisContainer(image: string): Promise<{
  url: string;
  stop: () => Promise<void>;
}> {
  let container: RedisContainer;
  try {
    const testcontainers = (await import('testcontainers')) as unknown as {
      GenericContainer: new (image: string) => RedisContainer;
    };
    container = new testcontainers.GenericContainer(image).withExposedPorts(6379);
  } catch (caught) {
    throw new Error(
      "@kiwa-lab/cache: testcontainers mode requires the 'testcontainers' peer dependency. Install with `pnpm add -D testcontainers`. Original error: " +
        (caught instanceof Error ? caught.message : String(caught)),
    );
  }
  const started = await container.start();
  const url = `redis://${started.getHost()}:${started.getMappedPort(6379)}`;
  return {
    url,
    stop: async () => {
      await started.stop();
    },
  };
}

/**
 * Common driver interface implemented by the ioredis + node-redis backends.
 * The env exposes the same public shape regardless of client selection; this
 * abstraction lets each backend pick its own connection pattern (single vs
 * duplicated for Pub/Sub) without leaking through to callers.
 */
interface CacheDriver {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttlSeconds: number | undefined) => Promise<void>;
  delete: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<boolean>;
  ttl: (key: string) => Promise<number>;
  publish: (channel: string, message: string) => Promise<number>;
  subscribe: (
    channel: string,
    onMessage: (message: string) => void,
  ) => Promise<() => Promise<void>>;
  flushAll: () => Promise<void>;
  stop: () => Promise<void>;
}

async function buildIoRedisDriver(url: string): Promise<CacheDriver> {
  let ioredis: IoRedisModule;
  try {
    ioredis = (await import('ioredis')) as unknown as IoRedisModule;
  } catch (caught) {
    throw new Error(
      "@kiwa-lab/cache: testcontainers + client='ioredis' requires the 'ioredis' peer dependency. Install with `pnpm add -D ioredis`. Original error: " +
        (caught instanceof Error ? caught.message : String(caught)),
    );
  }
  const RedisCtor = ioredis.default;
  const primary = new RedisCtor(url, { maxRetriesPerRequest: null });
  // ioredis requires a dedicated connection for subscribe mode — attempting to
  // publish or issue commands on a subscribed client throws server-side.
  const subConnections = new Map<string, IoRedisClient>();

  return {
    async get(key) {
      return primary.get(key);
    },
    async set(key, value, ttlSeconds) {
      if (ttlSeconds === undefined) {
        await primary.set(key, value);
      } else {
        await primary.setex(key, ttlSeconds, value);
      }
    },
    async delete(key) {
      return primary.del(key);
    },
    async expire(key, seconds) {
      const result = await primary.expire(key, seconds);
      return result === 1;
    },
    async ttl(key) {
      return primary.ttl(key);
    },
    async publish(channel, message) {
      return primary.publish(channel, message);
    },
    async subscribe(channel, onMessage) {
      const sub = new RedisCtor(url, { maxRetriesPerRequest: null });
      const handler = (deliveredChannel: string, deliveredMessage: string): void => {
        if (deliveredChannel !== channel) return;
        onMessage(deliveredMessage);
      };
      sub.on('message', handler);
      await sub.subscribe(channel);
      subConnections.set(channel, sub);
      return async () => {
        try {
          await sub.unsubscribe(channel);
        } finally {
          sub.off('message', handler);
          await sub.quit().catch(() => sub.disconnect());
          subConnections.delete(channel);
        }
      };
    },
    async flushAll() {
      await primary.flushdb();
    },
    async stop() {
      for (const [, sub] of subConnections) {
        await sub.quit().catch(() => sub.disconnect());
      }
      subConnections.clear();
      await primary.quit().catch(() => primary.disconnect());
    },
  };
}

async function buildNodeRedisDriver(url: string): Promise<CacheDriver> {
  let redis: NodeRedisModule;
  try {
    redis = (await import('redis')) as unknown as NodeRedisModule;
  } catch (caught) {
    throw new Error(
      "@kiwa-lab/cache: testcontainers + client='node-redis' requires the 'redis' peer dependency. Install with `pnpm add -D redis`. Original error: " +
        (caught instanceof Error ? caught.message : String(caught)),
    );
  }
  const primary = redis.createClient({ url });
  await primary.connect();
  const subConnections = new Map<string, NodeRedisClient>();

  return {
    async get(key) {
      return primary.get(key);
    },
    async set(key, value, ttlSeconds) {
      if (ttlSeconds === undefined) {
        await primary.set(key, value);
      } else {
        await primary.set(key, value, { EX: ttlSeconds });
      }
    },
    async delete(key) {
      return primary.del(key);
    },
    async expire(key, seconds) {
      const result = await primary.expire(key, seconds);
      return result === true || result === 1;
    },
    async ttl(key) {
      return primary.ttl(key);
    },
    async publish(channel, message) {
      return primary.publish(channel, message);
    },
    async subscribe(channel, onMessage) {
      const sub = primary.duplicate();
      await sub.connect();
      await sub.subscribe(channel, (message, deliveredChannel) => {
        if (deliveredChannel !== channel) return;
        onMessage(message);
      });
      subConnections.set(channel, sub);
      return async () => {
        try {
          await sub.unsubscribe(channel);
        } finally {
          await sub.quit().catch(() => sub.disconnect());
          subConnections.delete(channel);
        }
      };
    },
    async flushAll() {
      await primary.flushDb();
    },
    async stop() {
      for (const [, sub] of subConnections) {
        await sub.quit().catch(() => sub.disconnect());
      }
      subConnections.clear();
      await primary.quit().catch(() => primary.disconnect());
    },
  };
}

/**
 * Build a testcontainers-backed Redis cache environment. Requires Docker; the
 * chosen real client (`ioredis` or `redis`) does the heavy lifting so semantic
 * drift from prod is limited to whatever that client abstracts.
 */
export async function createTestcontainersCacheEnv(
  opts: SetupCacheEnvOptions,
): Promise<CacheTestEnv<'live'>> {
  let containerStop: (() => Promise<void>) | null = null;
  let redisUrl: string;
  if (opts.redis?.url) {
    redisUrl = opts.redis.url;
  } else {
    const image = opts.redis?.image ?? 'redis:7-alpine';
    const container = await startRedisContainer(image);
    redisUrl = container.url;
    containerStop = container.stop;
  }

  const client = opts.client ?? 'ioredis';
  const driver =
    client === 'node-redis'
      ? await buildNodeRedisDriver(redisUrl)
      : await buildIoRedisDriver(redisUrl);

  const subscriptions = new Set<{ close: () => Promise<void> }>();
  const capturedMessages = new Map<string, PubSubMessage[]>();
  let messageIndex = 0;

  function captureForAssertion(channel: string, message: string): PubSubMessage {
    messageIndex += 1;
    const payload: PubSubMessage = { channel, message, index: messageIndex };
    let bucket = capturedMessages.get(channel);
    if (!bucket) {
      bucket = [];
      capturedMessages.set(channel, bucket);
    }
    bucket.push(payload);
    return payload;
  }

  let stopped = false;
  function ensureNotStopped(op: string): void {
    if (stopped) {
      throw new Error(`setupCacheEnv: cannot ${op} after stop()`);
    }
  }

  const env: CacheTestEnv<'live'> = {
    mode: 'live',
    backend: 'testcontainers',
    redisUrl,
    client,
    async get(key) {
      ensureNotStopped('get');
      return driver.get(key);
    },
    async set(key, value, setOpts) {
      ensureNotStopped('set');
      const ttlSeconds = setOpts?.ttlSeconds;
      if (ttlSeconds !== undefined && ttlSeconds <= 0) {
        throw new Error('set: ttlSeconds must be positive');
      }
      await driver.set(key, value, ttlSeconds);
    },
    async delete(key) {
      ensureNotStopped('delete');
      return driver.delete(key);
    },
    async expire(key, ttlSeconds) {
      ensureNotStopped('expire');
      if (ttlSeconds <= 0) {
        throw new Error('expire: ttlSeconds must be positive');
      }
      return driver.expire(key, ttlSeconds);
    },
    async ttl(key) {
      ensureNotStopped('ttl');
      return driver.ttl(key);
    },
    async assertTTL(key, expected) {
      const observed = await env.ttl(key);
      return applyTTLExpectation(key, observed, expected);
    },
    async publish(channel, message) {
      ensureNotStopped('publish');
      return driver.publish(channel, message);
    },
    async subscribe(channel) {
      ensureNotStopped('subscribe');
      const history: PubSubMessage[] = [];
      const waiters: Array<(msg: PubSubMessage) => void> = [];
      let closed = false;
      const stop = await driver.subscribe(channel, (message) => {
        const payload = captureForAssertion(channel, message);
        history.push(payload);
        const waiter = waiters.shift();
        if (waiter) waiter(payload);
      });
      const sub: CacheSubscription = {
        channel,
        received: () => history.slice(),
        async next(nextOpts) {
          if (closed) {
            throw new Error(`subscribe: channel "${channel}" is closed`);
          }
          const timeoutMs = nextOpts?.timeoutMs ?? 5000;
          return new Promise<PubSubMessage>((resolve, reject) => {
            const timer = setTimeout(() => {
              const idx = waiters.indexOf(resolveWrapped);
              if (idx >= 0) waiters.splice(idx, 1);
              reject(
                new Error(
                  `subscribe.next: timeout waiting on channel "${channel}" after ${timeoutMs}ms`,
                ),
              );
            }, timeoutMs);
            (timer as unknown as { unref?: () => void }).unref?.();
            const resolveWrapped = (msg: PubSubMessage): void => {
              clearTimeout(timer);
              resolve(msg);
            };
            waiters.push(resolveWrapped);
          });
        },
        async close() {
          if (closed) return;
          closed = true;
          for (const waiter of waiters) {
            waiter({ channel, message: '', index: -1 });
          }
          waiters.length = 0;
          await stop();
          subscriptions.delete(sub);
        },
      };
      subscriptions.add(sub);
      return sub;
    },
    async assertPublished(channel, expected) {
      ensureNotStopped('assertPublished');
      const timeoutMs = expected.timeoutMs ?? 1000;
      const matcher = matcherFor(expected.match);
      const bucket = capturedMessages.get(channel) ?? [];
      const already = bucket.find((entry) => matcher(entry.message));
      if (already) return already;
      const deadline = Date.now() + timeoutMs;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const current = capturedMessages.get(channel) ?? [];
        const hit = current.find((entry) => matcher(entry.message));
        if (hit) return hit;
        if (Date.now() > deadline) {
          throw new Error(
            `assertPublished: no message on "${channel}" matched ${describeMatch(expected.match)} within ${timeoutMs}ms`,
          );
        }
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, Math.min(30, timeoutMs));
          (timer as unknown as { unref?: () => void }).unref?.();
        });
      }
    },
    async flushAll() {
      ensureNotStopped('flushAll');
      await driver.flushAll();
    },
    async stop() {
      if (stopped) return;
      stopped = true;
      for (const sub of subscriptions) {
        await sub.close().catch(() => {});
      }
      subscriptions.clear();
      capturedMessages.clear();
      await driver.stop();
      if (containerStop) {
        await containerStop();
        containerStop = null;
      }
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
