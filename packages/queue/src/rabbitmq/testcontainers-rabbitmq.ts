import type { RabbitMQTestEnv, SetupRabbitMQEnvOptions } from './types.js';
import { createStubRabbitMQEnv } from './stub-rabbitmq.js';

/**
 * Build a testcontainers-backed RabbitMQ env. When
 * `opts.testcontainers?.amqpUrl` is provided the helper connects directly to
 * that URL and verifies responsiveness. Otherwise the helper would spawn a
 * testcontainers RabbitMQ instance — kept out of the v0.3 scope so callers
 * wanting fully-managed containers can opt in later (add the `testcontainers`
 * peer dep + a small container factory).
 *
 * The v0.3 wire path shares the stub simulation for message state (so
 * assertion helpers stay deterministic) while surfacing the `amqpUrl` +
 * `managementUrl` on the env for callers that want to point their own
 * `amqplib` at it.
 */
export async function createTestcontainersRabbitMQEnv(
  opts: SetupRabbitMQEnvOptions,
): Promise<RabbitMQTestEnv<'live'>> {
  const amqpUrl = opts.testcontainers?.amqpUrl;
  if (!amqpUrl) {
    throw new Error(
      'setupRabbitMQEnv: mode="testcontainers" requires testcontainers.amqpUrl (v0.3 scope). Provide the URL of a running RabbitMQ broker, or use mode="stub" for zero-infra tests.',
    );
  }
  const startupTimeoutMs = opts.testcontainers?.startupTimeoutMs ?? 15000;
  await probeAmqpUrl(amqpUrl, startupTimeoutMs);

  const managementUrl = deriveManagementUrl(amqpUrl);
  const inner = createStubRabbitMQEnv(opts);
  const env: RabbitMQTestEnv<'live'> = {
    mode: 'live',
    backend: 'testcontainers',
    amqpUrl,
    managementUrl,

    declareExchange: inner.declareExchange.bind(inner),
    declareQueue: inner.declareQueue.bind(inner),
    bindQueue: inner.bindQueue.bind(inner),
    unbindQueue: inner.unbindQueue.bind(inner),

    publish: inner.publish.bind(inner),
    sendToQueue: inner.sendToQueue.bind(inner),
    peek: inner.peek.bind(inner),
    get: inner.get.bind(inner),
    consume: inner.consume.bind(inner),

    waitForMessage: inner.waitForMessage.bind(inner),
    assertAcknowledged: inner.assertAcknowledged.bind(inner),
    assertRequeued: inner.assertRequeued.bind(inner),
    assertQueueDrained: inner.assertQueueDrained.bind(inner),

    listPublished: inner.listPublished.bind(inner),
    listReturned: inner.listReturned.bind(inner),
    reset: inner.reset.bind(inner),

    stop: async () => {
      await inner.stop();
    },
  };
  return env;
}

/**
 * Ping the RabbitMQ management endpoint (part of the `rabbitmq:3-management`
 * image) — returns 200 when the broker is up. Uses `fetch` with a short
 * per-attempt timeout so the probe fails fast when unreachable.
 */
async function probeAmqpUrl(amqpUrl: string, timeoutMs: number): Promise<void> {
  const managementUrl = deriveManagementUrl(amqpUrl);
  const deadline = Date.now() + timeoutMs;
  const attemptTimeoutMs = 500;
  let lastError: unknown = null;
  while (Date.now() < deadline) {
    const ctrl = new AbortController();
    const abortTimer = setTimeout(() => ctrl.abort(), attemptTimeoutMs);
    try {
      const auth = extractAuth(amqpUrl);
      const headers: Record<string, string> = {};
      if (auth) headers.Authorization = `Basic ${Buffer.from(auth).toString('base64')}`;
      const res = await fetch(`${managementUrl}/api/aliveness-test/%2F`, {
        signal: ctrl.signal,
        headers,
      });
      clearTimeout(abortTimer);
      if (res.ok) return;
      lastError = new Error(`aliveness-test returned HTTP ${res.status}`);
    } catch (err) {
      clearTimeout(abortTimer);
      lastError = err;
    }
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 200);
      if (timer && typeof timer.unref === 'function') timer.unref();
    });
  }
  throw new Error(
    `setupRabbitMQEnv: RabbitMQ broker at ${amqpUrl} did not respond within ${timeoutMs}ms: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

/** Derive `http://host:15672` from an amqp URL. */
function deriveManagementUrl(amqpUrl: string): string {
  try {
    const url = new URL(amqpUrl);
    const host = url.hostname || 'localhost';
    return `http://${host}:15672`;
  } catch {
    return 'http://localhost:15672';
  }
}

/** Extract `user:pass` when embedded in the amqp URL. */
function extractAuth(amqpUrl: string): string | null {
  try {
    const url = new URL(amqpUrl);
    if (url.username) {
      return `${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`;
    }
  } catch {
    // Fall through.
  }
  return null;
}
